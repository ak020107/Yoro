/** Deterministic, ASR-derived timing descriptors. Not acoustic emotion or fluency scores. */
export type TimedWord = { text: string; start: number; end: number };
export type DeliveryEvent = { kind: 'filler' | 'repeat' | 'gap'; start: number; end: number; quote: string; note: string };
export type DeliveryAnalysis = {
  version: 'timing-1'; status: 'available' | 'insufficient'; reason?: string;
  tokenCount: number; spanSeconds: number; wordsPerMinute: number | null;
  fillersPer100: number | null; fillerCount: number; repeatCount: number;
  gapCount: number; gapSeconds: number;
  fastestWindow: { start: number; end: number; wordsPerMinute: number } | null;
  gapSensitivity: { thresholdSeconds: number; count: number }[];
  events: DeliveryEvent[];
  drill: { title: string; instruction: string; successCheck: string; transferPrompt: string } | null;
  limitations: string[];
};
const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}']/gu, '');
const filler = (s: string) => /^(u+h+m*|u+m+|e+r+m*)$/.test(norm(s));
const round = (n: number) => Math.round(n * 10) / 10;
const limitations = [
  'Estimated from automatic word timestamps; transcription may miss or mishear words and fillers.',
  'Gaps are between recognized words, not confirmed silence. Breaths and unrecognized speech may occur there.',
  'English filler rules only. Repetition can be intentional. No universal ideal pace or emotion score is assumed.',
];
export function measureDelivery(input: TimedWord[], duration?: number): DeliveryAnalysis {
  const base: DeliveryAnalysis = { version: 'timing-1', status: 'insufficient', tokenCount: 0, spanSeconds: 0, wordsPerMinute: null,
    fillersPer100: null, fillerCount: 0, repeatCount: 0, gapCount: 0, gapSeconds: 0,
    fastestWindow: null, gapSensitivity: [], events: [], drill: null, limitations: [...limitations] };
  // Fail closed: silently dropping/reordering malformed timestamps can produce plausible false metrics.
  if ((duration !== undefined && (!Number.isFinite(duration) || duration <= 0)) || input.some((w, i) =>
    !Number.isFinite(w.start) || !Number.isFinite(w.end) || w.start < 0 || w.end < w.start ||
    (duration !== undefined && w.end > duration + 0.1) || (i > 0 && w.start < input[i - 1].end - 0.05))) {
    return { ...base, reason: 'Word timing is inconsistent; pace and event counts are withheld.' };
  }
  const words = input.filter(w => norm(w.text));
  if (words.some(w => w.end === w.start)) base.limitations.push('Some recognized words have point timestamps rather than reliable durations; local timing near those words is uncertain.');
  if (words.length < 2) return { ...base, reason: 'More timed speech is needed.' };
  const start = words[0].start, end = words.at(-1)!.end, span = end - start;
  base.tokenCount = words.length; base.spanSeconds = round(span);
  if (words.length < 8 || span < 5) return { ...base, reason: 'Record at least five seconds and eight recognized words for a useful timing summary.' };
  const events: DeliveryEvent[] = [], gaps: number[] = [];
  const excerpt = (i: number) => words.slice(Math.max(0, i - 2), Math.min(words.length, i + 4)).map(w => w.text).join(' ');
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (filler(w.text)) events.push({ kind: 'filler', start: w.start, end: w.end, quote: excerpt(i), note: 'Recognized filled pause. Check whether it interrupts this thought.' });
    if (i > 0) {
      const previous = words[i - 1], gap = w.start - previous.end;
      gaps.push(gap);
      if (gap >= 0.25) events.push({ kind: 'gap', start: previous.end, end: w.start, quote: `${previous.text} … ${w.text}`, note: 'Word-timestamp gap. It may be a useful pause; listen in context.' });
    }
  }
  // Exact one-to-three-word tandem repeats; longer/partial repairs need contextual review.
  for (let i = 0; i < words.length - 1; i++) {
    for (let size = 3; size >= 1; size--) {
      const matches = (at: number) => at + size <= words.length && words[at].start - words[at - 1].end < 1.5 &&
        words.slice(i, i + size).every((w, j) => !filler(w.text) && norm(w.text) === norm(words[at + j].text));
      if (i + size >= words.length || !matches(i + size)) continue;
      let until = i + 2 * size;
      while (matches(until)) until += size;
      events.push({ kind: 'repeat', start: words[i].start, end: words[until - 1].end,
        quote: words.slice(Math.max(0, i - 2), Math.min(words.length, until + 2)).map(w => w.text).join(' '),
        note: 'Repeated word or short phrase candidate, not automatically an error.' });
      i = until - 1; break;
    }
  }
  let fastestWindow: DeliveryAnalysis['fastestWindow'] = null;
  // Fixed five-second windows prevent a very short phrase yielding an absurd "fastest pace".
  const lastStart = end - 5;
  for (const windowStart of [...new Set([start, ...words.map(w => w.start).filter(t => t <= lastStart), lastStart])]) {
    const windowEnd = windowStart + 5;
    const count = words.filter(w => (w.start + w.end) / 2 >= windowStart && (w.start + w.end) / 2 < windowEnd).length;
    if (!fastestWindow || count * 12 > fastestWindow.wordsPerMinute) fastestWindow = { start: windowStart, end: windowEnd, wordsPerMinute: count * 12 };
  }
  const fillerCount = events.filter(e => e.kind === 'filler').length;
  const repeatCount = events.filter(e => e.kind === 'repeat').length;
  return { ...base, status: 'available', wordsPerMinute: round(words.length / span * 60), fillersPer100: round(fillerCount / words.length * 100),
    fillerCount, repeatCount, gapCount: gaps.filter(g => g >= 0.25).length,
    gapSeconds: round(gaps.filter(g => g >= 0.25).reduce((a, b) => a + b, 0)), fastestWindow,
    gapSensitivity: [0.15, 0.25, 0.5].map(thresholdSeconds => ({ thresholdSeconds, count: gaps.filter(g => g >= thresholdSeconds).length })),
    events: events.sort((a, b) => a.start - b.start) };
}

export function chooseDrill(analysis: DeliveryAnalysis, goal: string): DeliveryAnalysis['drill'] {
  if (analysis.status !== 'available') return null;
  // Transparent product rules, not learned/validated diagnoses; preserve the user's chosen goal.
  if (/filler|uhm|\bum\b|hesitat|rambl|restart|direct|clear/i.test(goal) && (analysis.fillerCount >= 2 || analysis.repeatCount >= 2)) {
    return { title: 'One thought, then a pause', instruction: 'Choose a marked moment. Say the point once, pause while choosing your next thought, then give one example. Keep your usual energy; do not force yourself to speak slowly.',
      successCheck: 'Repeat the same message. Check the marked spot for fewer unwanted fillers or restarts, then listen for whether the meaning and energy survived. A lower count alone is not success.',
      transferPrompt: 'Now explain a different project in two sentences: the point, then one example.' };
  }
  return { title: 'Make one idea land', instruction: 'Choose your most important phrase. Repeat the same message, giving that phrase a deliberate pause before the next idea.',
    successCheck: 'Listen to both versions. Which makes the intended point easier to follow without changing your meaning?',
    transferPrompt: 'Try the same technique in a new introduction.' };
}
