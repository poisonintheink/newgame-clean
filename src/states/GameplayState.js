// src/states/GameplayState.js
import * as PIXI from 'pixi.js';
import { State } from '../core/StateManager.js';
import { Camera } from '../world/Camera.js';
import { World } from '../world/World.js';
import { TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT } from '../utils/constants.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { EntityFactory } from '../entities/EntityFactory.js';
import { UIManager } from '../ui/UIManager.js';
import { PerceptionSystem } from '../systems/PerceptionSystem.js';
import { VisionSense } from '../systems/senses/VisionSense.js';
import { SmellSense } from '../systems/senses/SmellSense.js';
import { MovementSystem } from '../systems/MovementSystem.js';
import { BattleSystem } from '../systems/BattleSystem.js';
import { IdleSystem } from '../systems/IdleSystem.js';
import { InventorySystem } from '../systems/InventorySystem.js';
import { QuestSystem, questTemplates, QuestTracker } from '../systems/QuestSystem.js';
import { ProgressionSystem } from '../systems/ProgressionSystem.js';
import { LootSystem } from '../systems/LootSystem.js';
import { eventBus } from '../core/EventBus.js';

export class GameplayState extends State {
  constructor(game) {
    super(game);

    // Containers
    this.container = new PIXI.Container();
    this.worldContainer = new PIXI.Container();
    this.uiContainer = new PIXI.Container();

    // UI manager
    this.uiManager = null;

    // Game objects
    this.world = null;
    this.camera = null;
    this.player = null;

    // Camera state
    this.isFollowingPlayer = true;

    // Debug info
    this.debugText = null;
    this.showDebug = true;

    // Systems object for organized access
    this.systems = {
      movement: null,
      battle: null,
      idle: null,
      inventory: null,
      perception: null,
      quest: null,
      progression: null,
      loot: null
    };

    // Entity tracking
    this.entities = new Map();
    this.lootDrops = new Map();

    // UI elements
    this.questTracker = null;
    this.statsDisplay = null;

    // Game state flags
    this.isPaused = false;
  }

  async enter(params = {}) {
    const app = this.game.app;

    // Create world using shared constants
    this.world = new World(WORLD_WIDTH, WORLD_HEIGHT, TILE_SIZE, app.renderer);
    this.worldContainer.addChild(this.world.container);

    // Create camera
    this.camera = new Camera(
      app.screen.width,
      app.screen.height,
      this.world.width,
      this.world.height
    );

    // Initialize all systems
    this.initializeSystems();

    // Create player at random walkable position
    const startPos = this.world.getRandomWalkablePosition();
    this.player = EntityFactory.createPlayer(startPos.tileX, startPos.tileY, TILE_SIZE);
    this.registerEntity(this.player);

    // Create initial enemies
    this.spawnInitialEnemies();

    // Camera follows player
    this.camera.follow(this.player, true);

    // Initialize UI
    this.initializeUI();

    // Structure containers
    this.container.addChild(this.worldContainer);
    this.container.addChild(this.uiContainer);

    // Add to stage
    app.stage.addChild(this.container);

    // Set up input handlers
    this.setupInput();

    // Set up event listeners
    this.setupEventListeners();

    // Handle mouse wheel zoom
    this.handleWheel = (e) => this.onWheel(e);
    window.addEventListener('wheel', this.handleWheel, { passive: false });

    // Start initial quest
    this.systems.quest.registerQuest(questTemplates.tutorial_combat);
    this.systems.quest.startQuest('tutorial_combat', this.player);

    // Initial world render
    this.world.renderVisibleChunks(this.camera);

    console.log('Entered gameplay state');
    console.log(`World size: ${this.world.width}x${this.world.height} pixels`);
    console.log(`Player starting at tile: ${this.player.tileX}, ${this.player.tileY}`);
  }

  initializeSystems() {
    // Core systems
    this.systems.movement = new MovementSystem();
    this.systems.battle = new BattleSystem();
    this.systems.idle = new IdleSystem(5);
    this.systems.inventory = new InventorySystem();

    // Perception system
    this.systems.perception = new PerceptionSystem();
    this.systems.perception.registerSense('vision', new VisionSense());
    this.systems.perception.registerSense('smell', new SmellSense());

    // Gameplay systems
    this.systems.quest = new QuestSystem();
    this.systems.progression = new ProgressionSystem();
    this.systems.loot = new LootSystem();
  }

  initializeUI() {
    // Basic UI manager
    this.uiManager = new UIManager();
    this.uiContainer.addChild(this.uiManager.container);

    // Quest tracker
    this.questTracker = new QuestTracker();
    this.questTracker.container.x = this.game.app.screen.width - 260;
    this.questTracker.container.y = 10;
    this.uiContainer.addChild(this.questTracker.container);

    // Stats display
    this.createStatsDisplay();

    // Debug info
    this.createDebugInfo();

    // Instructions
    this.createInstructions();
  }

  createStatsDisplay() {
    const statsContainer = new PIXI.Container();

    // Background
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, 200, 100);
    bg.fill({ color: 0x000000, alpha: 0.7 });
    statsContainer.addChild(bg);

    // Stats text
    this.statsText = new PIXI.Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: 0xffffff
      }
    });
    this.statsText.x = 10;
    this.statsText.y = 10;
    statsContainer.addChild(this.statsText);

    statsContainer.x = 10;
    statsContainer.y = 60;
    this.uiContainer.addChild(statsContainer);
    this.statsDisplay = statsContainer;
  }

  createDebugInfo() {
    const debugStyle = {
      fontFamily: 'monospace',
      fontSize: 14,
      fill: 0xffffff,
      stroke: 0x000000,
      strokeThickness: 4
    };

    this.debugText = new PIXI.Text({
      text: '',
      style: debugStyle
    });
    this.debugText.x = 10;
    this.debugText.y = 10;

    this.uiContainer.addChild(this.debugText);
  }

  createInstructions() {
    const instructions = new PIXI.Text({
      text: 'WASD/Arrows: Move | F: Toggle Follow | T: Toggle Auto | I: Inventory | Q: Quests | C: Stats | Tab: Debug | ESC: Menu',
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: 0xcccccc,
        stroke: { color: 0x000000, width: 3 }
      }
    });
    instructions.x = 10;
    instructions.y = this.game.app.screen.height - 30;
    this.uiContainer.addChild(instructions);
  }

  registerEntity(entity) {
    this.entities.set(entity.id, entity);
    this.world.addEntity(entity);

    // Add to relevant systems
    this.systems.movement.addEntity(entity);
    this.systems.idle.addEntity(entity);

    return entity;
  }

  spawnInitialEnemies() {
    // Spawn some slimes near player
    const playerX = this.player.tileX;
    const playerY = this.player.tileY;

    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 * i) / 5;
      const distance = 5 + Math.random() * 5;
      const x = Math.round(playerX + Math.cos(angle) * distance);
      const y = Math.round(playerY + Math.sin(angle) * distance);

      const pos = this.world.wrapCoords(x, y);
      if (this.world.isWalkable(pos.x, pos.y)) {
        const enemy = EntityFactory.createEnemy('slime', pos.x, pos.y, TILE_SIZE);
        this.registerEntity(enemy);
        this.systems.battle.engage(this.player, enemy);
      }
    }

    // Spawn some goblins further away
    for (let i = 0; i < 3; i++) {
      const pos = this.world.getRandomWalkablePosition();
      const enemy = EntityFactory.createEnemy('goblin', pos.tileX, pos.tileY, TILE_SIZE);
      this.registerEntity(enemy);
      this.systems.battle.engage(this.player, enemy);
    }
  }

  setupEventListeners() {
    // Movement events
    this.onEntityMove = this.onEntityMove.bind(this);
    eventBus.on('move', this.onEntityMove);

    // Battle events
    this.onAttack = this.onAttack.bind(this);
    this.onDefeated = this.onDefeated.bind(this);
    eventBus.on('attack', this.onAttack);
    eventBus.on('defeated', this.onDefeated);

    // Idle events
    this.onEntityIdle = this.onEntityIdle.bind(this);
    eventBus.on('idle', this.onEntityIdle);

    // Item events
    this.onItemAdded = this.onItemAdded.bind(this);
    this.onItemRemoved = this.onItemRemoved.bind(this);
    eventBus.on('itemAdded', this.onItemAdded);
    eventBus.on('itemRemoved', this.onItemRemoved);

    // Quest events
    this.onQuestProgress = this.onQuestProgress.bind(this);
    this.onQuestCompleted = this.onQuestCompleted.bind(this);
    eventBus.on('questProgress', this.onQuestProgress);
    eventBus.on('questCompleted', this.onQuestCompleted);

    // Progression events
    this.onLevelUp = this.onLevelUp.bind(this);
    this.onExperienceGained = this.onExperienceGained.bind(this);
    eventBus.on('levelUp', this.onLevelUp);
    eventBus.on('experienceGained', this.onExperienceGained);

    // Loot events
    this.onLootDropped = this.onLootDropped.bind(this);
    eventBus.on('lootDropped', this.onLootDropped);
  }

  cleanupEventListeners() {
    eventBus.off('move', this.onEntityMove);
    eventBus.off('attack', this.onAttack);
    eventBus.off('defeated', this.onDefeated);
    eventBus.off('idle', this.onEntityIdle);
    eventBus.off('itemAdded', this.onItemAdded);
    eventBus.off('itemRemoved', this.onItemRemoved);
    eventBus.off('questProgress', this.onQuestProgress);
    eventBus.off('questCompleted', this.onQuestCompleted);
    eventBus.off('levelUp', this.onLevelUp);
    eventBus.off('experienceGained', this.onExperienceGained);
    eventBus.off('lootDropped', this.onLootDropped);
  }

  onEntityMove({ entity, from, to }) {
    // Check for collision with items, triggers, etc.
    console.log(`${entity.type} moved from ${from.x},${from.y} to ${to.x},${to.y}`);
  }

  onAttack({ attacker, defender, damage }) {
    console.log(`${attacker.type} attacks ${defender.type} for ${damage} damage!`);

    // Create floating damage text
    const damageText = new PIXI.Text({
      text: `-${damage}`,
      style: {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: 0xff0000,
        fontWeight: 'bold',
        stroke: { color: 0x000000, width: 2 }
      }
    });

    damageText.anchor.set(0.5);
    damageText.x = defender.x;
    damageText.y = defender.y - 20;
    this.worldContainer.addChild(damageText);

    // Animate floating up and fading
    const startY = damageText.y;
    const duration = 1000;
    const startTime = Date.now();

    const animateDamage = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        damageText.destroy();
        return;
      }

      damageText.y = startY - (30 * progress);
      damageText.alpha = 1 - progress;
      requestAnimationFrame(animateDamage);
    };

    animateDamage();
  }

  onDefeated({ attacker, defender }) {
    console.log(`${defender.type} was defeated by ${attacker.type}!`);

    // Grant experience
    if (attacker === this.player) {
      const baseXP = defender.level ? defender.level * 10 : 10;
      this.systems.progression.grantExperience(attacker, baseXP, 'combat');
    }

    // Handle drops
    if (defender.drops) {
      defender.drops.forEach(dropId => {
        console.log(`${defender.type} dropped ${dropId}`);
      });
    }

    // Remove defeated entity
    this.removeEntity(defender);

    // Spawn replacement enemy after delay
    setTimeout(() => {
      const pos = this.world.getRandomWalkablePosition();
      const enemyType = Math.random() < 0.7 ? 'slime' : 'goblin';
      const newEnemy = EntityFactory.createEnemy(enemyType, pos.tileX, pos.tileY, TILE_SIZE);
      this.registerEntity(newEnemy);
      this.systems.battle.engage(this.player, newEnemy);
    }, 5000);
  }

  onEntityIdle({ entity, idleTime }) {
    console.log(`${entity.type} has been idle for ${idleTime.toFixed(1)} seconds`);
  }

  onItemAdded({ entity, item }) {
    console.log(`${entity.type} picked up ${item.name || item}`);
  }

  onItemRemoved({ entity, item }) {
    console.log(`${entity.type} lost ${item.name || item}`);
  }

  onQuestProgress({ quest, objectiveId, progress }) {
    console.log(`Quest progress: ${quest.name} - ${progress.current}/${progress.required}`);
    this.updateQuestTracker();
  }

  onQuestCompleted({ quest, rewards }) {
    console.log(`Quest completed: ${quest.name}!`);

    // Show completion notification
    const notification = new PIXI.Text({
      text: `Quest Complete!\n${quest.name}`,
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xffd700,
        fontWeight: 'bold',
        align: 'center',
        stroke: { color: 0x000000, width: 4 }
      }
    });

    notification.anchor.set(0.5);
    notification.x = this.game.app.screen.width / 2;
    notification.y = 100;
    this.uiContainer.addChild(notification);

    // Fade out after 3 seconds
    setTimeout(() => {
      notification.destroy();
    }, 3000);

    // Apply rewards
    if (rewards.items) {
      rewards.items.forEach(itemId => {
        this.systems.inventory.addItem(this.player, itemId);
      });
    }

    // Start next quest
    if (quest.id === 'tutorial_combat') {
      this.systems.quest.registerQuest(questTemplates.explore_world);
      this.systems.quest.startQuest('explore_world', this.player);
    }

    this.updateQuestTracker();
  }

  onLevelUp({ entity, level }) {
    if (entity !== this.player) return;

    console.log(`Level up! Now level ${level}`);

    // Show level up effect
    const levelUpText = new PIXI.Text({
      text: 'LEVEL UP!',
      style: {
        fontFamily: 'Arial',
        fontSize: 32,
        fill: 0x00ff00,
        fontWeight: 'bold',
        stroke: { color: 0x000000, width: 4 }
      }
    });

    levelUpText.anchor.set(0.5);
    levelUpText.x = entity.x;
    levelUpText.y = entity.y - 40;
    this.worldContainer.addChild(levelUpText);

    // Animate
    const startTime = Date.now();
    const animateLevelUp = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > 2000) {
        levelUpText.destroy();
        return;
      }

      levelUpText.scale.set(1 + Math.sin(elapsed * 0.01) * 0.1);
      levelUpText.alpha = Math.max(0, 1 - (elapsed / 2000));
      requestAnimationFrame(animateLevelUp);
    };

    animateLevelUp();
  }

  onExperienceGained({ entity, amount }) {
    if (entity !== this.player) return;

    // Show XP gain text
    const xpText = new PIXI.Text({
      text: `+${amount} XP`,
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: 0xffff00,
        stroke: { color: 0x000000, width: 2 }
      }
    });

    xpText.anchor.set(0.5);
    xpText.x = entity.x + 20;
    xpText.y = entity.y;
    this.worldContainer.addChild(xpText);

    setTimeout(() => xpText.destroy(), 1000);
  }

  onLootDropped({ position, items }) {
    // Create visual loot drop
    const lootSprite = new PIXI.Graphics();
    lootSprite.circle(0, 0, 8);
    lootSprite.fill(0xffd700);
    lootSprite.x = position.x * TILE_SIZE + TILE_SIZE / 2;
    lootSprite.y = position.y * TILE_SIZE + TILE_SIZE / 2;

    this.worldContainer.addChild(lootSprite);
    this.lootDrops.set(`${position.x},${position.y}`, { sprite: lootSprite, items });
  }

  removeEntity(entity) {
    // Remove from all systems
    this.systems.movement.removeEntity(entity);
    this.systems.idle.removeEntity(entity);
    this.systems.battle.disengage(null, entity);

    // Remove from world
    this.world.removeEntity(entity);

    // Remove from tracking
    this.entities.delete(entity.id);

    // Clean up entity
    entity.destroy();
  }

  updateQuestTracker() {
    const activeQuests = this.systems.quest.getActiveQuests();
    this.questTracker.updateQuests(activeQuests);
  }

  setupInput() {
    // Keyboard controls
    this.handleKeyDown = (e) => this.onKeyDown(e);
    this.handleKeyUp = (e) => this.onKeyUp(e);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // Mouse/touch controls for camera (optional)
    this.container.interactive = true;
    this.isDragging = false;
    this.lastDragPos = { x: 0, y: 0 };

    this.container.on('pointerdown', (e) => {
      if (e.data.button === 2) { // Right mouse button
        this.isDragging = true;
        this.lastDragPos = e.data.global.clone();
        this.camera.unfollow(); // Stop following player while dragging
        this.isFollowingPlayer = false;
      }
    });

    this.container.on('pointermove', (e) => {
      if (this.isDragging) {
        const dx = e.data.global.x - this.lastDragPos.x;
        const dy = e.data.global.y - this.lastDragPos.y;
        this.camera.move(-dx, -dy);
        this.lastDragPos = e.data.global.clone();
      }
    });

    this.container.on('pointerup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.camera.follow(this.player);
        this.isFollowingPlayer = true;
      }
    });
  }

  cleanupInput() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.container.removeAllListeners();
  }

  onKeyDown(event) {
    switch (event.key) {
      // Player movement
      case 'ArrowUp':
      case 'w':
      case 'W':
        this.player.queueInput('up');
        event.preventDefault();
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        this.player.queueInput('down');
        event.preventDefault();
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.player.queueInput('left');
        event.preventDefault();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.player.queueInput('right');
        event.preventDefault();
        break;

      // Camera controls
      case 'f':
      case 'F':
        // Toggle camera follow
        if (this.isFollowingPlayer) {
          this.camera.unfollow();
          this.isFollowingPlayer = false;
          console.log('Camera unfollowed player');
        } else {
          this.camera.follow(this.player);
          this.isFollowingPlayer = true;
          console.log('Camera following player');
        }
        break;

      case 't':
      case 'T':
        // Toggle player automation
        this.player.toggleAutomation();
        console.log(`Automation: ${this.player.ai.enabled ? 'ON' : 'OFF'}`);
        break;

      // UI controls
      case 'i':
      case 'I':
        // Toggle inventory display
        if (this.uiManager.inventoryUI.container.visible) {
          this.hideInventory();
        } else {
          this.showInventory();
        }
        break;

      case 'q':
      case 'Q':
        // Toggle quest tracker
        this.questTracker.container.visible = !this.questTracker.container.visible;
        break;

      case 'c':
      case 'C':
        // Toggle stats display
        this.statsDisplay.visible = !this.statsDisplay.visible;
        break;

      case 'b':
      case 'B':
        // Toggle battle menu
        if (this.uiManager.battleUI.container.visible) {
          this.hideBattleMenu();
        } else {
          this.showBattleMenu();
        }
        break;

      // Zoom controls
      case '+':
      case '=':
        this.camera.adjustZoom(0.1);
        break;
      case '-':
      case '_':
        this.camera.adjustZoom(-0.1);
        break;
      case '0':
        this.camera.setZoom(1);
        break;

      // Other controls
      case 'Escape':
        this.returnToMenu();
        break;
      case 'Tab':
        this.showDebug = !this.showDebug;
        if (this.debugText) {
          this.debugText.visible = this.showDebug;
        }
        event.preventDefault();
        break;
      case ' ':
        // Camera shake test
        this.camera.shake(20, 0.5);
        event.preventDefault();
        break;
      case 'p':
      case 'P':
        this.isPaused = !this.isPaused;
        console.log(this.isPaused ? 'Paused' : 'Resumed');
        break;
    }
  }

  onKeyUp(event) {
    // Handle key up events if needed
  }

  onWheel(event) {
    // Prevent default browser zoom
    event.preventDefault();

    // Zoom based on wheel direction
    const zoomDelta = event.deltaY < 0 ? 0.1 : -0.1;
    this.camera.adjustZoom(zoomDelta);
  }

  update(deltaTime) {
    if (!this.world || !this.camera || !this.player || this.isPaused) return;

    // Update systems
    const context = {
      player: this.player,
      perception: this.systems.perception
    };

    this.systems.movement.update(deltaTime, this.world, context);
    this.systems.battle.update(deltaTime);
    this.systems.idle.update(deltaTime);

    // Update camera
    this.camera.update(deltaTime);

    // Update world rendering based on camera position
    this.world.renderVisibleChunks(this.camera);

    // Apply camera transform to world container
    const offset = this.camera.getOffset();
    const cx = this.game.app.screen.width / 2;
    const cy = this.game.app.screen.height / 2;
    this.worldContainer.scale.set(this.camera.zoom);
    this.worldContainer.x = offset.x * this.camera.zoom + cx * (1 - this.camera.zoom);
    this.worldContainer.y = offset.y * this.camera.zoom + cy * (1 - this.camera.zoom);

    // Update UI
    this.updateUI();
  }

  updateUI() {
    // Update HUD
    if (this.uiManager) {
      this.uiManager.updateHUD({ player: this.player });
    }

    // Update stats display
    if (this.statsText) {
      const stats = this.systems.progression.getPlayerStats(this.player);
      if (stats) {
        this.statsText.text = [
          `Level: ${this.player.level}`,
          `HP: ${this.player.hitPoints}/${this.player.maxHitPoints}`,
          `XP: ${this.player.experience}`,
          `Next: ${stats.experienceToNext || 0}`,
          `STR: ${this.player.stats.strength} DEF: ${this.player.stats.defense}`
        ].join('\n');
      }
    }

    // Update debug info
    if (this.showDebug && this.debugText) {
      const tile = this.world.getTile(this.player.tileX, this.player.tileY);

      this.debugText.text = [
        `FPS: ${Math.round(this.game.app.ticker.FPS)}`,
        `Player Tile: ${this.player.tileX}, ${this.player.tileY} (${tile})`,
        `Player World: ${Math.floor(this.player.x)}, ${Math.floor(this.player.y)}`,
        `Camera: ${Math.floor(this.camera.x)}, ${Math.floor(this.camera.y)}`,
        `Zoom: ${this.camera.zoom.toFixed(2)}x`,
        `Following: ${this.isFollowingPlayer ? 'Yes' : 'No'}`,
        `Moving: ${this.player.moving}`,
        `Automation: ${this.player.ai.enabled ? 'On' : 'Off'}`,
        `Entities: ${this.entities.size}`,
        `Active Quests: ${this.systems.quest.getActiveQuests().length}`
      ].join('\n');
    }
  }

  render() {
    // PIXI handles rendering automatically
  }

  returnToMenu() {
    this.manager.changeState('menu');
  }

  showInventory() {
    if (this.uiManager) {
      this.uiManager.showInventory(this.player);
    }
  }

  hideInventory() {
    if (this.uiManager) {
      this.uiManager.hideInventory();
    }
  }

  showBattleMenu(options) {
    if (this.uiManager) {
      this.uiManager.showBattle(options);
    }
  }

  hideBattleMenu() {
    if (this.uiManager) {
      this.uiManager.hideBattle();
    }
  }

  async exit() {
    // Clean up event listeners FIRST
    this.cleanupEventListeners();

    // Clean up input handlers
    this.cleanupInput();
    window.removeEventListener('wheel', this.handleWheel);

    // Clean up entities
    for (const entity of this.entities.values()) {
      entity.destroy();
    }
    this.entities.clear();

    // Clear systems
    this.systems.battle.clear();

    // Remove from stage
    this.game.app.stage.removeChild(this.container);

    // Clear containers first
    this.worldContainer.removeChildren();
    this.uiContainer.removeChildren();

    // Destroy containers
    this.container.destroy({ children: true });

    // Clear references
    this.world = null;
    this.camera = null;
    this.player = null;
    this.enemy = null;
    this.container = null;
    this.worldContainer = null;
    this.uiContainer = null;
    this.uiManager = null;
    this.debugText = null;
    this.systems = null;
  }
}