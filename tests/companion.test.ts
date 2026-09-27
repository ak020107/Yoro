import { test } from 'node:test';
import assert from 'node:assert/strict';
import { companionReplySchema, groundedWording } from '../lib/discovery.ts';
import { needsIntroduction } from '../lib/introduction.ts';
import { initialState } from '../lib/domain.ts';

test('a conversational reply can omit both an exercise and a rewrite',()=>{
 assert.equal(companionReplySchema.safeParse({reply:'What would you like them to understand?',exercise:null,wording:null}).success,true);
 assert.equal(companionReplySchema.safeParse({reply:'',exercise:null,wording:null}).success,false);
});
test('rewrite must quote user-supplied wording, not model-invented speech',()=>{
 const rewrite={original:'I was just wondering',revised:'Could we talk?',reason:'Lead with your question.'};
 assert.deepEqual(groundedWording(rewrite,['Yesterday I WAS  just wondering if we could chat.']),rewrite);
 assert.equal(groundedWording(rewrite,['Help me sound more friendly.']),null);
 assert.equal(groundedWording({...rewrite,original:'   '},['Anything']),null);
 assert.equal(groundedWording(null,['Anything']),null);
});
test('introduction is optional and respects existing profiles and skip choices',()=>{
 const profile=initialState().profile;
 assert.equal(needsIntroduction(profile),true);
 assert.equal(needsIntroduction(profile,'new'),true);
 assert.equal(needsIntroduction(profile,'skipped'),false);
 assert.equal(needsIntroduction(profile,'complete'),false);
 assert.equal(needsIntroduction({...profile,strengths:'My confidence'}),false);
});
test('reset clears onboarding decisions along with profile and conversation',()=>{
 const state=initialState();state.introduction='complete';state.profile.name='Test';
 Object.assign(state,initialState());assert.equal(state.introduction,'new');assert.equal(needsIntroduction(state.profile,state.introduction),true);
});
