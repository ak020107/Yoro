import { test } from 'node:test';
import assert from 'node:assert/strict';
import { measureDelivery, chooseDrill } from '../lib/delivery.ts';
const timed = (text: string) => text.split(' ').map((text,i)=>({text,start:i,end:i+.5}));
test('pace excludes recording padding, includes internal gaps, and is invariant to a time offset',()=>{
 const words=timed('I enjoy building robots and coaching a new team');
 const a=measureDelivery(words,20),b=measureDelivery(words.map(w=>({...w,start:w.start+3,end:w.end+3})),30);
 assert.equal(a.wordsPerMinute,b.wordsPerMinute);assert.equal(a.spanSeconds,8.5);assert.equal(a.wordsPerMinute,63.5);
 assert.equal(a.gapCount,8);assert.equal(a.gapSeconds,4);
});
test('filler rules do not label like, you know, or substrings as fillers',()=>{
 const a=measureDelivery(timed('Um I like you know uh summer umbrella erm robots'));
 assert.equal(a.fillerCount,3);assert.equal(a.fillersPer100,30);
 assert.deepEqual(a.events.filter(e=>e.kind==='filler').map(e=>e.start),[0,5,8]);
});
test('repeated-word run is one candidate; filler repeats are not double counted',()=>{
 const a=measureDelivery(timed('he he he builds robots um um with his team'));
 assert.equal(a.repeatCount,1);assert.equal(a.fillerCount,2);
 assert.deepEqual(a.events.filter(e=>e.kind==='repeat').map(e=>[e.start,e.end]),[[0,2.5]]);
});
test('short recordings and malformed timing withhold measurements',()=>{
 assert.equal(measureDelivery(timed('a few words')).status,'insufficient');
 const good=timed('one two three four five six seven eight');
 for(const bad of [good.map((w,i)=>i===3?{...w,start:NaN}:w),good.map((w,i)=>i===3?{...w,end:w.start-.1}:w),good.toReversed()]) assert.equal(measureDelivery(bad).status,'insufficient');
 assert.equal(measureDelivery(good,3).status,'insufficient');
});
test('ASR point timestamps retain tokens but explicitly disclose uncertainty',()=>{
 const words=timed('I I really like building robots with my friends');
 words[1].end=words[1].start;
 const a=measureDelivery(words);
 assert.equal(a.status,'available');assert.equal(a.tokenCount,9);assert.equal(a.repeatCount,1);
 assert.ok(a.limitations.some(s=>s.includes('point timestamps')));
});
test('short repeated phrases are captured once without overlapping duplicate events',()=>{
 const a=measureDelivery(timed('we can we can we can build something useful together'));
 assert.equal(a.repeatCount,1);
 assert.deepEqual(a.events.filter(e=>e.kind==='repeat').map(e=>[e.start,e.end]),[[0,5.5]]);
});
test('time stretching changes pace predictably and events stay bounded',()=>{
 const words=timed('Um I I really enjoy building interesting robots today');
 const a=measureDelivery(words),b=measureDelivery(words.map(w=>({...w,start:w.start*2,end:w.end*2})));
 assert.ok(Math.abs(a.wordsPerMinute!/2-b.wordsPerMinute!)<.1);
 for(const e of a.events) assert.ok(e.start>=0&&e.end<=words.at(-1)!.end);
 assert.equal(a.fastestWindow!.end-a.fastestWindow!.start,5);
});
test('drill is selected only with sufficient evidence and relevant goal',()=>{
 const a=measureDelivery(timed('Um I I like building uh robots with my team'));
 assert.equal(chooseDrill(a,'clear and direct')?.title,'One thought, then a pause');
 assert.equal(chooseDrill(a,'emphasize the conclusion')?.title,'Make one idea land');
 assert.equal(chooseDrill(measureDelivery([]),'clear'),null);
});
