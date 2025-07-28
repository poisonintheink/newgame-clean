import { Player } from './Player.js';
import { Enemy } from './Enemy.js';
import enemyData from '../data/enemies.js';
import itemData from '../data/items.js';
import { TILE_SIZE } from '../utils/constants.js';

export class EntityFactory {
  static nextId = 1;

  /**
   * Generate a unique entity ID
   */
  static generateId(prefix = 'entity') {
    return `${prefix}-${this.nextId++}`;
  }

  /**
   * Create an enemy from template data
   */
  static createEnemy(type, tileX, tileY, tileSize = TILE_SIZE) {
    const template = enemyData[type];
    if (!template) {
      console.error(`Unknown enemy type: ${type}`);
      return null;
    }
    
    const enemy = new Enemy(tileX, tileY, tileSize);
    enemy.id = this.generateId(type);
    enemy.name = template.name;
    enemy.hitPoints = template.hp;
    enemy.maxHitPoints = template.hp;
    enemy.stats.strength = template.attack;
    enemy.stats.defense = template.defense;
    enemy.stats.agility = template.speed;
    enemy.drops = template.drops || [];
    
    // Customize sprite color based on type
    if (type === 'slime') {
      enemy.color = 0x00ff00;
    } else if (type === 'goblin') {
      enemy.color = 0x8b4513;
    }
    
    // Recreate sprite with new color
    if (enemy.sprite) {
      enemy.sprite.destroy();
      enemy.sprite = enemy.createSprite();
    }
    
    return enemy;
  }

  /**
   * Create a player instance
   */
  static createPlayer(tileX, tileY, tileSize = TILE_SIZE) {
    const player = new Player(tileX, tileY, tileSize);
    player.id = 'player';
    player.name = 'Hero';
    return player;
  }

  /**
   * Create an item entity (placeholder for future ItemEntity class)
   */
  static createItem(type, tileX, tileY) {
    const template = itemData[type];
    if (!template) {
      console.error(`Unknown item type: ${type}`);
      return null;
    }
    
    // For now, return a simple object
    // Will be replaced with ItemEntity in Phase 1
    return {
      id: this.generateId('item'),
      type: 'item',
      itemType: type,
      tileX,
      tileY,
      ...template
    };
  }

  /**
   * Create multiple enemies in an area
   */
  static createEnemyGroup(type, centerX, centerY, count, radius = 3) {
    const enemies = [];
    
    for (let i = 0; i < count; i++) {
      // Find a random position within radius
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius;
      const x = Math.round(centerX + Math.cos(angle) * dist);
      const y = Math.round(centerY + Math.sin(angle) * dist);
      
      const enemy = this.createEnemy(type, x, y);
      if (enemy) {
        enemies.push(enemy);
      }
    }
    
    return enemies;
  }

  /**
   * Serialize an entity for saving
   */
  static serializeEntity(entity) {
    const data = {
      id: entity.id,
      type: entity.type,
      position: { x: entity.tileX, y: entity.tileY },
      hitPoints: entity.hitPoints,
      maxHitPoints: entity.maxHitPoints,
      level: entity.level,
      experience: entity.experience,
      stats: { ...entity.stats },
      inventory: entity.inventory.map(item => 
        typeof item === 'string' ? item : { ...item }
      ),
      facing: entity.facing
    };
    
    if (entity.knowledge) {
      data.knowledge = entity.serializeKnowledge();
    }
    
    return data;
  }

  /**
   * Deserialize an entity from saved data
   */
  static deserializeEntity(data) {
    let entity;
    
    if (data.type === 'player') {
      entity = this.createPlayer(data.position.x, data.position.y);
    } else if (data.type === 'enemy') {
      // Determine enemy type from name or other data
      const enemyType = data.name ? 
        Object.keys(enemyData).find(key => enemyData[key].name === data.name) : 
        'slime';
      entity = this.createEnemy(enemyType, data.position.x, data.position.y);
    } else {
      console.warn(`Unknown entity type: ${data.type}`);
      return null;
    }
    
    // Restore saved properties
    entity.id = data.id;
    entity.hitPoints = data.hitPoints;
    entity.maxHitPoints = data.maxHitPoints;
    entity.level = data.level || 1;
    entity.experience = data.experience || 0;
    entity.facing = data.facing || 'down';
    
    if (data.stats) {
      Object.assign(entity.stats, data.stats);
    }
    
    if (data.inventory) {
      entity.inventory = data.inventory;
    }
    
    if (data.knowledge && entity.loadKnowledge) {
      entity.loadKnowledge(data.knowledge);
    }
    
    return entity;
  }
}