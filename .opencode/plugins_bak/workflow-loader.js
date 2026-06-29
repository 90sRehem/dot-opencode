import { existsSync, readdirSync, readFileSync } from "fs";
import { join, resolve } from "path";

/**
 * Strip JSONC comments (// and /* *\/) then parse.
 */
function parseJsonc(raw) {
  const stripped = raw
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
  return JSON.parse(stripped);
}

/**
 * Load all .jsonc workflow files from a directory.
 * Returns a Map<name, workflowDef>.
 */
function loadWorkflowsFromDir(dir) {
  const workflows = new Map();
  if (!existsSync(dir)) return workflows;

  const files = readdirSync(dir).filter((f) => f.endsWith(".jsonc"));

  for (const file of files) {
    try {
      const raw = readFileSync(join(dir, file), "utf-8");
      const def = parseJsonc(raw);
      if (def && def.name) {
        workflows.set(def.name, def);
      }
    } catch (err) {
      console.error(`[workflow-loader] Failed to load ${file}:`, err.message);
    }
  }

  return workflows;
}

/**
 * Load and merge workflows from global and project directories.
 * Project workflows override global workflows when names collide.
 *
 * Scan order (project overrides global):
 * 1. ~/.config/opencode/workflows/        (global .opencode convention)
 * 2. ~/.config/opencode/.agents/workflows/ (global .agents convention)
 * 3. <cwd>/.opencode/workflows/            (project .opencode convention)
 * 4. <cwd>/.agents/workflows/              (project .agents convention)
 *
 * @param {string} globalDir - Global workflows directory (e.g. ~/.config/opencode/workflows)
 * @param {string} projectDir - Project workflows directory (e.g. .opencode/workflows)
 * @param {string} [agentsDir] - Root directory for .agents/workflows resolution
 * @returns {Map<string, object>} Resolved workflow definitions keyed by name
 */
export function loadWorkflows(globalDir, projectDir, agentsDir) {
  const global = loadWorkflowsFromDir(globalDir);
  const project = loadWorkflowsFromDir(projectDir);

  // Also scan .agents/workflows/ directories (standard convention)
  const globalAgents = agentsDir
    ? loadWorkflowsFromDir(join(agentsDir, ".agents", "workflows"))
    : new Map();

  // Resolve project .agents/workflows relative to cwd's parent structure
  // Walk up from projectDir looking for .agents/workflows/
  let projectAgents = new Map();
  if (agentsDir) {
    // agentsDir is typically the directory containing .agents/
    projectAgents = loadWorkflowsFromDir(join(agentsDir, ".agents", "workflows"));
  }

  // Merge order: global .opencode → global .agents → project .opencode → project .agents
  // Later entries override earlier ones on name collision
  const merged = new Map([...global, ...globalAgents, ...project, ...projectAgents]);
  return merged;
}

/**
 * Get the default global workflows path.
 */
export function getGlobalWorkflowsDir() {
  const home = process.env.HOME || process.env.USERPROFILE;
  return join(home, ".config", "opencode", "workflows");
}

/**
 * Get the project workflows path relative to a working directory.
 */
export function getProjectWorkflowsDir(workingDir) {
  return join(workingDir, ".opencode", "workflows");
}
