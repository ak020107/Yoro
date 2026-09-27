'use client';
import { useRef, useState } from 'react';
import type { DeliveryAnalysis, DeliveryEvent } from '@/lib/delivery';

export default function DeliveryReview({ analysis, attemptId, previous }: { analysis: DeliveryAnalysis; attemptId: string; previous?: DeliveryAnalysis }) {
  const player = useRef<HTMLAudioElement>(null);
  const stopAt = useRef<number | null>(null);
  const [error, setError] = useState('');
  async function replay(event: Pick<DeliveryEvent, 'start' | 'end'>) {
    const audio = player.current; if (!audio) return;
    setError('');
    try {
      audio.currentTime = Math.max(0, event.start - 1);
      stopAt.current = event.end + 1;
      await audio.play();
    } catch { stopAt.current = null; setError('Replay is unavailable. Try the full recording player.'); }
  }
  if (analysis.status !== 'available') return <section className="separator"><h3>Delivery measurements</h3><p>{analysis.reason}</p><audio controls src={'/api/audio/'+attemptId} aria-label="Your recording"/></section>;
  const groups=[{kind:'filler',title:'Fillers',count:analysis.fillerCount,description:'Recognized “um”, “uh” and similar sounds. Listen for whether they interrupt your point.',action:'If a filler feels distracting, finish the thought, breathe, then begin the next phrase.'},{kind:'gap',title:'Space between phrases',count:analysis.gapCount,description:'Long gaps between recognized words. They may include useful pauses, breaths or missed speech.',action:'Listen to whether each gap separates ideas or interrupts one. Keep the pauses that help.'},{kind:'repeat',title:'Restarts & repetitions',count:analysis.repeatCount,description:'Repeated words or short phrases. Repetition can be deliberate emphasis.',action:'If a restart loses your point, try one complete sentence before adding the next idea.'}] as const;
  return <section className="recording-moments" aria-label="Delivery measurements">
    <audio ref={player} controls preload="metadata" src={'/api/audio/'+attemptId} aria-label="Delivery evidence playback" onError={()=>setError('This recording has expired or cannot be played.')} onTimeUpdate={()=>{if(player.current&&stopAt.current!==null&&player.current.currentTime>=stopAt.current){player.current.pause();stopAt.current=null;}}}/>
    <div className="timing-cards"><article className="feedback-insight"><span className="eyebrow">PACE</span><h3>{analysis.wordsPerMinute} <small>words/min</small></h3><p>Average over the recognized speech span, including internal gaps. There is no single ideal pace for every conversation.</p>{previous?.status==='available'&&<p>Previous take: {previous.wordsPerMinute} words/min. Faster or slower alone does not mean better.</p>}{analysis.fastestWindow&&<button onClick={()=>replay(analysis.fastestWindow!)}>Hear your quickest stretch · {analysis.fastestWindow.wordsPerMinute} words/min</button>}</article>
    {groups.map(group=><article className="feedback-insight" key={group.kind}><span className="eyebrow">{group.title}</span><h3>{group.count} <small>recognized {group.kind==='gap'?'gaps':'candidates'}</small></h3><p>{group.description}</p>{group.count>0&&<><div className="evidence-clips">{analysis.events.filter(e=>e.kind===group.kind).slice(0,2).map((event,i)=><button key={i} onClick={()=>replay(event)}>↻ {event.quote} · {event.start.toFixed(1)}s</button>)}</div><p>{group.action}</p></>}{group.kind==='filler'&&previous?.status==='available'&&<small>Per 100 words: {previous.fillersPer100} → {analysis.fillersPer100}. Transcription can miss fillers.</small>}</article>)}</div>
    <small>Transcript timing estimates, not emotion or fluency scores. Automatic transcription can miss words; listen before treating a candidate as something to change.</small>
    {error&&<p role="status">{error}</p>}
  </section>;
}
