/* Pure data/geometry helpers shared by the browser and regression tests. */
(function(root){
'use strict';
const validCoord=p=>Array.isArray(p)&&p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90;
function freshness(time,maxAge,now=Date.now()){
 const value=typeof time==='string'&&/^\d{4}-\d\d-\d\dT/.test(time)&&!/(?:Z|[+-]\d\d:?\d\d)$/.test(time)?time+'Z':time;
 const t=typeof value==='number'?value:Date.parse(value);
 return !Number.isFinite(t)||t>now+300000?'unknown':now-t>maxAge?'stale':'recent';
}
function earthquakes(data){
 if(!Array.isArray(data?.features))throw Error('地震資料格式錯誤');
 return data.features.filter(f=>f.geometry?.type==='Point'&&validCoord(f.geometry.coordinates)&&Number.isFinite(f.properties?.time)).map(f=>({id:f.id,title:f.properties.title||'地震',type:'quake',coord:f.geometry.coordinates.slice(0,2),time:f.properties.time,feedTime:data.metadata?.generated,url:f.properties.url}));
}
function events(data){
 if(!Array.isArray(data?.events))throw Error('事件資料格式錯誤');
 return data.events.flatMap(e=>{
  const type=e.categories?.some(c=>c.id==='volcanoes')?'volcano':e.categories?.some(c=>c.id==='severeStorms')?'storm':null;
  const points=(e.geometry||[]).filter(g=>g.type==='Point'&&validCoord(g.coordinates)&&Number.isFinite(Date.parse(g.date))).sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));
  const p=points.at(-1);return type&&p?[{id:e.id,title:e.title||'事件',type,coord:p.coordinates,time:Date.parse(p.date),url:e.sources?.[0]?.url,track:points.map(g=>({coord:g.coordinates,time:Date.parse(g.date)}))}]:[];
 });
}
function weather(data,coords){
 const rows=Array.isArray(data)?data:[data];
 if(rows.length!==coords.length)throw Error('天氣座標數量不符');
 return rows.flatMap((row,i)=>{
  const c=row?.current;
  if(!c||!Number.isFinite(c.time)||!Number.isFinite(c.temperature_2m)||!Number.isFinite(c.cloud_cover)||c.cloud_cover<0||c.cloud_cover>100)return [];
  return [{coord:coords[i],time:c.time*1000,temp:c.temperature_2m,cloud:c.cloud_cover,wind:Number.isFinite(c.wind_speed_10m)?c.wind_speed_10m:null}];
 });
}
function footprint(lon,lat,height,elevation=10){
 if(!validCoord([lon,lat])||!Number.isFinite(height)||height<=0||!Number.isFinite(elevation)||elevation<0||elevation>=90)return [];
 const R=6371,d=Math.PI/180,e=elevation*d,a=Math.acos(R/(R+height)*Math.cos(e))-e,p=lat*d,l=lon*d;
 return Array.from({length:73},(_,i)=>{const b=i*5*d,q=Math.asin(Math.sin(p)*Math.cos(a)+Math.cos(p)*Math.sin(a)*Math.cos(b)),o=l+Math.atan2(Math.sin(b)*Math.sin(a)*Math.cos(p),Math.cos(a)-Math.sin(p)*Math.sin(q));return [((o/d+540)%360)-180,q/d]});
}
function project(coord,view){const d=Math.PI/180,a=(coord[0]-view.lon)*d,b=coord[1]*d,p=view.lat*d,v=Math.cos(b)*Math.cos(a)*Math.cos(p)+Math.sin(b)*Math.sin(p);return v<=0?null:{x:view.sphere.x+view.sphere.r*Math.cos(b)*Math.sin(a),y:view.sphere.y-view.sphere.r*(Math.sin(b)*Math.cos(p)-Math.cos(b)*Math.cos(a)*Math.sin(p))};}
const api={validCoord,freshness,earthquakes,events,weather,footprint,project};
root.Earth72=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
