'use client';
import { useEffect, useRef, useState } from 'react';
import type { Attempt } from '@/lib/domain';
import { practiceMoment } from '@/lib/practice-moment';
import { Icon, type ListenerState } from './Brand';

export default function PhraseCoach({ attempt, enabled, onActivity }: { attempt: Attempt; enabled: boolean; onActivity?: (state:ListenerState)=>void }) {
  const activity=useRef(onActivity);activity.current=onActivity;
  useEffect(()=>()=>activity.current?.('ready'),[]);
  const moment = practiceMoment(attempt);
  const audio = useRef<HTMLAudioElement>(null);
  const demo = useRef<HTMLAudioElement | null>(null);
  const abort = useRef<AbortController | null>(null);
  const url = useRef('');
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => () => { abort.current?.abort(); demo.current?.pause(); if (url.current) URL.revokeObjectURL(url.current); if (stopTimer.current) clearTimeout(stopTimer.current); }, []);
  useEffect(() => {
    const pauseDemo = (event: Event) => { if (event.target !== audio.current) { demo.current?.pause(); audio.current?.pause(); if (stopTimer.current) clearTimeout(stopTimer.current); } };
    document.addEventListener('play', pauseDemo, true);
    return () => document.removeEventListener('play', pauseDemo, true);
  }, []);
  function quiet() { document.querySelectorAll('audio').forEach(a => a.pause()); demo.current?.pause(); if (stopTimer.current) clearTimeout(stopTimer.current); setPlaying(false); activity.current?.('ready'); }
  async function replay() {
    if (!audio.current) return;
    if (playing) { quiet(); return; }
    quiet(); setError('');
    const a = audio.current;
    try {
      a.currentTime = moment?.range?.start ?? 0;
      await a.play(); setPlaying(true);
      if (moment?.range) stopTimer.current = setTimeout(() => { a.pause(); setPlaying(false); }, (moment.range.end - moment.range.start) * 1000);
    } catch { setError('This recording could not play. It may have expired; try a new recording.'); }
  }
  async function demonstrate() {
    quiet(); setError(''); setBusy(true); activity.current?.('thinking'); abort.current = new AbortController();
    try {
      if (!url.current) {
        const response = await fetch('/api/phrase-demo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: attempt.id }), signal: abort.current.signal });
        if (!response.ok) throw new Error((await response.json()).error || 'The demonstration is unavailable.');
        const blob = await response.blob(); if (abort.current.signal.aborted) return;
        url.current = URL.createObjectURL(blob);
      }
      demo.current = new Audio(url.current);demo.current.onplay=()=>activity.current?.('speaking');demo.current.onpause=()=>activity.current?.('ready');demo.current.onended=()=>activity.current?.('ready'); demo.current.onerror = () => {activity.current?.('ready');setError('The example could not play. Try again.');}; await demo.current.play();
    } catch (e) { activity.current?.('ready'); if (!abort.current.signal.aborted) setError((e as Error).message); }
    finally { if (!abort.current.signal.aborted) setBusy(false); }
  }
  if (!moment || attempt.input !== 'audio') return null;
  return <div className="phrase-coach">
    <span className="eyebrow">YOUR MOMENT · TAP TO LISTEN</span>
    <button className="phrase-replay" aria-label={moment.range ? 'Replay highlighted phrase' : 'Replay full recording'} aria-pressed={playing} onClick={() => void replay()}><Icon name="play"/><span>{moment.quote}</span></button>
    <audio ref={audio} src={`/api/audio/${attempt.id}`} preload="metadata" onPlay={()=>activity.current?.('listening')} onPause={() => {setPlaying(false);activity.current?.('ready');}} onEnded={() => {setPlaying(false);activity.current?.('ready');}} onTimeUpdate={() => { if (moment.range && audio.current && audio.current.currentTime >= moment.range.end) { audio.current.pause(); setPlaying(false); } }} onError={() => setError('Recording unavailable or expired. Your feedback is still saved.')} />
    <small>{moment.range ? 'Replays the timestamped excerpt from your recording.' : 'Exact phrase timing is unavailable. Plays your full recording.'}</small>
    <button className="demo-pill" disabled={busy || !enabled} onClick={() => void demonstrate()}><Icon name="headphones" size={18}/>{busy ? 'Preparing your example…' : 'Hear a welcoming version'}</button>
    <small>Same words, coach voice. An AI example of welcoming delivery—not a corrected copy of your voice.</small>
    {error && <p className="notice error" role="alert">{error}</p>}
  </div>;
}
