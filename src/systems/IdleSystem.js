import { EventEmitter } from '../core/EventEmitter.js';

/**
 * Tracks entity movement and emits an `idle` event when an entity
 * hasn't moved for the configured duration.
 *
 * Example usage:
 * ```javascript
 * const idle = new IdleSystem(3);
 * idle.on('idle', ({ entity }) => console.log(`${entity.name} idle`));
 * idle.addEntity(player);
 * // in your game loop:
 * idle.update(deltaTime);
 * ```
 */
export class IdleSystem extends EventEmitter {
  /**
   * @param {number} idleTime Seconds of inactivity before emitting `idle`.
   */
  constructor(idleTime = 5) {
    super();
    this.idleTime = idleTime;
    this.entities = new Set();
    this.lastPositions = new WeakMap();
    this.timers = new WeakMap();
    this.idleFlags = new WeakMap();
  }

  /** Register an entity with the system. */
  addEntity(entity) {
    if (entity) {
      this.entities.add(entity);
      this.lastPositions.set(entity, { x: entity.tileX, y: entity.tileY });
      this.timers.set(entity, 0);
      this.idleFlags.set(entity, false);
    }
  }

  /** Remove an entity from the system. */
  removeEntity(entity) {
    this.entities.delete(entity);
    this.lastPositions.delete(entity);
    this.timers.delete(entity);
    this.idleFlags.delete(entity);
  }

  /**
   * Update timers for entities and emit an `idle` event when appropriate.
   * @param {number} deltaTime Seconds since last update.
   */
  update(deltaTime) {
    for (const entity of this.entities) {
      const last = this.lastPositions.get(entity) || { x: entity.tileX, y: entity.tileY };
      if (entity.tileX !== last.x || entity.tileY !== last.y) {
        this.lastPositions.set(entity, { x: entity.tileX, y: entity.tileY });
        this.timers.set(entity, 0);
        this.idleFlags.set(entity, false);
      } else {
        const time = (this.timers.get(entity) || 0) + deltaTime;
        this.timers.set(entity, time);
        if (time >= this.idleTime && !this.idleFlags.get(entity)) {
          this.emit('idle', { entity, idleTime: time });
          this.idleFlags.set(entity, true);
        }
      }
    }
  }
}