# Color Palette Theory Wheel

App statique pour explorer des palettes de sprays sur une roue chromatique, avec correspondances dynamiques entre theories colorimetriques et references produit reelles.

## Lancer l'app

Depuis le dossier du projet :

```bash
python3 -m http.server 4173
```

Puis ouvrir :

```text
http://127.0.0.1:4173
```

## Ce que fait l'app

- Charge dynamiquement tous les fabricants declares dans `manufacturers/index.json`.
- Affiche les couleurs des fabricants sur une roue chromatique interactive.
- Permet d'activer un ou plusieurs fabricants.
- Calcule des harmonies : `complementary`, `split complementary`, `analogous`, `accented analogous`, `triadic`, `tetradic`, `square`, `double split complementary`.
- Calcule des variations : `monochromatic`, `hue shift`, `tint`, `shade`, `tone`.
- Associe chaque cible theorique a la meilleure correspondance reelle dans chaque fabricant actif.

## Structure des donnees

- `manufacturers/index.json` : manifest charge par l'app.
- `manufacturers/*.json` : catalogues uniformises consommes par le front.
- `grabbers/*.js` : scripts de collecte par fabricant.
- `grabbers/*.py` : extracteurs specialises, utiles pour les PDFs ou les formats moins propres.
- `grabbers/raw/*.json` : exports bruts recuperes via les grabbers.
- `grabbers/raw/pdfs/*.pdf` : sources PDF archivees quand l'extraction part d'une fiche produit.
- `grabbers/build-manufacturers.mjs` : pipeline de normalisation des catalogues actuels.

## Schema uniforme

Chaque fichier de `manufacturers/` suit cette structure :

```json
{
  "manufacturer": {
    "id": "slug-du-fabricant",
    "label": "Nom affiche",
    "accent": "#0F8F63",
    "series": "400ml"
  },
  "colors": [
    {
      "id": "identifiant-stable",
      "code": "reference",
      "name": "Nom",
      "label": "Reference Nom",
      "hex": "#RRGGBB",
      "finish": null,
      "opacity": null,
      "coverage": null,
      "lightfastness": null,
      "pigments": null,
      "aliases": [],
      "sourceLabel": "libelle source",
      "meta": {}
    }
  ]
}
```

## Regenerer les catalogues uniformises

Depuis le dossier du projet :

```bash
node grabbers/build-manufacturers.mjs
```

Ce script lit les sources brutes dans `grabbers/raw/` et ecrit :

- `manufacturers/index.json`
- `manufacturers/loop.json`
- `manufacturers/montana-black.json`
- `manufacturers/flame-orange.json`
- `manufacturers/flame-blue.json`
- `manufacturers/molotow-belton.json`
- `manufacturers/mtn-hardcore-2.json`
- `manufacturers/montana-94.json`
- `manufacturers/kobra-low-pressure-400ml.json`
- `manufacturers/kobra-high-pressure-400ml.json`

## Ajouter un autre fabricant

1. Ajouter ou adapter un grabber dans `grabbers/`.
2. Sauvegarder son export brut dans `grabbers/raw/slug.json`.
3. Ajouter sa normalisation dans `grabbers/build-manufacturers.mjs` ou dans un normaliseur dedie.
4. Generer `manufacturers/slug.json` et declarer le fabricant dans `manufacturers/index.json`.

Une fois le catalogue uniforme present dans `manufacturers/`, l'app le charge automatiquement sans modification supplementaire dans `app.js`.

## Extraction depuis un PDF

Pour les PDFs actuellement supportes, le flux est :

```bash
python3 grabbers/flame_orange_pdf_extractor.py
python3 grabbers/flame_orange_pdf_extractor.py --pdf grabbers/raw/pdfs/flame-blue-product-info.pdf --output grabbers/raw/flame-blue.json --code-prefix FB --source-url "https://brand.molotow.com/fileadmin/Dateien/PDF/Info_Sheets/Spray/Action/flame_blue.pdf"
python3 grabbers/molotow_belton_pdf_extractor.py
python3 grabbers/mtn_hardcore2_pdf_extractor.py
python3 grabbers/montana_94_pdf_extractor.py
python3 grabbers/kobra_pdf_extractor.py
node grabbers/build-manufacturers.mjs
```

Les extracteurs PDF recuperent les references, les noms et les numeros d'article, puis estiment les `hex` a partir des swatches des fiches produit. Ces `hex` sont donc des approximations visuelles, pas des valeurs officielles fournies par la marque.
