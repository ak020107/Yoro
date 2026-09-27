const assert=require('node:assert/strict'),fs=require('node:fs'),fsp=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const original=process.cwd(),temp=fs.mkdtempSync(path.join(os.tmpdir(),'yoro-store-test-'));const cloud=new Map();let migrationCount=0;
const collection={
 findOne:async({_id})=>cloud.get(_id),
 updateOne:async({_id},value)=>{migrationCount++;if(!cloud.has(_id))cloud.set(_id,{_id,...value.$setOnInsert});},
 replaceOne:async({_id},value)=>cloud.set(_id,{_id,...value})
};
const load=Module._load;Module._load=function(id,...args){
 if(id==='server-only')return {};
 if(id==='mongodb')return {MongoClient:class {async connect(){} db(){return {collection:()=>collection};}}};
 return load.call(this,id,...args);
};
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{esModuleInterop:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{process.chdir(temp);process.env.MONGODB_URI='fixture';const s=require(path.join(original,'lib/store.ts')),id='a'.repeat(64),audioId=crypto.randomUUID();await fsp.mkdir('.data');await fsp.writeFile(path.join('.data',id+'.json'),JSON.stringify({profile:{name:'Local profile'},attempts:[]}));assert.equal((await s.getState(id)).profile.name,'Local profile');assert.equal(migrationCount,1);cloud.get(id).state.profile.name='Cloud profile';assert.equal((await s.getState(id)).profile.name,'Cloud profile');assert.equal(migrationCount,1);
 await s.saveAudio(id,audioId,Buffer.from('sample'),'audio/wav');await s.retainAudio(id,audioId,true);const meta=path.join('.data','audio',id,audioId+'.json');assert.equal(JSON.parse(await fsp.readFile(meta)).expires,null);assert.equal((await s.audio(id,audioId)).bytes.toString(),'sample');await s.retainAudio(id,audioId,false);assert.ok(JSON.parse(await fsp.readFile(meta)).expires>Date.now());await fsp.writeFile(meta,JSON.stringify({mime:'audio/wav',expires:Date.now()-1}));assert.equal(await s.audio(id,audioId),null);assert.equal(await s.audio(id,'../secret'),null);
 console.log('PASS store: migrate local session only once, never overwrite cloud state, retained audio expiry and invalid ID. Fake MongoDB and isolated temp files.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{process.chdir(original);if(path.dirname(temp)===os.tmpdir()&&path.basename(temp).startsWith('yoro-store-test-'))await fsp.rm(temp,{recursive:true,force:true});});
