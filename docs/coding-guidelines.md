# Coding Guidelines

Detailed reference for the 10 essential principles in AGENTS.md.

---

## 1. Think Before Coding

**Don't assume. Don't hide uncertainty. Make reasoning explicit.**

Before implementing:

- State assumptions clearly
- If multiple interpretations exist, present options (don't choose silently)
- Call out simpler approaches when they exist
- If something is unclear, stop and ask

---

## 2. Simplicity First

**Solve the problem with the minimum necessary code.**

- No features beyond what was requested
- No abstractions for single-use code
- No speculative flexibility or configurability
- No handling of impossible scenarios
- If 200 lines can be 50 → rewrite

Key question: *Is this more complex than necessary?*

---

## 3. Surgical Changes

**Change only what is required.**

When editing existing code:

- Don't "improve" adjacent code
- Don't refactor unnecessarily
- Match the existing style
- Call out unrelated issues, but don't fix them

Cleanup rules:

- Remove only what YOUR changes made obsolete
- Do not remove pre-existing dead code unless asked

Litmus test: *Every changed line must trace directly to the request.*

---

## 4. Goal-Driven Execution

**Work with verifiable success criteria.**

Turn tasks into testable goals:

- "Fix bug" → write failing test → make it pass
- "Add validation" → write invalid-input tests → validate
- "Refactor" → ensure tests pass before and after

For multi-step work:

1. [Step] → verify: [criteria]
2. [Step] → verify: [criteria]
3. [Step] → verify: [criteria]

---

## 5. Workflow: Research → Plan → Implement

**Default flow for non-trivial tasks:**

1. **Research**
   - Delegate to subagent to map relevant context
2. **Plan**
   - Present a clear, concise plan
   - Wait for user approval
3. **Implement**
   - Execute incrementally
   - Track progress
   - Validate each step

⚡ Trivial tasks may skip directly to implementation.

---

## 6. Context Discipline

**Manage context efficiently.**

- Load context on demand
- Prefer `file:line` references over pasted code
- Avoid context pollution
- Compact after completing phases

---

## 7. Mandatory Subagent Delegation

**Use subagents whenever the task involves exploration or broad analysis.**

Delegate when:

- Searching the codebase (grep, glob, multiple files)
- Understanding modules or flows
- Analyzing 3+ files
- Answering:
  - "Where is X?"
  - "How does X work?"
  - "What calls X?"
- Reviewing large diffs
- Running exploratory commands

How to delegate:

- Use `explore` → code navigation
- Use `general` → broader research
- Request **compressed summaries with `file:line`**
- Never request full file dumps
- Run subagents in parallel when possible

Do NOT delegate when:

- Editing a single file
- Running known build/test/lint commands
- Performing a simple, targeted operation

---

## 8. Execution Principles

- Execute before describing
- Verify results before claiming success
- Fail transparently (don't hide errors)
- Suggest alternatives when needed

---

## 9. Clean Output Discipline

- Avoid unnecessary verbosity
- Prefer clarity over volume
- Don't repeat code without reason
- Stay focused on the objective

---

## 10. Success Signals

These guidelines are working if:

- Fewer unnecessary diffs
- Less overengineering
- More clarification before implementation
- Simpler, more direct code
- Effective use of subagents
