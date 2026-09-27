import {directedWords,type SpeechDirection} from './speech-direction.ts';
export const emotionIds = ['neutral', 'warm', 'curious', 'confident', 'reassuring', 'excited', 'sad', 'frustrated'] as const;
export type Emotion = typeof emotionIds[number];
export const styles: Record<Emotion, { label: string; tags: string; listen: string; practice: string }> = {
  neutral: { label: 'Neutral', tags: '[neutral] [matter-of-fact]', listen: 'An even reference delivery, with restrained emphasis.', practice: 'Keep the sentence even and let its meaning carry the message.' },
  warm: { label: 'Warm', tags: '[warmly] [friendly]', listen: 'An inviting tone and gentle emphasis on words that connect with the listener.', practice: 'Address one person you are pleased to see. Let the important words carry that welcome.' },
  curious: { label: 'Curious', tags: '[curious] [inquisitive]', listen: 'Pitch movement and space that leave room for an answer.', practice: 'Say it as if you genuinely want to discover the answer, then leave room for a response.' },
  confident: { label: 'Confident', tags: '[assertive] [confident] [decisive]', listen: 'Deliberate emphasis and decisive phrase endings, without shouting.', practice: 'Choose your main point and finish it cleanly. Keep your normal pitch.' },
  reassuring: { label: 'Reassuring', tags: '[calmly] [gently] [reassuring]', listen: 'Unhurried phrasing and softer transitions between ideas.', practice: 'Give each thought space. Aim to make the listener feel they have time.' },
  excited: { label: 'Excited', tags: '[excited] [enthusiastic]', listen: 'Livelier pitch movement, brighter emphasis, and energetic rhythm.', practice: 'Imagine sharing good news. Energize the key phrase without racing every word.' },
  sad: { label: 'Sad', tags: '[sad] [softly]', listen: 'Subdued energy and more space around emotionally important words.', practice: 'Let the important words settle. Explore quieter energy without forcing a lower pitch.' },
  frustrated: { label: 'Frustrated', tags: '[frustrated] [irritated] [angry]', listen: 'Sharper emphasis and a more clipped rhythm. This is an expressive contrast, not advice to speak this way.', practice: 'Explore the contrast in a fictional situation, then repeat it with firm but calm delivery.' },
};
export const voiceLabels: Record<string, string> = { default: 'Your coach', us: 'American English example', uk: 'British English example' };
export function speechPayload(text: string, emotion: Emotion, intensity: 'natural' | 'expressive' = 'natural', direction?:SpeechDirection) {
  const sentence = text.trim();
  if (!sentence || sentence.length > 700 || /[\[\]<>]/.test(sentence)) throw new Error('Use 1–700 characters of spoken words, without audio or markup tags.');
  if (!Object.hasOwn(styles, emotion)) throw new Error('Unknown delivery style.');
  if (!['natural', 'expressive'].includes(intensity)) throw new Error('Unknown expression level.');
  const directed = directedWords(sentence,direction).replace(/(?<=[.!?])(\s+)(?=\S)/g, `$1${styles[emotion].tags} `);
  return { text: `${styles[emotion].tags} ${directed}`, model_id: 'eleven_v3',
    voice_settings: { stability: intensity === 'expressive' ? 0 : 0.5, similarity_boost: 0.75, use_speaker_boost: false } };
}
