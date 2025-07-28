import assert from 'assert';
import { PerceptionSystem } from '../systems/PerceptionSystem.js';
import { SmellSense } from '../systems/senses/SmellSense.js';
import { VisionSense } from '../systems/senses/VisionSense.js';

const entity = { tileX: 0, tileY: 0, facing: 'right' };
const target1 = { tileX: 1, tileY: 0 };
const target2 = { tileX: 6, tileY: 0 };
const target3 = { tileX: 0, tileY: 5 };

const system = new PerceptionSystem();
system.registerSense('smell', new SmellSense(3));
system.registerSense('vision', new VisionSense(5, Math.PI / 3));

const res = system.perceive(entity, {}, 0, { targets: [target1, target2, target3] });

assert.strictEqual(res.smell.length, 1, 'SmellSense should detect target within range');
assert.strictEqual(res.smell[0], target1);
assert.ok(res.vision.includes(target1), 'Vision should detect target in front');
assert.ok(!res.vision.includes(target2), 'Vision should not detect target out of range');
assert.ok(!res.vision.includes(target3), 'Vision should not detect target behind');

console.log('PerceptionSystem basic test passed');