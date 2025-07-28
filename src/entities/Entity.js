import { TILE_SIZE } from '../utils/constants.js';

export class Entity {
  constructor(tileX = 0, tileY = 0, tileSize = TILE_SIZE) {
    this.id = null; // Will be set by EntityRegistry
    this.type = this.constructor.name.toLowerCase(); // 'player', 'enemy', etc.
    this.tileX = tileX;
    this.tileY = tileY;
    this.tileSize = tileSize;

    // World position (center of tile)
    this.x = tileX * tileSize + tileSize / 2;
    this.y = tileY * tileSize + tileSize / 2;
  }

  /**
   * Set tile based position and update world coordinates
   */
  setTilePosition(tileX, tileY) {
    this.tileX = tileX;
    this.tileY = tileY;
    this.x = tileX * this.tileSize + this.tileSize / 2;
    this.y = tileY * this.tileSize + this.tileSize / 2;
    if (this.sprite) {
      this.sprite.x = this.x;
      this.sprite.y = this.y;
    }
  }

  /**
   * Get current world position
   */
  getWorldPosition() {
    return { x: this.x, y: this.y };
  }

  /**
   * Clean up method for proper removal
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }
}