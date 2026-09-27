import test from 'node:test';
import assert from 'node:assert/strict';
import { figures, findChallenge, voiceContext, groundedChoices, challengeProgress, type VoiceSession } from '../lib/figures.ts';
import { goalPractice, practiceTakeaway } from '../lib/journey.ts';
import { emptyProfile, initialState, type Attempt } from '../lib/domain.ts';
const session: VoiceSession = { id:'session',figureId:'jobs',challengeId:'one-idea',original:'Our idea is helpful.',revision:'Our idea helps.',explanation:'Shorter.',cue:'Finish the thought.',wordChoices:[],source:'gemini',createdAt:'2026-09-27' };
const first = {id:'first',voiceSessionId:'session',input:'audio',source:'gemini',feedback:{summary:'Clear.',strength:'Your point landed.',adjustment:''}} as Attempt;
test('voice catalog has unique valid challenges and rejects invented figures', () => {
  assert.equal(new Set(figures.map(f=>f.id)).size, figures.length);
  for(const f of figures) { assert.ok(f.source.url.startsWith('https://')); assert.equal(new Set(f.challenges.map(c=>c.id)).size,3); }
  assert.equal(findChallenge('unknown','one-idea'),null);
  assert.equal(findChallenge('jobs','invented'),null);
  assert.match(voiceContext(session)!.context,/own voice/);
});
test('word choice evidence must exist in both original and revision', () => {
  const result=groundedChoices({...session,wordChoices:[{before:'is helpful',after:'helps',why:'Shorter verb.'},{before:'invented',after:'helps',why:'Unsupported.'}]},session.original);
  assert.equal(result.wordChoices.length,1);
});
test('challenge completion needs live audio, same session parent and reflection, not an AI win', () => {
  const retry={...first,id:'second',parentId:'first',reflection:'unsure'};
  assert.equal(challengeProgress([session],[first],'jobs','one-idea').completed,false);
  assert.equal(challengeProgress([session],[first,retry],'jobs','one-idea').completed,true);
  assert.equal(challengeProgress([session],[first,{...retry,reflection:undefined}],'jobs','one-idea').completed,false);
  assert.equal(challengeProgress([session],[{...first,source:'preview'},retry],'jobs','one-idea').completed,false);
  assert.equal(challengeProgress([session],[{...first,voiceSessionId:'other'},retry],'jobs','one-idea').completed,false);
});
test('confirmed goals change the authored practice without inferring deficiencies', () => {
  assert.equal(goalPractice(emptyProfile),null);
  assert.equal(goalPractice({...emptyProfile,workingOn:'I ramble'})?.id,'clear-point');
  assert.equal(goalPractice({...emptyProfile,situations:'presentations'})?.id,'land-idea');
  assert.equal(goalPractice({...emptyProfile,focus:'setting boundaries'})?.id,'kind-boundary');
  assert.equal(practiceTakeaway(first),'Your point landed.');
});
test('reset removes voice sessions explicitly', () => { assert.deepEqual(initialState().voiceSessions,[]); });

test('personal practice advances only after a live retry and reflection',()=>{
 const profile={...emptyProfile,workingOn:'rambling'};
 const base=goalPractice(profile)!;
 const a={...first,voiceSessionId:undefined,goal:base.goal};
 assert.equal(goalPractice(profile,[a])?.id,base.id);
 const b={...a,id:'retry',parentId:a.id,reflection:'unsure'};
 assert.equal(goalPractice(profile,[a,b])?.id,'clear-point-2');
 assert.equal(goalPractice(profile,[a,{...b,source:'preview'}])?.id,base.id);
});
