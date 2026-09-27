// UI regression with stubbed speech responses; does not spend provider credits.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{
const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();
const bytes=fs.readFileSync(process.env.SPEECH_FIXTURE);const calls=[];const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
 await page.route('**/api/speech',async route=>{
  const body=route.request().postDataJSON();calls.push(body);
  if(calls.length===4) return route.fulfill({status:503,json:{error:'Test temporary failure'}});
  return route.fulfill({contentType:'audio/mpeg',body:bytes});
 });
 await page.goto(process.env.TEST_ORIGIN||'http://127.0.0.1:3000');
 await page.getByRole('button',{name:'Explore',exact:true}).click();
 await page.getByLabel('Try a sentence').fill('We finally have a chance to talk.');
 await page.getByRole('button',{name:'Hear both deliveries'}).click();
 await page.getByRole('button',{name:'Both examples ready'}).waitFor();
 assert.equal(calls.length,2);assert.equal(calls[0].text,calls[1].text);assert.equal(calls[0].preset,calls[1].preset);assert.notEqual(calls[0].emotion,calls[1].emotion);
 const a=page.getByLabel('Warm delivery example',{exact:true}),b=page.getByLabel('Confident delivery example',{exact:true});
 await a.evaluate(el=>el.play());await b.evaluate(el=>el.play());assert.equal(await a.evaluate(el=>el.paused),true);
 await page.getByLabel('Try a sentence').fill('Tell me what happened.');
 await a.waitFor({state:'hidden'});await b.waitFor({state:'hidden'});
 await page.getByLabel('Voice / accent').selectOption('uk');await page.getByLabel('Expression').selectOption('expressive');
 await page.getByRole('button',{name:'Hear both deliveries'}).click();await page.getByText(/Test temporary failure/).waitFor();
 assert.equal(calls.length,4);await a.waitFor();assert.equal(await b.count(),0);
 await page.getByRole('button',{name:'Hear both deliveries'}).click();await page.getByRole('button',{name:'Both examples ready'}).waitFor();
 assert.equal(calls.length,5);assert.equal(calls[4].emotion,'confident');assert.equal(calls[4].preset,'uk');assert.equal(calls[4].intensity,'expressive');
 await page.getByRole('button',{name:'Explore warm',exact:true}).click();await page.getByRole('button',{name:'Practice this delivery',exact:true}).click();
 assert.match(await page.getByLabel('How do you want to come across?').inputValue(),/^Warm:/);
 assert.equal(await page.getByLabel('Or type your response').inputValue(),'Tell me what happened.');
 for(const width of [320,390,768,1280,1440]) {await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`overflow at ${width}`);}
 await page.setViewportSize({width:390,height:844});fs.mkdirSync('test-results',{recursive:true});await page.screenshot({path:'test-results/speech-mobile.png',fullPage:true});
 await page.getByRole('button',{name:'My Voice',exact:true}).click();await page.getByText('Connections and setup',{exact:true}).click();await page.getByRole('heading',{name:'Connection status'}).waitFor();
 assert.equal(await page.getByRole('navigation').getByRole('button',{name:'Setup',exact:true}).count(),0);assert.deepEqual(errors,[]);
 console.log('PASS: same-words comparison, single-player playback, stale audio cleared, partial failure retry without duplicate generation, accent/intensity request, practice handoff, setup relocation, five widths.');
}finally{await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
