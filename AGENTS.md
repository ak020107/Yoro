# Voice coach foundation

Product scope: ../speech-coach-mvp-v2.md. Speaker lessons are optional. Preserve freeform advice, situations, delivery exploration, editable profile, and coach continuity. Branding is now approved for iterative implementation: lavender/onyx with the original Listener mascot. Follow UI_ROADMAP.md and preserve working features while delivering reviewable steps.

Use TypeScript and provider adapters. Keep keys server-side. Preview mode must be explicitly labeled and never invent acoustic feedback, provider usage, or improved scores. Typed responses cannot support acoustic judgments. Enforce session ownership and validate evidence before rendering it. Do not add accounts or social features without a product decision.

After meaningful changes run `pnpm typecheck`, `pnpm test`, and `pnpm build`. Test microphone functionality on real devices before claiming it works on iPhone. Maintain BUILD_STATUS.md and clearly distinguish implemented, preview-only, configured, and live-verified features.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

