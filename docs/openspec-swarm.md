# OpenSpec Swarm — Agents and delegation

This document describes the agent swarm that powers the OpenCode workflow.
It covers agent identities, model assignments, the intent-to-delegation routing
table, and the behavioral contract each agent must follow.

---

## Agents and models

| Name    | File         | Model                            | Mode      | Role                                                           |
|---------|--------------|----------------------------------|-----------|----------------------------------------------------------------|
| Herald  | `herald.md`  | `anthropic/claude-sonnet-4-6`    | primary   | Coordinator — detects intent, delegates, never executes        |
| Scout   | `scout.md`   | `anthropic/claude-haiku-4-5`     | subagent  | Explorer — graphify-first, returns SCOUT_FINDINGS          |
| Sage    | `sage.md`    | `anthropic/claude-opus-4-6`      | subagent  | Planner — uses spec-driven skill, returns SAGE_STATUS        |
| Forge   | `forge.md`   | `anthropic/claude-haiku-4-5`     | subagent  | Executor — the only agent that writes code, reads tasks.md |
| Arbiter | `arbiter.md` | `anthropic/claude-haiku-4-5`     | subagent  | Quality reviewer — returns APPROVE or REJECT         |
| Ward    | `ward.md`    | `anthropic/claude-haiku-4-5`     | subagent  | Security auditor — returns APPROVE or REJECT         |

Agent files live in `~/.config/opencode/agent/`.
All agents use `permission` frontmatter (not deprecated `tools`).

---

## Intent → delegation flow

Herald detects the user's intent from natural-language cues and routes to the
correct subagent via the `Task` tool. Herald never executes work directly.

| User says                              | Herald delegates to | Subagent action                                      |
|----------------------------------------|---------------------|------------------------------------------------------|
| "explore / understand / debug X"      | Task(scout)          | Graphify-first, returns SCOUT_FINDINGS               |
| "plan / spec / design X"               | Task(sage)           | Uses spec-driven skill, returns SAGE_STATUS             |
| "apply / implement / build X"            | Task(forge)          | Executes tasks.md, writes code, proposes commit       |
| "quick fix / single file change"        | Task(forge)         | Quick mode — no tasks.md required                |
| "commit / git"                        | Task(forge)         | COMMIT mode — runs git after user approval            |
| "review / check quality"               | Task(arbiter)       | Returns APPROVE or REJECT with suggestions         |
| "security audit"                     | Task(ward)          | Returns APPROVE or REJECT with severity          |

**No `general` routing.** Every delegation goes to a named agent.

---

## Agent behavior

### Herald (`herald.md`)

- **Mode:** `primary` — appears in the model selector and is the default agent.
- **Permission model:** Denies all; allows only Scout, Sage, Forge, Ward, Arbiter via `task`.
- Detects intent from the routing table and delegates via `Task(subagent_type="...")`.
- **Never executes work directly** — no file reads, no code writes, no shell commands.
- Uses Question tool for all confirmation gates (interactive widget > free-text).
- Presents Forge's PROPOSED_COMMIT to user for approval before delegating commit.
- After each phase, prompts the next step — for example:
  > "Sage returned artifacts. Approve and write artifacts? (Yes / Adjust / Cancel)"

---

### Scout (`scout.md`)

- **Mode:** `subagent` — `permission: { write: deny, edit: deny, task: deny }`.
- **Mandatory graphify protocol** before reading any file:
  1. Check for vault graph: `~/Documents/dev/projets-wiki/<project>/graphify/`
  2. If exists: run `graphify query "<topic>"` (BFS or --dfs for flows)
  3. If NO graph: suggest user run `graphify --update .`
  4. Only then fall back to grep/glob/read for details
- Returns compressed summaries with `file:line` references.
- Returns SCOUT_FINDINGS with topic, summary, key_facts, files_examined.

---

### Sage (`sage.md`)

- **Mode:** `subagent`.
- **Permission:** `skill: { "*": deny, spec-driven: allow }`.
- Uses `spec-driven` skill (LOAD → SPECIFY → DESIGN → TASKS phases).
- Produces artifacts in `.specs/features/<name>/`:
  - `spec.md` — what to build and why
  - `design.md` — technical decisions (Medium+)
  - `tasks.md` — implementation checklist with `- [ ]` items
- Returns SAGE_STATUS: READY with artifacts embedded, or NEEDS_SCOUT if context missing.
- **Never reads files or runs grep/glob** — returns NEEDS_SCOUT if exploration needed.

---

### Forge (`forge.md`)

- **Mode:** `subagent` — `permission: { task: deny, skill: deny }`.
- Four execution modes:
  - **Normal:** Reads `.specs/features/<name>/tasks.md`, executes sequentially
  - **Quick:** Triggered by `QUICK MODE:` — no tasks.md, executes direct instruction
  - **COMMIT:** Triggered by `COMMIT: <message>` — runs git add/commit after Herald approval
  - **Post-Execution:** Triggered by `POST-EXECUTION:` — archive specs → graphify → session log
- **NEVER runs git add/commit/push** — only when Herald sends explicit COMMIT instruction.
- **NEVER loads skills** — only writes received artifact content in ARTIFACTS WRITE MODE.
- Marks completed tasks as `- [x]` in tasks.md.
- Emits FORGE_STATUS with CHANGED_FILES, tasks_completed, PROPOSED_COMMIT, diff.

---

### Arbiter (`arbiter.md`)

- **Mode:** `subagent` — `permission: { write: deny, edit: deny, task: deny }`.
- Receives diff + changed files from Herald.
- Reviews for correctness, consistency, test coverage, edge cases.
- Returns ARBITER_STATUS: APPROVE or REJECT with findings and suggestions.

---

### Ward (`ward.md`)

- **Mode:** `subagent` — `permission: { write: deny, edit: deny, task: deny }`.
- Focuses on OWASP Top 10, authentication, cryptography, input validation, secret exposure.
- Fast-exits with APPROVE if no security-relevant changes.
- Returns WARD_STATUS: APPROVE or REJECT with severity level and file:line for each issue.

---

## Spec-Driven artifact structure

All planning artifacts live under `.specs/features/<name>/`:

```
.specs/
├── features/
│   └── <name>/
│       ├── spec.md        # What and why (Sage)
│       ├── design.md     # How — technical decisions (Sage)
│       └── tasks.md      # Implementation checklist (Forge marks [x])
├── archive/             # Archived features
├── quick/              # Quick scope tasks
└── project/
    └── STATE.md        # Deferred ideas, decisions, blockers
```

**Never** use `.weave/plans/` — all planning goes through spec-driven.

---

## Full workflow

```
User
 └── Herald (detects intent, routes)
       ├── Scout   → explores → returns SCOUT_FINDINGS
       ├── Sage    → plans    → returns SAGE_STATUS → Forge writes artifacts
       ├── Forge   → executes → FORGE_STATUS: ALL_TASKS_COMPLETE + PROPOSED_COMMIT
       │           (if APPROVED by Ward + Arbiter) → Forge COMMIT mode
       ├── Arbiter → reviews  → APPROVE / REJECT
       └── Ward    → audits   → APPROVE / REJECT
```

Typical session flow:

1. User: `"explore the auth module"` → Herald → **Scout**
2. User: `"plan a JWT refresh token feature"` → Herald → **Sage**
3. User: `"apply jwt-refresh"` → Herald → **Forge**
4. User: `"review jwt-refresh"` → Herald → **Arbiter**
5. User: `"security audit jwt-refresh"` → Herald → **Ward**

---

## Permission frontmatter

All agents use OpenCode's `permission` model (not deprecated `tools`):

```yaml
permission:
  read: deny          # Herald, Scout, Sage, Ward, Arbiter
  glob: deny          # All except Scout
  grep: deny         # All except Scout
  bash: deny         # All except Forge, Scout
  skill: deny        # All except Sage (allows spec-driven)
  edit: deny         # All agents
  write: deny       # All agents
  task: deny        # Forge, Ward, Arbiter
  # scout: allow    # Herald only
```

See each agent's file for specific permission configuration.