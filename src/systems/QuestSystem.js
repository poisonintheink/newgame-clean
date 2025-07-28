import { eventBus } from '../core/EventBus.js';

export class Quest {
  constructor(id, data) {
    this.id = id;
    this.name = data.name;
    this.description = data.description;
    this.objectives = data.objectives || [];
    this.rewards = data.rewards || {};
    this.status = 'available'; // available, active, completed, failed
    this.progress = {};
    
    // Initialize progress tracking
    this.objectives.forEach(obj => {
      this.progress[obj.id] = {
        current: 0,
        required: obj.required || 1,
        completed: false
      };
    });
  }

  updateProgress(objectiveId, amount = 1) {
    if (!this.progress[objectiveId] || this.status !== 'active') return false;
    
    const prog = this.progress[objectiveId];
    prog.current = Math.min(prog.current + amount, prog.required);
    prog.completed = prog.current >= prog.required;
    
    // Check if quest is complete
    const allComplete = Object.values(this.progress).every(p => p.completed);
    if (allComplete) {
      this.status = 'completed';
      return true;
    }
    return false;
  }

  getProgressPercent() {
    const total = Object.values(this.progress).reduce((sum, p) => sum + p.required, 0);
    const current = Object.values(this.progress).reduce((sum, p) => sum + p.current, 0);
    return total > 0 ? (current / total) * 100 : 0;
  }
}

export class QuestSystem {
  constructor() {
    this.quests = new Map();
    this.activeQuests = new Set();
    this.completedQuests = new Set();
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for events that might progress quests
    eventBus.on('defeated', this.onEnemyDefeated.bind(this));
    eventBus.on('itemAdded', this.onItemCollected.bind(this));
    eventBus.on('move', this.onEntityMove.bind(this));
    eventBus.on('entityDiscovered', this.onEntityDiscovered.bind(this));
  }

  registerQuest(questData) {
    const quest = new Quest(questData.id, questData);
    this.quests.set(quest.id, quest);
    eventBus.emit('questAvailable', { quest });
  }

  startQuest(questId, entity) {
    const quest = this.quests.get(questId);
    if (!quest || quest.status !== 'available') return false;
    
    quest.status = 'active';
    this.activeQuests.add(questId);
    
    // Add quest knowledge to entity
    if (entity.knowledge) {
      entity.knowledge.learn({
        type: 'quest_start',
        questId: questId,
        questName: quest.name,
        timestamp: Date.now()
      });
    }
    
    eventBus.emit('questStarted', { quest, entity });
    return true;
  }

  updateQuestProgress(questId, objectiveId, amount = 1) {
    const quest = this.quests.get(questId);
    if (!quest || !this.activeQuests.has(questId)) return;
    
    const wasCompleted = quest.updateProgress(objectiveId, amount);
    
    eventBus.emit('questProgress', { 
      quest, 
      objectiveId, 
      progress: quest.progress[objectiveId] 
    });
    
    if (wasCompleted) {
      this.completeQuest(questId);
    }
  }

  completeQuest(questId) {
    const quest = this.quests.get(questId);
    if (!quest) return;
    
    this.activeQuests.delete(questId);
    this.completedQuests.add(questId);
    
    eventBus.emit('questCompleted', { quest, rewards: quest.rewards });
  }

  // Event handlers for automatic quest progression
  onEnemyDefeated({ attacker, defender }) {
    if (attacker.type !== 'player') return;
    
    // Check all active quests for defeat objectives
    for (const questId of this.activeQuests) {
      const quest = this.quests.get(questId);
      quest.objectives.forEach(obj => {
        if (obj.type === 'defeat' && obj.target === defender.name) {
          this.updateQuestProgress(questId, obj.id, 1);
        }
      });
    }
  }

  onItemCollected({ entity, item }) {
    if (entity.type !== 'player') return;
    
    const itemName = typeof item === 'string' ? item : item.name;
    
    for (const questId of this.activeQuests) {
      const quest = this.quests.get(questId);
      quest.objectives.forEach(obj => {
        if (obj.type === 'collect' && obj.target === itemName) {
          this.updateQuestProgress(questId, obj.id, 1);
        }
      });
    }
  }

  onEntityMove({ entity, to }) {
    if (entity.type !== 'player') return;
    
    for (const questId of this.activeQuests) {
      const quest = this.quests.get(questId);
      quest.objectives.forEach(obj => {
        if (obj.type === 'reach' && 
            obj.location.x === to.x && 
            obj.location.y === to.y) {
          this.updateQuestProgress(questId, obj.id, 1);
        }
      });
    }
  }

  onEntityDiscovered({ discoverer, discovered }) {
    if (discoverer.type !== 'player') return;
    
    for (const questId of this.activeQuests) {
      const quest = this.quests.get(questId);
      quest.objectives.forEach(obj => {
        if (obj.type === 'discover' && obj.target === discovered.type) {
          this.updateQuestProgress(questId, obj.id, 1);
        }
      });
    }
  }

  getActiveQuests() {
    return Array.from(this.activeQuests).map(id => this.quests.get(id));
  }

  getQuestsByStatus(status) {
    return Array.from(this.quests.values()).filter(q => q.status === status);
  }
}

// Add quest UI helper
export class QuestTracker {
  constructor() {
    this.container = new PIXI.Container();
    this.background = new PIXI.Graphics();
    this.questTexts = [];
    this.width = 250;
    this.padding = 10;
    
    this.setupBackground();
  }

  setupBackground() {
    this.background.rect(0, 0, this.width, 100);
    this.background.fill({ color: 0x000000, alpha: 0.7 });
    this.container.addChild(this.background);
  }

  updateQuests(activeQuests) {
    // Clear old texts
    this.questTexts.forEach(t => t.destroy());
    this.questTexts = [];
    
    let yOffset = this.padding;
    
    activeQuests.forEach((quest, index) => {
      if (index >= 3) return; // Show max 3 quests
      
      // Quest name
      const nameText = new PIXI.Text({
        text: quest.name,
        style: {
          fontFamily: 'Arial',
          fontSize: 14,
          fill: 0xffd700,
          fontWeight: 'bold'
        }
      });
      nameText.x = this.padding;
      nameText.y = yOffset;
      this.container.addChild(nameText);
      this.questTexts.push(nameText);
      
      yOffset += 20;
      
      // Quest objectives
      quest.objectives.forEach(obj => {
        const progress = quest.progress[obj.id];
        const text = `${obj.description}: ${progress.current}/${progress.required}`;
        const objText = new PIXI.Text({
          text,
          style: {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: progress.completed ? 0x00ff00 : 0xffffff
          }
        });
        objText.x = this.padding + 10;
        objText.y = yOffset;
        this.container.addChild(objText);
        this.questTexts.push(objText);
        
        yOffset += 16;
      });
      
      yOffset += 10; // Space between quests
    });
    
    // Update background height
    this.background.clear();
    this.background.rect(0, 0, this.width, yOffset);
    this.background.fill({ color: 0x000000, alpha: 0.7 });
  }
}

// Example quest data structure
export const questTemplates = {
  tutorial_combat: {
    id: 'tutorial_combat',
    name: 'First Steps',
    description: 'Learn the basics of combat and exploration',
    objectives: [
      {
        id: 'defeat_slimes',
        type: 'defeat',
        target: 'Slime',
        required: 3,
        description: 'Defeat 3 slimes'
      },
      {
        id: 'collect_gel',
        type: 'collect',
        target: 'slime_gel',
        required: 5,
        description: 'Collect 5 slime gel'
      }
    ],
    rewards: {
      experience: 100,
      items: ['small_potion', 'small_potion'],
      knowledge: { type: 'combat_basics', description: 'Basic combat techniques' }
    }
  },
  
  explore_world: {
    id: 'explore_world',
    name: 'Explorer',
    description: 'Discover new areas of the world',
    objectives: [
      {
        id: 'visit_village',
        type: 'reach',
        location: { x: 50, y: 50 }, // Example coordinates
        description: 'Visit the village'
      },
      {
        id: 'discover_ruins',
        type: 'discover',
        target: 'ruins',
        required: 1,
        description: 'Discover ancient ruins'
      }
    ],
    rewards: {
      experience: 150,
      knowledge: { type: 'world_lore', description: 'Knowledge about the world' }
    }
  }
};