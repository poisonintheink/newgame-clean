import { EntityAI } from './EntityAI.js';
import { SelectorNode, SequenceNode, ConditionNode, TaskNode } from './BehaviorTree.js';

export class EnemyAI extends EntityAI {
  constructor(entity) {
    super(entity);
    this.enabled = true;
    this.awarenessRadius = 6;

    const playerDetected = new ConditionNode((e, w, { player, perception }) => {
      if (!player || !perception) return false;
      const data = perception.perceive(e, w, 0, { targets: [player] });
      const detected = (data.smell || []).concat(data.vision || []);
      return detected.includes(player);
    });

    const fleeTask = new TaskNode((e, w, { player }) => {
      if (!player) return true;
      if (e.moving || e.inputQueue.length > 0) return true;
      const dx = player.tileX - e.tileX;
      const dy = player.tileY - e.tileY;
      let dir;
      if (Math.abs(dx) > Math.abs(dy)) {
        dir = dx > 0 ? 'left' : 'right';
      } else {
        dir = dy > 0 ? 'up' : 'down';
      }
      const { x, y } = this.nextTile(dir);
      if (w.isWalkable(x, y)) {
        e.queueInput(dir);
      }
      return true;
    });

    const wanderTask = new TaskNode((e, w) => {
      if (e.moving || e.inputQueue.length > 0) return true;
      const directions = ['up', 'down', 'left', 'right'];
      for (let i = 0; i < directions.length; i++) {
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const { x, y } = this.nextTile(dir);
        if (w.isWalkable(x, y)) {
          e.queueInput(dir);
          break;
        }
      }
      return true;
    });

    this.tree = new SelectorNode([
      new SequenceNode([playerDetected, fleeTask]),
      wanderTask
    ]);
  }

  update(deltaTime, world, context = {}) {
    if (!this.enabled || !world) return;
    this.decisionTimer += deltaTime;
    if (this.decisionTimer < this.decisionInterval) return;
    this.decisionTimer = 0;

    this.tree.tick(this.entity, world, context);
  }
}