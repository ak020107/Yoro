// Shared PCM enrollment validation. This checks signal quality, not identity or emotion.
export function inspectVoiceSample(buffer: ArrayBuffer) {
 const v=new DataView(buffer);const str=(o:number,n:number)=>String.fromCharCode(...new Uint8Array(buffer,o,n));
 if(v.byteLength<44||v.getUint32(4,true)!==v.byteLength-8||v.getUint32(28,true)!==48000||v.getUint16(32,true)!==2||(v.byteLength-44)%2!==0||str(0,4)!=='RIFF'||str(8,4)!=='WAVE'||str(12,4)!=='fmt '||v.getUint32(16,true)!==16||v.getUint16(20,true)!==1||v.getUint16(22,true)!==1||v.getUint32(24,true)!==24000||v.getUint16(34,true)!==16||str(36,4)!=='data'||v.getUint32(40,true)!==v.byteLength-44)throw Error('Please use Yoro’s sample recorder or import a recording through setup.');
 const count=(v.byteLength-44)/2;const seconds=count/24000;
 if(seconds<60||seconds>150)throw Error('Use 60–150 seconds of clear speech. Aim for about 90 seconds.');
 let sum=0,clipped=0;for(let i=0;i<count;i++){const sample=v.getInt16(44+i*2,true)/32768;sum+=sample*sample;if(Math.abs(sample)>.99)clipped++;}
 const rms=Math.sqrt(sum/count);if(rms<.002)throw Error('This sample is too quiet or mostly silent. Move closer to the microphone and record again.');
 if(clipped/count>.01)throw Error('This sample has frequent clipping. Move slightly farther from the microphone and record again.');
 return {seconds,rms,clipping:clipped/count};
}
