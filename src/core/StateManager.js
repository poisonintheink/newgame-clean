import { EventEmitter } from './EventEmitter.js';

export class StateManager extends EventEmitter {
  constructor() {
    super();
    this.states = new Map();
    this.currentState = null;
    this.previousState = null;
    this.transitioning = false;
  }

  register(name, state) {
    // Each state should have enter(), exit(), update(), and render() methods
    this.states.set(name, state);
    state.manager = this;
  }

  async changeState(name, params = {}) {
    if (this.transitioning) {
      console.warn('Already transitioning between states');
      return;
    }

    const newState = this.states.get(name);
    if (!newState) {
      console.error(`State '${name}' not found`);
      return;
    }

    this.transitioning = true;

    // Exit current state
    if (this.currentState) {
      await this.currentState.exit();
      this.previousState = this.currentState;
    }

    // Enter new state
    this.currentState = newState;
    await this.currentState.enter(params);

    this.transitioning = false;
    this.emit('stateChanged', name);
  }

  update(deltaTime) {
    if (this.currentState && !this.transitioning) {
      this.currentState.update(deltaTime);
    }
  }

  render() {
    if (this.currentState && !this.transitioning) {
      this.currentState.render();
    }
  }

  getCurrentStateName() {
    for (const [name, state] of this.states) {
      if (state === this.currentState) {
        return name;
      }
    }
    return null;
  }
}

// Base State class that all states should extend
export class State {
  constructor(game) {
    this.game = game;
    this.manager = null; // Set by StateManager
  }

  async enter(params = {}) {
    // Override in subclasses
  }

  async exit() {
    // Override in subclasses
  }

  update(deltaTime) {
    // Override in subclasses
  }

  render() {
    // Override in subclasses
  }
}