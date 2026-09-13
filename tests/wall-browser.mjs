// Run with PLAYWRIGHT_MODULE pointing to playwright/index.mjs if not installed locally.
import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader']});
const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
const base=process.env.WALL_TEST_URL||'http://localhost:4173';
const artifacts=process.env.WALL_TEST_ARTIFACTS||'/tmp/wall-tests';await mkdir(artifacts,{recursive:true});
const svg=(body,w=800,h=600)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`);
async function upload(kind,buffer,name){await page.locator(`[data-import="${kind}"]`).first().click();await page.locator('#file-input').setInputFiles({name,mimeType:'image/svg+xml',buffer});await page.waitForFunction(name=>document.getElementById('wall-name').textContent===name||document.getElementById('sketch-name').textContent===name,name);await page.waitForFunction(()=>!document.getElementById('save-project').disabled);}
async function exportPNG(){const downloaded=page.waitForEvent('download');await page.locator('#export').click();const download=await downloaded;return readFile(await download.path());}
async function pixel(png,x,y){return page.evaluate(async({data,x,y})=>{const im=new Image();im.src='data:image/png;base64,'+data;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);return{width:c.width,height:c.height,pixel:[...ctx.getImageData(x,y,1,1).data]};},{data:png.toString('base64'),x,y});}
const slider=async(id,value)=>{await page.locator('#'+id).evaluate((input,value)=>{input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));},value);};
try {
 await page.goto(base+'/wall.html');await page.screenshot({path:artifacts+'/desktop-empty.png',fullPage:true});
 assert.equal(await page.locator('[data-nav="wall"][aria-current="page"]').count(),1);
 await upload('wall',svg('<rect width="800" height="600" fill="#c8c8c8"/>'),'wall.svg');
 await upload('sketch',svg('<path fill="#ff0000" d="M0 0h200v150H0z"/><path fill="#00ff00" d="M200 0h200v150H200z"/><path fill="#0000ff" d="M0 150h200v150H0z"/><path fill="#ffff00" d="M200 150h200v150H200z"/>',400,300),'sketch.svg');
 let png=await exportPNG(),sample=await pixel(png,200,150);assert.equal(sample.width,800);assert.equal(sample.height,600);assert.ok(sample.pixel[0]>220&&sample.pixel[1]>80&&sample.pixel[1]<100,JSON.stringify(sample));
 assert.ok((await pixel(png,600,150)).pixel[1]>220,'top right green');assert.ok((await pixel(png,200,450)).pixel[2]>220,'bottom left blue');
 await page.locator('#tab-settings').click();await slider('opacity',100);await page.locator('#blend').selectOption('multiply');
 png=await exportPNG();sample=await pixel(png,200,150);assert.ok(Math.abs(sample.pixel[0]-200)<=2&&sample.pixel[1]<3,'multiply pixel '+JSON.stringify(sample));
 await page.locator('#blend').selectOption('screen');png=await exportPNG();sample=await pixel(png,200,150);assert.ok(sample.pixel[0]>250&&Math.abs(sample.pixel[1]-200)<=2,'screen pixel');
 await page.locator('#reset-settings').click();
 await page.locator('#tab-placement').click();await page.locator('#perspective').check();await page.locator('#fit-view').click();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const beforeWarp=await exportPNG();
 const box=await page.locator('#wall-canvas').boundingBox();const fit=Math.min((box.width-36)/800,(box.height-36)/600),left=(box.width-800*fit)/2,top=(box.height-600*fit)/2;
 await page.mouse.move(box.x+left+112*fit,box.y+top+84*fit);await page.mouse.down();await page.mouse.move(box.x+left+160*fit,box.y+top+120*fit,{steps:10});await page.mouse.up();
 const warped=await exportPNG();assert.notDeepEqual(warped,beforeWarp);assert.deepEqual((await pixel(warped,120,90)).pixel,[200,200,200,255],'moved top left corner reveals wall');assert.deepEqual((await pixel(warped,670,500)).pixel,(await pixel(beforeWarp,670,500)).pixel,'other corners remain fixed');await page.locator('#undo').click();const undoPng=await exportPNG();await page.locator('#redo').click();assert.deepEqual(await exportPNG(),warped,'redo restores exact projective render');
 await page.locator('#mode-explore').click();const locked=await exportPNG();await page.locator('#zoom-in').click();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+70,box.y+box.height/2+25,{steps:5});await page.mouse.up();await page.mouse.wheel(0,-90);
 assert.deepEqual(await exportPNG(),locked,'pan and zoom leave export alignment unchanged');
 await page.locator('#peek').scrollIntoViewIfNeeded();const peekBox=await page.locator('#peek').boundingBox();await page.mouse.move(peekBox.x+peekBox.width/2,peekBox.y+peekBox.height/2);await page.mouse.down();assert.equal(await page.locator('#peek').getAttribute('aria-pressed'),'true');await page.mouse.up();assert.equal(await page.locator('#peek').getAttribute('aria-pressed'),'false');
 await page.locator('#save-project').click();await page.waitForFunction(()=>document.getElementById('save-state').textContent.startsWith('Session enregistrée'));
 await page.reload();await page.locator('#load-project').click();await page.waitForFunction(()=>!document.getElementById('export').disabled);assert.deepEqual(await exportPNG(),locked,'IndexedDB restores images, perspective and filters');
 await page.locator('#fit-view').click();await page.locator('#wall-canvas').focus();await page.screenshot({path:artifacts+'/desktop-loaded.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.locator('#fit-view').click();await page.screenshot({path:artifacts+'/mobile-loaded.png',fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'no horizontal overflow');
 // Real touch events exercise pinch and the transition back to one finger.
 const cdp=await context.newCDPSession(page);const mobileBox=await page.locator('#wall-canvas').boundingBox();await page.locator('#wall-canvas').scrollIntoViewIfNeeded();const b=await page.locator('#wall-canvas').boundingBox();const x=b.x+b.width/2,y=b.y+b.height/2;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-30,y,id:1},{x:x+30,y,id:2}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-65,y:y-10,id:1},{x:x+65,y:y+10,id:2}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 assert.deepEqual(await exportPNG(),locked,'touch pinch preserves locked alignment');

 // Invalid imports must preserve the current session.
 await page.locator('#tab-images').click();await page.locator('[data-import="wall"]').first().click();
 await page.locator('#file-input').setInputFiles({name:'broken.png',mimeType:'image/png',buffer:Buffer.from('invalid image')});
 await page.waitForFunction(()=>document.getElementById('wall-status').textContent.includes('Ce format'));
 assert.deepEqual(await exportPNG(),locked,'invalid image keeps existing work');
 assert.equal(await page.locator('#camera-input').getAttribute('capture'),'environment');
 // Exercise the 2D fallback independently, using the saved project.
 const fallback=await context.newPage();fallback.on('pageerror',e=>errors.push(e.message));
 await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl'?null:original.call(this,type,...args);};});
 await fallback.goto(base+'/wall.html');await fallback.locator('#load-project').click();await fallback.waitForFunction(()=>!document.getElementById('export').disabled);
 const downloadFallback=fallback.waitForEvent('download');await fallback.locator('#export').click();const fallbackPNG=await readFile(await (await downloadFallback).path());
 const fallbackPixel=(await pixel(fallbackPNG,200,150)).pixel,exactPixel=(await pixel(locked,200,150)).pixel;
 fallbackPixel.forEach((channel,i)=>assert.ok(Math.abs(channel-exactPixel[i])<4,'fallback color agrees with WebGL: '+JSON.stringify({fallbackPixel,exactPixel})));
 await fallback.close();
 await page.goto(base+'/index.html');assert.equal(await page.locator('[data-nav="wall"]').count(),1);
 assert.deepEqual(errors,[],'no browser errors');
 console.log('PASS: imports, pixel orientation, opacity, fusion, perspective, undo/redo, locked mouse/touch navigation, PNG export, local restore, mobile layout, shared navigation.');
}finally{await browser.close();}
