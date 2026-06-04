# OpenCode Harness

**Vision:** Evolve OpenCode from prompt-driven governance into a deterministic, auditable runtime harness with enforced verification, guardrails, and orchestration.
**For:** OpenCode operators and agent workflows
**Solves:** Current setup relies too much on prompt discipline — verification is not enforced, guardrails are documented but not runtime-checked, and orchestration depends on agents remembering protocol.

## Goals

- JSON-configurable harness control plane in `opencode.json`
- Deterministic verification proof for all agent work
- Enforced runtime guardrails (protected files, completion blocking, budget caps)
- Runtime-managed orchestration with phase state, stall detection, and failure classification
- Auditable execution with structured event logging and lesson capture
- Predictable MCP enrichment by rule, not improvisation

## Tech Stack

**Core:**

- Runtime: Python 3.x (opencode-runtime package)
- Language: Python
- Configuration: JSON (opencode.json plugins)

**Key dependencies:**

- OpenCode plugin system
- Existing agent definitions (Herald, Scout, Sage, Forge, Ward, Arbiter)
- Existing skills (spec-driven, docs-writer, exploration-protocol, etc.)
- MCP servers (Git, Jira, observability — for Phase 5)

## Scope

**v1 includes (Phases 0-3):**

- Phase 0: Doc alignment, plugin control plane, command surface cleanup
- Phase 1: Runtime verification discovery, runner, and result schema
- Phase 2: Policy enforcement (protected files, completion blocking, budget caps, change sufficiency)
- Phase 3: Orchestration phase machine, stall detection, fallback policy, failure classification

**v2 includes (Phases 4-6):**

- Phase 4: Structured event logging, run bundles, lesson capture/promotion
- Phase 5: MCP routing rules, normalized payloads, task-category enrichment
- Phase 6: Sandbox posture decision, Forge isolation, tmux/TUI harness visualization

**Explicitly out of scope:**

- Splitting into separate packages before real pressure exists
- Expensive sandbox isolation before earlier phases prove the need
- New agent roles or redefining existing agent responsibilities
- Replacing existing skills or conventions that already work
- Keeping orchestration rules primarily in docs once equivalent JSON + plugin enforcement exists

## Constraints

- Strategic first, flat second, abstract by pain
- One spec per phase capability, not one giant spec for the whole harness
- Do not spec sandbox before policy and runtime exist
- Do not spec MCP bridge before orchestration boundaries are clear
