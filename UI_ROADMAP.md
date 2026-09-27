# Yoro UI — review in steps

## Current review slice — 27 September 2026

Implemented the coherent three-destination refinement: compact Today lesson/path + direction; Yoro conversation with optional wording revision and inline rehearsal; My Voice summary with per-field editing. First-message optional introduction saves only confirmed choices and preserves the draft. Actual Aceternity public selection code is adapted in components/ui/interaction.tsx with Motion, keyboard state, and reduced motion (see THIRD_PARTY_NOTICES.md). This supersedes older five-tab, profile-form, and no-new-dependency descriptions below.

Review this flow before adding new screens. Next quality gate is live wording/companion evaluation when Gemini is available, followed by physical iPhone recording. Existing local session context is real; Backboard retrieval, validated expression scoring, and curriculum progression remain separate unfinished work. The welcome path denotes practice, not mastery. Keep changes incremental.


## Updated priority: guided learning first

Implemented a single complete welcome lesson before expanding memory or navigation. Home offers one clear action. The lesson supplies the situation, two listening examples, a sentence, one coached adjustment, retry/reflection, and a transfer sentence. Open practice remains secondary. Completion means practice, not mastery. Validate this experience with the user before adding lessons or rewards. Existing goals/memory/checkpoint plans below remain pending; current guided attempts and reflections persist, but in-progress screen position does not.

## 1. Brand and app foundation — implemented for review

Lavender #B9A0F5, violet #7852D6, onyx #111214, charcoal surfaces, off-white text. Original Listener with folded ear, not the elephant. Responsive desktop rail and five-item mobile bottom navigation. Home, Practice, Explore, Coach, My Voice preserve the V2 entry points. One prominent practice action, actual saved-session activity, confirmed profile intention and strength, and latest feedback. Preview attempts do not count as real activity. Weekly activity is a count, not a mastery score or a maintained streak. It uses the browser's local date.

The first stage changes the app frame and visual language across existing workflows. The recording and analysis page still uses the existing form structure; its focused interaction redesign is a later step. Existing same-session profile persistence is retained. No new dependencies, accounts, paid UI kits, 3D runtime, or fabricated checkpoint completion were added.

## 2. Profile, goals, checkpoints and memory

Use the existing anonymous session identity. Keep name, strengths, intention, focus, situations, and coaching preferences editable. Add a user-confirmed goal record with creation date, status, and revisions. Link practice attempts to the active goal without changing historical attempt goals.

Persist a checkpoint state machine: first recording → review an evidence-linked moment → retry → user reflection → transfer to a new prompt. Completion must be based on persisted events, with idempotency and ownership checks. Existing attempts remain history; do not automatically award unobserved review or reflection steps. These are practice milestones, not proof of communication mastery.

Add memory records with provenance: user self-report, measured observation with attempt ID, or user-confirmed coaching insight. Users can edit, reject or delete them. Fetch relevant context for coaching and explain the next-practice recommendation. Complete Backboard job polling and recall before calling it working remote memory; preserve a transparent local fallback and do not send audio to memory by default. Review same-session isolation, reset, stale sync, provider failure, and contradiction handling. Cross-device accounts need separate scoping.

## 3. Focused practice and feedback

Goal → short recording → a replayable moment → one drill → retry. Introduce a real waveform from captured audio, timestamp markers from validated evidence, and a useful comparison. Give recording and detailed feedback center stage; keep mascot illustration out of dense analysis. Typed practice retains wording-only feedback. No fake levels, acoustic scores or guaranteed emotional interpretations. Test actual iPhone Safari microphone with HTTPS, not just desktop emulation.

## 4. Influential figures and return practice

Curate authoritative source clips/transcripts and specific timestamps for the initial Jobs and Winfrey techniques. Existing exercises are original, unverified technique exercises, not sourced figure analyses. Build a listen → notice → try → reflect lesson around the user's own voice; no identity cloning. Incorporate spaced review, real completion celebrations and optional daily practice targets after the progress model is reliable. No fake leaderboard, punitive hearts or guilt messaging.

## Reference decisions

- [Duolingo path design](https://blog.duolingo.com/new-duolingo-home-screen-design/): clear next action and revisiting skills. Adapt the habit of a small completed practice, not a copied map or artificial score.
- [Skiper UI](https://skiper-ui.com/): compact interaction details and responsive controls. This pass uses original lightweight components, not imported paid components.
- [Aceternity UI](https://ui.aceternity.com/components): sidebar, cards and interaction hierarchy. Restrained border/press feedback; no large background effects behind recording.
- [Originkit](https://www.originkit.dev/): animated component reference. Public page was reachable but text extraction was limited; no source code was copied or package installed.
- [Recent](https://recent.design/): reference catalog for design refinement, not an application dependency.
- [Spline](https://spline.design/): dimensional character inspiration. Current asset is a generated transparent raster rendered through Next Image; live 3D is deferred until it justifies mobile cost.
- [Manus](https://manus.im/): reference for task-first simplicity; no embedded service or Manus API usage.

## Asset

`public/brand/listener.png` generated using built-in image generation from the approved board. Prompt: isolate the original matte lavender Listener with folded viewer-right ear, smaller thoughtful eyes, welcoming arm, full body and transparent background; preserve character identity, no text, no UI, no elephant. It is an image asset, not a rigged 3D model. Next Image serves responsive optimized sizes. The original brand board remains a concept, not a pixel-for-pixel implementation contract.


## Phrase-coaching review slice

Implemented supported-phrase replay, same-words welcoming demonstration, session-scoped 24-hour demo cache, saved-attempt resume, and honest practice/reflection totals. Removed retired dashboard CSS and decorative Waveform. Next: validate demonstration fidelity and listener judgments; build acoustic baselines and comparable-attempt evidence before numerical skill scores. Precise adjustment-conditioned synthesis, Listener voice conversion, broader lesson curriculum, and remote-memory recall remain pending.


## Direction lock: companion-led exploration
Keep the goal fixed: help users develop their own voice through guided practice. Explore now turns typed intentions and contextual follow-ups into one demonstration and recording exercise. Hide provider controls; retain optional speaker inspiration. No new destination or separate competing chat workflow. Further work should improve fidelity of the demonstration and evidence in feedback, rather than change this product direction. Spoken companion input and richer synthesis steering remain pending.


## Navigation consolidated
Primary destinations are Today, Yoro, and My Voice. Today contains overview and lesson; Yoro contains companion, inspiration, and optional general advice. Do not reintroduce separate Practice, Explore, or Coach tabs.
