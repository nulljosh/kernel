import assert from 'node:assert'
import { spend } from '../functions/api/speak.js'
const caps = { month: 1000, day: 500 }
const store = new Map()
const ok = { get: async k => store.get(k) ?? null, put: async (k, v) => { store.set(k, v) } }
assert.equal(await spend(ok, 'u', 10, caps, new Date()), null, 'normal spend passes')
assert.equal([...store.values()].filter(v => v === '10').length, 3, 'all three counters move')
const blocked = { get: ok.get, put: async () => { throw new Error('429') } }
assert.equal(await spend(blocked, 'u', 10, caps, new Date()), 'store', 'blocked writes stop spending')
assert.equal(await spend(ok, 'u', 600, caps, new Date()), 'day', 'day cap still holds')
{
  const store = new Map(), kv = { get: async k => store.get(k) ?? null, put: async (k, v) => { store.set(k, v) } }
  const c = { month: 1e6, day: 1e6, all: 100 }, now = new Date()
  assert.equal(await spend(kv, 'u:a', 60, c, now, 'aura:'), null, 'first listener fits the app day')
  assert.equal(await spend(kv, 'u:b', 60, c, now, 'aura:'), 'day', 'app-wide day cap holds across accounts')
  assert.equal(await spend(kv, 'u:b', 40, c, now, 'aura:'), null, 'what is left of the app day still spends')
}
console.log('spend ok')
