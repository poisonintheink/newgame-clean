import * as PIXI from 'pixi.js';
import { State } from '../core/StateManager.js';

export class IntroState extends State {
  constructor(game) {
    super(game);
    this.container = null;
    this.fadeOverlay = null;
    this.titleText = null;
    this.subtitleText = null;
    this.timer = 0;
    this.fadeIn = true;
    this.displayDuration = 3; // seconds
  }

  async enter() {
    // Reset all state variables
    this.timer = 0;
    this.fadeIn = true;

    // Create fresh container
    this.container = new PIXI.Container();

    const app = this.game.app;

    // Create fade overlay
    this.fadeOverlay = new PIXI.Graphics();
    this.fadeOverlay.rect(0, 0, app.screen.width, app.screen.height);
    this.fadeOverlay.fill(0x000000);

    // Create title text
    this.titleText = new PIXI.Text({
      text: 'New Game',
      style: {
        fontFamily: 'Arial',
        fontSize: 64,
        fill: 0xffffff,
        align: 'center',
        dropShadow: true,
        dropShadowDistance: 6,
        dropShadowColor: 0x000000,
        dropShadowBlur: 4
      }
    });
    this.titleText.anchor.set(0.5);
    this.titleText.x = app.screen.width / 2;
    this.titleText.y = app.screen.height / 2 - 50;

    // Create subtitle
    this.subtitleText = new PIXI.Text({
      text: 'Press any key to continue',
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xcccccc,
        align: 'center'
      }
    });
    this.subtitleText.anchor.set(0.5);
    this.subtitleText.x = app.screen.width / 2;
    this.subtitleText.y = app.screen.height / 2 + 50;
    this.subtitleText.alpha = 0;

    // Add to container
    this.container.addChild(this.titleText);
    this.container.addChild(this.subtitleText);
    this.container.addChild(this.fadeOverlay);

    // Add to stage
    app.stage.addChild(this.container);

    // Set up input handling
    this.handleKeyPress = () => this.skipIntro();
    window.addEventListener('keydown', this.handleKeyPress);

    // Also allow click/tap to skip
    this.container.interactive = true;
    this.container.on('pointerdown', () => this.skipIntro());
  }

  async exit() {
    // Clean up event listeners
    window.removeEventListener('keydown', this.handleKeyPress);
    this.container.off('pointerdown');

    // Remove from stage
    this.game.app.stage.removeChild(this.container);

    // Destroy PIXI objects
    this.container.destroy({ children: true });

    // Clear references
    this.container = null;
    this.fadeOverlay = null;
    this.titleText = null;
    this.subtitleText = null;
  }

  update(deltaTime) {
    this.timer += deltaTime;

    if (this.fadeIn) {
      // Fade in animation
      const fadeProgress = Math.min(this.timer / 1, 1);
      this.fadeOverlay.alpha = 1 - fadeProgress;

      if (fadeProgress >= 1) {
        this.fadeIn = false;
        this.timer = 0;
      }
    } else {
      // Show subtitle after title is visible
      if (this.timer > 0.5 && this.subtitleText.alpha < 1) {
        this.subtitleText.alpha = Math.min(this.subtitleText.alpha + deltaTime * 2, 1);
      }

      // Pulse subtitle
      this.subtitleText.alpha = 0.7 + Math.sin(this.timer * 3) * 0.3;

      // Auto-advance to menu after duration
      if (this.timer > this.displayDuration) {
        this.skipIntro();
      }
    }
  }

  render() {
    // PIXI handles rendering automatically
  }

  skipIntro() {
    if (!this.manager.transitioning) {
      this.manager.changeState('menu');
    }
  }
}