import {directionSchema,directedWords} from './speech-direction';
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { getState, transaction, saveAudio, audio, removeAudio } from './store';
import { publicVoice, auditionText } from './personal-voice';
import { inspectVoiceSample } from './voice-sample';
import { createPersonalVoice, recoverPersonalVoice, deletePersonalVoiceId, personalSpeech } from './personal-voice-provider';
import { ServiceError } from './provider-request';
import { emotionIds } from './speech-styles';
import {storeEnrollmentChunk,assembledEnrollment,clearEnrollment} from './enrollment-upload';
const json=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function clearPersonalVoice(session:string){
 await transaction(session,async state=>{const v=state.personalVoice;if(!v)return;
 if(v.status==='creating'&&Date.now()-Date.parse(v.createdAt)<120000)throw new ServiceError('Voice creation is still in progress. Wait before deleting.',409);
 const ids=v.providerId?[v.providerId]:(await recoverPersonalVoice(v.requestId)).map(x=>x.voice_id);
 for(const id of ids)await deletePersonalVoiceId(id);
 for(const id of v.demoIds)await removeAudio(session,id);
 state.personalVoice=null;
 });
}
export async function handlePersonalVoice(req:NextRequest,session:string,action:string){
 if(req.method==='GET'&&action==='personal-voice')return json(publicVoice((await getState(session)).personalVoice));
 if(req.method==='DELETE'&&action==='personal-voice'){await clearPersonalVoice(session);return json({ok:true});}
 if(req.method==='POST'&&action==='personal-voice/upload'){
  const form=await req.formData(),requestId=z.string().uuid().parse(form.get('requestId'));
  if(form.get('consent')!=='true')throw new ServiceError('Confirm consent before uploading your voice sample.',400);
  if((await getState(session)).personalVoice)throw new ServiceError('A personal voice is already being set up.',409);
  const file=form.get('audio');if(!(file instanceof File))throw new ServiceError('Missing sample.',422);
  await storeEnrollmentChunk(session,requestId,Number(form.get('index')),Number(form.get('total')),Buffer.from(await file.arrayBuffer()));return json({ok:true});
 }
 if(req.method==='POST'&&action==='personal-voice'){
  const form=await req.formData();const requestId=z.string().uuid().parse(form.get('requestId'));
  if(form.get('consent')!=='true')throw new ServiceError('Confirm that this is your own voice and that you want ElevenLabs to create your personal clone.',400);
  const chunked=form.get('chunked')==='true',file=form.get('audio');if(!chunked&&(!(file instanceof File)||file.size>8*1024*1024))throw new ServiceError('Choose a voice sample under 8 MB.',422);
  const bytes=chunked?await assembledEnrollment(session,requestId):Buffer.from(await(file as File).arrayBuffer());
  if(chunked)await clearEnrollment(session,requestId);
  try{inspectVoiceSample(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));}catch(e){throw new ServiceError((e as Error).message,422);}
  const reserved=await transaction(session,state=>{if(state.personalVoice)return false;state.personalVoice={requestId,status:'creating',createdAt:new Date().toISOString(),consentVersion:'1',demoIds:[]};return true;});
  if(!reserved)return json(publicVoice((await getState(session)).personalVoice));
  try{const result=await createPersonalVoice(requestId,bytes);return await transaction(session,state=>{const v=state.personalVoice!;v.providerId=result.voice_id;v.status='preview';v.error=result.requires_verification?'ElevenLabs requires voice verification. Complete it in your ElevenLabs account, then try the audition.':undefined;return json(publicVoice(v));});}
  catch(e){return await transaction(session,state=>{state.personalVoice!.status='review';state.personalVoice!.error=(e as Error).message+' Check connection permissions (Voices read/write) and your cloning plan. Use Check setup before trying again.';return json(publicVoice(state.personalVoice));});}
 }
 if(req.method!=='POST')return json({error:'Not found.'},404);
 const raw=await req.text();if(raw.length>4000)throw new ServiceError('Input is too long.',413);const body=raw?JSON.parse(raw):{};
 return await transaction(session,async state=>{
  const v=state.personalVoice;if(!v)throw new ServiceError('Create your personal voice in My Voice first.',404);
  if(action==='personal-voice/recover'){
   if(v.status==='creating'&&Date.now()-Date.parse(v.createdAt)<120000)throw new ServiceError('Your voice is still being created. Wait a moment.',409);
   if(!v.providerId){const found=await recoverPersonalVoice(v.requestId);if(found.length!==1)throw new ServiceError('Setup could not be confirmed. Check the ElevenLabs Voices page, then remove this setup before creating a new one.',409);v.providerId=found[0].voice_id;v.status='preview';v.error=undefined;}
   return json(publicVoice(v));
  }
  if(action==='personal-voice/accept'){
   if(!v.previewed||!v.providerId)throw new ServiceError('Listen to your audition before accepting the voice.',409);
   if(body.accept!==true)throw new ServiceError('Confirm the voice sounds like you.',400);
   v.status='ready';v.acceptedAt=new Date().toISOString();return json(publicVoice(v));
  }
  if(!['personal-voice/audition','personal-voice/speech'].includes(action))return json({error:'Not found.'},404);
  const audition=action.endsWith('/audition');if(!v.providerId||(!audition&&v.status!=='ready'))throw new ServiceError('Audition and accept your voice in My Voice first.',409);
  const text=audition?auditionText:z.string().trim().min(1).max(650).regex(/^[^\[\]<>]*$/).parse(body.text);
  const emotion=audition?'neutral':z.enum(emotionIds).parse(body.emotion);
  const direction=audition?undefined:directionSchema.optional().parse(body.direction);try{directedWords(text,direction);}catch{throw new ServiceError('Directions must match the example words.',422);}
  const hash=createHash('sha256').update(JSON.stringify(['personal-v2',v.providerId,text,emotion,direction])).digest('hex');
  const id=hash.slice(0,8)+'-'+hash.slice(8,12)+'-'+hash.slice(12,16)+'-'+hash.slice(16,20)+'-'+hash.slice(20,32);
  const cached=await audio(session,id);const bytes=cached?.bytes||await personalSpeech(v.providerId,text,emotion,direction);
  if(!cached)await saveAudio(session,id,bytes,'audio/mpeg');if(!v.demoIds.includes(id))v.demoIds.push(id);
  if(audition){v.previewed=true;v.error=undefined;}
  return new NextResponse(new Uint8Array(bytes),{headers:{'Content-Type':'audio/mpeg','Cache-Control':'no-store'}});
 });
}
