# Yoro coaching pipeline — implementation and evaluation

## What is running

This is a hybrid coaching pipeline, not a newly trained emotion or dialect classifier.

1. Practice recordings are decoded in the browser to mono 16 kHz PCM WAV. Voice-clone enrollment retains its original quality and uses the existing enrollment conversion separately. If microphone decoding fails, ordinary provider coaching can still use the original recording; new acoustic measurements are omitted.
2. ElevenLabs supplies transcription and word timestamps. Existing deterministic measurements describe recognized pace, filler candidates, gaps and repeated wording. Timestamp gaps are not necessarily silence.
3. `lib/acoustics.ts` implements a small **YIN-style** cumulative normalized-difference estimator: 8 kHz working signal, 512-sample comparison window, 20 ms hop, approximately 50–500 Hz search, 0.15 difference threshold, parabolic lag refinement. It is a simplified implementation, not pYIN or a full reproduction of the published algorithm. It reports median pitch, 10th–90th percentile pitch spread in semitones, recorded-level spread in pitched frames, estimated pitched duration and clipping. Contour points are sampled every 100 ms.
4. Quiet/aperiodic/short/clipped signals can return insufficient evidence. The -45 dB gate and 1% clipping threshold are engineering choices, not clinically or perceptually calibrated thresholds. Background periodic sounds can fool a pitch estimator; pitched frames are not a speech detector. Microphone processing, creaky/breathy voice, octave errors and the fixed pitch range limit the results.
5. Gemini receives real audio, transcript timing and the acoustic summary. It provides tentative, quote-grounded expression/enunciation/wording/structure observations. Self-chosen dialect goals are context for specific audible features, not a label inferred about a person's identity. Definite progress judgments retain the existing paired-audio, reversed-order verification. The acoustic summary does not itself establish improvement or an emotional state.
6. Confirmed profile preferences, practice, a chosen starting recording, and real-world reflections inform future plans and conversation. Pitch and level differences never directly award points or unlock mastery.

The main reference is [de Cheveigné and Kawahara's YIN paper](https://pubmed.ncbi.nlm.nih.gov/12002874/). A later probabilistic implementation is documented in [librosa pYIN](https://librosa.org/doc/0.11.0/generated/librosa.pyin.html); Yoro does not run that implementation. The [SpeechBrain IEMOCAP model](https://huggingface.co/speechbrain/emotion-recognition-wav2vec2-IEMOCAP) is a candidate for a separate evaluated classifier, not integrated or silently substituted for real-world validation here.

## Verification completed

- Controlled signals: 80, 120, 200 and 320 Hz tones estimated within 2 Hz; pitch sweep and changing amplitude produce distinct descriptive measurements; silence, clipped input, deterministic noise and short/invalid samples are rejected as insufficient.
- Container checks: canonical WAV lengths, PCM format, channel count, sample rate, byte rate and block alignment.
- The three user-supplied recordings were decoded and measured locally. All yielded usable estimates in approximately 104–242 ms of estimator time on this computer. This verifies operation, not accuracy against a pitch reference or emotion labels. Different wording means their pitch spreads are **not** improvement scores. See `test-results/local-acoustic-check.json`.
- Existing blind-comparison and evidence-grounding contracts remain covered. Browser tests use fake microphones and mocked listening results; they do not establish human-perceived accuracy.

## Human evaluation still required

Use consented recordings from multiple speakers, microphones and self-described accents. Capture the same short text with two intended deliveries, plus spontaneous conversation. Ask at least three listeners to judge the **perceived delivery relative to the stated goal**, with sample order randomized and chronology hidden. Allow mixed/uncertain/no difference. Separately annotate specific intelligibility difficulties, filler occurrences and word emphasis; never use accent conformity as correctness.

Record `pair_id, speaker_group, scenario, goal, sample_order, rater_id, preferred_sample, confidence, evidence_phrase, comment` in a private evaluation sheet. Keep raw recordings and personal identity out of a public repository. Split evaluation by speaker, not random clips from the same speaker. Report listener agreement, model/listener agreement, abstention rate and false improvement judgments, broken down by recording conditions. Compare pitch estimates against a trusted reference implementation before tuning thresholds. Do not turn this into a universal score or train on a user's audio without explicit permission.

## Demonstrations

New plans may supply exact emphasis and pause phrases. The same structured direction is used for coach and accepted personal voices; only matched text can be capitalized and only the app's pause tag can be inserted. Caller/model-authored tags are rejected. Directions participate in the cache key. Older plans remain compatible, using their original emotion direction. [ElevenLabs documents capitalization and pause tags](https://elevenlabs.io/blog/v3-audiotags), but audible compliance varies by voice; these are synthesis requests, not guaranteed demonstrations of the user's improvement.
