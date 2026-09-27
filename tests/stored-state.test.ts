import test from 'node:test';
import assert from 'node:assert/strict';
import {BSON} from 'mongodb';
import {normalizeStoredState} from '../lib/stored-state.ts';
import {initialState,type Attempt,type State} from '../lib/domain.ts';

test('legacy Mongo null references normalize without removing intentional feedback nulls or step zero',()=>{
 const state=initialState();state.attempts=[{id:'take',planId:'plan',planStep:0,voiceSessionId:undefined,parentId:undefined,discoveryId:undefined,guided:undefined,feedback:{strength:null,observation:null}} as Attempt];
 const stored=BSON.deserialize(BSON.serialize(state,{ignoreUndefined:false})) as State;
 assert.equal(stored.attempts[0].voiceSessionId,null);
 const a=normalizeStoredState(stored).attempts[0];
 assert.equal(a.voiceSessionId,undefined);assert.equal(a.parentId,undefined);assert.equal(a.planId,'plan');assert.equal(a.planStep,0);assert.equal(a.feedback.strength,null);assert.equal(a.feedback.observation,null);
 assert.deepEqual(normalizeStoredState(stored),stored);
});
test('new Mongo serialization omits empty references and preserves real practice IDs',()=>{
 const stored=BSON.deserialize(BSON.serialize({voiceSessionId:'real-practice',planId:undefined},{ignoreUndefined:true}));
 assert.equal(stored.voiceSessionId,'real-practice');assert.equal(Object.hasOwn(stored,'planId'),false);
});
