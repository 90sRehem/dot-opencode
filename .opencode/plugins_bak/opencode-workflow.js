/**
 * opencode-workflow — Plugin Control Plane
 *
 * Deterministic workflow orchestration via structured config.
 * Replaces prompt-driven routing with data-driven step execution.
 *
 * Hooks:
 * - permission.ask: enforce step permissions
 * - experimental.chat.system.transform: inject prompt augmentations
 * - tool.execute.before: track step budget, enforce parallel agent limits
 * - chat.params: override model selection per step
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import {
  loadWorkflows,
  getGlobalWorkflowsDir,
  getProjectWorkflowsDir,
} from "./workflow-loader.js";
import { resolveWorkflow, loadAgentDefaults } from "./step-resolver.js";
import { composePrompt, extractBasePrompt, planningReadOnlyReminder, composeGateContext, composeSkillsContext } from "./prompt-composer.js";
import { createPermissionHook, createToolBeforeHook } from "./permission-enforcer.js";
import { isPlanningStep } from "./planning-enforcer.js";
import { createParallelTracker } from "./parallel-tracker.js";
import { validateWorkflow } from "./validator.js";

/**
 * Read agent prompt from .md file (content after frontmatter).
 */
function readAgentPrompt(agentsDir, agentName) {
  const filePath = join(agentsDir, `${agentName}.md`);
  if (!existsSync(filePath)) return "";
  const content = readFileSync(filePath, "utf-8");
  return extractBasePrompt(content);
}

/**
 * Main plugin export.
 */
export const OpenCodeWorkflowPlugin = async (input, options) => {
  const { directory } = input;
  const agentsDir = join(directory, "agents");

  // Load and merge workflows
  const globalDir = getGlobalWorkflowsDir();
  const projectDir = getProjectWorkflowsDir(directory);
  const workflows = loadWorkflows(globalDir, projectDir, directory);

  // Validate all workflows using external validator
  const allErrors = [];
  for (const [name, wf] of workflows) {
    const result = validateWorkflow(wf, name);
    for (const err of result.errors) {
      allErrors.push(`Workflow "${name}": ${err}`);
    }
  }
  if (allErrors.length > 0) {
    console.error("[opencode-workflow] Validation errors:");
    allErrors.forEach((e) => console.error(`  - ${e}`));
  }

  // Resolve all workflows into effective steps
  const resolvedWorkflows = new Map();
  for (const [name, wf] of workflows) {
    resolvedWorkflows.set(name, {
      definition: wf,
      steps: resolveWorkflow(wf, agentsDir),
    });
  }

  // Plugin state
  const state = {
    activeWorkflow: null,
    activeStepIndex: 0,
    activeStep: null,
    stepUsage: 0,
    gates: null,
    resolvedWorkflows,
    workflows,
    parallelTracker: createParallelTracker(),
  };

  // Expose state for external access (e.g., runtime hooks)
  const getState = () => state;

  /**
   * Select a workflow by name and set the first step as active.
   */
  function selectWorkflow(name) {
    const resolved = resolvedWorkflows.get(name);
    if (!resolved) {
      console.error(`[opencode-workflow] Workflow "${name}" not found`);
      return null;
    }

    state.activeWorkflow = name;
    state.activeStepIndex = 0;
    state.activeStep = resolved.steps[0];
    state.stepUsage = 0;
    state.gates = resolved.definition.gates || null;

    // Register parallel agents for the first step
    if (state.activeStep.parallel_agents?.length > 0) {
      state.parallelTracker.registerStep(
        state.activeStep.name || `step-0`,
        state.activeStep.parallel_agents
      );
    }

    return state.activeStep;
  }

  /**
   * Advance to the next step in the active workflow.
   */
  function advanceStep() {
    const resolved = resolvedWorkflows.get(state.activeWorkflow);
    if (!resolved) return null;

    // Complete current step's parallel agents
    if (state.activeStep?.name) {
      state.parallelTracker.completeStep(state.activeStep.name);
    }

    state.activeStepIndex++;
    if (state.activeStepIndex >= resolved.steps.length) {
      state.activeStep = null;
      return null; // Workflow complete
    }

    state.activeStep = resolved.steps[state.activeStepIndex];
    state.stepUsage = 0;

    // Register parallel agents for new step
    if (state.activeStep.parallel_agents?.length > 0) {
      state.parallelTracker.registerStep(
        state.activeStep.name || `step-${state.activeStepIndex}`,
        state.activeStep.parallel_agents
      );
    }

    return state.activeStep;
  }

  /**
   * Get the current effective step config.
   */
  function getEffectiveStep() {
    return state.activeStep;
  }

  /**
   * Get all available workflow names.
   */
  function getWorkflowNames() {
    return Array.from(resolvedWorkflows.keys());
  }

  // Build permission hooks (combine base + planning enforcement)
  const basePermissionHook = createPermissionHook(state.activeStep || {});
  const planningHook = createPermissionHook(state.activeStep || {});

  return {
    // Expose workflow management API
    workflow: {
      selectWorkflow,
      advanceStep,
      getEffectiveStep,
      getWorkflowNames,
      getState,
    },

    // Permission enforcement
    "permission.ask": async (input, output) => {
      const step = state.activeStep;
      if (!step) return;

      // Planning steps: allow read-only operations (overrides step permissions)
      if (isPlanningStep(step)) {
        const tool = (input.tool || "").toLowerCase();
        const readOnlyTools = ["read", "glob", "grep", "question"];

        if (readOnlyTools.includes(tool)) {
          // Read-only tools always allowed on planning steps
          return;
        }

        if (tool === "bash") {
          const { isReadOnlyBash } = await import("./planning-enforcer.js");
          const command = input.command || input.args?.command || "";
          if (isReadOnlyBash(command)) {
            // Read-only bash allowed on planning steps
            return;
          }
        }
      }

      // Check base step permissions
      const baseHook = createPermissionHook(step);
      await baseHook(input, output);

      // If already denied, skip planning check
      if (output.status === "deny") return;

      // Check additional planning mode constraints (delegates, mutable bash)
      if (isPlanningStep(step)) {
        const planningHook = (await import("./planning-enforcer.js")).createPlanningPermissionHook(step);
        await planningHook(input, output);
      }
    },

    // Prompt augmentation via system transform
    "experimental.chat.system.transform": async (input, output) => {
      const step = state.activeStep;
      if (!step) return;

      const agentName = step.agent;
      const basePrompt = readAgentPrompt(agentsDir, agentName);
      let composed = composePrompt(step, basePrompt);

      // Prepend read-only reminder for planning steps
      if (isPlanningStep(step)) {
        composed = planningReadOnlyReminder() + "\n\n" + composed;
      }

      // Inject gates context block if active workflow has gates declared
      if (state.gates) {
        const gateContext = composeGateContext(state.gates, step.gate_after);
        if (gateContext) {
          composed = composed + "\n\n" + gateContext;
        }
      }

      // Inject skills context if step has skills declared
      if (step.skills?.length > 0) {
        const skillsContext = composeSkillsContext(step.skills);
        if (skillsContext) {
          composed = skillsContext + "\n\n" + composed;
        }
      }

      if (composed) {
        output.system = [...(output.system || []), composed];
      }
    },

    // Budget tracking and parallel agent enforcement
    "tool.execute.before": async (input, output) => {
      const step = state.activeStep;
      if (!step) return;

      const tool = input.tool;

      // Track step budget for mutating tools
      const mutatingTools = ["edit", "write", "bash"];
      if (mutatingTools.includes(tool)) {
        state.stepUsage++;

        if (step.maximum_steps && state.stepUsage > step.maximum_steps) {
          output.args = {
            ...output.args,
            _blocked: true,
            _reason: `step:${step.name || "unnamed"}:budget_exhausted:${state.stepUsage}/${step.maximum_steps}`,
          };
          return;
        }
      }
    },

    // Model override per step
    "chat.params": async (input, output) => {
      const step = state.activeStep;
      if (!step || !step.model) return;

      // Model override is handled at the step level
      // The actual model setting depends on the provider's format
      // For now, we store it in options for downstream consumption
      output.options = {
        ...output.options,
        _stepModel: step.model,
      };
    },
  };
};
