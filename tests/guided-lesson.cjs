// Isolated fixtures: no provider calls, no real session writes.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
function wav() { const b=Buffer.alloc(44+1600); b.write('RIFF'); b.writeUInt32LE(b.length-8,4); b.write('WAVEfmt ',8); b.writeUInt32LE(16,16); b.writeUInt16LE(1,20); b.writeUInt16LE(1,22); b.writeUInt32LE(8000,24); b.writeUInt32LE(16000,28); b.writeUInt16LE(2,32); b.writeUInt16LE(16,34); b.write('data',36); b.writeUInt32LE(1600,40); return b; }
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
 const context=await browser.newContext({viewport:{width:390,height:844},permissions:['microphone']});
 const page=await context.newPage(); const errors=[]; page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});page.on('console',m=>{if(m.type()==='error')console.error(m.text());});
 const state={profile:{name:'',strengths:'',workingOn:'',intention:'',situations:'',focus:'',coachingStyle:'gentle',voicePreset:'default'},attempts:[],messages:[],scenarios:[],completed:[],memory:{status:'off'},capabilities:{mode:'live',gemini:true,transcription:true,speech:true,memory:false,database:'local',voices:['default']}};
 let demos=0; let requests=[],speech=0,failOnce=true,failedId;
 await page.route('**/api/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname;
  if(path==='/api/personal-voice')return route.fulfill({json:null});
  if(path==='/api/state')return route.fulfill({json:state});
  if(path==='/api/phrase-demo'){demos++;assert.equal(req.postDataJSON().id,state.attempts[0].id);return route.fulfill({body:wav(),contentType:'audio/wav'});}
  if(path==='/api/speech'){speech++;return route.fulfill({body:wav(),contentType:'audio/wav'});}
  if(path.startsWith('/api/audio/'))return route.fulfill({body:wav(),contentType:'audio/wav'});
  if(path==='/api/reflection'){const body=req.postDataJSON();assert.equal(body.id,state.attempts[1].id);state.attempts[1].reflection=body.choice;return route.fulfill({json:{ok:true}});}
  if(path==='/api/attempts'){
   const form=await new Response(req.postDataBuffer(),{headers:{'Content-Type':req.headers()['content-type']}}).formData();
   const guided=JSON.parse(form.get('guided'));const id=form.get('requestId'); assert.ok(form.get('audio').size>100); assert.equal(form.get('text'),null);
   await new Promise(resolve=>setTimeout(resolve,700));
   if(failOnce){failOnce=false;failedId=id;return route.fulfill({status:503,json:{error:'Test service unavailable. Retry your saved recording.'}});}
   if(!requests.length)assert.equal(id,failedId,'Retry must reuse idempotency key');
   requests.push({guided,id,parent:form.get('parentId')});
   const result={id,parentId:form.get('parentId') || undefined,kind:'delivery',guided,goal:'Welcoming emphasis',context:'Fixture',input:'audio',transcript:'I am glad you came. Come and join us.',words:[],source:'gemini',createdAt:new Date().toISOString(),feedback:{summary:'Test listening observation',strength:null,observation:{quote:'glad',explanation:'Fixture: this word seems lightly emphasized.'},adjustment:'Give glad a little emphasis.',example:'',nextPrompt:''}};
   if(guided.stage==='retry'){result.feedback.adjustment='';result.change={outcome:'closer',summary:'Your invitation sounds clearer in the retry.',beforeQuote:'join us',afterQuote:'join us',reason:'The invitation has more distinct emphasis in this fixture.'};}
   state.attempts.push(result);return route.fulfill({json:result});
  }
  return route.fulfill({status:500,json:{error:'Unexpected test route'}});
 });
 try{
  await page.goto('http://127.0.0.1:3000');await page.getByRole('button',{name:'Just want a quick practice?',exact:true}).click();
  assert.equal(await page.locator('.guided-lesson textarea').count(),0);
  await page.getByRole('button',{name:/Play A/}).click();await page.getByRole('button',{name:/Play A.*Listen again/}).waitFor();
  await page.getByRole('button',{name:/Play B/}).click();await page.getByRole('button',{name:'They sound similar',exact:true}).waitFor();
  await page.getByRole('button',{name:'They sound similar',exact:true}).click();
  await page.getByRole('button',{name:/Show me what to try/}).click();await page.getByText(/Generated examples do not always/).waitFor();
  await page.getByRole('button',{name:'Let me try',exact:false}).click();
  async function record(){await page.getByRole('button',{name:'Record response',exact:true}).click();await page.getByRole('button',{name:/Stop recording/}).waitFor();assert.equal(await page.locator('.lesson-coach .listener').getAttribute('data-listener-state'),'listening');await page.waitForTimeout(900);await page.getByRole('button',{name:/Stop recording/}).click();await page.getByLabel('Your recorded response',{exact:true}).waitFor();await page.getByRole('button',{name:'Hear my coaching',exact:false}).click();}
  await record();await page.locator('.pending-coach').waitFor();await page.getByRole('alert').getByText(/Test service unavailable/).waitFor();
  await page.getByRole('button',{name:'Hear my coaching',exact:false}).click();
  await page.getByRole('button',{name:'Replay full recording',exact:true}).waitFor();
  await page.getByRole('button',{name:'Hear a welcoming version',exact:true}).click();
  await page.getByRole('button',{name:'Hear a welcoming version',exact:true}).click(); assert.equal(demos,1);
  await page.reload();await page.getByRole('button',{name:'Just want a quick practice?',exact:true}).click();
  await page.getByRole('button',{name:/Try that one change/}).click();await record();
  await page.getByRole('heading',{name:'Which feels more like you?'}).waitFor();
  await page.getByText('Closer to your intention',{exact:true}).waitFor();fs.mkdirSync('test-results',{recursive:true});await page.screenshot({path:'test-results/retry-change-mobile.png',fullPage:true,animations:'disabled'});assert.equal(await page.locator('.lesson-feedback details').count(),0);assert.equal(await page.locator('.lesson-feedback').getByText('ONE THING TO TRY',{exact:true}).count(),0);
  assert.ok(await page.getByRole('button',{name:/Try a new hello/}).isDisabled());
  await page.getByRole('button',{name:'Not sure yet',exact:true}).click();await page.getByRole('button',{name:/Try a new hello/}).click();await record();
  await page.getByRole('heading',{name:'You put it into practice.'}).waitFor();
  assert.deepEqual(requests.map(r=>r.guided.stage),['first','retry','transfer']);assert.equal(requests[1].parent,requests[0].id);assert.equal(requests[2].parent,requests[1].id);assert.equal(state.attempts[1].reflection,'unsure');assert.equal(speech,2);
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow ${width}`);}
  fs.mkdirSync('test-results',{recursive:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/lesson-finish-mobile.png',fullPage:true,animations:'disabled'});
  await page.getByRole('navigation').getByRole('button',{name:'Today',exact:true}).click();await page.getByRole('button',{name:'Just want a quick practice?',exact:true}).waitFor();
  state.attempts=[];state.capabilities.mode='preview';await page.reload();await page.getByRole('button',{name:'Just want a quick practice?',exact:true}).click();await page.getByRole('button',{name:'Continue with a written cue',exact:true}).click();await page.getByRole('button',{name:/Let me try/}).click();assert.ok(await page.getByRole('button',{name:/Hear my coaching/}).isDisabled());await page.getByText(/Personalized listening feedback needs/).waitFor();
  assert.deepEqual(errors,[]);console.log('PASS guided lesson: two audio examples, subjective choice, three recordings, retry idempotency, reflection, transfer, mobile widths, preview honesty, no browser errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
