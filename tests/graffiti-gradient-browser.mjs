import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const canvas=page.locator('#graffiti-canvas');
const ready=async()=>{await page.waitForTimeout(160);await page.waitForFunction(()=>document.querySelector('#graffiti-canvas').dataset.font && document.querySelector('#graffiti-preview').getAttribute('aria-busy')==='false');};
async function pixels(buffer){return page.evaluate(async data=>{const img=new Image();img.src=data;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);return Array.from(ctx.getImageData(0,0,c.width,c.height).data);},`data:image/png;base64,${buffer.toString('base64')}`);}
try {
 await page.goto(process.env.GRAFFITI_TEST_URL||'http://localhost/index.html#create');
 await page.locator('#graffiti-preview summary').click();await ready();
 await page.locator('#graffiti-text').fill('OSEA');await ready();
 const solid=await canvas.screenshot();
 assert.equal(await page.locator('#graffiti-gradient-controls').isVisible(),false);
 await page.locator('#graffiti-fill').selectOption('gradient');await ready();
 assert.equal(await page.locator('#graffiti-gradient-controls').isVisible(),true);
 const gradient=await canvas.screenshot();assert.ok(!solid.equals(gradient),'gradient changes the face');
 const before=await pixels(solid),after=await pixels(gradient);let side=0,unchanged=0;
 for(let i=0;i<before.length;i+=4)if(before[i+1]>before[i]*1.3&&before[i+2]>before[i]*1.3){side++;if(before[i]===after[i]&&before[i+1]===after[i+1]&&before[i+2]===after[i+2])unchanged++;}
 assert.ok(side>100);assert.ok(unchanged/side>.95,'side material remains the same');
 await page.locator('#graffiti-gradientAngle').evaluate(el=>{el.value=0;el.dispatchEvent(new Event('input',{bubbles:true}));});await ready();
 assert.ok(!gradient.equals(await canvas.screenshot()),'angle changes gradient direction');
 await page.locator('#graffiti-font').selectOption('lacquer');await ready();
 assert.equal(await page.locator('#graffiti-fill').inputValue(),'gradient');assert.equal(await page.locator('#graffiti-gradientAngle').inputValue(),'0');
 await page.locator('#graffiti-font').selectOption('knewave');await ready();
 await page.locator('#graffiti-gradientAngle').evaluate(el=>{el.value=90;el.dispatchEvent(new Event('input',{bubbles:true}));});await ready();
 await page.locator('#graffiti-preview').screenshot({path:'/tmp/graffiti-gradient-desktop.png'});
 await page.locator('#graffiti-fill').selectOption('solid');await ready();
 const restored=await pixels(await canvas.screenshot());const error=before.reduce((sum,v,i)=>sum+Math.abs(v-restored[i]),0)/before.length;/* Allow subpixel antialiasing differences after rebuilding the font geometry. */assert.ok(error<.3,'solid mode restores original appearance');
 await page.locator('#graffiti-fill').selectOption('gradient');await page.locator('#graffiti-gradient-end').selectOption('0');await ready();
 const equal=await pixels(await canvas.screenshot());assert.ok(before.reduce((sum,v,i)=>sum+Math.abs(v-equal[i]),0)/before.length<.3,'same endpoints yield a solid face');
 await page.locator('#graffiti-text').fill('');await ready();await page.locator('#graffiti-text').fill('ÉTÉ');await ready();
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);console.log('PASS: visible face gradient, unchanged sides, angle, font preservation, solid restoration, equal colors, empty/accented text, mobile layout.');
}finally{await browser.close();}
