import {cloudDatabase} from './store';
import {ServiceError} from './provider-request';
let indexed:Promise<unknown>|undefined;
export async function reserveProviderCall(){
 const db=await cloudDatabase();if(!db)throw new ServiceError('Usage protection is unavailable.',503);
 const counters=db.collection<{_id:string;count:number;expiresAt:Date}>('provider_budget');
 indexed??=counters.createIndex({expiresAt:1},{expireAfterSeconds:0}).catch(e=>{indexed=undefined;throw e;});await indexed;
 const configured=Number(process.env.DAILY_PROVIDER_REQUEST_LIMIT||200);
 const limit=Number.isInteger(configured)&&configured>0?configured:200;
 const _id=new Date().toISOString().slice(0,10);
 try{await counters.updateOne({_id,count:{$lt:limit}},{$inc:{count:1},$setOnInsert:{expiresAt:new Date(Date.now()+172800000)}},{upsert:true});}
 catch(e){if((e as {code?:number}).code===11000)throw new ServiceError('Yoro has reached its daily demo allowance. Your progress is saved; please return tomorrow.',429);throw e;}
}
