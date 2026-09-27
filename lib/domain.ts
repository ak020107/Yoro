import type {AcousticAnalysis} from './acoustics';
import type { LearningPlan } from './learning-plan';
import type { PersonalVoice } from './personal-voice';
import type { VoiceSession } from './figures';
import type { VoiceChange } from './voice-change';
import type { IntroductionStatus } from './introduction';
import type { Discovery } from './discovery';
import { z } from 'zod';
import type { DeliveryAnalysis } from './delivery';
import type { GuidedPractice } from './guided-lesson';

export const profileSchema = z.object({
  name: z.string().trim().max(60),
  strengths: z.string().trim().max(1000),
  workingOn: z.string().trim().max(1000),
  intention: z.string().trim().max(500),
  situations: z.string().trim().max(1000),
  coachingStyle: z.enum(['gentle', 'direct', 'playful']),
  voicePreset: z.enum(['default', 'us', 'uk']),
  focus: z.string().trim().max(500),
});
export type Profile = z.infer<typeof profileSchema>;
export const emptyProfile: Profile = { name: '', strengths: '', workingOn: '', intention: '', situations: '', coachingStyle: 'gentle', voicePreset: 'default', focus: '' };

export type Mode = 'advice' | 'delivery' | 'scenario' | 'speaker';
export type Source = 'preview' | 'gemini' | 'measurements';
export type Word = { text: string; start: number; end: number };
export const insightSchema=z.object({category:z.enum(['expression','enunciation','wording','structure']),kind:z.enum(['keep','try']),quote:z.string().trim().min(1).max(250),observation:z.string().min(1).max(350),action:z.string().max(350)});
export const feedbackSchema = z.object({
  summary: z.string().max(1600),
  strength: z.string().max(500).nullable(),
  observation: z.object({ quote: z.string().max(600), explanation: z.string().max(800) }).nullable(),
  adjustment: z.string().max(700),
  example: z.string().max(700),
  nextPrompt: z.string().max(500),
  insights:z.array(insightSchema).max(4).optional(),
});
export type Feedback = z.infer<typeof feedbackSchema> & { evidence?: { start: number; end: number }; evidenceRemoved?: boolean };
export type Attempt = {
  id: string; kind: Mode; lessonId?: string; goal: string; context: string;
  transcript: string; input: 'text' | 'audio'; parentId?: string;
  feedback: Feedback; words: Word[]; source: Source; createdAt: string;
  acoustics?:AcousticAnalysis; savedComparison?:boolean; duration?: number; reflection?: string; delivery?: DeliveryAnalysis;
  planId?: string; planStep?: number; guided?: GuidedPractice; discoveryId?: string; voiceSessionId?: string; change?: VoiceChange | null; comparisonNote?: string;
};
export type ChatMessage = { role: 'user' | 'coach'; text: string; source?: Source };
export type Turn = { role: 'partner' | 'user'; text: string; source?: Source };
export type Scenario = { id: string; context: string; goal: string; mood: 'friendly' | 'brief' | 'distracted'; turns: Turn[] };
export type ReturnCheck={id:string;planId:string;dueAt:string;completedAt?:string;outcome?:'helped'|'mixed'|'hard'|'not_yet';note?:string;notifiedAt?:string};
export type State = { activePlanId?:string; returns?:ReturnCheck[]; learningPlans?: LearningPlan[]; personalVoice?: PersonalVoice | null; voiceSessions?: VoiceSession[]; introduction?: IntroductionStatus; discovery?: Discovery; profile: Profile; attempts: Attempt[]; messages: ChatMessage[]; scenarios: Scenario[]; completed: string[]; memory: { assistantId?: string; status: 'off' | 'synced' | 'pending' | 'error'; revision: number } };
export function initialState(): State { return { activePlanId:undefined, returns:[], learningPlans: [], personalVoice: null, voiceSessions: [], introduction: 'new', discovery: { turns: [] }, profile: { ...emptyProfile }, attempts: [], messages: [], scenarios: [], completed: [], memory: { status: 'off', revision: 0 } }; }

export const lessons = [
  { id: 'contrast', speaker: 'Steve Jobs', title: 'Give the key idea space', technique: 'Contrast and a deliberate pause', prompt: 'Explain a project you care about. Contrast the old difficulty with the change you want to make.', script: 'The problem is not a lack of ideas. It is finding the time to act on them.', notice: 'Which change makes the contrast easier to follow?', choices: ['A pause between the two ideas', 'Saying every word as quickly as possible'], answer: 0, rationale: 'A pause can mark the transition so a listener can follow the contrast.', note: 'Original practice material. Speaker reference selection and editorial verification are pending; this is a technique exercise, not a verified analysis of a specific speech.' },
  { id: 'acknowledge', speaker: 'Oprah Winfrey', title: 'Acknowledge before asking', technique: 'Listening and a relevant follow-up', prompt: 'A friend says: “I worked hard on this, and I am disappointed with how it went.” Respond with an acknowledgment and an open question.', script: 'You put a lot into this. What part felt most disappointing?', notice: 'What makes this response connected to the other person?', choices: ['It immediately changes the subject', 'It acknowledges their effort before asking a question'], answer: 1, rationale: 'Acknowledging a detail shows what you heard; an open question gives them room to explain.', note: 'Original practice material. Speaker reference selection and editorial verification are pending; this is a technique exercise, not a verified analysis of a specific interview.' },
];

export function validateEvidence(raw: unknown, transcript: string, words: Word[], duration?: number, hasAudio=false): Feedback {
  const result: Feedback = feedbackSchema.parse(raw);
  const normalized=(s:string)=>s.toLowerCase().replace(/\s+/g,' ').trim();
  const seen=new Set<string>();
  result.insights=result.insights?.filter(i=>{if(seen.has(i.category)||(!hasAudio&&['expression','enunciation'].includes(i.category))||!normalized(transcript).includes(normalized(i.quote)))return false;seen.add(i.category);return true;});
  if (!result.observation) return result;
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  const quote = normalize(result.observation.quote);
  if (!quote || !normalize(transcript).includes(quote)) {
    result.observation = null; result.evidenceRemoved = true; return result;
  }
  // Build a word-offset map to validate a clip against actual transcription timing.
  let joined = ''; const spans: { from: number; to: number; word: Word }[] = [];
  for (const word of words) { if (joined) joined += ' '; const from = joined.length; joined += normalize(word.text); spans.push({ from, to: joined.length, word }); }
  const start = joined.indexOf(quote);
  if (start >= 0) {
    const matches = spans.filter(s => s.to > start && s.from < start + quote.length);
    const first = matches[0]?.word.start; const last = matches.at(-1)?.word.end;
    if (typeof first === 'number' && typeof last === 'number' && Number.isFinite(first) && Number.isFinite(last) && first >= 0 && last > first && (duration === undefined || last <= duration + 0.05)) result.evidence = { start: first, end: last };
  }
  return result;
}

export function comparison(a: Attempt, b: Attempt) {
  const count = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;
  return { firstWords: count(a.transcript), secondWords: count(b.transcript), firstSeconds: a.duration ?? null, secondSeconds: b.duration ?? null,
    note: 'These are descriptive differences, not a score. Listen to both attempts and decide which better expresses your intention.' };
}
