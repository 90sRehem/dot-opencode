---
description: "Code review com Ward e Arbiter"
agent: herald
---

# Review Command

Run Ward (security auditor) and Arbiter (quality reviewer) in parallel on the current working tree changes.

## Protocol

1. **Gather context**:
   - Run `git diff` to get current changes
   - Run `git status --porcelain` to list changed files
2. **Delegate Ward and Arbiter in parallel**:
   - Pass diff + changed files to both agents
   - Ward focuses on: OWASP Top 10, secrets, crypto, injection, auth
   - Arbiter focuses on: correctness, tests, edge cases, duplication, error handling
3. **Collect results**:
   - **Wait for BOTH Ward AND Arbiter to return before presenting combined findings.** Delegate them in parallel via two Task() calls in the same turn, then wait for both JSON envelopes.
   - Ward returns JSON envelope with `status: "approve"` or `"reject"` + issues[]
   - Arbiter returns JSON envelope with `status: "approve"` or `"reject"` + issues[]
   - **If either rejects, present combined categorized results** — merge both agents' findings into a single structured view before offering fix options.
4. **Present combined findings**:
   - If both approve: "Review passed — no issues found"
   - If either rejects: Present categorized findings (security vs quality) with file:line refs and fix suggestions
   - Offer options: "Fix all", "Partial fix", "Dismiss", "Abort"

## Output

Present results as a structured summary, not raw JSON. Group by:
- **Security issues** (from Ward) — with severity and OWASP rule
- **Quality issues** (from Arbiter) — with severity and suggestion
