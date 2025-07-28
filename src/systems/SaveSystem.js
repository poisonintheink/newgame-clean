import { EntityFactory } from '../entities/EntityFactory.js';

/**
 * Basic save/load system for the game
 */
export class SaveSystem {
  constructor() {
    this.saveKey = 'idleRPGSave';
    this.version = '1.0';
  }

  /**
   * Save the current game state
   */
  save(gameState) {
    try {
      const saveData = {
        version: this.version,
        timestamp: Date.now(),
        playtime: gameState.game.getPlaytime(),
        player: this.serializePlayer(gameState.player),
        world: this.serializeWorld(gameState.world),
        entities: this.serializeEntities(gameState.entityRegistry),
        game: {
          currentState: gameState.game.getCurrentState()
        }
      };

      localStorage.setItem(this.saveKey, JSON.stringify(saveData));
      console.log('Game saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  /**
   * Load a saved game
   */
  load() {
    try {
      const saveString = localStorage.getItem(this.saveKey);
      if (!saveString) return null;

      const saveData = JSON.parse(saveString);

      // Version check
      if (saveData.version !== this.version) {
        console.warn(`Save version mismatch: ${saveData.version} vs ${this.version}`);
        // Could implement migration logic here
      }

      return saveData;
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }

  /**
   * Check if a save exists
   */
  hasSave() {
    return localStorage.getItem(this.saveKey) !== null;
  }

  /**
   * Delete the save
   */
  deleteSave() {
    localStorage.removeItem(this.saveKey);
  }

  /**
   * Serialize player data
   */
  serializePlayer(player) {
    if (!player) return null;
    return EntityFactory.serializeEntity(player);
  }

  /**
   * Serialize world data
   */
  serializeWorld(world) {
    if (!world) return null;
    return {
      widthInTiles: world.widthInTiles,
      heightInTiles: world.heightInTiles,
      tileSize: world.tileSize,
      map: world.serialize()
    };
  }

  /**
   * Serialize all entities
   */
  serializeEntities(registry) {
    if (!registry) return [];

    const entities = [];
    for (const entity of registry.getAll()) {
      // Skip player (saved separately)
      if (entity.id === 'player') continue;
      entities.push(EntityFactory.serializeEntity(entity));
    }
    return entities;
  }

  /**
   * Calculate offline progress
   */
  calculateOfflineProgress(saveData) {
    const now = Date.now();
    const offlineTime = (now - saveData.timestamp) / 1000; // seconds
    const maxOfflineTime = 8 * 60 * 60; // 8 hours cap
    const effectiveTime = Math.min(offlineTime, maxOfflineTime);

    return {
      timeOffline: offlineTime,
      effectiveTime: effectiveTime,
      rewards: {
        experience: Math.floor(effectiveTime * 0.1), // 0.1 XP per second
        gold: Math.floor(effectiveTime * 0.5), // 0.5 gold per second
        items: [] // Could calculate random item drops
      }
    };
  }
}