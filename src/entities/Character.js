import { Entity } from './Entity.js';
import { KnowledgeBase } from '../systems/KnowledgeSystem.js';
import { TILE_SIZE } from '../utils/constants.js';

export class Character extends Entity {
  constructor(tileX = 0, tileY = 0, tileSize = TILE_SIZE) {
    super(tileX, tileY, tileSize);

    // Standardize movement properties
    this.moveSpeed = 4; // tiles per second
    this.moving = false;
    this.moveProgress = 0;
    this.moveFrom = { x: this.tileX, y: this.tileY };
    this.moveTo = { x: this.tileX, y: this.tileY };
    this.facing = 'down'; // up, down, left, right

    // Input handling
    this.inputQueue = [];
    this.lastInputTime = 0;
    this.inputCooldown = 0.15; // seconds between moves

    // RPG properties
    this.level = 1;
    this.experience = 0;
    this.hitPoints = 100;
    this.maxHitPoints = 100;
    this.stats = {
      strength: 10,
      defense: 5,
      agility: 10,
      intelligence: 10
    };

    // Inventory placeholder (array of item references)
    this.inventory = [];
    // Knowledge base for storing learned facts
    this.knowledge = new KnowledgeBase();
  }

  /**
   * Common update logic for all characters
   */
  update(deltaTime, world, context = {}) {
    // Handle movement
    if (this.moving) {
      this.moveProgress += deltaTime * this.moveSpeed;

      if (this.moveProgress >= 1) {
        // Movement complete
        this.tileX = this.moveTo.x;
        this.tileY = this.moveTo.y;
        this.x = this.tileX * this.tileSize + this.tileSize / 2;
        this.y = this.tileY * this.tileSize + this.tileSize / 2;
        this.moving = false;
        this.moveProgress = 0;
        this.lastInputTime = 0;
      } else {
        // Interpolate position
        const t = this.easeInOut(this.moveProgress);
        this.x = this.lerp(
          this.moveFrom.x * this.tileSize + this.tileSize / 2,
          this.moveTo.x * this.tileSize + this.tileSize / 2,
          t
        );
        this.y = this.lerp(
          this.moveFrom.y * this.tileSize + this.tileSize / 2,
          this.moveTo.y * this.tileSize + this.tileSize / 2,
          t
        );
      }

      // Update sprite position if it exists
      if (this.sprite) {
        this.sprite.x = this.x;
        this.sprite.y = this.y;
      }
    } else {
      // Check for queued input
      this.lastInputTime += deltaTime;

      if (this.inputQueue.length > 0 && this.lastInputTime >= this.inputCooldown) {
        const direction = this.inputQueue.shift();
        this.tryMove(direction, world);
      }
    }
  }

  /**
   * Try to move in a direction
   */
  tryMove(direction, world) {
    if (this.moving) return;

    let newTileX = this.tileX;
    let newTileY = this.tileY;

    switch (direction) {
      case 'up':
        newTileY -= 1;
        this.facing = 'up';
        break;
      case 'down':
        newTileY += 1;
        this.facing = 'down';
        break;
      case 'left':
        newTileX -= 1;
        this.facing = 'left';
        break;
      case 'right':
        newTileX += 1;
        this.facing = 'right';
        break;
    }

    const wrapped = world.wrapCoords(newTileX, newTileY);

    // Check if new position is walkable
    if (world.isWalkable(wrapped.x, wrapped.y) && !world.isOccupied(wrapped.x, wrapped.y, this)) {
      this.moving = true;
      this.moveProgress = 0;
      this.moveFrom = { x: this.tileX, y: this.tileY };
      this.moveTo = { x: wrapped.x, y: wrapped.y };
    }
  }

  /**
   * Queue a movement input
   */
  queueInput(direction) {
    if (this.inputQueue.length < 2) {
      this.inputQueue.push(direction);
    }
  }

  /**
   * Linear interpolation
   */
  lerp(start, end, t) {
    return start + (end - start) * t;
  }

  /**
   * Ease in-out function for smooth movement
   */
  easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  /**
   * Take damage (can be overridden for special effects)
   */
  takeDamage(amount) {
    this.hitPoints = Math.max(0, this.hitPoints - amount);
    return this.hitPoints <= 0;
  }

  /**
   * Heal character
   */
  heal(amount) {
    this.hitPoints = Math.min(this.maxHitPoints, this.hitPoints + amount);
  }

  /**
   * Serialize the entity's knowledge base.
   */
  serializeKnowledge() {
    return this.knowledge.serialize();
  }

  /**
   * Load knowledge data into the entity.
   */
  loadKnowledge(data) {
    this.knowledge = KnowledgeBase.deserialize(data);
  }

  /**
   * Override destroy to clean up AI
   */
  destroy() {
    if (this.ai) {
      this.ai.enabled = false;
    }
    super.destroy();
  }
}