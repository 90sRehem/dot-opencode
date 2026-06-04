# Project State

## Key Decisions
<!-- Format: - D-NNN: <decision> (date: YYYY-MM-DD, context: <why>) -->

- D-001: Agent variants config in JSON over YAML (date: 2026-04-29, context: Consistency with existing tooling; simpler schema; no multi-document support needed)
- D-002: Skill annotations via HTML comments over frontmatter (date: 2026-04-29, context: Non-rendering in markdown; easy regex extraction; no parsing overhead)
- D-003: Skill injection at Herald delegation time over runtime Skill() calls (date: 2026-04-29, context: Eliminates MCP dependency at runtime; auditable; allows recovery without re-fetching; Skill() kept as graceful fallback)
- D-004: G2/G3 gates are active, not eliminated (date: 2026-06-03, context: herald.md and protocol.md define G2/G3 as active gates with Question tool calls; gates.md was updated to eliminate them but other docs were never updated to match)
- D-005: G4/G5 are scope-dependent: opt-in for Quick/Medium, mandatory for Large (date: 2026-06-03, context: gates.md said opt-in only; herald.md and AGENTS.md correctly state mandatory for Large; gates.md needs clarification)
- D-006: OPENCODE-FLOW.md reference in AGENTS.md is stale — file does not exist (date: 2026-06-03, context: Content is distributed across gates.md, protocol.md, and herald.md)
- D-007: .agents/agents.md reference is stale — file does not exist (date: 2026-06-03, context: Context monitor spec is in AGENTS.md Context Management section and individual agent frontmatter)
- D-008: Workflow definitions live in both global and project scopes, with project workflows overriding global workflows on name collision (date: 2026-06-03, context: The orchestration plugin needs reusable defaults plus per-project customization without duplicating every workflow)
- D-009: Workflow schema no longer carries explicit scope; complexity is inferred at runtime from the user task and execution signals (date: 2026-06-03, context: Scope should be a runtime orchestration concern, not a static workflow authoring burden)
- D-010: Step prompts complement the base agent prompt via `prompt.prepend` and `prompt.append` instead of replacing it (date: 2026-06-03, context: Preserve durable agent behavior while allowing step-specific personas and constraints)
- D-011: Step-level permissions fully overwrite agent permissions, and `maximum_steps` applies per step instance, not per workflow (date: 2026-06-03, context: Step policy must be deterministic and isolated from agent defaults)
- D-012: Parallel agents are declared inside a parent step, run only during that step, and return supporting context rather than advancing workflow state (date: 2026-06-03, context: Parallel work should enrich a phase without becoming an independent workflow lane)

## Active Blockers
<!-- Format: - B-NNN: <blocker> (since: YYYY-MM-DD) -->

## Lessons Learned
<!-- Format: - L-NNN: <lesson> (date: YYYY-MM-DD) -->

## Pending TODOs
<!-- Format: - [ ] <todo> (date: YYYY-MM-DD) -->

## Deferred Ideas
<!-- Format: - [ ] <idea> (origin: <feature>, date: YYYY-MM-DD) -->
