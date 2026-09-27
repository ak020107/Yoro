import test from 'node:test';
import assert from 'node:assert/strict';
import {dueReturns,reminderDate} from '../lib/return-habit.ts';
test('reminders reject past, invalid and distant dates',()=>{const now=Date.now();assert.equal(reminderDate(new Date(now+10000).toISOString(),now),new Date(now+10000).toISOString());for(const value of ['tomorrow',new Date(now-1).toISOString(),new Date(now+91*86400000).toISOString()])assert.throws(()=>reminderDate(value,now));});
test('only pending due check-ins appear, including previously notified ones on return',()=>{const now=Date.now();const due={id:'a',planId:'p',dueAt:new Date(now-100).toISOString()};assert.deepEqual(dueReturns([due,{...due,id:'b',completedAt:new Date(now).toISOString()},{...due,id:'c',dueAt:new Date(now+100).toISOString()},{...due,id:'d',notifiedAt:new Date(now).toISOString()}],now).map(r=>r.id),['a','d']);});
