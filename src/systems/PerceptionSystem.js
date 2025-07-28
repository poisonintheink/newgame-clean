export class PerceptionSystem {
  constructor() {
    this.senses = new Map();
  }

  registerSense(name, sense) {
    if (name && sense && typeof sense.scan === 'function') {
      this.senses.set(name, sense);
    }
  }

  perceive(entity, world, deltaTime, context = {}) {
    const results = {};
    for (const [name, sense] of this.senses) {
      results[name] = sense.scan(entity, world, deltaTime, context);
    }
    return results;
  }
}