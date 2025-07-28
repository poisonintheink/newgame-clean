import { IdleSystem } from '../systems/IdleSystem.js';
import { eventBus } from '../core/EventBus.js';

const entity = { tileX: 0, tileY: 0, name: 'Dummy' };
const idle = new IdleSystem(0.1);
let fired = false;

eventBus.on('idle', ({ entity: e }) => {
  if (e === entity) fired = true;
});

idle.addEntity(entity);

idle.update(0.05);
if (fired) throw new Error('idle fired too soon');

idle.update(0.05);
if (!fired) throw new Error('idle did not fire');

// Move and ensure timer resets
fired = false;
entity.tileX = 1;
idle.update(0.01);

idle.update(0.1);
if (!fired) throw new Error('idle did not fire again after movement');

console.log('IdleSystem basic test passed');
eventBus.removeAllListeners('idle');