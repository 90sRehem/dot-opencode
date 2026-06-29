/**
 * Parallel agent lifecycle tracker.
 *
 * Manages parallel agent instances within a step:
 * - Registers parallel agents when step starts
 * - Tracks state (running, completed, cancelled)
 * - Cancels remaining agents on parent step completion
 * - Enforces maximum_steps per parallel agent instance
 */

/**
 * @typedef {object} ParallelAgentInstance
 * @property {string} name - Unique identifier within parent step
 * @property {string} agent - Agent type (scout, sage, etc.)
 * @property {string} state - "running" | "completed" | "cancelled"
 * @property {number} usage - Current tool call count
 * @property {number|null} maxSteps - Maximum allowed tool calls
 * @property {object} effectiveConfig - Resolved config for this parallel agent
 */

/**
 * @typedef {object} StepLifecycle
 * @property {string} stepName - Parent step name
 * @property {Map<string, ParallelAgentInstance>} agents - Parallel agent instances
 * @property {string} state - "running" | "completed"
 */

/**
 * Create a new parallel agent tracker.
 *
 * @returns {object} Tracker with methods to manage parallel agent lifecycle
 */
export function createParallelTracker() {
  /** @type {Map<string, StepLifecycle>} stepName → lifecycle */
  const steps = new Map();

  return {
    /**
     * Register parallel agents for a step.
     * Called when a step with parallel_agents starts.
     *
     * @param {string} stepName - Parent step name
     * @param {object[]} resolvedParallelAgents - Resolved parallel agent configs
     * @throws {Error} If duplicate agent names within the same step
     */
    registerStep(stepName, resolvedParallelAgents) {
      const agentMap = new Map();

      for (const pa of resolvedParallelAgents) {
        if (agentMap.has(pa.name)) {
          throw new Error(
            `Duplicate parallel agent name "${pa.name}" in step "${stepName}"`
          );
        }
        agentMap.set(pa.name, {
          name: pa.name,
          agent: pa.agent,
          state: "running",
          usage: 0,
          maxSteps: pa.maximum_steps,
          effectiveConfig: pa,
        });
      }

      steps.set(stepName, {
        stepName,
        agents: agentMap,
        state: "running",
      });
    },

    /**
     * Check if a parallel agent name is valid within a step.
     *
     * @param {string} stepName - Parent step name
     * @param {string} agentName - Parallel agent name
     * @returns {boolean}
     */
    isParallelAgent(stepName, agentName) {
      const lifecycle = steps.get(stepName);
      return lifecycle ? lifecycle.agents.has(agentName) : false;
    },

    /**
     * Get a parallel agent instance.
     *
     * @param {string} stepName - Parent step name
     * @param {string} agentName - Parallel agent name
     * @returns {ParallelAgentInstance|null}
     */
    getAgent(stepName, agentName) {
      const lifecycle = steps.get(stepName);
      return lifecycle ? lifecycle.agents.get(agentName) || null : null;
    },

    /**
     * Increment tool usage for a parallel agent.
     *
     * @param {string} stepName - Parent step name
     * @param {string} agentName - Parallel agent name
     * @returns {{ allowed: boolean, usage: number, maxSteps: number|null }}
     */
    trackUsage(stepName, agentName) {
      const agent = this.getAgent(stepName, agentName);
      if (!agent) return { allowed: false, usage: 0, maxSteps: null };

      agent.usage++;

      const allowed = !agent.maxSteps || agent.usage <= agent.maxSteps;
      return {
        allowed,
        usage: agent.usage,
        maxSteps: agent.maxSteps,
      };
    },

    /**
     * Mark a parallel agent as completed.
     *
     * @param {string} stepName - Parent step name
     * @param {string} agentName - Parallel agent name
     */
    completeAgent(stepName, agentName) {
      const agent = this.getAgent(stepName, agentName);
      if (agent) {
        agent.state = "completed";
      }
    },

    /**
     * Mark parent step as completed, cancelling all remaining parallel agents.
     * Called when the parent step finishes.
     *
     * @param {string} stepName - Parent step name
     * @returns {ParallelAgentInstance[]} List of cancelled agents
     */
    completeStep(stepName) {
      const lifecycle = steps.get(stepName);
      if (!lifecycle) return [];

      lifecycle.state = "completed";
      const cancelled = [];

      for (const [, agent] of lifecycle.agents) {
        if (agent.state === "running") {
          agent.state = "cancelled";
          cancelled.push(agent);
        }
      }

      return cancelled;
    },

    /**
     * Check if a step is in planning mode (all agents should be read-only).
     *
     * @param {string} stepName - Parent step name
     * @returns {boolean}
     */
    isPlanningStep(stepName) {
      const lifecycle = steps.get(stepName);
      if (!lifecycle) return false;

      // Check if parent step agent is a planning agent
      // This is checked externally via isPlanningStep from planning-enforcer
      return false;
    },

    /**
     * Get all running parallel agents for a step.
     *
     * @param {string} stepName - Parent step name
     * @returns {ParallelAgentInstance[]}
     */
    getRunningAgents(stepName) {
      const lifecycle = steps.get(stepName);
      if (!lifecycle) return [];

      return Array.from(lifecycle.agents.values()).filter(
        (a) => a.state === "running"
      );
    },

    /**
     * Remove a step lifecycle (cleanup after step is fully done).
     *
     * @param {string} stepName - Parent step name
     */
    removeStep(stepName) {
      steps.delete(stepName);
    },
  };
}
