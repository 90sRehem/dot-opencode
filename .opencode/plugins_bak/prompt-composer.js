/**
 * Compose the effective system prompt for a step.
 *
 * Resolution order: prepend + base agent prompt + append
 *
 * @param {object} effectiveStep - Resolved step config
 * @param {string} baseAgentPrompt - Base agent prompt from .md file (after frontmatter)
 * @returns {string} Composed system prompt
 */
export function composePrompt(effectiveStep, baseAgentPrompt) {
  const parts = [];

  if (effectiveStep.prompt?.prepend) {
    parts.push(effectiveStep.prompt.prepend);
  }

  if (baseAgentPrompt) {
    parts.push(baseAgentPrompt);
  }

  if (effectiveStep.prompt?.append) {
    parts.push(effectiveStep.prompt.append);
  }

  return parts.join("\n\n");
}

/**
 * Extract the base agent prompt from an agent .md file.
 * Returns content after the frontmatter block.
 *
 * @param {string} content - Full .md file content
 * @returns {string} Base prompt (content after ---)
 */
export function extractBasePrompt(content) {
  const match = content.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)$/);
  return match ? match[1].trim() : content.trim();
}

/**
 * Generate a read-only system reminder for planning steps.
 * @returns {string} System reminder text
 */
export function planningReadOnlyReminder() {
  return [
    "[SYSTEM] You are in PLANNING MODE.",
    "This step is READ-ONLY. You MUST NOT:",
    "- Edit any files",
    "- Write any files",
    "- Run mutable shell commands",
    "",
    "You MAY:",
    "- Read files",
    "- Search code (grep/glob)",
    "- Ask the user questions",
    "- Delegate read-only agents (scout only)",
    "",
    "Any attempt to mutate the workspace will be blocked by the runtime policy layer.",
  ].join("\n");
}

/**
 * Compose gate context block for injection into system prompt.
 *
 * Generates a compact block describing gates from the active workflow.
 * Herald reads this block to customize gate presentation (question text, header, mode).
 *
 * @param {object} gates - Map of gate ID → { mode, header?, question? }
 * @param {string|null} currentGate - The gate_after of the current step (e.g. "G1")
 * @returns {string|null} Formatted block, or null if no gates
 */
export function composeGateContext(gates, currentGate) {
  if (!gates || typeof gates !== "object") return null;

  const entries = Object.entries(gates);
  if (entries.length === 0) return null;

  const lines = ["[WORKFLOW GATES]"];

  for (const [gateId, gateDef] of entries) {
    if (!gateDef || typeof gateDef !== "object") continue;

    const parts = [];
    parts.push(`  mode: ${gateDef.mode}`);
    if (gateDef.header) parts.push(`  header: ${gateDef.header}`);
    if (gateDef.question) parts.push(`  question: ${gateDef.question}`);

    if (parts.length > 0) {
      lines.push(`${gateId}:`);
      lines.push(...parts);
    }
  }

  // Mark the current gate for context
  if (currentGate && gates[currentGate]) {
    lines.push(`# ACTIVE GATE: ${currentGate}`);
  }

  lines.push("[/WORKFLOW GATES]");

  return lines.join("\n");
}

/**
 * Compose skills context block for injection into system prompt.
 *
 * Tells the agent to load listed skills via the skill tool at step start.
 *
 * @param {string[]} skills - Array of skill names
 * @returns {string|null} Formatted block, or null if empty
 */
export function composeSkillsContext(skills) {
  if (!skills || !Array.isArray(skills) || skills.length === 0) return null;

  const lines = [
    "[WORKFLOW SKILLS]",
    "Load the following skills at the start of this step using the skill tool:",
    ...skills.map((s) => `  - ${s}`),
    "[/WORKFLOW SKILLS]",
  ];

  return lines.join("\n");
}
