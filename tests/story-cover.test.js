import test from 'node:test';
import assert from 'node:assert/strict';
import { storyCover } from '../src/lib/server/flix/storyCover.js';

test('story cover uses the first available carousel image', async () => {
  assert.equal(await storyCover({ carouselItems: async () => [{ src: '' }, { src: 'https://example.org/image.jpg' }] }), 'https://example.org/image.jpg');
});

test('missing or unavailable source leaves the graphical cover available', async () => {
  assert.equal(await storyCover({ carouselItems: async () => [] }), undefined);
  assert.equal(await storyCover({ carouselItems: async () => { throw new Error('offline'); } }), undefined);
  assert.equal(await storyCover({ carouselItems: async () => [{ src: 'javascript:alert(1)' }] }), undefined);
});
