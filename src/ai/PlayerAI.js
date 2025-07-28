import { EntityAI } from './EntityAI.js';
import { findPath } from '../world/Pathfinder.js';
import { SelectorNode, SequenceNode, ConditionNode, TaskNode } from './BehaviorTree.js';

export class PlayerAI extends EntityAI {
  constructor(entity) {
    super(entity);
    this.enabled = false;
    this.visionDistance = 6;
    this.visionAngle = Math.PI / 3;
    this.path = [];
    this.targetLastPos = null;

    const targetVisible = new ConditionNode((e, w, { target, perception }) => {
      if (!target || !perception) return false;
      const data = perception.perceive(e, w, 0, { targets: [target] });
      const visible = data.vision || [];
      return visible.includes(target);
    });

    const chaseTask = new TaskNode((e, w, { target }) => {
      if (!target) return true;
      if (e.moving || e.inputQueue.length > 0) return true;
      const targetTile = { x: target.tileX, y: target.tileY };
      if (!this.targetLastPos ||
        this.targetLastPos.x !== targetTile.x ||
        this.targetLastPos.y !== targetTile.y ||
        this.path.length === 0) {
        this.path = findPath(w, { x: e.tileX, y: e.tileY }, targetTile);
        this.targetLastPos = { ...targetTile };
      }
      if (this.path.length > 1) {
        const next = this.path[1];
        const dir = this.directionTo(next);
        if (dir && w.isWalkable(next.x, next.y)) {
          this.path.shift();
          e.queueInput(dir);
        } else {
          this.path = [];
        }
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
      new SequenceNode([targetVisible, chaseTask]),
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