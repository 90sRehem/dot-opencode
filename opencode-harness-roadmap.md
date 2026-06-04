# OpenCode Harness Roadmap

## Objective

Create a pragmatic roadmap to evolve this OpenCode setup from prompt-driven governance into a deterministic, auditable harness.

This file is intentionally pre-spec.
It defines phases, scope, outcomes, and done criteria so we can later derive focused implementation specs.

## Principles

- Strategic first, flat second, abstract by pain
- Prefer deterministic runtime enforcement over prompt-only instruction
- Keep the harness modular, but do not split into separate packages before real pressure exists
- Optimize for proof of completion, safety, and operability
- Reduce documentation drift before adding new moving parts

## Current State Summary

The current setup is already strong in:

- agent roles and separation of concerns
- spec-driven planning
- context engineering
- session handoff and recovery conventions
- memory and context-pruning support

The main gaps are:

- runtime verification proof is not enforced by code
- guardrails are mostly documented, not enforced
- orchestration still depends too much on prompt discipline
- MCP usage is not deterministic enough
- observability is partial and not strongly structured
- sandboxing is weak
- some docs and commands drift from the current flow

## Phase Order

1. Phase 0 - Architectural Alignment
2. Phase 1 - Runtime Verification Foundation
3. Phase 2 - Policy and Guardrails
4. Phase 3 - Runtime Orchestration
5. Phase 4 - Observability and Lessons
6. Phase 5 - Deterministic MCP Enrichment
7. Phase 6 - Sandbox and UX

---

## Phase 0 - Architectural Alignment

### Goal

Remove contradictions, reduce workflow drift, and establish a single source of truth before implementing more harness behavior.

### Why first

If the docs, gates, and commands disagree, any plugin implementation will encode the wrong behavior or lock in confusion.

### Scope

- align `AGENTS.md`, `.agents/gates.md`, `.agents/protocol.md`, and `agents/herald.md`
- decide the canonical gate model
- resolve whether G2/G3 still exist or were intentionally removed
- review commands that point to missing agents or missing context files
- define which plugins are real, active, and supported
- define which behaviors stay in docs/skills vs which must move to runtime

### Deliverables

- one canonical gate model
- one canonical orchestration flow description
- cleanup plan for legacy commands and stale references
- plugin activation plan for `opencode.json`
- architecture note describing what belongs to runtime, policy, orchestration, MCP bridge, and UI

### Done Criteria

- no core workflow docs contradict each other
- no command references missing agents or missing context paths without an explicit deprecation note
- plugin responsibilities are clear enough to write implementation specs without reinterpretation

### Likely Specs Later

- `phase-0-doc-alignment`
- `gate-model-consolidation`
- `command-surface-cleanup`

---

## Phase 1 - Runtime Verification Foundation

### Goal

Make completion provable.

### Why now

Before adding sophistication, the harness must be able to prove whether work passed required checks.

### Scope

- implement a runtime layer that discovers project verification commands
- normalize `lint`, `test`, `typecheck`, and `build` execution
- emit structured verification results
- make verification reusable by later policy and orchestration layers
- collect basic execution metadata such as duration and command outcome

### Deliverables

- `opencode-runtime` MVP
- verification command discovery logic
- normalized verification result schema
- proof-of-completion output usable by downstream gates
- basic execution event emission

### Done Criteria

- the harness can reliably detect available verification commands
- verification output is structured, not free text only
- downstream logic can tell the difference between passed, failed, skipped, and unavailable checks
- task completion can reference runtime proof rather than agent intent

### Notes

This is the minimum useful foundation.
Without it, later gates and reviews still depend too much on trust.

### Likely Specs Later

- `runtime-verification-discovery`
- `runtime-verification-runner`
- `runtime-result-schema`

---

## Phase 2 - Policy and Guardrails

### Goal

Turn safety and completion rules into enforced runtime policy.

### Why now

Once verification exists, policy can block unsafe or insufficient progression using real evidence.

### Scope

- protect sensitive or critical files
- block completion when required verification has not passed
- enforce change sufficiency heuristics
- add retry, timeout, and cost caps
- define dangerous action blocking rules
- enforce review requirements by scope when appropriate

### Deliverables

- `opencode-policy` MVP
- protected-file rules
- completion blocking rules
- execution budget rules
- suspicious-diff heuristics
- policy result schema with actionable failure reasons

### Done Criteria

- protected files cannot be casually rewritten when policy forbids it
- completion is blocked when required proof is missing or failing
- obvious low-sufficiency or dangerous changes are flagged or blocked
- runtime budgets can stop wasteful loops deterministically

### Notes

This phase is the practical implementation of the TLC guardrails pillar.

### Likely Specs Later

- `policy-protected-files`
- `policy-completion-enforcement`
- `policy-budget-caps`
- `policy-change-sufficiency`

---

## Phase 3 - Runtime Orchestration

### Goal

Move execution flow from prompt discipline into runtime-controlled state transitions.

### Why now

The current system already has a strong conceptual planner/executor/verifier flow, but it is still too dependent on agents remembering the protocol.

### Scope

- introduce runtime phase state
- model quick, medium, and large flow transitions explicitly
- detect stalls and no-progress loops
- classify failures by type
- implement retry, fallback, and escalation behavior
- expose runtime state to other plugins and UI consumers

### Deliverables

- `opencode-orchestration` MVP
- phase state machine
- stall detection
- failure classification model
- retry/fallback/escalation policy hooks

### Done Criteria

- phase progression exists independently from prompt wording
- the harness can detect stalled work using runtime evidence
- failure paths are classified in a way that downstream UX can explain
- fallback and escalation are triggered by rule, not by improvisation

### Notes

This phase is where the harness starts behaving like an actual control loop.

### Likely Specs Later

- `orchestration-phase-machine`
- `orchestration-stall-detection`
- `orchestration-fallback-policy`
- `orchestration-failure-classification`

---

## Phase 4 - Observability and Lessons

### Goal

Make the harness auditable and capable of learning from repeated failure patterns.

### Why now

After runtime, policy, and orchestration exist, the next leverage point is explaining what happened and improving future runs with compact lessons.

### Scope

- create structured event logging
- capture timing, step, and outcome metadata
- generate execution fingerprints or bundles
- store enough context to compare harness revisions over time
- capture recurring failure patterns as short lessons
- support promotion of recurring lessons into longer-lived memory

### Deliverables

- structured event stream
- run fingerprint or bundle model
- execution timeline model
- lesson capture format
- recurring lesson promotion rules

### Done Criteria

- an execution can be reconstructed from structured records
- harness changes can be correlated with outcome differences
- repeated failures produce compact reusable lessons
- lessons are suitable for later injection into planning or execution

### Notes

This phase implements the observability and cognition-lessons ideas from the workshop material.

### Likely Specs Later

- `runtime-event-log`
- `runtime-run-bundles`
- `lesson-capture-pipeline`
- `lesson-promotion-rules`

---

## Phase 5 - Deterministic MCP Enrichment

### Goal

Use external context by rule instead of leaving tool choice mostly to agent improvisation.

### Why now

By this point, the harness has enough structure to enrich flows with external systems in a predictable way.

### Scope

- define context-to-MCP routing rules
- select MCPs by task type, scope, and signal
- normalize external context payloads
- support common flows such as bugfix, investigation, review, and incident analysis
- keep business policy outside the bridge itself

### Deliverables

- `opencode-mcp-bridge` MVP
- routing rules for common task categories
- normalized context payload schema
- templates for injecting external findings into the flow

### Done Criteria

- the same task category consistently pulls the same external context types
- MCP enrichment becomes explainable and reproducible
- the bridge enriches the flow without owning business workflow policy

### Notes

This is the closest phase to the “Git MCP + Jira MCP + observability MCP + analysis” workflow from the materials.

### Likely Specs Later

- `mcp-routing-rules`
- `mcp-normalized-payloads`
- `mcp-bugfix-enrichment`
- `mcp-review-enrichment`

---

## Phase 6 - Sandbox and UX

### Goal

Improve runtime safety and operator visibility.

### Why last

Sandbox and UI are important, but they are most effective after the core harness behavior is defined and observable.

### Scope

- improve execution isolation for write-capable flows
- evaluate workspace isolation, containerization, seccomp, gVisor, or microVM evolution path
- evolve tmux or TUI surfaces to reflect real harness state
- visualize gates, verification, failures, and execution timeline

### Deliverables

- sandbox posture decision record
- first hardened execution isolation step
- improved tmux/TUI integration
- live or near-live state visualization

### Done Criteria

- write-capable execution has a clearer isolation boundary than the current baseline
- operators can see phase, gate, verification, and failure state without reconstructing from chat alone
- UI consumes harness state instead of inventing it

### Notes

Follow the architecture slide advice here too: improve in reversible steps.
Do not jump to expensive isolation unless the earlier phases prove the need.

### Likely Specs Later

- `sandbox-posture-decision`
- `forge-isolation-mvp`
- `tmux-harness-visualization`

---

## MVP Recommendation

If the goal is the smallest meaningful implementation path, do this first:

1. Phase 0
2. Phase 1
3. Phase 2

This gives:

- architectural coherence
- real verification proof
- basic safety enforcement

Then proceed with:

4. Phase 3
5. Phase 4
6. Phase 5
7. Phase 6

## Sequencing Rules

- Do not spec sandbox before policy and runtime exist
- Do not spec MCP bridge before orchestration boundaries are clear
- Do not split into many packages until flat implementation hits real pain
- Prefer one spec per phase capability, not one giant spec for the whole harness

## Suggested Spec Backlog

Recommended order for future spec creation:

1. `phase-0-doc-alignment`
2. `phase-0-command-surface-cleanup`
3. `runtime-verification-discovery`
4. `runtime-verification-runner`
5. `policy-completion-enforcement`
6. `policy-protected-files`
7. `policy-budget-caps`
8. `orchestration-phase-machine`
9. `orchestration-stall-detection`
10. `runtime-event-log`
11. `lesson-capture-pipeline`
12. `mcp-routing-rules`
13. `sandbox-posture-decision`
14. `tmux-harness-visualization`

## Definition of Success

This roadmap is successful when the OpenCode setup evolves from:

- good prompts
- good agents
- good conventions

to:

- deterministic verification
- enforced guardrails
- runtime-managed orchestration
- auditable execution
- repeatable external context enrichment
- gradual hardening of execution safety
