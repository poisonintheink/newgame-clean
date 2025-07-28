export class SmellSense {
  constructor(range = 3) {
    this.range = range; // tiles
  }

  scan(entity, world, deltaTime, context = {}) {
    const targets = context.targets || [];
    return targets.filter(t => {
      const dx = t.tileX - entity.tileX;
      const dy = t.tileY - entity.tileY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist <= this.range;
    });
  }
}