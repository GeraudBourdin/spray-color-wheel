# Spray Color Wheel

Static browser app for exploring graffiti spray palettes on an interactive color wheel, with real product matching across multiple manufacturers.

The app loads normalized spray catalogs, lets you define a base color in several ways, generates color-theory palettes, and maps every generated target to the closest real spray references in the selected brands.

## Highlights

- Static frontend app with no backend runtime.
- Current bundled catalog: 11 catalog ranges and 1,650 normalized colors.
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
- Montana BLUE: 82 colors
- Montana GOLD: 215 colors
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
- The closest match is immediately visible; alternatives from other brands expand independently.
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
- Open a larger image picker with zoom for precise sampling on desktop and mobile.
- Sample a color by clicking inside the image.
- Save sampled colors into a reusable image palette.
- Reuse any saved image-palette color as the active base.
- Reset the uploaded image and all saved sampled colors with dedicated reset buttons.
- On compact mobile layouts, sampling happens directly from the preview instead of the large modal.

### Cart And Export

- Add colors to the cart from the palette result area.
- Increase quantity per spray.
- Decrease quantity per spray.
- Empty the list in one action, with an undo option.
- Estimate the total with a persisted unit price.
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
- Restores the current base color and its origin when possible.
- Restores the spray picker search query.

### UI And UX

- French is the default UI language; existing language preferences are preserved.
- Responsive layout for desktop and mobile.
- Sticky desktop control panel.
- Mobile control drawer with open and close controls.
- Four persistent navigation destinations: Create (Harmonies / Tones), Image, Catalogs, and My List.
- A primary harmony selector, with multiple rules and advanced wheel settings available on demand.
- Modal closes with the Escape key.
- Mobile control drawer closes with the Escape key.
- Disabled states are applied to actions that are not currently available.
- Fatal loading screen explains when the app must be served over HTTP to load JSON files.

## Run Locally

Serve the project through a local HTTP server. The app loads JSON catalogs with `fetch`, so opening `index.html` directly from the filesystem is not enough.

### Docker Compose

With Docker running and Docker Compose installed, run these commands from the project directory containing `compose.yaml`:

```bash
docker compose up -d
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). The server is accessible only from this computer.

Compose uses Nginx to serve this project directory through a read-only mount. No image build or npm installation is needed to run the bundled site. File changes are available after refreshing the browser; rebuild `styles.css` as described below when editing `styles.src.css`.

To stop the server and remove its container:

```bash
docker compose down
```

If port 4173 is already in use, choose another local port:

```bash
COLORPALETTE_PORT=4174 docker compose up -d
```

Then open [http://127.0.0.1:4174](http://127.0.0.1:4174).

When using a Git worktree, the server serves the files beside that worktree's `compose.yaml`. Run the commands from the same directory to manage that server. To serve the main checkout instead, stop the worktree's server, bring `compose.yaml` into the main checkout, and run `docker compose up -d` there.

### Python Alternative

From the project directory:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:4173
```

Stop the Python server with `Ctrl+C`.

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

- `compose.yaml`: local Nginx server, bound to `127.0.0.1:4173` by default.
- `index.html`: Create, Image and My List views, selected through URL hashes.
- `workspace.css`: shared responsive design, loaded after compiled legacy styles.
- `workspace.js`: shared navigation, workspace labels, notifications and cart count.
- `manufacturer-catalog.html` / `.js`: searchable catalog and bulk reference lookup.
- `manufacturer-tones.html` / `.js`: three- or four-tone palettes with base-color handoff.
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


### Mur : superposer un sketch aux doodles

Ouvrez **Mur** dans la navigation (`wall.html`). Importez la photo du mur et votre sketch depuis les fichiers/la galerie, ou utilisez le bouton **Appareil photo** sur téléphone.

- **Placer** : glissez le sketch, ajustez sa taille et sa rotation, ou activez les quatre coins pour corriger la perspective. Les flèches du clavier permettent un placement précis (Maj augmente le pas).
- **Réglages** : opacité du sketch, fusion normale/produit/écran, contraste et luminosité pour chaque image.
- **Explorer · verrouiller** : déplacez et zoomez la vue sans modifier l’alignement. Pincez avec deux doigts ou utilisez la molette. En mode Placer, Espace + glisser ou le bouton central déplace aussi la vue. `+`, `−`, `0` et **Recentrer** contrôlent le zoom.
- Maintenez **Mur seul** pour voir les repères sans le sketch. **Annuler / Rétablir** et Ctrl/Cmd Z (Maj pour rétablir) couvrent les modifications.
- **Enregistrer sur cet appareil** conserve une session dans ce navigateur et remplace la précédente. **Reprendre** restaure les deux images et les réglages. La sauvegarde reste locale et disparaît si les données du navigateur sont effacées.
- **Exporter en PNG** produit la superposition entière sans les commandes ni les poignées. Les images sont ajustées à 2 560 pixels maximum sur leur plus grand côté ; l’export prend les dimensions de la photo du mur ainsi ajustée.

Les photos restent sur l’appareil. Les formats lisibles dépendent du navigateur ; en cas de format non pris en charge, utilisez un JPG, PNG ou WebP. Le plein écran natif dépend également du navigateur.

Tests géométriques : `node --test tests/wall-math.test.mjs`. Le scénario navigateur `tests/wall-browser.mjs` utilise Playwright (externe au projet), Chrome et un serveur local sur le port 4173 ; ses paramètres sont documentés en tête du fichier.

### Palette automatique depuis une image

Dans `index.html#image`, importez une image puis choisissez les gammes autorisées
et un maximum de 1 à 100 références avec les curseurs synchronisés en haut et dans la palette d’achat. L’analyse locale se relance automatiquement
à chaque changement. L’option de préservation des petites touches favorise les
accents colorés ; l’original et l’aperçu recoloré permettent de comparer le résultat.
La liste affiche marque, code et part de l’image pour chaque spray. L’ajout global
conserve les quantités existantes et ajoute une unité par référence absente.
Les proportions ne constituent pas une estimation des quantités de peinture.


### Traductions

Toutes les pages proposent le français, l’anglais, l’allemand, l’espagnol et le
portugais, y compris les outils Image et Mur, les résultats, les messages d’erreur,
les attributs d’accessibilité et la fiche imprimable. Le changement de langue
conserve le travail en cours. Les noms commerciaux et les références restent
ceux des fabricants.

Les textes complémentaires se trouvent dans `locales/additional.tsv` : une ligne
par message, cinq colonnes séparées par `|` (fr, en, de, es, pt). Après modification,
exécuter `node scripts/build-locales.mjs`. Les dictionnaires historiques restent
dans `i18n.js` et `workspace.js`. Vérification : `node --test tests/i18n.test.mjs`.
