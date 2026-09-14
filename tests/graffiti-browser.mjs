import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[],requests=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('request',r=>requests.push(r.url()));
const root=page.locator('#graffiti-preview'),canvas=page.locator('#graffiti-canvas');
const ready=()=>page.waitForFunction(()=>document.querySelector('#graffiti-preview').getAttribute('aria-busy')==='false' && document.querySelector('#graffiti-canvas').dataset.font);
async function slider(id,value) {
  await page.locator(`#graffiti-${id}`).evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));},value);
  await page.waitForTimeout(150);await ready();
}
try {
  await page.goto(process.env.GRAFFITI_TEST_URL||'http://localhost/index.html#create');
  await page.waitForSelector('.composition-color');
  assert.equal(requests.some(url=>url.includes('/vendor/three/')),false,'3D loads only on opening');
  await root.locator('summary').click();await ready();
  assert.equal(await page.locator('#graffiti-retry').isVisible(),false);
  await page.locator('#graffiti-text').fill('OSEA');await page.waitForTimeout(150);await ready();
  await slider('depth','55');await slider('tilt','25');await slider('turn','-35');
  await slider('lightAngle','60');await slider('lightHeight','20');await slider('intensity','4');
  const count=await page.locator('#graffiti-face option').count();assert.ok(count>1);
  await page.locator('#graffiti-face').selectOption('1');await page.locator('#graffiti-side').selectOption('0');
  const snapshots=[];
  for(const font of ['knewave','sedgwickavedisplay','lacquer']) {
    await page.locator('#graffiti-font').selectOption(font);
    await page.waitForFunction(font=>document.querySelector('#graffiti-canvas').dataset.font===font && document.querySelector('#graffiti-preview').getAttribute('aria-busy')==='false',font);
    assert.equal(await page.locator('#graffiti-text').inputValue(),'OSEA');
    assert.equal(await page.locator('#graffiti-depth').inputValue(),'55');
    assert.equal(await page.locator('#graffiti-lightAngle').inputValue(),'60');
    assert.equal(await page.locator('#graffiti-face').inputValue(),'1');
    assert.equal(await page.locator('#graffiti-side').inputValue(),'0');
    assert.equal(await canvas.getAttribute('data-supported'),'true');
    snapshots.push(await canvas.screenshot({path:`/tmp/graffiti-${font}.png`}));
  }
  assert.ok(!snapshots[0].equals(snapshots[1])&&!snapshots[1].equals(snapshots[2]),'font changes visibly update the canvas');
  await page.locator('#graffiti-font').selectOption('knewave');await page.waitForTimeout(150);await ready();
  await root.screenshot({path:'/tmp/graffiti-desktop.png'});
  await page.locator('#graffiti-text').fill('');await page.waitForTimeout(150);await ready();
  assert.equal(await page.locator('#graffiti-status').isVisible(),true,'empty text has a helpful message');
  await page.locator('#graffiti-text').fill('ÉTÉ');await page.waitForTimeout(150);await ready();
  assert.equal(await canvas.getAttribute('data-supported'),'true','accented text supported');
  await page.locator('#graffiti-font').selectOption('sedgwickavedisplay');
  await page.locator('#graffiti-font').selectOption('lacquer');
  await page.locator('#graffiti-font').selectOption('knewave');
  await page.waitForTimeout(250);await ready();assert.equal(await canvas.getAttribute('data-font'),'knewave','latest selection wins');
  await page.evaluate(()=>document.querySelector('[data-language="en"]').click());
  assert.equal(await root.locator('summary').innerText(),'Try on 3D graffiti');
  await page.evaluate(()=>document.querySelector('[data-language="fr"]').click());
  await page.locator('#graffiti-text').fill('OSEA');await page.waitForTimeout(150);await ready();
  await page.setViewportSize({width:390,height:844});await root.scrollIntoViewIfNeeded();
  await root.screenshot({path:'/tmp/graffiti-mobile.png'});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no mobile overflow');
  await page.evaluate(()=>location.hash='#image');await page.waitForTimeout(100);assert.equal(await root.isVisible(),false);
  await page.evaluate(()=>location.hash='#create');await root.waitFor({state:'visible'});assert.equal(await page.locator('#graffiti-text').inputValue(),'OSEA');
  // A failed font request is recoverable without losing the name or settings.
  await page.route('**/assets/fonts/knewave/typeface.json',route=>route.abort());
  await page.reload();await page.waitForSelector('.composition-color');
  await root.locator('summary').click();await page.locator('#graffiti-retry').waitFor({state:'visible'});
  await page.unroute('**/assets/fonts/knewave/typeface.json');
  await page.locator('#graffiti-retry').click();await ready();
  assert.equal(await page.locator('#graffiti-retry').isVisible(),false);
  // Rendering changes for light, depth and each independently assigned material.
  const baseline=await canvas.screenshot();await slider('depth','90');
  assert.ok(!baseline.equals(await canvas.screenshot()));
  const deep=await canvas.screenshot();await slider('lightAngle','120');
  assert.ok(!deep.equals(await canvas.screenshot()));
  const lit=await canvas.screenshot();await page.locator('#graffiti-face').selectOption('1');
  await page.waitForTimeout(100);await ready();assert.ok(!lit.equals(await canvas.screenshot()));
  assert.deepEqual(errors,[]);
  console.log('PASS: lazy local 3D, all three fonts, preserved settings/colors, visible font changes, accents, blank input, rapid changes, localization, mobile layout, navigation.');
} finally {await browser.close();}
