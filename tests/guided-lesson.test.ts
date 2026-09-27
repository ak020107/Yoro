import { test } from 'node:test';
import assert from 'node:assert/strict';
import { guidedSchema, guidedContext, validGuidedParent } from '../lib/guided-lesson.ts';
import type { Attempt } from '../lib/domain.ts';
const parent = { source: 'gemini', input: 'audio', guided: { id: 'welcome', stage: 'first' } } as Attempt;
test('guided practice rejects unknown lessons and derives its own learning target', () => {
  assert.equal(guidedSchema.safeParse({ id: 'arbitrary', stage: 'first' }).success, false);
  assert.equal(guidedSchema.safeParse({ id: 'welcome', stage: 'skip' }).success, false);
  const parsed = guidedSchema.parse({ id: 'welcome', stage: 'transfer', goal: 'Count fillers' });
  assert.match(guidedContext(parsed).goal, /emphasis/);
  assert.match(guidedContext(parsed).context, /good to meet you/);
});
test('guided sequence requires real audio, a matching preceding attempt, and reflection before transfer', () => {
  assert.equal(validGuidedParent({ id: 'welcome', stage: 'first' }), true);
  assert.equal(validGuidedParent({ id: 'welcome', stage: 'first' }, parent), false);
  assert.equal(validGuidedParent({ id: 'welcome', stage: 'retry' }), false);
  assert.equal(validGuidedParent({ id: 'welcome', stage: 'retry' }, parent), true);
  assert.equal(validGuidedParent({ id: 'welcome', stage: 'retry' }, { ...parent, source: 'preview' }), false);
  assert.equal(validGuidedParent({ id: 'welcome', stage: 'retry' }, { ...parent, input: 'text' }), false);
  assert.equal(validGuidedParent({ id: 'welcome', stage: 'retry' }, { ...parent, guided: undefined }), false);
  const retry = { ...parent, guided: { id: 'welcome', stage: 'retry' } } as Attempt;
  assert.equal(validGuidedParent({ id: 'welcome', stage: 'transfer' }, retry), false);
  assert.equal(validGuidedParent({ id: 'welcome', stage: 'transfer' }, { ...retry, reflection: 'unsure' }), true);
});
