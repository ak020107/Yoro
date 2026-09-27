import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateEvidence, comparison, profileSchema, emptyProfile, type Attempt } from '../lib/domain.ts';
const raw = { summary: 'A test', strength: null, observation: { quote: 'I hear you', explanation: 'Try a pause.' }, adjustment: 'Pause', example: 'I hear you.', nextPrompt: 'Retry' };
test('unsupported quotes are removed rather than displayed as evidence', () => {
  const result = validateEvidence(raw, 'That sounds difficult.', []);
  assert.equal(result.observation, null); assert.equal(result.evidenceRemoved, true);
});
test('a supported quote gets only timestamps grounded in actual words', () => {
  const words = [{ text:'I',start:0,end:.1 },{ text:'hear',start:.2,end:.5 },{ text:'you',start:.6,end:.8 }];
  assert.deepEqual(validateEvidence(raw, 'I hear you', words, 1).evidence, { start:0,end:.8 });
  assert.equal(validateEvidence(raw, 'I hear you', words, .5).evidence, undefined);
});
test('text-only feedback cannot acquire fabricated timestamps', () => {
  const result = validateEvidence({ ...raw, evidence:{start:0,end:5} }, 'I hear you', []);
  assert.equal(result.evidence, undefined);
});
test('invalid schema rejected and profile length bounded', () => {
  assert.throws(() => validateEvidence({ score:99 }, 'hello', []));
  assert.equal(profileSchema.safeParse({ ...emptyProfile, focus:'a'.repeat(501) }).success, false);
});
test('comparison describes differences without inventing improvement', () => {
  const a = { transcript:'I hear you',duration:2 } as Attempt;
  const b = { transcript:'I hear you',duration:3 } as Attempt;
  const result = comparison(a,b);
  assert.equal(result.firstWords,result.secondWords); assert.match(result.note,/not a score/);
});
