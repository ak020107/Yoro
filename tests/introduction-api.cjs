// Real local routes, isolated fresh cookie. No provider requests are made.
const assert=require('node:assert/strict');const {randomUUID}=require('node:crypto');
(async()=>{
 const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:3000';
 const first=await fetch(origin+'/api/state');assert.equal(first.status,200);
 const cookie=first.headers.get('set-cookie').split(';')[0];
 async function call(path,body,method='POST'){return fetch(origin+'/api/'+path,{method,headers:{cookie,origin,...(body instanceof FormData?{}:{'Content-Type':'application/json'})},body:body instanceof FormData?body:body?JSON.stringify(body):undefined});}
 const original=await first.json();assert.equal(original.profile.name,'');assert.equal(original.attempts.length,0);
 try{
  let response=await call('introduction',{status:'complete',profile:{...original.profile,name:'Isolated UI test',strengths:'My confidence',intention:'Clear and direct'}});assert.equal(response.status,200);
  let state=await (await call('state',undefined,'GET')).json();assert.equal(state.introduction,'complete');assert.equal(state.profile.name,'Isolated UI test');
  response=await call('introduction',{status:'complete',profile:{...state.profile,intention:'x'.repeat(501)}});assert.equal(response.status,400);
  response=await call('introduction',{status:'skipped'});assert.equal(response.status,200);
  state=await (await call('state',undefined,'GET')).json();assert.equal(state.introduction,'skipped');assert.equal(state.profile.name,'Isolated UI test');
  const form=new FormData();form.set('requestId',randomUUID());form.set('kind','delivery');form.set('goal','Test');form.set('context','');form.set('text','Test');form.set('discoveryId',randomUUID());
  response=await call('attempts',form);assert.equal(response.status,404);assert.equal((await response.json()).error,'Conversation not found.');
 }finally{const reset=await call('reset',undefined,'DELETE');assert.equal(reset.status,200);}
 const state=await (await call('state',undefined,'GET')).json();assert.equal(state.introduction,'new');assert.equal(state.profile.name,'');assert.deepEqual(state.discovery.turns,[]);
 console.log('PASS real local API: confirmed introduction saves; invalid profile rejected; skipping preserves existing profile; foreign conversation cannot attach practice; reset clears all new state. No paid calls.');
})().catch(e=>{console.error(e);process.exitCode=1;});
