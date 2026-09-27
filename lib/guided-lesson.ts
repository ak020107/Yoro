import { z } from 'zod';
import type { Attempt } from './domain';

export const welcomeLesson = {
  id: 'welcome', title: 'Make someone feel welcome',
  sentence: 'I am glad you came. Come and join us.',
  transfer: 'It is good to meet you. Tell me about yourself.',
  cue: 'Give “glad” a little emphasis, then let “join us” feel like an invitation. Keep your own accent and your normal volume.',
} as const;
export const guidedSchema = z.object({ id: z.literal('welcome'), stage: z.enum(['first', 'retry', 'transfer']) });
export type GuidedPractice = z.infer<typeof guidedSchema>;
export function validGuidedParent(practice: GuidedPractice, parent?: Attempt) {
  if (practice.stage === 'first') return !parent;
  if (!parent || parent.source !== 'gemini' || parent.input !== 'audio' || parent.guided?.id !== practice.id) return false;
  return practice.stage === 'retry' ? parent.guided.stage === 'first' : parent.guided.stage === 'retry' && ['first', 'second', 'unsure'].includes(parent.reflection || '');
}
export function guidedContext(practice: GuidedPractice) {
  return {
    goal: 'Sound welcoming through intentional word emphasis and an inviting phrase ending.',
    context: `Guided welcome lesson. Stage: ${practice.stage}. Read: ${practice.stage === 'transfer' ? welcomeLesson.transfer : welcomeLesson.sentence}. Teaching cue: ${welcomeLesson.cue}`,
  };
}
