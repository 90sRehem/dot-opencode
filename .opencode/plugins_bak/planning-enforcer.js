/**
 * Planning mode enforcement.
 *
 * Detects planning steps and enforces read-only constraints:
 * - Blocks edit, write, and mutable bash
 * - Restricts task delegation to read-only agents (scout only)
 * - Injects read-only system reminder via prompt.prepend
 */

/**
 * Planning step identifiers.
 * A step is considered "planning" if its name or agent matches these patterns.
 */
const PLANNING_STEP_NAMES = ["planning", "plan", "specify", "design"];
const PLANNING_AGENTS = ["sage"];

/**
 * Read-only agents that planning steps may delegate to.
 */
const READ_ONLY_AGENTS = ["scout"];

/**
 * Tools that are blocked in planning mode (mutable operations).
 */
const BLOCKED_TOOLS = ["edit", "write"];

/**
 * Bash patterns that indicate mutable operations (blocked in planning).
 * Read-only patterns like `ls`, `cat`, `grep`, `find`, `echo` are allowed.
 */
const MUTABLE_BASH_PATTERNS = [
  /^\s*(rm|mv|cp|mkdir|rmdir|touch|chmod|chown)\b/,
  />\s/,
  /^\s*sed\b/,
  /^\s*awk\b.*>/,
  /^\s*node\b.*-e/,
  /^\s*python\b.*-c/,
  /^\s*npx\b/,
  /^\s*npm\b.*\b(install|uninstall|update|run|exec)\b/,
  /^\s*git\b.*\b(add|commit|push|pull|merge|rebase|checkout|branch|tag|reset|revert|stash)\b/,
  /^\s*(docker|kubectl|terraform|ansible)\b/,
];

/**
 * Determine if a step is a planning step.
 *
 * @param {object} effectiveStep - Resolved step config
 * @returns {boolean}
 */
export function isPlanningStep(effectiveStep) {
  const name = (effectiveStep.name || "").toLowerCase();
  const agent = (effectiveStep.agent || "").toLowerCase();

  if (PLANNING_STEP_NAMES.includes(name)) return true;
  if (PLANNING_AGENTS.includes(agent)) return true;

  return false;
}

/**
 * Check if a bash command is read-only (allowed in planning mode).
 *
 * @param {string} command - Bash command string
 * @returns {boolean} true if read-only, false if mutable
 */
export function isReadOnlyBash(command) {
  const trimmed = command.trim();

  // Empty or comment-only commands are safe
  if (!trimmed || trimmed.startsWith("#")) return true;

  // Check against mutable patterns
  for (const pattern of MUTABLE_BASH_PATTERNS) {
    if (pattern.test(trimmed)) return false;
  }

  return true;
}

/**
 * Check if a task delegation target is allowed in planning mode.
 *
 * @param {string} targetAgent - Agent being delegated to
 * @returns {boolean}
 */
export function isAllowedPlanningDelegate(targetAgent) {
  return READ_ONLY_AGENTS.includes(targetAgent.toLowerCase());
}

/**
 * Create a planning mode permission hook.
 * Wraps the base permission check with planning-specific constraints.
 *
 * @param {object} effectiveStep - Resolved step config
 * @returns {Function} permission.ask hook handler
 */
export function createPlanningPermissionHook(effectiveStep) {
  return async (input, output) => {
    if (!isPlanningStep(effectiveStep)) return;

    const tool = (input.tool || input.type || "").toLowerCase();

    // Block mutable tools
    if (BLOCKED_TOOLS.includes(tool)) {
      output.status = "deny";
      output.reason = `step:${effectiveStep.name || "planning"}:read_only:blocked_tool:${tool}`;
      return;
    }

    // Block mutable bash
    if (tool === "bash") {
      const command = input.command || input.args?.command || "";
      if (!isReadOnlyBash(command)) {
        output.status = "deny";
        output.reason = `step:${effectiveStep.name || "planning"}:read_only:mutable_bash`;
        return;
      }
    }

    // Restrict task delegation
    if (tool === "task") {
      const targetAgent = input.agent || input.target || "";
      if (!isAllowedPlanningDelegate(targetAgent)) {
        output.status = "deny";
        output.reason = `step:${effectiveStep.name || "planning"}:read_only:forbidden_delegate:${targetAgent}`;
        return;
      }
    }
  };
}
