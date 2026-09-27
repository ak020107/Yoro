import { test } from 'node:test';
import assert from 'node:assert/strict';
import { providerRequest } from '../lib/provider-request.ts';
const url = 'https://generativelanguage.googleapis.com/v1beta/models/test:generateContent';
function fixture(statuses: number[]) {
  let calls = 0; const delays: number[] = [];
  return { dependencies: { fetch: (async () => new Response('{}', { status: statuses[Math.min(calls++, statuses.length - 1)] })) as typeof fetch, sleep: async (ms: number) => { delays.push(ms); } }, calls: () => calls, delays };
}
test('temporary Gemini failure recovers with bounded backoff', async () => {
  const f = fixture([503,503,200]); assert.equal((await providerRequest(url, {}, f.dependencies)).status,200); assert.equal(f.calls(),3); assert.deepEqual(f.delays,[600,1200]);
});
test('persistent service failure stops after three attempts', async () => {
  const f = fixture([503]); await assert.rejects(providerRequest(url, {}, f.dependencies), /temporarily unavailable after automatic retries/); assert.equal(f.calls(),3);
});
test('credentials and quota failures are not retried', async () => {
  for(const status of [401,403,404,429]) {const f = fixture([status]);await assert.rejects(providerRequest(url,{},f.dependencies));assert.equal(f.calls(),1);}
});
test('audio generation and memory mutations are not automatically duplicated', async () => {
  for(const endpoint of ['https://api.elevenlabs.io/v1/text-to-speech/example','https://app.backboard.io/api/assistants']) {const f=fixture([503]);await assert.rejects(providerRequest(endpoint,{method:'POST'},f.dependencies));assert.equal(f.calls(),1);}
});

test('network denial is distinguished from timeout without retrying or exposing details', async () => {
  for (const [error, message] of [[Object.assign(new TypeError('private detail'), { cause: { code: 'EACCES' } }), /blocked from accessing the network/], [new DOMException('private detail', 'TimeoutError'), /could not respond in time/], [new TypeError('private detail'), /Check the server internet connection/]] as const) {
    let calls = 0;
    const deps = { fetch: (async () => { calls++; throw error; }) as typeof fetch, sleep: async () => {} };
    await assert.rejects(providerRequest(url, {}, deps), message);
    assert.equal(calls, 1);
  }
});
