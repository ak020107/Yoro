'use client';
import {useEffect,useRef,useState} from 'react';
import type {SpeechDirection} from '@/lib/speech-direction';
import type {Emotion} from '@/lib/speech-styles';
import PersonalExample from './PersonalExample';
export default function LessonExample({text,emotion,preset='default',direction}:{text:string;emotion:Emotion;preset?:string;direction?:SpeechDirection}){
 const [url,setUrl]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');const controller=useRef<AbortController|null>(null);const player=useRef<HTMLAudioElement>(null);
 useEffect(()=>{setUrl('');setBusy(false);setError('');return()=>controller.current?.abort();},[text,emotion,preset,direction]);useEffect(()=>()=>{if(url)URL.revokeObjectURL(url);},[url]);
 async function hear(){if(url){void player.current?.play();return;}setBusy(true);setError('');const c=new AbortController();controller.current=c;try{const r=await fetch('/api/speech',{method:'POST',signal:c.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({text,emotion,preset,intensity:'natural',direction})});if(!r.ok)throw Error((await r.json()).error||'The example is unavailable.');const blob=await r.blob();if(!c.signal.aborted)setUrl(URL.createObjectURL(blob));}catch(e){if(!c.signal.aborted)setError((e as Error).message);}finally{if(!c.signal.aborted)setBusy(false);}}
 return <div className="lesson-examples"><button disabled={busy} onClick={()=>void hear()}>{busy?'Preparing the example…':'Hear the coach example'}</button>{url&&<audio ref={player} controls src={url} aria-label="Coach lesson example" onLoadedData={()=>{void player.current?.play().catch(()=>{});}} onPlay={()=>document.querySelectorAll('audio').forEach(a=>{if(a!==player.current)a.pause();})}/>}<PersonalExample text={text} emotion={emotion} direction={direction}/>{error&&<p role="alert">{error}</p>}</div>;
}
