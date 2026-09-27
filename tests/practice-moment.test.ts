import { test } from 'node:test';
import assert from 'node:assert/strict';
import { practiceMoment, practiceProgress, latestLessonRun } from '../lib/practice-moment.ts';
import type { Attempt } from '../lib/domain.ts';
const a = { id:'a', input:'audio', source:'gemini', transcript:'I am glad you came.', duration:3, guided:{id:'welcome',stage:'first'}, feedback:{observation:{quote:'glad'},evidence:{start:1,end:2}} } as Attempt;
test('phrase replay rejects unsupported quotes and invalid ranges',()=>{
 assert.deepEqual(practiceMoment(a)?.range,{start:1,end:2});
 assert.equal(practiceMoment({...a,feedback:{...a.feedback,observation:{quote:'invented',explanation:''}}}),null);
 for(const evidence of [{start:-1,end:2},{start:1,end:4},{start:2,end:1},{start:NaN,end:2}]) assert.equal(practiceMoment({...a,feedback:{...a.feedback,evidence}})?.range,null);
});
test('progress excludes previews and preserves unsure reflection without declaring improvement',()=>{
 const b={...a,id:'b',parentId:'a',reflection:'unsure'};
 assert.deepEqual(practiceProgress([a,b,{...a,source:'preview'}]),{recordings:2,reflections:1,preferredRetry:0,lessons:0});
});
test('resume follows parent links rather than mixing unrelated lesson runs',()=>{
 const b={...a,id:'b',parentId:'a',guided:{id:'welcome',stage:'retry'}} as Attempt;
 assert.deepEqual(latestLessonRun([a,b]).map(x=>x.id),['a','b']);
 assert.deepEqual(latestLessonRun([b]),[]);
 assert.deepEqual(latestLessonRun([{...b,parentId:'b'}]),[]);
});

test('completed plan steps and figure challenges count once alongside guided runs',()=>{
 const first={...a,id:'p1',guided:undefined,planId:'plan',planStep:0};
 const retry={...first,id:'p2',parentId:'p1',reflection:'unsure'};
 const again={...retry,id:'p3'};
 const figure={...first,id:'f1',planId:undefined,planStep:undefined,voiceSessionId:'voice'};
 const figureRetry={...figure,id:'f2',parentId:'f1',reflection:'second'};
 assert.equal(practiceProgress([first,retry,again,figure,figureRetry]).lessons,2);
 assert.equal(practiceProgress([retry]).lessons,0);
});
