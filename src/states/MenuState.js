import * as PIXI from 'pixi.js';
import { State } from '../core/StateManager.js';

export class MenuState extends State {
  constructor(game) {
    super(game);
    this.container = new PIXI.Container();
    this.menuItems = [];
    this.selectedIndex = 0;
    this.menuOptions = [
      { text: 'Play', action: () => this.startNewGame() },
      { text: 'Continue', action: () => this.continueGame(), disabled: true },
      { text: 'Options', action: () => this.openOptions(), disabled: true },
      { text: 'Exit', action: () => this.exitGame(), disabled: false }
    ];
  }

  async enter() {
    // Reinitialize container and arrays
    this.container = new PIXI.Container();
    this.menuItems = [];
    this.selectedIndex = 0;

    const app = this.game.app;

    // Create background
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, app.screen.width, app.screen.height);
    bg.fill(0x1a1a2e);
    this.container.addChild(bg);

    // Create title
    const title = new PIXI.Text({
      text: 'New Game',
      style: {
        fontFamily: 'Arial',
        fontSize: 72,
        fill: 0xedf2f4,
        align: 'center',
        dropShadow: true,
        dropShadowDistance: 8,
        dropShadowColor: 0x000000,
        dropShadowBlur: 8
      }
    });
    title.anchor.set(0.5);
    title.x = app.screen.width / 2;
    title.y = 150;
    this.container.addChild(title);

    // Create menu items
    const menuStartY = 300;
    const menuSpacing = 80;

    this.menuOptions.forEach((option, index) => {
      const menuItem = this.createMenuItem(option.text, option.disabled);
      menuItem.x = app.screen.width / 2;
      menuItem.y = menuStartY + (index * menuSpacing);
      menuItem.interactive = !option.disabled;
      menuItem.buttonMode = !option.disabled;

      // Store reference for selection handling
      menuItem.optionIndex = index;
      this.menuItems.push(menuItem);

      // Mouse/touch events
      if (!option.disabled) {
        menuItem.on('pointerover', () => this.selectItem(index));
        menuItem.on('pointerdown', () => this.activateItem(index));
      }

      this.container.addChild(menuItem);
    });

    // Create instruction text
    const instructions = new PIXI.Text({
      text: 'Use Arrow Keys to Navigate, Enter to Select',
      style: {
        fontFamily: 'Arial',
        fontSize: 18,
        fill: 0x8b8c8d,
        align: 'center'
      }
    });
    instructions.anchor.set(0.5);
    instructions.x = app.screen.width / 2;
    instructions.y = app.screen.height - 50;
    this.container.addChild(instructions);

    // Add to stage
    app.stage.addChild(this.container);

    // Set up keyboard controls
    this.handleKeyDown = (e) => this.onKeyDown(e);
    window.addEventListener('keydown', this.handleKeyDown);

    // Update initial selection
    this.updateSelection();
  }

  async exit() {
    window.removeEventListener('keydown', this.handleKeyDown);
    this.game.app.stage.removeChild(this.container);
    this.container.destroy({ children: true });

    // Clear references to destroyed objects
    this.menuItems = [];
    this.container = null;
  }

  createMenuItem(text, disabled = false) {
    const container = new PIXI.Container();

    // Create selection indicator (hidden by default)
    const selector = new PIXI.Graphics();
    selector.roundRect(-200, -30, 400, 60, 10);
    selector.fill({ color: 0xf39c12, alpha: 0.3 });
    selector.visible = false;
    container.addChild(selector);

    // Create text
    const textStyle = {
      fontFamily: 'Arial',
      fontSize: 36,
      fill: disabled ? 0x666666 : 0xedf2f4,
      align: 'center'
    };

    const textObj = new PIXI.Text({
      text: text,
      style: textStyle
    });
    textObj.anchor.set(0.5);
    container.addChild(textObj);

    // Store references
    container.selector = selector;
    container.textObj = textObj;
    container.disabled = disabled;

    return container;
  }

  selectItem(index) {
    if (this.menuOptions[index].disabled) return;
    this.selectedIndex = index;
    this.updateSelection();
  }

  updateSelection() {
    this.menuItems.forEach((item, index) => {
      const isSelected = index === this.selectedIndex;
      item.selector.visible = isSelected;

      // Animate selection
      if (isSelected) {
        item.scale.set(1.1);
        item.textObj.style.fill = 0xf39c12;
      } else {
        item.scale.set(1.0);
        item.textObj.style.fill = item.disabled ? 0x666666 : 0xedf2f4;
      }
    });
  }

  activateItem(index) {
    const option = this.menuOptions[index];
    if (!option.disabled && option.action) {
      // Add a small animation before executing
      const item = this.menuItems[index];
      item.scale.set(0.95);
      setTimeout(() => {
        item.scale.set(1.1);
        option.action();
      }, 100);
    }
  }

  onKeyDown(event) {
    switch (event.key) {
      case 'ArrowUp':
        this.moveSelection(-1);
        break;
      case 'ArrowDown':
        this.moveSelection(1);
        break;
      case 'Enter':
      case ' ':
        this.activateItem(this.selectedIndex);
        break;
    }
  }

  moveSelection(direction) {
    let newIndex = this.selectedIndex;
    const totalItems = this.menuOptions.length;

    // Find next non-disabled item
    do {
      newIndex = (newIndex + direction + totalItems) % totalItems;
    } while (this.menuOptions[newIndex].disabled && newIndex !== this.selectedIndex);

    this.selectItem(newIndex);
  }

  update(deltaTime) {
    // Add idle animations here if desired
    // For example, gentle floating motion for menu items
    this.menuItems.forEach((item, index) => {
      if (index === this.selectedIndex) {
        // Gentle pulse for selected item
        const scale = 1.1 + Math.sin(Date.now() * 0.003) * 0.02;
        item.scale.set(scale);
      }
    });
  }

  render() {
    // PIXI handles rendering
  }

  // Menu actions
  startNewGame() {
    console.log('Starting new game...');
    this.manager.changeState('gameplay');
  }

  continueGame() {
    console.log('Continue not implemented yet');
  }

  openOptions() {
    console.log('Options not implemented yet');
  }

  exitGame() {
    console.log('Returning to title screen...');
    this.manager.changeState('intro');
  }
}