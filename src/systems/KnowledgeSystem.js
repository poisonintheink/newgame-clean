export class KnowledgeBase {
  constructor(data = []) {
    this.facts = [];
    if (Array.isArray(data)) {
      for (const fact of data) {
        this.learn(fact);
      }
    }
  }

  /**
   * Add a fact or memory to the knowledge base.
   * @param {object} fact
   */
  learn(fact) {
    if (!fact) return;
    const entry = { ...fact };
    if (!entry.timestamp) entry.timestamp = Date.now();
    this.facts.push(entry);
  }

  /**
   * Retrieve facts. Accepts an index, filter function, or query object.
   * @param {number|function|object} filter
   */
  remember(filter) {
    if (typeof filter === 'number') {
      return this.facts[filter] || null;
    }
    if (typeof filter === 'function') {
      return this.facts.filter(filter);
    }
    if (filter && typeof filter === 'object') {
      return this.query(filter);
    }
    return null;
  }

  /**
   * Search stored facts by matching keys.
   * @param {object} criteria
   */
  query(criteria = {}) {
    return this.facts.filter(f => {
      for (const key of Object.keys(criteria)) {
        if (f[key] !== criteria[key]) return false;
      }
      return true;
    });
  }

  /**
   * Convert the knowledge base to a serialisable form.
   */
  serialize() {
    return this.facts.map(f => ({ ...f }));
  }

  /**
   * Create a KnowledgeBase from serialised data.
   */
  static deserialize(data) {
    return new KnowledgeBase(Array.isArray(data) ? data : []);
  }
}