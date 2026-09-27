import { z } from 'zod';
import { emotionIds } from './speech-styles.ts';
export const deliveryPlanSchema = z.object({
 reply: z.string().min(1).max(700), goal: z.string().min(1).max(300),
 sentence: z.string().min(1).max(350).refine(s=>!/[\[\]<>]/.test(s)),
 cue: z.string().min(1).max(350), emotion: z.enum(emotionIds), intensity: z.enum(['natural','expressive']),
});
export type DeliveryPlan = z.infer<typeof deliveryPlanSchema>;
export const wordingSchema = z.object({original:z.string().min(1).max(1500),revised:z.string().min(1).max(1500),reason:z.string().min(1).max(500)});
export const companionReplySchema = z.object({reply:z.string().min(1).max(1200),exercise:deliveryPlanSchema.omit({reply:true}).nullable(),wording:wordingSchema.nullable()});
export type CompanionReply = z.infer<typeof companionReplySchema>;
export type DiscoveryTurn = {id:string;message:string;reply?:string;plan:DeliveryPlan|null;wording?:z.infer<typeof wordingSchema>|null};
export type Discovery = { turns: DiscoveryTurn[] };
export function groundedWording(wording:CompanionReply['wording'], sources:string[]) {
 const normalize=(s:string)=>s.toLowerCase().replace(/\s+/g,' ').trim();
 return wording&&normalize(wording.original)&&sources.some(s=>normalize(s).includes(normalize(wording.original)))?wording:null;
}
export const starterPlan:DeliveryPlan={reply:'Let’s start with a clear, welcoming introduction. Listen once, then make it your own.',goal:'Introduce myself clearly while sounding approachable',sentence:'Hi, I am glad we got a chance to meet. What brought you here today?',cue:'Give the greeting space, then ask the question as if you want to hear the answer.',emotion:'warm',intensity:'natural'};
