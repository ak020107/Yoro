import 'server-only';
import {Binary} from 'mongodb';
import {cloudDatabase} from './store';
import {ServiceError} from './provider-request';

// One bounded upload slot per session; incomplete samples expire automatically.
const chunkSize=2500000,maxBytes=7200044;
type Chunk={_id:string;session:string;requestId:string;index:number;total:number;bytes:Binary;expiresAt:Date};
let indexReady:Promise<unknown>|undefined;
async function chunks(){const db=await cloudDatabase();if(!db)throw new ServiceError('Cloud upload storage is unavailable.',503);const c=db.collection<Chunk>('voice_uploads');indexReady??=c.createIndex({expiresAt:1},{expireAfterSeconds:0}).catch(e=>{indexReady=undefined;throw e;});await indexReady;return c;}
export async function storeEnrollmentChunk(session:string,requestId:string,index:number,total:number,bytes:Buffer){
 if(!Number.isInteger(total)||total<1||total>3||!Number.isInteger(index)||index<0||index>=total||!bytes.length||bytes.length>chunkSize)throw new ServiceError('Invalid voice sample upload.',422);
 const c=await chunks();await c.replaceOne({_id:`${session}:${index}`},{session,requestId,index,total,bytes:new Binary(bytes),expiresAt:new Date(Date.now()+900000)},{upsert:true});
}
export async function assembledEnrollment(session:string,requestId:string){
 const c=await chunks();const parts=await c.find({session,requestId,expiresAt:{$gt:new Date()}}).sort({index:1}).toArray();
 if(!parts.length||parts.length!==parts[0].total||parts.some((part,index)=>part.index!==index||part.total!==parts.length))throw new ServiceError('Your sample upload is incomplete or expired. Please try again.',422);
 const bytes=Buffer.concat(parts.map(p=>Buffer.from(p.bytes.buffer)));if(bytes.length>maxBytes)throw new ServiceError('Voice sample is too long.',413);return bytes;
}
export async function clearEnrollment(session:string,requestId:string){await(await chunks()).deleteMany({session,requestId});}
