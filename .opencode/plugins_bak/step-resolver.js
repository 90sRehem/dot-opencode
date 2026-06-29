import { readFileSync, existsSync } from "fs";
import { join } from "path";

/**
 * Parse YAML-like frontmatter from agent .md files.
 * Extracts the YAML block between --- delimiters.
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const yaml = match[1];
  const result = {};
  let currentKey = null;
  let currentValue = "";
  let indent = 0;

  for (const line of yaml.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const keyMatch = trimmed.match(/^(\w+):(.*)$/);
    if (keyMatch) {
      if (currentKey) {
        result[currentKey] = parseValue(currentValue.trim());
      }
      currentKey = keyMatch[1];
      currentValue = keyMatch[2].trim();
      indent = line.search(/\S/);
    } else if (currentKey) {
      currentValue += " " + trimmed;
    }
  }

  if (currentKey) {
    result[currentKey] = parseValue(currentValue.trim());
  }

  return result;
}

function parseValue(val) {
  if (val === "true") return true;
  if (val === "false") return false;
  if (val === "null" || val === "~") return null;
  return val.replace(/^["']|["']$/g, "");
}

/**
 * Parse nested YAML-like structures (permission blocks).
 * Simple key: value parser for nested permission objects.
 */
function parsePermissionBlock(lines) {
  const result = {};
  let currentKey = null;
  let nestedObj = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "permission:") continue;

    const kvMatch = trimmed.match(/^(\w+):\s*(.*)$/);
    if (kvMatch) {
      const [, key, value] = kvMatch;
      if (value) {
        // Simple key: value
        if (currentKey && nestedObj) {
          result[currentKey] = nestedObj;
          nestedObj = null;
        }
        result[key] = value.replace(/^["']|["']$/g, "");
        currentKey = null;
      } else {
        // Nested object start
        if (currentKey && nestedObj) {
          result[currentKey] = nestedObj;
        }
        currentKey = key;
        nestedObj = {};
      }
    } else if (currentKey && nestedObj) {
      const nestedKv = trimmed.match(/^(\w+):\s*(.*)$/);
      if (nestedKv) {
        nestedObj[nestedKv[1]] = nestedKv[2].replace(/^["']|["']$/g, "");
      }
    }
  }

  if (currentKey && nestedObj) {
    result[currentKey] = nestedObj;
  }

  return result;
}

/**
 * Load agent frontmatter from .md file.
 * @param {string} agentsDir - Directory containing agent .md files
 * @param {string} agentName - Agent name (scout, sage, forge, ward, arbiter)
 * @returns {object} Agent defaults (model, steps, permissions)
 */
export function loadAgentDefaults(agentsDir, agentName) {
  const filePath = join(agentsDir, `${agentName}.md`);
  if (!existsSync(filePath)) {
    return { model: null, steps: null, permissions: null };
  }

  const content = readFileSync(filePath, "utf-8");
  const fm = parseFrontmatter(content);

  // Extract permission block more carefully
  const permMatch = content.match(/permission:\n((?:\s+\w+:.*\n?)+)/);
  let permissions = null;
  if (permMatch) {
    const permLines = permMatch[1].split("\n").filter((l) => l.trim());
    permissions = parsePermissionBlock(permLines);
  }

  return {
    model: fm.model || null,
    steps: fm.steps ? parseInt(fm.steps, 10) : null,
    permissions,
  };
}

/**
 * Resolve effective step configuration.
 * Resolution order: step overrides > agent frontmatter defaults.
 *
 * @param {object} step - Step definition from workflow
 * @param {object} agentDefaults - Agent defaults from frontmatter
 * @returns {object} EffectiveStep with resolved config
 */
export function resolveStep(step, agentDefaults) {
  return {
    name: step.name || null,
    agent: step.agent,
    gate_after: step.gate_after,
    skip_on: step.skip_on || null,

    // Model: step > agent default
    model: step.model ?? agentDefaults.model ?? null,

    // Permissions: step (full overwrite) > agent default
    permissions: step.permissions ?? agentDefaults.permissions ?? null,

    // Maximum steps: step > agent default
    maximum_steps: step.maximum_steps ?? agentDefaults.steps ?? null,

    // Prompt composition: prepend + base + append
    prompt: {
      prepend: step.prompt?.prepend || "",
      append: step.prompt?.append || "",
    },

    // Parallel agents resolved separately in resolveWorkflow (need agent cache)
    parallel_agents: [],

    // Skills to load for this step
    skills: step.skills || [],
  };
}

/**
 * Resolve a parallel agent's effective config.
 */
function resolveParallelAgent(pa, agentDefaults, agentCache, agentsDir) {
  // Parallel agent gets its own agent defaults (not parent's)
  let paDefaults = agentDefaults;
  if (agentCache && agentsDir && pa.agent) {
    if (!agentCache.has(pa.agent)) {
      agentCache.set(pa.agent, loadAgentDefaults(agentsDir, pa.agent));
    }
    paDefaults = agentCache.get(pa.agent);
  }

  return {
    name: pa.name,
    agent: pa.agent,
    model: pa.model ?? paDefaults.model ?? null,
    permissions: pa.permissions ?? paDefaults.permissions ?? null,
    maximum_steps: pa.maximum_steps ?? paDefaults.steps ?? null,
    prompt: {
      prepend: pa.prompt?.prepend || "",
      append: pa.prompt?.append || "",
    },

    skills: pa.skills || [],
  };
}

/**
 * Resolve all steps in a workflow.
 * @param {object} workflow - Workflow definition
 * @param {string} agentsDir - Directory containing agent .md files
 * @returns {object[]} Array of resolved EffectiveStep objects
 */
export function resolveWorkflow(workflow, agentsDir) {
  const agentCache = new Map();

  return workflow.steps.map((step) => {
    if (!agentCache.has(step.agent)) {
      agentCache.set(step.agent, loadAgentDefaults(agentsDir, step.agent));
    }
    const defaults = agentCache.get(step.agent);
    const resolved = resolveStep(step, defaults);

    // Re-resolve parallel agents with their own agent defaults
    resolved.parallel_agents = (step.parallel_agents || []).map((pa) =>
      resolveParallelAgent(pa, defaults, agentCache, agentsDir)
    );

    return resolved;
  });
}
