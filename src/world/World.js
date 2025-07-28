import * as PIXI from 'pixi.js';

export class World {
  constructor(width, height, tileSize = 32, renderer = null) {
    // World dimensions in tiles
    this.widthInTiles = width;
    this.heightInTiles = height;
    this.tileSize = tileSize;

    // World dimensions in pixels
    this.width = width * tileSize;
    this.height = height * tileSize;

    // Renderer reference for render textures
    this.renderer = renderer;

    // Tile data
    this.tiles = [];

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
    this.chunkSize = 16; // tiles per chunk
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
  }

  /**
   * Generate the world with placeholder content
   */
  generate() {
    // Initialize tile array
    for (let y = 0; y < this.heightInTiles; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.widthInTiles; x++) {
        this.tiles[y][x] = this.generateTile(x, y);
      }
    }

    // Add some features
    this.addLake(10, 10, 8, 6);
    this.addLake(35, 25, 10, 8);
    this.addForest(20, 30, 15, 10);
    this.addPath(0, 25, this.widthInTiles, 'horizontal');
    this.addPath(25, 0, this.heightInTiles, 'vertical');
    this.addVillageArea(40, 40, 10, 10);
  }

  /**
   * Generate a single tile based on position
   */
  generateTile(x, y) {
    const noise = this.simpleNoise(x * 0.1, y * 0.1);

    if (noise < 0.3) return 'grass';
    if (noise < 0.4) return 'dirt';
    if (noise < 0.5) return 'grass';
    if (noise < 0.6) return 'flower';
    if (noise < 0.7) return 'grass';
    if (noise < 0.8) return 'stone';
    return 'grass';
  }

  /**
   * Simple noise function for terrain generation
   */
  simpleNoise(x, y) {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
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
          this.tiles[y][x] = 'water';
        } else if (dist < 1 && this.isValidTile(x, y)) {
          this.tiles[y][x] = 'sand';
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
          this.tiles[y][x] = 'tree';
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
          this.tiles[position][x] = 'dirt';
          // Make path wider
          if (this.isValidTile(x, position - 1)) this.tiles[position - 1][x] = 'dirt';
          if (this.isValidTile(x, position + 1)) this.tiles[position + 1][x] = 'dirt';
        }
      }
    } else {
      for (let y = start; y < Math.min(start + length, this.heightInTiles); y++) {
        if (this.isValidTile(position, y)) {
          this.tiles[y][position] = 'dirt';
          // Make path wider
          if (this.isValidTile(position - 1, y)) this.tiles[y][position - 1] = 'dirt';
          if (this.isValidTile(position + 1, y)) this.tiles[y][position + 1] = 'dirt';
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
          this.tiles[y][x] = 'stone';
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
            this.tiles[y + dy][x + dx] = 'wall';
          } else {
            this.tiles[y + dy][x + dx] = 'stone';
          }
        }
      }
    }
  }

  /**
   * Check if tile coordinates are valid
   */
  isValidTile(x, y) {
    return x >= 0 && x < this.widthInTiles && y >= 0 && y < this.heightInTiles;
  }

  /**
   * Get tile at specific coordinates
   */
  getTile(x, y) {
    if (!this.isValidTile(x, y)) return null;
    return this.tiles[y][x];
  }

  /**
   * Set tile at specific coordinates
   */
  setTile(x, y, type) {
    if (!this.isValidTile(x, y)) return false;
    this.tiles[y][x] = type;
    const cx = Math.floor(x / this.chunkSize);
    const cy = Math.floor(y / this.chunkSize);
    this.dirtyChunks.add(`${cx},${cy}`);
    return true;
  }

  /**
   * Check if a tile is walkable
   */
  isWalkable(x, y) {
    const tile = this.getTile(x, y);
    if (!tile) return false;
    return this.tileTypes[tile].walkable;
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

        const tile = this.tiles[y][x];
        const color = this.tileTypes[tile].color;
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
    // Hide all chunk sprites
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

    for (let cy = visStartY; cy <= visEndY; cy++) {
      for (let cx = visStartX; cx <= visEndX; cx++) {
        const key = `${cx},${cy}`;
        const sprite = this.chunkSprites.get(key);
        if (!sprite) continue;

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

        sprite.visible = true;

      }
    }
  }

  /**
   * Get world pixel coordinates from tile coordinates
   */
  tileToWorld(tileX, tileY) {
    return {
      x: tileX * this.tileSize + this.tileSize / 2,
      y: tileY * this.tileSize + this.tileSize / 2
    };
  }

  /**
   * Get tile coordinates from world pixel coordinates
   */
  worldToTile(worldX, worldY) {
    return {
      x: Math.floor(worldX / this.tileSize),
      y: Math.floor(worldY / this.tileSize)
    };
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
}