/**
 * Workflow validator.
 *
 * Validates workflow definitions before runtime.
 * Runs on plugin init, not per step transition.
 *
 * Validation rules:
 * - Duplicate step names → error
 * - Duplicate parallel agent names within step → error
 * - Unknown agent references → warning (non-fatal)
 * - Missing prompt fields → treated as empty string (no error)
 */

const VALID_AGENTS = ["scout", "sage", "forge", "ward", "arbiter"];
const VALID_GATES = ["G0", "G1", "G2", "G3", "G4", "G5", "G6"];

/**
 * @typedef {object} ValidationResult
 * @property {string[]} errors - Fatal validation errors
 * @property {string[]} warnings - Non-fatal warnings
 * @property {boolean} valid - True if no errors
 */

/**
 * Validate a single workflow definition.
 *
 * @param {object} workflow - Workflow definition object
 * @param {string} [workflowName] - Workflow name for error context
 * @returns {ValidationResult}
 */
export function validateWorkflow(workflow, workflowName) {
  const errors = [];
  const warnings = [];
  const context = workflowName || workflow.name || "unnamed";

  // Validate required fields
  if (!workflow.workflow_version) {
    errors.push(`[${context}] Missing required field: workflow_version`);
  }
  if (!workflow.name) {
    errors.push(`[${context}] Missing required field: name`);
  }
  if (!workflow.description) {
    errors.push(`[${context}] Missing required field: description`);
  }
  if (!Array.isArray(workflow.steps) || workflow.steps.length === 0) {
    errors.push(`[${context}] Missing or empty steps array`);
  }
  if (!workflow.gates || typeof workflow.gates !== "object") {
    errors.push(`[${context}] Missing required field: gates`);
  }

  // Validate gates
  if (workflow.gates && typeof workflow.gates === "object") {
    for (const [gateId, gateDef] of Object.entries(workflow.gates)) {
      if (!VALID_GATES.includes(gateId)) {
        errors.push(`[${context}] gates: Invalid gate key "${gateId}". Valid: ${VALID_GATES.join(", ")}`);
        continue;
      }
      if (!gateDef || typeof gateDef !== "object") {
        errors.push(`[${context}] gates.${gateId}: Must be an object`);
        continue;
      }
      // mode is required
      if (!gateDef.mode) {
        errors.push(`[${context}] gates.${gateId}: Missing required field: mode`);
      } else {
        const validModes = ["required", "optional", "disabled"];
        if (!validModes.includes(gateDef.mode)) {
          errors.push(`[${context}] gates.${gateId}.mode: Must be one of: ${validModes.join(", ")}`);
        }
        if (gateId === "G6" && gateDef.mode === "disabled") {
          errors.push(`[${context}] gates.G6: Cannot be disabled (G6 is always mandatory)`);
        }
      }
      if (gateDef.header !== undefined && typeof gateDef.header !== "string") {
        errors.push(`[${context}] gates.${gateId}.header: Must be a string`);
      }
      if (gateDef.question !== undefined && typeof gateDef.question !== "string") {
        errors.push(`[${context}] gates.${gateId}.question: Must be a string`);
      }
    }
  }

  // Validate steps
  if (Array.isArray(workflow.steps)) {
    const stepNames = new Set();

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      const stepContext = `[${context}] Step ${i}`;

      // Required step fields
      if (!step.agent) {
        errors.push(`${stepContext}: Missing required field: agent`);
      } else if (!VALID_AGENTS.includes(step.agent)) {
        errors.push(
          `${stepContext}: Unknown agent "${step.agent}". Valid: ${VALID_AGENTS.join(", ")}`
        );
      }

      if (!step.gate_after && step.gate_after !== null) {
        errors.push(`${stepContext}: Missing required field: gate_after`);
      } else if (step.gate_after !== null && !VALID_GATES.includes(step.gate_after)) {
        errors.push(
          `${stepContext}: Invalid gate "${step.gate_after}". Valid: ${VALID_GATES.join(", ")}`
        );
      }

      // Cross-check: gate_after must be declared in workflow.gates
      if (step.gate_after !== null && workflow.gates && typeof workflow.gates === "object") {
        if (!workflow.gates[step.gate_after]) {
          errors.push(
            `${stepContext}: gate_after "${step.gate_after}" not declared in workflow.gates`
          );
        }
      }

      // Duplicate step names
      if (step.name) {
        if (stepNames.has(step.name)) {
          errors.push(`${stepContext}: Duplicate step name "${step.name}"`);
        }
        stepNames.add(step.name);
      }

      // Validate parallel agents
      if (Array.isArray(step.parallel_agents)) {
        const paNames = new Set();

        for (const pa of step.parallel_agents) {
          if (!pa.name) {
            errors.push(`${stepContext}: Parallel agent missing name`);
            continue;
          }

          if (!pa.agent) {
            errors.push(
              `${stepContext}: Parallel agent "${pa.name}" missing agent`
            );
          } else if (!VALID_AGENTS.includes(pa.agent)) {
            errors.push(
              `${stepContext}: Parallel agent "${pa.name}" has unknown agent "${pa.agent}"`
            );
          }

          // Duplicate parallel agent names
          if (paNames.has(pa.name)) {
            errors.push(
              `${stepContext}: Duplicate parallel agent name "${pa.name}"`
            );
          }
          paNames.add(pa.name);
        }
      }

      // Validate permissions structure
      if (step.permissions !== null && step.permissions !== undefined) {
        if (typeof step.permissions !== "object") {
          errors.push(`${stepContext}: permissions must be an object or null`);
        }
      }

      // Validate model
      if (step.model !== null && step.model !== undefined) {
        if (typeof step.model !== "string") {
          errors.push(`${stepContext}: model must be a string or null`);
        }
      }

      // Validate maximum_steps
      if (step.maximum_steps !== null && step.maximum_steps !== undefined) {
        if (
          typeof step.maximum_steps !== "number" ||
          step.maximum_steps < 1
        ) {
          errors.push(
            `${stepContext}: maximum_steps must be a positive integer or null`
          );
        }
      }

      // Validate prompt structure
      if (step.prompt !== null && step.prompt !== undefined) {
        if (typeof step.prompt !== "object") {
          errors.push(`${stepContext}: prompt must be an object`);
        } else {
          if (
            step.prompt.prepend !== undefined &&
            typeof step.prompt.prepend !== "string"
          ) {
            errors.push(`${stepContext}: prompt.prepend must be a string`);
          }
          if (
            step.prompt.append !== undefined &&
            typeof step.prompt.append !== "string"
          ) {
            errors.push(`${stepContext}: prompt.append must be a string`);
          }
        }
      }
    }
  }

  return {
    errors,
    warnings,
    valid: errors.length === 0,
  };
}

/**
 * Validate multiple workflows.
 *
 * @param {Map<string, object>} workflows - Map of workflow definitions
 * @returns {ValidationResult} Combined result
 */
export function validateAll(workflows) {
  const allErrors = [];
  const allWarnings = [];

  for (const [name, wf] of workflows) {
    const result = validateWorkflow(wf, name);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  }

  return {
    errors: allErrors,
    warnings: allWarnings,
    valid: allErrors.length === 0,
  };
}
