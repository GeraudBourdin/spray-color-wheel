import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const popup=page.locator('#spray-preview-popin'),canvas=page.locator('#auto-preview');
async function upload(svg){await page.locator('#image-input').setInputFiles({name:'sample.svg',mimeType:'image/svg+xml',buffer:Buffer.from(svg)});await page.waitForSelector('#image-auto-results[aria-busy="false"]');await canvas.scrollIntoViewIfNeeded();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
try{
 await page.goto('http://localhost/index.html#image');
 await upload('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300"><path fill="#bf3124" d="M0 0h300v300H0z"/><path fill="#237bbb" d="M300 0h300v300H300z"/></svg>');
 let rect=await canvas.boundingBox(),x=rect.x+rect.width*.2,y=rect.y+rect.height*.5;
 await page.mouse.move(x,y);await popup.waitFor({state:'visible'});
 const expected=await canvas.evaluate(c=>{const d=c.getContext('2d').getImageData(Math.floor(c.width*.2),Math.floor(c.height*.5),1,1).data;return `rgb(${d[0]}, ${d[1]}, ${d[2]})`;});
 assert.equal(await popup.locator('.spray-popin-swatch').evaluate(n=>getComputedStyle(n).backgroundColor),expected);
 const code=await popup.locator('.spray-popin-code').innerText();assert.ok(code.length>12);
 await page.mouse.move(0,0);await popup.waitFor({state:'hidden'});
 await page.mouse.click(x,y);assert.equal(await popup.getAttribute('data-pinned'),'true');
 const pinned=await popup.innerText();await page.mouse.move(rect.x+rect.width*.8,y);assert.equal(await popup.innerText(),pinned);await page.mouse.move(0,0);assert.equal(await popup.isVisible(),true);
 await page.screenshot({path:'/tmp/spray-preview-popin.png'});
 await popup.locator('.spray-popin-close').click();await popup.waitFor({state:'hidden'});
 await canvas.focus();await page.keyboard.press('Enter');assert.equal(await popup.getAttribute('role'),'dialog');await page.keyboard.press('Escape');await popup.waitFor({state:'hidden'});
 await page.mouse.click(x,y);await page.locator('#auto-limit').evaluate(el=>{el.value=8;el.dispatchEvent(new Event('input',{bubbles:true}));});await popup.waitFor({state:'hidden'});
 await page.waitForSelector('#image-auto-results[aria-busy="false"]');
 // Portrait preview has horizontal letterboxing from max-height and object-fit: contain.
 await upload('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="900"><rect x="40" y="100" width="220" height="700" fill="#aa5423"/></svg>');
 rect=await canvas.boundingBox();await page.mouse.move(rect.x+5,rect.y+rect.height*.5);assert.equal(await popup.isVisible(),false,'letterbox has no spray');
 await page.mouse.move(rect.x+rect.width*.5,rect.y+rect.height*.03);assert.equal(await popup.isVisible(),false,'transparent pixels have no spray');
 await page.mouse.click(rect.x+rect.width*.5,rect.y+rect.height*.5);await popup.waitFor({state:'visible'});
 await page.setViewportSize({width:390,height:844});const box=await popup.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=390,'pinned popup fits mobile viewport');
 await page.goto('http://localhost/index.html#image');await upload('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="red"/></svg>');await canvas.tap({force:true}).catch(()=>canvas.click());await popup.waitFor({state:'visible'});
 await page.evaluate(()=>{location.hash='#create';});await popup.waitFor({state:'hidden'});
 assert.deepEqual(errors,[]);console.log('PASS: exact spray hit, hover, pin, close, Escape/keyboard, recalculation, portrait letterboxing/transparency, mobile bounds, navigation cleanup.');
}finally{await browser.close();}
