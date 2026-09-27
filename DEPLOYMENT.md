# Yoro on Vercel Hobby

Project: myentar/yoro. Target: https://yoroai.tech. See BUILD_STATUS.md for verification status.

## Storage and uploads

Next.js runs on Vercel. The existing Atlas database stores profiles and short audio documents. AUDIO_STORAGE=mongodb is required on Vercel; local disk fallback fails closed. Audio is private, with session-owned access. Ordinary recordings expire after 24 hours; explicitly saved comparison recordings persist until released or reset. MongoDB TTL cleanup is asynchronous; read-time expiry is enforced.

Enrollment preserves 24 kHz PCM and the existing 60–150 second duration. Uploads use pieces of at most 2,500,000 bytes, below Vercel's request limit. At most three pieces are stored per session. The server assembles and deletes them before validating and sending to ElevenLabs. Incomplete pieces expire after 15 minutes. No permanent enrollment copy is kept by Yoro.

MongoDB locks protect profile mutations across function instances. API duration is configured to 300 seconds. A shared daily demo cap defaults to 200 provider POST requests, including retries. This counts requests, not money/tokens, and does not replace provider credit limits. Provider DELETE cleanup remains available.

## Runtime environment

Provider keys, voice/model IDs, MONGODB_URI and MONGODB_DATABASE are private Vercel production variables. Never upload .env.local, .data or .next. The .vercelignore file excludes them.

- PROVIDER_MODE=live
- AUDIO_STORAGE=mongodb
- APP_ORIGIN=https://yoroai.tech
- COOKIE_SECURE=true
- DAILY_PROVIDER_REQUEST_LIMIT=200

The exact deployment and project production hostnames are also accepted from Vercel system variables. Arbitrary origins are rejected. Atlas Network Access must permit the deployed service.

## Domain and validation

Add yoroai.tech to the project and copy the exact DNS records Vercel supplies into the .tech dashboard. Preserve unrelated DNS entries. Verify HTTPS, state loading, recording analysis and playback on the final domain. Test a real phone microphone before claiming iPhone compatibility.

Hobby is for personal/noncommercial use and has usage limits. Atlas free storage is limited: monitor usage and keep TTL cleanup enabled. Gemini and ElevenLabs retain their own credits and quotas.

## Profile continuity

Profiles use private browser cookies, not account login. Localhost's profile and personal clone do not automatically follow to the new domain. Never publish an existing session token or share one user's clone by default. Complete setup on the live domain or implement an explicit private transfer flow.
