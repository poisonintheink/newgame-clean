import './style.css';
import { Application } from 'pixi.js';
import { Game } from './core/Game.js';

// Enable Vite HMR
if (import.meta.hot) {
  import.meta.hot.accept();
}

// Find your mount node first
const container = document.getElementById('game-container');

// Create + initialize the PixiJS Application (v8 API)
const app = new Application();
await app.init({
  preference: 'webgl',
  width: 1024,
  height: 768,
  background: '#0a0a0a',
  antialias: true,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true
});

// Add canvas to DOM
container.appendChild(app.canvas);

// Handle window resize with fixed aspect ratio
function handleResize() {
  const parent = container;
  const targetWidth = 1024;
  const targetHeight = 768;
  const targetRatio = targetWidth / targetHeight;

  // Get available space
  const availableWidth = parent.clientWidth;
  const availableHeight = parent.clientHeight;
  const availableRatio = availableWidth / availableHeight;

  let scale;
  if (availableRatio > targetRatio) {
    // Height is the limiting factor
    scale = availableHeight / targetHeight;
  } else {
    // Width is the limiting factor
    scale = availableWidth / targetWidth;
  }

  // Apply scale to canvas
  const finalWidth = Math.floor(targetWidth * scale);
  const finalHeight = Math.floor(targetHeight * scale);

  app.canvas.style.width = `${finalWidth}px`;
  app.canvas.style.height = `${finalHeight}px`;

  // Center the canvas
  app.canvas.style.position = 'absolute';
  app.canvas.style.left = '50%';
  app.canvas.style.top = '50%';
  app.canvas.style.transform = 'translate(-50%, -50%)';
}

window.addEventListener('resize', handleResize);
handleResize(); // Initial sizing

// Prevent right-click context menu on canvas
app.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Make PIXI available globally for debugging in dev
if (import.meta.env.DEV) {
  window.app = app;
  window.PIXI = await import('pixi.js');
}

// Create and start the game
const game = new Game(app);

// Make game accessible for debugging
if (import.meta.env.DEV) {
  window.game = game;

  // Add debug shortcuts
  window.addEventListener('keydown', (e) => {
    // Ctrl+Shift+D for debug menu (future feature)
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      console.log('Current State:', game.getCurrentState());
      console.log('Game Systems:', game.systems);
    }
  });
}

try {
  await game.start();
} catch (error) {
  console.error('Failed to start game:', error);

  // Show error message to user
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = 'Failed to start game. Please refresh the page.';
  errorDiv.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #ff0000;
    color: white;
    padding: 20px;
    border-radius: 10px;
    font-size: 18px;
    z-index: 1000;
  `;
  container.appendChild(errorDiv);
}