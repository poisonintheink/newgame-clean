import * as PIXI from 'pixi.js';
import { EnemyAI } from '../ai/EnemyAI.js';
import { Character } from './Character.js';
import { TILE_SIZE } from '../utils/constants.js';

export class Enemy extends Character {
  constructor(tileX = 0, tileY = 0, tileSize = TILE_SIZE) {
    super(tileX, tileY, tileSize);

    // Enemy-specific properties
    this.moveSpeed = 3; // Slightly slower than player

    // Visual properties scaled with tile size
    this.width = Math.round(tileSize * 0.625);
    this.height = Math.round(tileSize * 0.625);
    this.color = 0x00ff00;

    // PIXI display object
    this.sprite = this.createSprite();
    this.sprite.x = this.x;
    this.sprite.y = this.y;

    // Enemy data
    this.drops = []; // Will be set by factory

    // AI controller
    this.ai = new EnemyAI(this);
  }

  createSprite() {
    const g = new PIXI.Graphics();
    g.circle(0, 0, this.width / 2);
    g.fill(this.color);
    return g;
  }

  update(deltaTime, world, context = {}) {
    if (this.ai) {
      this.ai.update(deltaTime, world, context);
    }

    // Call parent update for common movement logic
    super.update(deltaTime, world, context);
  }
}