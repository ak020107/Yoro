import {allowedOrigins,secureSessionCookie} from '@/lib/deployment';
import {boundedBody} from '@/lib/request-body';
import {directionSchema,directedWords} from '@/lib/speech-direction';
import {reminderDate,returnOutcome} from '@/lib/return-habit';
import {measureAcoustics,pcmFromWav} from '@/lib/acoustics';
import {activePlan,planProgress,planTarget} from '@/lib/learning-plan';
import {prepareLearningPlan} from '@/lib/providers';
import { handlePersonalVoice, clearPersonalVoice } from '@/lib/personal-voice-route';
import { publicVoice } from '@/lib/personal-voice';
import { findChallenge, voiceContext, type VoiceSession } from '@/lib/figures';
import { comparableRetry, validateChange } from '@/lib/voice-change';
import { groundedWording } from '@/lib/discovery';
import { practiceMoment } from '@/lib/practice-moment';
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { guidedSchema, guidedContext, validGuidedParent } from '@/lib/guided-lesson';
import { emotionIds } from '@/lib/speech-styles';
import { measureDelivery, chooseDrill } from '@/lib/delivery';
import { z } from 'zod';
import { getState, transaction, reset, saveAudio, audio, retainAudio } from '@/lib/store';
import { profileSchema, lessons, validateEvidence, comparison, type Attempt, type Mode } from '@/lib/domain';
import { advice, analyze, discoverDelivery, rewriteVoice, capabilities, isLive, transcribe, partner, speak, syncMemory, deleteMemory, ServiceError } from '@/lib/providers';

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';
const limit = 15 * 1024 * 1024;
const budgets = new Map<string, { time: number; count: number }>();
type Context = { params: Promise<{ path: string[] }> };
function text(value: unknown, max = 3000) { return z.string().trim().min(1).max(max).parse(value); }
function ownedAttempt(attempts: Attempt[], id: string) { const a = attempts.find(a => a.id === id); if (!a) throw new ServiceError('Attempt not found.', 404); return a; }
async function handler(req: NextRequest, ctx: Context) {
  const { path } = await ctx.params;
  const action = path.join('/');
  const token = req.cookies.get('voice_session')?.value;
  const session = token && /^[a-f0-9]{64}$/.test(token) ? token : randomBytes(32).toString('hex');
  const respond = (data: unknown, status = 200) => {
    const response = NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
    if (session !== token) response.cookies.set('voice_session', session, { httpOnly: true, sameSite: 'strict', secure: secureSessionCookie(), path: '/', maxAge: 60 * 60 * 24 * 30 });
    return response;
  };
  try {
    if (req.method !== 'GET') {
      const origin = req.headers.get('origin');
      const allowed = allowedOrigins();
      if (!origin || !allowed.has(origin)) return respond({ error: 'This request came from an unrecognized origin.' }, 403);
      if (Number(req.headers.get('content-length') || 0) > limit) return respond({ error: 'Recording is too large. Keep it under 45 seconds.' }, 413);
      // Cookie must be obtained with the initial same-origin state request before paid actions.
      if (!token || token !== session) return respond({ error: 'Refresh the page before continuing.' }, 401);
      const now = Date.now(); const budget = budgets.get(session);
      if (budget && now - budget.time < 60000 && budget.count >= 20) return respond({ error: 'Please wait a minute before making more requests.' }, 429);
      budgets.set(session, budget && now - budget.time < 60000 ? { ...budget, count: budget.count + 1 } : { time: now, count: 1 });
      if (budgets.size > 5000) for (const [id, b] of budgets) if (now - b.time > 60000) budgets.delete(id);
    }
    if(req.method==='POST'){const bytes=await boundedBody(req,limit);req=new NextRequest(req.url,{method:req.method,headers:req.headers,body:bytes});}
    if(action==='personal-voice'||action.startsWith('personal-voice/')) return await handlePersonalVoice(req,session,action);
    if (req.method === 'GET' && action === 'state') {
      const state = await getState(session);
      return respond({ ...state, personalVoice:publicVoice(state.personalVoice), memory: { status: state.memory.status }, capabilities: capabilities(), lessons });
    }
    if (req.method === 'GET' && path[0] === 'audio' && path[1]) {
      const state = await getState(session); ownedAttempt(state.attempts, path[1]);
      const result = await audio(session, path[1]);
      if (!result) return respond({ error: 'Recording expired or is unavailable.' }, 404);
      return new NextResponse(new Uint8Array(result.bytes), { headers: { 'Content-Type': result.mime, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
    }
    if (req.method === 'POST' && action === 'attempts') {
      const form = await req.formData();
      const idempotency = z.string().uuid().parse(form.get('requestId'));
      return await transaction(session, async state => {
        const existing = state.attempts.find(a => a.id === idempotency); if (existing) return respond(existing);
        const planId=z.string().uuid().optional().parse(form.get('planId')||undefined);
        const planStep=planId?z.coerce.number().int().min(0).max(3).parse(form.get('planStep')??NaN):undefined;
        const learningPlan=planId?state.learningPlans?.find(p=>p.id===planId):undefined;
        if(planId&&!learningPlan)throw new ServiceError('Plan not found.',404);
        if(learningPlan&&planStep!>planProgress(learningPlan,state.attempts).unlocked)throw new ServiceError('Finish the previous practice and reflection first.',409);
        const kind = z.enum(['advice', 'delivery', 'scenario', 'speaker']).parse(form.get('kind')) as Mode;
        const guided = form.get('guided') ? guidedSchema.parse(JSON.parse(String(form.get('guided')))) : undefined;
        const voiceSessionId = z.string().uuid().optional().parse(form.get('voiceSessionId') || undefined);
        const voiceSession = voiceSessionId ? state.voiceSessions?.find(v => v.id === voiceSessionId) : undefined;
        if (voiceSessionId && !voiceSession) throw new ServiceError('Voice practice not found.', 404);
        if (voiceSession && (kind !== 'speaker' || guided || form.get('discoveryId') || form.get('lessonId'))) throw new ServiceError('Choose one practice at a time.', 400);
        if(planId&&(kind!=='delivery'||guided||voiceSessionId||form.get('discoveryId')||form.get('lessonId')))throw new ServiceError('Choose one practice at a time.',400);
        const learningTarget=learningPlan?planTarget(learningPlan,planStep!):null;
        const voiceTarget = voiceSession ? voiceContext(voiceSession) : null;
        const { goal, context } = learningTarget || voiceTarget || (guided ? guidedContext(guided) : { goal: text(form.get('goal'), 500), context: z.string().max(3000).parse(form.get('context') || '') });
        const parentId = z.string().uuid().optional().parse(form.get('parentId') || undefined);
        const parent = parentId ? ownedAttempt(state.attempts, parentId) : undefined;
        if(parent&&((parent.planId??undefined)!==planId||(parent.planStep??undefined)!==planStep))throw new ServiceError('Compare attempts from the same plan step.',400);
        if (parent && (parent.voiceSessionId??undefined) !== voiceSessionId) throw new ServiceError('Compare takes from the same voice practice.', 400);
        if (guided && (kind !== 'delivery' || !validGuidedParent(guided, parent))) throw new ServiceError('Complete the previous lesson step before continuing.', 400);
        const lessonId = z.string().max(60).optional().parse(form.get('lessonId') || undefined);
        if (guided && lessonId) throw new ServiceError('Choose one lesson at a time.', 400);
        if (lessonId && !lessons.some(l => l.id === lessonId)) throw new ServiceError('Unknown lesson.', 400);
        const discoveryId = z.string().uuid().optional().parse(form.get('discoveryId') || undefined);
        if (discoveryId && !state.discovery?.turns.some(t => t.id === discoveryId)) throw new ServiceError('Conversation not found.',404);
        const file = form.get('audio'); let transcript = z.string().max(4000).parse(form.get('text') || '');
        let words: { text: string; start: number; end: number }[] = []; let clip: { bytes: Buffer; mime: string } | undefined;
        let duration: number | undefined;
        if (file instanceof File && file.size) {
          const mime = file.type.split(';')[0];
          if (!['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/mpeg'].includes(mime) || file.size > limit) throw new ServiceError('Unsupported or oversized recording.', 422);
          duration = z.coerce.number().positive().max(46).parse(form.get('duration'));
          clip = { bytes: Buffer.from(await file.arrayBuffer()), mime };
          const pcm=pcmFromWav(clip.bytes);if(process.env.NODE_ENV==='production'&&!pcm)throw new ServiceError('Please record again or upload a recording through Yoro so it can prepare a supported audio file.',422);if(pcm){duration=pcm.length/16000;if(duration>46||duration<.5)throw new ServiceError('Use a recording under 45 seconds.',422);}
          if (parent) { const prior = await audio(session,parent.id); if(prior && prior.bytes.equals(clip.bytes)) throw new ServiceError('This is the same recording as your previous take. Replay it below, or record a new take to compare a change.',422); }
          if (isLive()) { const result = await transcribe(clip.bytes, clip.mime); transcript = result.text; words = result.words; }
          else transcript ||= '(Preview recording — transcription is not connected.)';
        }
        if (guided && (!clip || !isLive())) throw new ServiceError('This lesson needs live audio coaching. You can still listen and rehearse, but your voice has not been assessed.', 422);
        if (!transcript.trim()) throw new ServiceError('Record a response or enter some text first.', 422);
        const pcm=clip?pcmFromWav(clip.bytes):null;
        if(pcm){duration=pcm.length/16000;if(duration>46||duration<.5)throw new ServiceError('Use a recording under 45 seconds.',422);}
        const acoustics=pcm?measureAcoustics(pcm):undefined;
        const delivery = clip && isLive() ? measureDelivery(words, duration) : undefined;
        if (delivery && !guided && !voiceSession) delivery.drill = chooseDrill(delivery, `${goal} ${state.profile.workingOn} ${state.profile.focus}`);
        let source: Attempt['source'] = isLive() ? 'gemini' : 'preview';
        let raw;
        const priorAudio = clip && isLive() && comparableRetry(parent,kind,goal,guided?.stage) ? await audio(session,parent!.id) : null;
        const previous = priorAudio && parent && clip && priorAudio.bytes.length+clip.bytes.length<=14*1024*1024 ? {attempt:parent,clip:priorAudio} : undefined;
        try { raw = await analyze(transcript, goal, context, state.profile, clip, delivery, guided, previous, acoustics); }
        catch (error) {
          if (!(error instanceof ServiceError) || error.status < 500 || delivery?.status !== 'available' || !delivery.drill) throw error;
          source = 'measurements';
          raw = { summary: 'The AI listening coach is temporarily unavailable. Your transcript timing analysis and practice exercise are ready.', strength: null, observation: null,
            adjustment: delivery.drill.instruction, example: '', nextPrompt: delivery.drill.transferPrompt };
        }
        const change = previous && source==='gemini' && 'change' in raw ? validateChange(raw.change ?? null,previous.attempt.transcript,transcript) : null;
        const comparisonNote = parentId && !change ? (guided?.stage==='transfer'?'This is a new sentence, so I’m coaching this take on its own.':!previous?'I couldn’t compare both recordings. This feedback is about your current take.':'I don’t have a reliable comparison for these takes yet.') : undefined;
        const feedback = validateEvidence(raw, transcript, words, duration, !!clip);
        const attempt: Attempt = { id: idempotency, kind, lessonId, goal, context, transcript, input: clip ? 'audio' : 'text', parentId, feedback, words, source, createdAt: new Date().toISOString(), duration, delivery, acoustics, planId, planStep, guided, discoveryId, voiceSessionId, change, comparisonNote };
        if (clip) await saveAudio(session, attempt.id, clip.bytes, clip.mime);
        state.attempts.push(attempt);
        if (lessonId && parentId && !state.completed.includes(lessonId)) state.completed.push(lessonId);
        return respond(attempt);
      });
    }
    if (req.method === 'DELETE' && action === 'reset') {
      await clearPersonalVoice(session); const state = await getState(session); await deleteMemory(state.memory.assistantId); await reset(session); return respond({ ok: true });
    }
    const raw = req.method === 'POST' ? await req.text() : '';
    if (raw.length > 16000) return respond({ error: 'Input is too long.' }, 413);
    const body = raw ? JSON.parse(raw) : {};
    if(req.method==='POST'&&action==='learning-plan/select')return await transaction(session,state=>{const id=z.string().uuid().parse(body.id);if(!state.learningPlans?.some(p=>p.id===id))throw new ServiceError('Plan not found.',404);state.activePlanId=id;return respond({ok:true});});
    if(req.method==='POST'&&action==='return-check')return await transaction(session,state=>{
      const planId=z.string().uuid().parse(body.planId);if(!state.learningPlans?.some(p=>p.id===planId))throw new ServiceError('Plan not found.',404);
      let dueAt:string;try{dueAt=reminderDate(body.dueAt);}catch{throw new ServiceError('Choose a check-in within the next 90 days.',400);}
      state.returns ||= [];const pending=state.returns.find(r=>r.planId===planId&&!r.completedAt);if(pending){pending.dueAt=dueAt;delete pending.notifiedAt;return respond(pending);}
      const value={id:randomUUID(),planId,dueAt};state.returns.push(value);return respond(value);
    });
    if(req.method==='POST'&&(action==='return-check/complete'||action==='return-check/notified'))return await transaction(session,state=>{
      const r=state.returns?.find(r=>r.id===z.string().uuid().parse(body.id));if(!r)throw new ServiceError('Check-in not found.',404);
      if(action.endsWith('/notified')){if(Date.parse(r.dueAt)>Date.now()||r.completedAt)throw new ServiceError('This check-in is not due.',409);r.notifiedAt ||= new Date().toISOString();}
      else if(!r.completedAt){r.outcome=returnOutcome.parse(body.outcome);r.note=z.string().trim().max(600).parse(body.note||'');r.completedAt=new Date().toISOString();}
      return respond(r);
    });
    if(req.method==='POST'&&action==='comparisons/save')return await transaction(session,async state=>{
      const a=ownedAttempt(state.attempts,z.string().uuid().parse(body.id));const keep=z.boolean().parse(body.keep);
      if(!a.parentId||a.input!=='audio')throw new ServiceError('Choose a pair of recordings.',400);
      const parent=ownedAttempt(state.attempts,a.parentId);if(parent.input!=='audio')throw new ServiceError('Choose a pair of recordings.',400);
      if(keep&&(!(await audio(session,a.id))||!(await audio(session,parent.id))))throw new ServiceError('A recording has expired. Make a new comparison to keep.',410);
      for(const id of [a.id,parent.id]){const shared=state.attempts.some(other=>other.id!==a.id&&other.savedComparison&&(other.id===id||other.parentId===id));if(await audio(session,id))await retainAudio(session,id,keep||shared);}
      a.savedComparison=keep;return respond({ok:true});
    });
    if(req.method==='POST'&&action==='learning-plan'){
      const id=z.string().uuid().parse(body.requestId);const task=text(body.task,1000);
      return await transaction(session,async state=>{const existing=state.learningPlans?.find(p=>p.id===id);if(existing)return respond(existing);const baselineId=z.string().uuid().optional().parse(body.baselineId);const baseline=baselineId?ownedAttempt(state.attempts,baselineId):undefined;if(baseline&&(baseline.input!=='audio'||baseline.source!=='gemini'))throw new ServiceError('Use a starting recording assessed by live coaching.',422);const draft=await prepareLearningPlan(task,state.profile,state.attempts,state.returns,baseline);const plan={...draft,id,task,baselineId,createdAt:new Date().toISOString()};state.learningPlans=[...(state.learningPlans||[]),plan];state.activePlanId=plan.id;return respond(plan);});
    }
    if (req.method === 'POST' && (action === 'profile' || action === 'introduction')) {
      const introStatus = action === 'introduction' ? z.enum(['skipped','complete']).parse(body.status) : undefined;
      if (introStatus === 'skipped') return await transaction(session,state=>{state.introduction='skipped';return respond({ok:true});});
      const profile = profileSchema.parse(action === 'introduction' ? body.profile : body);
      return await transaction(session, async state => {
        // Do not keep obsolete facts in external memory after local edits.
        if (state.memory.assistantId) { await deleteMemory(state.memory.assistantId); state.memory.assistantId = undefined; }
        state.profile = profile; if (introStatus) state.introduction = introStatus; state.memory.status = 'off'; state.memory.revision += 1;
        return respond({ profile, memory: { status: state.memory.status } });
      });
    }
    if (req.method === 'POST' && action === 'memory/sync') {
      return await transaction(session, async state => {
        try { const id = await syncMemory(state.memory.assistantId, state.profile); state.memory = { assistantId: id, status: id ? 'synced' : 'off', revision: state.memory.revision }; }
        catch { state.memory.status = 'error'; return respond({ error: 'Profile is saved locally, but external memory sync failed. Check the Backboard account and try again.' }, 503); }
        return respond({ status: state.memory.status });
      });
    }
    if (req.method === 'POST' && action === 'voices') {
      const id = z.string().uuid().parse(body.requestId);
      const figureId = text(body.figureId, 40); const challengeId = text(body.challengeId, 40);
      const entry = findChallenge(figureId, challengeId);
      if (!entry) throw new ServiceError('Choose a voice and challenge from the library.', 400);
      const original = body.example === true ? entry.challenge.example : text(body.text, 1500);
      return await transaction(session, async state => {
        const sessions = state.voiceSessions || [];
        const existing = sessions.find(v => v.id === id); if (existing) return respond(existing);
        const result = body.example === true
          ? {revision:original,explanation:'An original Yoro exercise for this technique. Try it, then bring the technique to your own words.',cue:entry.challenge.cue,wordChoices:[]}
          : await rewriteVoice(original, entry.figure, entry.challenge, state.profile);
        const value: VoiceSession = {...result,id,figureId,challengeId,original,source:body.example===true?'authored':'gemini',createdAt:new Date().toISOString()};
        state.voiceSessions = [...sessions,value];
        return respond(value);
      });
    }
    if (req.method === 'POST' && action === 'discovery') {
      const id = z.string().uuid().parse(body.requestId);
      const message = text(body.message, 1500);
      return await transaction(session, async state => {
        const turns = state.discovery?.turns || [];
        const existing = turns.find(t => t.id === id);
        if (existing) return respond(existing);
        const practice = state.attempts.filter(a=>a.source!=='preview').slice(-6);
        const result = await discoverDelivery(message, state.profile, turns, practice, activePlan(state), activePlan(state)?Math.min(planProgress(activePlan(state)!,state.attempts).unlocked,3):undefined,state.returns);
        const wording = groundedWording(result.wording,[message,...turns.map(t=>t.message),...practice.map(a=>a.transcript)]);
        const turn = {id,message,reply:result.reply,plan:result.exercise ? {...result.exercise,reply:result.reply} : null,wording};
        state.discovery = { turns: [...turns, turn].slice(-12) };
        return respond(turn);
      });
    }
    if (req.method === 'POST' && action === 'advice') {
      const message = text(body.message);
      return await transaction(session, async state => {
        const result = await advice(message, state.profile, state.messages.slice(-6).map(m => `${m.role}: ${m.text}`));
        state.messages.push({ role: 'user', text: message }, { role: 'coach', ...result }); state.messages = state.messages.slice(-30);
        return respond(result);
      });
    }
    if (req.method === 'POST' && action === 'scenarios') {
      const context = text(body.context); const goal = text(body.goal, 500); const mood = z.enum(['friendly', 'brief', 'distracted']).parse(body.mood);
      return await transaction(session, async state => {
        const opening = await partner(context, goal, mood, []);
        const scenario = { id: randomUUID(), context, goal, mood, turns: [{ role: 'partner' as const, ...opening }] };
        state.scenarios.push(scenario); state.scenarios = state.scenarios.slice(-10); return respond(scenario);
      });
    }
    if (req.method === 'POST' && /^scenarios\/[^/]+\/turn$/.test(action)) {
      return await transaction(session, async state => {
        const scenario = state.scenarios.find(s => s.id === path[1]); if (!scenario) throw new ServiceError('Scenario not found.', 404);
        const rewind = body.rewind === true;
        if (rewind) { if (scenario.turns.length < 3) throw new ServiceError('There is no turn to retry yet.', 400); scenario.turns.splice(-2); }
        else {
          if (scenario.turns.filter(t => t.role === 'user').length >= 3) throw new ServiceError('This rehearsal is complete. Review it or start another.', 400);
          const message = text(body.message, 1500);
          const turns = [...scenario.turns, { role: 'user' as const, text: message }];
          const reply = await partner(scenario.context, scenario.goal, scenario.mood, turns);
          scenario.turns.push({ role: 'user', text: message }, { role: 'partner', ...reply });
        }
        return respond(scenario);
      });
    }
    if (req.method === 'POST' && action === 'compare') {
      const state = await getState(session); const second = ownedAttempt(state.attempts, text(body.secondId, 50));
      if (!second.parentId) throw new ServiceError('Choose a retry to compare.', 400);
      return respond(comparison(ownedAttempt(state.attempts, second.parentId), second));
    }
    if (req.method === 'POST' && action === 'reflection') {
      return await transaction(session, state => { const a = ownedAttempt(state.attempts, text(body.id, 50)); a.reflection = z.enum(['first', 'second', 'unsure']).parse(body.choice); return respond({ ok: true }); });
    }
    if (req.method === 'POST' && action === 'phrase-demo') {
      const id = z.string().uuid().parse(body.id);
      return await transaction(session, async state => {
        const attempt = ownedAttempt(state.attempts, id);
        const moment = practiceMoment(attempt);
        if (attempt.guided?.id !== 'welcome' || attempt.input !== 'audio' || attempt.source !== 'gemini' || !moment) throw new ServiceError('No supported phrase is available for this lesson.', 422);
        const fingerprint = createHash('sha256').update(JSON.stringify(['welcome-demo-v1', id, moment.quote, process.env.ELEVENLABS_VOICE_ID, process.env.ELEVENLABS_TTS_MODEL])).digest('hex');
        const cacheId = fingerprint.slice(0,8)+'-'+fingerprint.slice(8,12)+'-'+fingerprint.slice(12,16)+'-'+fingerprint.slice(16,20)+'-'+fingerprint.slice(20,32);
        const cached = await audio(session, cacheId);
        const bytes = cached?.bytes ?? Buffer.from(await speak(moment.quote, 'warm', 'default', 'expressive'));
        if (!cached) await saveAudio(session, cacheId, bytes, 'audio/mpeg');
        return new NextResponse(new Uint8Array(bytes), { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } });
      });
    }
    if (req.method === 'POST' && action === 'speech') {
      const sentence = text(body.text, 700); const emotion = z.enum(emotionIds).parse(body.emotion);
      if (/[\[\]<>]/.test(sentence)) throw new ServiceError('Enter spoken words without audio tags or markup.', 422);
      const intensity = z.enum(['natural', 'expressive']).default('natural').parse(body.intensity);
      const preset = z.enum(['default', 'us', 'uk']).parse(body.preset);
      const direction=directionSchema.optional().parse(body.direction);try{directedWords(sentence,direction);}catch{throw new ServiceError('Directions must match the example words.',422);}
      const fingerprint = createHash('sha256').update(JSON.stringify(['speech-v2',sentence,emotion,preset,intensity,direction,process.env.ELEVENLABS_TTS_MODEL,process.env.ELEVENLABS_VOICE_ID,process.env.ELEVENLABS_US_VOICE_ID,process.env.ELEVENLABS_UK_VOICE_ID])).digest('hex');
      const cacheId = fingerprint.slice(0,8)+'-'+fingerprint.slice(8,12)+'-'+fingerprint.slice(12,16)+'-'+fingerprint.slice(16,20)+'-'+fingerprint.slice(20,32);
      return await transaction(session, async () => {
      const cached = body.fresh === true ? null : await audio(session,cacheId);
      const bytes = cached?.bytes ?? Buffer.from(await speak(sentence,emotion,preset,intensity,direction));
      if (!cached) await saveAudio(session,cacheId,bytes,'audio/mpeg');
      return new NextResponse(new Uint8Array(bytes), { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } });
      });
    }
    return respond({ error: 'Not found.' }, 404);
  } catch (e) {
    if (e instanceof z.ZodError || e instanceof SyntaxError) return respond({ error: 'Some input is missing or invalid. Check the fields and try again.' }, 400);
    if (e instanceof ServiceError) return respond({ error: e.message }, e.status);
    console.error('Request failed:', e instanceof Error ? e.name : 'Unknown error');
    return respond({ error: 'This could not be saved or processed. Please try again.' }, 500);
  }
}
export const GET = handler;
export const POST = handler;
export const DELETE = handler;
