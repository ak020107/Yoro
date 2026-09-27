import type { Profile } from './domain';
export type IntroductionStatus = 'new' | 'skipped' | 'complete';
export function needsIntroduction(profile: Profile, status?: IntroductionStatus) {
 return (!status || status==='new') && ![profile.name,profile.intention,profile.situations,profile.strengths,profile.workingOn,profile.focus].some(s=>s.trim());
}
export const introductionQuestions = [
 {field:'situations',title:'Where would you like this to feel easier?',hint:'Start with one moment. You can always change it.',choices:['Everyday conversations','Interviews & networking','Presentations & storytelling','Difficult conversations']},
 {field:'intention',title:'How do you want to come across?',hint:'Your intention, in your own words.',choices:['Clear and direct','Warm and approachable','Confident and grounded','Expressive and engaging']},
 {field:'workingOn',title:'What would you like a hand with?',hint:'This is your description—not a diagnosis.',choices:['Finding the right words','Getting to the point','Pacing and delivery','Listening and responding']},
 {field:'strengths',title:'What should we keep about your voice?',hint:'Something you like. It is fine not to know yet.',choices:['My confidence','My warmth','My energy','My thoughtfulness']},
] as const;
