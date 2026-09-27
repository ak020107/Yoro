'use client';
import { useEffect, useRef, useState } from 'react';
import { latestLessonRun } from '@/lib/practice-moment';
import CoachFeedback, { PendingCoach } from './CoachFeedback';
import KeepComparison from './KeepComparison';
import PersonalExample from './PersonalExample';
import PhraseCoach from './PhraseCoach';
import Recorder, { type Recording } from './Recorder';
import { Listener, Icon, type ListenerState } from './Brand';
import { welcomeLesson as lesson, type GuidedPractice } from '@/lib/guided-lesson';
import type { Attempt, Profile } from '@/lib/domain';

type Step = 'listen' | 'notice' | 'first' | 'review' | 'retry' | 'compare' | 'transfer' | 'finish';
type Props = { savedAttempts: Attempt[]; profile: Profile; capabilities: { mode: string; speech: boolean; gemini: boolean; transcription: boolean }; refresh: () => Promise<void> };
const progress: Record<Step, number> = { listen: 0, notice: 1, first: 2, review: 3, retry: 3, compare: 4, transfer: 4, finish: 5 };

export default function GuidedLesson({ savedAttempts, profile, capabilities, refresh }: Props) {
  const [restored] = useState(() => latestLessonRun(savedAttempts));
  const [step, setStep] = useState<Step>(() => restored.at(-1)?.guided?.stage === 'first' ? 'review' : restored.at(-1)?.guided?.stage === 'retry' ? 'compare' : restored.at(-1)?.guided?.stage === 'transfer' ? 'finish' : 'listen');
  const [clips, setClips] = useState<(string | null)[]>([null, null]);
  const [heard, setHeard] = useState<boolean[]>([false, false]);
  const [choice, setChoice] = useState('');
  const [recording, setRecording] = useState<Recording | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>(restored);
  const [reflection, setReflection] = useState(restored.at(-1)?.reflection || '');
  const [feedbackActivity,setFeedbackActivity]=useState<ListenerState>('ready');
  const [micActive,setMicActive]=useState(false);
  const [playing,setPlaying]=useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saveNote, setSaveNote] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const player = useRef<HTMLAudioElement | null>(null);
  const urls = useRef<string[]>([]);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const requestId = useRef('');
  const live = capabilities.mode === 'live' && capabilities.gemini && capabilities.transcription;
  const current = attempts.at(-1);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); player.current?.pause(); urls.current.forEach(URL.revokeObjectURL); }; }, []);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [step]);
  function move(next: Step) { player.current?.pause(); setError(''); setStep(next); }
  function capture(next: 'first' | 'retry' | 'transfer') { setRecording(null); requestId.current = ''; move(next); }
  function onRecording(value: Recording | null) { setRecording(value); requestId.current = crypto.randomUUID(); }
  async function playClip(url: string, index: number) {
    const audio = new Audio(url); player.current = audio;
    audio.onplay = () => { if(mounted.current)setPlaying(true); };
    audio.onpause = () => { if(mounted.current)setPlaying(false); };
    audio.onended = () => { if(mounted.current)setPlaying(false); if (mounted.current) setHeard(h => h.map((v, i) => i === index || v)); };
    audio.onerror = () => { if (mounted.current) setError('This example could not play. Try again or continue with the written cue.'); };
    try { await audio.play(); } catch { if (mounted.current) setError('Your example is ready. Tap Play to hear it.'); }
  }
  async function play(index: number) {
    setError(''); player.current?.pause();
    if (clips[index]) {
      await playClip(clips[index], index);
      return;
    }
    setBusy(true); controller.current = new AbortController();
    try {
      const response = await fetch('/api/speech', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.current.signal,
        body: JSON.stringify({ text: lesson.sentence, emotion: index === 0 ? 'neutral' : 'warm', preset: profile.voicePreset, intensity: 'expressive' }) });
      if (!response.ok) throw new Error((await response.json()).error || 'The example is unavailable.');
      const blob = await response.blob(); if (!mounted.current) return;
      const url = URL.createObjectURL(blob); urls.current.push(url); setClips(c => c.map((v, i) => i === index ? url : v));
      await playClip(url, index);
    } catch (e) { if (mounted.current && !(e instanceof DOMException && e.name === 'AbortError')) setError((e as Error).message); }
    finally { if (mounted.current) setBusy(false); }
  }
  async function submit() {
    if (!recording || busy) return;
    setBusy(true); setError(''); controller.current = new AbortController();
    const stage = step as GuidedPractice['stage'];
    const form = new FormData(); form.set('requestId', requestId.current); form.set('kind', 'delivery');
    form.set('guided', JSON.stringify({ id: lesson.id, stage }));
    form.set('audio', recording.blob, 'lesson-recording'); form.set('duration', String(recording.duration));
    if (stage !== 'first' && current) form.set('parentId', current.id);
    try {
      const response = await fetch('/api/attempts', { method: 'POST', body: form, signal: controller.current.signal });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Please try again.');
      if (!mounted.current) return;
      setAttempts(a => [...a, result]); move(stage === 'first' ? 'review' : stage === 'retry' ? 'compare' : 'finish');
      try { await refresh(); } catch { if (mounted.current) setSaveNote('Your recording was saved. The history view could not refresh yet.'); }
    } catch (e) { if (mounted.current && !(e instanceof DOMException && e.name === 'AbortError')) setError((e as Error).message); }
    finally { if (mounted.current) setBusy(false); }
  }
  async function reflect(value: string) {
    if (!current || busy) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/reflection', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: current.id, choice: value }) });
      if (!response.ok) throw new Error('Your choice could not be saved. Please try again.');
      if (mounted.current) setReflection(value);
    } catch (e) { if (mounted.current) setError((e as Error).message); }
    finally { if (mounted.current) setBusy(false); }
  }
  function singlePlayer(event: React.SyntheticEvent<HTMLAudioElement>) {
    player.current?.pause();
    event.currentTarget.closest('.guided-lesson')?.querySelectorAll('audio').forEach(a => { if (a !== event.currentTarget) a.pause(); });
  }
  const titles: Record<Step, string> = { listen: 'Same words. Different welcome.', notice: 'Let one word carry the feeling.', first: 'Your turn. Welcome someone in.', review: 'Here’s what I noticed.', retry: 'Keep your voice. Try one change.', compare: 'Which feels more like you?', transfer: 'Take it into a new moment.', finish: 'You put it into practice.' };
  const feedback = current && <div className="lesson-feedback"><CoachFeedback activity={feedbackActivity} key={'feedback-'+current.id} attempt={current}/>{step!=='compare'&&current.feedback.observation&&<PhraseCoach onActivity={setFeedbackActivity} key={current.id} attempt={current} enabled={capabilities.speech && capabilities.mode==='live'}/>}</div>;
  return <section className="guided-lesson" aria-label="Guided welcome lesson">
    <div className="lesson-top"><span>WARMTH · LESSON 01</span><span>{progress[step] === 5 ? 'Practice complete' : `${progress[step] + 1} / 5`}</span></div>
    <progress max={5} value={progress[step]} aria-label="Lesson progress" />
    {!busy&&!['review','compare','finish'].includes(step)&&<div className="lesson-coach"><Listener state={micActive?'listening':busy?'thinking':playing?'speaking':step==='finish'?'celebrate':'ready'} /><p>{step === 'listen' ? 'Imagine someone arriving at a party. How would you help them feel included?' : step === 'finish' ? 'Bring this intention to your next hello.' : 'One small change. Still completely you.'}</p></div>}
    <h1 ref={heading} tabIndex={-1}>{titles[step]}</h1>
    {step === 'listen' && <>
      <p className="lesson-instruction">Listen to both. Which feels more welcoming to you?</p>
      <blockquote className="lesson-sentence">{lesson.sentence}</blockquote><PersonalExample text={lesson.sentence} emotion="warm"/>
      <div className="lesson-audio-grid">{['A', 'B'].map((label, index) => <button className="lesson-audio" key={label} disabled={busy || !capabilities.speech || capabilities.mode !== 'live'} onClick={() => void play(index)}><Icon name={heard[index] ? 'check' : 'play'} /><strong>{`Play ${label}`}</strong><small>{heard[index] ? 'Listen again' : 'Voice example'}</small></button>)}</div>
      {busy && <PendingCoach label="Preparing your voice example…"/>}
      <small>AI-generated examples. The difference may be subtle; there is no scored answer.</small>
      {heard.every(Boolean) && <div className="lesson-choices" aria-label="Your listening impression">{['A feels warmer', 'B feels warmer', 'They sound similar'].map(label => <button key={label} aria-pressed={choice === label} onClick={() => setChoice(label)}>{label}</button>)}</div>}
      {choice && <button className="primary lesson-next" onClick={() => move('notice')}>Show me what to try <Icon name="arrow" size={18} /></button>}
      <button className="text-button" disabled={busy} onClick={() => move('notice')}>Continue with a written cue</button>
    </>}
    {step === 'notice' && <>
      <blockquote className="lesson-sentence">I am <em>glad</em> you came.<br />Come and <em>join us.</em></blockquote>
      <p>{choice === 'They sound similar' ? 'That is useful to notice. Generated examples do not always create a clear contrast. ' : ''}{lesson.cue}</p>
      <p className="muted">Emphasis is a choice about meaning. You do not need to get louder or copy another voice.</p>
      <button className="primary lesson-next" onClick={() => capture('first')}>Let me try <Icon name="mic" size={18} /></button>
    </>}
    {['first', 'retry', 'transfer'].includes(step) && <>
      <p className="lesson-instruction">{step === 'transfer' ? 'Imagine meeting someone new. Choose the word you want them to notice.' : step === 'retry' ? current?.feedback.adjustment || 'Keep the parts that worked. Try the same intention once more.' : 'Read this as if you are inviting someone to sit beside you.'}</p>
      <blockquote className="lesson-sentence">{step === 'transfer' ? lesson.transfer : lesson.sentence}</blockquote>
      <Recorder onRecordingStateChange={setMicActive} key={step} compact onChange={onRecording} disabled={busy} />
      {!live && <p className="notice">You can rehearse and replay your voice here. Personalized listening feedback needs live coaching to be connected; this practice will not receive a score or completion.</p>}
      <button className="primary lesson-next" disabled={!recording || busy || !live} onClick={() => void submit()}>{busy ? 'Listening to your delivery…' : 'Hear my coaching'}<Icon name="arrow" size={18} /></button>
      {busy&&<PendingCoach comparison={step==='retry'}/>}
      <small>Your recording is sent for coaching only when you tap this button.</small>
    </>}
    {step === 'review' && <>{feedback}<audio controls src={`/api/audio/${current?.id}`} aria-label="First lesson attempt" onPlay={singlePlayer} /><button className="primary lesson-next" disabled={busy} onClick={() => capture('retry')}>{current?.feedback.adjustment?'Try that one change':'Try it once more'} <Icon name="mic" size={18} /></button></>}
    {step === 'compare' && <>
      {feedback}
      <p>Here’s how these takes compare with your intention. Your own impression matters too.</p>
      <div className="lesson-comparison">{attempts.slice(0, 2).map((attempt, i) => <div key={attempt.id}><strong>{i ? 'Your retry' : 'Your first try'}</strong><audio controls src={`/api/audio/${attempt.id}`} aria-label={i ? 'Retry lesson attempt' : 'First lesson attempt'} onPlay={singlePlayer} /></div>)}</div>
      <div className="lesson-choices">{[['first', 'First try'], ['second', 'My retry'], ['unsure', 'Not sure yet']].map(([value, label]) => <button key={value} disabled={busy} aria-pressed={reflection === value} onClick={() => void reflect(value)}>{label}</button>)}</div>
      {reflection && <p role="status">{reflection === 'unsure' ? 'You do not have to hear a change yet. Try carrying the intention into a different sentence.' : 'Your preference is saved. Now try the idea without copying the same sentence.'}</p>}
      <KeepComparison id={current!.id} kept={!!savedAttempts.find(a=>a.id===current?.id)?.savedComparison} refresh={refresh}/><button className="primary lesson-next" disabled={!reflection || busy} onClick={() => capture('transfer')}>Try a new hello <Icon name="arrow" size={18} /></button>
    </>}
    {step === 'finish' && <>
      <p>You listened, tried a change, and used it in a new sentence. Your three recordings are saved in My Voice.</p>
      {feedback}<audio controls src={`/api/audio/${current?.id}`} aria-label="New sentence attempt" onPlay={singlePlayer} />
      <div className="lesson-takeaway"><Icon name="check" /><p><strong>Take this with you</strong><br />Before your next hello, choose what you want the other person to hear in it.</p></div>
      <small>This marks practice completed, not mastery or a measured improvement.</small>
      <button className="primary lesson-next" disabled={busy} onClick={() => { setAttempts([]); setReflection(''); setChoice(''); setHeard([false, false]); move('listen'); }}>Practice once more <Icon name="arrow" size={18} /></button>
    </>}
    {error && <p className="notice error" role="alert">{error}</p>}
    {saveNote && <p role="status">{saveNote}</p>}
  </section>;
}

