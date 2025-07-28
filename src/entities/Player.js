import * as PIXI from 'pixi.js';
import { PlayerAI } from '../ai/PlayerAI.js';
import { Character } from './Character.js';
import { TILE_SIZE } from '../utils/constants.js';

export class Player extends Character {
  constructor(tileX = 0, tileY = 0, tileSize = TILE_SIZE) {
    super(tileX, tileY, tileSize);

    // Player-specific properties
    this.moveSpeed = 4; // Can override Character default
    
    // Visual properties scaled with tile size
    this.width = Math.round(tileSize * 0.75);
    this.height = Math.round(tileSize * 0.75);
    this.color = 0xff0000;

    // PIXI display object
    this.sprite = this.createSprite();
    this.sprite.x = this.x;
    this.sprite.y = this.y;

    // Animation properties
    this.animationTime = 0;

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
    indicator.label = 'indicator';

    container.addChild(body);
    container.addChild(indicator);

    return container;
  }

  /**
   * Update player state
   */
  update(deltaTime, world, context = {}) {
    this.animationTime += deltaTime;
    
    if (this.ai) {
      this.ai.update(deltaTime, world, context);
    }

    // Call parent update for common movement logic
    super.update(deltaTime, world, context);

    // Update direction indicator
    this.updateDirectionIndicator();

    // Animate
    this.animate();
  }

  /**
   * Update direction indicator rotation
   */
  updateDirectionIndicator() {
    const indicator = this.sprite.getChildByLabel('indicator');
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
   * Set position in tiles
   */
  setTilePosition(tileX, tileY) {
    super.setTilePosition(tileX, tileY);
    this.moving = false;
    this.moveProgress = 0;
  }

  toggleAutomation(force) {
    if (this.ai) {
      this.ai.toggle(force);
    }
  }
}