// Exercise complete and skipped onboarding, chat-only replies, wording, and profile edits.
// All APIs are intercepted; no real user state or provider credits are touched.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const blank={name:'',strengths:'',workingOn:'',intention:'',situations:'',focus:'',coachingStyle:'gentle',voicePreset:'default'};
 const state={introduction:'new',profile:{...blank},attempts:[],messages:[],scenarios:[],completed:[],discovery:{turns:[]},memory:{status:'off'},capabilities:{mode:'live',gemini:true,speech:true,transcription:true,voices:['default'],database:'local',memory:false}};
 let failSave=true;let failProfile=true;const messages=[];let introCalls=0;
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  if(path==='/api/personal-voice')return route.fulfill({json:null});if(path==='/api/state')return route.fulfill({json:state});
  const b=route.request().postDataJSON();
  if(path==='/api/introduction'){
   introCalls++;if(failSave){failSave=false;return route.fulfill({status:503,json:{error:'Save unavailable. Please retry.'}});}
   state.introduction=b.status;if(b.profile)state.profile=b.profile;return route.fulfill({json:{ok:true}});
  }
  if(path==='/api/profile'){
   if(failProfile){failProfile=false;return route.fulfill({status:503,json:{error:'Profile could not save. Try again.'}});}
   state.profile=b;return route.fulfill({json:{ok:true}});
  }
  if(path==='/api/discovery'){
   messages.push(b.message);const turn={id:b.requestId,message:b.message,reply:'We can work on that together. What do you want them to understand?',plan:null,wording:messages.length===1?{original:'I was just wondering if we could talk.',revised:'Could we talk for a moment?',reason:'A direct invitation keeps your meaning.'}:null};
   state.discovery.turns.push(turn);return route.fulfill({json:turn});
  }
  return route.fulfill({status:500,json:{error:'Unexpected request in test'}});
 });
 const nav=name=>page.getByRole('navigation').getByRole('button',{name,exact:true});
 try{
  await page.goto('http://127.0.0.1:3000');await page.getByRole('button',{name:'Create my voice profile',exact:false}).click();await page.getByRole('dialog').getByRole('heading',{name:'Where would you like this to feel easier?'}).waitFor();await page.reload();await nav('Yoro').click();
  const prompt='Help with this wording: I was just wondering if we could talk.';
  await page.getByLabel('Tell Yoro what you have in mind').fill(prompt);await page.getByRole('button',{name:'Send',exact:true}).click();
  const dialog=page.getByRole('dialog');await dialog.waitFor();assert.equal(messages.length,0);
  await dialog.getByRole('button',{name:'Interviews & networking',exact:false}).click();await dialog.getByRole('button',{name:'Continue',exact:false}).click();
  await dialog.getByRole('heading',{name:'How do you want to come across?'}).waitFor();
  await dialog.getByLabel('Or use your own words').fill('Clear, direct, and approachable');await dialog.getByRole('button',{name:'Continue',exact:false}).click();
  await dialog.getByRole('heading',{name:'What would you like a hand with?'}).waitFor();
  await dialog.getByRole('button',{name:'Getting to the point',exact:false}).click();await dialog.getByRole('button',{name:'Continue',exact:false}).click();
  await dialog.getByRole('heading',{name:'What should we keep about your voice?'}).waitFor();
  await dialog.getByRole('button',{name:'My confidence',exact:false}).click();await dialog.getByRole('button',{name:'Back',exact:true}).click();
  await dialog.getByRole('heading',{name:'What would you like a hand with?'}).waitFor();assert.equal(await dialog.getByLabel('Or use your own words').inputValue(),'Getting to the point');
  await dialog.getByRole('button',{name:'Continue',exact:false}).click();await dialog.getByRole('heading',{name:'What should we keep about your voice?'}).waitFor();
  await dialog.getByRole('button',{name:'Continue',exact:false}).click();await dialog.getByRole('heading',{name:'Does this sound like you?'}).waitFor();
  await dialog.getByLabel('What should Yoro call you? (optional)').fill('Armaan');
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:844});assert.ok(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth),`dialog overflow ${width}`);}
  await page.setViewportSize({width:390,height:844});fs.mkdirSync('test-results',{recursive:true});await page.screenshot({path:'test-results/introduction-mobile.png',animations:'disabled'});
  await dialog.getByRole('button',{name:'Save my direction',exact:true}).click();await dialog.getByRole('alert').waitFor();assert.equal(messages.length,0);assert.equal(await dialog.getByLabel('What should Yoro call you? (optional)').inputValue(),'Armaan');
  await dialog.getByRole('button',{name:'Save my direction',exact:true}).click();await page.locator('.wording-revision').waitFor();assert.deepEqual(messages,[prompt]);assert.equal(state.profile.strengths,'My confidence');assert.equal(await page.locator('.companion-next').count(),0);
  await page.screenshot({path:'test-results/wording-mobile.png',fullPage:true,animations:'disabled'});
  await page.getByLabel('Keep talking with Yoro').fill('Can we just talk about my nerves?');await page.getByRole('button',{name:'Send',exact:true}).click();await page.locator('.companion-you').filter({hasText:'Can we just talk about my nerves?'}).waitFor();assert.equal(await page.getByRole('dialog').count(),0);assert.equal(introCalls,2);
  await page.reload();await page.getByRole('heading',{name:'Hey Armaan.'}).waitFor();await nav('My Voice').click();assert.equal(await page.locator('main textarea').count(),0);
  await page.locator('.profile-item-toggle').filter({hasText:'My direction'}).click();await page.getByLabel('My direction',{exact:true}).fill('Test cancelled draft');await page.getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(state.profile.intention,'Clear, direct, and approachable');
  await page.locator('.profile-item-toggle').filter({hasText:'My direction'}).click();await page.getByLabel('My direction',{exact:true}).fill('Clear and relaxed');await page.getByRole('button',{name:'Save change',exact:true}).click();await page.getByRole('alert').filter({hasText:'Profile could not save'}).waitFor();assert.equal(await page.getByLabel('My direction',{exact:true}).inputValue(),'Clear and relaxed');
  await page.getByRole('button',{name:'Save change',exact:true}).click();await page.getByText('Profile saved.',{exact:false}).waitFor();assert.equal(state.profile.intention,'Clear and relaxed');
  await page.screenshot({path:'test-results/profile-mobile.png',fullPage:true,animations:'disabled'});
  await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'test-results/profile-desktop.png',fullPage:true,animations:'disabled'});
  // A new empty session can skip without losing the first draft; skip survives reload.
  state.profile={...blank};state.introduction='new';state.discovery.turns=[];await page.reload();await nav('Yoro').click();
  await page.getByLabel('Tell Yoro what you have in mind').fill('Just talk with me.');await page.getByRole('button',{name:'Send',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Skip for now',exact:true}).click();await page.locator('.companion-you').filter({hasText:'Just talk with me.'}).waitFor();assert.equal(state.introduction,'skipped');assert.equal(state.profile.name,'');
  await page.reload();await nav('Yoro').click();await page.getByLabel('Keep talking with Yoro').fill('What could I say first?');await page.getByRole('button',{name:'Send',exact:true}).click();await page.locator('.companion-you').filter({hasText:'What could I say first?'}).waitFor();assert.equal(introCalls,3);assert.deepEqual(errors,[]);
  console.log('PASS onboarding: review, back, custom answer, save failure, preserved first prompt, skip persistence; wording-only conversation; focused profile editing, cancellation, failed save; 320–1440px and reduced motion.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

