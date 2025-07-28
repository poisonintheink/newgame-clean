import { findPath } from '../world/Pathfinder.js';
import { Task } from '../systems/TaskSystem.js';

/**
 * Very small goal planner that decomposes goals into a list of Tasks.
 */
export class GoalPlanner {
  constructor(world) {
    this.world = world;
  }

  /**
   * Create a task list for the provided goal.
   * Supported goals:
   *   { type: 'moveTo', target: { x, y } }
   */
  plan(entity, goal) {
    if (!goal || !entity || !this.world) return [];
    switch (goal.type) {
      case 'moveTo':
        return this.#planMoveTo(entity, goal.target);
      default:
        return [];
    }
  }

  #planMoveTo(entity, target) {
    const path = findPath(this.world, { x: entity.tileX, y: entity.tileY }, target);
    if (path.length === 0) return [];
    const steps = path.slice(1); // first step is current tile
    return steps.map(step => new Task({
      canExecute: (e, w) => !e.moving && e.inputQueue.length === 0 && w.isWalkable(step.x, step.y),
      execute: e => {
        const dx = step.x - e.tileX;
        const dy = step.y - e.tileY;
        let dir = null;
        if (dx === 1) dir = 'right';
        else if (dx === -1) dir = 'left';
        else if (dy === 1) dir = 'down';
        else if (dy === -1) dir = 'up';
        if (dir) e.queueInput(dir);
        return true;
      }
    }));
  }
}