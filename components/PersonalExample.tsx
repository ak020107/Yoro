'use client';
import {useEffect,useRef,useState} from 'react';
import type {SpeechDirection} from '@/lib/speech-direction';
import type {Emotion} from '@/lib/speech-styles';
export default function PersonalExample({text,emotion='confident',direction}:{text:string;emotion?:Emotion;direction?:SpeechDirection}){
 const [ready,setReady]=useState(false),[busy,setBusy]=useState(false),[url,setUrl]=useState(''),[error,setError]=useState('');const player=useRef<HTMLAudioElement>(null);const controller=useRef<AbortController|null>(null);const epoch=useRef(0);
 useEffect(()=>{let active=true;fetch('/api/personal-voice').then(r=>r.ok?r.json():null).then(v=>{if(active)setReady(v?.status==='ready');}).catch(()=>{});return()=>{active=false;};},[]);
 useEffect(()=>{epoch.current++;controller.current?.abort();setBusy(false);setUrl('');setError('');return()=>{epoch.current++;controller.current?.abort();};},[text,emotion,direction]);useEffect(()=>()=>{if(url)URL.revokeObjectURL(url);},[url]);
 async function hear(){if(url){await player.current?.play().catch(()=>{});return;}setBusy(true);setError('');const version=epoch.current;controller.current=new AbortController();try{const r=await fetch('/api/personal-voice/speech',{method:'POST',signal:controller.current.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({text,emotion,direction})});if(!r.ok)throw Error((await r.json()).error||'Your personal example could not load.');const blob=await r.blob();if(version===epoch.current)setUrl(URL.createObjectURL(blob));}catch(e){if(version===epoch.current&&!controller.current?.signal.aborted)setError((e as Error).message);}finally{if(version===epoch.current)setBusy(false);}}
 if(!ready)return null;
 return <div className="personal-example"><button type="button" className="primary" disabled={busy} onClick={()=>void hear()}>{busy?'Preparing your personal example…':'Hear it in my voice'}</button>{url&&<><audio ref={player} controls src={url} aria-label="AI example in my voice" onPlay={()=>document.querySelectorAll('audio').forEach(a=>{if(a!==player.current)a.pause();})} onLoadedData={()=>{void player.current?.play().catch(()=>{});}}/><small>AI-generated in your cloned voice. A practice example, not a recording of your improvement.</small></>}{error&&<p role="alert" className="notice error">{error}</p>}</div>;
}
