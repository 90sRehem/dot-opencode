/**
 * Permission enforcement for workflow steps.
 *
 * Blocks tools denied by step permissions via the permission.ask hook.
 * Returns structured denial reasons tied to the active step.
 */

/**
 * Check task delegation permission against nested task permissions.
 *
 * @param {object} taskPermissions - Task permission object { agentName: "allow"|"deny", "*": "allow"|"deny" }
 * @param {object} [taskMeta] - { agent: string }
 * @returns {{ allowed: boolean, reason?: string }}
 */
function checkTaskDelegation(taskPermissions, taskMeta) {
  if (!taskMeta?.agent) return { allowed: true };

  // Check specific agent permission
  if (taskPermissions[taskMeta.agent] !== undefined) {
    const allowed = taskPermissions[taskMeta.agent] === "allow";
    return {
      allowed,
      reason: allowed
        ? undefined
        : `step permission denies task delegation to: ${taskMeta.agent}`,
    };
  }

  // Check wildcard
  if (taskPermissions["*"] !== undefined) {
    const allowed = taskPermissions["*"] === "allow";
    return {
      allowed,
      reason: allowed
        ? undefined
        : `step permission denies task delegation (wildcard)`,
    };
  }

  return { allowed: true };
}

/**
 * Check if a tool is allowed by the effective step permissions.
 *
 * @param {string} tool - Tool name (edit, write, bash, read, glob, grep, skill, question, task)
 * @param {object|null} permissions - Effective permissions for the step
 * @param {object} [taskMeta] - Task metadata { agent: string } for task delegation checks
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function checkToolPermission(tool, permissions, taskMeta) {
  if (!permissions) return { allowed: true };

  // Normalize tool name
  const toolLower = tool.toLowerCase();

  // Check direct tool permission
  if (permissions[toolLower] !== undefined) {
    const perm = permissions[toolLower];

    // Task delegation has nested structure
    if (toolLower === "task" && typeof perm === "object") {
      return checkTaskDelegation(perm, taskMeta);
    }

    const allowed = perm === "allow";
    return {
      allowed,
      reason: allowed
        ? undefined
        : `step permission denies tool: ${toolLower}`,
    };
  }

  // Tool not listed in permissions — allow by default
  return { allowed: true };
}

/**
 * Create a permission.ask hook for a given effective step.
 *
 * @param {object} effectiveStep - Resolved step config with permissions
 * @returns {Function} permission.ask hook handler
 */
export function createPermissionHook(effectiveStep) {
  return async (input, output) => {
    const tool = input.tool || input.type || "";
    const taskMeta =
      tool === "task" ? { agent: input.agent || input.target || "" } : undefined;

    const result = checkToolPermission(tool, effectiveStep.permissions, taskMeta);

    if (!result.allowed) {
      output.status = "deny";
      // Attach structured denial reason
      output.reason = `step:${effectiveStep.name || "unnamed"}:${result.reason}`;
    }
  };
}

/**
 * Create a tool.execute.before hook for step budget tracking.
 *
 * @param {object} state - Plugin state with step budget tracking
 * @returns {Function} tool.execute.before hook handler
 */
export function createToolBeforeHook(state) {
  return async (input, output) => {
    if (!state.activeStep) return;

    const step = state.activeStep;
    const tool = input.tool;

    // Skip budget tracking for non-mutating tools
    const mutatingTools = ["edit", "write", "bash"];
    if (!mutatingTools.includes(tool)) return;

    // Increment step usage counter
    if (!state.stepUsage) state.stepUsage = 0;
    state.stepUsage++;

    // Check budget
    if (step.maximum_steps && state.stepUsage > step.maximum_steps) {
      // Block the tool call
      output.args = {
        ...output.args,
        _blocked: true,
        _reason: `step:${step.name || "unnamed"}:budget_exhausted:${state.stepUsage}/${step.maximum_steps}`,
      };
    }
  };
}
