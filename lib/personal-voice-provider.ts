import 'server-only';
import { z } from 'zod';
import { providerRequest, ServiceError } from './provider-request';
import { speechPayload, type Emotion } from './speech-styles';
function headers(){if(process.env.PROVIDER_MODE!=='live'||!process.env.ELEVENLABS_API_KEY)throw new ServiceError('Personal voice setup needs a live ElevenLabs connection.');return {'xi-api-key':process.env.ELEVENLABS_API_KEY};}
export async function createPersonalVoice(requestId:string,bytes:Buffer){
 const form=new FormData();form.set('name','Yoro personal '+requestId);form.set('description','Private, owner-authorized Yoro practice voice.');form.set('remove_background_noise','false');form.append('files',new Blob([new Uint8Array(bytes)],{type:'audio/wav'}),'voice-sample.wav');
 const res=await providerRequest('https://api.elevenlabs.io/v1/voices/add',{method:'POST',headers:headers(),body:form});
 return z.object({voice_id:z.string().min(1),requires_verification:z.boolean()}).parse(await res.json());
}
export async function recoverPersonalVoice(requestId:string){
 const res=await providerRequest('https://api.elevenlabs.io/v2/voices?search='+encodeURIComponent('Yoro personal '+requestId),{headers:headers()});
 const data=await res.json();return z.array(z.object({name:z.string(),voice_id:z.string()})).parse(data.voices).filter(v=>v.name==='Yoro personal '+requestId);
}
export async function deletePersonalVoiceId(id:string){
 try{await providerRequest('https://api.elevenlabs.io/v1/voices/'+encodeURIComponent(id),{method:'DELETE',headers:headers()});}
 catch(e){if(e instanceof ServiceError&&e.message.includes('could not find'))return;throw e;}
}
export async function personalSpeech(id:string,text:string,emotion:Emotion,direction?:import('./speech-direction').SpeechDirection){
 const payload=speechPayload(text,emotion,'natural',direction);
 // Keep stability in v3's Natural range while prioritizing the enrolled identity.
 payload.voice_settings.similarity_boost=.85;
 const res=await providerRequest('https://api.elevenlabs.io/v1/text-to-speech/'+encodeURIComponent(id),{method:'POST',headers:{...headers(),'Content-Type':'application/json'},body:JSON.stringify(payload)});
 return Buffer.from(await res.arrayBuffer());
}
