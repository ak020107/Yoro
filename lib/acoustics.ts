// YIN-style cumulative normalized difference pitch estimator on mono PCM.
// Describes the signal; it does not classify emotion, accent, identity or ability.
export type AcousticAnalysis={version:'yin-1';status:'available'|'insufficient';reason?:string;duration:number;pitchMedianHz:number|null;pitchRangeSemitones:number|null;levelRangeDb:number|null;pitchedSeconds:number;clippedPercent:number;contour:{time:number;hz:number|null;db:number}[]};
const quantile=(a:number[],p:number)=>{const s=[...a].sort((x,y)=>x-y);return s[Math.floor((s.length-1)*p)]??0;};
const round=(n:number)=>Math.round(n*10)/10;
export function pcmFromWav(bytes:Uint8Array){
 const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);const str=(o:number,n:number)=>String.fromCharCode(...bytes.slice(o,o+n));
 if(bytes.length<44||str(0,4)!=='RIFF'||v.getUint32(4,true)!==bytes.length-8||str(8,4)!=='WAVE'||str(12,4)!=='fmt '||v.getUint32(16,true)!==16||v.getUint16(20,true)!==1||v.getUint16(22,true)!==1||v.getUint32(24,true)!==16000||v.getUint32(28,true)!==32000||v.getUint16(32,true)!==2||v.getUint16(34,true)!==16||str(36,4)!=='data'||v.getUint32(40,true)!==bytes.length-44||(bytes.length-44)%2) return null;
 const pcm=new Float32Array((bytes.length-44)/2);for(let i=0;i<pcm.length;i++)pcm[i]=v.getInt16(44+2*i,true)/32768;return pcm;
}
export function measureAcoustics(pcm:Float32Array):AcousticAnalysis{
 const duration=pcm.length/16000;const base:AcousticAnalysis={version:'yin-1',status:'insufficient',duration:round(duration),pitchMedianHz:null,pitchRangeSemitones:null,levelRangeDb:null,pitchedSeconds:0,clippedPercent:0,contour:[]};
 if(duration<1||duration>46||pcm.some(x=>!Number.isFinite(x)))return {...base,reason:'Use 1–45 seconds of clear speech for acoustic measurements.'};
 let clips=0;const y=new Float32Array(Math.floor(pcm.length/2));for(let i=0;i<pcm.length;i++)if(Math.abs(pcm[i])>=.99)clips++;for(let i=0;i<y.length;i++)y[i]=(pcm[2*i]+pcm[2*i+1])/2;
 base.clippedPercent=round(clips/pcm.length*100);const frames:{time:number;hz:number|null;db:number}[]=[];const pitches:number[]=[],levels:number[]=[];
 for(let start=0;start+672<y.length;start+=160){let sum=0;for(let j=0;j<512;j++)sum+=y[start+j]**2;const rms=Math.sqrt(sum/512),db=20*Math.log10(Math.max(rms,1e-6));let hz:number|null=null;
 if(db>-45){const d=new Float64Array(161);let accumulated=0;for(let lag=1;lag<=160;lag++){let diff=0;for(let j=0;j<512;j++){const delta=y[start+j]-y[start+j+lag];diff+=delta*delta;}accumulated+=diff;d[lag]=accumulated?diff*lag/accumulated:1;}
 for(let lag=16;lag<160;lag++){if(d[lag]<.15){while(lag<159&&d[lag+1]<d[lag])lag++;const a=d[lag-1],b=d[lag],c=d[lag+1];const denom=2*(2*b-a-c);const refined=lag+(denom?(c-a)/denom:0);hz=8000/refined;if(hz>=50&&hz<=500){pitches.push(hz);levels.push(db);}else hz=null;break;}}
 }frames.push({time:round(start/8000),hz:hz?round(hz):null,db:round(db)});}
 base.pitchedSeconds=round(pitches.length*.02);base.contour=frames.filter((_,i)=>i%5===0);
 if(base.clippedPercent>1)return {...base,reason:'Frequent clipping makes these acoustic estimates unreliable. Move back from the microphone.'};
 if(pitches.length<25)return {...base,reason:'Not enough stable pitched audio. Quiet speech, noise and unvoiced sounds can prevent pitch estimation.'};
 return {...base,status:'available',pitchMedianHz:round(quantile(pitches,.5)),pitchRangeSemitones:round(12*Math.log2(quantile(pitches,.9)/quantile(pitches,.1))),levelRangeDb:round(quantile(levels,.9)-quantile(levels,.1))};
}
