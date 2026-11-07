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
console.log('spend ok')
