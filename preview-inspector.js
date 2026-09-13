import { regionBounds, spraysInRegion } from './preview-selection.js';
import { tr, currentLanguage } from './localization.js?v=20260913-i18n-1';

// Inspect the original quantized pixels, not the browser's interpolated display pixels.
export function createPreviewInspector(canvas, {addSelection} = {}) {
  const popup=document.createElement('div');
  popup.id='spray-preview-popin';popup.className='spray-preview-popin';popup.hidden=true;
  popup.innerHTML='<div class="spray-popin-head"><span class="spray-popin-swatch"></span><div><p class="spray-popin-brand"></p><strong id="spray-popin-name"></strong></div><button class="cart-action spray-popin-close" type="button">×</button></div><p class="spray-popin-code"></p><p class="spray-popin-hint"></p>';
  document.body.append(popup);
  const closeButton=popup.querySelector('button');
  const list=document.createElement('div');list.className='spray-popin-list';list.hidden=true;
  const addButton=document.createElement('button');addButton.className='cart-action';addButton.type='button';addButton.hidden=true;
  popup.insertBefore(list,popup.querySelector('.spray-popin-hint'));popup.append(addButton);
  const outline=document.createElement('div');outline.className='spray-region-outline';outline.hidden=true;outline.setAttribute('aria-hidden','true');document.body.append(outline);
  let drag=null,selection=null,regionEntries=[];
  function drawSelection() {
    if(!selection){outline.hidden=true;return;}
    const r=imageRect();outline.hidden=false;
    Object.assign(outline.style,{left:(r.left+selection.x/width*r.width)+'px',top:(r.top+selection.y/height*r.height)+'px',width:(selection.width/width*r.width)+'px',height:(selection.height/height*r.height)+'px'});
  }
  function coordinates(clientX,clientY,clip=false) {
    if(!pixels||!canvas.getClientRects().length)return null;
    const r=imageRect();let x=Math.floor((clientX-r.left)/r.width*width),y=Math.floor((clientY-r.top)/r.height*height);
    if(!clip&&(x<0||y<0||x>=width||y>=height))return null;
    return {x:Math.max(0,Math.min(width-1,x)),y:Math.max(0,Math.min(height-1,y))};
  }
  canvas.tabIndex=0;
  canvas.setAttribute('aria-controls',popup.id);
  let pixels=null,width=0,height=0,byRGB=new Map(),pinned=false,point=null;

  function imageRect() {
    const rect=canvas.getBoundingClientRect();
    const scale=Math.min(rect.width/width,rect.height/height);
    const w=width*scale,h=height*scale;
    return {left:rect.left+(rect.width-w)/2,top:rect.top+(rect.height-h)/2,width:w,height:h};
  }
  function hit(clientX,clientY) {
    if(!pixels || !canvas.getClientRects().length)return null;
    const rect=imageRect();
    const x=Math.floor((clientX-rect.left)/rect.width*width),y=Math.floor((clientY-rect.top)/rect.height*height);
    if(x<0||y<0||x>=width||y>=height)return null;
    const index=(y*width+x)*4;
    if(!pixels[index+3])return null;
    const color=byRGB.get((pixels[index]<<16)|(pixels[index+1]<<8)|pixels[index+2]);
    return color?{color,x,y}:null;
  }
  function position() {
    drawSelection();
    if(popup.hidden||!point)return;
    const rect=imageRect(),x=rect.left+(point.x+.5)/width*rect.width,y=rect.top+(point.y+.5)/height*rect.height;
    const size=popup.getBoundingClientRect(),gap=14;
    let left=x+gap,top=y+gap;
    if(left+size.width>innerWidth-12)left=x-size.width-gap;
    if(top+size.height>innerHeight-12)top=y-size.height-gap;
    popup.style.left=Math.max(12,Math.min(innerWidth-size.width-12,left))+'px';
    popup.style.top=Math.max(12,Math.min(innerHeight-size.height-12,top))+'px';
  }
  function close(restoreFocus=false) {
    const activeDrag=drag;drag=null;
    if(activeDrag&&canvas.hasPointerCapture(activeDrag.id))canvas.releasePointerCapture(activeDrag.id);
    selection=null;regionEntries=[];drawSelection();
    popup.hidden=true;pinned=false;point=null;
    canvas.removeAttribute('aria-describedby');
    if(restoreFocus)canvas.focus({preventScroll:true});
  }
  function show(sample,freeze=false) {
    if(!sample){if(!pinned)close();return;}
    selection=null;drawSelection();regionEntries=[];list.hidden=true;addButton.hidden=true;
    popup.querySelector('.spray-popin-swatch').hidden=false;
    popup.querySelector('.spray-popin-brand').hidden=false;
    point=sample;pinned=freeze;
    const color=sample.color;
    popup.dataset.colorId=color.id;
    popup.dataset.pinned=String(pinned);
    popup.setAttribute('role',pinned?'dialog':'tooltip');
    popup.setAttribute('aria-labelledby','spray-popin-name');
    if(pinned)popup.setAttribute('aria-modal','false');else popup.removeAttribute('aria-modal');
    popup.querySelector('.spray-popin-swatch').style.background=color.hex;
    popup.querySelector('.spray-popin-brand').textContent=color.brandLabel;
    popup.querySelector('strong').textContent=color.name||color.label;
    popup.querySelector('.spray-popin-code').textContent=tr('Référence : {0}',{0:color.code||color.id});
    popup.querySelector('.spray-popin-hint').textContent=tr(pinned?'Fiche épinglée · Échap pour fermer':'Cliquez pour garder cette fiche ouverte.');
    closeButton.hidden=!pinned;
    closeButton.setAttribute('aria-label',tr('Fermer'));
    popup.hidden=false;
    canvas.setAttribute('aria-describedby',popup.id);
    position();
    if(pinned)closeButton.focus({preventScroll:true});
  }
  function showRegion(start,end) {
    const result=spraysInRegion(pixels,width,height,byRGB,start,end);
    selection=result.bounds;regionEntries=result.entries;pinned=true;point=end;
    delete popup.dataset.colorId;popup.dataset.pinned='true';
    popup.setAttribute('role','dialog');popup.setAttribute('aria-modal','false');popup.setAttribute('aria-labelledby','spray-popin-name');
    popup.querySelector('.spray-popin-swatch').hidden=true;popup.querySelector('.spray-popin-brand').hidden=true;
    popup.querySelector('strong').textContent=tr('Sprays de la zone sélectionnée');
    popup.querySelector('.spray-popin-code').textContent=tr('{0} références dans cette zone', {0:regionEntries.length});
    list.replaceChildren();list.hidden=false;
    for(const {color,share} of regionEntries) {
      const row=document.createElement('div');row.className='spray-region-row';row.dataset.colorId=color.id;
      const swatch=document.createElement('span');swatch.className='spray-popin-swatch';swatch.style.background=color.hex;
      const details=document.createElement('div'),name=document.createElement('strong'),reference=document.createElement('small'),ratio=document.createElement('span');
      name.textContent=color.name||color.label;reference.textContent=color.brandLabel+' · '+(color.code||color.id);
      ratio.textContent=(share*100).toLocaleString(currentLanguage(),{maximumFractionDigits:1})+' %';ratio.className='spray-region-share';
      details.append(name,reference);row.append(swatch,details,ratio);list.append(row);
    }
    popup.querySelector('.spray-popin-hint').textContent=tr(regionEntries.length?'Part de chaque spray dans la zone · Échap pour fermer':'Cette zone est entièrement transparente.');
    addButton.textContent=tr('Ajouter la sélection à ma liste');addButton.hidden=!addSelection||!regionEntries.length;
    closeButton.hidden=false;closeButton.setAttribute('aria-label',tr('Fermer'));
    popup.hidden=false;canvas.setAttribute('aria-describedby',popup.id);position();closeButton.focus({preventScroll:true});
  }
  addButton.addEventListener('click',()=>{if(regionEntries.length)addSelection?.(regionEntries.map(entry=>entry.color));});
  canvas.addEventListener('pointerdown',event=>{
    if(event.button!==0||drag)return;
    const start=coordinates(event.clientX,event.clientY);if(!start)return;
    close();drag={id:event.pointerId,start,clientX:event.clientX,clientY:event.clientY,moved:false};
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove',event=>{
    if(drag&&event.pointerId===drag.id) {
      const end=coordinates(event.clientX,event.clientY,true);if(!end)return;
      drag.moved ||= Math.hypot(event.clientX-drag.clientX,event.clientY-drag.clientY)>=5;
      if(drag.moved){selection=regionBounds(drag.start,end,width,height);drawSelection();}
    } else if(!pinned&&event.pointerType!=='touch')show(hit(event.clientX,event.clientY));
  });
  canvas.addEventListener('pointerup',event=>{
    if(!drag||event.pointerId!==drag.id)return;
    const active=drag;drag=null;canvas.releasePointerCapture(event.pointerId);
    const end=coordinates(event.clientX,event.clientY,true);
    if(active.moved&&end)showRegion(active.start,end);else show(hit(event.clientX,event.clientY),true);
  });
  canvas.addEventListener('pointercancel',()=>{if(drag)close();});
  canvas.addEventListener('lostpointercapture',()=>{if(drag)close();});
  canvas.addEventListener('pointerleave',()=>{if(!pinned&&!drag)close();});
  canvas.addEventListener('click',event=>{if(event.detail===0)show(hit(event.clientX,event.clientY),true);});
  canvas.addEventListener('keydown',event=>{
    if(!pixels||!['Enter',' '].includes(event.key))return;
    event.preventDefault();
    const rect=imageRect();let sample=point||hit(rect.left+rect.width/2,rect.top+rect.height/2);
    if(!sample)for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]){
      const x=(i/4)%width,y=Math.floor(i/4/width);
      sample=hit(rect.left+(x+.5)/width*rect.width,rect.top+(y+.5)/height*rect.height);break;
    }
    show(sample,true);
  });
  closeButton.addEventListener('click',()=>close(true));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&(!popup.hidden||drag)){event.preventDefault();close(pinned);}});
  window.addEventListener('scroll',()=>{if(pinned||drag)position();else close();},{capture:true,passive:true});
  window.addEventListener('resize',()=>{if(pinned||drag)position();else close();});
  window.addEventListener('hashchange',()=>close());
  return {
    clear(){close();pixels=null;byRGB.clear();},
    update(data,entries,w,h){
      close();pixels=data;width=w;height=h;
      byRGB=new Map(entries.map(({color})=>[parseInt(color.hex.slice(1),16),color]));
    },
  };
}
