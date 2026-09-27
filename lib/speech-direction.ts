import {z} from 'zod';
export const directionSchema=z.object({emphasis:z.string().trim().min(1).max(80).nullable(),pauseAfter:z.string().trim().min(1).max(120).nullable()});
export type SpeechDirection=z.infer<typeof directionSchema>;
export function directedWords(text:string,direction?:SpeechDirection){
 if(!direction)return text;
 const d=directionSchema.parse(direction);
 for(const phrase of [d.emphasis,d.pauseAfter])if(phrase&&(!text.includes(phrase)||/[\[\]<>]/.test(phrase)))throw Error('Delivery directions must refer to exact words in the example.');
 // Insert only our pause tag; never accept model/user-authored tags.
 let result=text;
 if(d.pauseAfter){const end=text.indexOf(d.pauseAfter)+d.pauseAfter.length;result=result.slice(0,end)+' [pause]'+result.slice(end);}
 if(d.emphasis){const start=text.indexOf(d.emphasis);const pauseEnd=d.pauseAfter?text.indexOf(d.pauseAfter)+d.pauseAfter.length:-1;
   // Work character by character to preserve the inserted pause when ranges overlap.
   result=text.split('').map((char,i)=>(i>=start&&i<start+d.emphasis!.length?char.toUpperCase():char)+(i+1===pauseEnd?' [pause]':'')).join('');
 }
 return result;
}
