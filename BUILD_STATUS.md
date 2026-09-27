# Vercel deployment — 27 September 2026

Created myentar/yoro on Vercel Hobby and deployed production build dpl_4gyo3Y1kJnKqJSsDQFchCdMTBAQM. Public Vercel alias: https://yoro-lilac.vercel.app. Attached yoroai.tech, but DNS still requires the two A records returned by Vercel (216.198.79.1 and 64.29.17.1). No paid hosting plan was selected.

With explicit user approval, configured existing provider credentials and Atlas connection as server-only production environment variables. Deployment dry-run confirmed that local secrets, recordings, generated builds and node_modules are excluded.

Added MongoDB recording storage with private session ownership, TTL expiry and comparison retention; bounded lossless enrollment uploads below Vercel's payload limit; cross-instance session mutation locks; secure production cookies/origin allowlist; 300-second API duration; shared daily provider request allowance (200 by default). Removed the unneeded Railway/Docker scaffolding. Enrollment disclosure now explains temporary upload storage. Local disk behavior remains available for local development.

Validation: 64 unit tests pass; TypeScript and production builds pass locally and on Vercel. Real Atlas integration checks use synthetic bytes in an isolated temporary database and cover playback bytes, ownership, expiry, retention, reset, mutation locking, 150-second sample reassembly and the shared request cap. The temporary database is removed after the check. Existing personal voice lifecycle contract passes. Live HTTP checks confirm frontend assets, secure HttpOnly session cookies, accepted production origin and rejected foreign origin.

Outstanding: deployed API state currently returns MongoDB connection failure; local Atlas connection succeeds, so user was asked to check Atlas Network Access for Vercel egress. Final domain DNS/HTTPS and live AI/recording checks remain pending. The site is deployed, but not yet verified usable end-to-end. Localhost profile/clone does not automatically transfer to a new domain.
# Voices portraits — 27 September 2026

Added locally hosted, licensed Wikimedia photographs for Steve Jobs, Oprah Winfrey and Malala Yousafzai to the Voices library cards and figure headings. Next Image serves responsive assets; fixed portrait frames avoid layout jumps. Credits, source links and image-license links appear in the interface and public/figures/CREDITS.md. Existing figure-specific editorial profiles, rewrite instructions and practice targets are unchanged. Checked the existing Voices browser workflow and responsive widths; full unit suite and production/type checks run for this change.

# MongoDB retry identity fix — 27 September 2026

Reproduced the MongoDB driver serialization behavior: undefined optional attempt references were written as BSON null by default. Strict retry checks then rejected valid plan retries with “Compare takes from the same voice practice,” and could likewise reject unplanned retries at the plan check. Enabled ignoreUndefined on future Mongo writes, normalized legacy optional practice references on state reads (preserving intentional feedback nulls and plan step zero), and made route guards treat null/absent references equivalently while retaining real cross-practice rejection. Existing stored attempts need no manual reset or bulk migration.

Regression coverage uses real BSON round trips plus the plan route with a legacy null voice ID and a genuinely different voice ID. Storage migration contract remains passing. Full unit suite and production build/typecheck run for this fix.

# Acoustic evidence, continuity and return habit — 27 September 2026

Added a dependency-free experimental YIN-style pitch/recorded-level analysis beside existing ASR timing and Gemini listening. New regular recordings/imports become mono 16 kHz WAV; server checks canonical PCM metadata and derives duration before transcription. Enrollment retains its original quality and existing separate conversion. Acoustic summaries inform coaching, while Listen & timing shows a pitch contour, descriptive spread and same-goal prior-take context. Silence/noise/clipping/insufficient pitch suppress reliable estimates. No emotion/dialect classifier was trained, and there is no validated universal voice score. See ANALYSIS_MODEL.md for references, implementation limits and the human-evaluation protocol.

New preparation plans optionally use a starting recording. A goal can be selected again from saved plans; the active selection survives reload and is shared with the Yoro conversation. Post-take guidance recognizes successful changes and frames another retry as optional. New lesson demonstrations support exact phrase emphasis/pause directions for both coach and accepted personal voices, with safe tag insertion and direction-aware caching. Old plans remain compatible. Plans reject unsupported numeric/spelled duration claims and attempt one bounded repair before returning an honest error. This is not a general factual guarantee.

Completed plan stages and figure challenges now contribute to practice totals, not just the welcome lesson. Users may explicitly retain both recordings in a comparison and replay/release them from My Voice; unkept recordings retain the existing 24-hour access expiry. Shared retained clips are not released while another saved pair needs them. Reset also removes the migrated local session backup to avoid reviving stale profile data if Atlas is later disabled.

Today includes optional later-today/tomorrow check-ins and a real-world reflection (helped/mixed/hard/not yet plus a short note). These self-reports inform subsequent plans and Yoro conversation. Browser notifications require explicit opt-in and a supported browser; they run while the page is open. Closed-app push, background scheduling and a service worker are not implemented. Returning to the app still shows due check-ins; no streak penalty is used.

MongoDB: corrected template brackets around the configured password only after the corrected URI authenticated. Verified an isolated API write, direct Atlas read and API reload, then deleted only that test document. Existing local sessions migrate on access when no cloud document exists; cloud state takes precedence. Audio still resides on local disk. No login or cross-device identity was added.

Verification: 60 unit tests, TypeScript, production build, isolated continuity/ownership/retention/migration/planner-repair contracts, original plan and guided-lesson browser regressions, personal-voice browser/provider regressions, and a new continuity flow at 320/390/768/1440 px. Fake microphones/mock AI are identified in test output. Three earlier supplied recordings were measured locally without external upload (104–242 ms estimator time); this is an operation check, not an emotion or pitch-accuracy benchmark. A live Gemini plan generated four directed stages in 10.106 seconds; review caught an invented duration and prompted the new guard, tested with an isolated bounded-repair contract. No post-guard live generation or human evaluation of directed synthesized speech was performed. Physical iPhone behavior remains unverified.

# Goal-based preparation and evidence cards — 27 September 2026

Today now centers one saved four-stage preparation plan generated from a user-described task: short opening, connected message, harder situation, and own-word rehearsal. Stages have an explicit purpose, challenge, delivery cue, sample, and self-check. Generation is schema-validated, checks bounded/distinct spoken samples, and is idempotent by request ID. Previous plans and attempts remain stored when a new goal is chosen. The current plan resumes after reload; quick practice remains a secondary entry. Removed the rotating home hero/direction panel and conversation starter chips plus their unused styles.

Progress is completed practice, not mastery: a stage requires two linked live audio takes and a reflection (including unsure). Next-stage access and same-step retries are checked on the server against the session-owned plan. Goals/context come from the saved plan, not the client. Text, preview and measurement-only attempts do not unlock steps. More advanced readiness grading and automatic curriculum adaptation are not implemented. Yoro receives the current preparation task, stage and saved plan as conversational context and links back to Today; advice does not silently replace or advance the plan.

Regular plans offer coach examples and the accepted personal voice. The original guided welcome lesson also offers the personal voice. Original Listener artwork remains. Personal examples require prior successful cloning/audition and are never counted as practice or proof of improvement.

Feedback now supports up to four grounded cards for expression, enunciation, wording and structure, each with an actual transcript quote, observation and action/strength. Invalid quotes and duplicate categories are removed; typed input cannot produce expression/enunciation cards. These remain AI listening impressions, not emotion recognition certainty. Timing review exposes pace, recognized fillers, gaps and repetitions with replay cues and comparison context. Gaps are not asserted to be silence; repetition is not automatically an error. Coaching and Listen & timing use accessible tabs instead of a long combined mobile page or text dropdowns.

Verification: 49 unit tests; isolated plan API tests for idempotency, ownership, lock enforcement and server-derived goals; provider comparison contract; full plan browser flow with failure recovery, personal-voice option, fake microphone, feedback cards, reflection, unlock, Yoro return and reload; existing guided lesson, onboarding, Voices, and foundation navigation regressions. Responsive checks cover 320–1440px. TypeScript passes. Production build checked after the final UI changes.

Live check: a separate test session generated an expo plan through the actual local API in 6.254 seconds: opening hook -> workflow -> skeptical question -> full rehearsal. No real user profile was changed. This is one functional check, not a curriculum quality benchmark. New detailed audio feedback cards have schema/grounding and mocked browser coverage; no new representative human-audio evaluation was performed. Physical iPhone/Safari testing remains outstanding.
# Personal voice previews — 27 September 2026

Implemented optional enrollment in the final introduction step and My Voice. Users record/import 60–150 seconds, explicitly authorize their own voice, create an ElevenLabs instant clone, audition it, and accept the likeness before personal target examples become available. Enrollment converts audio to mono 24 kHz PCM WAV; server checks container integrity, duration, very low volume and clipping. These are signal checks, not speech/identity validation. Original Listener artwork is preserved.

My Voice now offers intention + wording -> coached target -> synthetic personal example -> real recorded practice. Accepted personal voices are also available for Yoro delivery plans and Voices rewrites. Generated audio is labeled and never counted as a practice take or improvement. No guaranteed likeness, celebrity cloning, professional voice training or validated identity score is claimed.

Provider identity stays server-side under the existing session. Creation reserves state before the external request; ambiguous failures require recovery by the unique enrollment name rather than blind repeated creation. Audition and speech are session-owned, cached for 24 hours and deleted with the clone. Delete/reset removes the provider clone before clearing enrollment state; failed deletion retains recovery information. Enrollment audio is sent to ElevenLabs, not separately saved by Yoro. Accounts/cross-device recovery remain outside this demo; retain the same browser session.

Verification: 45 unit tests; isolated lifecycle and ElevenLabs adapter contracts; personal setup browser checks for consent/audition gating, deletion confirmation and 320–1440px layout; existing onboarding and Voices record/retry/reflection browser regressions; TypeScript and production build pass. Browser/provider contracts use fixtures, not real cloned speech. Fresh recording is pending from the user, so live creation, account cloning entitlement, voice verification requirements and actual likeness are NOT yet verified. No older recordings were uploaded for cloning.

Expo acceptance gate: record a clean fresh sample, audition in the user's presence, accept only if recognizably accurate, then play a goal-based example and capture a real practice take. Re-record if the accent or character drifts. Synthetic output illustrates a possible delivery, not proof of achievable or achieved improvement.
# Original Listener restored — 27 September 2026

Restored the approved public/brand/listener.png artwork throughout the app. Removed the replacement SVG character and its unused rig animation styles. State labels and existing coaching integrations remain; separate ear/eye/mouth animation is no longer claimed. Product features and saved data are unchanged. The /listener preview now accurately describes the original artwork.

# Voices and connected practice — 27 September 2026

Implemented a fourth primary Voices destination without replacing the existing visual system. Three editorially sourced figure profiles (Steve Jobs, Oprah Winfrey, Malala Yousafzai), three original technique challenges each, original examples requiring no model call, and live style-inspired rewrites of user-supplied messages. Rewrites include explanations, bounded delivery cues and before/after vocabulary evidence verified to occur in the supplied and revised text. The linked transcripts support the editorial style interpretation; authored delivery cues are not measurements of the public figure's recordings. Generated audio uses the configured coach voice and is labeled clearly; no celebrity clone or authentic quote is claimed.

Voice sessions persist in the existing browser session. Practice targets derive server-side from the owned session, not client-supplied figure context. Unknown figures/challenges, mixed practice modes and foreign sessions are rejected. Generation is idempotent by request ID. Live recorded takes link to the saved voice session, support replay/retry/reflection and resume their previous feedback and reflection. A completed practice cycle requires two linked live audio attempts and a reflection; it does not require an AI 'win' and is not a mastery rating. Next-challenge action carries the user's original message forward. Old duplicated companion inspiration chips were replaced with one link to Voices.

Today now selects an authored practice family from self-reported goals: concise expression, presenting an idea, boundaries, or opening conversation. Each has three situations and advances after live retry + reflection. This is a small rule-based curriculum, not a model-inferred personality or a validated adaptive learning system. An active practice remains stable during reflection; the next suggestion appears on returning to Today. The welcome lesson and other practice formats remain accessible. Today links to ongoing Voices or Yoro practice; My Voice links back to the latest practice destination. Yoro includes recent non-preview practice from across the app in its context. Successful practice no longer renders an empty adjustment as the return message.

## Comparison reliability: discovered a real defect, added a guard

A live synthetic-audio check found an order-sensitive judgment: the original two-audio prompt called the warm take closer, then called the neutral take closer when the order was reversed. Quotation validation alone did not catch that. Definite paired judgments now receive a second comparison with reversed audio order, neutral Sample A/B labels, no chronological identity and no first verdict. Both checks must agree with grounded quotes for a definite outcome. Disagreement, unsupported quotes or verification failure returns uncertain, preserving current-take feedback. This is a conservative consistency guard, not independent human validation or proof of accuracy; both judgments still use the same model.

After the change, the same-audio check was steady (9.42 s for analysis + verification); the reversed pair became uncertain (8.879 s). Exact duplicate uploads as a retry are also rejected before transcription. Numeric emotion, dialect correctness, identity similarity and longitudinal skill scores remain unvalidated and are not shown as facts.

## Latency and recovery

Generated speech now caches per session for 24 hours, keyed by text/style/intensity/preset/model/configured voices. Explicit new-take requests bypass the cache. Existing audio retention/reset behavior applies. Live smoke timings: rewrite 5.509 s; TTS 2.764–3.145 s; initial transcription + coaching 5.064 s; paired transcription + coaching before the new verification 8.397 s. Cached responses were byte-identical and took 29–50 ms locally. These are individual observations, not performance guarantees. The added verification costs another model request for definite comparisons. No streaming is claimed. Pending state continues to show real elapsed time, drafts/recordings survive provider errors, and microphone permission requests cannot be started repeatedly while one is pending.

## Verification

TypeScript and 42 unit tests pass; production compilation passed on the final code. Provider contract test checks ordered audio, reversed neutral verification and single-take behavior without live calls. Voices API tests cover authored examples, idempotency, input validation, session ownership, incompatible modes and reset. Browser tests cover four-tab navigation, responsive 320–1440 px widths, existing onboarding, companion recording, guided lesson, and Voices rewrite failure recovery, record/retry/reflection, reload/resume and next challenge. Microphone browser tests use a fake device.

Real provider checks: custom Jobs-inspired rewrite; ElevenLabs synthetic neutral/warm examples; timestamped transcription; Gemini audio analysis; paired comparison; duplicate-upload rejection; speech-cache equality; same-audio and reversed-order sanity checks. This is not a representative human-voice evaluation. No physical iPhone/Safari test was performed. Live evidence is in ignored test-results/live; controlled test-session data is separate from the user's browser.

## Remaining concrete work

- Human listening validation: blinded human labels on same, distinctly improved, similarly good, rushed, different-content and noisy pairs across accents. Keep ambiguous cases uncertain. Do not market the consistency guard as validated emotion detection.
- Phone readiness: reachable HTTPS origin plus real iPhone microphone permission, recording, playback and background/interruption checks. Responsive browser widths alone do not verify this.
- Public deployment: documented server-side media probing, upload limits, identity/access, object storage, budget/rate controls and multi-instance consistency. The local prototype has not been deployed.
- External memory: confirmed profile sync remains available; Backboard retrieval is not implemented. Working continuity is the saved session profile, turns, voice sessions and attempts.

Earlier entries below are historical and superseded where they conflict.

# Articulated Listener — 27 September 2026

Replaced the rendered single PNG with an original layered SVG character in components/Listener.tsx, preserving the lavender, large ears and folded viewer-right ear direction. This is a new softly shaded vector interpretation, not a pixel-identical conversion of the dimensional raster. The original PNG remains available as the visual reference. No Rive asset/runtime is used: a working code-native rig was authored directly rather than representing a missing .riv file as implemented.

Independent head, ears, eyes/pupils, eyebrows, mouth and arm groups support ready, listening, thinking, responding, speaking, encouraging and celebrate states. Includes blinking, subtle breathing, pointer gaze within the character, ear turns/twitches, conversational gestures and finite celebration. Actual recorder state, requests, reply reveal, and guided/companion example playback drive behavior. Phrase replay/exemplar playback also communicates activity to the feedback Listener. Speaking mouth motion follows play/pause/end, but is stylized: no amplitude or phoneme lip sync. No free-roaming navigation mascot or full skeletal 3D asset is claimed.

Animations pause when their SVG is offscreen or the document is hidden; reduced motion disables timelines while preserving readable state poses. Unique SVG definition IDs prevent conflicts among multiple instances. Cleaned up obsolete whole-image keyframes. No added dependency, provider calls or user-session writes.

Review /listener for a standalone seven-state preview and an interruptible listening → thinking → replying → celebration sequence. This preview is explicitly simulated and uses no microphone/AI calls. Main app integrates the same component.

Checks: TypeScript, 35 unit tests, production build, animated-rig browser test (separate joints, states, sequence stop, responsive widths and reduced motion), guided lesson, companion and three-destination UI regression. Desktop preview screenshot visually inspected. Real Safari/device performance and exact audio synchronization need physical-device review.

# Paired listening and conversational feedback — 27 September 2026

Eligible retries now supply both owned audio takes in a single Gemini analysis request, clearly labeled previous/current, with the earlier goal and coaching cue. Previously only the new clip was supplied. Matching audio goals/kinds are required; previews, typed input, transfer sentences, expired previous audio and combined audio above 14 MiB do not receive a paired assessment. The current take can still be coached, with an explicit comparison-unavailable note. Existing ownership and attempt idempotency remain in place.

A saved comparison reports closer / steady / mixed / not_yet / uncertain toward the user's intention. Definite conclusions require quoted phrases present in BOTH transcripts; unsupported evidence is downgraded to uncertainty. This validates quotation grounding, not the truth of an acoustic judgment. AI comparison accuracy remains unvalidated. These are qualitative per-pair judgments, not numeric skill scores or measured longitudinal improvement. Recent comparisons are visible in My Voice and included in companion context. Prior single-take records are not retroactively labeled improved.

Coaching can leave adjustment empty when no useful correction is needed; the UI then omits the correction block. New analysis output lengths are bounded to keep replies short. Shared conversational feedback presents the result, supported change, preserved strength and optional next action. Retry coaching is visible immediately, without disclosures. First/retry playback and user reflection remain. Compact open-practice timing and replay cues remain; the former lengthy diagnostics/dropdown presentation is removed.

Pending requests show an animated Listener, actual elapsed time and a longer-wait message without fictional progress stages. The indicator scrolls into view. Returned text is revealed in short chunks; this is a local presentation effect after the response arrives, NOT provider streaming. Reduced-motion preference shows text immediately. No automatic TTS narration was added. The guided/open practice picker uses direct actions instead of nested disclosures; recording import is directly available. Setup/history disclosures elsewhere remain unchanged.

Verification: TypeScript; 35 unit tests (including evidence in both takes, uncertainty, eligibility); isolated provider contract test proves ordered two-audio payload, prior cue and no forced correction with mocked fetch; responsive and onboarding browser checks; guided flow checks pending state, an improved retry without a correction, visible comparison, recording/reflection/transfer, and absent feedback dropdowns. Production build passes. All audio/model tests use fixtures; no provider credits were used. Real paired listening quality, provider latency and physical iPhone audio still need testing. Gemini quota has not been rechecked.

Try Today → Start my lesson, record a baseline, then retry with the suggested change. Watch the pending Listener and comparison. If Gemini is unavailable, errors retain the recording; no improvement is awarded. My Voice shows saved paired assessments after successful analysis.

# Discoverable profile and Listener behavior — 27 September 2026

Added a direct Create my voice profile action on Today until the optional introduction is confirmed complete. It opens the existing survey, preserves existing answers, persists through the same profile API, and can be skipped without blocking lessons. My Voice remains the editing/re-entry point. This is a browser-session coaching profile, not an account or cross-device identity.

Listener now has ready, listening, thinking, speaking and celebration states. Real microphone recording drives the listening state in guided and open practice; companion requests drive thinking; companion and guided example playback drive speaking; completed guided practice and survey review have brief celebration motion. Recorder cleanup clears activity on unmount. Motion uses existing raster artwork with whole-character transforms, not rigged ears, facial expressions, lip sync, loudness analysis or a freely roaming character. Reduced motion disables transforms/animations. No provider calls or new dependencies.

Checks: TypeScript, 32 unit tests, production build, onboarding entry/persistence/error tests, guided recording state checks, and responsive UI regression (including reduced motion). Broader UI redesign remains deferred per the user.

# Conversation, wording, and personal direction — 27 September 2026

This review slice keeps Today / Yoro / My Voice and the lavender/onyx Listener identity. It supersedes earlier descriptions of a separate advice disclosure, mandatory exercise replies, profile form, and CSS-only interactions.

Implemented:
- Optional four-question introduction plus review/name. Opens on the first submitted Yoro message for an empty profile; skip/save persists. The original message is sent after the choice succeeds. Existing profiles are not forced through it. My Voice can reopen it. Custom wording, back/edit, cancel/skip, and retry after save failure are supported; no silent inferred profile fields.
- Conversation replies can contain discussion alone, an original/revised wording suggestion with rationale, and/or one practice plan. Wording originals are checked against user messages or owned practice transcripts; unsupported originals are omitted. This check does not independently guarantee semantic equivalence of the revision.
- Six recent exchanges remain visible, with older retained exchanges available. Twelve are saved per session. Practice recordings link to an owned conversation turn; follow-ups receive the last three linked attempts as explicitly labeled prior feedback, not new audio perception. Existing old-format turns remain readable. Drafts survive provider errors.
- Voice rehearsal and the return to conversation happen in place. Speaker inspiration fills an editable request rather than opening a second form. Examples still use existing hidden style/intensity controls, not arbitrary voice mimicry.
- My Voice is now a readable summary with a single expandable field editor. All original profile fields remain editable. Practice totals/history, earlier advice conversations, setup, and reset remain available. The primary duplicate Advice UI was removed; its API remains for compatibility.
- Today has a compact lesson, saved-practice path, personal direction/strength, and a conversation entry. It still offers the authored welcome lesson; it does not pretend to select a personalized curriculum or measure mastery.
- Adapted actual public Aceternity Card Hover Effect / Tabs source for animated survey selections. Added Motion and original reduced-motion-aware step/editor transitions. Source/license details: THIRD_PARTY_NOTICES.md. No paid template or Spline runtime added. Removed superseded home and disclosure CSS.

Validation: TypeScript; 32 unit tests; production build; isolated browser suites for five responsive widths, profile continuity, simulated microphone, full guided lesson, linked conversational practice, quota failure and retained drafts, optional survey/back/review/custom answers, failed saves, skip persistence, wording-only responses, focused profile editing and reduced motion. Screenshots reviewed for desktop Today/profile and mobile onboarding/wording. A separate fresh-session test exercises the real local introduction/profile validation, unknown conversation ownership rejection, and reset routes without contacting any provider. Existing user session/data were not changed.

Limits: Browser audio uses a fake microphone and fixtures; physical iPhone recording remains unverified. No new live Gemini/ElevenLabs request was made in this slice. The prior Gemini quota issue has not been rechecked; actual new wording/conversation quality needs live review when available. Backboard recall, accounts, arbitrary nuanced synthesis, evidence-based expression scoring, and a wider curriculum remain pending. Saved local profile/context works independently of remote memory sync. No emotion/dialect accuracy or improvement score is claimed.

Review: Refresh http://127.0.0.1:3000/. Start with My Voice → Tailor my practice; then Yoro with a real sentence to improve, and a follow-up such as “less formal.” Today remains the direct lesson entry. In a new session, submitting the first Yoro message offers the optional introduction.

# Navigation cleanup — 26 September 2026

Consolidated five primary tabs into Today, Yoro, and My Voice. Today owns the lesson overview and in-place practice with an explicit return action. Yoro combines delivery discovery and speaker inspiration, with the existing general-advice workflow available under a secondary disclosure. Removed redundant cross-navigation cards and obsolete tab branches; saved profiles, attempts, conversations, and API behavior are unchanged. Updated browser tests for three destinations, Today active state inside a lesson, and return navigation. TypeScript, 28 unit tests, production build, responsive UI, guided lesson, and companion fixture checks passed. No live provider calls were needed.

# Companion-led Explore — 26 September 2026

Replaced the primary emotion/voice/intensity selector flow in Explore with natural-language delivery discovery. The server derives a structured reply, goal, original practice sentence, cue, and hidden synthesis settings from the user's message, confirmed profile, and up to six prior exchanges. Twelve exchanges are retained per session; requests are idempotent within retained history. Conversation context is cleared by reset. It is not an inferred permanent voice profile and has not listened to user audio.

Explore now leads directly to one voice demonstration and an integrated recording practice with its goal and wording already supplied. Follow-ups refine the plan. Earlier exchanges are collapsed to keep the current next step visible. This version accepts typed conversation; spoken requests are not implemented. The recording exercise still uses the existing audio feedback pipeline. It does not yet synthesize arbitrary custom delivery instructions: the plan selects from the existing internal styles/intensity, which may not express all requested nuances.

During Gemini quota failure, the draft and previous plan remain. An explicitly labeled authored starter allows ElevenLabs listening and local rehearsal without Gemini; personalized conversation and recording analysis still require it. No keyword-matching fallback is presented as understanding. Speaker inspiration stays secondary; guided lesson remains unchanged. Removed obsolete Explore comparison state and unused VoiceDemo callback, kept advanced comparison under a disclosure in feedback.

Checks: TypeScript, 28 unit tests, production build, existing five-width UI test, and new isolated browser test for natural-language follow-up, reload persistence, absent emotion selectors, integrated recording, quota recovery, starter labeling, and responsive layouts. No paid API calls; live conversation quality remains unverified while Gemini quota is exhausted.

# Phrase coaching and practice continuity — 26 September 2026

Implemented the next bounded slice: guided feedback includes a tappable transcript-supported phrase. Playback uses a finite, duration-bounded evidence range when available and explicitly falls back to full recording otherwise. A separate ElevenLabs action demonstrates those same words with welcoming delivery in the default coach voice. This is a general welcoming example, not a verified realization of the precise Gemini adjustment or a corrected user voice.

The phrase-demo endpoint accepts only an owned attempt ID, derives its phrase from saved evidence, restricts it to live guided welcome audio, serializes requests per session, and caches generated audio for 24 hours using a configuration-sensitive key. Cache resets with session data; no raw user text or voice controls are accepted by the endpoint. Existing recordings also expire after 24 hours; saved feedback remains and playback expiry is explained.

Lessons resume from their latest saved attempt chain and saved reflection after navigation or reload. Unsaved microphone audio, pre-recording screens, and listening choices do not persist. My Voice now displays real audio practice counts, completed lesson runs, and user-reported retry preferences separately from skill judgments. No numerical emotion/mastery score, acoustic baseline, or validated before/after assessment has been added. Those remain next-phase work.

Removed unused decorative Waveform component and retired dashboard-only CSS. Simplified feedback surfaces to a prominent interactive phrase and a compact demonstration action. Revisited Skiper, Aceternity, and Duolingo references for focused controls and progressive disclosure; original lightweight CSS, no new runtime dependencies.

Verification: TypeScript, 25 unit tests (including invalid evidence, preview exclusion, broken/cyclic resume links), responsive browser checks across five widths, guided fixture walkthrough including replay/demo reuse and reload resume, and production build. Browser checks use isolated fixtures and fake audio; no paid provider requests. Live demonstration quality, precise cross-browser seek behavior, and physical iPhone audio still require review. Gemini quota remains an external blocker for new live coached attempts.

# Guided welcome lesson — 26 September 2026

User feedback reprioritized the work around immediate guided learning. Home now presents one welcome lesson, with no required profile, prompts, or settings. Practice leads through two same-sentence examples, subjective noticing, a fixed recording prompt, one observation/action, retry playback and saved reflection, then a new sentence. Existing open practice sits under a secondary disclosure. Explore, advice, speaker exercises, and editable profile remain available.

Guided metadata is validated server-side and its goal/context derived from an authored lesson. Retries require an owned live audio parent; transfer requires an owned retry plus a saved reflection. Attempt IDs remain idempotent on failed requests. Typed or preview input cannot complete this audio lesson. Three recordings save in existing session history; unique guided lessons practiced appear in profile. There is no lesson resume after navigation, spaced repetition, mastery score, or new remote-memory recall yet.

Listening coaching now targets emphasis, phrase endings, and intelligibility for this lesson, rather than automatically selecting a filler/timing drill. This is constrained Gemini audio feedback, not a new trained emotion/dialect/enunciation algorithm or validated acoustic classifier. Existing timing measurements remain available for open practice. Examples use ElevenLabs with the same words and voice; uncertain contrasts accept “They sound similar.” Playback failure has a written-cue path. Errors never award completion. No provider usage is fabricated.

Validation: 22 unit tests, TypeScript, production build, browser fixture walkthrough of the complete guided sequence (three microphone captures, playback, reflection, parent links, stable retry ID after a 503, preview limitation), and existing five-screen responsive checks at 320/390/768/1024/1440. Browser tests use fake microphone/audio and isolated responses, no paid requests or real-user data mutation. Live example quality and physical iPhone microphone still need user evaluation. Screenshots in test-results. No new dependency. Equivalent installed package scripts run directly because the pnpm wrapper attempted unrelated installation previously.

This entry supersedes the dashboard-first flow described below.

# Yoro UI foundation — 26 September 2026

Step 1 of UI_ROADMAP.md implemented: lavender/onyx design system, original Listener artwork, desktop navigation rail, safe-area-aware mobile bottom navigation, accessible focus/skip controls and reduced-motion support. New Home uses actual non-preview saved attempts for seven-day activity, confirmed profile fields for intention/strengths, and latest saved feedback. All four original workflows remain reachable. Profile persistence is the existing session-scoped implementation; new memory recall and checkpoints are not yet implemented. Figure exercises remain explicitly unverified original technique exercises.

No new runtime dependency was added. Original lightweight CSS/components take inspiration from the requested design references. Listener generated with the built-in image tool, kept in public/brand/listener.png and served with Next Image. UI_ROADMAP.md records sources, decisions, next steps and memory provenance rules.

Validation: direct project TypeScript check, 20 existing unit tests, production build, and deterministic Edge browser UI check. The package wrapper attempted unnecessary network installation when invoked as pnpm; equivalent existing local scripts were run directly instead. UI test covers all five screens at 320/390/768/1024/1440, profile-to-home update and reload with mocked persistence, fake microphone capture, visible submission error, reduced motion, and no page errors. It uses isolated API fixtures, no paid provider calls or user-data mutation. Narrow activity-card overflow found and fixed. Screenshots in test-results. This does not verify physical iPhone audio, live provider quality, cross-device accounts or Backboard recall.

This entry supersedes older statements below that branding is deferred. The functional foundation and previously recorded limitations remain applicable.

# Build status — foundation handoff

## Expressive delivery comparisons — 26 September 2026

Replaced the inline single-example speech control with a reusable `VoiceDemo` component and a shared, versioned-by-code style catalog. Eight intended styles: neutral, warm, curious, confident, reassuring, excited, sad, and frustrated. Same-text A/B generation holds voice and expression level constant. Eleven v3 directions are repeated at sentence boundaries; conversational/expressive settings use stability 0.5/0. Spoken input rejects audio/markup tags. This is provider-guided synthesis, not a trained emotion synthesis model.

Configured US examples to the existing expressive American-labeled coach voice and UK examples to a British-labeled premade voice verified in the account inventory. Existing nonempty voice settings were preserved. These are broad accent examples, not comprehensive dialect teaching or guaranteed regional authenticity.

Completed clips are reused within a component while text/voice/expression remain unchanged. Partial failure retries only missing clips. Changed input cancels/ignores stale requests and revokes stale audio; playback stops the other comparison player. Includes listening cues, perceived-contrast feedback, explicit new-take controls, and selected-style handoff to a recording exercise. No claim that the selected label guarantees perceived emotion.

Cleanup: removed the old inline speech component, duplicate recording playback where evidence playback exists, duplicated fallback drill text, repeated mascot-development copy, and unused `tsx` dependency (lockfile updated). Moved setup to My Voice; main navigation now has Practice, Explore, Coach, and My Voice. Kept freeform advice, optional speaker paths, profiles, and roleplay. Practice idempotency now changes with goal/context as well as input.

Verification: all eight styles plus a UK example returned playable-format audio through the live API, twice during prompt iteration. Invalid emotion and markup inputs returned 400/422. Two blind Gemini listening checks showed inconsistent classification and overlap among several intended styles; these are exploratory model judgments, not a perceptual benchmark, and distinctness across every style is NOT validated. No claim of eight reliably distinguishable emotions should be made. Human listening and voice/prompt curation remain necessary. Twenty unit tests, TypeScript, production build, and browser comparison checks passed. Browser checks use stubbed audio responses to test caching, partial failures, stale clips, exclusive playback, practice handoff, setup relocation, and five widths. Real iPhone testing is still pending.

## Delivery-analysis pivot — 26 September 2026

The default entry is now personal voice practice. Recording import (MP3/WAV/M4A/WebM/Ogg, browser-decoded duration <=45s) supplements microphone capture. The versioned `timing-1` module computes ASR-derived pace, English filler counts/rates, exact one-to-three-word tandem repetition candidates, word-timing gaps with threshold sensitivity, and a busiest five-second window. Each candidate is replayable with context. A transparent rule selects one drill; retry comparisons describe changes without claiming improvement. Extra moments and methodology are expandable.

Scribe explicitly preserves verbatim disfluencies. Invalid timing suppresses metrics; zero-duration ASR words remain point estimates with disclosure. Text and preview inputs do not receive measured delivery results. Gemini receives the computed summary; temporary coach failure returns clearly labeled measurements-only feedback when possible. Transcription failure cannot produce fabricated measurements.

Verification: 17 unit tests, TypeScript check, and production build pass. An opt-in live Edge integration test imported an authorized real clip, transcribed it, computed timing, replayed evidence, and checked five widths (320/390/768/1280/1440). Gemini failed during that test; the measurements-only fallback worked. A subsequent provider-stubbed browser test verified the new Practice-first entry, bounded excerpt playback, drill and retry comparison at the same widths. These tests do not establish accuracy or coaching efficacy; physical iPhone testing remains pending.

Three consented development recordings were transcribed and measured. A separate local Praat/Parselmouth raw-autocorrelation experiment checked pitch sensitivity; it is not integrated into the app. Research and sample findings are in `../voice-analysis-research-plan.md` and `../voice-analysis-findings.md`. Private transcripts and experiments are outside this application under the workspace `work/` directory, not committed as test fixtures.

Still pending: independently decoded server duration, acoustic VAD/pause corroboration, modern filtered-autocorrelation integration, manual event labels, held-out speaker evaluation, general repair/rambling detection, transcript corrections, personalized baselines, and learned progress/mastery. Current drill selection is explicit rules, not a trained algorithm. Lower filler count or faster/slower pace alone is not success. The status above supersedes earlier test counts and initial navigation notes below.

## Temporary provider error handling

Gemini generation now retries explicit HTTP 500/502/503/504 failures up to three total attempts with bounded backoff and an overall deadline. Credentials/quota errors, ambiguous network timeouts, speech generation, and memory mutations are not automatically retried. Error messages distinguish service unavailability from missing permissions or model configuration. Nine unit tests pass, including retry bounds and avoiding duplicated side effects.

## Live activation update

The local app is now in live mode. Verified Gemini advice; ElevenLabs voice generation; transcription of a short synthetic test clip with ten word timings; Gemini audio feedback; and Backboard profile sync plus deletion of the isolated test assistant. Test session data was reset. Gemini model changed locally to gemini-3.8-flash after gemini-2.5-flash returned 404. One transient 503 occurred before subsequent successful calls. No API keys were printed. Backboard recall/async completion, real-user coaching quality, Atlas, cloud deployment, and actual iPhone recording remain unverified. This update supersedes the earlier credential-verification status below.

## Implemented

Next.js / TypeScript responsive neutral shell, optional speaker exercises, freeform coach entry, editable same-device profile, scenario preview and rewind, browser audio capture/upload/replay, typed practice, retry comparison, saved history/reflection, explicit preview/live modes, local persistence, optional Atlas adapter, secret-free connection status, and reset.

Provider adapters: Gemini JSON coaching with transcript quote validation; ElevenLabs transcription and expressive demonstrations; Backboard profile memory sync/delete. They require local credentials and live verification. Current saved-focus continuity uses the app profile. Backboard recall and job-completion polling remain to be implemented before claiming fully demonstrated sponsor memory behavior.

## Verification

- TypeScript check passed.
- Five unit tests passed for evidence validation, timestamps, schema limits, and honest comparison.
- Production build passed.
- API smoke passed: persistence, two-session isolation, duplicate attempts, retry comparison, origin rejection, invalid input, and rewind.
- Browser smoke passed: profile persistence, labeled coach preview, scenario rewind, retry comparison, fake-device microphone/upload, and widths 320/390/768/1280/1440, with no page errors. An initial failure exposed the framework development badge covering mobile navigation; disabling that badge resolved it.

## Branding/UI discussion boundary

No final branding, logo, mascot artwork, typography system, colors, motion language, or polished interaction layout selected. The dashed C is a functional placeholder. Screen structure is changeable.

## Pending before a live demo

- Populate .env.local with provider keys and voice IDs; verify API models/quotas and real output quality.
- Test actual iPhone Safari audio and access through HTTPS.
- Curate public-speaker references; current examples are original technique exercises, not verified figure analysis.
- Add direct recorded-turn roleplay (currently typed roleplay plus recorded rehearsal of the chosen reply).
- Complete two perception exercises per lesson and verify audio contrasts; current foundation has one question per exercise.
- Persistent background jobs, independently verified recording duration, scheduled retention cleanup, private cloud object storage, and public deployment.
- Live Backboard and Atlas verification; no prize submission or deployment has occurred.

Read README.md for storage and deployment constraints. This is a functional pre-branding foundation, not the completed V2 MVP.


## ElevenLabs local network repair — 26 September 2026
Diagnosed EACCES outbound network denial in the local execution environment; the old server returned speech 503 within 25–101 ms, not a genuine timeout. After network permission was granted, the configured voice returned 200 and a direct Eleven v3 test generated 38,078 bytes in 1.18 seconds. Subscription lookup lacks read permission (401 missing_permissions); no quota balance was inferred. Restarted the development server with network access and verified the app speech endpoint. Error handling now distinguishes network denial, timeout, and other connection failures without exposing provider data or retrying paid synthesis. TypeScript, all 26 tests, and production build passed. Gemini quota is separate and unchanged.

## Recording sounds — 27 September 2026

Added quiet locally synthesized two-note start/stop cues to the shared recorder. Start cue follows granted microphone access and finishes before MediaRecorder capture; the stop cue follows track shutdown. No API call or downloaded asset. Unsupported/suspended audio falls back silently and unmount closes the sound context. Record/retry browser regression passed with a fake microphone; physical-device loudness and speaker bleed still need a human listen.


