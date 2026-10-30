import test from 'node:test';
import assert from 'node:assert/strict';
import { previewText, socialMetadata } from '../src/lib/socialMetadata.js';
const base = { url: new URL('https://example.org/story?preview=secret#theme'), fallbackImage: '/images/social-preview.png' };
test('social metadata has absolute URLs, no query tokens and a bundled fallback', () => {
  const metadata = socialMetadata(base);
  assert.equal(metadata.canonical, 'https://example.org/story');
  assert.equal(metadata.image, 'https://example.org/images/social-preview.png');
  assert.ok(metadata.defaultImage);
  assert.ok(metadata.description);
});
test('story and object metadata preserves content and resolves relative images', () => {
  const metadata = socialMetadata({ ...base, title: 'Historie', description: '<p>Beelden &amp; verhalen</p>', image: '/photo.jpg' });
  assert.equal(metadata.title, 'Historie');
  assert.equal(metadata.description, 'Beelden & verhalen');
  assert.equal(metadata.image, 'https://example.org/photo.jpg');
  assert.equal(metadata.defaultImage, false);
});
test('invalid and vector images use the social card; descriptions contain no markup', () => {
  for (const image of ['javascript:alert(1)', 'https://example.org/logo.svg', 'http://[']) {
    assert.ok(socialMetadata({ ...base, image }).defaultImage);
  }
  assert.equal(previewText('<script>bad()</script><p>Erfgoed</p><p>&#233; &#x26;</p>'), 'Erfgoed é &');
  assert.equal(previewText('x'.repeat(400)).length, 240);
});
