import assert from 'assert';
import fs from 'fs';
import path from 'path';

const stubDir = path.join(process.cwd(), 'node_modules', 'pixi.js');
if (!fs.existsSync(stubDir)) {
  fs.mkdirSync(stubDir, { recursive: true });
  fs.writeFileSync(
    path.join(stubDir, 'index.js'),
    `export class Container{addChild(){ } removeChild(){ }}
export class Sprite{constructor(){this.visible=false;}destroy(){}}
export class Graphics{rect(){}fill(){}stroke(){}circle(){}moveTo(){}lineTo(){}}
export const RenderTexture={create:()=>({})};`
  );
}

const { World } = await import('../world/World.js');
const { Character } = await import('../entities/Character.js');

const world = new World(4, 4);
world.map.fill('grass');

const char = new Character(0, 0);
world.addEntity(char);

// Move left from column 0 should wrap to last column
char.tryMove('left', world);
char.update(1, world);
assert.strictEqual(char.tileX, world.widthInTiles - 1, 'wrap left failed');

// Move up from row 0 should wrap to last row
char.setTilePosition(0, 0);
char.tryMove('up', world);
char.update(1, world);
assert.strictEqual(char.tileY, world.heightInTiles - 1, 'wrap up failed');

console.log('World wrapping test passed');