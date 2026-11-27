import assert from 'node:assert/strict';
import { fallbackCover } from '../covers.js';
const a = decodeURIComponent(fallbackCover('The Great Gatsby'));
assert.match(a, /^data:image\/svg\+xml,<svg/); assert.match(a, />TG</);
assert.equal(fallbackCover('The Great Gatsby'), fallbackCover('The Great Gatsby'));
assert.notEqual(fallbackCover('Dune'), fallbackCover('Emma'));
assert.match(decodeURIComponent(fallbackCover('<b>"x"')), />BX</);   // markup is stripped to initials
assert.match(decodeURIComponent(fallbackCover('')), />\?</);
