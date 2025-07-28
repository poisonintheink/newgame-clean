export class VisionSense {
  constructor(range = 6, angle = Math.PI / 3) {
    this.range = range; // tiles
    this.angle = angle; // radians
  }

  scan(entity, world, deltaTime, context = {}) {
    const targets = context.targets || [];
    const seen = [];
    for (const target of targets) {
      const dx = target.tileX - entity.tileX;
      const dy = target.tileY - entity.tileY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > this.range) continue;

      let fx = 0, fy = 0;
      switch (entity.facing) {
        case 'up': fy = -1; break;
        case 'down': fy = 1; break;
        case 'left': fx = -1; break;
        case 'right': fx = 1; break;
        default: fy = 1; // assume facing down
      }
      const norm = Math.sqrt(dx * dx + dy * dy);
      const dot = (dx * fx + dy * fy) / (norm || 1);
      const angle = Math.acos(Math.min(Math.max(dot, -1), 1));
      if (angle <= this.angle) {
        seen.push(target);
      }
    }
    return seen;
  }
}