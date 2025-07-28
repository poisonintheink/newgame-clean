import * as PIXI from 'pixi.js';

/**
 * Simple panel that lists the contents of an entity's inventory.
 */
export class InventoryUI {
  constructor(width = 200, height = 300) {
    this.container = new PIXI.Container();
    this.background = new PIXI.Graphics();
    this.background.rect(0, 0, width, height);
    this.background.fill({ color: 0x000000, alpha: 0.6 });
    this.container.addChild(this.background);

    this.itemTexts = [];
    this.entity = null;
    this.container.visible = false;
  }

  /** Show inventory of the given entity. */
  show(entity) {
    this.entity = entity;
    this.refresh();
    this.container.visible = true;
  }

  /** Hide the inventory panel. */
  hide() {
    this.container.visible = false;
  }

  /** Rebuild the item list. */
  refresh() {
    this.itemTexts.forEach(t => t.destroy());
    this.itemTexts.length = 0;

    const items = (this.entity && this.entity.inventory) || [];
    items.forEach((item, i) => {
      const name = typeof item === 'string' ? item : item.name || String(item);
      const text = new PIXI.Text({
        text: name,
        style: { fontFamily: 'Arial', fontSize: 14, fill: 0xffffff }
      });
      text.x = 10;
      text.y = 10 + i * 20;
      this.container.addChild(text);
      this.itemTexts.push(text);
    });
  }
}