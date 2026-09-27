import { z } from 'zod';
import type { Attempt } from './domain';
export const changeSchema=z.object({
 outcome:z.enum(['closer','steady','mixed','not_yet','uncertain']),
 summary:z.string().min(1).max(500),
 beforeQuote:z.string().max(350).nullable(),afterQuote:z.string().max(350).nullable(),
 reason:z.string().max(500),
});
export type VoiceChange=z.infer<typeof changeSchema>;
export const blindComparisonSchema=z.object({
 preference:z.enum(['a','b','similar','mixed','uncertain']),
 quoteA:z.string().max(350).nullable(),quoteB:z.string().max(350).nullable(),
 reason:z.string().min(1).max(500),
});
export type BlindComparison=z.infer<typeof blindComparisonSchema>;
export function reconcileComparison(first:VoiceChange, blind:BlindComparison|null, before:string, after:string):VoiceChange {
 if(first.outcome==='uncertain')return first;
 const expected={closer:'a',not_yet:'b',steady:'similar',mixed:'mixed'}[first.outcome];
 const norm=(s:string)=>s.toLowerCase().replace(/\s+/g,' ').trim();
 const evidence=blind?.quoteA?.trim()&&blind?.quoteB?.trim()&&norm(after).includes(norm(blind.quoteA))&&norm(before).includes(norm(blind.quoteB));
 if(!blind||!evidence||blind.preference!==expected)return {
  outcome:'uncertain',summary:'I can’t consistently tell which take is closer to your intention yet.',beforeQuote:null,afterQuote:null,
  reason:blind?'The listening checks did not agree on a supported comparison. Replay both takes and choose what fits your intention.':'The additional comparison check was unavailable. Your current-take coaching is still here.',
 };
 return first;
}
export function comparableRetry(parent:Attempt|undefined,kind:string,goal:string,stage?:string){
 return !!parent&&parent.input==='audio'&&parent.source==='gemini'&&parent.kind===kind&&parent.goal===goal&&stage!=='transfer';
}
export function validateChange(value:VoiceChange|null, before:string, after:string):VoiceChange|null{
 if(!value)return null;
 const norm=(s:string)=>s.toLowerCase().replace(/\s+/g,' ').trim();
 if(value.outcome==='uncertain')return {...value,beforeQuote:null,afterQuote:null};
 if(!value.beforeQuote?.trim()||!value.afterQuote?.trim()||!norm(before).includes(norm(value.beforeQuote))||!norm(after).includes(norm(value.afterQuote)))return {outcome:'uncertain',summary:'I can’t reliably identify a change between these takes yet.',beforeQuote:null,afterQuote:null,reason:'The comparison did not include usable evidence from both recordings.'};
 return value;
}
