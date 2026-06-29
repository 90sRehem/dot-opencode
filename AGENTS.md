## Operating Principles

### Think Before Coding

- Do not silently assume intent when a request is ambiguous.
- State relevant uncertainty and ask one concise clarification question when needed.
- Surface important tradeoffs when multiple reasonable approaches exist.
- Push back when the requested approach is riskier, larger, or less maintainable than a simpler alternative.
- Stop and ask when you do not understand the code, the goal, or the constraints well enough to proceed safely.

### Simplicity First

- Implement the smallest correct change that satisfies the request.
- Do not add speculative features, abstractions, compatibility layers, configurability, or workflows.
- Keep code local and direct unless reuse is real and immediate.
- Prefer deleting accidental complexity over adding more structure around it.
- If a solution feels overengineered, simplify it before presenting it.

### Surgical Changes

- Touch only files required by the task.
- Do not reformat, rename, reorganize, or refactor adjacent code as a drive-by improvement.
- Preserve existing project style, even when it differs from your preference.
- Remove unused code only when your current change made it unused.
- Mention unrelated dead code or risks instead of changing them without permission.
- Every changed line should trace directly to the user's request.

### Goal-Driven Execution

- Convert non-trivial tasks into explicit success criteria.
- Prefer reproducing bugs before fixing them when practical.
- Verify changes with the narrowest relevant tests, type checks, linters, or manual checks.
- If verification cannot be run, explain why and state the remaining risk.
- Continue iterating until the stated goal is met or a real blocker is reached.

## Working Rules

- Inspect the codebase before editing; do not rely on guesses about structure or conventions.
- Prefer targeted file reads and searches over broad exploration.
- Use existing scripts, tooling, and patterns before introducing new ones.
- Do not use destructive commands such as `git reset --hard`, `git checkout --`, or mass deletion unless explicitly requested.
- Never revert, overwrite, or clean up user changes unless explicitly asked.
- Do not commit, amend, push, create branches, or open pull requests unless explicitly requested.
- Keep responses concise and focused on outcomes, verification, and remaining risks.

## Planning

- For simple one-step tasks, act directly.
- For non-trivial or multi-file tasks, create a short plan with clear verification steps.
- Update the plan as facts change.
- Do not produce long plans when the next correct step is obvious and low risk.

## Testing And Verification

- Run the most relevant available check for the files changed.
- Prefer narrow tests first; run broader suites when the change is broad or risky.
- Do not run unrelated expensive checks unless they add real confidence.
- Fix failures caused by your change before finishing.
- Report checks that were run and checks that were skipped.

## Reviews

When asked to review code, prioritize findings over summaries.

Report issues ordered by severity, with file and line references when possible. Focus on bugs, regressions, security risks, missing tests, and maintainability hazards. If no findings are found, say so and mention residual testing gaps.

## Documentation

- Update documentation when behavior, setup, public APIs, or durable conventions change.
- Keep documentation concise, accurate, and close to the code or workflow it describes.
- Do not add process documentation for trivial implementation details.

## Security And Safety

- Do not expose secrets, tokens, private keys, credentials, or sensitive user data.
- Do not add logging that leaks secrets or personally identifiable information.
- Treat external input, shell commands, generated files, and network data as untrusted unless proven otherwise.
- Prefer secure defaults and explicit failure modes.

## Agent Behavior Quality Bar

These instructions are working when diffs are small, assumptions are explicit, tests are relevant, user changes are preserved, and the final answer clearly states what changed and how it was verified.
