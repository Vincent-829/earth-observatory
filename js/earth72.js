/* EARTH 7.2: additive layers; existing camera, selection and tracking remain owners. */
(()=>{
'use strict';
const C=window.Earth72,$=id=>document.getElementById(id),HOUR=3600000;
const style=document.createElement('style');style.textContent=`
#earth72-panel{position:fixed;z-index:40;right:80px;top:118px;width:min(350px,calc(100vw - 24px));max-height:calc(100dvh - 150px);overflow:auto;background:#04172bf5;border:1px solid #36cde9;border-radius:14px;padding:14px;font-size:12px;overscroll-behavior:contain}
#earth72-panel[hidden]{display:none}#earth72-panel label{display:block;margin:10px 0}#earth72-panel button{min-height:44px}#earth72-panel p{line-height:1.6}#earth72-panel a,#earth72-country a{color:#86e6ff}#earth72-list{max-height:230px;overflow:auto}#earth72-list article{border-top:1px solid #245976;padding:8px 0}#earth72-list button{width:100%;text-align:left}#earth72-canvas{position:absolute;inset:0;pointer-events:none;z-index:2}#earth72-country{border-top:1px solid #245976;margin-top:12px;padding-top:10px}#earth72-country p{overflow-wrap:anywhere}
@media(max-width:849px){#earth72-panel{top:12px;right:12px;left:12px;width:auto;max-height:calc(100dvh - 90px - env(safe-area-inset-bottom,0px))}}
`;document.head.append(style);
const panel=document.createElement('section');panel.id='earth72-panel';panel.hidden=true;panel.setAttribute('aria-label','全球觀測圖層');
panel.innerHTML=`<button id="earth72-close" type="button" style="float:right">關閉 ×</button><h3>全球觀測圖層</h3>
<label><input type="checkbox" id="earth72-quake"> 地震（USGS 過去 24 小時 M ≥ 2.5）</label>
<label><input type="checkbox" id="earth72-storm"> 颱風／熱帶氣旋與強風暴（EONET）</label>
<label><input type="checkbox" id="earth72-volcano"> 火山事件（EONET）</label>
<p>來源會延遲；「近期」不代表即時。風暴分類可能含非熱帶風暴，名稱依來源。火山清單不等於全球火山警報。</p>
<button id="earth72-refresh" type="button">更新事件資料</button><p id="earth72-status" role="status">尚未讀取事件</p>
<label><input type="checkbox" id="earth72-ground"> 所選衛星地面軌跡（前後 45 分鐘）</label>
<label><input type="checkbox" id="earth72-footprint"> 所選衛星理論通視範圍</label>
<p>綠線：地面軌跡；黃線：最低仰角 10° 的幾何通視邊界，並非感測器實際掃幅。沿用既有 SGP4 模型。</p><p id="earth72-orbit-status">請在衛星模式選取衛星</p>
<label><input type="checkbox" id="earth72-weather"> 全球氣溫取樣圖層</label><label><input type="checkbox" id="earth72-cloud"> 全球雲量取樣圖層</label>
<button id="earth72-weather-refresh" type="button">更新天氣資料</button><p id="earth72-weather-status" role="status">尚未讀取天氣</p>
<p>30° 網格、72 點（含海洋；不含極點），僅供全球概覽。白點透明度為雲量，彩點為氣溫：藍冷、紅暖。Open-Meteo 模型估計，非測站實測、非衛星雲圖。</p>
<p><a href="https://earthquake.usgs.gov/earthquakes/feed/v1.0/" target="_blank" rel="noopener noreferrer">USGS</a> · <a href="https://eonet.gsfc.nasa.gov/" target="_blank" rel="noopener noreferrer">NASA EONET</a> · <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Weather data by Open-Meteo.com（CC BY 4.0）</a></p><div id="earth72-list"></div>`;
document.body.append(panel);
// Add to existing menus, preserving all 7.1 desktop positions.
const open=document.createElement('button');open.type='button';open.textContent='◎ 全球觀測圖層';open.setAttribute('aria-controls',panel.id);open.setAttribute('aria-expanded','false');
const setPanel=on=>{panel.hidden=!on;open.setAttribute('aria-expanded',String(on));};
open.onclick=()=>setPanel(panel.hidden);$('advanced-panel').append(open);
$('earth72-close').onclick=()=>{setPanel(false);open.focus()};document.addEventListener('keydown',e=>{if(e.key==='Escape')setPanel(false)});
// Mobile layer menu is rebuilt by its original handler on every opening.
document.querySelector('[data-refmenu="layers"]')?.addEventListener('click',()=>{const b=document.createElement('button');b.textContent='全球觀測圖層';b.onclick=()=>{$('ref61-menu').hidden=true;setPanel(true)};$('ref61-menu-actions').append(b)});
const canvas=document.createElement('canvas');canvas.id='earth72-canvas';canvas.setAttribute('aria-hidden','true');$('app').insertBefore(canvas,$('sat63-overlay'));const ctx=canvas.getContext('2d');
let quake=[],natural=[],weather=[],selectedSat=null,paths=[],boundary=[],orbitAt=0,lastFrame=0;
const checked=id=>$('earth72-'+id).checked;
const date=t=>Number.isFinite(t)?new Date(t).toLocaleString('zh-TW',{hour12:false}):'未知';
const age=(t,max)=>({recent:'近期',stale:'過期',unknown:'時間未知／異常'})[C.freshness(t,max)];
async function json(url){const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),15000);try{const r=await fetch(url,{signal:abort.signal,cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);return await r.json()}finally{clearTimeout(timer)}}
let eventBusy=false,weatherBusy=false,eventFetched=0,weatherFetched=0,eventMessage='尚未讀取事件';
function listEvents(){
 const list=$('earth72-list');list.replaceChildren();
 const rows=[...quake,...natural].filter(e=>checked(e.type)).sort((a,b)=>b.time-a.time);
 for(const e of rows.slice(0,150)){
  const article=document.createElement('article'),b=document.createElement('button'),p=document.createElement('p');b.textContent=({quake:'● 地震',storm:'◆ 風暴',volcano:'▲ 火山'})[e.type]+' · '+e.title;
  b.onclick=()=>{moveToRegion(...e.coord);};
  p.textContent='事件／位置時間：'+date(e.time)+' · '+age(e.time,e.type==='quake'?24*HOUR:48*HOUR)+(e.type==='quake'?' · feed '+age(e.feedTime,30*60000):'');article.append(b,p);
  try{const u=new URL(e.url);if(u.protocol==='https:'){const a=document.createElement('a');a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';a.textContent='原始來源 ↗';article.append(a)}}catch{}
  list.append(article);
 }
 const p=document.createElement('p');p.textContent=rows.length?'符合篩選 '+rows.length+' 筆；清單最多顯示 150 筆。':'沒有可顯示事件；可能未開啟圖層、來源無事件或尚未取得資料。';list.prepend(p);
}
async function loadEvents(){if(eventBusy)return;eventBusy=true;$('earth72-refresh').disabled=true;$('earth72-status').textContent='讀取中…';
 const result=await Promise.allSettled([json('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson').then(C.earthquakes),json('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=30&category=severeStorms,volcanoes').then(C.events)]);
 const messages=[];result.forEach((r,i)=>{if(r.status==='fulfilled'){if(i===0)quake=r.value;else natural=r.value;messages.push((i?'EONET':'USGS')+' '+r.value.length+' 筆')}else{if(i===0)quake=[];else natural=[];messages.push((i?'EONET':'USGS')+' 讀取失敗（未顯示舊資料）')}});
 eventFetched=Date.now();eventMessage=messages.join('；');eventBusy=false;$('earth72-refresh').disabled=false;updateStatus();listEvents();}
const coords=[];for(let lat=-75;lat<=75;lat+=30)for(let lon=-180;lon<180;lon+=30)coords.push([lon,lat]);
async function loadWeather(){if(weatherBusy)return;weatherBusy=true;$('earth72-weather-refresh').disabled=true;$('earth72-weather-status').textContent='讀取全球模型取樣中…';
 try{const q=new URLSearchParams({latitude:coords.map(c=>c[1]).join(','),longitude:coords.map(c=>c[0]).join(','),current:'temperature_2m,cloud_cover,wind_speed_10m',timeformat:'unixtime',timezone:'GMT'});weather=C.weather(await json('https://api.open-meteo.com/v1/forecast?'+q),coords);if(!weather.length)throw Error('無有效天氣資料');weatherFetched=Date.now();}
 catch(e){weather=[];weatherFetched=0;$('earth72-weather-status').textContent='天氣讀取失敗：'+e.message+'；未顯示舊資料。'}
 finally{weatherBusy=false;$('earth72-weather-refresh').disabled=false;updateStatus()}}
function updateStatus(){if(eventFetched&&!eventBusy)$('earth72-status').textContent=eventMessage+'；讀取：'+date(eventFetched)+'。各事件時效見清單。';if(weather.length&&!weatherBusy){const t=Math.min(...weather.map(w=>w.time));$('earth72-weather-status').textContent=weather.length+'/72 點；最早有效時間：'+date(t)+' · '+age(t,2*HOUR)+'（模型估計）；讀取：'+date(weatherFetched)}}
$('earth72-refresh').onclick=loadEvents;$('earth72-weather-refresh').onclick=loadWeather;
for(const type of ['quake','storm','volcano'])$('earth72-'+type).onchange=()=>{listEvents();if(checked(type)&&!eventFetched)loadEvents()};
for(const type of ['weather','cloud'])$('earth72-'+type).onchange=()=>{if(checked(type)&&!weatherFetched)loadWeather()};
window.addEventListener('earth:satellite-selected',e=>{selectedSat=e.detail;orbitAt=0});
function orbit(){paths=[];boundary=[];const sat=window.earthSGP4;if(!sat||!selectedSat)return;
 const now=Date.now();for(let m=-45;m<=45;m+=1){const t=new Date(now+m*60000),p=sat.propagate(selectedSat.satrec,t);if(!p?.position||typeof p.position==='boolean'){paths.push(null);continue}const g=sat.eciToGeodetic(p.position,sat.gstime(t));paths.push([g.longitude*180/Math.PI,g.latitude*180/Math.PI]);if(m===0)boundary=C.footprint(g.longitude*180/Math.PI,g.latitude*180/Math.PI,g.height)}
 $('earth72-orbit-status').textContent=selectedSat.name+' · 推算：'+date(now)+' · 軌道參數：'+selectedSat.epoch+'（'+age(selectedSat.epoch,7*24*HOUR)+'）';}
function line(points,view,color,dash=[]){ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=1.6;ctx.setLineDash(dash);let previous=null;for(const c of points){const p=c&&C.validCoord(c)&&C.project(c,view);if(!p){previous=null;continue}if(previous&&Math.hypot(p.x-previous.x,p.y-previous.y)<view.sphere.r*.5)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);previous=p}ctx.stroke();ctx.setLineDash([])}
function paint(t){requestAnimationFrame(paint);if(t-lastFrame<80||document.hidden)return;lastFrame=t;
 const view=window.earthOrbitalView?.();if(!view)return;const dpr=Math.min(window.devicePixelRatio||1,1.5),w=Math.round(view.width*dpr),h=Math.round(view.height*dpr);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,view.width,view.height);ctx.save();ctx.beginPath();ctx.arc(view.sphere.x,view.sphere.y,view.sphere.r,0,Math.PI*2);ctx.clip();
 if(checked('weather')||checked('cloud'))for(const row of weather){if(C.freshness(row.time,2*HOUR)!=='recent')continue;const p=C.project(row.coord,view);if(!p)continue;const r=Math.max(3,view.sphere.r*.035);if(checked('weather')){ctx.fillStyle='hsl('+Math.max(0,Math.min(240,240-(row.temp+30)*4))+',85%,60%)';ctx.beginPath();ctx.arc(p.x,p.y,r,0,7);ctx.fill()}if(checked('cloud')){ctx.fillStyle='rgba(255,255,255,'+(row.cloud/100*.85)+')';ctx.beginPath();ctx.arc(p.x,p.y,r*1.7,0,7);ctx.fill()}}
 for(const e of [...quake,...natural]){if(!checked(e.type))continue;const max=e.type==='quake'?24*HOUR:48*HOUR;if(C.freshness(e.time,max)!=='recent'||(e.type==='quake'&&C.freshness(e.feedTime,30*60000)!=='recent'))continue;const p=C.project(e.coord,view);if(!p)continue;if(e.type==='storm')line(e.track.filter(p=>C.freshness(p.time,48*HOUR)==='recent').map(p=>p.coord),view,'#b8a0ff',[3,4]);ctx.fillStyle={quake:'#ff8975',storm:'#c4a0ff',volcano:'#ffd25c'}[e.type];ctx.font='bold 17px system-ui';ctx.fillText({quake:'●',storm:'◆',volcano:'▲'}[e.type],p.x-6,p.y+6)}
 if(selectedSat&&$('sat61-toggle').getAttribute('aria-pressed')==='true'&&(checked('ground')||checked('footprint'))){if(t-orbitAt>5000||!orbitAt){orbit();orbitAt=t}if(checked('ground'))line(paths,view,'#65ffd1');if(checked('footprint'))line(boundary,view,'#ffe291',[5,3])}
 ctx.restore();
}
requestAnimationFrame(paint);setInterval(()=>{updateStatus();if(!panel.hidden)listEvents();if(!document.hidden&&['quake','storm','volcano'].some(checked)&&Date.now()-eventFetched>5*60000)loadEvents();if(!document.hidden&&['weather','cloud'].some(checked)&&Date.now()-weatherFetched>30*60000)loadWeather()},60000);
// Country enrichment is on demand; existing culture, attractions and journals stay intact.
const previous=showCountry;
showCountry=function(feature){previous(feature);const section=document.createElement('section');section.id='earth72-country';const h=document.createElement('h3');h.textContent='國家探索資料';const note=document.createElement('p');note.textContent='ISO：'+feature.iso+'。REST Countries 參考資料；來源未提供逐欄統計年份，不視為即時統計。';const button=document.createElement('button');button.type='button';button.textContent='讀取國家基本資料';const output=document.createElement('div');section.append(h,note,button,output);$('countrydetails').append(section);
 button.onclick=async()=>{button.disabled=true;output.textContent='讀取中…';try{if(!/^[A-Z]{3}$/.test(feature.iso))throw Error('此地區沒有可用 ISO 對應');const result=await json('https://restcountries.com/v3.1/alpha/'+feature.iso+'?fields=cca3,capital,languages,currencies,timezones,region,subregion');const row=Array.isArray(result)?result[0]:result;if(row?.cca3!==feature.iso)throw Error('國碼不符');output.replaceChildren();for(const [label,value] of [['首都',row.capital?.join('、')],['區域',[row.region,row.subregion].filter(Boolean).join(' / ')],['語言',Object.values(row.languages||{}).join('、')],['貨幣',Object.entries(row.currencies||{}).map(([k,v])=>k+' '+v.name).join('、')],['時區',row.timezones?.join('、')]]){const p=document.createElement('p');p.textContent=label+'：'+(value||'找不到資料');output.append(p)}const p=document.createElement('p');p.textContent='來源：REST Countries；讀取時間：'+date(Date.now())+'；內容基準年份未知。';const a=document.createElement('a');a.href='https://restcountries.com/';a.target='_blank';a.rel='noopener noreferrer';a.textContent='來源網站 ↗';output.append(p,a)}catch(e){output.textContent='REST Countries 無法取得：'+e.message+'；嘗試世界銀行備援…';try{if(!/^[A-Z]{3}$/.test(feature.iso))throw Error('此地區沒有可用 ISO 對應');const data=await json('https://api.worldbank.org/v2/country/'+feature.iso+'?format=json');const row=data?.[1]?.[0];if(row?.id!==feature.iso)throw Error('世界銀行無相符地區資料');output.replaceChildren();for(const [label,value] of [['首都',row.capitalCity],['世界銀行區域',row.region?.value],['所得分類',row.incomeLevel?.value]]){const p=document.createElement('p');p.textContent=label+'：'+(value||'找不到資料');output.append(p)}const p=document.createElement('p');p.textContent='來源：世界銀行 Country API（REST Countries 連線失敗）；讀取：'+date(Date.now())+'；基準年份未知。語言、貨幣、時區暫無可用資料。';const a=document.createElement('a');a.href='https://datahelpdesk.worldbank.org/knowledgebase/articles/898590-country-api-queries';a.textContent='世界銀行來源說明 ↗';a.target='_blank';a.rel='noopener noreferrer';output.append(p,a)}catch(fallback){output.textContent='無法取得資料：'+e.message+'；'+fallback.message}}finally{button.disabled=false}};
};
})();
