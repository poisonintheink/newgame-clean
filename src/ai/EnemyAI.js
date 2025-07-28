import { EntityAI } from './EntityAI.js';

export class EnemyAI extends EntityAI {
  constructor(entity) {
    super(entity);
    this.enabled = true;
    this.awarenessRadius = 6; // tiles
  }

  update(deltaTime, world, context = {}) {
    if (!this.enabled) return;
    const player = context.player;
    if (player) {
      const dx = player.tileX - this.entity.tileX;
      const dy = player.tileY - this.entity.tileY;
      const distSq = dx * dx + dy * dy;
      if (distSq <= this.awarenessRadius * this.awarenessRadius) {
        if (!this.entity.moving && this.entity.inputQueue.length === 0) {
          // Flee away from player
          let dir;
          if (Math.abs(dx) > Math.abs(dy)) {
            dir = dx > 0 ? 'left' : 'right';
          } else {
            dir = dy > 0 ? 'up' : 'down';
          }
          const { x, y } = this.nextTile(dir);
          if (world.isWalkable(x, y)) {
            this.entity.queueInput(dir);
            return;
          }
        }
      }
    }
    // Default random wander
    super.update(deltaTime, world, context);
  }
}