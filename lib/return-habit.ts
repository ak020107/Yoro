import {z} from 'zod';
import type {ReturnCheck} from './domain';
export const returnOutcome=z.enum(['helped','mixed','hard','not_yet']);
export function reminderDate(value:unknown,now=Date.now()){
 const date=z.iso.datetime().parse(value);const time=Date.parse(date);
 if(time<=now||time>now+90*86400000)throw Error('Choose a reminder within the next 90 days.');
 return date;
}
export function dueReturns(items:ReturnCheck[],now=Date.now()){return items.filter(r=>!r.completedAt&&Date.parse(r.dueAt)<=now);}
