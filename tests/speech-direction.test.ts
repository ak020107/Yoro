import test from 'node:test';
import assert from 'node:assert/strict';
import {directedWords} from '../lib/speech-direction.ts';
import {speechPayload} from '../lib/speech-styles.ts';
test('lesson directions emphasize exact wording and preserve the pause with overlapping phrases',()=>{assert.equal(directedWords('You can do this today.',{emphasis:'can do this',pauseAfter:'You can do'}),'You CAN DO [pause] THIS today.');assert.equal(directedWords('Hello there.',{emphasis:null,pauseAfter:null}),'Hello there.');assert.match(speechPayload('Hello there.','warm','natural',{emphasis:'Hello',pauseAfter:'Hello'}).text,/HELLO \[pause\] there/);});
test('directions cannot inject provider tags or invent words',()=>{assert.throws(()=>directedWords('Hello there.',{emphasis:'[shout]',pauseAfter:null}));assert.throws(()=>directedWords('Hello there.',{emphasis:'goodbye',pauseAfter:null}));});
