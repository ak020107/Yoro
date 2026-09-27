import Image from 'next/image';
import artwork from '../public/brand/listener.png';

export type ListenerState = 'ready' | 'listening' | 'thinking' | 'speaking' | 'responding' | 'encouraging' | 'celebrate';
const descriptions: Record<ListenerState, string> = {
  ready: 'ready to help', listening: 'listening attentively', thinking: 'thinking',
  speaking: 'speaking', responding: 'responding', encouraging: 'encouraging you', celebrate: 'celebrating your practice',
};

export default function Listener({ className = '', state = 'ready', priority = false }: { className?: string; state?: ListenerState; priority?: boolean }) {
  return <Image src={artwork} unoptimized preload={priority} className={`listener ${className}`} data-listener-state={state} alt={`Yoro, your lavender Listener, ${descriptions[state]}`} />;
}
