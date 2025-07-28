import { eventBus } from '../core/EventBus.js';

/**
 * Central registry for all game entities
 */
export class EntityRegistry {
  constructor() {
    this.entities = new Map();
    this.entityByType = new Map();
    this.nextId = 1;
  }

  /**
   * Generate a unique ID
   */
  generateId() {
    return `entity-${this.nextId++}`;
  }

  /**
   * Register an entity
   */
  register(entity, type = null) {
    if (!entity.id) {
      entity.id = this.generateId();
    }

    const entityType = type || entity.type || 'unknown';
    this.entities.set(entity.id, entity);

    if (!this.entityByType.has(entityType)) {
      this.entityByType.set(entityType, new Set());
    }
    this.entityByType.get(entityType).add(entity);

    eventBus.emit('entityRegistered', { entity, type: entityType });
    return entity.id;
  }

  /**
   * Remove an entity from the registry
   */
  remove(entity) {
    if (!entity || !entity.id) return;

    this.entities.delete(entity.id);

    // Remove from type map
    for (const [type, set] of this.entityByType) {
      if (set.has(entity)) {
        set.delete(entity);
        if (set.size === 0) {
          this.entityByType.delete(type);
        }
        break;
      }
    }

    eventBus.emit('entityRemoved', { entity });
  }

  /**
   * Get entity by ID
   */
  get(id) {
    return this.entities.get(id);
  }

  /**
   * Get all entities of a specific type
   */
  getByType(type) {
    return Array.from(this.entityByType.get(type) || []);
  }

  /**
   * Get all entities
   */
  getAll() {
    return Array.from(this.entities.values());
  }

  /**
   * Clear all entities
   */
  clear() {
    // Emit removal events for cleanup
    for (const entity of this.entities.values()) {
      eventBus.emit('entityRemoved', { entity });
    }

    this.entities.clear();
    this.entityByType.clear();
  }

  /**
   * Get count of entities
   */
  get size() {
    return this.entities.size;
  }

  /**
   * Check if an entity is registered
   */
  has(entity) {
    return entity && entity.id && this.entities.has(entity.id);
  }
}