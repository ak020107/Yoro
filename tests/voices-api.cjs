// Real local API contracts. No paid provider calls: examples are authored.
const assert=require('node:assert/strict');
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:3000';
async function client(){const response=await fetch(origin+'/api/state');return response.headers.get('set-cookie').split(';')[0];}
async function post(cookie,path,body){return fetch(origin+'/api/'+path,{method:'POST',headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify(body)});}
(async()=>{const cookie=await client(),other=await client();const id=crypto.randomUUID();const input={requestId:id,figureId:'jobs',challengeId:'one-idea',example:true};
let res=await post(cookie,'voices',input);assert.equal(res.status,200);const session=await res.json();assert.equal(session.source,'authored');
res=await post(cookie,'voices',input);assert.equal((await res.json()).id,id);
res=await post(cookie,'voices',{...input,figureId:'unknown',requestId:crypto.randomUUID()});assert.equal(res.status,400);
let state=await(await fetch(origin+'/api/state',{headers:{Cookie:cookie}})).json();assert.equal(state.voiceSessions.length,1);
const form=new FormData();form.set('requestId',crypto.randomUUID());form.set('kind','speaker');form.set('voiceSessionId',id);form.set('text','test');form.set('goal','test');
res=await fetch(origin+'/api/attempts',{method:'POST',headers:{Origin:origin,Cookie:other},body:form});assert.equal(res.status,404);
form.set('kind','delivery');res=await fetch(origin+'/api/attempts',{method:'POST',headers:{Origin:origin,Cookie:cookie},body:form});assert.equal(res.status,400);
res=await fetch(origin+'/api/reset',{method:'DELETE',headers:{Origin:origin,Cookie:cookie}});assert.equal(res.status,200);
state=await(await fetch(origin+'/api/state',{headers:{Cookie:cookie}})).json();assert.deepEqual(state.voiceSessions,[]);
console.log('PASS Voices API: authored examples, idempotency, invalid selection, ownership, incompatible modes, reset. No provider calls.');
})().catch(e=>{console.error(e);process.exitCode=1;});
