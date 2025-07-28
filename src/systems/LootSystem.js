import { eventBus } from '../core/EventBus.js';
import itemData from '../data/items.js';

export class LootSystem {
  constructor() {
    this.lootTables = new Map();
    this.rarityWeights = {
      common: 65,
      uncommon: 25,
      rare: 8,
      epic: 1.5,
      legendary: 0.5
    };

    this.initializeLootTables();
    this.setupEventListeners();
  }

  initializeLootTables() {
    // Define loot tables for different enemy types
    this.lootTables.set('slime', {
      guaranteed: ['slime_gel'],
      possible: [
        { item: 'slime_gel', weight: 50, minQty: 1, maxQty: 3 },
        { item: 'small_potion', weight: 10, minQty: 1, maxQty: 1 },
        { item: 'gold', weight: 30, minQty: 1, maxQty: 5 }
      ]
    });

    this.lootTables.set('goblin', {
      guaranteed: [],
      possible: [
        { item: 'goblin_ear', weight: 60, minQty: 1, maxQty: 2 },
        { item: 'small_potion', weight: 20, minQty: 1, maxQty: 2 },
        { item: 'iron_sword', weight: 5, minQty: 1, maxQty: 1 },
        { item: 'gold', weight: 40, minQty: 5, maxQty: 15 }
      ]
    });

    // Treasure chest loot tables
    this.lootTables.set('chest_common', {
      guaranteed: ['gold'],
      possible: [
        { item: 'gold', weight: 100, minQty: 10, maxQty: 50 },
        { item: 'small_potion', weight: 50, minQty: 1, maxQty: 3 },
        { item: 'iron_sword', weight: 10, minQty: 1, maxQty: 1 }
      ]
    });
  }

  setupEventListeners() {
    eventBus.on('defeated', this.onEnemyDefeated.bind(this));
    eventBus.on('chestOpened', this.onChestOpened.bind(this));
  }

  generateLoot(lootTableId, luckModifier = 0) {
    const table = this.lootTables.get(lootTableId);
    if (!table) return [];

    const loot = [];

    // Add guaranteed items
    table.guaranteed.forEach(itemId => {
      loot.push(this.createLootItem(itemId, 1));
    });

    // Roll for possible items
    table.possible.forEach(entry => {
      const roll = Math.random() * 100;
      const adjustedWeight = entry.weight + luckModifier;

      if (roll < adjustedWeight) {
        const qty = this.randomInt(entry.minQty, entry.maxQty);
        loot.push(this.createLootItem(entry.item, qty));
      }
    });

    return loot;
  }

  createLootItem(itemId, quantity = 1) {
    // Special handling for gold/currency
    if (itemId === 'gold') {
      return {
        id: 'gold',
        name: 'Gold',
        type: 'currency',
        quantity,
        value: quantity
      };
    }

    // Regular items from item data
    const template = itemData[itemId];
    if (!template) {
      console.warn(`Unknown item: ${itemId}`);
      return null;
    }

    const item = {
      id: itemId,
      ...template,
      quantity,
      instanceId: `${itemId}_${Date.now()}_${Math.random()}`
    };

    // Add random properties for equipment
    if (template.type === 'weapon' || template.type === 'armor') {
      this.addRandomProperties(item);
    }

    return item;
  }

  addRandomProperties(item) {
    const rarity = this.rollRarity();
    item.rarity = rarity;

    // Add bonus stats based on rarity
    const bonusMultiplier = {
      common: 1,
      uncommon: 1.2,
      rare: 1.5,
      epic: 2,
      legendary: 3
    };

    const mult = bonusMultiplier[rarity];

    if (item.attack) {
      item.attack = Math.floor(item.attack * mult);
    }

    if (item.defense) {
      item.defense = Math.floor(item.defense * mult);
    }

    // Add special properties for rare+ items
    if (rarity === 'rare' || rarity === 'epic' || rarity === 'legendary') {
      item.properties = this.generateSpecialProperties(rarity);
    }

    // Update value based on rarity
    item.value = Math.floor(item.value * mult * (rarity === 'legendary' ? 10 : 1));
  }

  rollRarity() {
    const total = Object.values(this.rarityWeights).reduce((sum, w) => sum + w, 0);
    let roll = Math.random() * total;

    for (const [rarity, weight] of Object.entries(this.rarityWeights)) {
      roll -= weight;
      if (roll <= 0) return rarity;
    }

    return 'common';
  }

  generateSpecialProperties(rarity) {
    const properties = [];
    const propertyPool = [
      { id: 'lifesteal', name: 'Life Steal', value: 5 },
      { id: 'critchance', name: 'Critical Chance', value: 10 },
      { id: 'movespeed', name: 'Movement Speed', value: 0.5 },
      { id: 'expbonus', name: 'Experience Bonus', value: 15 },
      { id: 'goldfind', name: 'Gold Find', value: 20 }
    ];

    const numProperties = rarity === 'rare' ? 1 : rarity === 'epic' ? 2 : 3;

    for (let i = 0; i < numProperties && propertyPool.length > 0; i++) {
      const index = Math.floor(Math.random() * propertyPool.length);
      properties.push(propertyPool.splice(index, 1)[0]);
    }

    return properties;
  }

  onEnemyDefeated({ attacker, defender }) {
    if (attacker.type !== 'player') return;

    // Generate loot based on enemy type
    const lootTable = defender.name ? defender.name.toLowerCase() : 'slime';
    const playerLuck = attacker.stats.luck || 0;
    const loot = this.generateLoot(lootTable, playerLuck);

    if (loot.length === 0) return;

    // Create loot drop in world
    eventBus.emit('lootDropped', {
      position: { x: defender.tileX, y: defender.tileY },
      items: loot,
      source: defender
    });

    // Auto-pickup for now (could make this require player interaction)
    loot.forEach(item => {
      if (item) {
        eventBus.emit('itemAdded', { entity: attacker, item });
      }
    });
  }

  onChestOpened({ entity, chest }) {
    if (entity.type !== 'player') return;

    const lootTable = chest.lootTable || 'chest_common';
    const playerLuck = entity.stats.luck || 0;
    const loot = this.generateLoot(lootTable, playerLuck);

    loot.forEach(item => {
      if (item) {
        eventBus.emit('itemAdded', { entity, item });
      }
    });

    eventBus.emit('lootReceived', { entity, items: loot, source: chest });
  }

  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}