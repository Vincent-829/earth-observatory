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

test('country info controls use measured docking rather than a guessed offset', () => {
 assert.match(html, /id="earth70-measured-dock"/);
 assert.match(html, /getBoundingClientRect\(\)/);
 assert.match(html, /--earth70-info-top-gap/);
 assert.match(html, /ResizeObserver/);
});
test('satellite selection does not implicitly enable follow', () => {
 const selection = html.match(/function selectSatellite\(id\)\{[\s\S]*?\n\}/)?.[0];
 assert.ok(selection, 'Satellite selection handler missing');
 assert.match(selection, /setFollow\(false\)/);
 assert.doesNotMatch(selection, /setFollow\(true\)/);
 assert.match(html, /lostpointercapture/);
 assert.match(html, /window\.addEventListener\('blur'/);
});
test('selected satellite has an independent tracking card', () => {
 assert.match(html, /id="earth70-satellite-card-portal"/);
 assert.match(html, /detail\.style\.left/);
 assert.match(html, /detail\.style\.top/);
});

test('7.1 desktop dock follows actual button width and country card bounds', () => {
 assert.match(html, /id="earth71-layout-sync"/);
 assert.match(html, /satelliteWidth=sat\.getBoundingClientRect\(\)\.width/);
 assert.match(html, /--earth71-share-left/);
 assert.match(html, /--earth71-dock-bottom/);
});
test('7.1 satellite card considers all four positions and clamps to viewport', () => {
 assert.match(html, /const candidates=\[/);
 assert.match(html, /point\.x-gap-cardW/);
 assert.match(html, /point\.y-gap-cardH/);
 assert.match(html, /Math\.min\(maxX,candidate\.x\)/);
 assert.match(html, /Math\.min\(maxY,candidate\.y\)/);
});
