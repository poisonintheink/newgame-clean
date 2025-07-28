import { EventEmitter } from '../core/EventEmitter.js';

/**
 * Manages entity inventories and dispatches events when they change.
 */
export class InventorySystem extends EventEmitter {
  /** Add an item to an entity's inventory. */
  addItem(entity, item) {
    if (!entity || !item) return;
    if (!Array.isArray(entity.inventory)) {
      entity.inventory = [];
    }
    entity.inventory.push(item);
    this.emit('itemAdded', { entity, item });
  }

  /** Remove an item from an entity's inventory. */
  removeItem(entity, item) {
    if (!entity || !Array.isArray(entity.inventory)) return false;
    const idx = entity.inventory.indexOf(item);
    if (idx !== -1) {
      entity.inventory.splice(idx, 1);
      this.emit('itemRemoved', { entity, item });
      return true;
    }
    return false;
  }

  /** Transfer an item between two entities. */
  transferItem(fromEntity, toEntity, item) {
    if (this.removeItem(fromEntity, item)) {
      this.addItem(toEntity, item);
      this.emit('itemTransferred', { from: fromEntity, to: toEntity, item });
      return true;
    }
    return false;
  }
}