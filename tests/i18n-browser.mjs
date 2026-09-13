// PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node tests/i18n-browser.mjs
import assert from 'node:assert/strict';
import {readFile, mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
const page=await context.newPage(),errors=[],leaks=[];page.on('pageerror',e=>errors.push(e.message));
const base=process.env.I18N_TEST_URL||'http://localhost';
const langs=['en','de','es','pt','fr'];
const artifacts='/tmp/i18n-tests';await mkdir(artifacts,{recursive:true});
const svg=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><path fill="#d32920" d="M0 0h200v300H0z"/><path fill="#233eba" d="M200 0h200v300H200z"/></svg>');
async function language(lang){await page.locator('.utility-menu summary').click();await page.locator(`[data-language="${lang}"]`).click();await page.waitForFunction(lang=>document.documentElement.lang===lang,lang);}
async function audit(label){
 const result=await page.evaluate(async()=>{
  const {MESSAGES}=await import('./locales/messages.js?v=20260913-i18n-1');
  const {normalizeMessage}=await import('./localization.js?v=20260913-i18n-1');
  const lang=document.documentElement.lang,found=[];
  const check=(s,where)=>{s=normalizeMessage(s);const row=MESSAGES[s];if(row&&normalizeMessage(row[lang])!==s&&normalizeMessage(row.fr)===s)found.push({s,where,expected:row[lang]});};
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){const n=walker.currentNode;if(n.parentElement.getClientRects().length&&!n.parentElement.closest('.language-options,script,style'))check(n.textContent,n.parentElement.id||n.parentElement.className);}
  for(const n of document.querySelectorAll('[aria-label],[title],[placeholder]'))if(n.getClientRects().length&&!n.closest('.language-options'))for(const attr of ['aria-label','title','placeholder'])if(n.hasAttribute(attr))check(n.getAttribute(attr),attr+' '+n.id);
  return found;
 });if(result.length)leaks.push({label,result});
}
try{
 for(const route of ['index.html#create','index.html#image','index.html#list','manufacturer-catalog.html','manufacturer-tones.html','wall.html']){
  await page.goto(base+'/'+route);await page.waitForTimeout(350);
  if(route==='index.html#image'){
   await page.locator('#image-input').setInputFiles({name:'original.svg',mimeType:'image/svg+xml',buffer:svg});await page.waitForSelector('#image-auto-results:not([hidden])[aria-busy="false"]');await page.locator('#auto-add').click();
  }
  if(route==='manufacturer-catalog.html'){
   await page.locator('#catalog-title').filter({hasText:'Loop'}).waitFor();
   await page.locator('[data-ws="bulkSearch"]').click();
   await page.locator('#catalog-search-input').fill('LP-100\nLP-101\nnot-a-real-reference');await page.locator('#catalog-search-run').click();await page.waitForSelector('[data-search-line]');
   await page.locator('[data-view-mode="detailed"]').click();
  }
  for(const lang of langs){
   await language(lang);if(route==='index.html#image')await page.waitForSelector('#image-auto-results:not([hidden])[aria-busy="false"]');
   await audit(route+' '+lang);
   if(route==='wall.html'){
    for(const tab of ['tab-placement','tab-settings','tab-images']){await page.locator('#'+tab).click();await audit(route+' '+tab+' '+lang);}
   }
   if(lang==='de')await page.screenshot({path:artifacts+'/'+route.replace(/[.#]/g,'-')+'.png',fullPage:true});
  }
  await page.setViewportSize({width:390,height:844});await language('de');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,route+' mobile overflow');
  await page.setViewportSize({width:1440,height:1000});
 }
 // Translation changes must preserve a loaded wall project and localize later notices.
 await page.goto(base+'/wall.html');await language('es');
 await page.locator('#file-input').setInputFiles({name:'wall.svg',mimeType:'image/svg+xml',buffer:svg});await page.waitForFunction(()=>!document.getElementById('export').disabled);
 await page.locator('#save-project').click();await page.waitForFunction(()=>document.getElementById('wall-status').textContent.includes('Sesión guardada'));
 await language('de');assert.match(await page.locator('#wall-status').innerText(),/Sitzung/);assert.equal(await page.locator('#wall-name').innerText(),'wall.svg');await audit('wall loaded de');
 // Printable list carries both the selected language and translated column headings.
 await page.goto(base+'/index.html#list');await language('pt');
 const downloaded=page.waitForEvent('download');await page.locator('#cart-download').click();const html=await readFile(await (await downloaded).path(),'utf8');assert.match(html,/<html lang="pt">/);assert.ok(!html.includes('Prix unitaire'));
 // Image worker failures are translated when they reach the UI.
 await page.goto(base+'/index.html#image');await language('de');
 await page.locator('#image-input').setInputFiles({name:'transparent.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>')});
 await page.waitForFunction(()=>document.getElementById('auto-status').textContent.includes('vollständig transparent'));
 assert.deepEqual(errors,[],'browser errors');assert.deepEqual(leaks,[],'untranslated UI text');
 console.log('PASS: all six views in five languages; search, image palette and errors, wall tabs/session notices, print export, mobile, no JS errors.');
} finally {if(leaks.length)console.log(JSON.stringify(leaks,null,2));await browser.close();}
