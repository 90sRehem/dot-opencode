/**
 * Test: Planning mode enforcement
 *
 * Verifies that planning steps correctly block mutable operations
 * and allow read-only operations.
 */

import {
  isPlanningStep,
  isReadOnlyBash,
  isAllowedPlanningDelegate,
} from "./planning-enforcer.js";
import { checkToolPermission } from "./permission-enforcer.js";

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

console.log("Test: Planning mode enforcement\n");

// --- isPlanningStep ---

console.log("1. isPlanningStep detection");

assert(
  isPlanningStep({ name: "planning", agent: "sage" }) === true,
  "Step named 'planning' is detected"
);

assert(
  isPlanningStep({ name: "plan", agent: "forge" }) === true,
  "Step named 'plan' is detected"
);

assert(
  isPlanningStep({ name: "specify", agent: "forge" }) === true,
  "Step named 'specify' is detected"
);

assert(
  isPlanningStep({ name: "design", agent: "forge" }) === true,
  "Step named 'design' is detected"
);

assert(
  isPlanningStep({ name: "explore", agent: "scout" }) === false,
  "Step named 'explore' is not planning"
);

assert(
  isPlanningStep({ name: "execute", agent: "forge" }) === false,
  "Step named 'execute' is not planning"
);

assert(
  isPlanningStep({ name: "custom", agent: "sage" }) === true,
  "Step with agent 'sage' is planning"
);

assert(
  isPlanningStep({ name: "custom", agent: "forge" }) === false,
  "Step with agent 'forge' (not sage) is not planning"
);

// --- isReadOnlyBash ---

console.log("\n2. Read-only bash detection");

assert(isReadOnlyBash("ls -la") === true, "ls is read-only");
assert(isReadOnlyBash("cat file.txt") === true, "cat is read-only");
assert(isReadOnlyBash("grep -r 'pattern' .") === true, "grep is read-only");
assert(isReadOnlyBash("find . -name '*.js'") === true, "find is read-only");
assert(isReadOnlyBash("echo 'hello'") === true, "echo is read-only");
assert(isReadOnlyBash("pwd") === true, "pwd is read-only");
assert(isReadOnlyBash("head file.txt") === true, "head is read-only");
assert(isReadOnlyBash("tail file.txt") === true, "tail is read-only");
assert(isReadOnlyBash("") === true, "empty command is read-only");
assert(isReadOnlyBash("# comment") === true, "comment is read-only");

assert(isReadOnlyBash("rm file.txt") === false, "rm is mutable");
assert(isReadOnlyBash("mv a b") === false, "mv is mutable");
assert(isReadOnlyBash("cp a b") === false, "cp is mutable");
assert(isReadOnlyBash("mkdir dir") === false, "mkdir is mutable");
assert(isReadOnlyBash("touch file") === false, "touch is mutable");
assert(isReadOnlyBash("chmod 755 file") === false, "chmod is mutable");
assert(isReadOnlyBash("echo 'x' > file") === false, "redirect is mutable");
assert(isReadOnlyBash("sed 's/a/b/' file") === false, "sed is mutable");
assert(isReadOnlyBash("git add .") === false, "git add is mutable");
assert(isReadOnlyBash("git commit -m 'msg'") === false, "git commit is mutable");
assert(isReadOnlyBash("npm install") === false, "npm install is mutable");
assert(isReadOnlyBash("node -e 'console.log()'") === false, "node -e is mutable");

// --- isAllowedPlanningDelegate ---

console.log("\n3. Planning delegate restrictions");

assert(
  isAllowedPlanningDelegate("scout") === true,
  "scout is allowed as planning delegate"
);

assert(
  isAllowedPlanningDelegate("forge") === false,
  "forge is not allowed as planning delegate"
);

assert(
  isAllowedPlanningDelegate("sage") === false,
  "sage is not allowed as planning delegate"
);

assert(
  isAllowedPlanningDelegate("ward") === false,
  "ward is not allowed as planning delegate"
);

assert(
  isAllowedPlanningDelegate("arbiter") === false,
  "arbiter is not allowed as planning delegate"
);

// --- Planning permission enforcement ---

console.log("\n4. Planning permission enforcement");

const planningPermissions = {
  edit: "deny",
  write: "deny",
  bash: "deny",
  read: "allow",
  glob: "allow",
  grep: "allow",
  task: {
    "*": "deny",
    scout: "allow",
  },
};

assert(
  checkToolPermission("edit", planningPermissions).allowed === false,
  "edit is blocked by planning permissions"
);

assert(
  checkToolPermission("write", planningPermissions).allowed === false,
  "write is blocked by planning permissions"
);

assert(
  checkToolPermission("bash", planningPermissions).allowed === false,
  "bash is blocked by planning permissions"
);

assert(
  checkToolPermission("read", planningPermissions).allowed === true,
  "read is allowed by planning permissions"
);

assert(
  checkToolPermission("glob", planningPermissions).allowed === true,
  "glob is allowed by planning permissions"
);

assert(
  checkToolPermission("grep", planningPermissions).allowed === true,
  "grep is allowed by planning permissions"
);

assert(
  checkToolPermission("task", planningPermissions, { agent: "scout" })
    .allowed === true,
  "task delegation to scout is allowed"
);

assert(
  checkToolPermission("task", planningPermissions, { agent: "forge" })
    .allowed === false,
  "task delegation to forge is blocked"
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
