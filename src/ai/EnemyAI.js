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
    const perception = context.perception;
    if (player && perception) {
      const data = perception.perceive(this.entity, world, deltaTime, { targets: [player] });
      const detected = (data.smell || []).concat(data.vision || []);
      if (detected.includes(player)) {
        if (!this.entity.moving && this.entity.inputQueue.length === 0) {
          // Flee away from player
          const dx = player.tileX - this.entity.tileX;
          const dy = player.tileY - this.entity.tileY;
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