export class BehaviorNode {
  tick(entity, world, context = {}) {
    throw new Error('tick() not implemented');
  }
}

export class TaskNode extends BehaviorNode {
  constructor(taskFn) {
    super();
    this.taskFn = taskFn;
  }

  tick(entity, world, context = {}) {
    return this.taskFn(entity, world, context);
  }
}

export class ConditionNode extends BehaviorNode {
  constructor(conditionFn) {
    super();
    this.conditionFn = conditionFn;
  }

  tick(entity, world, context = {}) {
    return !!this.conditionFn(entity, world, context);
  }
}

export class SequenceNode extends BehaviorNode {
  constructor(children = []) {
    super();
    this.children = children;
  }

  tick(entity, world, context = {}) {
    for (const child of this.children) {
      if (!child.tick(entity, world, context)) {
        return false;
      }
    }
    return true;
  }
}

export class SelectorNode extends BehaviorNode {
  constructor(children = []) {
    super();
    this.children = children;
  }

  tick(entity, world, context = {}) {
    for (const child of this.children) {
      if (child.tick(entity, world, context)) {
        return true;
      }
    }
    return false;
  }
}