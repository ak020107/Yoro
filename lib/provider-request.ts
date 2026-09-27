export class ServiceError extends Error {
  status: number;
  constructor(message: string, status = 503) { super(message); this.status = status; }
}

type Dependencies = { fetch: typeof fetch; sleep: (ms: number) => Promise<void> };
export async function providerRequest(url: string, init: RequestInit, dependencies: Dependencies = {
  fetch: globalThis.fetch,
  sleep: ms => new Promise(resolve => setTimeout(resolve, ms)),
}) {
  const target = new URL(url);
  const isGemini = target.hostname === 'generativelanguage.googleapis.com';
  const name = isGemini ? 'Gemini' : target.hostname === 'api.elevenlabs.io' ? 'ElevenLabs' : 'The memory service';
  // Only retry explicit temporary Gemini generation failures. Never automatically
  // repeat memory mutations, billable audio generation, or ambiguous timeouts.
  const attempts = isGemini && target.pathname.endsWith(':generateContent') ? 3 : 1;
  const deadline = Date.now() + 55000;
  for (let attempt = 0; attempt < attempts; attempt++) {
    if(process.env.VERCEL&&(init.method||'GET').toUpperCase()==='POST')await(await import('./usage-budget')).reserveProviderCall();
    let response: Response;
    try {
      response = await dependencies.fetch(url, { ...init, signal: AbortSignal.timeout(Math.max(1, Math.min(18000, deadline - Date.now()))), cache: 'no-store' });
    } catch (error) {
      const failure = error as { name?: string; cause?: { code?: string } };
      if (failure.name === 'TimeoutError' || failure.name === 'AbortError') throw new ServiceError(`${name} could not respond in time. Your input is still here. Please try again.`);
      if (['EACCES', 'EPERM'].includes(failure.cause?.code || '')) throw new ServiceError(`${name} could not be reached because this local server is blocked from accessing the network. Restart the server with network access enabled.`);
      throw new ServiceError(`${name} could not be reached. Check the server internet connection and try again. Your input is still here.`);
    }
    if (response.ok) return response;
    const temporary = [500, 502, 503, 504].includes(response.status);
    if (temporary && attempt + 1 < attempts && Date.now() < deadline - 3000) {
      await response.body?.cancel();
      await dependencies.sleep(600 * 2 ** attempt);
      continue;
    }
    // Log status only: no headers, keys, URLs, user content, or provider payloads.
    console.warn(`${name} request failed: HTTP ${response.status}; attempts ${attempt + 1}`);
    await response.body?.cancel();
    if (temporary) throw new ServiceError(`${name} is temporarily unavailable${attempts > 1 ? ' after automatic retries' : ''}. Your input is saved in this form. Please try again shortly.`);
    if (response.status === 429) throw new ServiceError(`${name} has reached a rate or usage limit. Wait briefly and try again; if it continues, check the account quota.`, 429);
    if ([401,403].includes(response.status)) throw new ServiceError(`${name} did not authorize this request. Check its API key and permissions in the local configuration.`);
    if (response.status === 404) throw new ServiceError(`${name} could not find the configured model or resource. Check the model or voice ID in the local configuration.`);
    throw new ServiceError(`${name} could not process this request (HTTP ${response.status}). Please try a shorter input or check the configured model.`);
  }
  throw new ServiceError(`${name} is temporarily unavailable. Please try again.`);
}
