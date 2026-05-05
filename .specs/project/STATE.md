# Project State

## Key Decisions
<!-- Format: - D-NNN: <decision> (date: YYYY-MM-DD, context: <why>) -->

- D-001: Agent variants config in JSON over YAML (date: 2026-04-29, context: Consistency with existing tooling; simpler schema; no multi-document support needed)
- D-002: Skill annotations via HTML comments over frontmatter (date: 2026-04-29, context: Non-rendering in markdown; easy regex extraction; no parsing overhead)
- D-003: Skill injection at Herald delegation time over runtime Skill() calls (date: 2026-04-29, context: Eliminates MCP dependency at runtime; auditable; allows recovery without re-fetching; Skill() kept as graceful fallback)

## Active Blockers
<!-- Format: - B-NNN: <blocker> (since: YYYY-MM-DD) -->

## Lessons Learned
<!-- Format: - L-NNN: <lesson> (date: YYYY-MM-DD) -->

## Pending TODOs
<!-- Format: - [ ] <todo> (date: YYYY-MM-DD) -->

## Deferred Ideas
<!-- Format: - [ ] <idea> (origin: <feature>, date: YYYY-MM-DD) -->
