'use client';
import {useState} from 'react';
export default function KeepComparison({id,kept,refresh}:{id:string;kept:boolean;refresh:()=>Promise<void>}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function toggle(){setBusy(true);setError('');try{const r=await fetch('/api/comparisons/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,keep:!kept})});const value=await r.json();if(!r.ok)throw Error(value.error||'Could not update this comparison.');await refresh();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <div><button disabled={busy} onClick={()=>void toggle()}>{busy?'Saving…':kept?'Stop keeping this comparison':'Keep both recordings for later'}</button><small style={{display:'block'}}>Kept recordings stay on this server until you release them or reset your data. Other replays expire after 24 hours.</small>{error&&<p role="alert">{error}</p>}</div>;
}
