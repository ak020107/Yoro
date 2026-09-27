import { reconcileComparison } from '../lib/voice-change.ts';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateChange,comparableRetry,type VoiceChange} from '../lib/voice-change.ts';
import type {Attempt} from '../lib/domain.ts';
const parent={input:'audio',source:'gemini',kind:'delivery',goal:'Warm'} as Attempt;
const change:VoiceChange={outcome:'closer',summary:'The invitation lands more clearly.',beforeQuote:'join us',afterQuote:'join us',reason:'More emphasis on the invitation.'};
test('definite change requires evidence in both takes',()=>{
 assert.equal(validateChange(change,'Come join us','Please join us')?.outcome,'closer');
 assert.equal(validateChange(change,'Good morning','Please join us')?.outcome,'uncertain');
 assert.equal(validateChange(change,'Come join us','Good morning')?.outcome,'uncertain');
 assert.equal(validateChange({...change,beforeQuote:' '},'Come join us','Please join us')?.outcome,'uncertain');
});
test('uncertainty removes apparent evidence and never becomes a win',()=>{
 const result=validateChange({...change,outcome:'uncertain'},'x','y');assert.equal(result?.outcome,'uncertain');assert.equal(result?.beforeQuote,null);assert.equal(validateChange(null,'x','y'),null);
});
test('comparison requires matching real audio goal and excludes transfer and preview',()=>{
 assert.equal(comparableRetry(parent,'delivery','Warm','retry'),true);
 assert.equal(comparableRetry(parent,'delivery','Warm','transfer'),false);
 assert.equal(comparableRetry(parent,'delivery','Direct'),false);
 assert.equal(comparableRetry({...parent,input:'text'},'delivery','Warm'),false);
 assert.equal(comparableRetry({...parent,source:'preview'},'delivery','Warm'),false);
 assert.equal(comparableRetry(undefined,'delivery','Warm'),false);
});

test('inconsistent blind comparisons never award improvement',()=>{
 const first={outcome:'closer' as const,summary:'Closer.',beforeQuote:'hello',afterQuote:'hello',reason:'More emphasis.'};
 const same={preference:'a' as const,quoteA:'hello',quoteB:'hello',reason:'A has emphasis.'};
 assert.equal(reconcileComparison(first,same,'hello','hello').outcome,'closer');
 assert.equal(reconcileComparison(first,{...same,preference:'b'},'hello','hello').outcome,'uncertain');
 assert.equal(reconcileComparison(first,{...same,quoteA:'invented'},'hello','hello').outcome,'uncertain');
 assert.equal(reconcileComparison(first,null,'hello','hello').outcome,'uncertain');
});
