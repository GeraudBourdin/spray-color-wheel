# Codex Context

## Purpose
This project is a static, DOM‑based color tool for graffiti artists: it loads normalized catalogs, lets you define a base color manually, from a real spray, or from an image, runs multiple color theory algorithms, and surfaces the closest real spray matches per manufacturer along with cart/export workflows. This document is your starting point for future Codex work—update it when you discover new constraints or pivots so subsequent turns can stay grounded in the same shared overview.

## Runtime Breakdown
* `index.html` renders the entire control panel, wheel surface (canvas + SVG), hash-routed Create / Image / My List views, and theory result panes. No bundler is involved: `styles.css` and `app.js` are referenced directly.
* `styles.src.css` is the Tailwind source; `styles.css` is the compiled output that must be regenerated via `npm run build:css` (or `watch:css` when iterating) because the repository ships the prebuilt CSS.
* `app.js` is the single controller. It maintains the full `state` object (base color, selected brands/theories, cart items, image sampling data, UI toggles, persisted storage keys like `spray-color-wheel.cart`, `.language`, and `.state`), wires DOM refs, fetches catalogs, renders the wheel, handles theory toggles, image palette interaction, cart UI and printable export, and writes to `localStorage`.
* `manufacturer-catalog.html` + `manufacturer-catalog.js` form a second static workflow focused on one manufacturer at a time: grouped catalog browsing, bulk line-by-line search, fallback substitutions from other brands, and cart syncing against the same `spray-color-wheel.cart` storage used by the main app.
* `color-utils.js` exposes conversions (RGB ↔ HEX/HSL/Lab/LCH), delta‑E matching, `getContrastingText`, and helpers used by both `app.js` and `theories.js`.
* `theories.js` defines the `THEORIES` list, section metadata, human-readable tooltips, and target generation helpers (mixing, monochrome, saturation, absolute HSL). `app.js` queries it to build overlays and generated result cards.
* `i18n.js` holds supported language metadata, localized strings, derived helpers (`getLocalizedTheory`, `t`, etc.), and ensures five languages (en/fr/de/es/pt) can be swapped with localized copy for UI, cart export, tooltips, and notices.

## Data Flow
* `manufacturers/index.json` is the manifest fetched first; it lists the eleven normalized catalogs (1,650 colors) currently bundled (`loop`, `montana-black`, `montana-blue`, `montana-gold`, `flame-orange`, `flame-blue`, `molotow-belton`, `mtn-hardcore-2`, `montana-94`, `kobra-low-pressure-400ml`, `kobra-high-pressure-400ml`).
* Each `manufacturers/*.json` file follows the documented schema (`manufacturer` metadata + `colors` array with detail fields). The UI loads every color, computes HSL/LAB, and then scatters them on the wheel, also computing match scores when theories produce targets.
* Add new manufacturers by creating a grabber (JS/Python in `grabbers/`), emitting raw data under `grabbers/raw/slug.json`, and rerunning `node grabbers/build-manufacturers.mjs` to regenerate the normalized catalogs and manifest.
* `grabbers/raw/pdfs/` stores the source PDFs referenced by specialized extractors (Flame, Kobra, Molotow, Montana, Hardcore). The `.py` scripts in `grabbers/` read those PDFs, while several `.js` grabbers parse vendor JSON or other inputs before normalization.

## Key Features to Keep in Mind
* **Color theory overlay**: Rules are grouped (harmonies, variations, Adobe extras). Each theory draws connectors from the base color on the wheel, displays blocker messaging when the base is too neutral, and exposes tooltip explanations with references.
* **Base color inputs**: wheel drag, HEX entry, hue/saturation/lightness sliders, spray picker search (matches name/code/alias/brand/HEX), and image picker. Manual edits flip the state into “custom base”.
* **Image workflow**: Upload an image, sample inline on all viewports or use the zoom modal, stash samples in the inline palette, reuse them as base, and reset image/palette when needed.
* **Image-based spray recommendations**: Automatic extraction now builds a purchase palette with a configurable reference limit and selected brands (see Automatic image palette below). Manual sampling remains available: a clicked pixel becomes the base and shows nearest sprays; saved samples can be reused. The Image view suppresses harmony targets to keep the sampled color in focus.
* **Manufacturer filters & cart**: Toggle brands/presets, prevent disabling all manufacturers, and update nearest-match calculations instantly. Cart supports quantity +/- per spray, empty action, and printable HTML export with localized generation date.
* **Persistence**: The main app stores state in `localStorage` under `spray-color-wheel.language`, `spray-color-wheel.cart`, `spray-color-wheel.cart-unit-price`, and `spray-color-wheel.state`. The manufacturer catalog page also persists `spray-color-wheel.catalog-manufacturer`, `spray-color-wheel.catalog-view-mode`, `spray-color-wheel.catalog-group-filter`, and `spray-color-wheel.catalog-auto-add-search`.

## Development Workflow
1. Install tooling with `npm install`.
2. Build or watch the CSS with `npm run build:css` / `npm run watch:css`.
3. Serve the folder: `python3 -m http.server 4173`, then visit `http://127.0.0.1:4173`. The app requires an HTTP server because it fetches JSON catalogs.
4. To rebuild manufacturer data, run `node grabbers/build-manufacturers.mjs` after updating `grabbers/raw/`. Each grabber script has bespoke logic; inspect it before modifying.

## Side Notes for Codex
* When editing UI or logic, update this file if you uncover new persisted keys, new manifest requirements, additional dependencies, or big architectural shifts.
* Refer to `CODEX_CONTEXT.md` whenever a future task asks for project understanding; this is the canonical snapshot for Codex-style collaboration.
* Keep in mind the project has no bundler, uses plain vanilla JS, and couples DOM wiring tightly to `app.js`. Breaking changes to selectors or DOM structure usually require mirroring updates across `app.js` and `index.html`.

## Quick References
* Tailwind CLI is the only build step; there is no build for JS.
* Cart export relies on `cart-download` and `cart-copy` triggers inside `app.js`.
* Language switch ties back to `SUPPORTED_LANGUAGES` and `DEFAULT_LANGUAGE` in `i18n.js`.
* Wheel constants (radius, resolution, snap distance) and `LETTERS` are declared at the top of `app.js`—adjustments here ripple across the wheel rendering logic.

## Validated UX redesign (2026-09-13)
* Common navigation: Create (Harmonies / Tones), Image, Catalogs, My List. `workspace.js` and `workspace.css` are shared by all three HTML documents.
* `#create`, `#image` and `#list` select main-app views; catalog and tones remain separate documents. `?base=<color-id>` transfers a catalog reference; tones also accepts `?hex=<hex>`.
* Desktop shows compact controls, a palette overview, wheel and best spray matches. Other brands expand in native details. Mobile uses bottom navigation and a controls dialog with focus trapping and inert background.
* Catalog defaults to a single swatch grid, adds a live search field and explicit selected-row addition for bulk search. Existing automatic addition remains under advanced options.
* List supports an undo after clearing, quantities, unit-price estimate and existing printable HTML download.
* French is the default for new sessions. The visible header language chooser uses five direct buttons and forwards changes to the existing hidden select handlers. Existing translations remain in i18n.js; workspace.js has workspace copy for all five languages. Catalog and tones now use the supplementary translation catalog for all page copy.
* The old hidden header controls keep IDs needed by tightly coupled legacy renderers. Do not delete them without updating those renderers.

* Visual identity: ivory canvas, ink palette overview and citron primary actions in the final section of workspace.css. Product swatches are unchanged; color-utils.getContrastingText now selects black/white by the higher luminance contrast. Asset URLs are versioned to prevent mixing old scripts and new HTML during refresh.

## Wall / doodle overlay editor (2026-09-13)
* `wall.html`, `wall.css`, `wall.js` and `wall-math.js` provide the new Mur navigation destination; shared mobile navigation now has five columns.
* Two local image inputs (gallery/files and `capture="environment"`) normalize images to at most 2,560 px on the longest edge. No photos are uploaded. Unsupported browser image formats produce a recoverable message.
* The wall defines export coordinates. The sketch is a convex four-corner quadrilateral with projective mapping. WebGL renders the perspective exactly; a subdivided Canvas 2D fallback supports devices without WebGL. Brightness, contrast, opacity and normal/multiply/screen fusion are independent from viewport zoom/pan.
* Place mode changes sketch geometry; Explore mode locks alignment. Pointer Events support mouse drag, touch pinch, corner handles and held Space/middle-button panning. Keyboard arrows, +/− and 0 are available on the canvas.
* Undo/redo retains up to 24 snapshots. Explicit local save atomically replaces one IndexedDB record (`spray-color-wheel.wall`, store `projects`, key `current`). Loading a saved session is undoable. Clearing browser data deletes the saved session. View recentered on restore for the current screen size.
* PNG exports use the full normalized wall dimensions and omit editing handles, viewport transforms and held wall-only preview. The editor and its status messages follow the shared language setting.
* Tests: `node --test tests/wall-math.test.mjs`. Browser regression: `PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node tests/wall-browser.mjs` with a local server on port 4173. Override `WALL_TEST_URL`, `CHROME_PATH` and `WALL_TEST_ARTIFACTS` when needed. No new runtime dependency or build step.

## Automatic image palette (2026-09-13)
* `image-tool.js` mounts Image controls and results, refreshed from `app.js` with the shared brand filters. Import/restoration and changes to brands, 1–100 reference limit or accent preservation automatically restart a module Worker; obsolete jobs are terminated.
* `image-analysis.js` groups a bounded 480px image into a 4-bit RGB histogram, clusters in Lab with optional accent weighting, matches centers to actual allowed catalog references, merges duplicates, drops contributions below 0.1% to reduce edge noise, then reassigns pixels to the retained sprays. Transparent pixels are excluded and partial alpha weights coverage.
* Original/recolored previews, reference codes, image coverage and approximate-match notices appear in `#image-auto-results`. Local processing only. The new controls and worker error messages support all five languages. Budget/accent settings are session-only; existing shared brands/image persistence is unchanged.
* Bulk list addition adds one unit only for missing reference IDs. Coverage is not a can quantity estimate. `image-tool.css` is directly loaded without a build step.
* Tests: `node --test tests/image-analysis.test.mjs`; `PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node tests/image-browser.mjs` uses http://localhost.


## Exhaustive localization (2026-09-13)
* All six views (Create, Image, My List, Catalog, Tones, Wall) support fr/en/de/es/pt, including static labels, accessibility attributes, dynamic results, notices and print export. Product names, references and user filenames remain unchanged; finish metadata has explicit display translations.
* `localization.js` provides `tr(source, params)`, localized counts/finishes, and targeted `data-l10n` / `data-l10n-attrs` rendering. It only processes marked DOM; no global text replacement or MutationObserver. Static markers are retired when a controller replaces their text, preventing stale placeholders from overwriting live results.
* `locales/additional.tsv` is the editable five-column source (French, English, German, Spanish, Portuguese). Use literal `\n` for newlines. `node scripts/build-locales.mjs` merges it with complete entries from `i18n.js` and `workspace.js` into `locales/messages.js`. No package or browser dependency added.
* `workspace.js` dispatches `languagechange` when the language changes; catalog/tones redraw current state, Wall refreshes labels, and Image refreshes localized analysis output. Transient notices are explicitly relocalized; input values, cart contents and wall geometry are retained.
* Regression checks: `node --test tests/i18n.test.mjs tests/image-analysis.test.mjs tests/wall-math.test.mjs`. Browser: `PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node tests/i18n-browser.mjs`, localhost by default (`I18N_TEST_URL` override). Covers five-language switching across all views, dynamic states, mobile overflow, exports and untranslated UI detection.

## Shared neutral controls (2026-09-13)
* `controls.css` is loaded last in all four HTML documents and owns the shared UI colors for buttons, menus, selected/hover/copied states, checkboxes, sliders and focus outlines. Primary actions use charcoal (#252826) with white text; secondary surfaces are neutral gray/white. The dark wall canvas uses an inverse white import button.
* Keep page-specific layout in workspace.css / wall.css / image-tool.css, but use the shared `--ui-*` tokens for new controls. No product swatch backgrounds or image pixels are targeted by the shared control rules.

* The Image reference budget has two synchronized range inputs (`auto-limit` and `auto-palette-limit`), 1–100, default 12. Input events update both controls and outputs immediately; analysis starts after 140 ms without input. Results remain visible while recalculating, with `aria-busy` and disabled list addition, and obsolete worker messages are ignored. The actual palette may contain fewer references than the chosen maximum.

## Preview spray inspector (2026-09-13)
* `preview-inspector.js` identifies the exact quantized spray under the rendered preview pointer. It maps retained RGBA pixels to palette references and accounts for centered `object-fit: contain` letterboxing; fully transparent pixels have no reference.
* Hover shows a transient card; click/tap pins a nonmodal card with a close button. Escape closes it and returns focus to the preview. The focusable preview also opens a card with Enter/Space. Pinned cards follow the sampled image point on scroll/resize and fit the viewport.
* Reanalysis, image clearing and route changes clear the card, preventing obsolete spray references. UI text is included in all five locales; card colors use the shared neutral controls.
* Browser regression: `PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node tests/preview-inspector-browser.mjs` against localhost.

## Preview region selection (2026-09-13)
* The preview inspector now accepts click/tap for a pixel and pointer drag for an inclusive rectangular region. Pointer capture supports reverse drags, release outside the image, and touch; the preview uses touch-action:none while the rest of the page remains scrollable.
* `preview-selection.js` clips rectangle bounds, counts distinct catalog references in the quantized bitmap and calculates alpha-weighted shares within the selected area. Fully transparent pixels are omitted. The pinned region card lists references and can add them through the existing deduplicating cart callback.
* A persistent outlined rectangle follows scroll/resize. Closing the card, Escape, pointer cancellation, changing image/palette or changing route clears the selection. New text is localized in all five languages.
* Tests: `node --test tests/preview-selection.test.mjs`; browser `tests/preview-region-browser.mjs` plus the existing pixel-inspector regression.

## Graffiti typography preview (2026-09-14)
* Create now has a collapsible `graffiti-preview.js` panel below the proposed palette. `app.js` supplies the same displayed hex colors as the overview swatches. Face/side color assignments track palette positions as harmonies change.
* The editable name (up to 24 characters), three-font selector (Knewave, Sedgwick Ave Display, Lacquer), depth, X/Y rotations and directional-light controls remain intact across font changes and view navigation. These settings are session-only. Blank and unsupported text, load failures and unavailable WebGL have localized feedback.
* `graffiti-scene.js` and Three.js load only when expanded. Fonts are cached on first use; async revision checks discard stale selections. Rendering is on demand and resize; replaced geometries are disposed. Orthographic framing follows the full rotated text bounds.
* Three.js 0.180.0 is pinned in npm and served from `vendor/three` without a JS build step. `scripts/sync-graffiti-assets.mjs` copies the runtime modules and converts the locally included OFL TTFs into Three.js typeface JSON. Source and license details: `assets/fonts/README.md`.
* `graffiti-preview.css` supplies responsive layout. New text uses the existing five-language catalog. Browser coverage: `PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node tests/graffiti-browser.mjs` against localhost (override `GRAFFITI_TEST_URL`).
* Direct 3D manipulation: the preview toolbar selects Lettering or Light. Pointer/touch drags rotate/tilt text or orbit the directional light, and the projected sun handle directly follows pointer movement on its hemisphere (dashed when behind the text). Sliders, outputs and the light marker stay synchronized. Arrow keys adjust the focused canvas/handle, Shift uses larger steps; Escape and pointer cancellation restore the start of a gesture. Pointer capture, blur and route/collapse cleanup prevent stuck gestures. Browser regression: `tests/graffiti-interaction-browser.mjs` covers mouse, actual touch, keyboard, cancellation and slider sync.
* Front-face fill now supports solid color or a two-color gradient from the current palette, with a 0–360° angle (0° left to right, 90° top to bottom). Gradient settings survive font and route changes. The gradient is continuous over the whole word in local coordinates; linear-space vertex colors affect only the front/cap material, leaving the extrusion material independent. Colors are rebuilt only when geometry or gradient settings change. Regression: `tests/graffiti-gradient-browser.mjs` verifies rendered color changes, side preservation, angle, font switches and solid restoration.
