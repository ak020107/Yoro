'use client';
import {recordingWav} from '@/lib/recording-wav';
import { useEffect, useId, useRef, useState } from 'react';

export type Recording = { blob: Blob; duration: number };
export default function Recorder({ onChange, disabled = false, compact = false, onRecordingStateChange, maxSeconds = 45 }: { onChange: (recording: Recording | null) => void; disabled?: boolean; compact?: boolean; maxSeconds?: number; onRecordingStateChange?: (active: boolean) => void }) {
  const [requesting, setRequesting] = useState(false); const permissionPending = useRef(false);
  const [recording, setRecording] = useState(false); const [seconds, setSeconds] = useState(0);
  const [url, setUrl] = useState(''); const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); const uploadId = useId();
  const recorder = useRef<MediaRecorder | null>(null); const stream = useRef<MediaStream | null>(null);
  const sound = useRef<AudioContext | null>(null);
  // Tiny local earcons: no download or provider request. Never mix them into the recording.
  function chime(starting: boolean) {
    const context = sound.current;
    if (!context || context.state !== 'running') return false;
    try {
      [660, starting ? 880 : 440].forEach((frequency, i) => {
        const oscillator = context.createOscillator(); const gain = context.createGain();
        const at = context.currentTime + i * .055;
        oscillator.type = 'sine'; oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(.065, at + .008);
        gain.gain.exponentialRampToValueAtTime(.0001, at + .12);
        oscillator.connect(gain); gain.connect(context.destination);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(at); oscillator.stop(at + .13);
      });
      return true;
    } catch { return false; } // Sound support must never block microphone use.
  }
  const started = useRef(0); const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const mounted = useRef(true); const callback = useRef(onChange); callback.current = onChange;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; if (recorder.current?.state === 'recording') recorder.current.stop(); stream.current?.getTracks().forEach(t => t.stop()); if (timer.current) clearInterval(timer.current); }; }, []);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => () => { void sound.current?.close().catch(() => {}); sound.current = null; }, []);
  const stateCallback = useRef(onRecordingStateChange); stateCallback.current = onRecordingStateChange;
  useEffect(() => { stateCallback.current?.(recording); }, [recording]);
  useEffect(() => () => { stateCallback.current?.(false); }, []);
  function stop() { if (recorder.current?.state === 'recording') recorder.current.stop(); }
  async function importRecording(file?: File) {
    if (!file) return;
    setError(''); setLoading(true); setUrl(''); callback.current(null);
    let decoder: AudioContext | undefined;
    try {
      if (file.size > 15 * 1024 * 1024) throw new Error('Choose a recording smaller than 15 MB.');
      const ext = file.name.split('.').at(-1)?.toLowerCase();
      const types: Record<string, string> = { mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4', mp4: 'audio/mp4', webm: 'audio/webm', ogg: 'audio/ogg' };
      const mime = types[ext || '']; if (!mime) throw new Error('Choose an MP3, WAV, M4A, WebM, or Ogg recording.');
      decoder = new AudioContext(); const decoded = await decoder.decodeAudioData(await file.arrayBuffer());
      if (decoded.duration < .5 || decoded.duration > maxSeconds) throw new Error('Choose a recording between half a second and '+maxSeconds+' seconds.');
      if (!mounted.current) return;
      const original=new Blob([file],{type:mime});const converted=maxSeconds>46?{blob:original,duration:decoded.duration}:await recordingWav(original);if(!mounted.current)return;setUrl(URL.createObjectURL(converted.blob));callback.current(converted);
    } catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : 'Could not read this recording.'); }
    finally { await decoder?.close().catch(() => {}); if (mounted.current) setLoading(false); }
  }
  async function start() {
    if(permissionPending.current || recorder.current?.state === 'recording') return;
    permissionPending.current = true; setRequesting(true);
    document.querySelectorAll('audio').forEach(a=>a.pause());
    // Unlock playback in the original tap, before the microphone permission prompt.
    try { sound.current ??= new AudioContext(); void sound.current.resume().catch(() => {}); } catch { /* Silent fallback. */ }
    setError(''); callback.current(null); setUrl('');
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error('Recording needs a supported browser on localhost or HTTPS. You can upload a recording instead.');
      const media = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
      if (!mounted.current) { media.getTracks().forEach(t => t.stop()); return; }
      stream.current = media;
      const type = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find(t => MediaRecorder.isTypeSupported(t));
      const rec = new MediaRecorder(media, type ? { mimeType: type } : undefined); recorder.current = rec;
      const chunks: BlobPart[] = [];
      rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      rec.onerror = () => { if (mounted.current) setError('Recording was interrupted. Please try again.'); stop(); };
      rec.onstop = async () => {
        if (timer.current) clearInterval(timer.current); media.getTracks().forEach(t => t.stop());
        if (!mounted.current) return;
        setRecording(false);
        const duration = Math.min(maxSeconds, (performance.now() - started.current) / 1000);
        const blob = new Blob(chunks, { type: rec.mimeType || type || 'audio/webm' });
        if (blob.size < 100 || duration < .5) { setError('The recording was too short. Please try again.'); return; }
        chime(false);
        setLoading(true);try{const converted=maxSeconds>46?{blob,duration}:await recordingWav(blob);if(mounted.current){setUrl(URL.createObjectURL(converted.blob));callback.current(converted);}}catch{if(mounted.current){setUrl(URL.createObjectURL(blob));callback.current({blob,duration});}}finally{if(mounted.current)setLoading(false);}
      };
      // Play only after permission succeeds; let the tone finish before capturing speech.
      if (chime(true)) await new Promise(resolve => setTimeout(resolve, 240));
      if (!mounted.current) { media.getTracks().forEach(t => t.stop()); return; }
      started.current = performance.now(); setSeconds(0); rec.start(200); setRecording(true);
      timer.current = setInterval(() => { const elapsed = (performance.now() - started.current) / 1000; setSeconds(Math.floor(elapsed)); if (elapsed >= maxSeconds) stop(); }, 200);
    } catch (e) {
      stream.current?.getTracks().forEach(t => t.stop());
      setError(e instanceof DOMException && e.name === 'NotAllowedError' ? 'Microphone access was not granted. Allow it in your browser settings, or upload a recording.' : e instanceof Error ? e.message : 'Microphone unavailable.');
    } finally { permissionPending.current = false; if(mounted.current) setRequesting(false); }
  }
  return <div className={recording ? 'card recording' : 'card'}>
    <div className="row"><button type="button" onClick={recording ? stop : start} disabled={disabled || loading || requesting}>{requesting ? 'Waiting for microphone…' : recording ? `Stop recording · ${seconds}s` : url ? 'Record again' : 'Record response'}</button><small>{recording ? 'Listening · microphone is on' : 'Up to '+maxSeconds+' seconds. Recording stays local until you submit.'}</small></div>
    <div className={compact ? "recording-import compact" : "recording-import"}><label htmlFor={uploadId}>Or choose a recording</label><input id={uploadId} type="file" accept=".mp3,.wav,.m4a,.mp4,.webm,.ogg" disabled={disabled || recording || loading || requesting} onChange={e => { void importRecording(e.target.files?.[0]); e.target.value = ''; }} /></div>
    {loading && <p role="status">Checking your recording locally…</p>}
    {url && <audio controls src={url} aria-label="Your recorded response" />}
    {url && <button type="button" disabled={disabled} onClick={() => { setUrl(''); callback.current(null); }}>Discard recording</button>}
    {error && <p role="alert" className="notice error">{error}</p>}
  </div>;
}

