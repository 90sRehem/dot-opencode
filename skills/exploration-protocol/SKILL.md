---
name: exploration-protocol
description: "Structured methodology for codebase exploration using progressive disclosure. Graph-first approach with layered investigation. Use when exploring codebase for features, bugs, module boundaries, or data flows."
target_agents:
  - scout
workflow_type: methodology
---

# Skill: Exploration Protocol

## Purpose

Structured methodology for codebase exploration using progressive disclosure. Ensures thorough, efficient investigation without overwhelming context.

## When to Use

- Initial codebase exploration for a feature or bug
- Understanding module boundaries and dependencies
- Tracing data flows or call chains
- Finding where functionality is implemented

## Methodology — Progressive Disclosure

### Layer 1: Graph-First (structural)
1. Check for project graph: `ls ~/Documents/dev/projets-wiki/<project>/graphify/`
2. If exists: `graphify query "<topic>"` (BFS for breadth)
3. If no vault graph: check local fallback `ls graphify-out/graph.json`
4. Report graph status in findings (found/queried or fallback used)

### Layer 2: Targeted Search (narrow)
5. Only after graph: use grep/glob for details the graph didn't capture
6. Read specific file:line ranges — never entire files or directories
7. Focus on: function signatures, type definitions, import/export patterns

### Layer 3: Deep Dive (on demand)
8. Read full file contents ONLY for files directly relevant to the topic
9. Trace call chains: caller → callee → dependencies
10. Stop when the question is answered — don't over-explore

## Rules

- **NEVER skip Layer 1** — graph check is mandatory unless Herald says "targeted query — skip graph"
- **NEVER paste full files** — summarize with file:line references
- **NEVER suggest implementations** — read-only exploration
- **Keep response under 50 lines** — use progressive disclosure
- **If too many results** — narrow with filters before returning
- **If can't find** — say so explicitly, don't guess

## Return Format

Emit findings as structured JSON envelope with:
- `payload.findings[]` — file:line refs with notes
- `payload.summary` — 1-3 sentence synthesis
- `payload.recommendations` — optional action items
- `payload.recommended_skills[]` — skills relevant to the explored topic (derived from skill frontmatter catalog)
