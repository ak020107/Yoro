'use client';
import { useState, type ReactNode } from 'react';
import Introduction from './Introduction';
import type { IntroductionStatus } from '@/lib/introduction';
import { Icon } from './Brand';
import type { Profile } from '@/lib/domain';

export type Destination = 'Today' | 'Yoro' | 'Voices' | 'My Voice';
export default function PracticeHome({ profile, introduction, onIntroduction, journey }: { journey:ReactNode; profile: Profile; introduction?: IntroductionStatus; onIntroduction: (profile?: Profile)=>Promise<void> }) {
 const [introducing,setIntroducing]=useState(false);
 async function finishIntroduction(next?:Profile){await onIntroduction(next);setIntroducing(false);}
 return <div className="home-view today-view">
 <div className="page-heading"><div><span className="eyebrow">A LITTLE PRACTICE. A REAL CONNECTION.</span><h1>{profile.name?`Hey ${profile.name}.`:'A little more like you.'}</h1><p>Your plan lives here. Yoro is your companion when you want to talk it through.</p></div></div>
 {introduction!=='complete'&&<section className="profile-invitation"><div><strong>Let’s make this your practice.</strong><p>A few quick questions about your goals and the strengths you want to keep.</p></div><button className="primary" onClick={()=>setIntroducing(true)}>Create my voice profile <Icon name="arrow" size={16}/></button></section>}
 {journey}
 {introducing&&<Introduction profile={profile} onSave={finishIntroduction} onSkip={()=>finishIntroduction()}/>}
 </div>;
}
