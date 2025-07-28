import { eventBus } from '../core/EventBus.js';

export class ProgressionSystem {
  constructor() {
    this.experienceTables = {
      player: this.generateExpTable(50, 1.2), // 50 base XP, 1.2x multiplier per level
      skills: this.generateExpTable(20, 1.15)
    };

    this.skills = new Map();
    this.initializeSkills();
    this.setupEventListeners();
  }

  initializeSkills() {
    const baseSkills = [
      { id: 'combat', name: 'Combat', description: 'Proficiency in battle' },
      { id: 'exploration', name: 'Exploration', description: 'Finding hidden areas and items' },
      { id: 'crafting', name: 'Crafting', description: 'Creating items from materials' },
      { id: 'knowledge', name: 'Knowledge', description: 'Understanding of the world' }
    ];

    baseSkills.forEach(skill => {
      this.skills.set(skill.id, {
        ...skill,
        level: 1,
        experience: 0,
        unlocks: this.getSkillUnlocks(skill.id)
      });
    });
  }

  setupEventListeners() {
    eventBus.on('defeated', this.onCombatVictory.bind(this));
    eventBus.on('questCompleted', this.onQuestCompleted.bind(this));
    eventBus.on('itemCrafted', this.onItemCrafted.bind(this));
    eventBus.on('areaDiscovered', this.onAreaDiscovered.bind(this));
    eventBus.on('knowledgeGained', this.onKnowledgeGained.bind(this));
  }

  generateExpTable(baseXP, multiplier, maxLevel = 50) {
    const table = [];
    for (let level = 1; level <= maxLevel; level++) {
      table[level] = Math.floor(baseXP * Math.pow(multiplier, level - 1));
    }
    return table;
  }

  grantExperience(entity, amount, source = 'general') {
    if (!entity || amount <= 0) return;

    const oldLevel = entity.level;
    entity.experience += amount;

    // Check for level up
    while (entity.level < this.experienceTables.player.length - 1 &&
      entity.experience >= this.experienceTables.player[entity.level + 1]) {
      entity.level++;
      this.onLevelUp(entity, entity.level);
    }

    eventBus.emit('experienceGained', {
      entity,
      amount,
      source,
      oldLevel,
      newLevel: entity.level
    });

    // Store in knowledge base
    if (entity.knowledge) {
      entity.knowledge.learn({
        type: 'experience_gain',
        amount,
        source,
        totalExperience: entity.experience,
        level: entity.level
      });
    }
  }

  grantSkillExperience(entity, skillId, amount) {
    const skill = this.skills.get(skillId);
    if (!skill || amount <= 0) return;

    const oldLevel = skill.level;
    skill.experience += amount;

    // Check for skill level up
    while (skill.level < this.experienceTables.skills.length - 1 &&
      skill.experience >= this.experienceTables.skills[skill.level + 1]) {
      skill.level++;
      this.onSkillLevelUp(entity, skillId, skill.level);
    }

    eventBus.emit('skillExperienceGained', {
      entity,
      skillId,
      amount,
      oldLevel,
      newLevel: skill.level
    });
  }

  onLevelUp(entity, newLevel) {
    // Increase stats
    entity.maxHitPoints += 10;
    entity.hitPoints = entity.maxHitPoints; // Full heal on level up
    entity.stats.strength += 2;
    entity.stats.defense += 1;
    entity.stats.agility += 1;
    entity.stats.intelligence += 1;

    eventBus.emit('levelUp', { entity, level: newLevel });

    // Learn new abilities based on level
    const abilities = this.getUnlockedAbilities(newLevel);
    abilities.forEach(ability => {
      eventBus.emit('abilityUnlocked', { entity, ability });
    });
  }

  onSkillLevelUp(entity, skillId, newLevel) {
    const skill = this.skills.get(skillId);
    const unlocks = skill.unlocks[newLevel] || [];

    unlocks.forEach(unlock => {
      eventBus.emit('skillUnlocked', {
        entity,
        skillId,
        level: newLevel,
        unlock
      });
    });
  }

  getSkillUnlocks(skillId) {
    const unlocks = {
      combat: {
        5: ['power_strike'],
        10: ['defensive_stance'],
        15: ['whirlwind'],
        20: ['berserker_rage']
      },
      exploration: {
        5: ['enhanced_perception'],
        10: ['treasure_sense'],
        15: ['fast_travel'],
        20: ['master_explorer']
      },
      crafting: {
        5: ['efficient_crafting'],
        10: ['rare_materials'],
        15: ['master_recipes'],
        20: ['legendary_craft']
      },
      knowledge: {
        5: ['lore_master'],
        10: ['ancient_languages'],
        15: ['prophecy_sight'],
        20: ['omniscience']
      }
    };

    return unlocks[skillId] || {};
  }

  getUnlockedAbilities(level) {
    const abilities = [];

    if (level === 5) abilities.push({ id: 'dash', name: 'Dash', type: 'movement' });
    if (level === 10) abilities.push({ id: 'heal', name: 'Heal', type: 'restoration' });
    if (level === 15) abilities.push({ id: 'teleport', name: 'Teleport', type: 'movement' });
    if (level === 20) abilities.push({ id: 'ultimate', name: 'Ultimate Power', type: 'special' });

    return abilities;
  }

  // Event handlers
  onCombatVictory({ attacker, defender }) {
    if (attacker.type !== 'player') return;

    // Grant combat XP based on enemy difficulty
    const baseXP = defender.level ? defender.level * 10 : 10;
    this.grantExperience(attacker, baseXP, 'combat');
    this.grantSkillExperience(attacker, 'combat', baseXP / 2);
  }

  onQuestCompleted({ quest, rewards }) {
    const player = this.getPlayer(); // Implement method to get player reference
    if (!player || !rewards.experience) return;

    this.grantExperience(player, rewards.experience, 'quest');

    // Grant knowledge skill XP for quest completion
    this.grantSkillExperience(player, 'knowledge', rewards.experience / 3);
  }

  onItemCrafted({ entity, item, materials }) {
    if (entity.type !== 'player') return;

    const craftXP = 10 + (materials.length * 5);
    this.grantSkillExperience(entity, 'crafting', craftXP);
  }

  onAreaDiscovered({ entity, area }) {
    if (entity.type !== 'player') return;

    const exploreXP = area.difficulty ? area.difficulty * 15 : 15;
    this.grantSkillExperience(entity, 'exploration', exploreXP);
    this.grantExperience(entity, exploreXP / 2, 'exploration');
  }

  onKnowledgeGained({ entity, knowledge }) {
    if (entity.type !== 'player') return;

    const knowledgeXP = knowledge.importance ? knowledge.importance * 5 : 5;
    this.grantSkillExperience(entity, 'knowledge', knowledgeXP);
  }

  getPlayerStats(entity) {
    if (!entity) return null;

    return {
      level: entity.level,
      experience: entity.experience,
      experienceToNext: this.experienceTables.player[entity.level + 1] - entity.experience,
      skills: Array.from(this.skills.entries()).map(([id, skill]) => ({
        id,
        ...skill,
        experienceToNext: this.experienceTables.skills[skill.level + 1] - skill.experience
      }))
    };
  }

  // Helper method - should be implemented to get player reference
  getPlayer() {
    // This would typically get the player from the entity registry or game state
    return null;
  }
}