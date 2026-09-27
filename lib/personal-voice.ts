export type PersonalVoice = {
 requestId: string; providerId?: string; status: 'creating' | 'review' | 'preview' | 'ready';
 createdAt: string; consentVersion: '1'; previewed?: boolean; acceptedAt?: string;
 demoIds: string[]; error?: string;
};
export function publicVoice(voice?: PersonalVoice | null) {
 return voice ? {status:voice.status,createdAt:voice.createdAt,previewed:!!voice.previewed,acceptedAt:voice.acceptedAt,error:voice.error} : null;
}
export type PersonalVoiceView = ReturnType<typeof publicVoice>;
export const auditionText = 'This is my voice, with room to grow. I can make my point clearly, leave space for a reply, and still sound like myself.';
export const enrollmentScript = 'I want my voice to sound like me. There are parts of the way I speak that I already like, and there are parts I would like to explore. When I talk about something I care about, I want the person listening to understand why it matters. Sometimes I have several ideas at once. I can choose one, explain it clearly, and give the other person time to respond. A good conversation does not have to be perfect. It can begin with a simple question, a useful observation, or an honest introduction. Today I am practicing how to keep my own character while being easier to follow. I can be direct and still be thoughtful. I can be enthusiastic without rushing every sentence. I can disagree with someone and still be curious about their perspective. The goal is to communicate with intention, one real conversation at a time. After this paragraph, I will describe a project I enjoy and why it matters to me.';
