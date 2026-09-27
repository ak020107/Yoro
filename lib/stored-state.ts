import type {State} from './domain';

// Older Mongo writes encoded undefined optional references as BSON null.
// Normalize only practice references; feedback intentionally uses null values.
export function normalizeStoredState(state:State):State {
  for(const attempt of state.attempts){
    for(const field of ['parentId','lessonId','planId','planStep','voiceSessionId','discoveryId','guided'] as const){
      if(attempt[field]===null)delete attempt[field];
    }
  }
  return state;
}
