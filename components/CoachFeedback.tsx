'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Listener, type ListenerState } from './Brand';
import type { Attempt } from '@/lib/domain';

export function TypedReply({text,onRevealing}:{text:string;onRevealing?:(active:boolean)=>void}){
 const reduce=useReducedMotion();const words=text.split(/(\s+)/);const [visible,setVisible]=useState(0);
 useEffect(()=>{setVisible(0);if(reduce)return;const id=setInterval(()=>setVisible(n=>{if(n>=words.length){clearInterval(id);return n;}return n+8;}),35);return()=>clearInterval(id);},[text,reduce,words.length]);
 useEffect(()=>{onRevealing?.(!reduce&&visible<words.length);},[onRevealing,reduce,visible,words.length]);
 useEffect(()=>()=>onRevealing?.(false),[onRevealing]);
 return <p className="typed-reply" role="status" aria-label={text}><span aria-hidden="true">{reduce?text:words.slice(0,visible).join('')}{!reduce&&visible<words.length&&<span className="typing-cursor">▍</span>}</span></p>;
}
export function PendingCoach({comparison=false,label}:{comparison?:boolean;label?:string}){
 const [seconds,setSeconds]=useState(0);const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{root.current?.scrollIntoView({block:'nearest',behavior:'instant'});},[]);
 useEffect(()=>{const timer=setInterval(()=>setSeconds(n=>n+1),1000);return()=>clearInterval(timer);},[]);
 return <div ref={root} className="pending-coach" role="status"><Listener state="thinking"/><div><strong>{label||(comparison?'Let’s hear what changed.':'Let’s listen to your take.')}</strong><p>{seconds<12?'Your request is in progress. You can stay right here.':'This is taking a little longer. Your recording is still here—no need to submit it again.'}</p><span className="thinking-dots" aria-hidden="true"><i/><i/><i/></span><small aria-hidden="true">{seconds}s elapsed</small></div></div>;
}
const labels={closer:'Closer to your intention',steady:'Holding steady',mixed:'A little of both',not_yet:'Not closer yet',uncertain:'Let’s keep listening'};
export default function CoachFeedback({attempt,activity}:{attempt:Attempt;activity?:ListenerState}){
 const reduce=useReducedMotion();const change=attempt.change;const [replyActive,setReplyActive]=useState(false);
 return <div className="coaching-conversation" aria-label="Yoro feedback">
 <div className="feedback-speaker"><Listener state={activity&&activity!=='ready'?activity:replyActive?'responding':change?.outcome==='closer'?'celebrate':change&&change.outcome!=='steady'?'encouraging':'ready'}/><span>Yoro <small>{attempt.source==='preview'?'Authored preview':attempt.source==='measurements'?'Timing-based guidance':attempt.input==='text'?'Wording coaching':'AI listening impression'}</small></span></div>
 <motion.div className="coach-bubble" initial={{opacity:0,y:reduce?0:8}} animate={{opacity:1,y:0}} transition={{duration:reduce?0:.2}}>
 {change&&<span className={`change-label change-${change.outcome}`}>{labels[change.outcome]}</span>}<TypedReply onRevealing={setReplyActive} text={change?.summary||attempt.feedback.summary}/>
 </motion.div>
 {change&&<div className="change-evidence"><p>{change.reason}</p>{change.beforeQuote&&change.afterQuote&&<div className="change-quotes">{change.beforeQuote===change.afterQuote?<div><small>LISTEN FOR THESE WORDS IN BOTH TAKES</small><q>{change.beforeQuote}</q></div>:<><div><small>FIRST TAKE · WORDS TO LISTEN FOR</small><q>{change.beforeQuote}</q></div><div><small>THIS TAKE · WORDS TO LISTEN FOR</small><q>{change.afterQuote}</q></div></>}</div>}<small>A comparison of these takes toward your goal, not a permanent voice score.</small></div>}
 {attempt.comparisonNote&&<p className="muted">{attempt.comparisonNote}</p>}
 {attempt.feedback.strength&&<motion.div className="coach-followup" initial={{opacity:0}} animate={{opacity:1}} transition={{delay:reduce?0:.4}}><span className="eyebrow">KEEP THIS</span><p>{attempt.feedback.strength}</p></motion.div>}
 {attempt.feedback.adjustment&&<motion.div className="coach-followup" initial={{opacity:0}} animate={{opacity:1}} transition={{delay:reduce?0:.7}}><span className="eyebrow">ONE THING TO TRY</span><p>{attempt.feedback.adjustment}</p></motion.div>}
 {attempt.feedback.observation&&<article className="feedback-insight"><span className="eyebrow">A MOMENT TO NOTICE</span><blockquote>“{attempt.feedback.observation.quote}”</blockquote><p>{attempt.feedback.observation.explanation}</p></article>}
 {Boolean(attempt.feedback.insights?.length)&&<section className="feedback-insights" aria-label="Detailed coaching">{attempt.feedback.insights?.map(i=><article className="feedback-insight" key={i.category}><div className="row"><h3>{{expression:'Expression & intention',enunciation:'Clarity & enunciation',wording:'Your choice of words',structure:'Shape of your message'}[i.category]}</h3><span className="badge">{i.kind==='keep'?'Keep this':'Try this'}</span></div><blockquote>“{i.quote}”</blockquote><p>{i.observation}</p>{i.action&&<div className="insight-action"><strong>{i.kind==='keep'?'Carry it forward':'On your next take'}</strong><p>{i.action}</p></div>}<small>{['expression','enunciation'].includes(i.category)?'AI listening impression, not a measurement of your emotions or identity.':'Based on the words in your transcript.'}</small></article>)}</section>}
 </div>;
}
