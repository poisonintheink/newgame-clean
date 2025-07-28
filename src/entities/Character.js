export class Character {
  constructor(tileX = 0, tileY = 0, tileSize = 32) {
    this.tileX = tileX;
    this.tileY = tileY;
    this.tileSize = tileSize;

    // World position (center of tile)
    this.x = tileX * tileSize + tileSize / 2;
    this.y = tileY * tileSize + tileSize / 2;

    // Basic RPG properties
    this.hitPoints = 100;
    this.stats = {
      strength: 10,
      agility: 10,
      intelligence: 10
    };

    // Inventory placeholder (array of item references)
    this.inventory = [];
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
}