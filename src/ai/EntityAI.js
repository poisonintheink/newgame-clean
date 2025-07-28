export class EntityAI {
  constructor(entity) {
    this.entity = entity;
    this.enabled = false;
    this.decisionInterval = 0.3; // seconds between AI decisions
    this.decisionTimer = 0;
  }

  toggle(force) {
    if (typeof force === 'boolean') {
      this.enabled = force;
    } else {
      this.enabled = !this.enabled;
    }
  }

  update(deltaTime, world, context = {}) {
    if (!this.enabled || !world) return;
    this.decisionTimer += deltaTime;
    if (this.decisionTimer < this.decisionInterval) return;
    this.decisionTimer = 0;

    if (this.entity.moving || this.entity.inputQueue.length > 0) return;

    const directions = ['up', 'down', 'left', 'right'];
    for (let i = 0; i < directions.length; i++) {
      const dir = directions[Math.floor(Math.random() * directions.length)];
      const { x, y } = this.nextTile(dir);
      if (world.isWalkable(x, y)) {
        this.entity.queueInput(dir);
        break;
      }
    }
  }

  nextTile(direction) {
    let tx = this.entity.tileX;
    let ty = this.entity.tileY;
    switch (direction) {
      case 'up':
        ty -= 1;
        break;
      case 'down':
        ty += 1;
        break;
      case 'left':
        tx -= 1;
        break;
      case 'right':
        tx += 1;
        break;
    }
    return { x: tx, y: ty };
  }
}