# Yoro: product improvements and demo guide

## What changed

| Review problem | Concrete solution now in the app | Practical limit |
|---|---|---|
| Figure inspiration was only a prompt chip | Voices tab: Jobs, Oprah, Malala; nine challenges; rewrite your message; learn the wording choices; hear a coach example; record, retry and reflect | Small curated library; style inspiration, not a cloned voice |
| AI could over-reward the retry | Reversed, blind consistency check before definite improvement; exact duplicate files blocked | Model judgments still need a human benchmark |
| Everyone received the same Today lesson | Four goal-based practice families with three situations each; next situation after recorded retry and reflection | Uses the goals you explicitly shared; rule-based selection |
| Practice and companion felt disconnected | Saved takes resume; Today and My Voice lead back to practice; Yoro receives recent practice context | Same browser session, not a cross-device account |
| Successful takes could produce blank return feedback | Show change/strength/summary first, optional next correction second | Success is not automatically a higher score |
| Examples cost credits again after leaving a tab | Per-session audio caching; deliberate new-take option | First generation and new rewrites still depend on providers |
| Waiting and microphone permission were unclear | Animated pending feedback with elapsed time; drafts/recordings retained; repeated permission requests blocked | Replies are revealed after processing, not streamed |
| No next challenge after progress | Reflected Voices cycles offer the next technique with the original message carried forward; Today progresses to another situation | Completion records participation, not mastery |
| Speaker claims lacked sources | Linked primary transcripts with an explicitly editorial reading | Delivery cues are authored coaching suggestions |

## Try this in about three minutes

1. Open http://127.0.0.1:3000 and choose **Voices**.
2. Choose **Steve Jobs → One idea that lands**.
3. Enter: “I built a study group app. It helps students find classmates who are working on the same topic. I want to invite people to try it.”
4. Choose **Shape my words**. Notice the rewrite, explanation and exact wording changes.
5. Choose **Hear the coach demonstrate**. This is Yoro's demonstration voice, clearly labeled.
6. Choose **Practice in my voice**, record a short take, then get coaching.
7. Retry the same words with one deliberate change. Listen to both takes and reflect. A steady or inconclusive result is allowed.
8. Choose **Explore the next challenge**, or return to Today and continue the saved challenge. Refresh to verify continuity.

For a provider-independent starting point, use **Start with an example**. The exercise saves without a model request. Live listening feedback and synthesized audio still need provider access; no fake evaluation is substituted.

## What the live checks actually established

The live rewrite worked (~5.5 s). Speech generation worked (~2.8–3.1 s), and repeat requests served identical audio from cache in 29–50 ms locally. Initial transcription + coaching worked (~5.1 s). Tests uncovered order bias in comparisons, leading to the new consistency check. Afterward, identical audio was steady and the contradictory reversed pair was inconclusive. The full UI flow also passed with test fixtures and a fake microphone.

These are small integration/sanity checks. They do not establish reliable emotion detection across users. Real phone audio, a representative human listening benchmark, public deployment, and Backboard retrieval remain separate work. The local saved profile and conversation continuity are implemented.

## Source basis

- [Steve Jobs, Stanford 2005](https://news.stanford.edu/stories/2005/06/youve-got-find-love-jobs-says): editorial focus on stories, concrete details and takeaways.
- [Oprah Winfrey, Harvard 2013](https://news.harvard.edu/gazette/story/2013/05/winfreys-commencement-address/): editorial focus on personal experience, direct address and audience connection.
- [Malala Yousafzai, Nobel speech 2014](https://malala.org/news-and-voices/malala-nobel-speech): editorial focus on inclusive language, repeated structure and calls to action.

All practice scripts are original Yoro exercises. The sources are linked for exploration; they are not packaged as cloned speech or generated authentic quotations.
