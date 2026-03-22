# Spray Color Wheel

Static browser app for exploring graffiti spray palettes on an interactive color wheel, with real product matching across multiple manufacturers.

The app loads normalized spray catalogs, lets you define a base color in several ways, generates color-theory palettes, and maps every generated target to the closest real spray references in the selected brands.

## Highlights

- Static frontend app with no backend runtime.
- Current bundled catalog: 9 manufacturers and 1,330 normalized colors.
- 20 color rules across harmonies, variations, and Adobe/Photoshop-style extras.
- 5 UI languages: English, French, German, Spanish, Portuguese.
- Image sampling workflow with saved image palette and reset controls.
- Cart with quantity management and printable HTML export.

## Feature Inventory

### Catalog And Data

- Dynamically loads every catalog declared in `manufacturers/index.json`.
- Uses a shared normalized schema across all manufacturers.
- Computes HSL and LAB values for every color at load time.
- Detects near-neutral colors to prevent invalid chromatic rules from producing misleading results.
- Computes readable foreground text color for every swatch.
- Reconciles persisted cart entries against the currently loaded catalogs.
- Supports manufacturer-specific metadata such as source label, aliases, finish, opacity, coverage, lightfastness, and pigments.

### Current Bundled Manufacturers

- FLAME BLUE: 120 colors
- FLAME ORANGE: 135 colors
- Kobra High pressure 400ml: 100 colors
- Kobra Low pressure 400ml: 94 colors
- Loop: 218 colors
- Molotow Belton: 252 colors
- Montana 94: 145 colors
- Montana BLACK: 181 colors
- MTN Hardcore 2: 85 colors

### Base Color Input

- Interactive color wheel drag to set hue and saturation directly.
- Manual HEX input.
- Hue slider.
- Saturation slider.
- Lightness slider.
- Spray picker to set the base from a real catalog color.
- Image-picked colors can become the active base.
- Manual editing switches the app to a free custom base mode.
- The active base shows its source, whether it comes from a spray, the image palette, or a free custom value.

### Manufacturer Filtering

- Toggle manufacturers on and off individually.
- Use brand presets such as all brands or single-brand mode.
- The UI prevents disabling the last remaining manufacturer.
- All nearest-match calculations update instantly when the active brand set changes.

### Search And Selection

- Live search in the spray picker.
- Search matches name, code, display label, brand name, HEX, source label, and aliases.
- When no search is entered, the picker shows the closest colors to the current base.
- Picking a spray from the search results sets it as the new base color.

### Color Theory Engine

- Multiple algorithms can be active at the same time.
- All active algorithms are overlaid on the same wheel and rendered together.
- Rules that require a chromatic base are automatically blocked when the base is too neutral.
- Blocked rules stay visible with an explicit explanation instead of failing silently.
- Each active rule produces generated target colors with letters, labels, notes, and formulas.
- Result groups can be expanded or collapsed independently.
- Theory chips include help tooltips with principle, construction, and graffiti-oriented usage notes.
- Inline theory references inside tooltips can activate related rules directly.

### Theory Set

#### Harmonies

- Complementary
- Split complementary
- Analogous
- Accented analogous
- Triadic
- Tetradic
- Square
- Double split complementary

#### Variations

- Monochromatic
- Hue shift
- Tint
- Shade
- Tone

#### Adobe / Photoshop-style Extras

- Compound
- Shades
- Pentagram
- Warm / cool
- Vivid / muted
- Tints / shades
- Custom

### Palette And Matching Output

- Renders a cloud of active manufacturer colors on the wheel.
- Draws connectors from the base to every generated target.
- Shows lettered handles for the base and generated stops.
- Displays a base reference card when one or more algorithms are active.
- Builds grouped result blocks per active rule.
- Finds the closest real spray match for every generated target in every active manufacturer.
- Shows a numeric match score for each real-color match.
- Lets you add matched sprays to the cart directly from the result cards.
- Shows HEX tooltips for generated colors and matched spray colors.
- Tracks which matched colors are already in the cart and displays their quantities.

### Image Workflow

- Upload a local image file.
- Display the image in a compact preview area.
- Open a larger image picker modal for more precise sampling on larger screens.
- Sample a color by clicking inside the image.
- Save sampled colors into a reusable image palette.
- Reuse any saved image-palette color as the active base.
- Reset the uploaded image and all saved sampled colors with dedicated reset buttons.
- On compact mobile layouts, sampling happens directly from the preview instead of the large modal.

### Cart And Export

- Add colors to the cart from the palette result area.
- Increase quantity per spray.
- Decrease quantity per spray.
- Empty the cart in one action.
- Show live cart totals for references, sprays, and manufacturers.
- Export the cart as a printable HTML sheet.
- Printable export includes swatches, color names, brand names, optional product codes, quantities, totals, and generation date.
- Export dates are localized to the current UI language.

### Persistence

- Persists the selected UI language in `localStorage`.
- Persists the cart separately in `localStorage`.
- Persists the broader working session in `localStorage`.
- Restores selected manufacturers.
- Restores active algorithms.
- Restores the uploaded image.
- Restores the sampled image color and saved image palette.
- Restores the active sidebar tab.
- Restores expanded result groups.
- Restores the current base color and its origin when possible.
- Restores the spray picker search query.

### UI And UX

- English is the default UI language.
- Responsive layout for desktop and mobile.
- Sticky desktop control panel.
- Mobile control drawer with open and close controls.
- Sidebar tabs for image upload, image palette, cart, and base-color controls.
- Accordion sections for language, algorithms, manufacturers, and spray picker.
- Modal closes with the Escape key.
- Mobile control drawer closes with the Escape key.
- Disabled states are applied to actions that are not currently available.
- Fatal loading screen explains when the app must be served over HTTP to load JSON files.

## Run Locally

Serve the project through a local HTTP server. The app loads JSON catalogs with `fetch`, so opening `index.html` directly from the filesystem is not enough.

```bash
python3 -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173
```

## Development

Install dependencies:

```bash
npm install
```

Build the compiled stylesheet:

```bash
npm run build:css
```

Watch the stylesheet during UI work:

```bash
npm run watch:css
```

## Project Structure

- `index.html`: static app shell.
- `app.js`: application state, rendering, interactions, image workflow, cart, and export logic.
- `i18n.js`: UI strings, localized theory labels, and text generation helpers.
- `theories.js`: rule definitions and target generation logic.
- `color-utils.js`: color conversion and matching helpers.
- `styles.src.css`: Tailwind source stylesheet.
- `styles.css`: compiled stylesheet served by the app.
- `manufacturers/index.json`: manifest consumed by the frontend.
- `manufacturers/*.json`: normalized manufacturer catalogs.
- `grabbers/*.js`: scraping and extraction scripts.
- `grabbers/*.py`: PDF extractors and specialized catalog parsers.
- `grabbers/raw/*.json`: raw extracted source data.
- `grabbers/raw/pdfs/*.pdf`: archived PDF sources used by some extractors.
- `grabbers/build-manufacturers.mjs`: normalization pipeline for bundled catalogs.

## Normalized Catalog Schema

Each file in `manufacturers/` follows this structure:

```json
{
  "manufacturer": {
    "id": "manufacturer-slug",
    "label": "Display name",
    "accent": "#0F8F63",
    "series": "400ml"
  },
  "colors": [
    {
      "id": "stable-id",
      "code": "reference",
      "name": "Name",
      "label": "Reference Name",
      "hex": "#RRGGBB",
      "finish": null,
      "opacity": null,
      "coverage": null,
      "lightfastness": null,
      "pigments": null,
      "aliases": [],
      "sourceLabel": "source label",
      "meta": {}
    }
  ]
}
```

## Regenerate The Normalized Catalogs

From the project directory:

```bash
node grabbers/build-manufacturers.mjs
```

This reads the raw sources in `grabbers/raw/` and rebuilds the normalized files in `manufacturers/`.

## Add Another Manufacturer

1. Add or adapt a grabber in `grabbers/`.
2. Save the raw output in `grabbers/raw/slug.json`.
3. Add the normalization step in `grabbers/build-manufacturers.mjs` or in a dedicated normalizer.
4. Generate `manufacturers/slug.json`.
5. Register the new manufacturer in `manufacturers/index.json`.

Once a normalized catalog exists in `manufacturers/`, the app can load it without additional changes in `app.js`.

## PDF Extraction Notes

Current PDF-based extraction flows include scripts such as:

```bash
python3 grabbers/flame_orange_pdf_extractor.py
python3 grabbers/molotow_belton_pdf_extractor.py
python3 grabbers/mtn_hardcore2_pdf_extractor.py
python3 grabbers/montana_94_pdf_extractor.py
python3 grabbers/kobra_pdf_extractor.py
node grabbers/build-manufacturers.mjs
```

These extractors recover references, names, and product numbers, then estimate `hex` values from printed or embedded swatches in product sheets.

## Important Note About Color Accuracy

- PDF-derived `hex` values are visual estimates.
- They are useful for relative palette exploration and nearest-match workflows.
- They should not be treated as official manufacturer-provided digital color values.
