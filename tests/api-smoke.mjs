import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:3000';
async function session() { const r = await fetch(origin + '/api/state'); assert.equal(r.status,200); return { cookie:r.headers.get('set-cookie').split(';')[0], state:await r.json() }; }
const one=await session(), two=await session();
async function call(who,path,body,method='POST',requestOrigin=origin){const r=await fetch(origin+'/api/'+path,{method,headers:{Cookie:who.cookie,Origin:requestOrigin,...(body instanceof FormData?{}:{'Content-Type':'application/json'})},body:body instanceof FormData?body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};}
function attempt(id,parentId){const f=new FormData();f.set('requestId',id);f.set('kind','delivery');f.set('goal','Warm and curious');f.set('context','Meeting a classmate');f.set('text','Hi! What did you think of the class?');if(parentId)f.set('parentId',parentId);return f;}
try{
  assert.equal(one.state.capabilities.mode,'preview','Run smoke tests only in preview mode');
  assert.equal((await call(one,'profile',{...one.state.profile,name:'Smoke test',focus:'Ask a relevant follow-up'})).status,200);
  const other=await call(two,'state',undefined,'GET');assert.equal(other.data.profile.name,'');
  assert.equal((await call(one,'advice',{message:'Help me introduce myself'})).data.source,'preview');
  const first=randomUUID();assert.equal((await call(one,'attempts',attempt(first))).status,200);
  assert.equal((await call(one,'attempts',attempt(first))).status,200);
  const current=await call(one,'state',undefined,'GET');assert.equal(current.data.attempts.length,1);
  const second=randomUUID();assert.equal((await call(one,'attempts',attempt(second,first))).status,200);
  assert.equal((await call(one,'compare',{secondId:second})).status,200);
  assert.equal((await call(two,'compare',{secondId:second})).status,404);
  assert.equal((await call(one,'profile',one.state.profile,'POST','https://unrelated.example')).status,403);
  assert.equal((await call(one,'advice',{message:''})).status,400);
  const s=await call(one,'scenarios',{context:'Meet a classmate',goal:'Curious',mood:'brief'});assert.equal(s.status,200);
  const t=await call(one,`scenarios/${s.data.id}/turn`,{message:'How did you find the lecture?'});assert.equal(t.data.turns.length,3);
  const rewound=await call(one,`scenarios/${s.data.id}/turn`,{rewind:true});assert.equal(rewound.data.turns.length,1);
  console.log('PASS: persistence, isolation, preview labels, duplicate prevention, retry comparison, origin checks, validation, and scenario rewind');
}finally{await call(one,'reset',undefined,'DELETE');await call(two,'reset',undefined,'DELETE');}
