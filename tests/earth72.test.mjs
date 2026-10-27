import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const C=createRequire(import.meta.url)('../js/earth72-core.js');
const now=Date.parse('2026-10-27T12:00:00Z');
test('freshness never promotes missing, future or stale source dates',()=>{
 assert.equal(C.freshness(undefined,1000,now),'unknown');assert.equal(C.freshness(now+600000,1000,now),'unknown');assert.equal(C.freshness(now-2000,1000,now),'stale');assert.equal(C.freshness(now,1000,now),'recent');
});
test('USGS keeps feed generation distinct from event time and rejects invalid coordinates',()=>{
 const data={metadata:{generated:now-2000},features:[{id:'x',geometry:{type:'Point',coordinates:[121,25,12]},properties:{time:now,title:'M 4.0'}},{geometry:{type:'Point',coordinates:[999,25]},properties:{time:now}}]};
 const r=C.earthquakes(data);assert.equal(r.length,1);assert.equal(r[0].feedTime,now-2000);assert.equal(r[0].time,now);assert.deepEqual(r[0].coord,[121,25]);assert.throws(()=>C.earthquakes({}));
});
test('EONET selects latest dated point and preserves storm track without inventing typhoon class',()=>{
 const r=C.events({events:[{id:'s',categories:[{id:'severeStorms'}],geometry:[{type:'Point',coordinates:[122,20],date:'2026-10-27'},{type:'Point',coordinates:[121,19],date:'2026-10-26'},{type:'Polygon',coordinates:[],date:'2026-10-28'}]}]});assert.equal(r[0].type,'storm');assert.deepEqual(r[0].coord,[122,20]);assert.equal(r[0].track.length,2);assert.deepEqual(C.events({events:[{categories:[{id:'volcanoes'}],geometry:[]}]}),[]);
});
test('weather accepts zero cloud cover and temperature, rejects null and partial/mismatched responses',()=>{
 const row={current:{time:now/1000,temperature_2m:0,cloud_cover:0,wind_speed_10m:null}};
 assert.equal(C.weather([row],[[0,0]])[0].temp,0);assert.equal(C.weather([row],[[0,0]])[0].wind,null);assert.throws(()=>C.weather([row],[]));assert.equal(C.weather([{current:{...row.current,cloud_cover:null}}],[[0,0]]).length,0);
});
test('footprint is closed, finite at poles and dateline and shrinks with minimum elevation',()=>{
 for(const p of [[180,90],[-180,-90],[121,25]]){const r=C.footprint(...p,400);assert.equal(r.length,73);assert.ok(r.every(C.validCoord));assert.ok(Math.abs(r[0][1]-r.at(-1)[1])<1e-8)}
 assert.deepEqual(C.footprint(0,0,-1),[]);assert.ok(C.footprint(0,0,400,0)[0][1]>C.footprint(0,0,400,10)[0][1]);
});
test('surface projection hides far hemisphere and maps center correctly across dateline',()=>{
 const v={lon:180,lat:0,sphere:{x:300,y:200,r:100}};assert.deepEqual(C.project([180,0],v),{x:300,y:200});assert.equal(C.project([0,0],v),null);assert.ok(Math.abs(C.project([-179,0],v).x-300)<2);
});
test('all classic inline scripts and new browser scripts parse',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){if(!/type="module"/.test(m[1]))new vm.Script(m[2]);}new vm.Script(readFileSync(new URL('../js/earth72.js',import.meta.url),'utf8'));assert.ok(html.includes('js/earth72-core.js'));
});
