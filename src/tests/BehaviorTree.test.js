import assert from 'assert';
import { SequenceNode, SelectorNode, ConditionNode, TaskNode } from '../ai/BehaviorTree.js';

// Sequence success
let seq = new SequenceNode([
  new ConditionNode(() => true),
  new ConditionNode(() => true)
]);
assert.strictEqual(seq.tick({}, {}, {}), true, 'Sequence should succeed when all children succeed');

// Sequence failure
seq = new SequenceNode([
  new ConditionNode(() => true),
  new ConditionNode(() => false)
]);
assert.strictEqual(seq.tick({}, {}, {}), false, 'Sequence should fail when a child fails');

// Selector success
let sel = new SelectorNode([
  new ConditionNode(() => false),
  new ConditionNode(() => true)
]);
assert.strictEqual(sel.tick({}, {}, {}), true, 'Selector should succeed when any child succeeds');

// Selector failure
sel = new SelectorNode([
  new ConditionNode(() => false),
  new ConditionNode(() => false)
]);
assert.strictEqual(sel.tick({}, {}, {}), false, 'Selector should fail when all children fail');

// TaskNode execution
let ran = false;
const task = new TaskNode(() => { ran = true; return true; });
task.tick({}, {}, {});
assert.strictEqual(ran, true, 'TaskNode should execute task function');

console.log('BehaviorTree basic test passed');