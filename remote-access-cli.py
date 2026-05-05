#!/usr/bin/env python3
"""
OpenCode Remote Access CLI — Menu-driven manager for WireGuard,
OpenCode service, Caddy, and QR-code provisioning.

Config directory: ~/.config/opencode/remote-access/
"""

import os
import subprocess
import shutil
import sys
from datetime import datetime
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
CONFIG_DIR = Path(os.path.expanduser("~/.config/opencode/remote-access"))
PHONE_CONF = CONFIG_DIR / "phone.conf"
LAPTOP_CONF = CONFIG_DIR / "laptop.conf"
QR_PHONE = CONFIG_DIR / "qr-phone.png"
QR_LAPTOP = CONFIG_DIR / "qr-laptop.png"
KEYS_FILE = CONFIG_DIR / "keys.txt"
WG0_CONF = Path("/etc/wireguard/wg0.conf")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def clear():
    os.system("clear" if os.name != "nt" else "cls")


def banner(title: str):
    width = 60
    print()
    print("╔" + "═" * (width - 2) + "╗")
    print(f"║  {title}".ljust(width - 1) + "║")
    print("╚" + "═" * (width - 2) + "╝")
    print()


def header(text: str):
    print(f"  {'─' * 56}")
    print(f"  {text}")
    print(f"  {'─' * 56}")


def run_cmd(cmd: str, shell: bool = True) -> tuple[int, str, str]:
    """Run a shell command, return (returncode, stdout, stderr)."""
    try:
        result = subprocess.run(
            cmd, shell=shell, capture_output=True, text=True, timeout=15
        )
        return result.returncode, result.stdout.strip(), result.stderr.strip()
    except subprocess.TimeoutExpired:
        return -1, "", "[timeout]"
    except FileNotFoundError:
        return -1, "", f"[command not found: {cmd.split()[0]}]"
    except Exception as exc:
        return -1, "", f"[error: {exc}]"


def print_cmd_output(label: str, rc: int, stdout: str, stderr: str):
    print(f"\n  [{label}]")
    if rc == 0 and stdout:
        for line in stdout.splitlines():
            print(f"    {line}")
    elif stderr:
        for line in stderr.splitlines():
            print(f"    ⚠ {line}")
    else:
        print("    (no output)")


def service_active(unit: str, user: bool = False) -> bool:
    flag = "--user" if user else ""
    rc, out, _ = run_cmd(f"systemctl {flag} is-active {unit}")
    return rc == 0 and out.strip() == "active"


def show_qr(png_path: Path):
    """Display a QR-code PNG in the terminal via qrencode."""
    if not png_path.exists():
        print(f"\n  ❌ QR image not found: {png_path}")
        print("    Generate QR codes first (option 9).")
        return
    rc, out, err = run_cmd(f"qrencode -t ANSIUTF8 -r '{png_path}'")
    if rc == 0 and out:
        print()
        print(out)
    else:
        print(f"\n  ❌ Failed to render QR code.")
        if err:
            print(f"    {err}")
        print("    Install qrencode: sudo apt install qrencode")


def regen_keys_and_qr():
    """
    Generate fresh WireGuard key pairs for phone and laptop,
    rewrite their .conf files, update wg0.conf peers, and
    regenerate QR-code PNGs.
    """
    if not shutil.which("wg"):
        print("\n  ❌ 'wg' not found. Install wireguard-tools first.")
        return

    # Read current server public key from existing config
    server_pub = _extract_peer_public_key(PHONE_CONF)
    if not server_pub:
        print("\n  ❌ Could not read server PublicKey from existing config.")
        return

    endpoint = _extract_endpoint(PHONE_CONF)
    if not endpoint:
        endpoint = "191.0.98.191:51820"  # fallback

    devices = [
        ("phone", "10.0.0.2/32", PHONE_CONF, QR_PHONE),
        ("laptop", "10.0.0.3/32", LAPTOP_CONF, QR_LAPTOP),
    ]

    new_keys: list[dict] = []

    for role, addr, conf_path, qr_path in devices:
        # Generate key pair
        rc_priv, priv, _ = run_cmd("wg genkey")
        if rc_priv != 0:
            print(f"\n  ❌ Failed to generate private key for {role}.")
            return
        rc_pub, pub, _ = run_cmd(f"echo '{priv}' | wg pubkey")
        if rc_pub != 0:
            print(f"\n  ❌ Failed to derive public key for {role}.")
            return

        # Write client .conf
        conf_content = f"""\
[Interface]
PrivateKey = {priv}
Address = {addr}
DNS = 1.1.1.1

[Peer]
PublicKey = {server_pub}
AllowedIPs = 0.0.0.0/0
Endpoint = {endpoint}
PersistentKeepalive = 25
"""
        conf_path.write_text(conf_content)
        print(f"  ✅ {role}.conf written  →  {conf_path}")

        # Generate QR PNG
        rc_qr, _, qr_err = run_cmd(
            f"qrencode -t PNG -o '{qr_path}' < '{conf_path}'"
        )
        if rc_qr == 0:
            print(f"  ✅ {qr_path.name} generated")
        else:
            print(f"  ⚠ QR PNG failed for {role}: {qr_err}")

        new_keys.append({"role": role, "pub": pub, "priv": priv, "file": conf_path.name})

    # Update keys.txt
    _update_keys_file(new_keys, server_pub)

    # Update wg0.conf peers
    _update_wg0_peers(new_keys)

    # Restart WireGuard if active
    rc, _, _ = run_cmd("sudo wg show wg0")
    if rc == 0:
        print("\n  🔄 Restarting wg0 to apply new peer keys...")
        run_cmd("sudo wg-quick down wg0")
        run_cmd("sudo wg-quick up wg0")
        print("  ✅ wg0 restarted")

    print("\n  🎉 All keys and QR codes regenerated successfully.")


def _extract_peer_public_key(conf_path: Path) -> str | None:
    if not conf_path.exists():
        return None
    for line in conf_path.read_text().splitlines():
        if line.startswith("PublicKey"):
            return line.split("=", 1)[1].strip()
    return None


def _extract_endpoint(conf_path: Path) -> str | None:
    if not conf_path.exists():
        return None
    for line in conf_path.read_text().splitlines():
        if line.startswith("Endpoint"):
            return line.split("=", 1)[1].strip()
    return None


def _update_keys_file(new_keys: list[dict], server_pub: str):
    now = datetime.now().strftime("%Y-%m-%d")
    lines = [
        "# WireGuard Key Registry",
        f"# Generated: {now}",
        f"# Updated: {now} — fresh client key pairs generated",
        "# Format: ROLE: <label> | PUB: <key> | FILE: <path>",
        "",
        f"ROLE: server | PUB: {server_pub} | FILE: /etc/wireguard/server_public.key",
        "",
    ]
    for k in new_keys:
        lines.append(
            f"ROLE: {k['role']}  | PUB: {k['pub']}  | PRIV: {k['priv']}  | FILE: {k['file']}"
        )
    lines.append("")
    KEYS_FILE.write_text("\n".join(lines))
    print(f"  ✅ keys.txt updated")


def _update_wg0_peers(new_keys: list[dict]):
    if not WG0_CONF.exists():
        print(f"\n  ⚠ wg0.conf not found at {WG0_CONF} — skipping peer update.")
        print("    Manually update /etc/wireguard/wg0.conf with the new public keys.")
        return

    content = WG0_CONF.read_text()
    for k in new_keys:
        # Find the [Peer] block that has the old PublicKey for this role
        # We match by AllowedIPs which is unique per client
        if k["role"] == "phone":
            allowed_ips = "10.0.0.2/32"
        else:
            allowed_ips = "10.0.0.3/32"

        # Simple replacement: find PublicKey line before the matching AllowedIPs
        import re
        # Match PublicKey = <old> ... AllowedIPs = <target>
        pattern = rf"(PublicKey\s*=\s*)[^\n]+(\n\s*AllowedIPs\s*=\s*{re.escape(allowed_ips)})"
        new_content = re.sub(pattern, rf"\g<1>{k['pub']}\2", content)
        if new_content != content:
            content = new_content
            print(f"  ✅ wg0.conf peer PublicKey updated for {k['role']}")
        else:
            print(f"  ⚠ Could not find peer block for {k['role']} ({allowed_ips}) in wg0.conf")

    WG0_CONF.write_text(content)


# ---------------------------------------------------------------------------
# Menu actions
# ---------------------------------------------------------------------------

def action_status():
    header("📊 Service Status")

    # WireGuard interface
    rc, out, err = run_cmd("sudo wg show wg0")
    if rc == 0:
        print("\n  ✅ WireGuard (wg0) — RUNNING")
        for line in out.splitlines():
            print(f"    {line}")
    else:
        print("\n  ❌ WireGuard (wg0) — NOT RUNNING or not configured")
        if err:
            print(f"    {err}")

    # OpenCode service
    if service_active("opencode-remote", user=True):
        print("\n  ✅ OpenCode (opencode-remote) — ACTIVE")
    else:
        print("\n  ❌ OpenCode (opencode-remote) — INACTIVE or not installed")

    # Caddy service
    if service_active("caddy-remote", user=True):
        print("\n  ✅ Caddy (caddy-remote) — ACTIVE")
    else:
        print("\n  ❌ Caddy (caddy-remote) — INACTIVE or not installed")

    print()


def action_qr_phone():
    header("📱 QR Code — Phone")
    show_qr(QR_PHONE)


def action_qr_laptop():
    header("💻 QR Code — Laptop")
    show_qr(QR_LAPTOP)


def action_start_vpn():
    header("🚀 Starting WireGuard VPN")
    if not WG0_CONF.exists():
        print("\n  ❌ /etc/wireguard/wg0.conf not found.")
        print("    Configure WireGuard first before starting.")
        return
    rc, out, err = run_cmd("sudo wg-quick up wg0")
    if rc == 0:
        print("\n  ✅ VPN started successfully.")
    else:
        print(f"\n  ❌ Failed to start VPN.")
        if err:
            print(f"    {err}")


def action_stop_vpn():
    header("🛑 Stopping WireGuard VPN")
    rc, out, err = run_cmd("sudo wg show wg0")
    if rc != 0:
        print("\n  ℹ️  VPN is not running.")
        return
    rc, out, err = run_cmd("sudo wg-quick down wg0")
    if rc == 0:
        print("\n  ✅ VPN stopped.")
    else:
        print(f"\n  ❌ Failed to stop VPN.")
        if err:
            print(f"    {err}")


def action_restart_opencode():
    header("🔄 Restarting OpenCode")
    rc, out, err = run_cmd("systemctl --user restart opencode-remote")
    if rc == 0:
        print("\n  ✅ OpenCode restarted.")
    else:
        print(f"\n  ❌ Failed to restart OpenCode.")
        if err:
            print(f"    {err}")


def action_logs_opencode():
    header("📋 OpenCode Logs (last 50 lines)")
    rc, out, err = run_cmd(
        "journalctl --user -u opencode-remote -n 50 --no-pager"
    )
    if rc == 0 and out:
        print()
        for line in out.splitlines():
            print(f"    {line}")
    else:
        print("\n  ⚠ No logs available or service not configured.")
        if err:
            print(f"    {err}")
    print()


def action_restart_caddy():
    header("🔄 Restarting Caddy")
    rc, out, err = run_cmd("systemctl --user restart caddy-remote")
    if rc == 0:
        print("\n  ✅ Caddy restarted.")
    else:
        print(f"\n  ❌ Failed to restart Caddy.")
        if err:
            print(f"    {err}")


def action_regenerate():
    header("🔑 Regenerate Keys & QR Codes")
    print("  This will:")
    print("    • Generate new WireGuard key pairs for phone & laptop")
    print("    • Rewrite phone.conf and laptop.conf")
    print("    • Update wg0.conf peer public keys")
    print("    • Regenerate QR code PNGs")
    print()
    confirm = input("  Continue? [y/N] ").strip().lower()
    if confirm in ("y", "yes"):
        regen_keys_and_qr()
    else:
        print("  Cancelled.")


# ---------------------------------------------------------------------------
# Main menu loop
# ---------------------------------------------------------------------------

MENU_ITEMS = [
    ("Ver status", action_status),
    ("Mostrar QR Code (Telefone)", action_qr_phone),
    ("Mostrar QR Code (Laptop)", action_qr_laptop),
    ("Iniciar VPN", action_start_vpn),
    ("Parar VPN", action_stop_vpn),
    ("Reiniciar OpenCode", action_restart_opencode),
    ("Ver logs OpenCode", action_logs_opencode),
    ("Reiniciar Caddy", action_restart_caddy),
    ("Gerar novos QR codes", action_regenerate),
]


def print_menu():
    banner("OpenCode Remote Access CLI")
    for idx, (label, _) in enumerate(MENU_ITEMS, start=1):
        print(f"  {idx:>2}. {label}")
    print()
    exit_label = "  0. Sair"
    print(exit_label)
    print()


def main():
    while True:
        clear()
        print_menu()
        choice = input("  Escolha uma opção: ").strip()

        if choice == "0":
            print("\n  👋 Saindo. Até logo!\n")
            break

        try:
            idx = int(choice) - 1
            if 0 <= idx < len(MENU_ITEMS):
                _, action = MENU_ITEMS[idx]
                clear()
                action()
                input("\n  Pressione Enter para continuar...")
            else:
                print("\n  ⚠ Opção inválida. Tente novamente.")
                input("  Pressione Enter para continuar...")
        except ValueError:
            print("\n  ⚠ Entrada inválida. Digite um número.")
            input("  Pressione Enter para continuar...")


if __name__ == "__main__":
    main()
