
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

const { Camera } = await import('../world/Camera.js');

// World dimensions
const worldWidth = 100;
const worldHeight = 100;
const cam = new Camera(10, 10, worldWidth, worldHeight);
cam.smoothing = 1; // instant for test

// Place camera near right edge and target just over the left edge
cam.setPosition(95, 50);
cam.follow({ x: 3, y: 50 });
cam.update(0.016);

assert.ok(cam.x >= 97 && cam.x <= 99, `camera wrap failed: ${cam.x}`);

console.log('Camera wrap test passed');