import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const value=id=>page.locator(`#graffiti-${id}`).inputValue().then(Number);
const ready=()=>page.waitForFunction(()=>document.querySelector('#graffiti-canvas').dataset.font && document.querySelector('#graffiti-preview').getAttribute('aria-busy')==='false');
try {
  await page.goto(process.env.GRAFFITI_TEST_URL||'http://localhost/index.html#create');
  await page.locator('#graffiti-preview summary').click();await ready();
  const canvas=page.locator('#graffiti-canvas'),sun=page.locator('#graffiti-light-handle');
  await canvas.scrollIntoViewIfNeeded();let box=await canvas.boundingBox();
  const before={turn:await value('turn'),tilt:await value('tilt'),light:await value('lightAngle')};
  await page.mouse.move(box.x+box.width*.6,box.y+box.height*.6);await page.mouse.down();
  await page.mouse.move(box.x+box.width*.72,box.y+box.height*.72,{steps:8});await page.mouse.up();await ready();
  assert.ok(await value('turn')>before.turn);assert.ok(await value('tilt')>before.tilt);assert.equal(await value('lightAngle'),before.light);
  const turn=await value('turn');
  let handle=await sun.boundingBox();
  await page.mouse.move(handle.x+22,handle.y+22);await page.mouse.down();await page.mouse.move(handle.x+80,handle.y+55,{steps:8});await page.mouse.up();await ready();
  assert.notEqual(await value('lightAngle'),before.light);assert.equal(await value('turn'),turn);
  assert.equal(await page.locator('#graffiti-mode-light').getAttribute('aria-pressed'),'true');
  const light=await value('lightAngle');
  await sun.focus();await page.keyboard.press('ArrowRight');await ready();assert.equal(await value('lightAngle'),light+2);
  // Existing sliders move the on-canvas light marker too.
  const position=await sun.getAttribute('style');
  await page.locator('#graffiti-lightHeight').evaluate(el=>{el.value=65;el.dispatchEvent(new Event('input',{bubbles:true}));});await ready();
  assert.notEqual(await sun.getAttribute('style'),position);
  await page.locator('#graffiti-mode-text').click();
  await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.8,box.y+box.height*.8,{steps:5});
  await page.keyboard.press('Escape');await page.mouse.up();await ready();assert.equal(await value('turn'),turn,'Escape restores gesture start');
  // Pointer capture keeps dragging when the pointer leaves the canvas.
  await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width+50,box.y+box.height+50,{steps:5});await page.mouse.up();await ready();
  assert.equal(await value('turn'),70);assert.equal(await value('tilt'),60);assert.equal(await page.locator('.is-dragging').count(),0);
  await page.locator('#graffiti-turn').evaluate(el=>{el.value=-20;el.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.locator('#graffiti-tilt').evaluate(el=>{el.value=8;el.dispatchEvent(new Event('input',{bubbles:true}));});
  await ready();await page.locator('#graffiti-preview').screenshot({path:'/tmp/graffiti-interaction-desktop.png'});
  await page.setViewportSize({width:390,height:844});await canvas.scrollIntoViewIfNeeded();box=await canvas.boundingBox();
  // Actual browser touch events, including cancellation, use the same capture path.
  const client=await page.context().newCDPSession(page);
  const touch=(type,x,y)=>client.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'||type==='touchCancel'?[]:[{x,y,id:1}]});
  const start=await value('turn');
  await touch('touchStart',box.x+box.width*.5,box.y+box.height*.5);
  await touch('touchMove',box.x+box.width*.7,box.y+box.height*.6);
  await touch('touchEnd');await ready();assert.ok(await value('turn')>start);
  const committed=await value('turn');
  await touch('touchStart',box.x+box.width*.5,box.y+box.height*.5);await touch('touchMove',box.x+box.width*.6,box.y+box.height*.6);await touch('touchCancel');await ready();
  assert.equal(await value('turn'),committed,'touch cancellation restores the orientation');
  assert.equal(await page.locator('.is-dragging').count(),0);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('.graffiti-stage').screenshot({path:'/tmp/graffiti-interaction-mobile.png'});
  assert.deepEqual(errors,[]);console.log('PASS: text/light gestures, independent controls, marker sync, keyboard, Escape, pointer capture, touch and cancellation, mobile bounds.');
}finally{await browser.close();}
