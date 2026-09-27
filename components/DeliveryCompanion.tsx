'use client';
import PersonalExample from './PersonalExample';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Listener, Icon } from './Brand';
import { PendingCoach, TypedReply } from './CoachFeedback';
import Introduction from './Introduction';
import { needsIntroduction, type IntroductionStatus } from '@/lib/introduction';
import { starterPlan, type DeliveryPlan, type Discovery, type DiscoveryTurn } from '@/lib/discovery';
import type { Attempt, Profile } from '@/lib/domain';

type Props = {saved?:Discovery; profile:Profile; introduction?:IntroductionStatus; attempts:Attempt[]; voice:string; speech:boolean; live:boolean; refresh:()=>Promise<void>; practice:(plan:DeliveryPlan,turnId?:string)=>ReactNode; initialMessage?:string; inspirationKey?:number};
export default function DeliveryCompanion({saved,profile,introduction,attempts,voice,speech,live,refresh,practice,initialMessage='',inspirationKey=0}:Props){
 const [turns,setTurns]=useState(saved?.turns||[]);const [message,setMessage]=useState(initialMessage);
 const [starter,setStarter]=useState(false);const [rehearsing,setRehearsing]=useState(false);const [showEarlier,setShowEarlier]=useState(false);
 const [replyActive,setReplyActive]=useState(false);
 const [playing,setPlaying]=useState(false);
 const [busy,setBusy]=useState(false);const [speaking,setSpeaking]=useState(false);const [error,setError]=useState('');const [audioUrl,setAudioUrl]=useState('');
 const [introducing,setIntroducing]=useState(false);const [introduced,setIntroduced]=useState(false);
 const player=useRef<HTMLAudioElement>(null);const composer=useRef<HTMLTextAreaElement>(null);const practiceRef=useRef<HTMLDivElement>(null);const latestRef=useRef<HTMLDivElement>(null);
 const controller=useRef<AbortController|null>(null);const requestId=useRef('');const alive=useRef(true);const reduce=useReducedMotion();
 const latest=turns.at(-1);const plan=starter?starterPlan:latest?.plan;
 const recentPractice=latest?attempts.filter(a=>a.discoveryId===latest.id).at(-1):undefined;
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;controller.current?.abort();};},[]);
 useEffect(()=>()=>{if(audioUrl)URL.revokeObjectURL(audioUrl);},[audioUrl]);
 useEffect(()=>{if(rehearsing)practiceRef.current?.scrollIntoView({behavior:reduce?'instant':'smooth',block:'start'});},[rehearsing,reduce]);
 useEffect(()=>{if(initialMessage){setMessage(initialMessage);requestId.current=crypto.randomUUID();composer.current?.focus();composer.current?.scrollIntoView({behavior:'instant',block:'center'});}},[initialMessage,inspirationKey]);
 function edit(value:string){setMessage(value);requestId.current=crypto.randomUUID();}
 async function sendMessage(){
  if(busy||!message.trim())return;setBusy(true);setError('');player.current?.pause();controller.current=new AbortController();
  requestId.current ||= crypto.randomUUID();
  try{
   const response=await fetch('/api/discovery',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.current.signal,body:JSON.stringify({message,requestId:requestId.current})});
   const value=await response.json();if(!response.ok)throw new Error(value.error||'Your request could not be answered.');if(!alive.current)return;
   setTurns(t=>[...t,value].slice(-12));setMessage('');requestId.current='';setStarter(false);setRehearsing(false);setAudioUrl('');
   try{await refresh();}catch{if(alive.current)setError('Your conversation was saved. The rest of the app could not refresh yet.');}
   requestAnimationFrame(()=>latestRef.current?.scrollIntoView({behavior:reduce?'instant':'smooth',block:'nearest'}));
  }catch(e){if(alive.current&&!controller.current?.signal.aborted)setError((e as Error).message);}finally{if(alive.current)setBusy(false);}
 }
 function send(e:React.FormEvent){e.preventDefault();if(needsIntroduction(profile,introduction)&&!introduced){setIntroducing(true);return;}void sendMessage();}
 async function finishIntroduction(next?:Profile){
  const response=await fetch('/api/introduction',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(next?{status:'complete',profile:next}:{status:'skipped'})});
  if(!response.ok)throw new Error((await response.json()).error||'Could not save your introduction.');
  setIntroduced(true);setIntroducing(false);void refresh().catch(()=>{});void sendMessage();
 }
 async function hear(){
  if(!plan||busy||speaking)return;if(audioUrl){try{await player.current?.play();}catch{setError('Tap play on the audio player.');}return;}
  setSpeaking(true);setError('');controller.current=new AbortController();
  try{const response=await fetch('/api/speech',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.current.signal,body:JSON.stringify({text:plan.sentence,emotion:plan.emotion,intensity:plan.intensity,preset:voice})});if(!response.ok)throw new Error((await response.json()).error||'The voice example is unavailable.');const blob=await response.blob();if(alive.current)setAudioUrl(URL.createObjectURL(blob));}
  catch(e){if(alive.current&&!controller.current?.signal.aborted)setError((e as Error).message);}finally{if(alive.current)setSpeaking(false);}
 }
 function exchange(t:DiscoveryTurn){return <><p className="companion-you"><span>You</span>{t.message}</p><div className="companion-reply"><span>Yoro</span><TypedReply onRevealing={t.id===latest?.id?setReplyActive:undefined} text={t.reply||t.plan?.reply||''}/>{t.wording&&<div className="wording-revision"><span className="eyebrow">SAME MEANING, A CLEARER WAY IN</span><p className="original-wording">{t.wording.original}</p><blockquote>{t.wording.revised}</blockquote><small>{t.wording.reason}</small></div>}</div></>;}
 return <section className="delivery-companion" aria-label="Talk with Yoro">
  <div className="companion-intro"><Listener priority state={busy||speaking?'thinking':playing?'speaking':replyActive?'responding':'ready'}/><div><span className="eyebrow">YOUR COMPANION, ONE CONVERSATION AT A TIME</span><h1>{turns.length?'Let’s keep going.':'What’s on your mind?'}</h1><p>Find your words. Try a delivery. Talk it through.</p></div></div>
  {turns.length>6&&<button className="text-button" aria-expanded={showEarlier} onClick={()=>setShowEarlier(v=>!v)}>{showEarlier?'Show less':'Earlier in our conversation'}</button>}
  {turns.length>1&&<div className="companion-thread">{(showEarlier?turns.slice(0,-1):turns.slice(-6,-1)).map(t=><div key={t.id}>{exchange(t)}</div>)}</div>}
  <div className="companion-thread" aria-label="Your conversation" ref={latestRef}>
  <AnimatePresence initial={false} mode="wait">{latest&&<motion.div key={latest.id} initial={{opacity:0,y:reduce?0:10}} animate={{opacity:1,y:0}} transition={{duration:reduce?0:.2}}>{exchange(latest)}</motion.div>}</AnimatePresence>
  {!latest&&<p className="companion-opening">“I know what I mean, but I don’t always know how to say it.”<br/><span>We can start right there.</span></p>}
  {plan&&<motion.div layout={!reduce} className="companion-next"><span className="eyebrow">{starter?'STARTER EXERCISE · NOT PERSONALIZED':'A SMALL THING TO TRY'}</span>{starter&&<p>{plan.reply}</p>}<h2>{plan.goal}</h2><blockquote>{plan.sentence}</blockquote><p>{plan.cue}</p><div className="row"><button disabled={busy||speaking||!speech||!live} onClick={()=>void hear()}><Icon name="headphones" size={18}/> {speaking?'Preparing your example…':audioUrl?'Listen again':'Hear an example'}</button><button className="primary" disabled={busy||speaking} onClick={()=>{player.current?.pause();setRehearsing(true);}}>Try it in my voice <Icon name="mic" size={18}/></button></div><PersonalExample text={plan.sentence} emotion={plan.emotion}/>{audioUrl&&<audio ref={player} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>setPlaying(false)} controls src={audioUrl} aria-label="Your delivery example" onLoadedData={()=>{void player.current?.play().catch(()=>{});}}/>}<small>An AI coach-voice example. Tell me if the delivery doesn’t fit.</small></motion.div>}
  {rehearsing&&plan&&<div ref={practiceRef} className="companion-rehearsal" key={JSON.stringify(plan)}><button className="text-button" onClick={()=>{setRehearsing(false);composer.current?.focus();}}>← Back to our conversation</button>{practice(plan,starter?undefined:latest?.id)}</div>}
  {recentPractice&&!rehearsing&&<div className="practice-return"><span className="eyebrow">FROM YOUR PRACTICE</span><p>{recentPractice.change?.summary || recentPractice.feedback.strength || recentPractice.feedback.summary}{recentPractice.feedback.adjustment && <span className="practice-next-cue">Next time: {recentPractice.feedback.adjustment}</span>}</p><small>Saved coaching · {recentPractice.source==='preview'?'authored preview':recentPractice.source==='measurements'?'timing-based exercise':'AI feedback'}. What felt useful, or didn’t feel like you?</small></div>}
  </div>
  <form className="companion-composer" onSubmit={send}><label htmlFor="delivery-request">{turns.length?'Keep talking with Yoro':'Tell Yoro what you have in mind'}</label><textarea ref={composer} id="delivery-request" rows={2} maxLength={1500} value={message} disabled={busy||speaking} onChange={e=>edit(e.target.value)} placeholder={turns.length?'That sounds a little formal. Can we make it more like me?':'A moment you’re preparing for, or words you want help with…'}/><button className="primary" disabled={busy||speaking||!message.trim()}>{busy?'Yoro is thinking…':'Send'}<Icon name="arrow" size={18}/></button></form>
  {busy&&<PendingCoach label="I’m working on your reply…"/>}
  {error&&<p className="notice error" role="alert">{error} Your draft is kept.</p>}
  {(!plan||error)&&<button className="text-button" disabled={busy||speaking} onClick={()=>{setStarter(true);setRehearsing(false);setAudioUrl('');}}>Try a starter introduction</button>}
  {introducing&&<Introduction profile={profile} onSave={finishIntroduction} onSkip={()=>finishIntroduction()}/>}
 </section>;
}
