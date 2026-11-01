// A chapter narrated once is served from KV after that: the 70B model runs once per input.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from './functions/api/narrate.js';

test('second identical narration is a KV hit, no model call', async () => {
  globalThis.fetch = async () => new Response('{}', { status: 200 });
  const store = new Map();
  let runs = 0;
  const env = {
    AI: { run: async () => { runs++; return { response: 'A: The ground decides the battle.' }; } },
    TTS_KV: { get: async (k) => (store.has(k) ? JSON.parse(store.get(k)) : null), put: async (k, v) => { store.set(k, v); } },
  };
  const req = () => new Request('https://x/api/narrate', { method: 'POST', headers: { authorization: 'Bearer t' },
    body: JSON.stringify({ text: 'Chapter one.', title: 'Book', ch: 0, total: 3 }) });
  const a = await (await onRequest({ request: req(), env })).json();
  const b = await (await onRequest({ request: req(), env })).json();
  assert.equal(runs, 1);
  assert.deepEqual(a, b);
  assert.ok(a.script.length);
});
