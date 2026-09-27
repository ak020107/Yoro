import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deliveryPlanSchema, starterPlan } from '../lib/discovery.ts';
import { initialState } from '../lib/domain.ts';
test('delivery plan rejects speech markup and unsupported controls',()=>{
 assert.equal(deliveryPlanSchema.safeParse({...starterPlan,sentence:'[shout] Hello'}).success,false);
 assert.equal(deliveryPlanSchema.safeParse({...starterPlan,emotion:'dominant'}).success,false);
 assert.equal(deliveryPlanSchema.safeParse({...starterPlan,sentence:'a'.repeat(351)}).success,false);
 assert.equal(deliveryPlanSchema.safeParse(starterPlan).success,true);
});
test('reset state explicitly clears saved discovery conversation',()=>{
 const state={...initialState(),discovery:{turns:[{id:'test',message:'hello',plan:starterPlan}]}};
 Object.assign(state,initialState());assert.deepEqual(state.discovery.turns,[]);
});
