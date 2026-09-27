'use client';
import Image from 'next/image';
import PersonalExample from './PersonalExample';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { figures, challengeProgress, type VoiceSession } from '@/lib/figures';
import type { Attempt } from '@/lib/domain';
import { Icon, Listener } from './Brand';
import { PendingCoach, TypedReply } from './CoachFeedback';

type Props = { sessions: VoiceSession[]; attempts: Attempt[]; live: boolean; speech: boolean; voice: string; refresh: () => Promise<void>; practice: (session: VoiceSession) => ReactNode; initialSessionId?: string };
export default function VoicesLibrary({ sessions, attempts, live, speech, voice, refresh, practice, initialSessionId }: Props) {
  const initial = sessions.find(s => s.id === initialSessionId);
  const [figureId, setFigureId] = useState(initial?.figureId || '');
  const [challengeId, setChallengeId] = useState(initial?.challengeId || '');
  const [selected, setSelected] = useState<VoiceSession | null>(initial || null);
  const [draft, setDraft] = useState(initial?.source === 'gemini' ? initial.original : '');
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [rehearsing, setRehearsing] = useState(false);
  const [audioUrl, setAudioUrl] = useState(''); const [speaking, setSpeaking] = useState(false); const [playing, setPlaying] = useState(false);
  const rehearsal = useRef<HTMLDivElement>(null);
  const player = useRef<HTMLAudioElement>(null); const request = useRef({ key: '', id: '' });
  useEffect(() => { if(rehearsing) rehearsal.current?.scrollIntoView({block:'start',behavior:'instant'}); }, [rehearsing]);
  const figure = figures.find(f => f.id === figureId);
  const challenge = figure?.challenges.find(c => c.id === challengeId);
  const last = sessions.at(-1);
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);

  function choose(fId: string, cId: string, session?: VoiceSession) {
    player.current?.pause(); setAudioUrl(''); setPlaying(false); setError(''); setRehearsing(false);
    setFigureId(fId); setChallengeId(cId);
    const saved = session || sessions.filter(s => s.figureId === fId && s.challengeId === cId).at(-1);
    setSelected(saved || null); setDraft(saved?.source === 'gemini' ? saved.original : '');
  }
  async function create(example: boolean) {
    if (!figure || !challenge || busy) return;
    setBusy(true); setError(''); player.current?.pause();
    const key = JSON.stringify([figure.id, challenge.id, example, example ? '' : draft]);
    if (request.current.key !== key) request.current = { key, id: crypto.randomUUID() };
    try {
      const res = await fetch('/api/voices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId: request.current.id, figureId: figure.id, challengeId: challenge.id, text: draft, example }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Could not prepare your practice.');
      setSelected(data); setRehearsing(false); setAudioUrl(''); setPlaying(false);
      try { await refresh(); } catch { setError('Your exercise is saved. Refresh the page to update your progress.'); }
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function hear() {
    if (!selected || speaking) return;
    if (audioUrl) { await player.current?.play().catch(() => setError('Tap play on the audio player.')); return; }
    setSpeaking(true); setError('');
    try {
      const res = await fetch('/api/speech', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: selected.revision, emotion: figureId === 'oprah' ? 'warm' : 'confident', intensity: 'expressive', preset: voice }) });
      if (!res.ok) throw new Error((await res.json()).error || 'The example is unavailable.');
      setAudioUrl(URL.createObjectURL(await res.blob()));
    } catch (e) { setError((e as Error).message); } finally { setSpeaking(false); }
  }
  if (!figure) return <section className="voices-library">
    <div className="page-heading"><span className="eyebrow">VOICES · YOUR INSPIRATION, YOUR EXPRESSION</span><h1>Learn from voices that move you.</h1><p>Borrow a way of thinking, choosing words, and making a point. Bring it into your own voice.</p></div>
    {last && <button className="today-conversation" onClick={() => choose(last.figureId, last.challengeId, last)}><Icon name="play"/><span><strong>Continue your voice practice</strong><small>{figures.find(f => f.id === last.figureId)?.name} · Your words and feedback are saved.</small></span><Icon name="arrow"/></button>}
    <div className="figure-grid">{figures.map(f => {
      const count = f.challenges.filter(c => challengeProgress(sessions, attempts, f.id, c.id).completed).length;
      return <button className="figure-card" key={f.id} onClick={() => choose(f.id, f.challenges.find(c => !challengeProgress(sessions, attempts, f.id, c.id).completed)?.id || f.challenges[0].id)}><span className="figure-portrait"><Image src={f.portrait.src} alt="" fill sizes="(max-width:760px) 90vw, 300px"/></span><h2>{f.name}</h2><p>{f.promise}</p><small>{count} / {f.challenges.length} practice cycles</small><span className="figure-entry">Explore this voice <Icon name="arrow" size={18}/></span></button>;
    })}</div>
    <p className="figure-photo-credits">Portraits: {figures.map((f,i)=><span key={f.id}>{i>0?' · ':''}<a href={f.portrait.source} target="_blank" rel="noreferrer">{f.name}: {f.portrait.credit}</a> (<a href={f.portrait.licenseUrl} target="_blank" rel="noreferrer">{f.portrait.license}</a>)</span>)}. Images resized and framed to fit.</p><p className="muted">Inspired techniques, original exercises. A completed cycle means you recorded, retried, and reflected—not that you mastered someone’s voice.</p>
  </section>;
  return <section className="voices-library">
    <button className="text-button" disabled={busy || speaking} onClick={() => { player.current?.pause(); setFigureId(''); setAudioUrl(''); }}>← All voices</button>
    <div className="companion-intro figure-heading"><span className="figure-profile-portrait"><Image src={figure.portrait.src} alt={figure.name} fill sizes="(max-width:760px) 88px, 120px"/></span><Listener state={busy || speaking ? 'thinking' : playing ? 'speaking' : 'ready'}/><div><span className="eyebrow">INSPIRED BY</span><h1>{figure.name}</h1><p>{figure.promise}</p></div></div>
    <small className="figure-photo-credits">Photo: <a href={figure.portrait.source} target="_blank" rel="noreferrer">{figure.portrait.credit}</a> · <a href={figure.portrait.licenseUrl} target="_blank" rel="noreferrer">{figure.portrait.license}</a> · Framed to fit.</small><p>{figure.lens}</p><p className="muted"><strong>Words to notice:</strong> {figure.vocabulary}</p>
    <a href={figure.source.url} target="_blank" rel="noreferrer">Explore the source: {figure.source.title} ↗</a>
    <small className="voice-source-note">Yoro’s editorial interpretation of this speech. Delivery cues below are practice suggestions, not measured claims about the speaker.</small>
    <nav className="voice-challenges" aria-label="Voice challenges">{figure.challenges.map((c, i) => {
      const progress = challengeProgress(sessions, attempts, figure.id, c.id);
      return <button key={c.id} disabled={busy || speaking} aria-pressed={challengeId === c.id} onClick={() => choose(figure.id, c.id)}><span>{progress.completed ? '✓' : `0${i + 1}`}</span><strong>{c.title}</strong><small>{progress.completed ? 'Practiced & reflected' : progress.takes ? 'Keep practicing' : 'Ready to explore'}</small></button>;
    })}</nav>
    {challenge && <>
      <h2>{challenge.title}</h2><p>{challenge.instruction}</p>
      <form onSubmit={e => { e.preventDefault(); void create(false); }} className="voice-composer">
        <label htmlFor="voice-message">How might {figure.name} approach your message?</label>
        <textarea id="voice-message" rows={3} maxLength={1500} value={draft} disabled={busy || speaking} onChange={e => setDraft(e.target.value)} placeholder="Something you want to explain, present, or say. Keep the facts you want to preserve."/>
        <div className="row"><button className="primary" disabled={busy || speaking || !live || !draft.trim()}>Shape my words <Icon name="spark" size={17}/></button><button type="button" disabled={busy || speaking} onClick={() => void create(true)}>Start with an example</button></div>
      </form>
      {busy && <PendingCoach label="I’m finding a way to make your message land…"/>}
      {selected && !busy && <div className="voice-workshop" key={selected.id}>
        <span className="eyebrow">{selected.source === 'authored' ? 'ORIGINAL YORO EXERCISE' : 'YOUR MESSAGE, REIMAGINED'}</span>
        {selected.source === 'gemini' && <p className="original-wording">Your original: {selected.original}</p>}
        <blockquote className="lesson-sentence">{selected.revision}</blockquote>
        <TypedReply text={selected.explanation}/>
        {selected.wordChoices.length > 0 && <ul className="voice-word-choices">{selected.wordChoices.map((w, i) => <li key={i}><span>“{w.before}” → <strong>“{w.after}”</strong></span><small>{w.why}</small></li>)}</ul>}
        <p className="voice-cue"><strong>Try this:</strong> {selected.cue}</p>
        <div className="row"><button disabled={!speech || !live || speaking} onClick={() => void hear()}><Icon name="headphones" size={18}/>{speaking ? 'Preparing the example…' : 'Hear the coach demonstrate'}</button><button className="primary" onClick={() => { player.current?.pause(); setRehearsing(true); }}>Practice in my voice <Icon name="mic" size={18}/></button></div>
        <PersonalExample text={selected.revision} emotion={figureId==='oprah'?'warm':'confident'}/>{audioUrl && <audio ref={player} controls src={audioUrl} aria-label="Coach demonstration" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onLoadedData={() => { void player.current?.play().catch(() => {}); }}/>}<small>Original style-inspired wording, not a real quote. Audio uses Yoro’s coach voice, not {figure.name}’s voice.</small>
        {rehearsing && <div ref={rehearsal} className="voice-rehearsal">{practice(selected)}{challengeProgress(sessions,attempts,figure.id,challenge.id).completed&&<div className="journey-return"><span className="eyebrow">YOU PRACTICED. YOU LISTENED. YOU REFLECTED.</span><p>Keep what worked, and try another technique with the same message.</p><button className="primary" onClick={()=>{const next=figure.challenges[(figure.challenges.findIndex(c=>c.id===challenge.id)+1)%figure.challenges.length];choose(figure.id,next.id);if(selected.source==='gemini')setDraft(selected.original);window.scrollTo({top:0,behavior:'instant'});}}>Explore the next challenge <Icon name="arrow" size={17}/></button></div>}</div>}
      </div>}
      {error && <p className="notice error" role="alert">{error} Your words are kept.</p>}
    </>}
  </section>;
}
