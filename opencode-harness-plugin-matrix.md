# OpenCode Harness Plugin Matrix

## Objective

Separate the harness into deterministic plugins grouped by responsibility that can be used independently and, together, compose the full development harness.

Guiding rule:

- `AGENTS.md` holds static policy and conventions
- `skills` hold reusable reasoning playbooks
- `plugins` enforce deterministic runtime behavior via hooks
- critical behavior must not depend on the LLM inferring what to do

## Responsibility Matrix

| Item / responsibility | AGENTS.md | Skill | Plugin | Plugin target | Probable hook / mechanism | Notes |
|---|---|---|---|---|---|---|
| Editing principles and minimal changes | Yes | No | No | - | - | Static, transversal rule |
| Domain architecture conventions | Yes | Optional | No | - | - | Can have a companion guideline |
| Ubiquitous language | Yes | Optional | No | - | - | Static context |
| Human review rules | Yes | Yes | No | - | - | Policy in AGENTS, playbook in skill |
| When to use each agent | Yes | No | No | - | - | Conceptual routing rule |
| Spec/design/tasks playbook | No | Yes | Partial | `opencode-orchestration` | hooks + artifact state | Skill guides reasoning; plugin enforces flow |
| Phase creation and flow control | No | No | Yes | `opencode-orchestration` | `chat.message`, `tool.execute.after`, internal state | Runtime orchestration |
| Quick/medium/large scope by rule | No | Optional | Yes | `opencode-orchestration` | `chat.message` / intent parser | Must not depend on memory |
| Approval before critical phases | No | No | Yes | `opencode-policy` | `permission.ask`, `chat.message`, phase state | Gate is enforcement |
| Require verify before completion | No | No | Yes | `opencode-policy` + `opencode-runtime` | post-execution | Policy + proof |
| Require security/quality review by scope | No | Optional | Yes | `opencode-policy` | post-execution | Skill only helps interpret findings |
| Discover `lint/test/typecheck/build` commands | No | No | Yes | `opencode-runtime` | `config`, `tool.execute.after`, repo config reads | Deterministic |
| Execute automatic verification | No | No | Yes | `opencode-runtime` | post-execution | Core of proven completion |
| Structured verify result | No | Optional | Yes | `opencode-runtime` | event + structured log | Skill can explain how to interpret it |
| Protect sensitive files | No | No | Yes | `opencode-policy` | `tool.execute.before` | Specs, target tests, sensitive configs |
| Change sufficiency heuristic | No | No | Yes | `opencode-policy` | post-diff / post-tool | Compare scope vs actual change |
| Cost cap / retry cap / timeout cap | No | No | Yes | `opencode-policy` | `chat.params`, `tool.execute.before`, run counters | Operational policy |
| Stall detection | No | No | Yes | `opencode-orchestration` | stream/event timing | Pure runtime concern |
| Retry / fallback / escalation | No | Optional | Yes | `opencode-orchestration` | post-failure / timeout | Must not live only in prompts |
| Failure classification | No | Optional | Yes | `opencode-orchestration` + `opencode-runtime` | post-failure | Infra vs agent vs policy |
| Event log for the harness | No | No | Yes | `opencode-runtime` | `event`, `tool.execute.before/after` | Audit trail foundation |
| Per-phase time and cost | No | No | Yes | `opencode-runtime` | execution hooks | Required for tuning |
| Run bundle / execution fingerprint | No | No | Yes | `opencode-runtime` | `config`, `chat.params` | Hash of config/prompt/policy |
| Execution timeline | No | Optional | Yes | `opencode-runtime` | event aggregation | `tmux` can consume this |
| Tmux visualization | No | No | Yes | `opencode-tmux` | existing plugin hooks | Must not own policy |
| Guided MCP usage | No | Yes | Partial | `opencode-mcp-bridge` | context hooks + templates | Skill explains; plugin injects |
| Deterministic MCP selection | No | No | Yes | `opencode-mcp-bridge` | `chat.message`, run state, enabled providers | Example: bugfix -> git/jira/sentry |
| Capture recurring lessons | No | Yes | Partial | `opencode-runtime` | post-failure / post-run | Plugin collects, skill consolidates |
| Runtime/policy/orchestration guidelines | No | Yes | No | companion skills | - | Useful for manual operation and troubleshooting |

## Plugin Set

### 1. `opencode-harness-core`

Purpose:

- shared types
- run state model
- event schema
- common config loader and helpers
- zero business policy

Should contain:

- event contracts
- gate result types
- verify result types
- failure classification types
- plugin helper utilities

Should not contain:

- gating policy
- verification logic
- observability storage rules
- specflow orchestration decisions

### 2. `opencode-runtime`

Purpose:

- prove that work passed checks
- capture what happened in each run
- collect cost/time metrics and recurring lessons

Should contain:

- verification command discovery
- verification runners
- normalized output schema
- structured event log
- per-phase timing
- tool execution traces
- run bundle/fingerprint
- timeline model
- stack adapters later if needed

Should not contain:

- gating decisions (policy plugin handles this)
- phase orchestration (orchestration plugin handles this)
- fallback/escalation logic (orchestration plugin handles this)

### 3. `opencode-policy`

Purpose:

- enforce manual and automatic gates
- protect the repo from dangerous or insufficient changes
- enforce runtime budgets
- control progression policy by scope

Should contain:

- approval requirements
- mandatory preconditions
- review requirements by scope
- progression blocking logic
- protected file rules
- change sufficiency heuristics
- timeout/retry/cost caps
- dangerous action blocking

Should not contain:

- running tests/builds itself (runtime plugin handles this)
- phase orchestration (orchestration plugin handles this)
- deep failure analytics (runtime plugin handles this)

### 4. `opencode-orchestration`

Purpose:

- detect flow type and control phase transitions
- make execution robust under stalls and failures
- expose state for other plugins

Should contain:

- quick/medium/large runtime logic
- phase state machine
- transition events
- artifact lifecycle state
- stall detection
- timeout handling
- retry/fallback policy
- escalation policy
- failure classification integration

Should not contain:

- verify execution (runtime plugin handles this)
- guardrail rules (policy plugin handles this)
- telemetry persistence (runtime plugin handles this)
- tmux visualization (tmux plugin handles this)

### 5. `opencode-tmux`

Purpose:

- execution visualization and terminal ergonomics

Should contain:

- pane/session management
- timeline rendering
- live execution display

Should not contain:

- flow policy
- verify logic
- fallback/gate rules

### 6. `opencode-mcp-bridge`

Purpose:

- enrich the harness with deterministic MCP usage

Should contain:

- context-to-MCP routing rules
- MCP enrichment templates
- normalized external context payloads

Should not contain:

- business workflow policy
- manual reasoning playbooks
- observability core storage

## What Belongs Only in `AGENTS.md`

Good candidates:

- prefer minimal correct changes
- organize code by domain
- avoid abstraction without proven pain
- review should prioritize bugs, risk, regression
- large changes need more explicit planning
- do not touch sensitive areas without clear reason

Bad candidates for `AGENTS.md` only:

- run verify before marking task done
- block edits to protected files
- block large-scope completion without review
- cap runtime cost or retries
- classify failures
- trigger fallback or detect stalls

These require plugin enforcement.

## Skills to Keep or Add

Recommended companion skills:

- `orchestration-guidelines`
- `runtime-guidelines`
- `policy-guidelines`
- `mcp-investigation-guidelines`

Role of those skills:

- explain manual operation
- help interpret failures/findings
- support troubleshooting and evolution

They should not be the primary enforcement mechanism.

## Roadmap Summary

### Phase 0 - Foundation

Create:

1. `opencode-harness-core`

Decide and stabilize:

- event schema
- run state contract
- gate result contract
- verify result contract
- classified error contract
- shared plugin config conventions

### Phase 1 - Proof Before Sophistication

Create:

1. `opencode-runtime`

Goal:

- prove that work passed checks
- know what happened in each run
- capture cost/time metrics early

### Phase 2 - Enforcement

Create:

1. `opencode-policy`

Goal:

- block unsafe progression
- prevent dangerous or insufficient changes
- make completion policy explicit

### Phase 3 - Flow Orchestration

Create:

1. `opencode-orchestration`

Goal:

- move the flow out of prompt-only behavior
- make phase transitions runtime-driven
- integrate with policy, runtime, and observability

### Phase 4 - External Context

Create:

1. `opencode-mcp-bridge`

Goal:

- use MCPs via objective rules
- enrich bugfix, investigation, and review flows deterministically

### Phase 5 - UX

Evolve:

1. `opencode-tmux`

Goal:

- visualize pipeline state, gates, verify, and failures
- consume harness events without owning business logic

## Recommended MVP Order

If the goal is the smallest useful starting point:

1. `opencode-harness-core`
2. `opencode-runtime`
3. `opencode-policy`

This gives:

- real verification
- an audit trail
- basic progression blocking

Then add:

4. `opencode-orchestration`

Then add:

5. `opencode-mcp-bridge`
6. `opencode-tmux`

## Done Criteria by Plugin

### `opencode-harness-core`

- other plugins can share events and run state without duplicating contracts

### `opencode-runtime`

- runs checks and emits a reliable structured result
- every relevant execution generates an auditable trail

### `opencode-policy`

- no protected phase advances without the required preconditions
- dangerous file edits and suspicious diffs are blocked or flagged

### `opencode-orchestration`

- runtime phases exist independently from prompt instructions
- stalls and timeouts are surfaced and handled explicitly

### `opencode-mcp-bridge`

- external context is injected by rule, not by chance

### `opencode-tmux`

- UI accurately reflects harness state without owning central policy

## Final Grouping for Later Specs

### Core

- `opencode-harness-core`
- `opencode-runtime`

### Control

- `opencode-policy`

### Orchestration

- `opencode-orchestration`
- `opencode-mcp-bridge`
- `opencode-tmux`

## Suggested Next Step

Use this file as the decision base, then write one spec per plugin with:

- objective
- responsibilities
- out of scope
- consumed events
- emitted events
- hook surface
- MVP
- v2
