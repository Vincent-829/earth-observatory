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

test('country info controls use the consolidated responsive dock', () => {
 assert.match(html, /id="earth71-layout"/);
 assert.match(html, /id="earth71-layout-sync"/);
 assert.match(html, /--earth71-dock-bottom/);
 assert.match(html, /ResizeObserver/);
 assert.doesNotMatch(html, /id="earth70-bottom-left-dock"/);
 assert.doesNotMatch(html, /id="earth70-measured-dock-script"/);
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

test('7.1 responsive layout preserves desktop and mobile boundaries', () => {
 assert.match(html, /id="earth71-layout"/);
 assert.match(html, /@media\(min-width:850px\)/);
 assert.match(html, /@media\(max-width:849px\)/);
 assert.match(html, /width:min\(440px,calc\(100vw - 44px\)\)/);
 assert.match(html, /max-width:calc\(100vw - 20px\)/);
});
test('7.1 legacy duplicate dock definitions stay removed', () => {
 for(const id of ['earth70-bottom-left-dock','earth70-measured-dock','earth70-measured-dock-script']){
  assert.ok(!html.includes('id="'+id+'"'), 'Legacy dock still present: '+id);
 }
 assert.equal((html.match(/id="earth71-layout"/g)||[]).length,1);
 assert.equal((html.match(/id="earth71-layout-sync"/g)||[]).length,1);
});
test('7.1 satellite card remains visible only for projected on-screen satellite', () => {
 assert.match(html, /detail\.style\.visibility='visible'/);
 assert.match(html, /detail\.style\.visibility='hidden'/);
 assert.match(html, /detail\.style\.left=placed\.x/);
 assert.match(html, /detail\.style\.top=placed\.y/);
});
