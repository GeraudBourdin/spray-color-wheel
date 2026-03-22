import {
  clamp,
  hexToHsl,
  hslToHex,
  mixHex,
  normalizeHue,
} from "./color-utils.js";

function targetFromAbsoluteHsl(label, hsl, note, kind = "hue") {
  const next = {
    h: normalizeHue(hsl.h),
    s: clamp(hsl.s, 0, 1),
    l: clamp(hsl.l, 0.05, 0.95),
  };

  return {
    label,
    note,
    kind,
    hex: hslToHex(next.h, next.s, next.l),
    hsl: next,
  };
}

function targetFromHsl(baseColor, label, deltaHue, note) {
  const saturationFloor = baseColor.s < 0.12 ? 0.12 : baseColor.s;

  return targetFromAbsoluteHsl(
    label,
    {
      h: baseColor.h + deltaHue,
      s: clamp(saturationFloor, 0.12, 1),
      l: clamp(baseColor.l, 0.12, 0.88),
    },
    note,
    "hue",
  );
}

function targetFromMix(baseHex, label, mixHexValue, amount, note, kind) {
  const hex = mixHex(baseHex, mixHexValue, amount);

  return {
    label,
    note,
    kind,
    hex,
    hsl: hexToHsl(hex),
  };
}

function targetFromMonochrome(baseColor, label, lightnessShift, saturationFactor, note) {
  return targetFromAbsoluteHsl(
    label,
    {
      h: baseColor.h,
      s: clamp(baseColor.s * saturationFactor, 0, 1),
      l: clamp(baseColor.l + lightnessShift, 0.05, 0.95),
    },
    note,
    "monochrome",
  );
}

function targetFromSaturation(baseColor, label, saturationShift, lightnessShift, note) {
  return targetFromAbsoluteHsl(
    label,
    {
      h: baseColor.h,
      s: clamp(baseColor.s + saturationShift, 0, 1),
      l: clamp(baseColor.l + lightnessShift, 0.05, 0.95),
    },
    note,
    "saturation",
  );
}

export const THEORY_SECTIONS = [
  { id: "core-harmonies", label: "Harmonies" },
  { id: "core-variations", label: "Variations" },
  { id: "adobe-extras", label: "Adobe / Photoshop" },
];

const THEORY_REFERENCES = {
  combinations: {
    label: "Adobe - Understanding color combinations",
    url: "https://helpx.adobe.com/ph_fil/illustrator/how-to/experiment-with-color-combinations-hybrid.html",
  },
  hsb: {
    label: "Adobe - Hue, saturation, brightness",
    url: "https://helpx.adobe.com/photoshop-elements/using/color.html",
  },
  tintShadeTone: {
    label: "Tint, shade and tone",
    url: "https://en.wikipedia.org/wiki/Tint%2C_shade_and_tone",
  },
};

const THEORY_TOOLTIPS = {
  complementary: {
    summary: "Deux couleurs opposees sur la roue pour obtenir un contraste fort et immediat.",
    construction: "Base + couleur a 180 deg. Dans l'app, on garde la meme saturation utile et une luminosite proche de la base.",
    usage: "Sers-t'en pour un duo sujet/fond, un outline qui claque, ou une palette a une couleur dominante et un accent.",
    reference: THEORY_REFERENCES.combinations,
  },
  "split-complementary": {
    summary: "Une base contrastee, mais plus souple qu'un vrai complementaire.",
    construction: "Base + deux voisines du complement, ici +150 deg et +210 deg.",
    usage: "Utile quand le complementaire pur est trop violent et que tu veux garder de la tension sans casser l'equilibre.",
    reference: THEORY_REFERENCES.combinations,
  },
  analogous: {
    summary: "Une famille de couleurs voisines, donc tres coherente visuellement.",
    construction: "Base + voisins proches sur la roue, ici -30 deg et +30 deg.",
    usage: "Parfait pour des transitions, des degradations, des paysages, des lettrages fluides ou une ambiance homogene.",
    reference: THEORY_REFERENCES.combinations,
  },
  "accented-analogous": {
    summary: "Une base analogique a laquelle on ajoute un contrepoint plus contraste.",
    construction: "Analogues autour de la base, puis un accent oppose a +180 deg.",
    usage: "A utiliser quand tu veux une palette stable pour la masse, avec une seule couleur qui attire l'oeil.",
    reference: THEORY_REFERENCES.combinations,
  },
  triadic: {
    summary: "Trois points equidistants qui donnent une palette vive et bien repartie.",
    construction: "Base + deux points a +120 deg et +240 deg.",
    usage: "Pratique pour une palette energique a trois roles: dominante, secondaire, accent.",
    reference: THEORY_REFERENCES.combinations,
  },
  tetradic: {
    summary: "Une palette a quatre points basee sur un rectangle chromatique.",
    construction: "Base + 3 points a +60 deg, +180 deg et +240 deg.",
    usage: "Bien pour des systemes riches, mais il faut choisir une couleur principale et laisser les autres en soutien.",
    reference: THEORY_REFERENCES.combinations,
  },
  square: {
    summary: "Quatre couleurs a distance egale pour une palette tres tendue mais reguliere.",
    construction: "Base + 3 points a +90 deg, +180 deg et +270 deg.",
    usage: "A reserver aux palettes graphiques ou tres pop. Garde une hierarchie claire, sinon tout crie en meme temps.",
    reference: THEORY_REFERENCES.combinations,
  },
  "double-split-complementary": {
    summary: "Une palette large qui combine voisins de la base et voisins de son opposee.",
    construction: "Base + -30 deg, +30 deg, +150 deg et +210 deg.",
    usage: "Utile pour generer beaucoup de matiere chromatique tout en gardant une logique d'ensemble.",
    reference: THEORY_REFERENCES.combinations,
  },
  monochromatic: {
    summary: "Une seule teinte de base, avec plusieurs niveaux de densite et de lumiere.",
    construction: "La teinte reste fixe; on fait varier surtout la luminosite et un peu la saturation.",
    usage: "Ideal pour creer profondeur, volume, plans et nuances sans changer de famille chromatique.",
    reference: THEORY_REFERENCES.combinations,
  },
  "hue-shift": {
    summary: "Une exploration autour de la teinte de base sans changer brutalement le reste.",
    construction: "On decale la teinte a -40, -20, +20 et +40 deg en gardant une structure HSL proche.",
    usage: "Pratique pour chercher rapidement une variante plus chaude ou plus froide autour d'une couleur deja validee.",
    reference: THEORY_REFERENCES.hsb,
  },
  tint: {
    summary: "Une version eclaircie de la couleur en la rapprochant du blanc.",
    construction: "On melange la base avec du blanc a 20%, 40% et 60%.",
    usage: "Sert pour les highlights, les lumieres, les pastels et pour ouvrir une palette sans changer de teinte.",
    reference: THEORY_REFERENCES.tintShadeTone,
  },
  shade: {
    summary: "Une version assombrie de la couleur en la rapprochant du noir.",
    construction: "On melange la base avec du noir a 20%, 40% et 60%.",
    usage: "Sert pour les ombres, les profondeurs, les volumes et les variantes plus lourdes d'une meme couleur.",
    reference: THEORY_REFERENCES.tintShadeTone,
  },
  tone: {
    summary: "Une version rabattue de la couleur, moins pure et plus neutre.",
    construction: "On melange la base avec un gris moyen a 20%, 40% et 60%.",
    usage: "Tres utile pour calmer une palette trop flashy, fabriquer des fonds, ou rapprocher une couleur d'un rendu plus sale ou plus urbain.",
    reference: THEORY_REFERENCES.tintShadeTone,
  },
  compound: {
    summary: "Une regle hybride proche des outils Adobe, entre analogique et complementaire.",
    construction: "Base + un voisin analogue + le complement + un voisin du complement.",
    usage: "Bien quand tu veux une palette vivante mais plus subtile qu'un simple duo complementaire.",
    reference: THEORY_REFERENCES.combinations,
  },
  shades: {
    summary: "Une lecture 'valeur' d'une meme teinte, inspiree des variantes Adobe.",
    construction: "La teinte reste la meme, et on pousse surtout la luminosite vers le clair et le sombre.",
    usage: "A utiliser quand tu veux construire une echelle de lecture, du contraste de volume ou un camaieu fonctionnel.",
    reference: THEORY_REFERENCES.tintShadeTone,
  },
  pentagram: {
    summary: "Cinq points regulierement repartis pour une palette tres large.",
    construction: "Base + quatre points a intervalles de 72 deg.",
    usage: "Utile pour generer rapidement beaucoup d'options, mais il faut ensuite simplifier et choisir une dominante claire.",
    reference: THEORY_REFERENCES.combinations,
  },
  "warm-cool": {
    summary: "Un basculement fin de la couleur vers des sensations plus chaudes ou plus froides.",
    construction: "On decale legerement la teinte autour de la base: -28, -14, +14 et +28 deg.",
    usage: "Pratique pour regler l'ambiance d'une palette sans changer completement de couleur.",
    reference: THEORY_REFERENCES.hsb,
  },
  "vivid-muted": {
    summary: "Une variation d'intensite chromatique sans changer radicalement la teinte.",
    construction: "On baisse ou on renforce la saturation autour de la base, avec une petite compensation de luminosite.",
    usage: "Tres utile pour passer d'un rendu pop a un rendu plus poussiereux, sale ou discret.",
    reference: THEORY_REFERENCES.hsb,
  },
  "tints-shades": {
    summary: "Une rampe mixte qui ouvre et densifie la couleur dans les deux sens.",
    construction: "Deux versions plus sombres via noir, puis deux versions plus claires via blanc.",
    usage: "A utiliser pour creer rapidement une petite gamme de travail autour d'une seule couleur.",
    reference: THEORY_REFERENCES.tintShadeTone,
  },
  custom: {
    summary: "Aucune geometrie imposee: tu restes sur la couleur de base et tu ajustes librement.",
    construction: "L'algorithme ne genere pas de points derives; seule la base est active.",
    usage: "Pratique si tu veux partir d'une teinte de spray precise avant d'activer une harmonie, ou travailler en mode manuel.",
    reference: THEORY_REFERENCES.hsb,
  },
};

export const THEORIES = [
  {
    id: "complementary",
    section: "core-harmonies",
    label: "Complementaire",
    formula: "0 / +180",
    description:
      "Deux points opposes sur la roue. C'est le contraste le plus direct et le plus energique.",
    tooltip: THEORY_TOOLTIPS.complementary,
    requiresChromatic: true,
    generate(baseColor) {
      return [targetFromHsl(baseColor, "Complementaire", 180, "+180 deg")];
    },
  },
  {
    id: "split-complementary",
    section: "core-harmonies",
    label: "Complementaire scindee",
    formula: "0 / +150 / +210",
    description:
      "La tension du complementaire, mais ecartee en deux voisins pour garder plus de souplesse.",
    tooltip: THEORY_TOOLTIPS["split-complementary"],
    requiresChromatic: true,
    generate(baseColor) {
      return [
        targetFromHsl(baseColor, "Split gauche", 150, "+150 deg"),
        targetFromHsl(baseColor, "Split droite", 210, "+210 deg"),
      ];
    },
  },
  {
    id: "analogous",
    section: "core-harmonies",
    label: "Analogues",
    formula: "0 / -30 / +30",
    description:
      "Deux voisines proches de la couleur de base. Une harmonie fluide, utile pour des transitions.",
    tooltip: THEORY_TOOLTIPS.analogous,
    requiresChromatic: true,
    generate(baseColor) {
      return [
        targetFromHsl(baseColor, "Voisine froide", -30, "-30 deg"),
        targetFromHsl(baseColor, "Voisine chaude", 30, "+30 deg"),
      ];
    },
  },
  {
    id: "accented-analogous",
    section: "core-harmonies",
    label: "Analogues accentuees",
    formula: "0 / -30 / +30 / +180",
    description:
      "Une base analogique a laquelle on ajoute son opposee pour injecter un accent de contraste.",
    tooltip: THEORY_TOOLTIPS["accented-analogous"],
    requiresChromatic: true,
    generate(baseColor) {
      return [
        targetFromHsl(baseColor, "Voisine froide", -30, "-30 deg"),
        targetFromHsl(baseColor, "Voisine chaude", 30, "+30 deg"),
        targetFromHsl(baseColor, "Accent oppose", 180, "+180 deg"),
      ];
    },
  },
  {
    id: "triadic",
    section: "core-harmonies",
    label: "Triadique",
    formula: "0 / +120 / +240",
    description:
      "Trois points equidistants. Une harmonie tres structuree qui garde de la tension.",
    tooltip: THEORY_TOOLTIPS.triadic,
    requiresChromatic: true,
    generate(baseColor) {
      return [
        targetFromHsl(baseColor, "Triade A", 120, "+120 deg"),
        targetFromHsl(baseColor, "Triade B", 240, "+240 deg"),
      ];
    },
  },
  {
    id: "tetradic",
    section: "core-harmonies",
    label: "Tetradique",
    formula: "0 / +60 / +180 / +240",
    description:
      "Un rectangle sur la roue. Plus riche qu'une triade, avec deux couples de tensions.",
    tooltip: THEORY_TOOLTIPS.tetradic,
    requiresChromatic: true,
    generate(baseColor) {
      return [
        targetFromHsl(baseColor, "Rectangle A", 60, "+60 deg"),
        targetFromHsl(baseColor, "Rectangle B", 180, "+180 deg"),
        targetFromHsl(baseColor, "Rectangle C", 240, "+240 deg"),
      ];
    },
  },
  {
    id: "square",
    section: "core-harmonies",
    label: "Carre",
    formula: "0 / +90 / +180 / +270",
    description:
      "Quatre points a distance egale. Le systeme le plus equilibre pour une palette vive.",
    tooltip: THEORY_TOOLTIPS.square,
    requiresChromatic: true,
    generate(baseColor) {
      return [
        targetFromHsl(baseColor, "Carre A", 90, "+90 deg"),
        targetFromHsl(baseColor, "Carre B", 180, "+180 deg"),
        targetFromHsl(baseColor, "Carre C", 270, "+270 deg"),
      ];
    },
  },
  {
    id: "double-split-complementary",
    section: "core-harmonies",
    label: "Double complementaire scindee",
    formula: "0 / -30 / +30 / +150 / +210",
    description:
      "Deux voisins autour de la base et deux voisins autour de son opposee pour une palette plus large.",
    tooltip: THEORY_TOOLTIPS["double-split-complementary"],
    requiresChromatic: true,
    generate(baseColor) {
      return [
        targetFromHsl(baseColor, "Voisin A", -30, "-30 deg"),
        targetFromHsl(baseColor, "Voisin B", 30, "+30 deg"),
        targetFromHsl(baseColor, "Oppose voisin A", 150, "+150 deg"),
        targetFromHsl(baseColor, "Oppose voisin B", 210, "+210 deg"),
      ];
    },
  },
  {
    id: "monochromatic",
    section: "core-variations",
    label: "Monochromatique",
    formula: "meme hue / valeurs changeantes",
    description:
      "La meme famille de teinte, en ouvrant ou en densifiant luminosite et saturation.",
    tooltip: THEORY_TOOLTIPS.monochromatic,
    requiresChromatic: false,
    generate(baseColor) {
      return [
        targetFromMonochrome(baseColor, "Dense", -0.22, 1.06, "ombre forte"),
        targetFromMonochrome(baseColor, "Moyen", -0.1, 1.02, "appui"),
        targetFromMonochrome(baseColor, "Aerien", 0.12, 0.94, "ouverture"),
        targetFromMonochrome(baseColor, "Lumineux", 0.24, 0.88, "lumiere"),
      ];
    },
  },
  {
    id: "hue-shift",
    section: "core-variations",
    label: "Decalage de teinte",
    formula: "-40 / -20 / +20 / +40",
    description:
      "Glissement de teinte sans casser la luminosite initiale. Pratique pour explorer un axe chromatique.",
    tooltip: THEORY_TOOLTIPS["hue-shift"],
    requiresChromatic: true,
    generate(baseColor) {
      return [
        targetFromHsl(baseColor, "Teinte -40", -40, "-40 deg"),
        targetFromHsl(baseColor, "Teinte -20", -20, "-20 deg"),
        targetFromHsl(baseColor, "Teinte +20", 20, "+20 deg"),
        targetFromHsl(baseColor, "Teinte +40", 40, "+40 deg"),
      ];
    },
  },
  {
    id: "tint",
    section: "core-variations",
    label: "Eclaircissement",
    formula: "+20% / +40% / +60% blanc",
    description:
      "Meme teinte, melangee au blanc pour obtenir des versions plus claires.",
    tooltip: THEORY_TOOLTIPS.tint,
    requiresChromatic: false,
    generate(baseColor) {
      return [
        targetFromMix(baseColor.hex, "Clair 20%", "#FFFFFF", 0.2, "+20% blanc", "tint"),
        targetFromMix(baseColor.hex, "Clair 40%", "#FFFFFF", 0.4, "+40% blanc", "tint"),
        targetFromMix(baseColor.hex, "Clair 60%", "#FFFFFF", 0.6, "+60% blanc", "tint"),
      ];
    },
  },
  {
    id: "shade",
    section: "core-variations",
    label: "Ombre",
    formula: "+20% / +40% / +60% noir",
    description:
      "Meme teinte, poussee vers le noir pour obtenir des profondeurs progressives.",
    tooltip: THEORY_TOOLTIPS.shade,
    requiresChromatic: false,
    generate(baseColor) {
      return [
        targetFromMix(baseColor.hex, "Ombre 20%", "#000000", 0.2, "+20% noir", "shade"),
        targetFromMix(baseColor.hex, "Ombre 40%", "#000000", 0.4, "+40% noir", "shade"),
        targetFromMix(baseColor.hex, "Ombre 60%", "#000000", 0.6, "+60% noir", "shade"),
      ];
    },
  },
  {
    id: "tone",
    section: "core-variations",
    label: "Ton",
    formula: "+20% / +40% / +60% gris",
    description:
      "Meme teinte, rabattue vers un gris moyen pour calmer le contraste et la saturation.",
    tooltip: THEORY_TOOLTIPS.tone,
    requiresChromatic: false,
    generate(baseColor) {
      return [
        targetFromMix(baseColor.hex, "Ton 20%", "#808080", 0.2, "+20% gris", "tone"),
        targetFromMix(baseColor.hex, "Ton 40%", "#808080", 0.4, "+40% gris", "tone"),
        targetFromMix(baseColor.hex, "Ton 60%", "#808080", 0.6, "+60% gris", "tone"),
      ];
    },
  },
  {
    id: "compound",
    section: "adobe-extras",
    label: "Compose",
    formula: "0 / +30 / +180 / +210",
    description:
      "Regle Adobe/Photoshop melangeant analogue et complementaire. La geometrie ici est une interpretation pratique de cette description.",
    tooltip: THEORY_TOOLTIPS.compound,
    requiresChromatic: true,
    generate(baseColor) {
      return [
        targetFromHsl(baseColor, "Accent analogue", 30, "+30 deg"),
        targetFromHsl(baseColor, "Complement", 180, "+180 deg"),
        targetFromHsl(baseColor, "Accent compose", 210, "+210 deg"),
      ];
    },
  },
  {
    id: "shades",
    section: "adobe-extras",
    label: "Nuances",
    formula: "meme hue / luminosite variable",
    description:
      "Regle Adobe/Photoshop basee sur des variations de luminosite d'une seule teinte.",
    tooltip: THEORY_TOOLTIPS.shades,
    requiresChromatic: false,
    generate(baseColor) {
      return [
        targetFromAbsoluteHsl("Nuance sombre", { h: baseColor.h, s: baseColor.s, l: baseColor.l - 0.3 }, "L -30%", "shades"),
        targetFromAbsoluteHsl("Nuance dense", { h: baseColor.h, s: baseColor.s, l: baseColor.l - 0.15 }, "L -15%", "shades"),
        targetFromAbsoluteHsl("Nuance claire", { h: baseColor.h, s: baseColor.s, l: baseColor.l + 0.15 }, "L +15%", "shades"),
        targetFromAbsoluteHsl("Nuance pale", { h: baseColor.h, s: baseColor.s, l: baseColor.l + 0.3 }, "L +30%", "shades"),
      ];
    },
  },
  {
    id: "pentagram",
    section: "adobe-extras",
    label: "Pentagramme",
    formula: "0 / +72 / +144 / +216 / +288",
    description:
      "Cinq points repartis regulierement sur la roue, inspire du panel Adobe de groupes de couleurs.",
    tooltip: THEORY_TOOLTIPS.pentagram,
    requiresChromatic: true,
    generate(baseColor) {
      return [
        targetFromHsl(baseColor, "Pentagram B", 72, "+72 deg"),
        targetFromHsl(baseColor, "Pentagram C", 144, "+144 deg"),
        targetFromHsl(baseColor, "Pentagram D", 216, "+216 deg"),
        targetFromHsl(baseColor, "Pentagram E", 288, "+288 deg"),
      ];
    },
  },
  {
    id: "warm-cool",
    section: "adobe-extras",
    label: "Chaud / froid",
    formula: "-28 / -14 / +14 / +28",
    description:
      "Equivalent pratique du mode warm/cool du Color Guide Adobe, pour pousser la teinte de part et d'autre.",
    tooltip: THEORY_TOOLTIPS["warm-cool"],
    requiresChromatic: true,
    generate(baseColor) {
      return [
        targetFromHsl(baseColor, "Froid -28", -28, "-28 deg"),
        targetFromHsl(baseColor, "Froid -14", -14, "-14 deg"),
        targetFromHsl(baseColor, "Chaud +14", 14, "+14 deg"),
        targetFromHsl(baseColor, "Chaud +28", 28, "+28 deg"),
      ];
    },
  },
  {
    id: "vivid-muted",
    section: "adobe-extras",
    label: "Vif / attenue",
    formula: "sat -45 / -20 / +20 / +45",
    description:
      "Equivalent pratique du mode vivid/muted d'Adobe, en calmant ou en renforcant la saturation.",
    tooltip: THEORY_TOOLTIPS["vivid-muted"],
    requiresChromatic: false,
    generate(baseColor) {
      return [
        targetFromSaturation(baseColor, "Attenue 45", -0.45, 0.03, "S -45%"),
        targetFromSaturation(baseColor, "Attenue 20", -0.2, 0.01, "S -20%"),
        targetFromSaturation(baseColor, "Vif 20", 0.2, -0.01, "S +20%"),
        targetFromSaturation(baseColor, "Vif 45", 0.45, -0.03, "S +45%"),
      ];
    },
  },
  {
    id: "tints-shades",
    section: "adobe-extras",
    label: "Clairs / fonces",
    formula: "ombres / clairs combines",
    description:
      "Variation mixte inspiree du Color Guide Adobe, avec des ouvertures claires et des densifications sombres.",
    tooltip: THEORY_TOOLTIPS["tints-shades"],
    requiresChromatic: false,
    generate(baseColor) {
      return [
        targetFromMix(baseColor.hex, "Fonce 35%", "#000000", 0.35, "+35% noir", "tints-shades"),
        targetFromMix(baseColor.hex, "Fonce 15%", "#000000", 0.15, "+15% noir", "tints-shades"),
        targetFromMix(baseColor.hex, "Clair 15%", "#FFFFFF", 0.15, "+15% blanc", "tints-shades"),
        targetFromMix(baseColor.hex, "Clair 35%", "#FFFFFF", 0.35, "+35% blanc", "tints-shades"),
      ];
    },
  },
  {
    id: "custom",
    section: "adobe-extras",
    label: "Libre",
    formula: "libre",
    description:
      "Mode libre inspire de Photoshop. Aucune geometrie n'est imposee : tu pilotes uniquement la couleur de base.",
    tooltip: THEORY_TOOLTIPS.custom,
    requiresChromatic: false,
    generate() {
      return [];
    },
  },
];

export const THEORY_MAP = new Map(THEORIES.map((theory) => [theory.id, theory]));
