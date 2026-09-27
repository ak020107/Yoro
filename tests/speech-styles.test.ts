import { test } from 'node:test';
import assert from 'node:assert/strict';
import { speechPayload, emotionIds, styles } from '../lib/speech-styles.ts';
test('comparison changes directions while preserving the exact spoken words', () => {
 const sentence = "I didn't expect that. What happened?";
 const tags = new Set<string>();
 for (const emotion of emotionIds) {
  const payload = speechPayload(sentence, emotion);
  assert.equal(payload.text.replace(/\[[^\]]+\]\s*/g, ''), sentence);
  assert.equal(payload.model_id, 'eleven_v3');tags.add(styles[emotion].tags);
 }
 assert.equal(tags.size, emotionIds.length);
});
test('expression uses supported v3 stability values without changing playback speed', () => {
 assert.equal(speechPayload('Hello.', 'excited', 'expressive').voice_settings.stability, 0);
 assert.equal(speechPayload('Hello.', 'excited', 'natural').voice_settings.stability, .5);
 assert.equal('speed' in speechPayload('Hello.', 'excited').voice_settings, false);
});
test('spoken text cannot inject directions or markup and is bounded', () => {
 for(const text of ['', ' '.repeat(3), '[shouts] Hello', '<break/>Hello', 'a'.repeat(701)]) assert.throws(()=>speechPayload(text,'warm'));
 assert.doesNotThrow(()=>speechPayload('a'.repeat(700),'warm'));
});
