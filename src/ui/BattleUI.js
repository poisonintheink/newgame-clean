import * as PIXI from 'pixi.js';

/**
 * Minimal battle menu with generic options.
 */
export class BattleUI {
  constructor(width = 180, height = 120) {
    this.container = new PIXI.Container();
    this.background = new PIXI.Graphics();
    this.background.rect(0, 0, width, height);
    this.background.fill({ color: 0x000000, alpha: 0.6 });
    this.container.addChild(this.background);

    this.options = ['Attack', 'Item', 'Run'];
    this.optionTexts = [];
    this.container.visible = false;
    this.createOptions();
  }

  createOptions() {
    this.optionTexts.forEach(t => t.destroy());
    this.optionTexts.length = 0;

    this.options.forEach((opt, i) => {
      const text = new PIXI.Text({
        text: opt,
        style: { fontFamily: 'Arial', fontSize: 16, fill: 0xffffff }
      });
      text.x = 10;
      text.y = 10 + i * 30;
      text.interactive = true;
      text.buttonMode = true;
      this.container.addChild(text);
      this.optionTexts.push(text);
    });
  }

  /** Show battle options, optionally replacing default options. */
  show(opts) {
    if (Array.isArray(opts) && opts.length) {
      this.options = opts;
      this.createOptions();
    }
    this.container.visible = true;
  }

  /** Hide the battle menu. */
  hide() {
    this.container.visible = false;
  }
}