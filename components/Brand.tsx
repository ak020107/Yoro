export { default as Listener } from './Listener';
export type { ListenerState } from './Listener';

export type IconName = 'home' | 'mic' | 'compass' | 'chat' | 'user' | 'arrow' | 'check' | 'play' | 'target' | 'spark' | 'headphones';
const paths: Record<IconName, string> = {
  home: 'm3 10 9-7 9 7v10H14v-6h-4v6H3Z',
  mic: 'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0ZM5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8',
  compass: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm5 5-3 7-7 3 3-7Z',
  chat: 'M4 3h16v13H9l-5 5ZM8 8h8M8 12h5',
  user: 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM4 22v-3a8 6 0 0 1 16 0v3',
  arrow: 'M4 12h16m-6-6 6 6-6 6', check: 'm5 12 4 4L19 6',
  play: 'm8 4 12 8-12 8Z', target: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 4v2',
  spark: 'm12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z',
  headphones: 'M3 13v-2a9 9 0 0 1 18 0v2M3 12h4v9H3ZM17 12h4v9h-4Z',
};
export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
export function Wordmark() { return <span className="wordmark">yoro<span className="wordmark-dot">.</span></span>; }
