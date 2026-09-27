'use client';
import PersonalVoiceSetup from './PersonalVoiceSetup';
import { useEffect, useRef, useState } from 'react';
import type { Profile } from '@/lib/domain';
import { introductionQuestions } from '@/lib/introduction';
import { Listener } from './Brand';
import { ChoiceTiles, StepPanel } from './ui/interaction';
export default function Introduction({ profile, onSave, onSkip }: { profile: Profile; onSave: (profile: Profile)=>Promise<void>; onSkip: ()=>Promise<void> }) {
 const [voiceSetup,setVoiceSetup]=useState(false);
 const [draft,setDraft]=useState({...profile}); const [step,setStep]=useState(0);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const dialog=useRef<HTMLDialogElement>(null); const title=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{dialog.current?.showModal(); return()=>dialog.current?.close();},[]);
 useEffect(()=>{const t=setTimeout(()=>title.current?.focus(),220);return()=>clearTimeout(t);},[step]);
 async function finish(skip=false){if(busy)return;setBusy(true);setError('');try{if(skip)await onSkip();else await onSave(draft);}catch(e){setError((e as Error).message);setBusy(false);}}
 const question=introductionQuestions[step];
 return <dialog ref={dialog} className="intro-dialog" aria-labelledby="intro-title" onCancel={e=>{e.preventDefault();void finish(true);}}>
 <div className="intro-top"><span>MAKE YORO YOURS</span><button className="text-button" disabled={busy} onClick={()=>void finish(true)}>Skip for now</button></div>
 <div className="intro-progress" aria-label={`Introduction step ${step+1} of 5`}>{[0,1,2,3,4].map(i=><span key={i} className={i<=step?'filled':''}/>)}</div>
 <div className="intro-mascot"><Listener state={busy?'thinking':step===4?'celebrate':'ready'}/><span>A few small things.<br/>A practice that feels more like you.</span></div>
 <StepPanel step={step}><h2 ref={title} tabIndex={-1} id="intro-title">{question?.title || 'Does this sound like you?'}</h2>
 {question ? <><p className="muted">{question.hint}</p><ChoiceTiles label={question.title} items={question.choices.map(s=>({value:s,title:s}))} value={draft[question.field]} disabled={busy} onChange={value=>setDraft({...draft,[question.field]:value})}/><label htmlFor="intro-own">Or use your own words</label><input id="intro-own" value={draft[question.field]} disabled={busy} maxLength={question.field==='intention'?500:1000} onChange={e=>setDraft({...draft,[question.field]:e.target.value})}/></> : <><p className="muted">Only what you told us. Edit any answer before saving.</p><div className="intro-review">{introductionQuestions.map((q,i)=><button disabled={busy} key={q.field} onClick={()=>setStep(i)}><span>{q.field==='workingOn'?'Working on':q.field}</span><strong>{draft[q.field]||'Not chosen yet'}</strong><small>Edit →</small></button>)}</div><label htmlFor="intro-name">What should Yoro call you? (optional)</label><input id="intro-name" maxLength={60} value={draft.name} disabled={busy} onChange={e=>setDraft({...draft,name:e.target.value})}/></>}
 </StepPanel>
 {step===4&&<>{voiceSetup?<PersonalVoiceSetup profile={draft}/>:<button type="button" className="text-button" disabled={busy} onClick={()=>setVoiceSetup(true)}>Optional: hear examples in my own voice</button>}</>}
 {error&&<p role="alert" className="notice error">{error}</p>}
 <div className="intro-actions"><button disabled={busy||step===0} onClick={()=>setStep(s=>s-1)}>Back</button>{step<4?<button className="primary" disabled={busy} onClick={()=>setStep(s=>s+1)}>Continue →</button>:<button className="primary" disabled={busy} onClick={()=>void finish()}>{busy?'Saving…':'Save my direction'}</button>}</div>
 <small>Your choices are optional. You can edit them any time.</small>
 </dialog>;
}
