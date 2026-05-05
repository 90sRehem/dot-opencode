---
name: docs-writer
description: "Standards and workflow for writing clear, complete documentation. Use when writing specs, design docs, task descriptions, README updates, APIs, configuration, deployment procedures, or decision records."
target_agents:
  - sage
  - forge
workflow_type: methodology
---

# Skill: Documentation Writing

## Purpose

Standards and workflow for writing clear, complete documentation that developers can follow without ambiguity.

## When to Use

- Writing specs, design docs, task descriptions, README updates
- Documenting APIs, configuration, deployment procedures
- Creating decision records or architecture diagrams
- Any artifact intended for reader comprehension or handoff

## Methodology

### Structure
- **Header**: Clear, specific title (not "Overview" or "Info")
- **Context**: What problem does this doc address? Who is the reader?
- **Sections**: Logical grouping with descriptive headers (not "Details", use "Deployment Steps" etc.)
- **Examples**: Concrete, runnable code or configuration snippets
- **References**: Links to related docs, APIs, standards

### Tone
- **Direct**: Use imperative voice ("Create the file", not "The file should be created")
- **Consistent**: Same terminology throughout (not "function"/"method" interchangeably)
- **Precise**: Numbers, quotes, file paths are exact (not "roughly 10", say "10 ± 2")

### Format
- **Lists**: Use bullets for unordered, numbers for sequence
- **Code blocks**: Fenced with language identifier (```python, ```sh, etc.)
- **Tables**: For structured data, comparisons, or matrices
- **Emphasis**: Bold for UI labels/terms, code font for technical names

## Completeness Checklist

- [ ] Title is specific and descriptive
- [ ] Reader context is clear (who, what, why)
- [ ] All terms are defined or linked
- [ ] Examples are runnable/reproducible
- [ ] Acceptance criteria (if applicable) are testable
- [ ] No dangling references or TODOs
- [ ] Consistent terminology throughout
- [ ] Tone matches audience (user, developer, architect)

## Examples

**Good**: "Create a `.env` file in the project root with these variables: `DB_HOST`, `DB_USER`, `DB_PASS`"

**Bad**: "Configure the environment settings appropriately"

**Good**: Task item with acceptance: `- [ ] Add auth endpoint (src/auth/routes.ts) — Acceptance: POST /auth returns 200 with JWT token`

**Bad**: `- [ ] Update auth — Acceptance: works correctly`
