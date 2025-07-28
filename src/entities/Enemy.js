import * as PIXI from 'pixi.js';
import { EnemyAI } from '../ai/EnemyAI.js';
import { Character } from './Character.js';

export class Enemy extends Character {
  constructor(tileX = 0, tileY = 0, tileSize = 32) {

    super(tileX, tileY, tileSize);

    this.moveSpeed = 4; // tiles per second
    this.moving = false;
    this.moveProgress = 0;
    this.moveFrom = { x: this.tileX, y: this.tileY };
    this.moveTo = { x: this.tileX, y: this.tileY };

    this.width = 20;
    this.height = 20;
    this.color = 0x00ff00;

    this.sprite = this.createSprite();
    this.sprite.x = this.x;
    this.sprite.y = this.y;

    this.inputQueue = [];
    this.lastInputTime = 0;
    this.inputCooldown = 0.15;

    this.ai = new EnemyAI(this);
  }

  createSprite() {
    const g = new PIXI.Graphics();
    g.circle(0, 0, this.width / 2);
    g.fill(this.color);
    return g;
  }

  queueInput(direction) {
    if (this.inputQueue.length < 2) {
      this.inputQueue.push(direction);
    }
  }

  update(deltaTime, world, context = {}) {
    this.ai.update(deltaTime, world, context);

    if (this.moving) {
      this.moveProgress += deltaTime * this.moveSpeed;
      if (this.moveProgress >= 1) {
        this.tileX = this.moveTo.x;
        this.tileY = this.moveTo.y;
        this.x = this.tileX * this.tileSize + this.tileSize / 2;
        this.y = this.tileY * this.tileSize + this.tileSize / 2;
        this.moving = false;
        this.moveProgress = 0;
      } else {
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
      this.sprite.x = this.x;
      this.sprite.y = this.y;
    } else {
      this.lastInputTime += deltaTime;
      if (this.inputQueue.length > 0 && this.lastInputTime >= this.inputCooldown) {
        const dir = this.inputQueue.shift();
        this.tryMove(dir, world);
      }
    }
  }

  tryMove(direction, world) {
    if (this.moving) return;
    let nx = this.tileX;
    let ny = this.tileY;
    switch (direction) {
      case 'up': ny -= 1; break;
      case 'down': ny += 1; break;
      case 'left': nx -= 1; break;
      case 'right': nx += 1; break;
    }
    if (world.isWalkable(nx, ny)) {
      this.moving = true;
      this.moveProgress = 0;
      this.moveFrom = { x: this.tileX, y: this.tileY };
      this.moveTo = { x: nx, y: ny };
    }
  }

  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }
}