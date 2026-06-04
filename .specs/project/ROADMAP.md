# Roadmap

**Current Milestone:** Phase 0 - Architectural Alignment
**Status:** Planning

---

## Milestone 1: Phase 0 - Architectural Alignment

**Goal:** Remove contradictions, reduce workflow drift, establish single source of truth
**Target:** No core workflow docs contradict; canonical gate model; cleanup plan for legacy commands

### Features

**Doc Alignment** - IN PROGRESS

- Align AGENTS.md, .agents/gates.md, .agents/protocol.md, agents/herald.md
- Resolve G2/G3 status (exist or intentionally removed)
- Define canonical gate model

**Plugin Control Plane** - PLANNED

- Define `opencode.json` + plugin as the control plane for harness orchestration
- Move gate/routing/review policy from doc-governed behavior into declarative JSON + plugin options
- Define plugin responsibility boundaries and config schema direction

**Command Surface Cleanup** - PLANNED

- Review command and intent surface after control plane is defined
- Align workflows JSONC and Herald routing with plugin-governed rules
- Remove duplicated command semantics from docs where runtime config becomes canonical

**Plugin Activation Plan** - PLANNED

- Clear plugin responsibilities in opencode.json
- Architecture note describing layer boundaries

---

## Milestone 2: Phase 1 - Runtime Verification Foundation

**Goal:** Make completion provable
**Target:** Harness can detect verification commands, emit structured results, differentiate pass/fail/skip/unavailable

### Features

**Verification Discovery** - PLANNED

- Discover project verification commands (lint, test, typecheck, build)
- Normalize command execution

**Verification Runner** - PLANNED

- Execute verification commands with structured output
- Collect execution metadata (duration, outcome)

**Result Schema** - PLANNED

- Normalized verification result schema
- Proof-of-completion output for downstream gates

---

## Milestone 3: Phase 2 - Policy and Guardrails

**Goal:** Turn safety and completion rules into enforced runtime policy
**Target:** Protected files enforced, completion blocked without proof, budget caps active

### Features

**Protected Files** - PLANNED

- Define and enforce protected-file rules
- Block casual rewrites of critical files

**Completion Enforcement** - PLANNED

- Block completion when required verification has not passed
- Policy result schema with actionable failure reasons

**Budget Caps** - PLANNED

- Retry, timeout, and cost caps
- Deterministic loop prevention

**Change Sufficiency** - PLANNED

- Suspicious-diff heuristics
- Low-sufficiency change flagging

---

## Milestone 4: Phase 3 - Runtime Orchestration

**Goal:** Move execution flow from prompt discipline into runtime-controlled state transitions
**Target:** Phase progression independent from prompt wording; stall detection; classified failure paths

### Features

**Phase Machine** - PLANNED

- Runtime phase state model
- Quick, medium, large flow transitions

**Stall Detection** - PLANNED

- Detect stalled work using runtime evidence
- No-progress loop detection

**Fallback Policy** - PLANNED

- Retry/fallback/escalation triggered by rule
- Failure classification model

---

## Milestone 5: Phase 4 - Observability and Lessons

**Goal:** Make harness auditable and capable of learning from repeated failure patterns
**Target:** Execution reconstructable from structured records; recurring failures produce reusable lessons

### Features

**Event Log** - PLANNED

- Structured event stream
- Timing, step, outcome metadata

**Run Bundles** - PLANNED

- Execution fingerprints
- Timeline model for comparing harness revisions

**Lesson Capture** - PLANNED

- Capture recurring failure patterns as short lessons
- Promotion rules for longer-lived memory

---

## Milestone 6: Phase 5 - Deterministic MCP Enrichment

**Goal:** Use external context by rule instead of agent improvisation
**Target:** Same task category consistently pulls same external context types

### Features

**MCP Routing Rules** - PLANNED

- Context-to-MCP routing by task type, scope, signal
- Templates for injecting external findings

**Normalized Payloads** - PLANNED

- Standardized external context payload schema

---

## Milestone 7: Phase 6 - Sandbox and UX

**Goal:** Improve runtime safety and operator visibility
**Target:** Clearer isolation boundary; operators can see harness state without reconstructing from chat

### Features

**Sandbox Posture** - PLANNED

- Sandbox posture decision record
- First hardened execution isolation step

**Harness Visualization** - PLANNED

- tmux/TUI integration reflecting real harness state
- Phase, gate, verification, failure state visibility

---

## Suggested Spec Backlog (Priority Order)

1. phase-0-doc-alignment
2. phase-0-plugin-control-plane
3. phase-0-command-surface-cleanup
4. runtime-verification-discovery
5. runtime-verification-runner
6. policy-completion-enforcement
7. policy-protected-files
8. policy-budget-caps
9. orchestration-phase-machine
10. orchestration-stall-detection
11. runtime-event-log
12. lesson-capture-pipeline
13. mcp-routing-rules
14. sandbox-posture-decision
15. tmux-harness-visualization
