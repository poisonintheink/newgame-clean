export class AssetLoader {
  constructor() {
    this.assets = {
      sprites: {},
      sounds: {},
      data: {}
    };
  }

  async loadAssets() {
    console.log('Loading assets...');

    // In Vite, we can use dynamic imports for JSON data
    const [enemies, items, maps] = await Promise.all([
      import('../data/enemies.js'),
      import('../data/items.js'),
      import('../data/maps.js')
    ]);

    this.assets.data = {
      enemies: enemies.default,
      items: items.default,
      maps: maps.default
    };

    // Load sprites using PIXI loader
    // Assets in public folder are accessible via /assets/
    const spriteAssets = [
      { name: 'player', url: '/assets/sprites/player.png' },
      { name: 'enemy', url: '/assets/sprites/enemy.png' },
      // Add more assets here
    ];

    // Return a promise that resolves when all assets are loaded
    return new Promise((resolve) => {
      if (spriteAssets.length === 0) {
        resolve();
        return;
      }

      // For PIXI v7+
      spriteAssets.forEach(asset => {
        PIXI.Assets.add(asset.name, asset.url);
      });

      PIXI.Assets.load(spriteAssets.map(a => a.name)).then(() => {
        console.log('All assets loaded!');
        resolve();
      });
    });
  }

  getSprite(name) {
    return PIXI.Sprite.from(name);
  }

  /**
   * Retrieve a data set previously loaded (e.g. 'items', 'enemies', 'maps').
   * @param {string} type
   */
  getData(type) {
    return this.assets.data[type];
  }
}