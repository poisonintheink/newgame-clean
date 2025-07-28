import { eventBus } from '../core/EventBus.js';

/**
 * Simple battle manager that resolves attacks when combatants are adjacent.
 */
export class BattleSystem {
  constructor() {
    this.pairs = new Set(); // { attacker, defender }
    this.battleCooldowns = new WeakMap(); // Prevent attack spam
  }

  /** Register a pair of combatants to monitor. */
  engage(attacker, defender) {
    if (!attacker || !defender) return;
    this.pairs.add({ attacker, defender });
  }

  /** Stop monitoring a pair of combatants. */
  disengage(attacker, defender) {
    for (const pair of this.pairs) {
      if (pair.attacker === attacker && pair.defender === defender) {
        this.pairs.delete(pair);
        break;
      }
    }
  }

  /**
   * Update all engagements and perform attacks if combatants are adjacent.
   * @param {number} deltaTime - Seconds since last update.
   */
  update(deltaTime) {
    // Update cooldowns
    for (const pair of this.pairs) {
      const cd = this.battleCooldowns.get(pair) || 0;
      if (cd > 0) {
        this.battleCooldowns.set(pair, cd - deltaTime);
      }
    }

    // Check for battles
    for (const pair of this.pairs) {
      const { attacker, defender } = pair;
      if (!attacker || !defender || defender.hitPoints <= 0) continue;

      const dist = Math.abs(attacker.tileX - defender.tileX) + Math.abs(attacker.tileY - defender.tileY);
      const cooldown = this.battleCooldowns.get(pair) || 0;
      
      if (dist <= 1 && cooldown <= 0) {
        this.attack(attacker, defender);
        this.battleCooldowns.set(pair, 1.0); // 1 second between attacks
      }
    }
  }

  /** Perform an attack calculation and emit events. */
  attack(attacker, defender) {
    const atk = attacker.stats?.strength || 0;
    const def = defender.stats?.defense || 0;
    const dmg = Math.max(1, atk - Math.floor(def / 2));
    
    defender.hitPoints = Math.max(0, defender.hitPoints - dmg);
    
    eventBus.emit('attack', { attacker, defender, damage: dmg });
    
    if (defender.hitPoints <= 0) {
      eventBus.emit('defeated', { attacker, defender });
      this.disengage(attacker, defender);
    }
  }

  /** Clear all battle pairs */
  clear() {
    this.pairs.clear();
    this.battleCooldowns = new WeakMap();
  }
}