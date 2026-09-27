import {test} from 'node:test';
import assert from 'node:assert/strict';
import {allowedOrigins,secureSessionCookie} from '../lib/deployment.ts';
import {boundedBody} from '../lib/request-body.ts';

test('production cookies are secure and local origins are not trusted',()=>{
  const env:NodeJS.ProcessEnv={NODE_ENV:'production',APP_ORIGIN:'https://yoroai.tech',COOKIE_SECURE:'false'};
  assert.equal(secureSessionCookie(env),true);
  assert.deepEqual([...allowedOrigins(env)],['https://yoroai.tech']);
  assert.equal(allowedOrigins({NODE_ENV:'production'}).size,0);
});
test('upload limit is enforced without trusting content length',async()=>{
  assert.equal(new TextDecoder().decode(await boundedBody(new Request('https://example.com',{method:'POST',body:'hello'}),5)),'hello');
  await assert.rejects(boundedBody(new Request('https://example.com',{method:'POST',body:'too long'}),5),{status:413});
  await assert.rejects(boundedBody(new Request('https://example.com',{method:'POST',body:'small',headers:{'content-length':'100'}}),5),{status:413});
});
