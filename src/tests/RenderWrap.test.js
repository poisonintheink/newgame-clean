import assert from 'assert';
import fs from 'fs';
import path from 'path';

const stubDir = path.join(process.cwd(), 'node_modules', 'pixi.js');
if (!fs.existsSync(stubDir)) {
  fs.mkdirSync(stubDir, { recursive: true });
  fs.writeFileSync(
    path.join(stubDir, 'index.js'),
    `export class Container{addChild(){ } removeChild(){ }}
export class Sprite{constructor(){this.visible=false;this.x=0;this.y=0;this.texture=null;}destroy(){}}
export class Graphics{rect(){}fill(){}stroke(){}circle(){}moveTo(){}lineTo(){}}
export const RenderTexture={create:()=>({ destroy(){} })};
export const Texture={EMPTY:{}};`
  );
}

const { World } = await import('../world/World.js');
const { Camera } = await import('../world/Camera.js');

const world = new World(32, 32);
world.map.fill('grass');

const cam = new Camera(64, 64, world.width, world.height);
cam.smoothing = 1;
cam.setPosition(world.width - 48, world.height / 2);
cam.update(0.016);

world.renderVisibleChunks(cam);

let hasWrapped = false;
for (const sprite of world.chunkSprites.values()) {
  if (sprite.visible && (sprite.x < 0 || sprite.x >= world.width)) {
    hasWrapped = true;
    break;
  }
}

assert.ok(hasWrapped, 'wrapped chunk not rendered');

console.log('Render wrap test passed');