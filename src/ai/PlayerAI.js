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
    if (target) {
      const dx = target.x - this.entity.x;
      const dy = target.y - this.entity.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= this.visionDistance * this.entity.tileSize) {
        let fx = 0, fy = 0;
        switch (this.entity.facing) {
          case 'up': fy = -1; break;
          case 'down': fy = 1; break;
          case 'left': fx = -1; break;
          case 'right': fx = 1; break;
        }
        const norm = Math.sqrt(dx * dx + dy * dy);
        const dot = (dx * fx + dy * fy) / (norm || 1);
        const angle = Math.acos(Math.min(Math.max(dot, -1), 1));
        if (angle <= this.visionAngle) {
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