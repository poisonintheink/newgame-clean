import { KnowledgeBase } from '../systems/KnowledgeSystem.js';

const kb = new KnowledgeBase();
kb.learn({ type: 'greeting', text: 'hello' });

const mem = kb.remember(0);
if (!mem || mem.text !== 'hello') {
  throw new Error('remember failed');
}

const queryRes = kb.query({ type: 'greeting' });
if (queryRes.length !== 1) {
  throw new Error('query failed');
}

const data = kb.serialize();
const kb2 = KnowledgeBase.deserialize(data);
if (kb2.remember(0).text !== 'hello') {
  throw new Error('deserialize failed');
}

console.log('KnowledgeSystem basic test passed');