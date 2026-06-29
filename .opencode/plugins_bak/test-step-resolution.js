/**
 * Test: Effective step resolution
 *
 * Verifies that step overrides correctly take precedence over agent defaults.
 */

import { resolveStep, resolveWorkflow, loadAgentDefaults } from "./step-resolver.js";
import { composePrompt, extractBasePrompt, planningReadOnlyReminder } from "./prompt-composer.js";
import { validateWorkflow } from "./validator.js";

let passed = 0;
let failed = 0;

function assert(condition, description) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${description}`);
  } else {
    failed++;
    console.error(`  ✗ ${description}`);
  }
}

console.log("Test: Effective step resolution\n");

// --- Agent defaults ---

console.log("1. loadAgentDefaults");

const scoutDefaults = loadAgentDefaults(
  "/home/rehem/.config/opencode/agents",
  "scout"
);
assert(
  scoutDefaults.model === "opencode-go/deepseek-v4-flash",
  "scout model loaded from frontmatter"
);
assert(
  scoutDefaults.permissions !== null,
  "scout permissions loaded"
);
assert(
  scoutDefaults.permissions.write === "deny",
  "scout write permission is deny"
);
assert(
  scoutDefaults.permissions.edit === "deny",
  "scout edit permission is deny"
);

const sageDefaults = loadAgentDefaults(
  "/home/rehem/.config/opencode/agents",
  "sage"
);
assert(
  sageDefaults.model === "opencode-go/qwen3.6-plus",
  "sage model loaded from frontmatter"
);
assert(
  sageDefaults.steps === 16,
  "sage steps loaded from frontmatter"
);

// --- Step resolution ---

console.log("\n2. resolveStep — model override");

const stepWithModel = {
  name: "test-step",
  agent: "scout",
  gate_after: "G1",
  model: "openai/gpt-4o",
};

const resolved1 = resolveStep(stepWithModel, scoutDefaults);
assert(
  resolved1.model === "openai/gpt-4o",
  "step model overrides agent default"
);
assert(
  resolved1.agent === "scout",
  "agent preserved"
);
assert(
  resolved1.name === "test-step",
  "step name preserved"
);

console.log("\n3. resolveStep — model inheritance");

const stepWithoutModel = {
  name: "test-step",
  agent: "scout",
  gate_after: "G1",
};

const resolved2 = resolveStep(stepWithoutModel, scoutDefaults);
assert(
  resolved2.model === "opencode-go/deepseek-v4-flash",
  "agent default model used when step has no model"
);

console.log("\n4. resolveStep — permissions override");

const stepWithPerms = {
  name: "planning",
  agent: "sage",
  gate_after: "G1",
  permissions: {
    edit: "deny",
    write: "deny",
    bash: "deny",
    read: "allow",
  },
};

const resolved3 = resolveStep(stepWithPerms, sageDefaults);
assert(
  resolved3.permissions.edit === "deny",
  "step permissions override agent default (edit)"
);
assert(
  resolved3.permissions.read === "allow",
  "step permissions override agent default (read)"
);

console.log("\n5. resolveStep — permissions inheritance");

const stepWithoutPerms = {
  name: "explore",
  agent: "scout",
  gate_after: "G1",
};

const resolved4 = resolveStep(stepWithoutPerms, scoutDefaults);
assert(
  resolved4.permissions.write === "deny",
  "agent default permissions used when step has no permissions"
);

console.log("\n6. resolveStep — prompt composition");

const stepWithPrompt = {
  name: "test-step",
  agent: "scout",
  gate_after: "G1",
  prompt: {
    prepend: "SYSTEM: Read-only mode",
    append: "Focus on architecture.",
  },
};

const resolved5 = resolveStep(stepWithPrompt, scoutDefaults);
assert(
  resolved5.prompt.prepend === "SYSTEM: Read-only mode",
  "prompt.prepend preserved"
);
assert(
  resolved5.prompt.append === "Focus on architecture.",
  "prompt.append preserved"
);

console.log("\n7. resolveStep — missing prompt fields");

const stepWithoutPrompt = {
  name: "test-step",
  agent: "scout",
  gate_after: "G1",
};

const resolved6 = resolveStep(stepWithoutPrompt, scoutDefaults);
assert(
  resolved6.prompt.prepend === "",
  "missing prompt.prepend treated as empty string"
);
assert(
  resolved6.prompt.append === "",
  "missing prompt.append treated as empty string"
);

console.log("\n8. resolveStep — maximum_steps override");

const stepWithBudget = {
  name: "test-step",
  agent: "scout",
  gate_after: "G1",
  maximum_steps: 5,
};

const resolved7 = resolveStep(stepWithBudget, scoutDefaults);
assert(
  resolved7.maximum_steps === 5,
  "step maximum_steps overrides agent default"
);

const stepWithoutBudget = {
  name: "test-step",
  agent: "sage",
  gate_after: "G1",
};

const resolved8 = resolveStep(stepWithoutBudget, sageDefaults);
assert(
  resolved8.maximum_steps === 16,
  "agent default steps used when step has no maximum_steps"
);

// --- Prompt composer ---

console.log("\n9. composePrompt — full composition");

const composed = composePrompt(
  { prompt: { prepend: "BEFORE", append: "AFTER" } },
  "BASE PROMPT"
);
assert(
  composed === "BEFORE\n\nBASE PROMPT\n\nAFTER",
  "prompt is prepend + base + append"
);

console.log("\n10. composePrompt — prepend only");

const composed2 = composePrompt(
  { prompt: { prepend: "BEFORE", append: "" } },
  "BASE PROMPT"
);
assert(
  composed2 === "BEFORE\n\nBASE PROMPT",
  "prepend only: prepend + base"
);

console.log("\n11. composePrompt — append only");

const composed3 = composePrompt(
  { prompt: { prepend: "", append: "AFTER" } },
  "BASE PROMPT"
);
assert(
  composed3 === "BASE PROMPT\n\nAFTER",
  "append only: base + append"
);

console.log("\n12. composePrompt — no augmentations");

const composed4 = composePrompt(
  { prompt: { prepend: "", append: "" } },
  "BASE PROMPT"
);
assert(
  composed4 === "BASE PROMPT",
  "no augmentations: base prompt unchanged"
);

// --- Parallel agents ---

console.log("\n13. resolveWorkflow — parallel agents");

const wfWithParallel = {
  name: "test-wf",
  description: "test",
  scope: "medium",
  workflow_version: "2.0",
  steps: [
    {
      name: "planning",
      agent: "sage",
      gate_after: "G1",
      parallel_agents: [
        {
          name: "codebase-scout",
          agent: "scout",
          model: "openai/gpt-4o",
        },
        {
          name: "docs-scout",
          agent: "scout",
        },
      ],
    },
  ],
  gates: { G1: { mode: "required" } },
};

const resolvedSteps = resolveWorkflow(
  wfWithParallel,
  "/home/rehem/.config/opencode/agents"
);
const resolved9 = resolvedSteps[0];
assert(
  resolved9.parallel_agents.length === 2,
  "parallel agents resolved"
);
assert(
  resolved9.parallel_agents[0].name === "codebase-scout",
  "parallel agent 1 name preserved"
);
assert(
  resolved9.parallel_agents[0].model === "openai/gpt-4o",
  "parallel agent 1 model override"
);
assert(
  resolved9.parallel_agents[1].model === "opencode-go/deepseek-v4-flash",
  "parallel agent 2 inherits scout default model"
);

// --- Planning enforcement ---

console.log("\n14. planningReadOnlyReminder");

const reminder = planningReadOnlyReminder();
assert(
  reminder.includes("READ-ONLY"),
  "reminder mentions read-only"
);
assert(
  reminder.includes("MUST NOT"),
  "reminder includes prohibition"
);

// --- Validator ---

console.log("\n15. validateWorkflow — valid workflow");

const validWf = {
  workflow_version: "2.0",
  name: "Test",
  description: "Test workflow",
  scope: "medium",
  steps: [
    { name: "step-1", agent: "scout", gate_after: "G1" },
    { name: "step-2", agent: "forge", gate_after: "G6" },
  ],
  gates: { G1: { mode: "required" }, G6: { mode: "required" } },
};

const result1 = validateWorkflow(validWf, "test");
assert(result1.valid === true, "valid workflow passes validation");
assert(result1.errors.length === 0, "no errors for valid workflow");

console.log("\n16. validateWorkflow — duplicate step names");

const dupeWf = {
  workflow_version: "2.0",
  name: "Test",
  description: "Test workflow",
  scope: "medium",
  steps: [
    { name: "step-1", agent: "scout", gate_after: "G1" },
    { name: "step-1", agent: "forge", gate_after: "G6" },
  ],
  gates: { G1: { mode: "required" }, G6: { mode: "required" } },
};

const result2 = validateWorkflow(dupeWf, "test");
assert(result2.valid === false, "duplicate step names fail validation");
assert(
  result2.errors.some((e) => e.includes("Duplicate step name")),
  "error mentions duplicate step name"
);

console.log("\n17. validateWorkflow — duplicate parallel agent names");

const dupePAWf = {
  workflow_version: "2.0",
  name: "Test",
  description: "Test workflow",
  scope: "medium",
  steps: [
    {
      name: "step-1",
      agent: "sage",
      gate_after: "G1",
      parallel_agents: [
        { name: "helper", agent: "scout" },
        { name: "helper", agent: "scout" },
      ],
    },
  ],
  gates: { G1: { mode: "required" } },
};

const result3 = validateWorkflow(dupePAWf, "test");
assert(
  result3.valid === false,
  "duplicate parallel agent names fail validation"
);
assert(
  result3.errors.some((e) => e.includes("Duplicate parallel agent")),
  "error mentions duplicate parallel agent name"
);

// --- Summary ---

console.log(`\n--- Results ---`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log("\nAll tests passed!");
}
