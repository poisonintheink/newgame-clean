import assert from 'assert';
import { KnowledgeBase } from '../systems/KnowledgeSystem.js';

const kb = new KnowledgeBase();
kb.learn({ type: 'greeting', text: 'hello' });

const mem = kb.remember(0);
assert.ok(mem && mem.text === 'hello', 'remember failed');

const queryRes = kb.query({ type: 'greeting' });
assert.strictEqual(queryRes.length, 1, 'query failed');

const data = kb.serialize();
const kb2 = KnowledgeBase.deserialize(data);
assert.strictEqual(kb2.remember(0).text, 'hello', 'deserialize failed');

console.log('KnowledgeSystem basic test passed');