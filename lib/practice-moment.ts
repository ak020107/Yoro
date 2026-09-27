import type { Attempt } from './domain';

// Never synthesize or seek to a model-invented excerpt.
export function practiceMoment(attempt: Attempt) {
  const quote = attempt.feedback.observation?.quote.trim();
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!quote || quote.length > 700 || /[\[\]<>]/.test(quote) || !normalize(attempt.transcript).includes(normalize(quote))) return null;
  const e = attempt.feedback.evidence;
  const range = e && Number.isFinite(e.start) && Number.isFinite(e.end) && e.start >= 0 && e.end > e.start && typeof attempt.duration === 'number' && e.end <= attempt.duration ? e : null;
  return { quote, range };
}
export function practiceProgress(attempts: Attempt[]) {
  const real = attempts.filter(a => a.source !== 'preview' && a.input === 'audio');
  const reflections = real.filter(a => a.parentId && ['first','second','unsure'].includes(a.reflection || ''));
  return { recordings: real.length, reflections: reflections.length, preferredRetry: reflections.filter(a => a.reflection === 'second').length,
    lessons: real.filter(a => a.guided?.stage === 'transfer' && a.source === 'gemini').length + new Set(reflections.filter(a=>a.source==='gemini'&&(a.planId||a.voiceSessionId)&&real.some(p=>p.id===a.parentId&&p.source==='gemini'&&p.planId===a.planId&&p.planStep===a.planStep&&p.voiceSessionId===a.voiceSessionId)).map(a=>a.planId?`plan:${a.planId}:${a.planStep}`:`voice:${a.voiceSessionId}`)).size };
}

export function latestLessonRun(attempts: Attempt[]): Attempt[] {
  const last = attempts.filter(a => a.guided?.id === 'welcome' && a.source === 'gemini' && a.input === 'audio').at(-1);
  if (!last) return [];
  const run: Attempt[] = [last];
  while (run[0].parentId && run.length < 3) {
    const parent = attempts.find(a => a.id === run[0].parentId && a.guided?.id === 'welcome' && a.source === 'gemini');
    if (!parent || run.some(a => a.id === parent.id)) return [];
    run.unshift(parent);
  }
  return run[0].guided?.stage === 'first' ? run : [];
}
