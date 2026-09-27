import { z } from 'zod';
import type { Attempt } from './domain';

export type VoiceChallenge = { id: string; title: string; instruction: string; cue: string; example: string };
export type Figure = { id: string; name: string; initials: string; portrait: {src:string;credit:string;source:string;license:string;licenseUrl:string}; promise: string; lens: string; vocabulary: string; source: { title: string; url: string }; challenges: VoiceChallenge[] };

// Editorial readings of the linked transcripts, not biometric profiles or claims
// about every speech by a person. All exercises below are original Yoro material.
export const figures: Figure[] = [
  { id: 'jobs', portrait: {src:'/figures/jobs.jpg',credit:'Matthew Yohe; crop by MetalGearLiquid / CapLiber',source:'https://commons.wikimedia.org/wiki/File:Steve_Jobs_Headshot_2010-CROP2.jpg',license:'CC BY-SA 3.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/3.0/'}, name: 'Steve Jobs', initials: 'SJ', promise: 'Make your idea easy to remember.',
    lens: 'The Stanford address builds three personal stories into lessons for its audience. Learn to move from a concrete moment to one clear takeaway.',
    vocabulary: 'Everyday verbs, concrete details, short takeaway sentences.',
    source: { title: 'Stanford · 2005 commencement address', url: 'https://news.stanford.edu/stories/2005/06/youve-got-find-love-jobs-says' },
    challenges: [
      { id: 'one-idea', title: 'One idea that lands', instruction: 'Reduce your message to one concrete benefit. Keep the facts; remove the preamble.', cue: 'Give the most important words room. Finish the thought before adding another.', example: 'Our study group helps you leave with one thing you understand better.' },
      { id: 'story', title: 'A moment, then a meaning', instruction: 'Use a real moment from your input, then explain what it taught you. Do not invent an anecdote.', cue: 'Make a small pause at the turn from the moment to its meaning.', example: 'I spent an hour rereading the same page. Explaining it to a friend finally made it click.' },
      { id: 'takeaway', title: 'Leave one thought behind', instruction: 'End with a short takeaway the listener could repeat. Preserve what you actually mean.', cue: 'Let the final thought stand on its own, without trailing into another explanation.', example: 'Start with one question. Leave with one answer you can explain.' },
    ] },
  { id: 'oprah', portrait: {src:'/figures/oprah.jpg',credit:'aphrodite-in-nyc; crop by HalloweenNight',source:'https://commons.wikimedia.org/wiki/File:Oprah_in_2014.jpg',license:'CC BY 2.0',licenseUrl:'https://creativecommons.org/licenses/by/2.0/'}, name: 'Oprah Winfrey', initials: 'OW', promise: 'Make the listener part of the story.',
    lens: 'The Harvard address connects personal setbacks to the audience through direct address and questions. Practice turning your experience into an invitation.',
    vocabulary: 'Personal language, direct address, questions that invite reflection.',
    source: { title: 'Harvard · 2013 commencement address', url: 'https://news.harvard.edu/gazette/story/2013/05/winfreys-commencement-address/' },
    challenges: [
      { id: 'connection', title: 'Start with connection', instruction: 'Connect your message to the listener’s situation without assuming how they feel.', cue: 'Address one person. Emphasize the phrase that makes this relevant to them.', example: 'If you are still working out your next step, we can think it through together.' },
      { id: 'experience', title: 'Make experience useful', instruction: 'Share a true experience from the input, then connect its lesson to the listener. Ask for detail rather than inventing a story.', cue: 'Use a conversational rhythm. Let the connection matter more than sounding polished.', example: 'I did not know where to start either. One conversation helped me choose my next step.' },
      { id: 'invitation', title: 'Open the conversation', instruction: 'Turn the message into one relevant, open question. Avoid leading the listener to a prescribed answer.', cue: 'Give the question an unhurried ending, then leave space for a response.', example: 'What would make this next step feel more useful to you?' },
    ] },
  { id: 'malala', portrait: {src:'/figures/malala.jpg',credit:'Simon Davis/DFID; crop by JB Hoang Tam 2',source:'https://commons.wikimedia.org/wiki/File:Malala_Yousafzai_close-up_(cropped).jpg',license:'CC BY 2.0',licenseUrl:'https://creativecommons.org/licenses/by/2.0/'}, name: 'Malala Yousafzai', initials: 'MY', promise: 'Give your purpose a clear direction.',
    lens: 'The Nobel lecture uses inclusive language, repeated structures, and a call for action. Practice making a purpose understandable and actionable.',
    vocabulary: 'Concrete needs, inclusive pronouns, deliberate repetition, action verbs.',
    source: { title: 'Malala Fund · 2014 Nobel speech', url: 'https://malala.org/news-and-voices/malala-nobel-speech' },
    challenges: [
      { id: 'purpose', title: 'Name what matters', instruction: 'State a concrete need and why it matters, using only facts in the input.', cue: 'Give the central need clear emphasis without forcing volume.', example: 'Every new student needs somewhere to ask a question without feeling out of place.' },
      { id: 'rhythm', title: 'Build a memorable rhythm', instruction: 'Use two short parallel phrases to develop the same purpose. Avoid empty slogans.', cue: 'Keep the repeated structure audible and emphasize the words that change.', example: 'We can share what we know. We can ask what we do not.' },
      { id: 'action', title: 'Make the next step clear', instruction: 'End with one realistic action the listener can take. Do not add deadlines or promises absent from the input.', cue: 'Separate the reason from the request. Finish the action clearly.', example: 'Bring one question to our next meeting. We will work on it together.' },
    ] },
];

export const voiceRewriteSchema = z.object({
  revision: z.string().trim().min(1).max(650).regex(/^[^\[\]<>]*$/),
  explanation: z.string().min(1).max(500),
  cue: z.string().min(1).max(350),
  wordChoices: z.array(z.object({ before: z.string().min(1).max(120), after: z.string().min(1).max(120), why: z.string().min(1).max(200) })).max(3),
});
export type VoiceRewrite = z.infer<typeof voiceRewriteSchema>;
export type VoiceSession = VoiceRewrite & { id: string; figureId: string; challengeId: string; original: string; createdAt: string; source: 'gemini' | 'authored' };
export function findChallenge(figureId: string, challengeId: string) {
  const figure = figures.find(f => f.id === figureId);
  const challenge = figure?.challenges.find(c => c.id === challengeId);
  return figure && challenge ? { figure, challenge } : null;
}
export function voiceContext(session: VoiceSession) {
  const entry = findChallenge(session.figureId, session.challengeId);
  if (!entry) return null;
  return { goal: `${entry.figure.name} inspiration: ${entry.challenge.title}`,
    context: `Practice a communication technique in the user's own voice. Do not assess similarity of vocal identity, accent, or personality. Target: ${entry.challenge.instruction} Delivery cue: ${session.cue} Intended wording: ${session.revision}` };
}
export function groundedChoices(result: VoiceRewrite, original: string): VoiceRewrite {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  return { ...result, wordChoices: result.wordChoices.filter(c => norm(original).includes(norm(c.before)) && norm(result.revision).includes(norm(c.after))) };
}
export function challengeProgress(sessions: VoiceSession[], attempts: Attempt[], figureId: string, challengeId: string) {
  const ids = new Set(sessions.filter(s => s.figureId === figureId && s.challengeId === challengeId).map(s => s.id));
  const takes = attempts.filter(a => a.voiceSessionId && ids.has(a.voiceSessionId) && a.input === 'audio' && a.source === 'gemini');
  // A completed practice cycle is activity, never a claim of mastery.
  const completed = takes.some(a => a.parentId && a.reflection && takes.some(p => p.id === a.parentId && p.voiceSessionId === a.voiceSessionId));
  return { takes: takes.length, completed };
}
