import * as PIXI from 'pixi.js';
import { InventoryUI } from './InventoryUI.js';
import { BattleUI } from './BattleUI.js';

/**
 * Manages high level UI components like the HUD, inventory screen and
 * battle menus.
 */
export class UIManager {
  constructor() {
    // Root container added to a state or the main app.
    this.container = new PIXI.Container();

    // Sub UIs
    this.inventoryUI = new InventoryUI();
    this.battleUI = new BattleUI();

    // Simple HUD text element
    this.hudText = new PIXI.Text({
      text: '',
      style: { fontFamily: 'Arial', fontSize: 14, fill: 0xffffff }
    });
    this.hudText.x = 10;
    this.hudText.y = 10;

    this.container.addChild(this.hudText);
    this.container.addChild(this.inventoryUI.container);
    this.container.addChild(this.battleUI.container);
  }

  /** Show the inventory for the given entity. */
  showInventory(entity) {
    this.inventoryUI.show(entity);
  }

  /** Hide the inventory screen. */
  hideInventory() {
    this.inventoryUI.hide();
  }

  /** Display the battle options. */
  showBattle(options) {
    this.battleUI.show(options);
  }

  /** Hide the battle menu. */
  hideBattle() {
    this.battleUI.hide();
  }

  /**
   * Update HUD text. Call every frame with game context (eg. player stats).
   */
  updateHUD({ player } = {}) {
    if (player) {
      this.hudText.text = `HP: ${player.hitPoints}`;
    }
  }
}