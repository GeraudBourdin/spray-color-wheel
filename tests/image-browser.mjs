import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://localhost/index.html#image');
 await page.waitForSelector('[data-auto-brand]');
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><path fill="#d23721" d="M0 0h300v400H0z"/><path fill="#275aaf" d="M300 0h300v400H300z"/><circle fill="#ffec00" cx="300" cy="200" r="25"/></svg>';
 await page.locator('#image-input').setInputFiles({name:'test.svg',mimeType:'image/svg+xml',buffer:Buffer.from(svg)});
 await page.waitForSelector('#image-auto-results:not([hidden])[aria-busy="false"]');
 let n=await page.locator('.auto-swatch').count();assert.ok(n>=3&&n<=12);
 for(const id of ['auto-limit','auto-palette-limit']) {
  assert.equal(await page.locator('#'+id).getAttribute('min'),'1');
  assert.equal(await page.locator('#'+id).getAttribute('max'),'100');
 }
 await page.locator('#auto-palette-limit').focus();await page.keyboard.press('Home');
 assert.equal(await page.locator('#auto-limit').inputValue(),'1');
 assert.equal(await page.locator('#auto-limit-value').innerText(),'1');
 assert.equal(await page.locator('#auto-palette-limit').isVisible(),true,'lower slider stays mounted during analysis');
 await page.waitForSelector('#image-auto-results[aria-busy="false"]');
 assert.equal(await page.locator('.auto-swatch').count(),1);
 await page.locator('#auto-limit').focus();await page.keyboard.press('End');
 assert.equal(await page.locator('#auto-palette-limit').inputValue(),'100');
 assert.equal(await page.locator('#auto-palette-limit-value').innerText(),'100');
 await page.waitForSelector('#image-auto-results[aria-busy="false"]');
 await page.locator('#auto-limit').evaluate(el=>{el.value=4;el.dispatchEvent(new Event('input',{bubbles:true}));});await page.waitForSelector('#image-auto-results:not([hidden])[aria-busy="false"]');assert.ok(await page.locator('.auto-swatch').count()<=4);
 const boxes=page.locator('[data-auto-brand]');
 for(let i=1;i<await boxes.count();i++)await boxes.nth(i).uncheck();
 await page.waitForSelector('#image-auto-results:not([hidden])[aria-busy="false"]');
 assert.ok((await page.locator('#auto-swatches').innerText()).includes('Loop'));
 assert.ok((await page.locator('.auto-swatch small:first-of-type').allTextContents()).every(t=>t.startsWith('Loop')));
 await page.locator('#auto-add').click();
 const cart=await page.evaluate(()=>JSON.parse(localStorage.getItem('spray-color-wheel.cart')));assert.equal(cart.length,await page.locator('.auto-swatch').count());
 await page.locator('#auto-add').click();assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('spray-color-wheel.cart'))),cart);
 await page.screenshot({path:'/tmp/image-auto-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:'/tmp/image-auto-mobile.png',fullPage:true});
 await page.locator('#image-clear').click();assert.equal(await page.locator('#image-auto-results').isVisible(),false);
 assert.deepEqual(errors,[]);console.log('PASS: automatic import, budget, brand restriction, cart deduplication, mobile layout, clear, no browser errors');
}finally{await browser.close();}
