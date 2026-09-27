import type { Attempt, Profile } from './domain';
export type GoalPractice = { id: string; title: string; goal: string; sentence: string; cue: string; reason: string };
function basePractice(profile: Profile): GoalPractice | null {
  const aim = [profile.workingOn, profile.focus, profile.intention, profile.situations].join(' ').toLowerCase();
  const reason = 'Suggested from the goals you shared, not a diagnosis of your voice.';
  if (/rambl|concise|direct|filler|uhm|umm|to the point|clear|clarity/.test(aim)) return { id: 'clear-point', title: 'Make one clear point.', goal: 'Clear and direct, while staying approachable', sentence: 'Here is what I suggest. Let’s choose one idea and try it together.', cue: 'Finish the suggestion, leave a little space, then invite the other person in. Keep the parts of your voice you like.', reason };
  if (/present|pitch|interview|confiden|public|stage/.test(aim)) return { id: 'land-idea', title: 'Let your idea land.', goal: 'A clear main idea with confident, natural emphasis', sentence: 'The idea is simple. Give people one place to start, and a reason to keep going.', cue: 'Choose one phrase you want remembered. Give it emphasis, without making every word equally strong.', reason };
  if (/boundar|assert|firm|say no|disagree/.test(aim)) return { id: 'kind-boundary', title: 'Be kind. Be clear.', goal: 'A clear boundary without sounding dismissive', sentence: 'I can’t take that on today. I can help you decide what to do next.', cue: 'Complete the boundary cleanly, then make the offer sound like a real option. Keep your usual accent.', reason };
  if (aim.trim()) return { id: 'open-conversation', title: 'Make room for a reply.', goal: profile.intention || 'Approachable, curious, and easy to follow', sentence: 'I would like to hear your perspective. What matters most to you about this?', cue: 'Address one person. Let the question finish, and leave room for their answer.', reason };
  return null;
}
export function practiceTakeaway(attempt: Attempt) {
  return attempt.change?.summary || attempt.feedback.strength || attempt.feedback.summary;
}

export function goalPractice(profile: Profile, attempts: Attempt[] = []): GoalPractice | null {
  const base = basePractice(profile); if (!base) return null;
  const followups: Record<string, [string, string]> = {
    'clear-point': ['I have one question before we start. What would a useful outcome look like for you?', 'My main point is this: we can start small, learn something, and decide what to do next.'],
    'land-idea': ['Here is the part I want you to remember. A small first step can tell us what to try next.', 'I would like to explain the idea, hear your questions, and decide together whether it is worth trying.'],
    'kind-boundary': ['I see why this matters. I need more time before I can give you a clear answer.', 'I would like to help, but I cannot make that commitment. Could we talk about another option?'],
    'open-conversation': ['That is an interesting way to look at it. What led you to that idea?', 'Before I share my suggestion, I would like to understand what you have already tried.'],
  };
  const stages = [base, ...followups[base.id].map((sentence,i)=>({...base,id:base.id+'-'+(i+2),title:i===0?'Try it in another moment.':'Bring it into a conversation.',goal:base.goal.slice(0,460)+(i===0?' — another moment':' — conversation'),sentence,reason:'Build on the same intention with different words. This is practice progression, not a mastery score.'}))];
  const completed = (goal:string) => attempts.some(a => a.goal===goal && !a.guided && !a.discoveryId && !a.voiceSessionId && a.source==='gemini' && a.input==='audio' && a.reflection && attempts.some(p=>p.id===a.parentId && p.goal===goal && p.source==='gemini' && p.input==='audio'));
  return stages.find(s=>!completed(s.goal)) || {...base,reason:'You have practiced and reflected across three situations. Revisit this one, or bring a real moment to Yoro.'};
}
