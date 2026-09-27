'use client';
import { useState, type ReactNode } from 'react';
import type { Profile } from '@/lib/domain';
import Introduction from './Introduction';
import { ChoiceTiles, ExpandContent } from './ui/interaction';
import { Icon } from './Brand';

const fields: {key:keyof Profile; label:string; empty:string}[] = [
 {key:'intention',label:'My direction',empty:'How would you like to come across?'},
 {key:'strengths',label:'Keep what makes me, me',empty:'A strength you want to keep'},
 {key:'workingOn',label:'Make a little easier',empty:'Something you want a hand with'},
 {key:'situations',label:'Where it matters',empty:'The conversations you care about'},
 {key:'focus',label:'My focus right now',empty:'A small thing to practice next'},
 {key:'name',label:'Call me',empty:'Add your name'},
 {key:'coachingStyle',label:'How Yoro coaches me',empty:''},
 {key:'voicePreset',label:'Example voice',empty:''},
];
const styles = ['gentle','direct','playful'].map(value=>({value,title:value[0].toUpperCase()+value.slice(1)}));
const voices = [{value:'default',title:'Coach default'},{value:'us',title:'American English example'},{value:'uk',title:'British English example'}];
export default function VoiceProfile({profile,availableVoices,onSave,onIntroduction,voiceSetup}:{voiceSetup?:ReactNode;profile:Profile;availableVoices:string[];onSave:(profile:Profile)=>Promise<void>;onIntroduction:(profile?:Profile)=>Promise<void>}) {
 const [editing,setEditing]=useState<keyof Profile|null>(null);const [draft,setDraft]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [status,setStatus]=useState('');const [intro,setIntro]=useState(false);
 async function save(){if(!editing)return;setBusy(true);setError('');try{await onSave({...profile,[editing]:draft});setEditing(null);setStatus('Profile saved. Your own words guide Yoro.');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function introduce(next?:Profile){await onIntroduction(next);setIntro(false);if(next)setStatus('Your direction is saved. You can change it any time.');}
 return <section className="voice-profile">
 <div className="profile-heading"><div><span className="eyebrow">YOUR VOICE, YOUR DIRECTION</span><h1>{profile.name?`${profile.name}’s voice`:'My Voice'}</h1><p>You set the direction. We keep the good parts.</p></div><button onClick={()=>setIntro(true)}>Tailor my practice <Icon name="arrow" size={16}/></button></div>
 <small className="profile-caption">These are your descriptions, not a judgment of your personality.</small>
 {voiceSetup}<div className="profile-grid">{fields.map(({key,label,empty})=><article className={`profile-item ${editing===key?'is-editing':''}`} key={key}>
 <button className="profile-item-toggle" disabled={busy} aria-expanded={editing===key} aria-controls={`edit-${key}`} onClick={()=>{setEditing(editing===key?null:key);setDraft(profile[key]);setError('');setStatus('');}}><span><small>{label}</small><strong className={!profile[key]?'muted':''}>{key==='voicePreset'?voices.find(v=>v.value===profile[key])?.title:profile[key]||empty}</strong></span><span className="profile-edit" aria-hidden="true">{editing===key?'−':'Edit'}</span></button>
 <ExpandContent open={editing===key}><form id={`edit-${key}`} className="profile-editor" onSubmit={e=>{e.preventDefault();void save();}}>
 {key==='coachingStyle'||key==='voicePreset'?<ChoiceTiles label={label} items={key==='coachingStyle'?styles:voices.filter(v=>v.value==='default'||availableVoices.includes(v.value)||profile.voicePreset===v.value)} value={draft} disabled={busy} onChange={setDraft}/>:<><label htmlFor={`profile-${key}`}>{label}</label><textarea autoFocus id={`profile-${key}`} disabled={busy} rows={2} value={draft} maxLength={key==='name'?60:['intention','focus'].includes(key)?500:1000} onChange={e=>setDraft(e.target.value)}/></>}
 {error&&<p className="notice error" role="alert">{error}</p>}<div className="row"><button type="submit" className="primary" disabled={busy}>{busy?'Saving…':'Save change'}</button><button type="button" disabled={busy} onClick={()=>{setEditing(null);setError('');}}>Cancel</button></div>
 </form></ExpandContent></article>)}</div>
 <div role="status">{status&&<p className="profile-saved">✓ {status}</p>}</div>
 {intro&&<Introduction profile={profile} onSave={introduce} onSkip={()=>introduce()}/>}
 </section>;
}
