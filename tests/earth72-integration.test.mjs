import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function harness(fetcher){
 const elements=new Map(),listeners=new Map();
 class Element{
  constructor(tag='div'){this.tag=tag;this.children=[];this.hidden=false;this.attributes={};this.textContent='';this.checked=false;this.style={};}
  set id(value){this._id=value;elements.set(value,this)}get id(){return this._id}
  set innerHTML(value){for(const m of value.matchAll(/<(\w+)[^>]*id="([^"]+)"/g)){const e=new Element(m[1]);e.id=m[2];this.children.push(e)}}
  append(...els){this.children.push(...els)}prepend(...els){this.children.unshift(...els)}insertBefore(e){this.children.push(e)}replaceChildren(...els){this.children=els;this.textContent=''}
  setAttribute(k,v){this.attributes[k]=v}getAttribute(k){return this.attributes[k]}focus(){}addEventListener(k,fn){this[k]=fn}
  getContext(){return new Proxy({}, {get:()=>()=>{}})}
 }
 for(const id of ['app','sat63-overlay','advanced-panel','ref61-menu-actions','ref61-menu','sat61-toggle','countrydetails']){const e=new Element();e.id=id}
 const mobile=new Element('button');
 const document={hidden:false,head:new Element('head'),body:new Element('body'),createElement:t=>new Element(t),getElementById:id=>elements.get(id),querySelector:()=>mobile,addEventListener(){}};
 const context={document,console,URL,URLSearchParams,AbortController,Date,Math,Number,Error,Promise,Map,Set,setTimeout,clearTimeout,setInterval(){},requestAnimationFrame(){},showCountry(){elements.get('countrydetails').replaceChildren()},moveToRegion(){}};
 context.window=context;context.globalThis=context;context.addEventListener=(k,fn)=>listeners.set(k,fn);context.fetch=fetcher;
 vm.createContext(context);vm.runInContext(readFileSync(new URL('../js/earth72-core.js',import.meta.url),'utf8'),context);vm.runInContext(readFileSync(new URL('../js/earth72.js',import.meta.url),'utf8'),context);
 return {elements,context,mobile};
}
test('browser wiring opens/closes additive panel and handles both source failures',async()=>{
 const h=harness(async()=>{throw Error('offline')});const button=h.elements.get('advanced-panel').children[0];button.onclick();assert.equal(h.elements.get('earth72-panel').hidden,false);h.elements.get('earth72-close').onclick();assert.equal(h.elements.get('earth72-panel').hidden,true);
 await h.elements.get('earth72-refresh').onclick();assert.match(h.elements.get('earth72-status').textContent,/USGS 讀取失敗/);assert.match(h.elements.get('earth72-status').textContent,/EONET 讀取失敗/);assert.equal(h.elements.get('earth72-refresh').disabled,false);
});
test('weather request uses all 72 coordinate pairs and releases controls on partial failure',async()=>{
 let url;const h=harness(async u=>{url=u;return {ok:true,json:async()=>[]}});await h.elements.get('earth72-weather-refresh').onclick();const q=new URL(url).searchParams;assert.equal(q.get('latitude').split(',').length,72);assert.equal(q.get('longitude').split(',').length,72);assert.match(h.elements.get('earth72-weather-status').textContent,/讀取失敗/);assert.equal(h.elements.get('earth72-weather-refresh').disabled,false);
});
test('country enhancement rejects mismatched API identity and preserves original handler',async()=>{
 const h=harness(async()=>({ok:true,json:async()=>({cca3:'USA'})}));h.context.showCountry({iso:'TWN'});const section=h.elements.get('earth72-country');await section.children[2].onclick();assert.match(section.children[3].textContent,/國碼不符/);assert.equal(h.elements.get('countrydetails').children.length,1);
});
test('country uses verified World Bank identity on REST Countries failure',async()=>{
 const h=harness(async u=>{if(u.includes('restcountries'))throw Error('403');return {ok:true,json:async()=>[{},[{id:'JPN',capitalCity:'Tokyo',region:{value:'East Asia & Pacific'},incomeLevel:{value:'High income'}}]]}});
 h.context.showCountry({iso:'JPN'});const section=h.elements.get('earth72-country');await section.children[2].onclick();const output=section.children[3];assert.equal(output.children[0].textContent,'首都：Tokyo');assert.match(output.children[3].textContent,/基準年份未知/);
});

function cloudHarness(imageWorks=true){
 const h=harness(async()=>{throw Error('offline')});
 h.context.Image=class {set src(v){if(!v)return;queueMicrotask(()=>imageWorks?this.onload():this.onerror())}};
 h.context.Uint8ClampedArray=Uint8ClampedArray;
 vm.runInContext(readFileSync(new URL('../js/earth72-clouds.js',import.meta.url),'utf8'),h.context);
 return h;
}
test('cloud source failure releases button and labels missing imagery without fallback',async()=>{
 const h=cloudHarness(false);await h.elements.get('earth72-imagery-refresh').onclick();assert.match(h.elements.get('earth72-imagery-status').textContent,/未顯示替代或舊影像/);assert.equal(h.elements.get('earth72-imagery-refresh').disabled,false);
});
test('cloud imagery validates dates before requesting an image',async()=>{
 const h=cloudHarness(false);h.elements.get('earth72-imagery-date').value=new Date().toISOString().slice(0,10);await h.elements.get('earth72-imagery-refresh').onclick();assert.match(h.elements.get('earth72-imagery-status').textContent,/日期無效/);
});
