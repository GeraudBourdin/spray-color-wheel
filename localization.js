import { MESSAGES } from './locales/messages.js?v=20260914-gradient-1';
export const LANGUAGES = ['fr','en','de','es','pt'];
export const normalizeMessage = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/œ/g,'oe').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
export function currentLanguage(){return typeof document!=='undefined'&&LANGUAGES.includes(document.documentElement.lang)?document.documentElement.lang:'fr';}
export function tr(source, params={}, language=currentLanguage()) {
  const value=MESSAGES[normalizeMessage(source)]?.[language] ?? source;
  // Retain intentional surrounding spaces in sentences assembled from separate messages.
  const prefix=String(source).match(/^\s*/)[0],suffix=String(source).match(/\s*$/)[0];
  return prefix+String(value).trim().replace(/\{(\w+)\}/g,(match,key)=>params[key]??match)+suffix;
}
const renderedText = new WeakMap();
export function localizeDOM(root=document) {
  const nodes=[...(root.matches?.('[data-l10n], [data-l10n-attrs]')?[root]:[]),...root.querySelectorAll('[data-l10n], [data-l10n-attrs]')];
  for(const node of nodes){
    if(node.dataset.l10n) {
      const previous=renderedText.get(node);
      if(previous!==undefined && node.textContent!==previous) { delete node.dataset.l10n; renderedText.delete(node); }
      else {node.textContent=tr(node.dataset.l10n);renderedText.set(node,node.textContent);}
    }
    if(node.dataset.l10nAttrs)for(const [attribute,source]of Object.entries(JSON.parse(node.dataset.l10nAttrs)))node.setAttribute(attribute,tr(source));
  }
}
export function localizedCount(count,singular,plural=singular+'s') {
  return `${new Intl.NumberFormat(currentLanguage()).format(count)} ${tr(count===1?singular:plural)}`;
}

// Mark static DOM constructed by the image tool once, before catalog/user data is inserted.
export function markLocalizedDOM(root) {
  const reverse = new Map(Object.values(MESSAGES).map(row=>[normalizeMessage(row[currentLanguage()]),row.fr]));
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),textNodes=[];
  while(walker.nextNode())textNodes.push(walker.currentNode);
  for(const text of textNodes){
    const source=reverse.get(normalizeMessage(text.textContent));if(!source)continue;
    if(text.parentNode.childNodes.length===1)text.parentNode.dataset.l10n=source;
    else {const span=document.createElement('span');span.dataset.l10n=source;span.textContent=text.textContent;text.replaceWith(span);}
  }
  for(const node of root.querySelectorAll('[aria-label], [title], [placeholder]')){
    const attrs={};for(const attr of ['aria-label','title','placeholder']){const source=reverse.get(normalizeMessage(node.getAttribute(attr)||''));if(source)attrs[attr]=source;}
    if(Object.keys(attrs).length)node.dataset.l10nAttrs=JSON.stringify(attrs);
  }
  localizeDOM(root);
}

// Only transient UI notices use reverse matching; user filenames and catalog names never do.
export function relocalizeNotice(text, language=currentLanguage()) {
  for(const row of Object.values(MESSAGES)) {
    for(const candidate of Object.values(row)) {
      const keys=[];
      const pattern=candidate.split(/(\{\w+\})/).map(part=>{
        if(/^\{\w+\}$/.test(part)){keys.push(part.slice(1,-1));return '(.+?)';}
        return part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      }).join('');
      const match=String(text).trim().match(new RegExp('^'+pattern+'$'));
      if(match)return tr(row.fr,Object.fromEntries(keys.map((k,i)=>[k,match[i+1]])),language);
    }
  }
  return text;
}

export function localizeFinish(value) {
  const source={matt:'Mat',gloss:'Brillant',transparent:'Transparent',fluorescent:'Fluorescent',metallic:'Métallisé',satin:'Satiné'}[value];
  return source?tr(source):value;
}
