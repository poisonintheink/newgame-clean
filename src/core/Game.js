import { EventEmitter } from './EventEmitter.js';
import { StateManager } from './StateManager.js';
import { IntroState } from '../states/IntroState.js';
import { MenuState } from '../states/MenuState.js';
import { GameplayState } from '../states/GameplayState.js';
import { eventBus } from './EventBus.js';

export class Game extends EventEmitter {
    constructor(app) {
        super();
        this.app = app;
        this.stateManager = new StateManager();
        this.systems = {};
        this.lastUpdate = Date.now();

        // Make event bus globally accessible
        this.eventBus = eventBus;

        // Game time tracking
        this.gameTime = 0; // Total time in seconds
        this.pausedTime = 0;
        this.isPaused = false;

        // Initialize states
        this.initializeStates();
    }

    initializeStates() {
        // Register all game states
        this.stateManager.register('intro', new IntroState(this));
        this.stateManager.register('menu', new MenuState(this));
        this.stateManager.register('gameplay', new GameplayState(this));

        // Future states to add:
        // this.stateManager.register('characterCreation', new CharacterCreationState(this));
        // this.stateManager.register('loading', new LoadingState(this));
        // this.stateManager.register('battle', new BattleState(this));
        // this.stateManager.register('gameOver', new GameOverState(this));
    }

    async start() {
        // Start with intro screen
        await this.stateManager.changeState('intro');

        // Start game loop
        this.app.ticker.add(() => this.update());

        this.emit('gameStart');
        this.eventBus.emit('gameStart');
    }

    update() {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000; // Convert to seconds
        this.lastUpdate = now;

        if (!this.isPaused) {
            this.gameTime += deltaTime;

            // Update current state
            this.stateManager.update(deltaTime);

            // Render current state
            this.stateManager.render();
        }
    }

    pause() {
        if (!this.isPaused) {
            this.isPaused = true;
            this.pausedTime = Date.now();
            this.eventBus.emit('gamePaused');
        }
    }

    resume() {
        if (this.isPaused) {
            this.isPaused = false;
            const pauseDuration = Date.now() - this.pausedTime;
            // Adjust last update to prevent huge delta
            this.lastUpdate = Date.now();
            this.eventBus.emit('gameResumed', { pauseDuration });
        }
    }

    // Utility method to get current state name
    getCurrentState() {
        return this.stateManager.getCurrentStateName();
    }

    // Method to change state from outside (useful for debugging)
    changeState(stateName, params) {
        return this.stateManager.changeState(stateName, params);
    }

    // Get total playtime
    getPlaytime() {
        return this.gameTime;
    }
}

export default Game;