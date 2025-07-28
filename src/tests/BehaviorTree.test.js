import { SequenceNode, SelectorNode, ConditionNode, TaskNode } from '../ai/BehaviorTree.js';

// Sequence success
let seq = new SequenceNode([
  new ConditionNode(() => true),
  new ConditionNode(() => true)
]);
if (!seq.tick({}, {}, {})) {
  throw new Error('Sequence should succeed when all children succeed');
}

// Sequence failure
seq = new SequenceNode([
  new ConditionNode(() => true),
  new ConditionNode(() => false)
]);
if (seq.tick({}, {}, {})) {
  throw new Error('Sequence should fail when a child fails');
}

// Selector success
let sel = new SelectorNode([
  new ConditionNode(() => false),
  new ConditionNode(() => true)
]);
if (!sel.tick({}, {}, {})) {
  throw new Error('Selector should succeed when any child succeeds');
}

// Selector failure
sel = new SelectorNode([
  new ConditionNode(() => false),
  new ConditionNode(() => false)
]);
if (sel.tick({}, {}, {})) {
  throw new Error('Selector should fail when all children fail');
}

// TaskNode execution
let ran = false;
const task = new TaskNode(() => { ran = true; return true; });
task.tick({}, {}, {});
if (!ran) {
  throw new Error('TaskNode should execute task function');
}

console.log('BehaviorTree basic test passed');