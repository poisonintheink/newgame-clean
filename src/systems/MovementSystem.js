import { eventBus } from '../core/EventBus.js';

/**
 * Handles updating registered entities and emits events when they move.
 */
export class MovementSystem {
  constructor() {
    this.entities = new Set();
    this.lastPositions = new WeakMap();
  }

  /** Register an entity with the system. */
  addEntity(entity) {
    if (entity) {
      this.entities.add(entity);
      this.lastPositions.set(entity, { x: entity.tileX, y: entity.tileY });
    }
  }

  /** Remove an entity from the system. */
  removeEntity(entity) {
    this.entities.delete(entity);
    this.lastPositions.delete(entity);
  }

  /**
   * Update all entities and emit a `move` event when a tile changes.
   * @param {number} deltaTime - Seconds since last update.
   * @param {World} world - Game world used for entity updates.
   * @param {object} context - Additional context passed to entity update.
   */
  update(deltaTime, world, context = {}) {
    for (const entity of this.entities) {
      if (typeof entity.update === 'function') {
        entity.update(deltaTime, world, context);
      }

      const last = this.lastPositions.get(entity) || { x: entity.tileX, y: entity.tileY };
      if (entity.tileX !== last.x || entity.tileY !== last.y) {
        eventBus.emit('move', { entity, from: last, to: { x: entity.tileX, y: entity.tileY } });
        this.lastPositions.set(entity, { x: entity.tileX, y: entity.tileY });
      }
    }
  }
}