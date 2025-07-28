import { Tile } from './Tile.js';

/**
 * Simple 2D grid of {@link Tile} objects.
 */
export class Map {
  constructor(width = 0, height = 0, defaultType = 'empty') {
    this.width = width;
    this.height = height;
    this.tiles = [];

    if (width > 0 && height > 0) {
      this._createGrid(defaultType);
    }
  }

  _createGrid(defaultType) {
    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.tiles[y][x] = new Tile(defaultType);
      }
    }
  }

  /**
   * Check if coordinates fall within the map.
   */
  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  /**
   * Get the {@link Tile} at a position.
   */
  getTile(x, y) {
    if (!this.inBounds(x, y)) return null;
    return this.tiles[y][x];
  }

  /**
   * Change the type of a tile or replace it entirely.
   * @param {number} x
   * @param {number} y
   * @param {Tile|string} tile
   */
  setTile(x, y, tile) {
    if (!this.inBounds(x, y)) return false;
    if (tile instanceof Tile) {
      this.tiles[y][x] = tile;
    } else {
      this.tiles[y][x].setType(tile);
    }
    return true;
  }

  /**
   * Fill the entire map with a tile type.
   */
  fill(type) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.tiles[y][x].setType(type);
      }
    }
  }

  /**
   * Load map content from raw data.
   * Expects an object of the form:
   * { width, height, tiles: [[{type,properties}, ...]] }
   */
  load(data) {
    if (!data) return;
    this.width = data.width;
    this.height = data.height;
    this.tiles = [];
    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        const t = data.tiles?.[y]?.[x];
        this.tiles[y][x] = Tile.deserialize(t);
      }
    }
  }

  /**
   * Convert the map to a JSON-friendly object.
   */
  serialize() {
    return {
      width: this.width,
      height: this.height,
      tiles: this.tiles.map(row => row.map(t => t.serialize()))
    };
  }

  /**
   * Create a map from serialized data.
   */
  static deserialize(data) {
    const map = new Map();
    map.load(data);
    return map;
  }
}

export default Map;