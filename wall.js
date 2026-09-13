import { tr, localizeDOM } from "./localization.js?v=20260913-i18n-1";
import './workspace.js?v=20260913-i18n-1';
import { homography, project, validQuad, transformQuad, zoomAt } from './wall-math.js';

const $ = id => document.getElementById(id);
const canvas=$('wall-canvas'), ctx=canvas.getContext('2d'), stage=$('wall-stage');
const defaults=()=>({opacity:55,blend:'source-over',wallContrast:100,wallBrightness:100,sketchContrast:100,sketchBrightness:100});
let model={wall:null,sketch:null,quad:[],settings:defaults()}, mode='place', perspective=false;
let view={x:0,y:0,scale:1}, peek=false, busy=false, revision=0, savedRevision=-1;
let undo=[],redo=[],pendingEdit=null, sizeBase=null, angleBase=null;
let frame=0, dirty=true, scene=document.createElement('canvas');
let wallLayer=document.createElement('canvas'), wallKey='';
const pointers=new Map();
let gesture=null;
const snapshot=()=>({...model,quad:model.quad.map(p=>({...p})),settings:{...model.settings}});
const status=message=>{$('wall-status').textContent=message;};
function beginEdit() { if(!pendingEdit) pendingEdit=snapshot(); }
function commitEdit() {
  if(!pendingEdit) return;
  const before=pendingEdit; pendingEdit=null;
  if(before.wall===model.wall && before.sketch===model.sketch && JSON.stringify([before.quad,before.settings])===JSON.stringify([model.quad,model.settings])) return;
  undo.push(before); if(undo.length>24) undo.shift(); redo=[]; revision++; sync();
}
function change(action) { beginEdit(); action(); commitEdit(); invalidate(); }
function invalidate() { dirty=true; drawSoon(); }
function drawSoon() { if(!frame) frame=requestAnimationFrame(()=>{frame=0;draw();}); }
function centerQuad() {
  if(!model.wall||!model.sketch) return [];
  const ratio=Math.min(model.wall.width*.72/model.sketch.width,model.wall.height*.72/model.sketch.height);
  const w=model.sketch.width*ratio,h=model.sketch.height*ratio,x=(model.wall.width-w)/2,y=(model.wall.height-h)/2;
  return [{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}];
}
function fit() {
  if(!model.wall) return;
  const width=stage.clientWidth,height=stage.clientHeight;
  const scale=Math.min((width-36)/model.wall.width,(height-36)/model.wall.height);
  view={scale,x:(width-model.wall.width*scale)/2,y:(height-model.wall.height*scale)/2}; drawSoon();
}
function preview(kind) {
  const holder=$(kind+'-preview'),asset=model[kind]; holder.replaceChildren();
  if(asset) {
    const c=document.createElement('canvas'); c.width=240; c.height=Math.max(1,Math.round(240*asset.height/asset.width));
    c.getContext('2d').drawImage(asset.canvas,0,0,c.width,c.height);holder.append(c);
  } else { const span=document.createElement('span');span.textContent=kind==='wall'?tr("Votre mur, votre terrain de jeu."):tr("Le dessin à reporter sur le mur.");holder.append(span); }
  $(kind+'-name').textContent=asset?asset.name:kind==='wall'?tr("Aucune photo du mur"):tr("Aucun sketch");
}
function sync() {
  const hasWall=!!model.wall,hasBoth=hasWall&&!!model.sketch;
  $('wall-empty').hidden=hasWall;
  for(const id of ['zoom-out','zoom-in','fit-view','save-project','export']) $(id).disabled=!hasWall||busy;
  for(const id of ['mode-place','mode-explore','peek']) $(id).disabled=!hasBoth||busy;
  $('placement-fields').disabled=!hasBoth||mode!=='place'||busy;
  $('settings-fields').disabled=!hasWall||busy;
  $('undo').disabled=!undo.length||busy;$('redo').disabled=!redo.length||busy;
  $('mode-place').setAttribute('aria-pressed',mode==='place');$('mode-explore').setAttribute('aria-pressed',mode==='explore');
  $('perspective').checked=perspective;
  $('stage-badge').hidden=!hasWall;
  $('stage-badge').textContent=!hasBoth?tr("AJOUTEZ VOTRE SKETCH"):mode==='place'?(perspective?tr("AJUSTEMENT DES QUATRE COINS"):tr("PLACEMENT DU SKETCH")):tr("EXPLORATION · ALIGNEMENT VERROUILLÉ");
  $('gesture-hint').textContent=!hasWall?tr("Importez vos images pour commencer."):mode==='place'&&hasBoth?tr("Glisser : déplacer le sketch. Coins : perspective. Pincer / molette : zoomer. Espace + glisser : déplacer la vue."):tr("Glisser : déplacer la vue. Pincer / molette : zoomer. Les images restent alignées.");
  document.querySelectorAll('[data-setting]').forEach(input=>{
    input.value=model.settings[input.dataset.setting];
    const out=$(input.id+'-value');if(out)out.textContent=input.value+' %';
  });
  $('save-state').textContent=savedRevision===revision?tr("Session enregistrée sur cet appareil."):revision?tr("Modifications non enregistrées."):tr("Une session conservée dans ce navigateur.");
}
function resetTransforms() { sizeBase=null;angleBase=null;$('sketch-size').value=100;$('sketch-angle').value=0;$('size-value').textContent='100 %';$('angle-value').textContent='0°'; }

// A projective texture keeps every stroke aligned even when the photo is oblique.
function createWarpRenderer() {
  const output=document.createElement('canvas');
  const gl=output.getContext('webgl',{alpha:true,premultipliedAlpha:false,preserveDrawingBuffer:true,antialias:false});
  if(!gl) return null;
  const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(tr("Shader indisponible"));return s;};
  const program=gl.createProgram();
  gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 a; void main(){gl_Position=vec4(a,0.0,1.0);}'));
  gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`precision highp float;
    uniform sampler2D image; uniform mat3 inverse; uniform vec2 resolution; uniform float brightness; uniform float contrast;
    void main(){vec3 h=inverse*vec3(gl_FragCoord.x,resolution.y-gl_FragCoord.y,1.0);vec2 uv=h.xy/h.z;
    if(h.z<=0.0||uv.x<0.0||uv.x>1.0||uv.y<0.0||uv.y>1.0){gl_FragColor=vec4(0.0);return;}
    vec4 c=texture2D(image,uv);c.rgb=clamp((c.rgb*brightness-0.5)*contrast+0.5,0.0,1.0);gl_FragColor=c;}`));
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return null;
  gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const location=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,2,gl.FLOAT,false,0,0);
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
  for(const [key,val] of [[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE],[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR]])gl.texParameteri(gl.TEXTURE_2D,key,val);
  const uniform=name=>gl.getUniformLocation(program,name);let lastAsset=null;
  return (asset,quad,width,height,settings)=>{
    if(gl.isContextLost()) return null;
    const h=homography(quad);if(!h) return null;
    const [a,b,c,d,e,f,g,i]=h;
    const inv=[e-f*i,c*i-b,b*f-c*e,f*g-d,a-c*g,c*d-a*f,d*i-e*g,b*g-a*i,a*e-b*d];
    const determinant=a*inv[0]+b*inv[3]+c*inv[6];
    if(Math.abs(determinant)<1e-10)return null;
    // Transpose the row-major inverse for WebGL's column-major uniforms.
    gl.uniformMatrix3fv(uniform('inverse'),false,new Float32Array([inv[0],inv[3],inv[6],inv[1],inv[4],inv[7],inv[2],inv[5],inv[8]].map(v=>v/determinant)));
    if(output.width!==width||output.height!==height){output.width=width;output.height=height;}
    gl.viewport(0,0,width,height);gl.uniform2f(uniform('resolution'),width,height);
    gl.uniform1f(uniform('brightness'),settings.sketchBrightness/100);gl.uniform1f(uniform('contrast'),settings.sketchContrast/100);
    if(lastAsset!==asset){gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,asset.canvas);lastAsset=asset;}
    gl.drawArrays(gl.TRIANGLES,0,6);return output;
  };
}
let warp;
try { warp=createWarpRenderer(); } catch { warp=null; }
// Canvas fallback for devices without WebGL. Subdivide the projective surface.
function fallbackWarp(target,asset,quad,settings) {
  // Add adjacent antialiased triangle coverage instead of compositing it twice.
  target.globalCompositeOperation='lighter';
  const h=homography(quad);if(!h)return;
  const filtered=document.createElement('canvas');filtered.width=asset.width;filtered.height=asset.height;
  const f=filtered.getContext('2d');f.filter=`brightness(${settings.sketchBrightness}%) contrast(${settings.sketchContrast}%)`;f.drawImage(asset.canvas,0,0);
  function triangle(uv) {
    const dest=uv.map(([u,v])=>project(h,u,v)),src=uv.map(([u,v])=>[u*asset.width,v*asset.height]);
    const [[x0,y0],[x1,y1],[x2,y2]]=src,[p0,p1,p2]=dest;
    const det=(x1-x0)*(y2-y0)-(x2-x0)*(y1-y0);
    const a=((p1.x-p0.x)*(y2-y0)-(p2.x-p0.x)*(y1-y0))/det;
    const b=((p1.y-p0.y)*(y2-y0)-(p2.y-p0.y)*(y1-y0))/det;
    const c=((x1-x0)*(p2.x-p0.x)-(x2-x0)*(p1.x-p0.x))/det;
    const d=((x1-x0)*(p2.y-p0.y)-(x2-x0)*(p1.y-p0.y))/det;
    target.save();target.beginPath();dest.forEach((p,index)=>index?target.lineTo(p.x,p.y):target.moveTo(p.x,p.y));target.closePath();target.clip();
    target.transform(a,b,c,d,p0.x-a*x0-c*y0,p0.y-b*x0-d*y0);target.drawImage(filtered,0,0);target.restore();
  }
  for(let y=0;y<24;y++)for(let x=0;x<24;x++){const u=x/24,v=y/24,U=(x+1)/24,V=(y+1)/24;triangle([[u,v],[U,v],[U,V]]);triangle([[u,v],[U,V],[u,V]]);}
}
function compose() {
  if(!model.wall)return;
  const {wall,sketch,settings,quad}=model;
  if(scene.width!==wall.width||scene.height!==wall.height){scene.width=wall.width;scene.height=wall.height;}
  const s=scene.getContext('2d');s.clearRect(0,0,scene.width,scene.height);
  const key=wall.id+':'+settings.wallBrightness+':'+settings.wallContrast;
  if(wallKey!==key){wallLayer.width=wall.width;wallLayer.height=wall.height;const w=wallLayer.getContext('2d');w.filter=`brightness(${settings.wallBrightness}%) contrast(${settings.wallContrast}%)`;w.drawImage(wall.canvas,0,0);wallKey=key;}
  s.fillStyle='#ffffff';s.fillRect(0,0,scene.width,scene.height);s.drawImage(wallLayer,0,0);
  if(sketch&&validQuad(quad)) {
    s.save();s.globalAlpha=settings.opacity/100;s.globalCompositeOperation=settings.blend;
    const warped=warp?.(sketch,quad,wall.width,wall.height,settings);
    if(warped)s.drawImage(warped,0,0);
    else {const layer=document.createElement('canvas');layer.width=wall.width;layer.height=wall.height;fallbackWarp(layer.getContext('2d'),sketch,quad,settings);s.drawImage(layer,0,0);}
    s.restore();
  }
  dirty=false;
}
function draw() {
  const dpr=Math.min(devicePixelRatio||1,2),w=stage.clientWidth,h=stage.clientHeight;
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  if(!model.wall)return;
  if(dirty)compose();
  ctx.save();ctx.translate(view.x,view.y);ctx.scale(view.scale,view.scale);
  if(peek){ctx.fillStyle='#fff';ctx.fillRect(0,0,scene.width,scene.height);ctx.drawImage(wallLayer,0,0);}else ctx.drawImage(scene,0,0);
  ctx.restore();
  if(mode==='place'&&model.sketch&&!peek){
    const points=model.quad.map(p=>({x:p.x*view.scale+view.x,y:p.y*view.scale+view.y}));
    ctx.strokeStyle='#d7ed87';ctx.lineWidth=1.5;ctx.setLineDash([6,4]);ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.stroke();ctx.setLineDash([]);
    if(perspective)points.forEach((p,i)=>{ctx.beginPath();ctx.arc(p.x,p.y,12,0,Math.PI*2);ctx.fillStyle='#d7ed87';ctx.fill();ctx.strokeStyle='#192922';ctx.stroke();ctx.fillStyle='#192922';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(i+1,p.x,p.y);});
  }
  $('zoom-value').textContent=Math.round(view.scale*100)+' %';
}

async function decode(blob,name) {
  if(!blob || !blob.size || blob.size>50*1024*1024)throw Error(tr("Choisissez une image de moins de 50 Mo."));
  const url=URL.createObjectURL(blob),img=new Image();
  try{img.src=url;await img.decode();}catch{throw Error(tr("Ce format ne peut pas être lu ici. Exportez la photo en JPG, PNG ou WebP puis réessayez."));}finally{URL.revokeObjectURL(url);}
  const factor=Math.min(1,2560/Math.max(img.naturalWidth,img.naturalHeight));
  const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.naturalWidth*factor));c.height=Math.max(1,Math.round(img.naturalHeight*factor));c.getContext('2d').drawImage(img,0,0,c.width,c.height);
  const normalized=await new Promise(resolve=>c.toBlob(resolve,'image/png'));if(!normalized)throw Error(tr("Cette image est trop grande pour cet appareil."));
  return {id:globalThis.crypto?.randomUUID?.() || `image-${Date.now()}-${Math.random()}`,canvas:c,blob:normalized,name,width:c.width,height:c.height};
}
let importKind='wall';
document.querySelectorAll('[data-import],[data-camera]').forEach(button=>button.addEventListener('click',()=>{
  if(busy)return;importKind=button.dataset.import||button.dataset.camera;const input=button.dataset.camera?$('camera-input'):$('file-input');input.value='';input.click();
}));
for(const id of ['file-input','camera-input'])$(id).addEventListener('change',async event=>{
  const file=event.target.files[0],kind=importKind;if(!file||busy)return;
  busy=true;sync();status(tr("Ouverture de la photo…"));
  try{
    const asset=await decode(file,file.name||tr('Photo'));
    change(()=>{model[kind]=asset;model.quad=centerQuad();});
    mode='place';resetTransforms();preview(kind);fit();
    status(kind==='wall'?tr("Mur ajouté. Importez votre sketch ou ajustez son placement."):tr("Sketch ajouté. Alignez-le sur le mur, puis verrouillez le placement."));
    if(model.wall&&model.sketch)selectPanel('placement');
  }catch(error){status(error.message);}finally{busy=false;sync();}
});
function selectPanel(name,focus=false) {
  document.querySelectorAll('[data-panel]').forEach(tab=>{const selected=tab.dataset.panel===name;tab.setAttribute('aria-selected',selected);tab.tabIndex=selected?0:-1;$(tab.getAttribute('aria-controls')).hidden=!selected;if(selected&&focus)tab.focus();});
}
document.querySelectorAll('[data-panel]').forEach(tab=>{
  tab.addEventListener('click',()=>selectPanel(tab.dataset.panel));
  tab.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const names=['images','placement','settings'];const next=event.key==='Home'?0:event.key==='End'?2:(names.indexOf(tab.dataset.panel)+(event.key==='ArrowRight'?1:2))%3;selectPanel(names[next],true);});
});
function setMode(next) { finishGesture();mode=next;resetTransforms();sync();drawSoon(); }
$('mode-place').addEventListener('click',()=>setMode('place'));
$('mode-explore').addEventListener('click',()=>setMode('explore'));
$('perspective').addEventListener('change',event=>{perspective=event.target.checked;sync();drawSoon();});
$('reset-placement').addEventListener('click',()=>{change(()=>{model.quad=centerQuad();});resetTransforms();});
for(const kind of ['size','angle']) {
  const input=$('sketch-'+kind);
  input.addEventListener('input',()=>{
    beginEdit();
    if(kind==='size'){if(!sizeBase)sizeBase=model.quad.map(p=>({...p}));model.quad=transformQuad(sizeBase,Number(input.value)/100);$('size-value').textContent=input.value+' %';angleBase=null;$('sketch-angle').value=0;$('angle-value').textContent='0°';}
    else {if(!angleBase)angleBase=model.quad.map(p=>({...p}));model.quad=transformQuad(angleBase,1,Number(input.value)*Math.PI/180);$('angle-value').textContent=input.value+'°';sizeBase=null;$('sketch-size').value=100;$('size-value').textContent='100 %';}
    invalidate();
  });input.addEventListener('change',commitEdit);
}
document.querySelectorAll('[data-setting]').forEach(input=>{
  input.addEventListener('input',()=>{beginEdit();model.settings[input.dataset.setting]=input.id==='blend'?input.value:Number(input.value);const output=$(input.id+'-value');if(output)output.textContent=input.value+' %';invalidate();});
  input.addEventListener('change',commitEdit);
});
$('reset-settings').addEventListener('click',()=>change(()=>{model.settings=defaults();}));
function history(direction) {
  if(busy)return;finishGesture();commitEdit();const from=direction==='undo'?undo:redo,to=direction==='undo'?redo:undo;if(!from.length)return;
  const previousWall=model.wall;to.push(snapshot());model=from.pop();revision++;resetTransforms();preview('wall');preview('sketch');sync();invalidate();if(previousWall!==model.wall)fit();
}
$('undo').addEventListener('click',()=>history('undo'));$('redo').addEventListener('click',()=>history('redo'));
const localPoint=event=>{const r=canvas.getBoundingClientRect();return{x:event.clientX-r.left,y:event.clientY-r.top};};
const world=p=>({x:(p.x-view.x)/view.scale,y:(p.y-view.y)/view.scale});
let space=false;
function startGesture() {
  if(!pointers.size)return;
  const points=[...pointers.values()];
  if(points.length>=2){const a=points[0],b=points[1];gesture={type:'pinch',distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},view:{...view}};return;}
  const p=points[0];let type=mode==='place'&&model.sketch&&!space&&!p.pan?'move':'pan',corner=-1;
  if(type==='move'&&perspective)corner=model.quad.findIndex(q=>Math.hypot(q.x*view.scale+view.x-p.x,q.y*view.scale+view.y-p.y)<24);
  if(corner>=0)type='corner';
  gesture={type,corner,start:p,view:{...view},quad:model.quad.map(q=>({...q}))};
  if(type==='move'||type==='corner')beginEdit();
}
function finishGesture() { pointers.clear();gesture=null;commitEdit(); }
canvas.addEventListener('pointerdown',event=>{
  if(!model.wall||busy||![0,1].includes(event.button))return;
  event.preventDefault();canvas.focus({preventScroll:true});canvas.setPointerCapture(event.pointerId);
  pointers.set(event.pointerId,{...localPoint(event),pan:event.button===1});startGesture();
});
canvas.addEventListener('pointermove',event=>{
  if(!pointers.has(event.pointerId))return;
  pointers.set(event.pointerId,{...localPoint(event),pan:pointers.get(event.pointerId).pan});
  if(!gesture)return;
  const points=[...pointers.values()],p=points[0],g=gesture;
  if(g.type==='pinch'&&points.length>=2){const b=points[1],center={x:(p.x+b.x)/2,y:(p.y+b.y)/2};view=zoomAt(g.view,g.center,Math.hypot(p.x-b.x,p.y-b.y)/g.distance);view.x+=center.x-g.center.x;view.y+=center.y-g.center.y;drawSoon();return;}
  const dx=p.x-g.start.x,dy=p.y-g.start.y;
  if(g.type==='pan'){view={...g.view,x:g.view.x+dx,y:g.view.y+dy};drawSoon();}
  else if(g.type==='move'){model.quad=g.quad.map(q=>({x:q.x+dx/view.scale,y:q.y+dy/view.scale}));resetTransforms();invalidate();}
  else if(g.type==='corner'){const next=g.quad.map(q=>({...q}));next[g.corner]=world(p);if(validQuad(next)){model.quad=next;resetTransforms();invalidate();}}
});
function pointerEnd(event) { if(!pointers.has(event.pointerId))return;const wasPinch=gesture?.type==='pinch';pointers.delete(event.pointerId);if(wasPinch)for(const p of pointers.values())p.pan=true;if(pointers.size)startGesture();else{gesture=null;commitEdit();} }
for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,pointerEnd);
canvas.addEventListener('wheel',event=>{if(!model.wall||busy)return;event.preventDefault();if(pointers.size)return;view=zoomAt(view,localPoint(event),Math.exp(-Math.max(-100,Math.min(100,event.deltaY))*.008));drawSoon();},{passive:false});
function zoom(factor){view=zoomAt(view,{x:stage.clientWidth/2,y:stage.clientHeight/2},factor);drawSoon();}
$('zoom-in').addEventListener('click',()=>zoom(1.25));$('zoom-out').addEventListener('click',()=>zoom(.8));$('fit-view').addEventListener('click',fit);
function setPeek(value){peek=value;$('peek').setAttribute('aria-pressed',value);drawSoon();}
$('peek').addEventListener('pointerdown',event=>{event.preventDefault();$('peek').setPointerCapture(event.pointerId);setPeek(true);});
for(const name of ['pointerup','pointercancel','lostpointercapture','blur'])$('peek').addEventListener(name,()=>setPeek(false));
$('peek').addEventListener('keydown',event=>{if([' ','Enter'].includes(event.key)){event.preventDefault();setPeek(true);}});
$('peek').addEventListener('keyup',()=>setPeek(false));
document.addEventListener('keydown',event=>{
  if(event.target.matches('input,select,textarea')||busy)return;
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();history(event.shiftKey?'redo':'undo');return;}
  if(event.target!==canvas)return;
  if(event.code==='Space'){event.preventDefault();space=true;}
  if(!model.wall)return;
  if(['+','=','-','0'].includes(event.key)){event.preventDefault();event.key==='0'?fit():zoom(event.key==='-'?.8:1.25);}
  if(event.key.startsWith('Arrow')){event.preventDefault();const n=event.shiftKey?10:1,dx=event.key==='ArrowLeft'?-n:event.key==='ArrowRight'?n:0,dy=event.key==='ArrowUp'?-n:event.key==='ArrowDown'?n:0;
    if(mode==='place'&&model.sketch){change(()=>{model.quad=model.quad.map(p=>({x:p.x+dx,y:p.y+dy}));});resetTransforms();}
    else{view.x+=dx*8;view.y+=dy*8;drawSoon();}}
});
document.addEventListener('keyup',event=>{if(event.code==='Space')space=false;});
window.addEventListener('blur',()=>{space=false;finishGesture();setPeek(false);});
$('fullscreen').addEventListener('click',async()=>{
  try{if(document.fullscreenElement)await document.exitFullscreen();else if($('wall-editor').requestFullscreen)await $('wall-editor').requestFullscreen();else status(tr("Le plein écran n’est pas proposé par ce navigateur."));}catch{status(tr("Le plein écran n’est pas disponible dans ce navigateur."));}
});
document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?tr("Quitter le plein écran"):tr("Plein écran");});
let stageSize={width:stage.clientWidth,height:stage.clientHeight};
new ResizeObserver(()=>{const next={width:stage.clientWidth,height:stage.clientHeight};if(model.wall){view.x+=(next.width-stageSize.width)/2;view.y+=(next.height-stageSize.height)/2;}stageSize=next;drawSoon();}).observe(stage);

// IndexedDB stores normalized photos and settings together in one atomic record.
function openDB() { return new Promise((resolve,reject)=>{const request=indexedDB.open('spray-color-wheel.wall',1);request.onupgradeneeded=()=>request.result.createObjectStore('projects');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);}); }
async function storage(action,value) {
  const db=await openDB();
  try{return await new Promise((resolve,reject)=>{const tx=db.transaction('projects',action==='save'?'readwrite':'readonly'),store=tx.objectStore('projects');const req=action==='save'?store.put(value,'current'):store.get('current');tx.oncomplete=()=>resolve(req.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}finally{db.close();}
}
$('save-project').addEventListener('click',async()=>{
  if(busy||!model.wall)return;finishGesture();busy=true;sync();
  const asset=kind=>model[kind]?{blob:model[kind].blob,name:model[kind].name}:null;
  try{await storage('save',{version:1,wall:asset('wall'),sketch:asset('sketch'),quad:model.quad,settings:model.settings,mode,perspective,view});savedRevision=revision;$('load-project').disabled=false;status(tr("Session enregistrée dans ce navigateur. Elle remplace la précédente."));}
  catch{status(tr("Enregistrement impossible : stockage indisponible ou plein. Exportez votre superposition en PNG."));}
  finally{busy=false;sync();}
});
$('load-project').addEventListener('click',async()=>{
  if(busy)return;busy=true;sync();
  try{const data=await storage('load');if(!data?.wall||data.version!==1)throw Error(tr("Aucune session compatible enregistrée."));
    const wall=await decode(data.wall.blob,data.wall.name),sketch=data.sketch?await decode(data.sketch.blob,data.sketch.name):null;
    if(sketch&&!validQuad(data.quad))throw Error(tr("Le placement enregistré est invalide."));
    const settings={...defaults(),...data.settings};
    for(const [key,value]of Object.entries(settings))if(key!=='blend'&&(!Number.isFinite(value)||value<0||value>(key==='opacity'?100:200)))throw Error(tr("Réglages enregistrés invalides."));
    if(!['source-over','multiply','screen'].includes(settings.blend))throw Error(tr("Mode de fusion enregistré invalide."));
    change(()=>{model={wall,sketch,quad:sketch?data.quad:[],settings};});mode=data.mode==='explore'?'explore':'place';perspective=!!data.perspective;savedRevision=revision;resetTransforms();preview('wall');preview('sketch');fit();status(tr("Session restaurée. Annuler permet de retrouver le travail précédent."));
  }catch(error){status('Impossible de reprendre la session. '+error.message);}finally{busy=false;sync();}
});
$('export').addEventListener('click',async()=>{
  if(busy||!model.wall)return;busy=true;sync();
  try{if(dirty)compose();const blob=await new Promise(resolve=>scene.toBlob(resolve,'image/png'));if(!blob)throw Error();const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='mur-superposition.png';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);status(tr("PNG exporté · {0} × {1} px, sans les poignées ni les commandes.", {0: scene.width, 1: scene.height}));}
  catch{status(tr("Export impossible sur cet appareil. Réessayez avec des images plus petites."));}finally{busy=false;sync();}
});
window.addEventListener('beforeunload',event=>{if(model.wall&&revision!==savedRevision){event.preventDefault();event.returnValue='';}});
storage('load').then(data=>{$('load-project').disabled=!data?.wall;}).catch(()=>{status(tr("Le stockage local est indisponible. Vous pouvez travailler et exporter en PNG."));});
sync();drawSoon();

document.addEventListener('languagechange', () => {
  sync(); preview('wall'); preview('sketch');
  $('fullscreen').textContent = tr(document.fullscreenElement ? 'Quitter le plein écran' : 'Plein écran');
  localizeDOM();
});
