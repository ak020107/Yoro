import {directionSchema,directedWords} from './speech-direction.ts';
import {z} from 'zod';
import type {Attempt,State} from './domain';
import {emotionIds} from './speech-styles.ts';
const spoken=z.string().trim().min(1).max(650).regex(/^[^\[\]<>]*$/);
export const planDraftSchema=z.object({title:z.string().min(1).max(100),outcome:z.string().min(1).max(350),steps:z.array(z.object({title:z.string().min(1).max(80),purpose:z.string().min(1).max(300),goal:z.string().min(1).max(300),sentence:spoken,cue:z.string().min(1).max(300),challenge:z.string().min(1).max(300),successCheck:z.string().min(1).max(250),emotion:z.enum(emotionIds),direction:directionSchema.optional()})).length(4)});
export type LearningPlan=z.infer<typeof planDraftSchema>&{id:string;task:string;createdAt:string;baselineId?:string};
export const stageNames=['Find your opening','Build your message','Handle a harder moment','Make it your own'];
export function validatePlan(raw:unknown,task?:string){const p=planDraftSchema.parse(raw);const bounds=[[4,22],[12,40],[18,60],[20,75]];p.steps.forEach((s,i)=>{if(task!==undefined){const durations=s.sentence.match(/\b(?:\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|fifteen|twenty|thirty|sixty)[ -](?:seconds?|minutes?|hours?|days?|weeks?)\b/gi)||[];const normalized=(x:string)=>x.toLowerCase().replace(/-/g,' ').replace(/\b(seconds|minutes|hours|days|weeks)\b/g,x=>x.slice(0,-1));if(durations.some(d=>!normalized(task).includes(normalized(d))))throw Error('The plan invented a duration that was not supplied in the preparation task. Remove unsupported time claims.');}directedWords(s.sentence,s.direction);const n=s.sentence.split(/\s+/).length;if(n<bounds[i][0]||n>bounds[i][1])throw Error('The lesson lengths were not suitable. Try preparing the plan again.');});if(new Set(p.steps.map(s=>s.sentence.toLowerCase())).size!==4)throw Error('The plan repeated a challenge. Please try again.');return p;}
export function planProgress(plan:LearningPlan,attempts:Attempt[]){
 const complete=plan.steps.map((_,index)=>attempts.some(a=>a.planId===plan.id&&a.planStep===index&&a.input==='audio'&&a.source==='gemini'&&['first','second','unsure'].includes(a.reflection||'')&&attempts.some(p=>p.id===a.parentId&&p.planId===plan.id&&p.planStep===index&&p.input==='audio'&&p.source==='gemini')));
 let unlocked=0;while(unlocked<4&&complete[unlocked])unlocked++;
 return {complete,unlocked,finished:unlocked===4};
}
export function planTarget(plan:LearningPlan,index:number){const s=plan.steps[index];return s?{goal:s.goal,context:`Preparing for: ${plan.task}. Stage ${index+1}: ${s.title}. Purpose: ${s.purpose}. Practice: ${s.sentence}. Challenge: ${s.challenge}. Cue: ${s.cue}. Success check: ${s.successCheck}. ${index===3?'The learner should use their own wording while preserving their real facts.':'The example is a scaffold, not a script they must match exactly.'}`}:null;}


export function activePlan(state:Pick<State,'learningPlans'|'activePlanId'>){return state.learningPlans?.find(p=>p.id===state.activePlanId)||state.learningPlans?.at(-1);}
export function nextPractice(attempt:Attempt|undefined){if(!attempt)return null;if(attempt.change?.outcome==='closer')return {title:'Carry this forward',cue:attempt.feedback.strength||'Try the next challenge while keeping what worked.'};if(attempt.feedback.adjustment)return {title:'An optional focused retry',cue:attempt.feedback.adjustment};return {title:'Try a fresh situation',cue:'There is no supported correction to chase. Apply the same intention to new words.'};}
