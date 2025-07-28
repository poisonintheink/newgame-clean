import { EntityAI } from './EntityAI.js';
import { SelectorNode, SequenceNode, ConditionNode, TaskNode } from './BehaviorTree.js';
import { TaskSystem } from '../systems/TaskSystem.js';
import { GoalPlanner } from './GoalPlanner.js';

export class EnemyAI extends EntityAI {
  constructor(entity) {
    super(entity);
    this.enabled = true;
    this.awarenessRadius = 6;
    this.goal = null;
    this.taskSystem = new TaskSystem();
    this.goalPlanner = new GoalPlanner(null);

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

    const goalTask = new TaskNode((e, w, context) => {
      if (!this.goal) return false;
      this.goalPlanner.world = w;
      if (!this.taskSystem.hasTasks(e)) {
        const tasks = this.goalPlanner.plan(e, this.goal);
        this.taskSystem.addTasks(e, tasks);
      }
      this.taskSystem.update(0, w, context);
      if (!this.taskSystem.hasTasks(e)) {
        this.goal = null;
      }
      return true;
    });

    this.tree = new SelectorNode([
      goalTask,
      new SequenceNode([playerDetected, fleeTask]),
      wanderTask
    ]);
  }

  update(deltaTime, world, context = {}) {
    if (!this.enabled || !world) return;

    if (this.taskSystem.hasTasks(this.entity)) {
      this.taskSystem.update(deltaTime, world, context);
    }

    this.decisionTimer += deltaTime;
    if (this.decisionTimer < this.decisionInterval) return;
    this.decisionTimer = 0;

    this.tree.tick(this.entity, world, context);
  }
}