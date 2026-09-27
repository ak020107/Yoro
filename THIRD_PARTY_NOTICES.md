# UI component attribution

Yoro adapts public Aceternity UI code by Manu Arora / Aceternity, retrieved 27 September 2026:

- Card Hover Effect: https://ui.aceternity.com/registry/card-hover-effect.json
  `components/ui/interaction.tsx` retains hovered-index tracking, AnimatePresence and shared-layout hoverBackground highlighting. Adapted anchors into accessible selection buttons with pressed state, keyboard focus, scoped LayoutGroup IDs and reduced motion. Tailwind utility styles translated into Yoro CSS.
- Animated Tabs: https://ui.aceternity.com/registry/tabs.json
  Shared-layout active background pattern adapted alongside the hover effect for survey choices. The decorative stacked-tab panels and reordering were omitted.

License: https://ui.aceternity.com/licence (accessed 27 September 2026). Allows modification and incorporation in end-product web apps. Do not redistribute these adaptations as a component library or template product. No paid Pro template code was used. Other transitions in Yoro are original Motion implementations, not claimed as copied Aceternity components.

Motion is installed as a runtime dependency. Its included package license remains in node_modules; package version is locked in pnpm-lock.yaml. Skiper, Originkit, Recent Design, Spline and Manus remain design references, not installed/copied code in this pass.
