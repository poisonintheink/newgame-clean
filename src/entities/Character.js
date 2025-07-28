import { Entity } from './Entity.js';

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
  }
}