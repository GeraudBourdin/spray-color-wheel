# Fonts for the graffiti preview

Bundled locally from the Google Fonts repository (retrieved 2026-09-14):

- **Knewave** — Tyler Finck: https://github.com/google/fonts/tree/main/ofl/knewave
- **Sedgwick Ave Display** — Pedro Vergani and Kevin Burke: https://github.com/google/fonts/tree/main/ofl/sedgwickavedisplay
- **Lacquer** — Niki Polyocan and Eli Block: https://github.com/google/fonts/tree/main/ofl/lacquer

Each directory includes the original TTF and SIL Open Font License. The `typeface.json` is a format conversion generated with Three.js TTFLoader; it supplies outlines to the 3D preview. No external font service is contacted at runtime.

Run `node scripts/sync-graffiti-assets.mjs` after `npm install` to refresh fonts and the pinned Three.js distribution in `vendor/three`. This script requires network access; normal use of the site does not. Three.js is MIT licensed; its license is shipped in `vendor/three/LICENSE`.
