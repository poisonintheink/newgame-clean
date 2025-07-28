import { EntityAI } from './EntityAI.js';
import { findPath } from '../world/Pathfinder.js';

export class PlayerAI extends EntityAI {
  constructor(entity) {
    super(entity);
    this.enabled = false;
    this.visionDistance = 6; // tiles
    this.visionAngle = Math.PI / 3; // ~60 deg cone 
    this.path = [];
    this.targetLastPos = null;
  }

  update(deltaTime, world, context = {}) {
    if (!this.enabled) return;
    const target = context.target;
    const perception = context.perception;
    if (target && perception) {
      const data = perception.perceive(this.entity, world, deltaTime, { targets: [target] });
      const visible = data.vision || [];
      if (visible.includes(target)) {
        if (!this.entity.moving && this.entity.inputQueue.length === 0) {
          const targetTile = { x: target.tileX, y: target.tileY };
          if (!this.targetLastPos || this.targetLastPos.x !== targetTile.x || this.targetLastPos.y !== targetTile.y || this.path.length === 0) {
            this.path = findPath(world, { x: this.entity.tileX, y: this.entity.tileY }, targetTile);
            this.targetLastPos = { ...targetTile };
          }
          if (this.path.length > 1) {
            const next = this.path[1];
            const dir = this.directionTo(next);
            if (dir && world.isWalkable(next.x, next.y)) {
              this.path.shift();
              this.entity.queueInput(dir);
              return;
            } else {
              this.path = [];
            }
          }
        }
      }
    }
    super.update(deltaTime, world, context);
  }

  directionTo(tile) {
    const dx = tile.x - this.entity.tileX;
    const dy = tile.y - this.entity.tileY;
    if (dx === 1 && dy === 0) return 'right';
    if (dx === -1 && dy === 0) return 'left';
    if (dx === 0 && dy === 1) return 'down';
    if (dx === 0 && dy === -1) return 'up';
    return null;
  }
}