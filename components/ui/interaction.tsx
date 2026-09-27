'use client';
// Adapted from Aceternity UI Card Hover Effect and Tabs, by Manu Arora.
// https://ui.aceternity.com/registry/card-hover-effect.json
// https://ui.aceternity.com/registry/tabs.json
// See THIRD_PARTY_NOTICES.md for license and adaptation details.
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { useId, useState, type ReactNode } from 'react';

export function ChoiceTiles({ items, value, onChange, disabled = false, label }: { items: { value: string; title: string; description?: string }[]; value: string; onChange: (value: string) => void; disabled?: boolean; label: string }) {
 const [hoveredIndex,setHoveredIndex] = useState<number | null>(null);
 const id = useId(); const reduce = useReducedMotion();
 return <LayoutGroup id={id}><div className="choice-tiles" role="group" aria-label={label}>{items.map((item,idx)=><button type="button" key={item.value} className="choice-tile" aria-pressed={value===item.value} disabled={disabled} onClick={()=>onChange(item.value)} onMouseEnter={()=>setHoveredIndex(idx)} onMouseLeave={()=>setHoveredIndex(null)} onFocus={()=>setHoveredIndex(idx)} onBlur={()=>setHoveredIndex(null)}>
 <AnimatePresence>{(hoveredIndex===idx || (hoveredIndex===null && value===item.value))&&<motion.span className="choice-highlight" layoutId={reduce ? undefined : 'hoverBackground'} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reduce ? 0 : .15}}/>}</AnimatePresence>
 <span className="choice-copy"><strong>{item.title}</strong>{item.description&&<small>{item.description}</small>}</span><span className="choice-check" aria-hidden="true">{value===item.value?'✓':'+'}</span>
 </button>)}</div></LayoutGroup>;
}
export function StepPanel({ step, children }: { step: string | number; children: ReactNode }) {
 const reduce=useReducedMotion();
 return <AnimatePresence mode="wait" initial={false}><motion.div key={step} initial={{opacity:0,y:reduce?0:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:reduce?0:-8}} transition={{duration:reduce?0:.18}}>{children}</motion.div></AnimatePresence>;
}
export function ExpandContent({ open, children }: { open: boolean; children: ReactNode }) {
 const reduce=useReducedMotion();
 return <AnimatePresence initial={false}>{open&&<motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:reduce?0:.2}} className="expand-content">{children}</motion.div>}</AnimatePresence>;
}
