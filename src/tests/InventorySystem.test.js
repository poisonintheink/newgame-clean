import assert from 'assert';
import { InventorySystem } from '../systems/InventorySystem.js';
import { eventBus } from '../core/EventBus.js';

const system = new InventorySystem();
const entity = { name: 'hero' };
const item = { id: 1, name: 'potion' };

let added = false;
eventBus.once('itemAdded', ({ entity: e, item: i }) => {
  added = e === entity && i === item;
});

system.addItem(entity, item);
assert.strictEqual(added, true, 'itemAdded event not emitted');

let removed = false;
eventBus.once('itemRemoved', ({ entity: e, item: i }) => {
  removed = e === entity && i === item;
});

system.removeItem(entity, item);
assert.strictEqual(removed, true, 'itemRemoved event not emitted');

const from = { inventory: [item] };
const to = { inventory: [] };
let transferred = false;
eventBus.once('itemTransferred', ({ from: f, to: t, item: i }) => {
  transferred = f === from && t === to && i === item;
});

system.transferItem(from, to, item);
assert.strictEqual(transferred, true, 'itemTransferred event not emitted');

// cleanup
eventBus.removeAllListeners('itemAdded');
eventBus.removeAllListeners('itemRemoved');
eventBus.removeAllListeners('itemTransferred');

console.log('InventorySystem basic test passed');