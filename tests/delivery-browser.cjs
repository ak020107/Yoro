// Opt-in live integration check. Uploads SAMPLE_AUDIO using configured paid providers.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
if(!process.env.SAMPLE_AUDIO) throw new Error('Set SAMPLE_AUDIO to an authorized recording under 45 seconds.');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try {
  await page.goto(process.env.TEST_ORIGIN || 'http://127.0.0.1:3000');
  await page.getByRole('button',{name:'Explore',exact:true}).click();
  await page.getByRole('button',{name:'Practice my delivery',exact:true}).click();
  await page.getByLabel('How do you want to come across?').fill('Clear and direct while keeping my confidence. Reduce unwanted uhms and repeated starts.');
  await page.getByLabel('Or choose a recording').setInputFiles(process.env.SAMPLE_AUDIO);
  await page.getByLabel('Your recorded response',{exact:true}).waitFor();
  const responsePromise=page.waitForResponse(r=>r.url().endsWith('/api/attempts')&&r.request().method()==='POST',{timeout:120000});
  await page.getByRole('button',{name:'Get coaching',exact:true}).click();
  const response=await responsePromise;assert.equal(response.status(),200);const result=await response.json();
  assert.equal(result.delivery.status,'available');assert.ok(result.delivery.fillerCount>0);
  await page.getByRole('heading',{name:'Your delivery, in detail'}).waitFor();
  await page.getByRole('button',{name:/Hear .*filler/}).first().click();
  assert.ok(await page.getByLabel('Delivery evidence playback').evaluate(el=>!el.paused));
  for(const width of [320,390,768,1280,1440]) {
   await page.setViewportSize({width,height:900});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`overflow at ${width}`);
  }
  fs.mkdirSync('test-results',{recursive:true});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/delivery-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({pass:true,source:result.source,pace:result.delivery.wordsPerMinute,fillers:result.delivery.fillerCount,checks:['local file decode','live upload and analysis','evidence playback','five viewport widths','no browser errors']}));
 } finally { await page.evaluate(()=>fetch('/api/reset',{method:'DELETE'})).catch(()=>{});await browser.close(); }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
