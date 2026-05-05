---
description: Initialize a project with TLC Spec-Driven Development methodology
---

# SDD Project Setup

Load the `tlc-spec-driven` skill and execute the **"initialize project"** workflow.

## What this command does

Uses the TLC Spec-Driven skill to bootstrap a new or existing project:

- Creates `.specs/` directory structure (`project/`, `codebase/`, `features/`, `quick/`)
- Creates `.specs/project/PROJECT.md` — vision, goals, roadmap
- Creates `.specs/project/STATE.md` — decisions, blockers, lessons, deferred ideas
- Maps the existing codebase stack, architecture, and conventions into `.specs/codebase/`
- Auto-sizes depth based on project complexity (new greenfield vs existing brownfield)

## Instructions for Agent

When the user runs `/sdd-project-setup`:

1. **Load skill** — Load the `tlc-spec-driven` skill
2. **Detect context** — Check if this is a new project (no existing code) or existing codebase:
   - New project → run "initialize project" phase from the skill
   - Existing codebase → run "map codebase" phase from the skill
3. **Follow the skill workflow exactly** — the skill handles all auto-sizing, artifact creation, and session tracking
4. **Arguments** — If `$ARGUMENTS` is provided, treat it as the project name or description and pass it to the skill as context

## Skill trigger

This command triggers the `tlc-spec-driven` skill on: `"initialize project"` or `"map codebase"` depending on context detected in step 2.
