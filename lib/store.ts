import 'server-only';
import { mkdir, readFile, writeFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { MongoClient, Binary } from 'mongodb';
import {randomUUID} from 'node:crypto';
import { initialState, type State } from './domain';
import {ServiceError} from './provider-request';
import {normalizeStoredState} from './stored-state';

const root = process.env.DATA_DIR || path.join(process.cwd(), '.data');
const queues = new Map<string, Promise<unknown>>();
let mongo: MongoClient | undefined;
function key(id: string) { if (!/^[a-f0-9]{64}$/.test(id)) throw new Error('Invalid session'); return id; }
async function collection() {
  if (!process.env.MONGODB_URI) {if(process.env.VERCEL)throw new ServiceError('Cloud storage is not configured.',503);return null;}
  mongo ??= new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:8000,ignoreUndefined:true,maxPoolSize:5});
  try{await mongo.connect();}catch(e){
    const error=e as {code?:number;message?:string};
    if(error.code===18||error.code===8000||/authentication failed|bad auth/i.test(error.message||''))throw new ServiceError('MongoDB rejected the database credentials. Check the Atlas database user and URL-encoded password in MONGODB_URI, then restart Yoro.',503);
    throw new ServiceError('MongoDB could not connect. Check Atlas Network Access and MONGODB_URI, then restart Yoro. Your local data has not been replaced.',503);
  }
  return mongo.db(process.env.MONGODB_DATABASE || 'voice_coach').collection<{ _id: string; state: State }>('sessions');
}
export async function cloudDatabase(){await collection();return mongo?.db(process.env.MONGODB_DATABASE||'voice_coach')??null;}
type AudioDocument={_id:string;session:string;bytes:Binary;mime:string;expiresAt?:Date};
let audioIndexes:Promise<unknown>|undefined;
async function audioCollection(){
 if(process.env.AUDIO_STORAGE!=='mongodb'){if(process.env.VERCEL)throw new ServiceError('Cloud recording storage is not configured.',503);return null;}
 const db=await cloudDatabase();if(!db)throw new ServiceError('Cloud recording storage is not configured.',503);
 const clips=db.collection<AudioDocument>('recordings');
 audioIndexes??=Promise.all([clips.createIndex({expiresAt:1},{expireAfterSeconds:0}),clips.createIndex({session:1})]).catch(e=>{audioIndexes=undefined;throw e;});
 await audioIndexes;return clips;
}
function audioKey(session:string,id:string){key(session);if(!/^[a-f0-9-]{36}$/.test(id))throw new Error('Invalid audio id');return `${session}:${id}`;}
export async function getState(id: string): Promise<State> {
  key(id); const db = await collection();
  if (db) {const existing=await db.findOne({_id:id});if(existing)return normalizeStoredState(existing.state);
    // First Atlas access migrates this session once; never overwrite a cloud profile.
    let local;try{local=JSON.parse(await readFile(path.join(root,`${id}.json`),'utf8'));}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
    if(local){await db.updateOne({_id:id},{$setOnInsert:{state:normalizeStoredState(local)}},{upsert:true});return normalizeStoredState((await db.findOne({_id:id}))!.state);}
    return initialState();}

  try { return normalizeStoredState(JSON.parse(await readFile(path.join(root, `${id}.json`), 'utf8'))); }
  catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return initialState(); throw e; }
}
async function save(id: string, state: State) {
  const db = await collection();
  if (db) { await db.replaceOne({ _id: id }, { state }, { upsert: true }); return; }
  await mkdir(root, { recursive: true });
  const target = path.join(root, `${key(id)}.json`); const temporary = `${target}.tmp`;
  await writeFile(temporary, JSON.stringify(state), { mode: 0o600 }); await rename(temporary, target);
}
export async function transaction<T>(id: string, fn: (state: State) => Promise<T> | T): Promise<T> {
  key(id); const previous = queues.get(id) ?? Promise.resolve();
  const run = previous.catch(() => {}).then(async () => {
    // A process-local queue is insufficient when serverless requests run on different instances.
    const db=await cloudDatabase(),owner=randomUUID();
    const locks=db?.collection<{_id:string;owner:string;expiresAt:Date}>('session_locks');
    if(locks){try{await locks.updateOne({_id:id,expiresAt:{$lte:new Date()}},{$set:{owner,expiresAt:new Date(Date.now()+330000)}},{upsert:true});}catch(e){if((e as {code?:number}).code===11000)throw new ServiceError('Your previous action is still finishing. Please try again in a moment.',409);throw e;}}
    try{const state = await getState(id); const result = await fn(state);
      if(locks&&!await locks.findOne({_id:id,owner,expiresAt:{$gt:new Date()}}))throw new ServiceError('This action took too long. Please refresh before trying again.',409);
      await save(id, state); return result;
    }finally{await locks?.deleteOne({_id:id,owner});}
  });
  queues.set(id, run);
  try { return await run; } finally { if (queues.get(id) === run) queues.delete(id); }
}
export async function reset(id: string) {
  return transaction(id, async state => { Object.assign(state, initialState()); const clips=await audioCollection();if(clips)await clips.deleteMany({session:key(id)});if(!process.env.VERCEL){if(process.env.MONGODB_URI)await rm(path.join(root,`${key(id)}.json`),{force:true});await rm(path.join(root,'audio',key(id)),{recursive:true,force:true});} });
}
export async function saveAudio(id: string, attemptId: string, bytes: Buffer, mime: string) {
  const _id=audioKey(id,attemptId),clips=await audioCollection();
  if(bytes.length>4*1024*1024)throw new ServiceError('This audio is too large to save. Please use a shorter example.',413);
  if(clips){await clips.replaceOne({_id},{session:id,bytes:new Binary(bytes),mime,expiresAt:new Date(Date.now()+86400000)},{upsert:true});return;}
  const folder = path.join(root, 'audio', key(id)); await mkdir(folder, { recursive: true });
  await writeFile(path.join(folder, `${attemptId}.bin`), bytes, { mode: 0o600 });
  await writeFile(path.join(folder, `${attemptId}.json`), JSON.stringify({ mime, expires: Date.now() + 86400000 }));
}
export async function audio(id: string, attemptId: string) {
  if (!/^[a-f0-9-]{36}$/.test(attemptId)) return null;
  const clips=await audioCollection();if(clips){const item=await clips.findOne({_id:audioKey(id,attemptId)});if(!item)return null;if(item.expiresAt&&item.expiresAt.getTime()<=Date.now()){await clips.deleteOne({_id:item._id});return null;}return {bytes:Buffer.from(item.bytes.buffer),mime:item.mime};}
  const base = path.join(root, 'audio', key(id), attemptId);
  try {
    const meta = JSON.parse(await readFile(`${base}.json`, 'utf8'));
    if (meta.expires !== null && Date.now() > meta.expires) { await Promise.all([rm(`${base}.bin`, { force: true }), rm(`${base}.json`, { force: true })]); return null; }
    return { bytes: await readFile(`${base}.bin`), mime: meta.mime as string };
  } catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null; throw e; }
}

export async function removeAudio(id:string,audioId:string){const _id=audioKey(id,audioId),clips=await audioCollection();if(clips){await clips.deleteOne({_id});return;}const base=path.join(root,'audio',key(id),audioId);await Promise.all([rm(base+'.bin',{force:true}),rm(base+'.json',{force:true})]);}

export async function retainAudio(session:string,id:string,keep:boolean){const clip=await audio(session,id);if(!clip)throw new Error('This recording has expired; record another take to save a comparison.');const clips=await audioCollection();if(clips){await clips.updateOne({_id:audioKey(session,id)},keep?{$unset:{expiresAt:''}}:{$set:{expiresAt:new Date(Date.now()+86400000)}});return;}const file=path.join(root,'audio',key(session),`${id}.json`);await writeFile(file,JSON.stringify({mime:clip.mime,expires:keep?null:Date.now()+86400000}));}
