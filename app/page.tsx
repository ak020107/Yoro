'use client';
import KeepComparison from '@/components/KeepComparison';
import AcousticReview from '@/components/AcousticReview';
import ReturnLoop from '@/components/ReturnLoop';
import {activePlan,nextPractice} from '@/lib/learning-plan';
import LearningJourney from '@/components/LearningJourney';
import PersonalExample from '@/components/PersonalExample';
import {planTarget,type LearningPlan} from '@/lib/learning-plan';
import { useCallback, useEffect, useRef, useState, useId } from 'react';
import PersonalVoiceSetup from '@/components/PersonalVoiceSetup';
import VoicesLibrary from '@/components/VoicesLibrary';
import { goalPractice, type GoalPractice } from '@/lib/journey';
import { voiceContext } from '@/lib/figures';
import Recorder, { type Recording } from '@/components/Recorder';
import VoiceProfile from '@/components/VoiceProfile';
import PracticeProgress from '@/components/PracticeProgress';
import GuidedLesson from '@/components/GuidedLesson';
import DeliveryReview from '@/components/DeliveryReview';
import CoachFeedback, { PendingCoach } from '@/components/CoachFeedback';
import VoiceDemo from '@/components/VoiceDemo';
import PracticeHome, { type Destination } from '@/components/PracticeHome';
import { Icon, Listener, Wordmark, type IconName } from '@/components/Brand';
import DeliveryCompanion from '@/components/DeliveryCompanion';
import { type Attempt, type State, type Scenario, type Mode } from '@/lib/domain';

type Capabilities = { mode: string; gemini: boolean; transcription: boolean; speech: boolean; memory: boolean; database: string; voices: string[] };
type AppState = Omit<State, 'memory'> & { memory: { status: string }; capabilities: Capabilities };
type Tab = Destination;
async function api<T>(path: string, body?: unknown, method?: string): Promise<T> {
  const res = await fetch(`/api/${path}`, { method: method || (body ? 'POST' : 'GET'), headers: body instanceof FormData ? undefined : body ? { 'Content-Type': 'application/json' } : undefined, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
  const value = await res.json(); if (!res.ok) throw new Error(value.error || 'Something went wrong. Please try again.'); return value;
}
function CoachState({ state, listening = false }: { state: string; listening?: boolean }) { return <div className="coach-state"><div className="coach-avatar"><Listener state={listening?'listening':state==='Thinking'?'thinking':'ready'} /></div><div><strong>Your Listener</strong><small>{listening?'Listening · microphone is on':state}</small></div></div>; }

function PracticeBox({ app, refresh, kind = 'delivery', lessonId, initialGoal = 'Warm and confident', context = '', initialText = '', focused = false, discoveryId, voiceSessionId, planId, planStep, initialAttempt }: { app: AppState; refresh: () => Promise<void>; kind?: Mode; lessonId?: string; initialGoal?: string; context?: string; initialText?: string; focused?: boolean; discoveryId?: string; voiceSessionId?: string; planId?:string; planStep?:number; initialAttempt?: Attempt }) {
  const [reviewTab,setReviewTab]=useState<'coach'|'timing'>('coach');const reviewId=useId();
  const [micActive,setMicActive]=useState(false);
  const [goal, setGoal] = useState(initialGoal); const [text, setText] = useState(initialText); const [recording, setRecording] = useState<Recording | null>(null);
  const [current, setCurrent] = useState<Attempt | null>(initialAttempt || null); const [parent, setParent] = useState<Attempt | null>(app.attempts.find(a=>a.id===initialAttempt?.parentId) || null); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [recKey, setRecKey] = useState(0); const [reflection, setReflection] = useState(initialAttempt?.reflection || '');

  const requestId = useRef('');
  useEffect(() => { requestId.current = crypto.randomUUID(); }, [text, recording, parent, goal, context, kind, lessonId]);
  async function submit() {
    setBusy(true); setError('');
    try {
      const form = new FormData(); form.set('requestId', requestId.current || crypto.randomUUID()); form.set('kind', kind); form.set('goal', goal); form.set('context', context); form.set('text', text);
      if(planId){form.set('planId',planId);form.set('planStep',String(planStep));}
      if (discoveryId) form.set('discoveryId', discoveryId);
      if (voiceSessionId) form.set('voiceSessionId', voiceSessionId);
      if (parent) form.set('parentId', parent.id); if (lessonId) form.set('lessonId', lessonId);
      if (recording) { form.set('audio', recording.blob, 'recording'); form.set('duration', String(recording.duration)); }
      const result = await api<Attempt>('attempts', form); setCurrent(result);setReviewTab('coach');

      await refresh();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function reflect(choice: string) { if (!current) return; try { await api('reflection', { id: current.id, choice }); setReflection(choice); await refresh(); } catch (e) { setError((e as Error).message); } }
  function retry() { setReviewTab('coach');setParent(current); setCurrent(null);  setRecording(null); setRecKey(k => k + 1); setReflection(''); }
  return <section className="card"><CoachState listening={micActive} state={busy ? 'Thinking' : current ? 'Ready to review' : 'Ready to practice'} />
    {context && !voiceSessionId && !planId && <p>{context}</p>}
    {parent?.feedback.adjustment && !current && <div className="notice"><strong>Try one adjustment</strong><p>{parent.feedback.adjustment}</p></div>}
    {!current ? <>{!focused && <><label htmlFor={`goal-${kind}`}>How do you want to come across?</label><input id={`goal-${kind}`} value={goal} maxLength={500} disabled={busy} onChange={e => setGoal(e.target.value)} /></>}
      {focused && !planId && <><blockquote className="lesson-sentence">{initialText}</blockquote>{!discoveryId&&!voiceSessionId&&<PersonalExample text={initialText} emotion="confident"/>}</>}<label>Your response</label><Recorder onRecordingStateChange={setMicActive} compact={focused} key={recKey} disabled={busy} onChange={setRecording} />
      {!focused && <><label htmlFor={`response-${kind}`}>Or type your response</label><textarea id={`response-${kind}`} value={text} disabled={busy} maxLength={4000} onChange={e => setText(e.target.value)} />
      <small>Typed responses support wording advice only. No acoustic judgments are made from text.</small></>}
      {recording && <p className="notice">Submitting uploads this recording for processing and private replay. In live mode, audio goes to ElevenLabs and Gemini. Local playback is available before submitting.</p>}
      <div className="row"><button className="primary" onClick={submit} disabled={busy || micActive || !goal.trim() || (focused ? !recording : !text.trim() && !recording)}>{busy ? 'Processing your response…' : app.capabilities.mode === 'live' ? 'Get coaching' : 'Try preview exercise'}</button></div>
      {busy&&<PendingCoach comparison={!!parent}/>}
    </> : <div className="feedback"><div className="review-tabs" role="tablist" aria-label="Review your take">{([['coach','Coaching'],['timing','Listen & timing']] as const).map(([value,label])=><button key={value} id={reviewId+value} role="tab" aria-selected={reviewTab===value} aria-controls={reviewId+'panel'} tabIndex={reviewTab===value?0:-1} onClick={()=>setReviewTab(value)} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?'coach':e.key==='End'?'timing':value==='coach'?'timing':'coach';setReviewTab(next);document.getElementById(reviewId+next)?.focus();}}}>{label}</button>)}</div><div role="tabpanel" id={reviewId+'panel'} aria-labelledby={reviewId+reviewTab} tabIndex={0}>{reviewTab==='coach'?<><CoachFeedback key={current.id} attempt={current}/>
      {current.feedback.example&&<div className="coach-wording"><span className="eyebrow">A WAY TO SAY IT</span><p>{current.feedback.example}</p></div>}
      </>:<div className="lesson-comparison">{parent&&<div><strong>First attempt</strong>{parent.input==='audio'?<audio controls src={'/api/audio/'+parent.id} aria-label="First attempt"/>:<p>{parent.transcript}</p>}</div>}<div><strong>{parent?'This attempt':'Your take'}</strong>{current.input==='audio'?(current.delivery?<DeliveryReview analysis={current.delivery} attemptId={current.id} previous={parent?.delivery}/>:<audio controls src={'/api/audio/'+current.id} aria-label="Submitted attempt"/>):<p>{current.transcript}</p>}<AcousticReview value={current.acoustics} previous={parent?.acoustics}/></div></div>}</div>
      {parent&&<><p>Which feels closer to your intention?</p><div className="row">{[['first','First'],['second','Second'],['unsure','Not sure']].map(([value,label])=><button key={value} aria-pressed={reflection===value} onClick={()=>reflect(value)}>{label}</button>)}</div></>}
      <p><strong>{nextPractice(current)?.title}</strong> · {nextPractice(current)?.cue}</p>{parent&&current.input==='audio'&&parent.input==='audio'&&<KeepComparison id={current.id} kept={!!app.attempts.find(a=>a.id===current.id)?.savedComparison} refresh={refresh}/>}<div className="row separator"><button className="primary" onClick={retry}>Try that moment again</button><button onClick={() => { setReflection('');setCurrent(null); setParent(null); setRecording(null); setRecKey(k => k + 1); }}>New attempt</button></div>

    </div>}
    {error && <p className="notice error" role="alert">{error}</p>}
  </section>;
}

function DeliveryPractice({ app, refresh }: { app: AppState; refresh: () => Promise<void> }) {
 const [mode,setMode]=useState<'lesson'|'own'|'partner'>('lesson');
 return <>{mode==='lesson'?<GuidedLesson savedAttempts={app.attempts} profile={app.profile} capabilities={app.capabilities} refresh={refresh}/>:mode==='own'?<PracticeBox app={app} refresh={refresh} kind="delivery" initialGoal={app.profile.intention||'Clear, direct, and approachable'} context="Rehearse a real moment. Keep the message and recording conditions similar for a useful retry comparison."/>:<ScenarioPractice app={app} refresh={refresh}/>}
 <nav className="practice-switcher" aria-label="Practice format">{mode!=='lesson'&&<button onClick={()=>setMode('lesson')}>Back to guided lesson</button>}{mode!=='own'&&<button onClick={()=>setMode('own')}>Practice your own words instead</button>}{mode!=='partner'&&<button onClick={()=>setMode('partner')}>Practice with a conversation partner</button>}</nav></>;
}

function ScenarioPractice({ app, refresh }: { app: AppState; refresh: () => Promise<void> }) {
  const [context,setContext] = useState('I want to introduce myself to someone in my class without sounding forced.'); const [goal,setGoal] = useState(app.profile.intention || 'Curious and relaxed'); const [mood,setMood] = useState('friendly');
  const [scenario,setScenario] = useState<Scenario | null>(app.scenarios.at(-1) || null); const [reply,setReply] = useState(''); const [busy,setBusy] = useState(false); const [error,setError] = useState(''); const [review,setReview] = useState(false);
  async function start() { setBusy(true); setError(''); try { setScenario(await api('scenarios', { context,goal,mood })); setReview(false); await refresh(); } catch(e) {setError((e as Error).message);} finally {setBusy(false);} }
  async function turn(rewind = false) { if (!scenario) return; setBusy(true); setError(''); try { setScenario(await api(`scenarios/${scenario.id}/turn`, { message:reply,rewind })); setReply(''); setReview(false); await refresh(); } catch(e) {setError((e as Error).message);} finally {setBusy(false);} }
  return <><h1>Prepare for a moment</h1><p>Practice with a simulated partner. Their response is not a prediction of a real person's reaction.</p><div className="card"><label htmlFor="scenario-context">What's the situation?</label><textarea id="scenario-context" value={context} maxLength={3000} onChange={e => setContext(e.target.value)} /><label htmlFor="scenario-goal">Your intention</label><input id="scenario-goal" value={goal} maxLength={500} onChange={e => setGoal(e.target.value)} /><label htmlFor="scenario-mood">Practice partner</label><select id="scenario-mood" value={mood} onChange={e => setMood(e.target.value)}>{['friendly','brief','distracted'].map(m => <option key={m}>{m}</option>)}</select><button className="primary" disabled={busy || !context.trim() || !goal.trim()} onClick={start}>{busy ? 'Preparing…' : scenario ? 'Start a new rehearsal' : 'Start rehearsal'}</button></div>
    {scenario && <div className="card"><CoachState state={busy ? 'Thinking' : 'Simulated partner'} /><span className="badge">{scenario.turns[0]?.source === 'preview' ? 'Scripted preview scenario' : 'AI roleplay'}</span><div aria-live="polite">{scenario.turns.map((t,i) => <div className={`message ${t.role === 'user' ? 'user' : ''}`} key={i}><strong>{t.role === 'user' ? 'You' : 'Simulated partner'}</strong><p>{t.text}</p></div>)}</div>
    {scenario.turns.filter(t => t.role === 'user').length < 3 && <><label htmlFor="partner-reply">Your reply</label><textarea id="partner-reply" maxLength={1500} value={reply} onChange={e => setReply(e.target.value)} /><button disabled={busy || !reply.trim()} onClick={() => turn()}>Send reply</button></>}
    {scenario.turns.length > 1 && <div className="row separator"><button disabled={busy} onClick={() => turn(true)}>Rewind last exchange</button><button onClick={() => setReview(true)}>Practice my last reply aloud</button></div>}
    <VoiceDemo text={scenario.turns.at(-1)?.text || ''} capabilities={app.capabilities} />
    </div>}
    {review && scenario && <PracticeBox key={scenario.id + scenario.turns.length} app={app} refresh={refresh} kind="scenario" initialGoal={scenario.goal} context={scenario.context} initialText={scenario.turns.filter(t => t.role === 'user').at(-1)?.text || ''} />}
    {error && <p className="notice error" role="alert">{error}</p>}</>;
}

function CompanionSpace({ app, refresh, go }: { app: AppState; refresh: () => Promise<void>; go: (tab: Tab) => void }) {
 return <>{activePlan(app)&&<button className="today-conversation" onClick={()=>go('Today')}><Icon name="arrow"/><span><strong>Return to my preparation plan</strong><small>{activePlan(app)?.title} · Yoro knows what you’re working toward.</small></span></button>}<DeliveryCompanion saved={app.discovery} profile={app.profile} introduction={app.introduction} attempts={app.attempts} voice={app.capabilities.voices.includes(app.profile.voicePreset) ? app.profile.voicePreset : 'default'} speech={app.capabilities.speech} live={app.capabilities.mode === 'live'} refresh={refresh} practice={(plan,turnId)=><PracticeBox key={turnId || 'starter'} focused app={app} refresh={refresh} discoveryId={turnId} initialAttempt={turnId?app.attempts.filter(a=>a.discoveryId===turnId).at(-1):undefined} initialGoal={plan.goal} context={plan.cue} initialText={plan.sentence}/>}/>
</>;
}

function ProfilePanel({ app, refresh, go, resumeVoice }: { app: AppState; refresh: () => Promise<void>; go: (tab:Tab)=>void; resumeVoice: (id:string)=>void }) {
 const [status,setStatus]=useState('');const [busy,setBusy]=useState(false);const [confirm,setConfirm]=useState(false);
 async function clear(){setBusy(true);setStatus('');try{await api('reset',undefined,'DELETE');setConfirm(false);await refresh();setStatus('Your practice data was reset.');}catch(e){setStatus((e as Error).message);}finally{setBusy(false);}}
 return <><VoiceProfile voiceSetup={<PersonalVoiceSetup profile={app.profile} practice={(plan,id)=><PracticeBox key={id} focused app={app} refresh={refresh} discoveryId={id} initialGoal={plan.goal} context={plan.cue} initialText={plan.sentence}/>}/>} profile={app.profile} availableVoices={app.capabilities.voices} onSave={async profile=>{await api('profile',profile);await refresh();}} onIntroduction={async profile=>{await api('introduction',profile?{status:'complete',profile}:{status:'skipped'});await refresh();}}/>
 <PracticeProgress attempts={app.attempts} refresh={refresh}/>
 {app.attempts.length>0&&<button className="today-conversation" onClick={()=>{const id=app.attempts.at(-1)?.voiceSessionId;if(id)resumeVoice(id);else go(app.attempts.at(-1)?.discoveryId?'Yoro':'Today');}}><Icon name="play"/><span><strong>Put your progress into practice</strong><small>Return to your latest practice and build on what you kept.</small></span><Icon name="arrow"/></button>}
 <section className="practice-history"><h2>Your recent practice</h2><p>{app.attempts.length?app.attempts.length+' saved attempts. Come back and hear your own journey.':'Your first practice will appear here. No scores to chase, just something to build on.'}</p><small>Saved to this browser session. Cross-device accounts come later.</small>{app.attempts.slice(-5).reverse().map(a=><details key={a.id}><summary>{a.goal} · {new Date(a.createdAt).toLocaleDateString()}</summary><p>{a.transcript}</p><small>{a.source==='preview'?'Preview exercise':a.source==='measurements'?'Timing analysis only':'Live coaching'} · {a.input} input</small>{a.input==='audio'&&<audio controls src={'/api/audio/'+a.id} aria-label="Saved attempt"/>}</details>)}</section>
 {app.messages.length>0&&<details><summary>Earlier coaching conversations</summary>{app.messages.map((m,i)=><div className={'message '+m.role} key={i}><strong>{m.role==='user'?'You':'Yoro'}</strong><p>{m.text}</p></div>)}</details>}
 <details><summary>Connections and setup</summary><Setup app={app} refresh={refresh}/></details>
 <details className="data-controls"><summary>Manage my practice data</summary><p>Reset removes this session’s profile, practice history, and stored recordings. Connected external memory is deleted first.</p>{!confirm?<button onClick={()=>setConfirm(true)}>Reset my practice data</button>:<div className="row"><button disabled={busy} onClick={clear}>Confirm reset</button><button disabled={busy} onClick={()=>setConfirm(false)}>Cancel</button></div>}{status&&<p role="status">{status}</p>}</details></>;
}

function Setup({app,refresh}:{app:AppState;refresh:()=>Promise<void>}){
  const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);
  async function sync(){setBusy(true);try{const r=await api<{status:string}>('memory/sync',{});setMessage(r.status==='synced'?'Confirmed profile sent to Backboard. Remote memory processing may still be asynchronous.':'Memory is not active in this mode.');await refresh();}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
  return <><h2>Connection status</h2><div className="card"><h2>Current configuration</h2><ul><li>Mode: {app.capabilities.mode}</li><li>Gemini key: {app.capabilities.gemini?'configured, not health-verified':'missing'}</li><li>ElevenLabs transcription: {app.capabilities.transcription?'key configured':'missing key'}</li><li>ElevenLabs voice: {app.capabilities.speech?'configured':'missing key or default voice ID'}</li><li>Backboard: {app.capabilities.memory?'key configured':'missing key'} · sync {app.memory.status}</li><li>Storage: {app.capabilities.database}</li></ul><p>Configure secrets in <code>.env.local</code> beside the project package file. Restart the app after changing them. Never paste keys into this interface.</p><p>Set <code>PROVIDER_MODE=live</code> only when provider access is ready. Preview responses are authored examples.</p><button disabled={busy||!app.capabilities.memory||app.capabilities.mode!=='live'} onClick={sync}>{busy?'Syncing…':'Sync my confirmed profile to Backboard'}</button>{message&&<p role="status">{message}</p>}</div><div className="card"><h2>Foundation boundaries</h2><p>The Yoro interface is in its first design review. Voices includes sourced technique challenges and saved practice cycles. External memory recall, cloud deployment, and real iPhone microphone testing are still pending. This build stores recordings privately for local development; a public deployment needs the documented production hardening.</p></div></>;
}

export default function Home(){
  const [app,setApp]=useState<AppState|null>(null);const [tab,setTab]=useState<Tab>('Today');const [error,setError]=useState('');
  const [lessonOpen,setLessonOpen]=useState(false);
  const [voiceSessionId,setVoiceSessionId]=useState<string|undefined>();
  const personal = app ? goalPractice(app.profile, app.attempts) : null;
  const [activePractice,setActivePractice]=useState<GoalPractice|null>(null);
  const main = useRef<HTMLElement>(null);
  const destinations: { label: Tab; icon: IconName }[] = [{label:'Today',icon:'home'},{label:'Yoro',icon:'chat'},{label:'Voices',icon:'compass'},{label:'My Voice',icon:'user'}];
  const refresh=useCallback(async()=>{setApp(await api<AppState>('state'));},[]);
  useEffect(()=>{refresh().catch(e=>setError(e.message));},[refresh]);
  function go(next: Tab) { setTab(next); if(next==='Today')setLessonOpen(false); window.scrollTo({top:0,behavior:'instant'}); main.current?.focus({preventScroll:true}); }
  return <><a className="skip-link" href="#main">Skip to content</a><div className="app-shell"><aside className="sidebar"><button className="brand-button" onClick={()=>go('Today')} aria-label="Yoro home"><Wordmark /></button><span className="sidebar-caption">FIND YOUR VOICE</span><nav className="main-nav" aria-label="Main navigation">{destinations.map(({label,icon})=><button key={label} aria-current={tab===label?'page':undefined} aria-pressed={tab===label} onClick={()=>go(label)}><Icon name={icon}/><span>{label}</span></button>)}</nav><div className="sidebar-bottom"><p>Same you.<br /><strong>Braver conversations.</strong></p><button className="profile-shortcut" onClick={()=>go('My Voice')}><span className="initial-avatar">{app?.profile.name?.slice(0,1).toUpperCase() || <Icon name="user" size={18}/>}</span><span>{app?.profile.name || 'Your voice'}<small>Your personal practice space</small></span></button></div></aside><div className="app-content"><header className="topbar"><span className="desktop-breadcrumb">My workspace <span>/</span> <strong>{tab}</strong></span><span className="mobile-wordmark"><Wordmark/></span><button className="topbar-profile" aria-label="Open my profile" onClick={()=>go('My Voice')}><span className="status-dot"/>My space<Icon name="user" size={17}/></button></header><main id="main" ref={main} tabIndex={-1} className={tab==='Today'?'':'workspace-page'}>{error&&<div role="alert" className="notice error"><p>{error}</p><button onClick={()=>{setError('');void refresh().catch(e=>setError(e.message));}}>Try loading again</button></div>}{!app?<div className="loading-space" role="status"><span className="loading-orb"/>Opening your practice space…</div>:<>{app.capabilities.mode==='preview'&&<div className="notice preview-notice"><strong>Preview mode.</strong> Coaching uses authored examples. Your profile and practice history still save.</div>}{tab==='Today'&&(lessonOpen?<><button className="text-button" onClick={()=>go('Today')}>← Back to Today</button><>{activePractice?<><h1>{activePractice.title}</h1><p>{activePractice.reason}</p><PracticeBox focused app={app} refresh={refresh} initialGoal={activePractice.goal} initialText={activePractice.sentence} context={activePractice.cue} initialAttempt={app.attempts.filter(a=>!a.discoveryId&&!a.voiceSessionId&&!a.guided&&a.goal===activePractice.goal).at(-1)}/><button className="text-button" onClick={()=>setActivePractice(null)}>Try another practice format</button></>:<DeliveryPractice app={app} refresh={refresh}/>}</></>:<PracticeHome journey={<LearningJourney activePlanId={app.activePlanId} plans={app.learningPlans||[]} attempts={app.attempts} profile={app.profile} refresh={refresh} live={app.capabilities.mode==='live'} talk={()=>go('Yoro')} quick={()=>{setActivePractice(personal);setLessonOpen(true);}} practice={(plan:LearningPlan,index:number)=><PracticeBox key={plan.id+index} focused app={app} refresh={refresh} planId={plan.id} planStep={index} initialGoal={planTarget(plan,index)?.goal} context={planTarget(plan,index)?.context} initialText={plan.steps[index].sentence} initialAttempt={app.attempts.filter(a=>a.planId===plan.id&&a.planStep===index).at(-1)}/>}/>} introduction={app.introduction} onIntroduction={async profile=>{await api('introduction',profile?{status:'complete',profile}:{status:'skipped'});await refresh();}} profile={app.profile}/>)} {tab==='Today'&&!lessonOpen&&<ReturnLoop items={app.returns||[]} plan={activePlan(app)} refresh={refresh}/>} {tab==='Yoro'&&<CompanionSpace app={app} refresh={refresh} go={go}/>} {tab==='Voices'&&<VoicesLibrary initialSessionId={voiceSessionId} sessions={app.voiceSessions || []} attempts={app.attempts} live={app.capabilities.mode==='live'} speech={app.capabilities.speech} voice={app.capabilities.voices.includes(app.profile.voicePreset)?app.profile.voicePreset:'default'} refresh={refresh} practice={session=><PracticeBox key={session.id} focused app={app} refresh={refresh} kind="speaker" voiceSessionId={session.id} initialGoal={voiceContext(session)?.goal} initialText={session.revision} context={voiceContext(session)?.context} initialAttempt={app.attempts.filter(a=>a.voiceSessionId===session.id).at(-1)}/>}/>} {tab==='My Voice'&&<ProfilePanel app={app} refresh={refresh} go={go} resumeVoice={id=>{setVoiceSessionId(id);go('Voices');}}/>}</>}</main><footer className="app-footer">A little courage. A real connection.<span>yoro</span></footer></div></div></>;
}

