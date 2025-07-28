import * as PIXI from 'pixi.js';
import { State } from '../core/StateManager.js';
import { Camera } from '../world/Camera.js';
import { World } from '../world/World.js';
import { TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT } from '../utils/constants.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { UIManager } from '../ui/UIManager.js';
import { PerceptionSystem } from '../systems/PerceptionSystem.js';
import { VisionSense } from '../systems/senses/VisionSense.js';
import { SmellSense } from '../systems/senses/SmellSense.js';
import { MovementSystem } from '../systems/MovementSystem.js';
import { BattleSystem } from '../systems/BattleSystem.js';
import { IdleSystem } from '../systems/IdleSystem.js';
import { InventorySystem } from '../systems/InventorySystem.js';
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
    this.enemy = null;

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
      perception: null
    };

    // Entity tracking
    this.entities = new Map();
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

    // Initialize systems
    this.systems.movement = new MovementSystem();
    this.systems.battle = new BattleSystem();
    this.systems.idle = new IdleSystem(5); // 5 seconds to idle
    this.systems.inventory = new InventorySystem();

    // Set up perception system
    this.systems.perception = new PerceptionSystem();
    this.systems.perception.registerSense('vision', new VisionSense());
    this.systems.perception.registerSense('smell', new SmellSense());

    // Create player at random walkable position
    const startPos = this.world.getRandomWalkablePosition();
    this.player = new Player(startPos.tileX, startPos.tileY, this.world.tileSize);
    this.player.id = 'player'; // Special ID for player

    // Create enemy at random walkable position
    const enemyPos = this.world.getRandomWalkablePosition();
    this.enemy = new Enemy(enemyPos.tileX, enemyPos.tileY, this.world.tileSize);
    this.enemy.id = 'enemy-1';

    // Register entities
    this.entities.set(this.player.id, this.player);
    this.entities.set(this.enemy.id, this.enemy);

    // Add entities to world
    this.world.addEntity(this.player);
    this.world.addEntity(this.enemy);

    // Add entities to systems
    this.systems.movement.addEntity(this.player);
    this.systems.movement.addEntity(this.enemy);
    this.systems.idle.addEntity(this.player);
    this.systems.battle.engage(this.player, this.enemy);

    // Camera follows player
    this.camera.follow(this.player, true);

    // Create debug info
    this.createDebugInfo();

    // UI manager
    this.uiManager = new UIManager();
    this.uiContainer.addChild(this.uiManager.container);

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

    // Initial world render
    this.world.renderVisibleChunks(this.camera);

    console.log('Entered gameplay state');
    console.log(`World size: ${this.world.width}x${this.world.height} pixels`);
    console.log(`Player starting at tile: ${this.player.tileX}, ${this.player.tileY}`);
    console.log(`Enemy starting at tile: ${this.enemy.tileX}, ${this.enemy.tileY}`);
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
    this.systems = {
      movement: null,
      battle: null,
      idle: null,
      inventory: null,
      perception: null
    };
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
  }

  cleanupEventListeners() {
    eventBus.off('move', this.onEntityMove);
    eventBus.off('attack', this.onAttack);
    eventBus.off('defeated', this.onDefeated);
    eventBus.off('idle', this.onEntityIdle);
    eventBus.off('itemAdded', this.onItemAdded);
    eventBus.off('itemRemoved', this.onItemRemoved);
  }

  onEntityMove({ entity, from, to }) {
    // Check for collision with items, triggers, etc.
    console.log(`${entity.type} moved from ${from.x},${from.y} to ${to.x},${to.y}`);
  }

  onAttack({ attacker, defender, damage }) {
    console.log(`${attacker.type} attacks ${defender.type} for ${damage} damage!`);
    // Could show damage numbers, effects, etc.
  }

  onDefeated({ attacker, defender }) {
    console.log(`${defender.type} was defeated by ${attacker.type}!`);

    // Handle drops
    if (defender.drops) {
      defender.drops.forEach(dropId => {
        // Create item at defender's position
        console.log(`${defender.type} dropped ${dropId}`);
      });
    }

    // Remove defeated entity
    this.removeEntity(defender);
  }

  onEntityIdle({ entity, idleTime }) {
    console.log(`${entity.type} has been idle for ${idleTime.toFixed(1)} seconds`);
    // Could grant idle rewards, trigger animations, etc.
  }

  onItemAdded({ entity, item }) {
    console.log(`${entity.type} picked up ${item.name || item}`);
  }

  onItemRemoved({ entity, item }) {
    console.log(`${entity.type} lost ${item.name || item}`);
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
      this.isDragging = false;
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
        // Zoom in
        this.camera.adjustZoom(0.1);
        break;
      case '-':
      case '_':
        // Zoom out
        this.camera.adjustZoom(-0.1);
        break;
      case '0':
        // Reset zoom
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
    }
  }

  onKeyUp(event) {
    //event.preventDefault();
  }

  onWheel(event) {
    // Prevent default browser zoom
    event.preventDefault();

    // Zoom based on wheel direction
    // Note: deltaY is positive when scrolling down (zoom out), negative when scrolling up (zoom in)
    const zoomDelta = event.deltaY < 0 ? 0.1 : -0.1;
    this.camera.adjustZoom(zoomDelta);
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

    // Instructions
    const instructions = new PIXI.Text({
      text: 'WASD/Arrows: Move | F: Toggle Follow | T: Toggle Auto | I: Inventory | B: Battle | +/-: Zoom | 0: Reset Zoom | Space: Shake | Tab: Debug | ESC: Menu',
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: 0xcccccc,
        stroke: { color: 0x000000, width: 3 }
      }
    });
    instructions.x = 10;
    instructions.y = this.game.app.screen.height - 30;

    this.uiContainer.addChild(this.debugText);
    this.uiContainer.addChild(instructions);
  }

  update(deltaTime) {
    if (!this.world || !this.camera || !this.player) return;

    // Update systems
    this.systems.movement.update(deltaTime, this.world, {
      player: this.player,
      perception: this.systems.perception
    });

    this.systems.battle.update(deltaTime);
    this.systems.idle.update(deltaTime);

    // Update camera
    this.camera.update(deltaTime);

    // Update world rendering based on camera position
    this.world.renderVisibleChunks(this.camera);

    // Apply camera transform to world container
    const offset = this.camera.getOffset();

    // Simple zoom implementation that keeps (0,0) at top-left
    this.worldContainer.scale.set(this.camera.zoom);
    this.worldContainer.x = offset.x * this.camera.zoom;
    this.worldContainer.y = offset.y * this.camera.zoom;

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
        `Enemy Tile: ${this.enemy ? `${this.enemy.tileX}, ${this.enemy.tileY}` : 'N/A'}`,
        `Player HP: ${this.player.hitPoints}/${this.player.maxHitPoints}`,
        `Enemy HP: ${this.enemy ? `${this.enemy.hitPoints}/${this.enemy.maxHitPoints}` : 'N/A'}`
      ].join('\n');
    }

    // Update HUD elements
    if (this.uiManager) {
      this.uiManager.updateHUD({ player: this.player });
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
}