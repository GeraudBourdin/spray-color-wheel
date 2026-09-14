import {tr,localizeDOM} from './localization.js?v=20260914-gradient-1';

export function createGraffitiPreview() {
  const root=document.createElement('details');
  root.id='graffiti-preview';root.className='panel graffiti-preview';
  const label=source=>`<span data-l10n="${source}">${source}</span>`;
  const range=(id,title,min,max,value,unit='°',step=1)=>`<label class="graffiti-range" for="graffiti-${id}">${label(title)}<output for="graffiti-${id}">${value}${unit}</output><input id="graffiti-${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-setting="${id}" data-unit="${unit}"></label>`;
  root.innerHTML=`<summary>${label('Tester sur un graffiti en 3D')}</summary>
    <div class="graffiti-body"><div class="graffiti-type-controls">
      <label>${label('Votre blaze')}<input id="graffiti-text" type="text" value="GRAFFITI" maxlength="24" spellcheck="false" autocomplete="off"></label>
      <label>${label('Police du graffiti')}<select id="graffiti-font"><option value="knewave">Knewave</option><option value="sedgwickavedisplay">Sedgwick Ave Display</option><option value="lacquer">Lacquer</option></select></label>
    </div><div class="graffiti-layout"><div class="graffiti-stage"><div class="graffiti-view-tools" role="group" data-l10n-attrs='{"aria-label":"Manipuler la vue 3D"}'><button type="button" class="cart-action" id="graffiti-mode-text" aria-pressed="true">${label('Lettrage')}</button><button type="button" class="cart-action" id="graffiti-mode-light" aria-pressed="false">${label('Lumière')}</button></div><div class="graffiti-viewport"><canvas id="graffiti-canvas" role="img" tabindex="0" aria-describedby="graffiti-gesture-hint" data-l10n-attrs='{"aria-label":"Aperçu du lettrage en 3D"}' aria-label="Aperçu du lettrage en 3D"></canvas><svg class="graffiti-light-guide" aria-hidden="true"><line id="graffiti-light-ray" x1="50%" y1="50%" x2="50%" y2="50%"/></svg><button id="graffiti-light-handle" type="button" aria-describedby="graffiti-gesture-hint" data-l10n-attrs='{"aria-label":"Déplacer la source de lumière"}'><span aria-hidden="true">☀</span></button></div><p id="graffiti-gesture-hint" class="graffiti-gesture-hint"></p><p class="graffiti-status" role="status" id="graffiti-status"></p><button type="button" class="cart-action" id="graffiti-retry" hidden>${label('Réessayer')}</button></div>
    <div class="graffiti-controls"><fieldset><legend>${label('Couleurs de la palette')}</legend>
      <label>${label('Remplissage de la face')}<select id="graffiti-fill"><option value="solid" data-l10n="Couleur unie">Couleur unie</option><option value="gradient" data-l10n="Dégradé">Dégradé</option></select></label>
      <label class="graffiti-color">${label('Face avant')}<span class="graffiti-color-choice"><i id="graffiti-face-swatch" aria-hidden="true"></i><select id="graffiti-face"></select></span></label>
      <div id="graffiti-gradient-controls" hidden><label class="graffiti-color">${label('Fin du dégradé')}<span class="graffiti-color-choice"><i id="graffiti-gradient-end-swatch" aria-hidden="true"></i><select id="graffiti-gradient-end"></select></span></label>
      ${range('gradientAngle','Angle du dégradé',0,360,90)}<div id="graffiti-gradient-strip" aria-hidden="true"></div><p class="graffiti-gradient-note" data-l10n="Le dégradé traverse tout le mot. 0° : gauche vers droite ; 90° : haut vers bas.">Le dégradé traverse tout le mot. 0° : gauche vers droite ; 90° : haut vers bas.</p></div>
      <label class="graffiti-color">${label('Côtés de la 3D')}<span class="graffiti-color-choice"><i id="graffiti-side-swatch" aria-hidden="true"></i><select id="graffiti-side"></select></span></label>
    </fieldset><fieldset><legend>${label('Relief et orientation')}</legend>
      ${range('depth','Profondeur',0,100,30,' %')}${range('tilt','Inclinaison verticale',-60,60,8)}${range('turn','Rotation horizontale',-70,70,-20)}
    </fieldset><fieldset><legend>${label('Source de lumière')}</legend>
      ${range('lightAngle','Direction de la lumière',-180,180,-45)}${range('lightHeight','Hauteur de la lumière',-80,80,40)}${range('intensity','Intensité de la lumière',0,6,3,'',.1)}
    </fieldset></div></div><p class="graffiti-hint" data-l10n="Changez de police sans perdre votre texte ni vos réglages.">Changez de police sans perdre votre texte ni vos réglages.</p></div>`;
  document.querySelector('.palette-overview').after(root);
  const find=id=>root.querySelector(`#graffiti-${id}`);
  const canvas=find('canvas'),status=find('status'),retry=find('retry');
  let palette=[], scene=null, initialization=null, revision=0, timer, statusSource='';
  function showStatus(source) {statusSource=source;status.textContent=tr(source);status.hidden=!source;}
  function settings() {
    return {text:find('text').value,font:find('font').value,fill:find('fill').value,
      gradientEnd:palette[Number(find('gradient-end').value)]?.hex || '#58487e',
      face:palette[Number(find('face').value)]?.hex || '#dd763e',
      side:palette[Number(find('side').value)]?.hex || '#58487e',
      ...Object.fromEntries([...root.querySelectorAll('[data-setting]')].map(input=>[input.dataset.setting,Number(input.value)]))};
  }
  let mode='text', drag=null, frame=0;
  const handle=find('light-handle');
  function syncLight() {
    const {lightAngle,lightHeight}=settings();
    const az=lightAngle*Math.PI/180,el=lightHeight*Math.PI/180;
    // Project the direction onto a sphere around the text; dashed means behind it.
    const x=50+36*Math.sin(az)*Math.cos(el),y=50-36*Math.sin(el);
    handle.style.left=`${x}%`;handle.style.top=`${y}%`;
    handle.dataset.behind=String(Math.cos(az)<0);
    find('light-ray').setAttribute('x2',`${x}%`);find('light-ray').setAttribute('y2',`${y}%`);
    find('light-ray').dataset.behind=handle.dataset.behind;
    handle.setAttribute('aria-label',`${tr('Déplacer la source de lumière')} · ${lightAngle}° / ${lightHeight}°`);
  }
  function setMode(next) {
    mode=next;root.dataset.manipulation=mode;
    find('mode-text').setAttribute('aria-pressed',String(mode==='text'));
    find('mode-light').setAttribute('aria-pressed',String(mode==='light'));
    handle.setAttribute('aria-pressed',String(mode==='light'));
    find('gesture-hint').textContent=tr(mode==='text'
      ? 'Glissez sur le lettrage pour l’incliner et le tourner. Les flèches du clavier fonctionnent aussi.'
      : 'Glissez le soleil ou la vue pour orienter la lumière. Le soleil en pointillés est derrière le lettrage.');
  }
  function applyGesture(values) {
    for(const [id,value] of Object.entries(values)) {
      const input=find(id);
      input.value=String(Math.round(Math.max(Number(input.min),Math.min(Number(input.max),value))));
      input.previousElementSibling.textContent=input.value+input.dataset.unit;
    }
    syncLight();clearTimeout(timer);++revision;
    if(!frame)frame=requestAnimationFrame(()=>{frame=0;draw();});
  }
  function endDrag(restore=false) {
    if(!drag)return;
    const previous=drag;drag=null;root.classList.remove('is-dragging');
    if(restore)applyGesture(previous.initial);
    if(previous.target.hasPointerCapture(previous.id))previous.target.releasePointerCapture(previous.id);
  }
  function startDrag(event) {
    if(event.button!==0 || drag || !scene)return;
    event.preventDefault();
    if(event.currentTarget===handle)setMode('light');
    const target=event.currentTarget;target.focus({preventScroll:true});
    const keys=mode==='text'?['turn','tilt']:['lightAngle','lightHeight'];
    drag={id:event.pointerId,target,x:event.clientX,y:event.clientY,mode,
      width:canvas.clientWidth,height:canvas.clientHeight,
      initial:Object.fromEntries(keys.map(id=>[id,Number(find(id).value)]))};
    target.setPointerCapture(event.pointerId);root.classList.add('is-dragging');
  }
  function moveDrag(event) {
    if(!drag || event.pointerId!==drag.id)return;
    const dx=(event.clientX-drag.x)/drag.width,dy=(event.clientY-drag.y)/drag.height;
    if(drag.mode==='text')applyGesture({turn:drag.initial.turn+dx*180,tilt:drag.initial.tilt+dy*120});
    else if(drag.target===handle) {
      // Keep the grabbed light under the pointer on its projected orbit.
      const az=drag.initial.lightAngle*Math.PI/180,el=drag.initial.lightHeight*Math.PI/180;
      let x=Math.sin(az)*Math.cos(el)+dx/.36,y=Math.sin(el)-dy/.36;
      const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}
      y=Math.max(-Math.sin(80*Math.PI/180),Math.min(Math.sin(80*Math.PI/180),y));
      x=Math.max(-Math.sqrt(1-y*y),Math.min(Math.sqrt(1-y*y),x));
      const z=Math.sqrt(Math.max(0,1-x*x-y*y))*(Math.cos(az)<0?-1:1);
      applyGesture({lightAngle:Math.atan2(x,z)*180/Math.PI,lightHeight:Math.asin(y)*180/Math.PI});
    } else {
      const angle=drag.initial.lightAngle+dx*360;
      applyGesture({lightAngle:((angle+180)%360+360)%360-180,lightHeight:drag.initial.lightHeight-dy*160});
    }
  }
  for(const target of [canvas,handle]) {
    target.addEventListener('pointerdown',startDrag);
    target.addEventListener('pointermove',moveDrag);
    target.addEventListener('pointerup',event=>{if(event.pointerId===drag?.id)endDrag();});
    target.addEventListener('pointercancel',event=>{if(event.pointerId===drag?.id)endDrag(true);});
    target.addEventListener('lostpointercapture',()=>endDrag());
    target.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
      event.preventDefault();if(target===handle)setMode('light');
      const horizontal=['ArrowLeft','ArrowRight'].includes(event.key);
      const id=mode==='text'?(horizontal?'turn':'tilt'):(horizontal?'lightAngle':'lightHeight');
      const sign=event.key==='ArrowRight'||event.key===(mode==='text'?'ArrowDown':'ArrowUp')?1:-1;
      applyGesture({[id]:Number(find(id).value)+sign*(event.shiftKey?10:2)});
    });
  }
  handle.addEventListener('click',()=>setMode('light'));
  for(const name of ['text','light'])find(`mode-${name}`).addEventListener('click',()=>{endDrag();setMode(name);});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&drag){event.preventDefault();endDrag(true);}});
  window.addEventListener('hashchange',()=>endDrag(true));
  window.addEventListener('blur',()=>endDrag(true));
  setMode('text');syncLight();
  async function draw() {
    if (!root.open) return;
    const request=++revision;
    root.setAttribute('aria-busy','true');retry.hidden=true;
    showStatus('Chargement du lettrage…');
    try {
      if (!scene) {
        initialization ||= import('./graffiti-scene.js?v=20260914-gradient-1').then(({createGraffitiScene})=>createGraffitiScene(canvas)).catch(error=>{initialization=null;throw error;});
        scene=await initialization;
      }
      if (request!==revision) return;
      const updated=await scene.update(settings());
      if (request!==revision || !updated) return;
      showStatus(!find('text').value.trim() ? 'Écrivez votre blaze pour voir le résultat.' : canvas.dataset.supported==='false' ? 'Certains caractères sont remplacés par un point d’interrogation dans cette police.' : '');
    } catch (error) {
      if(request!==revision)return;
      showStatus('Impossible d’afficher la 3D. Vérifiez que WebGL est disponible, puis réessayez.');retry.hidden=false;
    } finally {if(request===revision)root.setAttribute('aria-busy','false');}
  }
  function updateSwatches() {
    const current=settings();
    find('face-swatch').style.background=current.face;find('side-swatch').style.background=current.side;
    find('gradient-end-swatch').style.background=current.gradientEnd;
    find('gradient-controls').hidden=current.fill!=='gradient';
    find('gradient-strip').style.background=`linear-gradient(${90+current.gradientAngle}deg, ${current.face}, ${current.gradientEnd})`;
  }
  root.addEventListener('toggle',()=>{if(root.open)draw();else{endDrag(true);++revision;root.setAttribute('aria-busy','false');}});
  root.addEventListener('input',event=>{
    if (!event.target.matches('input,select'))return;
    if(event.target.dataset.setting)event.target.previousElementSibling.textContent=event.target.value+event.target.dataset.unit;
    updateSwatches();syncLight();clearTimeout(timer);
    // Invalidate in-flight font loads immediately, including while the text debounce runs.
    ++revision;
    timer=setTimeout(draw,event.target===find('text') || event.target.dataset.setting==='depth'?100:0);
  });
  retry.addEventListener('click',draw);
  canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault();endDrag();++revision;scene?.dispose();scene=null;initialization=null;
    showStatus('Impossible d’afficher la 3D. Vérifiez que WebGL est disponible, puis réessayez.');retry.hidden=false;root.setAttribute('aria-busy','false');
  });
  document.addEventListener('languagechange',()=>{localizeDOM(root);showStatus(statusSource);setMode(mode);syncLight();});
  localizeDOM(root);
  return {updatePalette(colors) {
    const next=colors.filter(c=>/^#[\da-f]{6}$/i.test(c.hex));
    const changed=JSON.stringify(next)!==JSON.stringify(palette);
    if(!changed)return;
    const first=!palette.length;palette=next;
    for (const role of ['face','side','gradient-end']) {
      const select=find(role),old=Number(select.value);
      select.replaceChildren(...palette.map((color,index)=>new Option(`${color.letter} · ${color.hex}`,String(index))));
      select.value=String(first ? role!=='face'?Math.min(1,palette.length-1):0 : Math.min(old,palette.length-1));
    }
    root.hidden=!palette.length;updateSwatches();draw();
  }};
}
