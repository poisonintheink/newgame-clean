import * as PIXI from 'pixi.js';
import { PlayerAI } from '../ai/PlayerAI.js';
import { Character } from './Character.js';

export class Player {
  constructor(tileX = 0, tileY = 0, tileSize = 32) {
    // Position in tile coordinates
    this.tileX = tileX;
    this.tileY = tileY;
    this.tileSize = tileSize;

    // Position in world coordinates (center of tile)
    this.x = tileX * tileSize + tileSize / 2;
    this.y = tileY * tileSize + tileSize / 2;

    // Movement properties
    this.moveSpeed = 4; // tiles per second
    this.moving = false;
    this.moveProgress = 0;
    this.moveFrom = { x: this.tileX, y: this.tileY };
    this.moveTo = { x: this.tileX, y: this.tileY };

    // Visual properties
    this.width = 24;
    this.height = 24;
    this.color = 0xff0000;

    // PIXI display object
    this.sprite = this.createSprite();

    // Input queue
    this.inputQueue = [];
    this.lastInputTime = 0;
    this.inputCooldown = 0.15; // seconds between moves

    // Animation properties
    this.animationTime = 0;
    this.facing = 'down'; // up, down, left, right

    // Simple automation controller
    this.ai = new PlayerAI(this);
  }

  /**
   * Create the player sprite
   */
  createSprite() {
    const container = new PIXI.Container();

    // Main body
    const body = new PIXI.Graphics();
    body.circle(0, 0, this.width / 2);
    body.fill(this.color);

    // Direction indicator
    const indicator = new PIXI.Graphics();
    indicator.moveTo(0, 0);
    indicator.lineTo(this.width / 3, 0);
    indicator.stroke({ width: 3, color: 0xffffff });
    indicator.label = 'indicator';  // Changed from 'name' to 'label' for PIXI v8

    container.addChild(body);
    container.addChild(indicator);

    return container;
  }

  /**
   * Queue a movement input
   */
  queueInput(direction) {
    if (this.inputQueue.length < 2) { // Limit queue size
      this.inputQueue.push(direction);
    }
  }

  /**
   * Update player state
   */
  update(deltaTime, world, context = {}) {
    this.animationTime += deltaTime;
    if (this.ai) {
      this.ai.update(deltaTime, world, context);
    }

    // Handle movement
    if (this.moving) {
      // Continue current movement
      this.moveProgress += deltaTime * this.moveSpeed;

      if (this.moveProgress >= 1) {
        // Movement complete
        this.tileX = this.moveTo.x;
        this.tileY = this.moveTo.y;
        this.x = this.tileX * this.tileSize + this.tileSize / 2;
        this.y = this.tileY * this.tileSize + this.tileSize / 2;
        this.moving = false;
        this.moveProgress = 0;
        this.lastInputTime = 0; // Reset input timer
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
    } else {
      // Check for queued input
      this.lastInputTime += deltaTime;

      if (this.inputQueue.length > 0 && this.lastInputTime >= this.inputCooldown) {
        const direction = this.inputQueue.shift();
        this.tryMove(direction, world);
      }
    }

    // Update sprite position
    this.sprite.x = this.x;
    this.sprite.y = this.y;

    // Update direction indicator
    this.updateDirectionIndicator();

    // Animate
    this.animate();
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

    // Check if new position is walkable
    if (world.isWalkable(newTileX, newTileY)) {
      this.moving = true;
      this.moveProgress = 0;
      this.moveFrom = { x: this.tileX, y: this.tileY };
      this.moveTo = { x: newTileX, y: newTileY };
    }
  }

  /**
   * Update direction indicator rotation
   */
  updateDirectionIndicator() {
    const indicator = this.sprite.getChildByLabel('indicator');  // Changed from getChildByName
    if (indicator) {
      switch (this.facing) {
        case 'up':
          indicator.rotation = -Math.PI / 2;
          break;
        case 'down':
          indicator.rotation = Math.PI / 2;
          break;
        case 'left':
          indicator.rotation = Math.PI;
          break;
        case 'right':
          indicator.rotation = 0;
          break;
      }
    }
  }

  /**
   * Simple idle/move animation
   */
  animate() {
    if (this.moving) {
      // Bouncing effect while moving
      const bounce = Math.sin(this.moveProgress * Math.PI) * 0.1;
      this.sprite.scale.set(1, 1 + bounce);
    } else {
      // Gentle breathing effect when idle
      const breathScale = 1 + Math.sin(this.animationTime * 2) * 0.02;
      this.sprite.scale.set(breathScale);
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
    return t < 0.5
      ? 2 * t * t
      : -1 + (4 - 2 * t) * t;
  }

  /**
   * Get current world position
   */
  getWorldPosition() {
    return { x: this.x, y: this.y };
  }

  /**
   * Set position in tiles
   */
  setTilePosition(tileX, tileY) {
    this.tileX = tileX;
    this.tileY = tileY;
    this.x = tileX * this.tileSize + this.tileSize / 2;
    this.y = tileY * this.tileSize + this.tileSize / 2;
    this.sprite.x = this.x;
    this.sprite.y = this.y;
    this.moving = false;
    this.moveProgress = 0;
  }

  toggleAutomation(force) {
    if (this.ai) {
      this.ai.toggle(force);
    }
  }
}