/**
 * Basic representation of a map tile.
 */
export class Tile {
  constructor(type = 'empty', properties = {}) {
    this.type = type;
    this.properties = { ...properties };
  }

  /**
   * Change tile type.
   * @param {string} type
   */
  setType(type) {
    this.type = type;
  }

  /**
   * Get a custom property.
   * @param {string} key
   * @param {*} defaultValue
   */
  getProperty(key, defaultValue = undefined) {
    return this.properties[key] ?? defaultValue;
  }

  /**
   * Set a custom property on the tile.
   * @param {string} key
   * @param {*} value
   */
  setProperty(key, value) {
    this.properties[key] = value;
  }

  /**
   * Convert the tile to a serialisable object.
   */
  serialize() {
    return {
      type: this.type,
      properties: { ...this.properties }
    };
  }

  /**
   * Create a tile from raw data.
   * @param {Object} data
   */
  static deserialize(data) {
    if (!data) return new Tile();
    return new Tile(data.type, data.properties);
  }
}

export default Tile;