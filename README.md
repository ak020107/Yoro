# Yoro | Find your voice

Responsive Next.js speech-coaching prototype with the lavender/onyx Listener identity. Try the live demo at https://yoroai.tech. For local development, open http://127.0.0.1:3000. The four destinations are Today, Yoro, Voices and My Voice.

## Product

- **Today:** a saved four-stage preparation plan, an optional starting recording, linked retries and reflection. Return to older goals or use the shorter welcome lesson. Real-world check-ins connect practice to your next conversation.
- **Yoro:** a continuing conversation about wording and delivery, optional profile introduction, concrete revisions and integrated recording. Recent practice informs the conversation.
- **Voices:** Steve Jobs, Oprah Winfrey and Malala Yousafzai technique profiles grounded in linked primary transcripts. Three original challenges per figure; style-inspired rewrites, word-choice explanations, coach-voice demonstrations and saved practice cycles.
- **My Voice:** editable confirmed preferences, saved comparisons, practice activity and a return to practice. Setup and reset are here.
- **Listener:** the original approved Listener artwork, with accessible recording/processing/reply/playback state labels.

See PRODUCT_REVIEW.md for the demo script and problem-to-solution table, and BUILD_STATUS.md for verification and remaining limits.

## Run locally

Requires Node 22.6+ (Node 24 recommended). Install dependencies, then run pnpm dev. Start.ps1 can use the bundled runtime on this computer. Build with pnpm build. Secrets live in .env.local, copied from .env.example; restart after changing them.

Gemini provides structured coaching and audio impressions. ElevenLabs provides word-timed transcription and generated examples using eleven_v3. Configure a permitted default coach voice; optional US/UK presets remain supported. Set PROVIDER_MODE=live for real calls. Missing credentials or provider errors never silently become invented live feedback. Preview exercises are labeled.

Backboard confirmed-profile sync is optional; retrieval and asynchronous completion verification are not implemented. Local development supports disk storage. The Vercel deployment uses MongoDB for session data and audio. Working memory is the saved session profile, turns, attempts, plans, voice sessions and real-world check-ins. See MONGODB_SETUP.md for setup and migration details.

## Feedback and progress

Timing metrics are deterministic estimates from ASR word timestamps. New PCM recordings also provide experimental pitch and recorded-level measurements; ANALYSIS_MODEL.md explains their limits and evaluation. Perceptual expression feedback is a model impression, not an emotion diagnosis. Definite retry judgments need quoted evidence from both transcripts plus a second, reversed-order comparison with neutral sample labels and no chronology. Disagreement or unavailable verification becomes inconclusive. This catches some order-sensitive judgments but is not a validated human listening benchmark.

A completed Voices practice cycle means two linked live audio attempts plus a reflection. Today advances after the same kind of practice activity. Neither is a numeric skill score. Examples demonstrate techniques in the configured coach voice; they are not authentic quotes or cloned recordings of the public figures.

## Storage and deployment limits

A random HttpOnly SameSite cookie isolates browser sessions. This is not a cross-device account. Local records are under ignored .data; MongoDB supports shared session and audio storage for deployment. Reset clears the current session and audio, deleting synced external memory first when present. Explicitly retained comparison pairs remain until released/reset. Other audio and cached examples expire for access after 24 hours and are removed on expired access or reset; scheduled cleanup is not implemented.

The demo is deployed on Vercel. Production uses MongoDB storage, shared session locking, bounded uploads, chunked personal-voice enrollment, and a shared provider-request budget. Practice recordings use canonical 16 kHz PCM with server-side duration checks. See DEPLOYMENT.md for configuration and remaining operational limits. Browser sessions are not authenticated cross-device accounts.

Phone recording requires a reachable HTTPS deployment/tunnel with the correct APP_ORIGIN. Phone localhost is not this computer. Responsive browser tests do not establish real iPhone microphone/playback behavior; physical-device checks are pending.

## Checks

- pnpm typecheck, pnpm test, pnpm build.
- tests/provider-comparison.cjs: isolated provider payload and blind-verification contracts, no live calls.
- tests/voices-api.cjs and tests/introduction-api.cjs: local API isolation, validation and reset; no paid requests.
- tests/ui-foundation.cjs, tests/guided-lesson.cjs, tests/discovery.cjs, tests/companion-onboarding.cjs, tests/voices-ui.cjs and tests/listener-rig.cjs: Playwright checks using mocked APIs and a fake microphone where needed. Set PLAYWRIGHT_MODULE if the existing Playwright installation is outside this project; Microsoft Edge is used.
- tests/live-listening.cjs and tests/live-comparison-check.cjs are opt-in paid integration checks. They require RUN_LIVE_YORO=1. The latter uses the synthetic recordings saved by the former; do not treat the small test set as validation of human emotion or coaching accuracy.

Test artifacts live in ignored test-results. No API keys are sent to the browser or included in committed sources.

Personal voice demo: open My Voice > Set up my personal voice (also optional during introduction). Record 60–150 seconds of your own clean natural speech, authorize cloning, audition, and accept before generating personal examples. Requires ElevenLabs instant cloning access plus Voices read/write and TTS permissions. No likeness guarantee; actual voice must be auditioned. Remove my personal voice deletes the remote clone and cached examples. Keep the same browser session for this demo.

Goal-based practice: Today > describe the task > Build my practice plan. Four linked stages explain their purpose and unlock after a real audio retry plus reflection. Yoro receives the current plan as context. Accepted personal voices can demonstrate regular lesson examples. Coaching and Listen & timing separate suggestions from replayable ASR timing estimates.

## Return reminders

Choose a check-in on Today, then optionally enable browser reminders. Notifications work while Yoro is open, not as closed-app push. Due check-ins remain available on return. Reflections are your own reports and guide later coaching without being treated as measured improvement.

