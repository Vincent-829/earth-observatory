/* NASA GIBS dated daily satellite product. Raw colours and missing pixels retained. */
(()=>{
'use strict';
const C=window.Earth72,$=id=>document.getElementById(id),panel=$('earth72-panel');if(!C||!panel)return;
const section=document.createElement('section');section.id='earth72-cloud-imagery';
section.innerHTML=`<h3>衛星雲量日合成</h3>
<label><input type="checkbox" id="earth72-imagery"> NASA Terra／MODIS 日間雲量</label>
<label>影像日期（UTC）<input type="date" id="earth72-imagery-date"></label>
<label>透明度 <input type="range" id="earth72-imagery-opacity" min="10" max="80" value="35" step="5"></label>
<button type="button" id="earth72-imagery-refresh">載入所選日期</button>
<p id="earth72-imagery-status" role="status">尚未載入；每日合成，非即時。</p>
<p>僅日間衛星觀測；軌道間隙、未觀測區或缺測維持透明，不代表晴空。每日影像不是同一時間的全球快照。</p>
<img src="https://gibs.earthdata.nasa.gov/legends/MODIS_Cloud_Fraction_H.png" alt="NASA MODIS 雲量比例官方色階，0 至 100%" loading="lazy" style="width:100%;height:auto;max-width:378px">
<p>原始色階雲量產品，非自然色雲照片。<a href="https://gibs.earthdata.nasa.gov/layer-metadata/v1.0/MODIS_Terra_Cloud_Fraction_Day.json" target="_blank" rel="noopener noreferrer">NASA GIBS／MODIS 來源 ↗</a></p>`;
panel.append(section);
const input=$('earth72-imagery-date'),toggle=$('earth72-imagery'),button=$('earth72-imagery-refresh'),status=$('earth72-imagery-status'),opacity=$('earth72-imagery-opacity');
const day=offset=>new Date(Date.now()+offset*86400000).toISOString().slice(0,10);
input.min=day(-7);input.max=day(-1);input.value=day(-1);
const canvas=document.createElement('canvas');canvas.id='earth72-cloud-raster';canvas.setAttribute('aria-hidden','true');canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2';$('app').insertBefore(canvas,$('earth72-canvas'));
const ctx=canvas.getContext('2d'),sphere=document.createElement('canvas'),sc=sphere.getContext('2d');
let texture=null,imageDate='',loading=false,last=0,cacheKey='',requestId=0;
function clear(){texture=null;cacheKey='';ctx.clearRect(0,0,canvas.width,canvas.height);}
async function load(){
 if(loading)return;
 clear();const selected=input.value;if(!C.cloudDay(selected)){status.textContent='日期無效：請選擇 UTC 昨日至前 7 日的日期。';return}
 loading=true;button.disabled=true;const token=++requestId;status.textContent='讀取 NASA '+selected+' 日間雲量合成…（非即時）';
 try{
  const q=new URLSearchParams({service:'WMS',version:'1.1.1',request:'GetMap',layers:'MODIS_Terra_Cloud_Fraction_Day',styles:'',srs:'EPSG:4326',bbox:'-180,-90,180,90',width:'1024',height:'512',format:'image/png',transparent:'TRUE',time:selected});
  const image=await new Promise((resolve,reject)=>{const img=new Image();img.crossOrigin='anonymous';const timer=setTimeout(()=>{img.onload=img.onerror=null;img.src='';reject(Error('影像連線逾時'))},20000);img.onload=()=>{clearTimeout(timer);resolve(img)};img.onerror=()=>{clearTimeout(timer);reject(Error('NASA 影像載入失敗'))};img.src='https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?'+q});
  const c=document.createElement('canvas');c.width=1024;c.height=512;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(image,0,0,1024,512);const pixels=g.getImageData(0,0,1024,512);
  let valid=false;for(let i=3;i<pixels.data.length;i+=4)if(pixels.data[i]){valid=true;break}if(!valid)throw Error('所選日期沒有可用像素');
  if(token!==requestId||input.value!==selected)return;
  texture=pixels;imageDate=selected;cacheKey='';status.textContent='NASA Terra／MODIS · '+imageDate+'（UTC 日合成，非即時）；讀取：'+new Date().toLocaleString('zh-TW',{hour12:false})+'。缺測區透明。';
 }catch(e){clear();status.textContent='衛星雲量圖無法取得：'+e.message+'；未顯示替代或舊影像。'}
 finally{loading=false;button.disabled=false}
}
button.onclick=load;toggle.onchange=()=>{if(toggle.checked&&!texture)load();if(!toggle.checked)ctx.clearRect(0,0,canvas.width,canvas.height)};
input.onchange=()=>{requestId++;clear();status.textContent='日期已變更，請載入所選日期（非即時）。';};
function draw(t){
 requestAnimationFrame(draw);if(t-last<120||document.hidden)return;last=t;
 if(!toggle.checked||!texture)return;
 const view=window.earthOrbitalView?.();if(!view)return;
 const width=Math.round(view.width),height=Math.round(view.height);if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height}
 ctx.clearRect(0,0,width,height);
 const size=width<850?160:240,key=[view.lon.toFixed(2),view.lat.toFixed(2),size,imageDate].join(':');
 if(key!==cacheKey){
  if(sphere.width!==size){sphere.width=sphere.height=size}
  const out=sc.createImageData(size,size),local={...view,sphere:{x:size/2,y:size/2,r:size/2}};
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const uv=C.textureCoord(x+.5,y+.5,local);if(!uv)continue;
   const sx=Math.min(1023,Math.floor(uv.u*1024)),sy=Math.min(511,Math.floor(uv.v*512)),a=(sy*1024+sx)*4,b=(y*size+x)*4;
   out.data[b]=texture.data[a];out.data[b+1]=texture.data[a+1];out.data[b+2]=texture.data[a+2];out.data[b+3]=texture.data[a+3];
  }
  sc.putImageData(out,0,0);cacheKey=key;
 }
 const {x,y,r}=view.sphere;ctx.globalAlpha=Number(opacity.value)/100;ctx.drawImage(sphere,x-r,y-r,r*2,r*2);ctx.globalAlpha=1;
}
requestAnimationFrame(draw);
})();
