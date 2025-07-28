export class Task {
  constructor({ canExecute = () => true, execute = () => true } = {}) {
    this.canExecute = canExecute;
    this.execute = execute;
  }
}

export class TaskSystem {
  constructor() {
    this.queues = new Map(); // entity -> [Task]
  }

  /** Add one or more tasks for an entity */
  addTasks(entity, tasks) {
    if (!entity || !tasks) return;
    const queue = this.queues.get(entity) || [];
    if (Array.isArray(tasks)) {
      queue.push(...tasks);
    } else {
      queue.push(tasks);
    }
    this.queues.set(entity, queue);
  }

  /** Returns true if the entity has any queued tasks */
  hasTasks(entity) {
    const q = this.queues.get(entity);
    return q && q.length > 0;
  }

  /** Clear tasks for an entity */
  clear(entity) {
    this.queues.delete(entity);
  }

  /**
   * Update all entity queues. Each task defines canExecute and execute hooks.
   * When a task's execute returns true it is removed from the queue.
   */
  update(deltaTime, world, context = {}) {
    for (const [entity, queue] of this.queues.entries()) {
      if (queue.length === 0) continue;
      const task = queue[0];
      if (typeof task.canExecute !== 'function' || typeof task.execute !== 'function') {
        queue.shift();
        continue;
      }
      if (task.canExecute(entity, world, context)) {
        const done = task.execute(entity, world, context);
        if (done) queue.shift();
      }
      if (queue.length === 0) this.queues.delete(entity);
    }
  }
}