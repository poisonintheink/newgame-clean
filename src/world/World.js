import * as PIXI from 'pixi.js';
import { Map as TileMap } from './Map.js';
import { Noise } from './Noise.js';
import { TILE_SIZE, CHUNK_SIZE, CHUNK_LOADING_RADIUS } from '../utils/constants.js';

export class World {
  constructor(width, height, tileSize = TILE_SIZE, renderer = null, seed = 1, options = {}) {
    // World dimensions in tiles
    this.widthInTiles = width;
    this.heightInTiles = height;
    this.tileSize = tileSize;

    this.seed = seed;

    // Noise generators
    this.elevationNoise = new Noise(seed);
    this.moistureNoise = new Noise(seed + 1);

    this.heightMap = [];
    this.moistureMap = [];

    // World dimensions in pixels
    this.width = width * tileSize;
    this.height = height * tileSize;

    // Renderer reference for render textures
    this.renderer = renderer;

    // Map data
    this.map = new TileMap(width, height, 'grass');

    // PIXI container for all world objects
    this.container = new PIXI.Container();
    this.tileContainer = new PIXI.Container();
    this.entityContainer = new PIXI.Container();

    // Layer structure
    this.container.addChild(this.tileContainer);
    this.container.addChild(this.entityContainer);

    // Tile types with visual properties
    this.tileTypes = {
      grass: { color: 0x4a7c59, walkable: true, symbol: '.' },
      dirt: { color: 0x8b6914, walkable: true, symbol: '#' },
      stone: { color: 0x696969, walkable: true, symbol: 'o' },
      water: { color: 0x1e90ff, walkable: false, symbol: '~' },
      tree: { color: 0x228b22, walkable: false, symbol: 'T' },
      wall: { color: 0x8b4513, walkable: false, symbol: 'W' },
      flower: { color: 0xff69b4, walkable: true, symbol: '*' },
      sand: { color: 0xf4a460, walkable: true, symbol: 's' }
    };

    // Chunk system for optimization
    const { chunkSize = CHUNK_SIZE, loadingRadius = CHUNK_LOADING_RADIUS } = options;
    this.chunkSize = chunkSize; // tiles per chunk
    this.loadingRadius = loadingRadius;
    this.widthInChunks = Math.ceil(this.widthInTiles / this.chunkSize);
    this.heightInChunks = Math.ceil(this.heightInTiles / this.chunkSize);
    this.visibleChunks = new Set();
    this.chunkTextures = new Map();
    this.chunkSprites = new Map();
    this.dirtyChunks = new Set();

    // Generate initial world
    this.generate();

    // Initialize chunk sprites
    this.initializeChunkSprites();

    // Add entity management
    this.entities = new Set();
  }

  /**
 * Add an entity to the world
 */
  addEntity(entity) {
    this.entities.add(entity);
    if (entity.sprite) {
      this.entityContainer.addChild(entity.sprite);
    }
  }

  /**
   * Remove an entity from the world
   */
  removeEntity(entity) {
    this.entities.delete(entity);
    if (entity.sprite && entity.sprite.parent === this.entityContainer) {
      this.entityContainer.removeChild(entity.sprite);
    }
  }

  /**
   * Get all entities at a specific tile position
   */
  getEntitiesAt(tileX, tileY) {
    return Array.from(this.entities).filter(e =>
      e.tileX === tileX && e.tileY === tileY
    );
  }

  /**
   * Check if a tile is occupied by an entity
   */
  isOccupied(tileX, tileY, excludeEntity = null) {
    if (!this.isWalkable(tileX, tileY)) return true;

    for (const entity of this.entities) {
      if (entity !== excludeEntity &&
        entity.tileX === tileX &&
        entity.tileY === tileY) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get all entities within a radius of a position
   */
  getEntitiesInRadius(tileX, tileY, radius) {
    return Array.from(this.entities).filter(e => {
      const dx = e.tileX - tileX;
      const dy = e.tileY - tileY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist <= radius;
    });
  }

  /**
   * Clear all entities from the world
   */
  clearEntities() {
    for (const entity of this.entities) {
      this.removeEntity(entity);
    }
  }

  get tiles() {
    return this.map.tiles;
  }

  /**
   * Generate the world with placeholder content
   */
  generate() {

    for (let y = 0; y < this.heightInTiles; y++) {
      this.heightMap[y] = [];
      this.moistureMap[y] = [];
      for (let x = 0; x < this.widthInTiles; x++) {
        const nx = x / this.widthInTiles - 0.5;
        const ny = y / this.heightInTiles - 0.5;
        this.heightMap[y][x] = this.elevationNoise.get(nx * 2, ny * 2);
        this.moistureMap[y][x] = this.moistureNoise.get(nx * 2, ny * 2);
      }
    }

    for (let y = 0; y < this.heightInTiles; y++) {
      for (let x = 0; x < this.widthInTiles; x++) {
        this.map.setTile(x, y, this.generateTile(x, y));
      }
    }
    // Add rivers for extra realism
    this.addRivers(3);
  }

  /**
   * Generate a single tile based on position
   */
  generateTile(x, y) {
    const elevation = (this.heightMap[y][x] + 1) / 2;
    const moisture = (this.moistureMap[y][x] + 1) / 2;

    if (elevation < 0.3) return 'water';
    if (elevation < 0.35) return 'sand';
    if (elevation > 0.8) return 'stone';
    if (moisture < 0.3) return 'dirt';
    if (moisture > 0.7) return 'tree';
    if (moisture > 0.5) return 'flower';
    return 'grass';
  }

  /**
   * Add a lake to the world
   */
  addLake(centerX, centerY, width, height) {
    for (let y = centerY - height / 2; y < centerY + height / 2; y++) {
      for (let x = centerX - width / 2; x < centerX + width / 2; x++) {
        const dx = (x - centerX) / (width / 2);
        const dy = (y - centerY) / (height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.8 && this.isValidTile(x, y)) {
          this.map.setTile(x, y, 'water');
        } else if (dist < 1 && this.isValidTile(x, y)) {
          this.map.setTile(x, y, 'sand');
        }
      }
    }
  }

  /**
   * Add a forest area
   */
  addForest(startX, startY, width, height) {
    for (let y = startY; y < startY + height; y++) {
      for (let x = startX; x < startX + width; x++) {
        if (this.isValidTile(x, y) && Math.random() < 0.3) {
          this.map.setTile(x, y, 'tree');
        }
      }
    }
  }

  /**
   * Add a path through the world
   */
  addPath(start, position, length, direction) {
    if (direction === 'horizontal') {
      for (let x = start; x < Math.min(start + length, this.widthInTiles); x++) {
        if (this.isValidTile(x, position)) {
          this.map.setTile(x, position, 'dirt');
          // Make path wider
          if (this.isValidTile(x, position - 1)) this.map.setTile(x, position - 1, 'dirt');
          if (this.isValidTile(x, position + 1)) this.map.setTile(x, position + 1, 'dirt');
        }
      }
    } else {
      for (let y = start; y < Math.min(start + length, this.heightInTiles); y++) {
        if (this.isValidTile(position, y)) {
          this.map.setTile(position, y, 'dirt');
          // Make path wider
          if (this.isValidTile(position - 1, y)) this.map.setTile(position - 1, y, 'dirt');
          if (this.isValidTile(position + 1, y)) this.map.setTile(position + 1, y, 'dirt');
        }
      }
    }
  }

  /**
   * Add a village area with buildings
   */
  addVillageArea(startX, startY, width, height) {
    // Clear area first
    for (let y = startY; y < startY + height; y++) {
      for (let x = startX; x < startX + width; x++) {
        if (this.isValidTile(x, y)) {
          this.map.setTile(x, y, 'stone');
        }
      }
    }

    // Add some buildings (simple rectangles)
    this.addBuilding(startX + 2, startY + 2, 4, 3);
    this.addBuilding(startX + 7, startY + 3, 3, 4);
    this.addBuilding(startX + 2, startY + 6, 5, 3);
  }

  /**
   * Add a building (wall tiles)
   */
  addBuilding(x, y, width, height) {
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        if (this.isValidTile(x + dx, y + dy)) {
          // Walls on edges, floor inside
          if (dx === 0 || dx === width - 1 || dy === 0 || dy === height - 1) {
            this.map.setTile(x + dx, y + dy, 'wall');
          } else {
            this.map.setTile(x + dx, y + dy, 'stone');
          }
        }
      }
    }
  }

  /**
   * Generate multiple rivers across the map
   */
  addRivers(count = 1) {
    for (let i = 0; i < count; i++) {
      const source = this.findRiverSource();
      if (source) {
        this.addRiver(source.x, source.y, 40);
      }
    }
  }

  findRiverSource() {
    for (let i = 0; i < 100; i++) {
      const x = Math.floor(Math.random() * this.widthInTiles);
      const y = Math.floor(Math.random() * this.heightInTiles);
      const elevation = (this.heightMap[y][x] + 1) / 2;
      if (elevation > 0.6) return { x, y };
    }
    return null;
  }

  addRiver(startX, startY, length = 20) {
    let x = startX;
    let y = startY;
    for (let i = 0; i < length; i++) {
      if (!this.isValidTile(x, y)) break;
      this.setTile(x, y, 'water');
      const neighbors = [
        { x: x + 1, y },
        { x: x - 1, y },
        { x, y: y + 1 },
        { x, y: y - 1 },
      ].filter(n => this.isValidTile(n.x, n.y));
      if (neighbors.length === 0) break;
      let next = neighbors[0];
      for (const n of neighbors) {
        if (this.heightMap[n.y][n.x] < this.heightMap[next.y][next.x]) {
          next = n;
        }
      }
      if (this.heightMap[next.y][next.x] > this.heightMap[y][x]) break;
      x = next.x;
      y = next.y;
    }
  }

  /**
   * Check if tile coordinates are valid
   */
  isValidTile(x, y) {
    return x >= 0 && x < this.widthInTiles && y >= 0 && y < this.heightInTiles;
  }

  /**
 * Wrap coordinates around world edges
 */
  wrapCoords(x, y) {
    return {
      x: (x + this.widthInTiles) % this.widthInTiles,
      y: (y + this.heightInTiles) % this.heightInTiles,
    };
  }

  /**
   * Get tile at specific coordinates
   */
  getTile(x, y) {
    const { x: tx, y: ty } = this.wrapCoords(x, y);
    const tile = this.map.getTile(tx, ty);
    return tile ? tile.type : null;
  }

  /**
   * Set tile at specific coordinates
   */
  setTile(x, y, type) {
    const { x: tx, y: ty } = this.wrapCoords(x, y);
    this.map.setTile(tx, ty, type);
    const cx = Math.floor(tx / this.chunkSize);
    const cy = Math.floor(ty / this.chunkSize);
    this.dirtyChunks.add(`${cx},${cy}`);
    return true;
  }

  /**
   * Check if a tile is walkable
   */
  isWalkable(x, y) {
    const { x: tx, y: ty } = this.wrapCoords(x, y);
    const tileObj = this.map.getTile(tx, ty);
    if (!tileObj) return false;
    return this.tileTypes[tileObj.type].walkable;
  }

  /**
   * Initialize tile sprites pool
   * Initialize sprites for each chunk
   */
  initializeChunkSprites() {
    for (let cy = 0; cy < this.heightInChunks; cy++) {
      for (let cx = 0; cx < this.widthInChunks; cx++) {
        const key = `${cx},${cy}`;
        const sprite = new PIXI.Sprite();
        sprite.visible = false;
        this.tileContainer.addChild(sprite);
        this.chunkSprites.set(key, sprite);
        this.dirtyChunks.add(key);
      }
    }
  }

  /**
   * Create render texture for a chunk of tiles
   */
  createChunkTexture(chunkX, chunkY) {
    if (!this.renderer) return null;

    const graphics = new PIXI.Graphics();
    const startX = chunkX * this.chunkSize;
    const startY = chunkY * this.chunkSize;
    const endX = Math.min(startX + this.chunkSize, this.widthInTiles);
    const endY = Math.min(startY + this.chunkSize, this.heightInTiles);
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {

        const tile = this.map.getTile(x, y);
        const color = this.tileTypes[tile.type].color;
        const px = (x - startX) * this.tileSize;
        const py = (y - startY) * this.tileSize;
        graphics.rect(px, py, this.tileSize, this.tileSize);
        graphics.fill(color);
        graphics.rect(px, py, this.tileSize, this.tileSize);
        graphics.stroke({ width: 1, color: 0x000000, alpha: 0.1 });
      }
    }
    const tex = PIXI.RenderTexture.create({
      width: this.chunkSize * this.tileSize,
      height: this.chunkSize * this.tileSize,
    });
    this.renderer.render(graphics, { renderTexture: tex, clear: true });
    graphics.destroy();
    return tex;
  }

  /**
   * Render visible chunks based on camera bounds
   */
  renderVisibleChunks(camera) {
    // Hide all chunk sprites initally
    for (const sprite of this.chunkSprites.values()) {
      sprite.visible = false;
    }

    const bounds = camera.getVisibleBounds();
    const chunkPixelSize = this.chunkSize * this.tileSize;

    const startChunkX = Math.floor(bounds.left / chunkPixelSize) - 1;
    const startChunkY = Math.floor(bounds.top / chunkPixelSize) - 1;
    const endChunkX = Math.floor(bounds.right / chunkPixelSize) + 1;
    const endChunkY = Math.floor(bounds.bottom / chunkPixelSize) + 1;

    const visStartX = Math.max(0, startChunkX);
    const visStartY = Math.max(0, startChunkY);
    const visEndX = Math.min(this.widthInChunks - 1, endChunkX);
    const visEndY = Math.min(this.heightInChunks - 1, endChunkY);

    const loadStartX = Math.max(0, startChunkX - this.loadingRadius);
    const loadStartY = Math.max(0, startChunkY - this.loadingRadius);
    const loadEndX = Math.min(this.widthInChunks - 1, endChunkX + this.loadingRadius);
    const loadEndY = Math.min(this.heightInChunks - 1, endChunkY + this.loadingRadius);

    // Unload textures far outside the loading radius
    for (const [key, tex] of this.chunkTextures) {
      const [cx, cy] = key.split(',').map(Number);
      if (cx < loadStartX || cx > loadEndX || cy < loadStartY || cy > loadEndY) {
        tex.destroy(true);
        this.chunkTextures.delete(key);
        const sprite = this.chunkSprites.get(key);
        if (sprite) {
          sprite.texture = PIXI.Texture.EMPTY;
          sprite.visible = false;
        }
      }
    }

    for (let cy = loadStartY; cy <= loadEndY; cy++) {
      for (let cx = loadStartX; cx <= loadEndX; cx++) {
        const key = `${cx},${cy}`;
        let sprite = this.chunkSprites.get(key);
        if (!sprite) {
          sprite = new PIXI.Sprite();
          this.tileContainer.addChild(sprite);
          this.chunkSprites.set(key, sprite);
        }
        if (this.dirtyChunks.has(key) || !this.chunkTextures.get(key)) {
          const tex = this.createChunkTexture(cx, cy);
          if (tex) {
            this.chunkTextures.set(key, tex);
            sprite.texture = tex;
          }
          this.dirtyChunks.delete(key);
        }

        sprite.x = cx * chunkPixelSize;
        sprite.y = cy * chunkPixelSize;

        if (cx >= visStartX && cx <= visEndX && cy >= visStartY && cy <= visEndY) {
          sprite.visible = true;
        }

      }
    }
  }

  /**
   * Get world pixel coordinates from tile coordinates
   */
  tileToWorld(tileX, tileY) {
    const { x, y } = this.wrapCoords(tileX, tileY);
    return {
      x: x * this.tileSize + this.tileSize / 2,
      y: y * this.tileSize + this.tileSize / 2,
    };
  }

  /**
   * Get tile coordinates from world pixel coordinates
   */
  worldToTile(worldX, worldY) {
    const x = Math.floor(worldX / this.tileSize);
    const y = Math.floor(worldY / this.tileSize);
    return this.wrapCoords(x, y);
  }

  /**
   * Find a random walkable position in the world
   */
  getRandomWalkablePosition() {
    let attempts = 0;
    while (attempts < 100) {
      const x = Math.floor(Math.random() * this.widthInTiles);
      const y = Math.floor(Math.random() * this.heightInTiles);

      if (this.isWalkable(x, y)) {
        return { tileX: x, tileY: y, worldPos: this.tileToWorld(x, y) };
      }
      attempts++;
    }

    // Fallback to center
    const centerTileX = Math.floor(this.widthInTiles / 2);
    const centerTileY = Math.floor(this.heightInTiles / 2);
    return {
      tileX: centerTileX,
      tileY: centerTileY,
      worldPos: this.tileToWorld(centerTileX, centerTileY)
    };
  }

  serialize() {
    return this.map.serialize();
  }

  load(data) {
    this.map.load(data);
    this.widthInTiles = this.map.width;
    this.heightInTiles = this.map.height;
    this.width = this.widthInTiles * this.tileSize;
    this.height = this.heightInTiles * this.tileSize;
    this.widthInChunks = Math.ceil(this.widthInTiles / this.chunkSize);
    this.heightInChunks = Math.ceil(this.heightInTiles / this.chunkSize);
    this.chunkTextures.clear();
    for (const sprite of this.chunkSprites.values()) {
      sprite.destroy();
    }
    this.chunkSprites.clear();
    this.dirtyChunks.clear();
    this.initializeChunkSprites();
  }
}