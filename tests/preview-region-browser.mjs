import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});const context=await browser.newContext({viewport:{width:1280,height:950},hasTouch:true});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
const canvas=page.locator('#auto-preview'),popup=page.locator('#spray-preview-popin'),outline=page.locator('.spray-region-outline');
async function drag(x1,y1,x2,y2){await canvas.scrollIntoViewIfNeeded();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const b=await canvas.boundingBox();await page.mouse.move(b.x+b.width*x1,b.y+b.height*y1);await page.mouse.down();await page.mouse.move(b.x+b.width*x2,b.y+b.height*y2,{steps:12});await page.mouse.up();await popup.waitFor({state:'visible'});}
try{
 await page.goto('http://localhost/index.html#image');await page.locator('#image-input').setInputFiles({name:'zones.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300"><rect width="200" height="300" fill="#bf3124"/><rect x="200" width="200" height="300" fill="#237bbb"/></svg>')});await page.waitForSelector('#image-auto-results[aria-busy="false"]');
 await drag(.1,.2,.6,.8);assert.equal(await popup.locator('.spray-region-row').count(),2);assert.equal(await outline.isVisible(),true);
 const ids=await popup.locator('.spray-region-row').evaluateAll(rows=>rows.map(r=>r.dataset.colorId).sort());await popup.locator(':scope > button').click();const cart=await page.evaluate(()=>JSON.parse(localStorage.getItem('spray-color-wheel.cart')));assert.deepEqual(cart.map(i=>i.colorId).sort(),ids);
 await page.screenshot({path:'/tmp/spray-area-selection.png'});
 await popup.locator('.spray-popin-close').click();assert.equal(await outline.isVisible(),false);
 await drag(.6,.8,.1,.2);assert.deepEqual(await popup.locator('.spray-region-row').evaluateAll(rows=>rows.map(r=>r.dataset.colorId).sort()),ids);await page.keyboard.press('Escape');
 await drag(.05,.2,.25,.8);assert.equal(await popup.locator('.spray-region-row').count(),1);await popup.locator('.spray-popin-close').click();
 await drag(.75,.2,.95,.8);assert.equal(await popup.locator('.spray-region-row').count(),0);assert.match(await popup.innerText(),/transparente/);await popup.locator('.spray-popin-close').click();
 await page.setViewportSize({width:390,height:844});await canvas.scrollIntoViewIfNeeded();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const b=await canvas.boundingBox(),cdp=await context.newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width*.1,y:b.y+b.height*.2,id:1}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:b.x+b.width*.6,y:b.y+b.height*.8,id:1}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await popup.waitFor({state:'visible'});assert.equal(await popup.locator('.spray-region-row').count(),2);
 await page.locator('#auto-limit').evaluate(el=>{el.value=1;el.dispatchEvent(new Event('input',{bubbles:true}));});assert.equal(await popup.isVisible(),false);assert.equal(await outline.isVisible(),false);
 assert.deepEqual(errors,[]);console.log('PASS: multi/single spray regions, reverse drag, deduplicated cart, transparent region, touch selection, close and reanalysis cleanup.');
}finally{await browser.close();}
