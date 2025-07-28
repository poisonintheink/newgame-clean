import { EventEmitter } from './EventEmitter.js';

/**
 * Global event bus used for cross-system communication.
 * Systems should emit and listen to events through this
 * shared instance rather than creating their own emitters.
 */
export const eventBus = new EventEmitter();
export default eventBus;