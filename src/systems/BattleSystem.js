import { EventEmitter } from '../core/EventEmitter.js';

/**
 * Simple battle manager that resolves attacks when combatants are adjacent.
 */
export class BattleSystem extends EventEmitter {
  constructor() {
    super();
    this.pairs = new Set(); // { attacker, defender }
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
   * @param {number} deltaTime - Seconds since last update (unused for now).
   */
  update(deltaTime) {
    for (const pair of this.pairs) {
      const { attacker, defender } = pair;
      if (!attacker || !defender || defender.hitPoints <= 0) continue;

      const dist = Math.abs(attacker.tileX - defender.tileX) + Math.abs(attacker.tileY - defender.tileY);
      if (dist <= 1) {
        this.attack(attacker, defender);
      }
    }
  }

  /** Perform an attack calculation and emit events. */
  attack(attacker, defender) {
    const atk = attacker.stats?.strength || 0;
    const def = defender.stats?.defense || 0;
    const dmg = Math.max(1, atk - Math.floor(def / 2));
    defender.hitPoints -= dmg;
    this.emit('attack', { attacker, defender, damage: dmg });
    if (defender.hitPoints <= 0) {
      defender.hitPoints = 0;
      this.emit('defeated', { attacker, defender });
    }
  }
}