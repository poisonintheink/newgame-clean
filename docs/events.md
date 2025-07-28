## Common events

| Event | Emitted By | Description |
|-------|------------|-------------|
| `idle` | `IdleSystem` | Fired when an entity has not moved for the configured duration. Payload: `{ entity, idleTime }` |
| `move` | `MovementSystem` | Fired when a registered entity changes tiles. Payload: `{ entity, from, to }` |
| `itemAdded` | `InventorySystem` | An item was added to an entity inventory. Payload: `{ entity, item }` |
| `itemRemoved` | `InventorySystem` | An item was removed from an inventory. Payload: `{ entity, item }` |
| `itemTransferred` | `InventorySystem` | Item moved between entities. Payload: `{ from, to, item }` |
| `attack` | `BattleSystem` | An attack occurred during combat. Payload: `{ attacker, defender, damage }` |
| `defeated` | `BattleSystem` | A defender's hit points dropped to 0. Payload: `{ attacker, defender }` |
| `gameStart` | `Game` | Emitted when the game loop begins. |
| `stateChanged` | `StateManager` | Fired after changing states. Payload: `name` |
| `camera:move` | `Camera` | Camera position updated. Payload: `{ x, y }` |
| `camera:shakeStart` | `Camera` | Shake effect started. |
| `camera:shakeEnd` | `Camera` | Shake effect ended. |
| `camera:zoom` | `Camera` | Zoom level changed. Payload: `{ zoom }` |
| `camera:resize` | `Camera` | Viewport resized. Payload: `{ width, height }` |

This list is not exhaustive but covers the most frequently used events.
Use the bus to publish new events (e.g., `entity.discovered`) so that any
interested system can react without tight coupling.