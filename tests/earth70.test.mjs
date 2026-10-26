// EARTH 7.0 smoke checks. Run: node --test tests/earth70.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
test('viewport supports dynamic browser chrome', () => {
 assert.match(html, /height:100dvh/);
 assert.match(html, /id="earth70-responsive"/);
 assert.match(html, /min-height:0!important/);
});
test('mobile safe area and small-height layout are provided', () => {
 assert.match(html, /safe-area-inset-bottom/);
 assert.match(html, /max-height:600px/);
 assert.match(html, /max-width:700px/);
});
test('orientation and visual viewport resize are handled', () => {
 assert.match(html, /orientationchange/);
 assert.match(html, /visualViewport\?\.addEventListener\('resize'/);
});
test('existing orbital capabilities are preserved', () => {
 for (const id of ['sat69-forecast','sat69-night','sat69-model','sat65-open','sat61-panel']) {
  assert.ok(html.includes(id), 'Missing existing feature: '+id);
 }
});
