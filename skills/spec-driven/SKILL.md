---
name: spec-driven
description: "Structured planning pipeline with 4 adaptive phases (Specify, Design, Tasks, Execute) and persistent knowledge accumulation for development teams. Auto-sizes depth by complexity from quick fixes to multi-component features. Commands: /explore (understand problem + map context), /plan (write spec → design → tasks), /apply <spec> (execute a spec), /spec <desc> (full pipeline). Also triggered by natural language: 'plan this feature', 'specify X', 'help me structure this', 'how should we implement X', 'break this into tasks', 'explore this', 'entende o problema', 'vamos especificar', 'preciso planejar', 'implementar X', 'cria as tasks', 'quebra em tarefas', 'como vamos fazer X', 'me ajuda a planejar', 'initialize project', 'map codebase', 'quick fix', 'pause work', 'resume work'. Covers requirement traceability, atomic task creation with verification criteria, and session memory via docs/ knowledge base. Do NOT use for architecture decomposition analysis (use architecture skills), technical design docs (use technical-design-doc-creator), or general code review."
trigger: /spec, /explore, /plan, /apply
scope: public
audience: development-teams
license: CC-BY-4.0
metadata:
  version: 0.2.0
---

# spec-driven

A 6-phase planning and execution pipeline for structured software development. Invoke with `/spec <description>` to begin.

```
LOAD → SPECIFY → DESIGN → TASKS → EXECUTE → LEARN
```

The agent runs all phases inline. Each planning phase ends with a user approval gate before proceeding.

---

## Quick Reference

| Trigger | Phases | Description |
|---------|--------|-------------|
| `/explore` | LOAD | Understand the problem, map codebase context, ask clarifying questions — no artifacts produced |
| `/plan <desc>` | LOAD → SPECIFY → DESIGN → TASKS | Write spec.md, design.md (if Large), tasks.md with approval gates |
| `/apply <spec>` | EXECUTE → LEARN | Execute an approved spec by path or name (e.g. `/apply auth-jwt`) |
| `/spec <desc>` | LOAD → SPECIFY → DESIGN → TASKS → EXECUTE → LEARN | Full pipeline, auto-detects scope |
| `/spec quick <desc>` | Quick | LOAD → SPECIFY → EXECUTE → LEARN |
| `/spec medium <desc>` | Medium | LOAD → SPECIFY → TASKS → EXECUTE → LEARN |
| `/spec large <desc>` | Large | LOAD → SPECIFY → DESIGN → TASKS → EXECUTE → LEARN |
| `/spec resume` | Resume | Load last session, continue from checkpoint |
| `/spec pause` | Pause | Save checkpoint to docs/sessions/ |

**Natural language triggers** (the skill infers intent from ubiquitous language):

| Said by user | Inferred trigger |
|---|---|
| "explore this", "entende o problema", "map codebase", "me dá contexto" | `/explore` |
| "plan this feature", "quebra em tarefas", "cria as tasks", "como vamos fazer X" | `/plan` |
| "implement", "execute tasks", "implementar X", "aplica a spec" | `/apply` |
| "specify X", "vamos especificar", "help me structure this", "me ajuda a planejar" | `/spec` |
| "pause work", "resume work", "initialize project" | `/spec pause` / `/spec resume` |

---

## Scope × Artifacts

| Scope | Artifacts | Output path |
|-------|-----------|-------------|
| Quick | `TASK.md` | `.specs/quick/NNN-slug/` |
| Medium | `spec.md` + `tasks.md` | `.specs/features/<name>/` |
| Large | `spec.md` + `design.md` + `tasks.md` | `.specs/features/<name>/` |

---

## Phase 1: LOAD

**When**: Always — every invocation starts here.

**Goal**: Build a context summary from prior knowledge before any planning begins.

### Steps

1. Check whether `docs/` exists at the project root.
   - If it does not exist → note "first run" and proceed without prior context. `docs/` will be scaffolded in LEARN phase.

2. If `docs/` exists, read:
   - `docs/project.md` — project overview, modules, active features
   - `docs/conventions.md` — coding patterns, naming rules, structural decisions
   - `docs/decisions.md` — architectural choices made in past sessions
   - The 3 most recent files in `docs/sessions/` (sorted by filename date, descending)

3. If `.specs/codebase/` exists, read relevant files for the feature domain (STACK.md, ARCHITECTURE.md, CONVENTIONS.md). Load on-demand, not eagerly.

4. **Context budget**: Total loaded content must remain under 40k tokens. If docs/ files are large, load the most recent sections or a summary.

5. Produce a **Context Summary** block:

```
## Context Summary

Project: [inferred from docs/project.md or "unknown"]
Active feature: [if resuming]
Known conventions: [bullet list from docs/conventions.md, max 5]
Recent decisions: [bullet list from docs/decisions.md, max 3]
Last session: [date and feature from most recent session log, or "none"]
Prior context loaded from: [list of files read]
```

6. If the user said `map codebase` → stop here and present the Context Summary. Do not proceed to SPECIFY.

---

## Phase 2: SPECIFY

**When**: After LOAD, unless user said `map codebase`.

**Goal**: Capture what to build with testable, traceable requirements.

### 2a. Scope Detection

Use the scoring matrix in `references/scope-detection.md` to determine scope.

1. Analyze the user's description against the 5 signals (files, concepts, ambiguity, integrations, risk).
2. Calculate total score.
3. Present score and reasoning to the user.
4. Ask for confirmation or override.

If the user specified scope explicitly (`/spec quick`, `/spec medium`, `/spec large`) → skip detection, use the specified scope.

### 2b. Clarification

If the request is ambiguous (score ≥ 1 on the Ambiguity signal), ask clarifying questions before writing artifacts. Keep to 1–3 focused questions.

### 2c. Produce Artifact

**Quick scope** → create `.specs/quick/NNN-slug/TASK.md`:
- Check existing `.specs/quick/` entries to determine the next `NNN` number (pad to 3 digits)
- Use template from `references/task-template.md`
- Fill: problem, solution, files, acceptance criteria (WHEN/THEN format), verification

**Medium or Large scope** → create `.specs/features/<name>/spec.md`:
- Use template from `references/spec-template.md`
- Fill: problem statement, goals, out of scope, user stories (P1/P2/P3), acceptance criteria, traceability table, success criteria
- Assign requirement IDs: `[FEAT]-01`, `[FEAT]-02`, etc. where `FEAT` is a 2–4 letter abbreviation of the feature name

### 2d. Approval Gate

Present the artifact to the user. Ask:
> "Does this spec look correct? (approve / adjust)"

Do not proceed until the user approves.

**Idempotency**: If `.specs/features/<name>/spec.md` already exists with `status: approved` → skip this phase and proceed to DESIGN or TASKS.

---

## Phase 3: DESIGN

**When**: Only for Large scope. Skip for Quick and Medium.

**Goal**: Define the technical approach — architecture, components, data models, decisions.

### Steps

1. Check existing codebase for reusable components before designing new ones.
   - Use glob/read to find relevant existing files based on the feature domain.
   - If `codenavi` skill is available, use it for deeper codebase navigation.

2. Apply the **Knowledge Verification Chain**:
   - First: check existing codebase (`src/`, `lib/`, `packages/`)
   - Second: check project docs (`docs/`, `.specs/codebase/`)
   - Third: check `context7` if available (external library docs)
   - Fourth: general knowledge
   - Flag anything uncertain for user review

3. Produce `.specs/features/<name>/design.md`:
   - Use template from `references/design-template.md`
   - Fill: architecture overview, code reuse analysis, components, data models, error handling, tech decisions
   - If `mermaid-studio` skill is available, suggest creating a diagram for the architecture overview

4. **Approval Gate**: Present design to user. Ask:
   > "Does this design look correct? (approve / adjust)"
   Do not proceed until approved.

**Idempotency**: If `design.md` already exists with `status: approved` → skip and proceed to TASKS.

---

## Phase 4: TASKS

**When**: Medium and Large scope only. Skip for Quick (tasks are inline in TASK.md).

**Goal**: Break the spec into atomic, verifiable, sequentially ordered tasks.

### Steps

1. Read `spec.md` and identify all requirement IDs.

2. Produce `.specs/features/<name>/tasks.md`:
   - Use template from `references/tasks-template.md`
   - Each task must have: title, What, Where (file path), Depends on, Requirement ID, Done when (checkboxes)
   - Tasks are ordered by dependency (prerequisites first)
   - Group tasks into logical phases (Setup, Core, Integration, Verification)

3. **Granularity rule**: Each task should be completable in under 30 minutes. If a task would take longer, split it into subtasks.

4. **Traceability**: Every requirement ID in spec.md must appear in at least one task. Add a Requirement Coverage table at the bottom.

5. **Approval Gate**: Present tasks.md to the user. Ask:
   > "Does this task breakdown look correct? (approve / adjust)"
   Do not proceed until approved.

**Idempotency**: If `tasks.md` already exists → check for unchecked tasks. If unchecked tasks remain, proceed to EXECUTE from the first unchecked task. If all checked, proceed to LEARN.

---

## Phase 5: EXECUTE

**When**: After all planning phases are approved.

**Goal**: Implement each task directly, inline, one at a time.

### Steps

For each task in `tasks.md` (or `TASK.md` for Quick scope), in document order:

1. Read the task definition: What, Where, Done when criteria.
2. Load the referenced file(s).
3. Implement the change by editing the file directly.
4. Verify: check each acceptance criterion in "Done when".
   - Run any specified verification command.
   - If a criterion fails → fix it before moving to the next task.
5. Mark the task checkbox `[x]` in the tasks file.
6. Report to the user: "✓ Task N complete: [brief summary]"
7. Proceed to the next task.

### Blockers

If a task cannot be completed due to a dependency on something external (e.g., missing API key, unresolved question):
1. Mark the task `[BLOCKED: reason]` in tasks.md.
2. Report the blocker clearly to the user.
3. Skip dependent tasks (tasks that list the blocked task in "Depends on").
4. Continue with any non-dependent tasks.
5. Do not mark EXECUTE complete until all non-blocked tasks are done.

### Completion

When all tasks are checked (or blocked with explanation):
- Update the `status` frontmatter in tasks.md to `completed` (or `partial` if blocked tasks exist).
- Report summary to the user: total tasks, completed, blocked.
- Proceed to LEARN.

---

## Phase 6: LEARN

**When**: After EXECUTE completes (or on explicit `/spec pause`).

**Goal**: Capture session knowledge and update the persistent docs/ knowledge base.

### 6a. Session Log (Always)

Create `docs/sessions/YYYY-MM-DD-<feature>.md` using `references/session-template.md`.

Fill:
- **What Was Done**: bullet list of completed changes
- **Files Changed**: list of files modified or created
- **Decisions Made**: any architectural or design choices made during execution
- **Conventions Discovered**: new patterns or naming rules found in the codebase
- **Open Items**: any blocked tasks or deferred work

Session logs are **immutable**. Once written, never edit them. If the same feature continues in a later session, create a new session log with an incremented date or suffix.

### 6b. Live Docs (Conditional)

Update the following files only when genuinely new information was discovered:

| Discovery | Target | Action |
|-----------|--------|--------|
| New module, feature, or integration | `docs/project.md` | Append new section |
| New code pattern, naming rule, file structure | `docs/conventions.md` | Append new entry |
| Architectural decision with rationale | `docs/decisions.md` | Append ADR-style entry |
| Nothing new | (none) | Skip silently |

**Rules**:
- Append only — never remove or overwrite existing content
- Deduplicate — check existing content before adding; skip if already present
- Attribute — each addition references the source feature: "(from: feature-name, date: YYYY-MM-DD)"

### 6c. First-Run Scaffold

If `docs/` does not exist (first LEARN invocation):

Create the following structure:

```
docs/
├── project.md
├── conventions.md
├── decisions.md
└── sessions/
```

Initial content for each file (see `references/knowledge-base.md` for full scaffold).

### 6d. Graphify (Optional)

If the `graphify` skill is available, suggest:
> "Run `/graphify --update docs/` to update the knowledge graph with new session context."
Do not auto-invoke — leave it as a user action.

### 6e. Completion

Present the LEARN summary to the user:
```
## LEARN Complete

Session log: docs/sessions/{{date}}-{{feature}}.md
Updated: [list of files updated, or "none"]
Graphify: [available / not available]
```

---

## Resume / Pause

### Resume

When the user says `resume work` or `/spec resume`:

1. Run LOAD phase.
2. Check `.specs/features/*/tasks.md` for files with `status: pending` or `status: in-progress`.
3. If found → present the feature name and first unchecked task. Ask: "Resume from here? (yes / no)"
4. If approved → jump to EXECUTE at the first unchecked task.

### Pause

When the user says `pause work` or `/spec pause`:

1. Run LEARN phase (write session log, update live docs).
2. Update `tasks.md` `status` frontmatter to `in-progress`.
3. Report: "Work paused. Resume with `/spec resume`."

---

## /explore — Context Mapping

**When**: User invokes `/explore` or uses natural language like "explore this", "entende o problema", "map codebase", "me dá contexto".

**Goal**: Understand the problem space and map existing context — no artifacts produced.

### Steps

1. Run LOAD phase fully (read docs/, produce Context Summary).
2. Ask the user to describe the problem or feature they are exploring (if not already described).
3. Ask 2–4 focused clarifying questions to surface:
   - What problem is being solved?
   - What already exists in the codebase that relates?
   - What constraints or risks are known?
   - What does success look like?
4. Reflect back a structured **Exploration Summary**:

```
## Exploration Summary

Problem: [what the user wants to solve]
Existing context: [relevant modules/files found in LOAD]
Open questions: [anything still unclear]
Suggested next step: /plan <feature-name> | or clarify X first
```

5. Do **not** write any spec artifacts. This phase is for understanding, not planning.

---

## /apply — Execute a Spec

**When**: User invokes `/apply <spec>` or uses natural language like "implement", "execute tasks", "implementar X", "aplica a spec".

**Goal**: Execute an approved spec without re-running planning phases.

### Steps

1. Resolve the spec path:
   - If user provides a path: use it directly (e.g., `/apply .specs/features/auth-jwt/tasks.md`)
   - If user provides a name: search `.specs/features/<name>/tasks.md` and `.specs/quick/<name>/TASK.md`
   - If multiple matches: list them and ask user to select
   - If not found: report error, suggest running `/plan <desc>` first

2. Read the tasks file. Check status:
   - `status: pending` or `status: in-progress` → proceed to EXECUTE
   - `status: completed` → report "Already completed. Run `/spec resume` to review or start a new spec."
   - `status: draft` → report "Spec not yet approved. Run `/plan` to complete planning first."

3. Run EXECUTE phase from the first unchecked task.

4. Run LEARN phase after completion.

---

## Context Loading Strategy

| Content | When to load | Token budget |
|---------|-------------|--------------|
| `docs/project.md` | Every invocation | ~2k tokens max |
| `docs/conventions.md` | Every invocation | ~2k tokens max |
| `docs/decisions.md` | Every invocation | ~2k tokens max |
| 3 most recent `docs/sessions/*.md` | Every invocation | ~6k tokens max |
| `.specs/codebase/*.md` | On-demand | ~5k tokens per file |
| Feature spec/design/tasks | When resuming | ~4k tokens max |
| **Total budget** | | **< 40k tokens** |

If any file exceeds its token budget, load the most recent sections only.

---

## Skill Integrations

These integrations are optional. Check if the skill is available before suggesting it.

| Skill | When to suggest |
|-------|----------------|
| `mermaid-studio` | During DESIGN phase, when an architecture diagram would clarify the approach |
| `codenavi` | During DESIGN phase, when deep codebase navigation is needed to find existing components |
| `graphify` | After LEARN phase, to update the knowledge graph |

To check if a skill is available: look for it in the loaded skills list or attempt to invoke it and handle gracefully if not found.
