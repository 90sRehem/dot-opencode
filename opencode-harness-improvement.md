# Harness Implementation Plan

## Core Principle

Before marking any task as done, the harness must verify that the project passes all verification checks (lint, build, typecheck, tests). This is enforced by the `opencode-runtime` plugin.

## Plugin Responsibilities

### `opencode-harness-core`
- Shared types, events, and run state contracts
- Zero business policy

### `opencode-runtime`
- Discover verification commands (lint, build, typecheck, tests)
- Execute automatic verification
- Emit structured proof of completion
- Capture auditable event log, timing, and cost metrics

### `opencode-policy`
- Enforce gates before critical phases
- Block edits to protected files
- Apply cost/retry/timeout caps
- Flag dangerous or insufficient changes

### `opencode-orchestration`
- Control phase transitions (quick/medium/large scope)
- Detect stalls and apply retry/fallback/escalation
- Maintain runtime flow state

### `opencode-mcp-bridge`
- Deterministic MCP selection based on context
- Enrich flows with external context (git, jira, sentry)

### `opencode-tmux`
- Visualize execution state and timeline
- Must not own business policy

## Integration

`opencode-policy` blocks task completion until `opencode-runtime` confirms all verification passed.
