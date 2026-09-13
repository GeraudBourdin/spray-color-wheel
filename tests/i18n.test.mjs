import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const data=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const catalog=await readFile(new URL('../locales/messages.js',import.meta.url),'utf8');
const {MESSAGES}=await import(data(catalog));
const localization=(await readFile(new URL('../localization.js',import.meta.url),'utf8')).replace(/'\.\/locales\/messages.js[^']*'/,JSON.stringify(data(catalog)));
const {tr,normalizeMessage,relocalizeNotice,localizeFinish}=await import(data(localization));
const langs=['fr','en','de','es','pt'];
test('every supplementary message includes five nonempty translations and preserves required placeholders',()=>{
 for(const [source,row]of Object.entries(MESSAGES)){
  const placeholders=s=>[...s.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort();
  for(const lang of langs){assert.ok(row[lang]?.trim(),source+' '+lang);for(const p of placeholders(row[lang]))assert.ok(placeholders(row.fr).includes(p),source+' unexpected placeholder '+p);}
 }
});
test('source aliases, interpolation, spaces and notices translate without touching product references',()=>{
 assert.equal(tr('Tres sombre',{},'de'),'Sehr dunkel');
 assert.equal(tr('{0} références pour votre image',{0:12},'es'),'12 referencias para tu imagen');
 assert.equal(tr('Impossible de reprendre la session. ',{},'en'),'Cannot resume the session. ');
 assert.equal(relocalizeNotice('PNG exported · 800 × 600 px, without handles or controls.','pt'),'PNG exportado · 800 × 600 px, sem alças nem controlos.');
 assert.equal(localizeFinish('matt'),'Mat');assert.equal(localizeFinish('gloss'),'Brillant');
 assert.equal(tr('LP-100 WHITE',{},'de'),'LP-100 WHITE');assert.equal(normalizeMessage('Très\n sombre'),'Tres sombre');
});
test('legacy UI and theory dictionaries are complete in all five languages',async()=>{
 const src=await readFile(new URL('../i18n.js',import.meta.url),'utf8');
 const {UI_STRINGS,THEORY_LOCALIZATIONS}=await import(data(src+'\nexport {UI_STRINGS,THEORY_LOCALIZATIONS};'));
 function verify(fr,others,path=''){for(const [key,value]of Object.entries(fr)){for(const [lang,other]of Object.entries(others)){assert.ok(other?.[key]!=null,lang+' '+path+key);}if(value&&typeof value==='object')verify(value,Object.fromEntries(Object.entries(others).map(([lang,o])=>[lang,o[key]])),path+key+'.');}}
 verify(UI_STRINGS.fr,Object.fromEntries(langs.slice(1).map(l=>[l,UI_STRINGS[l]])));
 for(const [key,row]of Object.entries(THEORY_LOCALIZATIONS))for(const [field,value]of Object.entries(row)){const fields=field==='tooltip'?Object.values(value):[value];for(const v of fields)for(const lang of langs)assert.equal(typeof v[lang],'string',key+' '+field+' '+lang);}
});
