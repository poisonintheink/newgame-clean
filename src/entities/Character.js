import { Entity } from './Entity.js';
import { KnowledgeBase } from '../systems/KnowledgeSystem.js';

export class Character extends Entity {
  constructor(tileX = 0, tileY = 0, tileSize = 32) {
    super(tileX, tileY, tileSize);

    // Basic RPG properties
    this.hitPoints = 100;
    this.stats = {
      strength: 10,
      agility: 10,
      intelligence: 10
    };

    // Inventory placeholder (array of item references)
    this.inventory = [];
    // Knowledge base for storing learned facts
    this.knowledge = new KnowledgeBase();
  }

  /**
   * Serialize the entity's knowledge base.
   */
  serializeKnowledge() {
    return this.knowledge.serialize();
  }

  /**
   * Load knowledge data into the entity.
   */
  loadKnowledge(data) {
    this.knowledge = KnowledgeBase.deserialize(data);
  }
}