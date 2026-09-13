import { createPreviewInspector } from "./preview-inspector.js?v=20260913-region-1";
import { tr, localizeDOM, markLocalizedDOM, currentLanguage } from "./localization.js?v=20260913-i18n-1";
export function createImageTool({state,toggleBrand,addSelection,escapeHtml}) {
  const root=document.querySelector('#image-auto-tool');
  const limitControl = (id, label) => `<div class="auto-limit-control"><label for="${id}"><span>${tr(label)}</span><output id="${id}-value" for="${id}">12</output></label><input id="${id}" type="range" min="1" max="100" step="1" value="12"><div class="auto-limit-bounds" aria-hidden="true"><span>1</span><span>100</span></div></div>`;
  root.innerHTML=`<div class="auto-heading"><div><p class="eyebrow">${tr("IMAGE → SPRAYS")}</p><h1>${tr("Votre image, votre palette de sprays")}</h1><p>${tr("Importez une image, choisissez vos gammes et obtenez les références à acheter.")}</p></div><span class="auto-local">${tr("Analyse locale · aucune image envoyée")}</span></div>
  <div class="auto-controls"><fieldset><legend>${tr("1. Gammes autorisées")}</legend><p>${tr("Vous pouvez mélanger plusieurs marques.")}</p><div id="auto-brands"></div></fieldset><div class="auto-options">${limitControl('auto-limit', '2. Nombre maximum de sprays')}<label class="auto-accent"><input type="checkbox" id="auto-accents" checked> ${tr("Préserver les petites touches de couleur")}</label><p>${tr("Les nuances proches sont regroupées. Le résultat peut utiliser moins de références.")}</p></div></div>
  <p id="auto-status" role="status" aria-live="polite">${tr("Importez une image ci-dessous pour lancer l’analyse.")}</p>`;
  const results=document.querySelector('#image-auto-results');
  results.innerHTML=`<div class="auto-heading"><div><p class="eyebrow">${tr("PALETTE D’ACHAT")}</p><h2 id="auto-title"></h2></div><button type="button" class="image-save" id="auto-add">${tr("Ajouter la sélection à ma liste")}</button></div>${limitControl('auto-palette-limit', 'Nombre maximum de sprays')}<p id="auto-palette-status" class="auto-palette-status"></p><div class="auto-result-grid"><figure><canvas id="auto-original" aria-label="${tr("Image originale")}"></canvas><figcaption>${tr("Image originale")}</figcaption></figure><figure><canvas id="auto-preview" aria-label="${tr("Image reproduite avec les couleurs des sprays sélectionnés")}"></canvas><figcaption>${tr("Aperçu avec les sprays sélectionnés. Les couleurs réelles dépendent du nuancier et du support.")}<br>${tr("Cliquez sur un pixel ou glissez pour sélectionner une zone et voir ses sprays.")}</figcaption></figure><div class="auto-references"><p>${tr("La part de l’image aide à repérer les couleurs dominantes. Elle ne détermine pas le nombre de bombes nécessaire.")}</p><div id="auto-swatches"></div></div></div><p>${tr("Ajout d’une unité par référence absente de votre liste. Ajustez ensuite les quantités selon votre mur et vos couches.")}</p>`;
  markLocalizedDOM(root); markLocalizedDOM(results);
  const inspector=createPreviewInspector(results.querySelector("#auto-preview"), {addSelection});
  const status=root.querySelector('#auto-status'),brands=root.querySelector('#auto-brands'),limit=root.querySelector('#auto-limit'),accents=root.querySelector('#auto-accents');
  const paletteLimit=results.querySelector('#auto-palette-limit');
  const addButton=results.querySelector('#auto-add');
  let asset=null,key='',brandKey='',worker=null,entries=[],analysisTimer=0,generation=0;
  function setStatus(message) {
    status.textContent=message;
    results.querySelector('#auto-palette-status').textContent=message;
  }
  function setBusy(busy) {
    results.setAttribute('aria-busy', String(busy));
    results.classList.toggle('is-analyzing', busy);
    addButton.disabled=busy || !entries.length;
  }
  function updateLimit(event) {
    const value=event.target.value;
    for(const input of [limit,paletteLimit]) {
      input.value=value;
      document.getElementById(input.id+'-value').value=value;
    }
    refresh();
  }
  function refresh(){
    const nextBrands=state.manufacturers.map(b=>`${b.id}:${state.selectedBrands.has(b.id)}`).join('|');
    if(nextBrands!==brandKey){brandKey=nextBrands;brands.innerHTML=state.manufacturers.map(b=>`<label><input type="checkbox" data-auto-brand="${escapeHtml(b.id)}" ${state.selectedBrands.has(b.id)?'checked':''} ${state.selectedBrands.size===1&&state.selectedBrands.has(b.id)?'disabled':''}>${escapeHtml(b.label)}</label>`).join('');}
    localizeDOM(root); localizeDOM(results);
    const nextKey=nextBrands+'|'+limit.value+'|'+accents.checked+'|'+currentLanguage();
    if(asset===state.imageAsset&&key===nextKey)return;
    const imageChanged=asset!==state.imageAsset;
    asset=state.imageAsset;key=nextKey;worker?.terminate();worker=null;clearTimeout(analysisTimer);
    const request=++generation;
    inspector.clear();
    entries=[];
    if(imageChanged || !asset) results.hidden=true;
    setBusy(Boolean(asset));
    if(!asset){setStatus(tr("Importez une image ci-dessous pour lancer l’analyse."));return;}
    setStatus(tr("Analyse des couleurs et recherche des sprays…"));
    analysisTimer=setTimeout(() => {
    const canvas=document.createElement('canvas'),scale=Math.min(1,480/Math.max(asset.sampleWidth,asset.sampleHeight));
    canvas.width=Math.max(1,Math.round(asset.sampleWidth*scale));canvas.height=Math.max(1,Math.round(asset.sampleHeight*scale));
    const ctx=canvas.getContext('2d');ctx.drawImage(asset.sampleCanvas,0,0,canvas.width,canvas.height);
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    try {
      worker=new Worker(new URL('./image-analysis-worker.js?v=20260913-limit-100',import.meta.url),{type:'module'});
      worker.onmessage=({data})=>{
        if(request!==generation)return;
        worker?.terminate();worker=null;
        if(data.errorMessage){setStatus(tr(data.errorMessage));setBusy(false);return;}
        entries=data.entries;const original=results.querySelector('#auto-original');original.width=canvas.width;original.height=canvas.height;original.getContext('2d').drawImage(canvas,0,0);const preview=results.querySelector('#auto-preview');preview.width=canvas.width;preview.height=canvas.height;preview.getContext('2d').putImageData(new ImageData(data.preview,canvas.width,canvas.height),0,0);
        results.querySelector('#auto-title').textContent=tr("{0} références pour votre image", {0: entries.length});
        results.querySelector('#auto-swatches').innerHTML=entries.map(({color,share,error})=>`<div class="auto-swatch"><span style="background:${color.hex}" aria-label="${color.hex}"></span><div><strong>${escapeHtml(color.name||color.label)}</strong><small>${escapeHtml(color.brandLabel)} · ${escapeHtml(color.code)}</small>${error>20?`<small class="auto-warning">${tr("Correspondance approximative")}</small>`:''}</div><b>${(share*100).toLocaleString(currentLanguage(),{maximumFractionDigits:1})} %</b></div>`).join('');
        inspector.update(data.preview,entries,canvas.width,canvas.height);
        results.hidden=false;setBusy(false);setStatus(tr("Palette prête : {0} sprays sélectionnés.{1}", {0: entries.length, 1: data.error>20?tr(" Des couleurs sont éloignées des gammes disponibles. Essayez d’autres gammes ou davantage de sprays."):''}));
      };
      worker.onerror=()=>{if(request!==generation)return;worker?.terminate();worker=null;setStatus(tr("L’analyse a échoué. Modifiez un réglage ou importez à nouveau votre image pour réessayer."));setBusy(false);};
      worker.postMessage({pixels,limit:Number(limit.value),accents:accents.checked,colors:state.allColors.filter(c=>state.selectedBrands.has(c.brandId)).map(({id,hex,lab,name,label,brandLabel,code})=>({id,hex,lab,name,label,brandLabel,code}))},[pixels.buffer]);
    }catch{setStatus(tr("L’analyse n’est pas disponible dans ce navigateur."));setBusy(false);}
    }, 140);
  }
  brands.addEventListener('change',e=>{if(e.target.dataset.autoBrand)toggleBrand(e.target.dataset.autoBrand);});
  for(const input of [limit,paletteLimit]) input.addEventListener('input',updateLimit);
  accents.addEventListener('change',refresh);
  results.querySelector('#auto-add').addEventListener('click',()=>addSelection(entries.map(e=>e.color)));
  return {refresh};
}
