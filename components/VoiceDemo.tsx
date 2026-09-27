'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { emotionIds, styles, voiceLabels, type Emotion } from '@/lib/speech-styles';
type Props = { text: string; capabilities: { speech: boolean; mode: string; voices: string[] }; preset?: string };
export default function VoiceDemo({ text, capabilities, preset = 'default' }: Props) {
  const [emotion, setEmotion] = useState<Emotion>('warm');
  const [contrast, setContrast] = useState<Emotion>('confident');
  const [voice, setVoice] = useState(capabilities.voices.includes(preset) ? preset : 'default');
  const [intensity, setIntensity] = useState<'natural' | 'expressive'>('natural');
  const [clips, setClips] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [preferred, setPreferred] = useState<Emotion | null>(null);
  const [contrastNote, setContrastNote] = useState('');
  const fresh = useRef(false);
  const controller = useRef<AbortController | null>(null); const urls = useRef<string[]>([]);
  const epoch = useRef(0); const id = useId(); const players = useRef<(HTMLAudioElement | null)[]>([]);
  const selection = `${text.trim()}|${voice}|${intensity}`;
  useEffect(() => {
    epoch.current++; controller.current?.abort(); setBusy(false); setError(''); setPreferred(null); setContrastNote(''); setClips({});
    urls.current.forEach(URL.revokeObjectURL); urls.current = [];
    return () => { epoch.current++; controller.current?.abort(); urls.current.forEach(URL.revokeObjectURL); urls.current = []; };
  }, [selection]);
  const available = capabilities.speech && capabilities.mode === 'live';
  function newTake() {
    fresh.current = true;
    players.current.forEach(p => p?.pause());
    const retired = [clips[emotion], clips[contrast]].filter(Boolean);
    retired.forEach(URL.revokeObjectURL); urls.current = urls.current.filter(url => !retired.includes(url));
    setClips(old => { const next = { ...old }; delete next[emotion]; delete next[contrast]; return next; });
    setPreferred(null); setContrastNote('The next comparison will create a new take. Keep the same words and listen for a clearer difference.');
  }
  async function generate() {
    if (busy) return;
    setBusy(true); setError(''); const version = epoch.current;
    const abort = new AbortController(); controller.current = abort;
    try {
      // Keep a successful first clip if the second request fails; retry only missing audio.
      for (const style of [emotion, contrast]) {
        if (clips[style]) continue;
        const response = await fetch('/api/speech', { method: 'POST', signal: abort.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, emotion: style, preset: voice, intensity, fresh: fresh.current }) });
        if (!response.ok) throw new Error((await response.json()).error || 'Could not prepare this example.');
        const blob = await response.blob();
        if (version !== epoch.current) return;
        const url = URL.createObjectURL(blob); urls.current.push(url); setClips(old => ({ ...old, [style]: url }));
      }
    fresh.current = false;
    } catch (e) { if (version === epoch.current && !abort.signal.aborted) setError(e instanceof Error ? e.message : 'Audio generation failed.'); }
    finally { if (version === epoch.current) setBusy(false); }
  }
  return <section className="separator" aria-label="Delivery comparison"><h3>Hear the same words two ways</h3>
    <div className="grid"><label htmlFor={`${id}-voice`}>Voice / accent<select id={`${id}-voice`} disabled={busy} value={voice} onChange={e => setVoice(e.target.value)}>{capabilities.voices.map(v => <option key={v} value={v}>{voiceLabels[v] || v}</option>)}</select></label>
      <label htmlFor={`${id}-intensity`}>Expression<select id={`${id}-intensity`} disabled={busy} value={intensity} onChange={e => setIntensity(e.target.value as typeof intensity)}><option value="natural">Conversational</option><option value="expressive">Pronounced contrast</option></select></label></div>
    <div className="grid">{([emotion, contrast] as Emotion[]).map((style, index) => <div key={index} className="delivery-option">
      <label htmlFor={`${id}-style-${index}`}>{index === 0 ? 'Delivery A' : 'Delivery B'}<select id={`${id}-style-${index}`} disabled={busy} value={style} onChange={e => { const value = e.target.value as Emotion; index === 0 ? setEmotion(value) : setContrast(value); setPreferred(null); }}>{emotionIds.map(s => <option key={s} value={s} disabled={s === (index === 0 ? contrast : emotion)}>{styles[s].label}</option>)}</select></label>
      <p>{styles[style].listen}</p>
      {clips[style] && <audio ref={el => { players.current[index] = el; }} controls src={clips[style]} aria-label={`${styles[style].label} delivery example`} onPlay={() => players.current.forEach((p, i) => { if (i !== index) p?.pause(); })} />}
      {clips[style] && <button type="button" aria-pressed={preferred === style} onClick={() => setPreferred(style)}>Explore {styles[style].label.toLowerCase()}</button>}
    </div>)}</div>
    <button type="button" className="primary" disabled={busy || !available || !text.trim() || /[\[\]<>]/.test(text) || Boolean(clips[emotion] && clips[contrast])} onClick={generate}>{busy ? 'Preparing the contrast…' : clips[emotion] && clips[contrast] ? 'Both examples ready' : 'Hear both deliveries'}</button>
    {clips[emotion] && clips[contrast] && <div className="row"><button type="button" onClick={() => setContrastNote('Notice the feature that made the difference—emphasis, rhythm, or phrase endings—and try just that feature yourself.')}>I hear the difference</button><button type="button" onClick={() => setContrastNote('Some voices and sentences produce overlapping styles. Try pronounced contrast or prepare a new take; these labels describe the intended delivery, not a guaranteed result.')}>These sound too similar</button><button type="button" onClick={newTake}>Prepare a new take</button></div>}
    {contrastNote && <p role="status">{contrastNote}</p>}
    {preferred && <div className="notice"><strong>Try {styles[preferred].label.toLowerCase()} in your own voice</strong><p>{styles[preferred].practice}</p></div>}
    <small>AI-generated examples. Same words and voice in both clips. Accent choices use different voices and do not represent every regional dialect. Expression varies with the sentence; pronounced contrast can sound theatrical.</small>
    {!available && <p>Audio examples are unavailable until live voice generation is connected.</p>}
    {/[\[\]<>]/.test(text) && <p role="status">Enter spoken words without bracketed stage directions or markup.</p>}
    {error && <p role="alert" className="notice error">{error} Any completed example is kept; retry to finish the pair.</p>}
  </section>;
}
