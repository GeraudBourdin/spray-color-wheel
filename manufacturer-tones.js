import {
  clamp,
  deltaE,
  getContrastingText,
  hexToHsl,
  hexToLab,
  hueDistance,
  labToLch,
  lchToHex,
} from "./color-utils.js";

const MANIFEST_URL = new URL("./manufacturers/index.json", window.location.href);
const CART_STORAGE_KEY = "spray-color-wheel.cart";
const SELECTION_STORAGE_KEY = "spray-color-wheel.tones-manufacturer";
const BASE_COLOR_ID_STORAGE_KEY = "spray-color-wheel.tones-base-color-id";
const BASE_HEX_STORAGE_KEY = "spray-color-wheel.tones-base-hex";
const RAMP_SIZE_STORAGE_KEY = "spray-color-wheel.tones-ramp-size";
const DEFAULT_BASE_HEX = "#F05A28";
const MID_TONE_BASE_LIMIT = 48;
const MID_TONE_NEUTRAL_LIMIT = 6;
const SPECIAL_COLOR_PATTERN =
  /chrome|metal|metallic|transparent|glitter|effect|varnish|tar|bitumen|primer|texture/i;

const RAMP_CONFIGS = {
  "3": [
    {
      id: "dark",
      label: "Sombre",
      note: "ancrage et ombre",
      direction: -1,
      directionWeight: 1.2,
      anchorLightness: 8,
      mix: 0.46,
      chromaScale: 1.04,
    },
    {
      id: "mid",
      label: "Moyenne",
      note: "coeur de teinte",
      direction: 0,
      directionWeight: 1,
      keepBase: true,
      chromaScale: 1,
    },
    {
      id: "light",
      label: "Claire",
      note: "ouverture et lumiere",
      direction: 1,
      directionWeight: 1.2,
      anchorLightness: 97,
      mix: 0.42,
      chromaScale: 0.9,
    },
  ],
  "4": [
    {
      id: "very-dark",
      label: "Tres sombre",
      note: "profondeur forte",
      direction: -1,
      directionWeight: 1.7,
      anchorLightness: 4,
      mix: 0.72,
      chromaScale: 0.94,
    },
    {
      id: "dark",
      label: "Sombre",
      note: "appui et volume",
      direction: -1,
      directionWeight: 1.15,
      anchorLightness: 9,
      mix: 0.42,
      chromaScale: 1.02,
    },
    {
      id: "light",
      label: "Claire",
      note: "lumiere controlee",
      direction: 1,
      directionWeight: 1.15,
      anchorLightness: 97,
      mix: 0.34,
      chromaScale: 0.92,
    },
    {
      id: "very-light",
      label: "Tres claire",
      note: "haut de gamme et eclat",
      direction: 1,
      directionWeight: 1.7,
      anchorLightness: 99,
      mix: 0.68,
      chromaScale: 0.78,
    },
  ],
};

const escapeHtmlMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const state = {
  manifest: [],
  catalogs: new Map(),
  currentCatalog: null,
  currentRecommendation: null,
  selectedManufacturerId: "",
  selectedBaseColorId: "",
  baseHex: DEFAULT_BASE_HEX,
  rampSize: "3",
  cartItems: [],
  copiedToneActionKey: null,
};

let copiedToneActionTimer = 0;

const elements = {
  manufacturerSelect: document.querySelector("#manufacturer-select"),
  tonesCartLink: document.querySelector("#tones-cart-link"),
  tonesTopbarMeta: document.querySelector("#tones-topbar-meta"),
  tonesSelectionSummary: document.querySelector("#tones-selection-summary"),
  tonesTitle: document.querySelector("#tones-title"),
  tonesSubtitle: document.querySelector("#tones-subtitle"),
  tonesSummary: document.querySelector("#tones-summary"),
  tonesCartSummary: document.querySelector("#tones-cart-summary"),
  tonesFeedback: document.querySelector("#tones-feedback"),
  tonesBaseListCount: document.querySelector("#tones-base-list-count"),
  tonesBaseList: document.querySelector("#tones-base-list"),
  tonesBaseContext: document.querySelector("#tones-base-context"),
  tonesBasePreview: document.querySelector("#tones-base-preview"),
  toneRamp: document.querySelector("#tone-ramp"),
  toneMatchGrid: document.querySelector("#tone-match-grid"),
  rampSizeButtons: Array.from(document.querySelectorAll("[data-ramp-size]")),
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => escapeHtmlMap[character]);
}

function normalizeReferenceToken(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function getColorDisplayLabel(color) {
  return String(color?.label || color?.name || color?.hex || "").trim();
}

function buildColorReferenceText(color) {
  if (!color) {
    return "";
  }

  const brand = String(color.brandLabel || "").trim();
  const code = String(color.code || "").trim();
  const label = getColorDisplayLabel(color);
  const labelToken = normalizeReferenceToken(label);
  const codeToken = normalizeReferenceToken(code);
  const includeCode = Boolean(code && (!label || !codeToken || !labelToken.includes(codeToken)));

  return [brand, includeCode ? code : "", label || color.hex].filter(Boolean).join(" · ");
}

function buildToneCopyActionKey(scope, colorId, copyKind) {
  return `${scope}:${copyKind}:${colorId}`;
}

function formatCount(count, singular, plural = `${singular}s`) {
  return `${count} ${count > 1 ? plural : singular}`;
}

function formatPercent(value) {
  return `${Math.round(clamp(Number(value) || 0, 0, 1) * 100)}%`;
}

function formatDeltaE(value) {
  return (Math.round((Number(value) || 0) * 10) / 10).toFixed(1);
}

function normalizeCartItem(input) {
  if (typeof input === "string") {
    return { colorId: input, quantity: 1 };
  }

  if (!input || typeof input.colorId !== "string") {
    return null;
  }

  const quantity = Math.max(1, Number.parseInt(input.quantity, 10) || 1);
  return { colorId: input.colorId, quantity };
}

function loadCartFromStorage() {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!raw) {
      state.cartItems = [];
      return;
    }

    const parsed = JSON.parse(raw);
    state.cartItems = Array.isArray(parsed)
      ? parsed
          .map(normalizeCartItem)
          .filter(Boolean)
          .filter(
            (entry, index, entries) =>
              entries.findIndex((candidate) => candidate.colorId === entry.colorId) === index,
          )
      : [];
  } catch {
    state.cartItems = [];
  }
}

function persistCart() {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cartItems));
  } catch {
    // Ignore storage failures to keep the page usable without persistence.
  }
}

function getCartItem(colorId) {
  return state.cartItems.find((entry) => entry.colorId === colorId) || null;
}

function getCartQuantity(colorId) {
  return getCartItem(colorId)?.quantity || 0;
}

function getCartReferenceCount() {
  return state.cartItems.length;
}

function getCartSprayCount() {
  return state.cartItems.reduce((total, entry) => total + entry.quantity, 0);
}

function renderCartStatus() {
  const referenceCount = getCartReferenceCount();
  const sprayCount = getCartSprayCount();

  if (elements.tonesCartLink) {
    elements.tonesCartLink.textContent = `Panier sprays · ${sprayCount}`;
    elements.tonesCartLink.setAttribute(
      "aria-label",
      sprayCount ? `${formatCount(sprayCount, "spray")} dans le panier` : "Panier sprays vide",
    );
  }

  if (elements.tonesCartSummary) {
    elements.tonesCartSummary.innerHTML = `
      <span class="base-pill">${escapeHtml(formatCount(referenceCount, "reference"))}</span>
      <span class="base-pill">${escapeHtml(formatCount(sprayCount, "spray"))}</span>
    `;
  }
}

function addColorToCart(color) {
  if (!color?.id) {
    return;
  }

  const current = getCartItem(color.id);

  if (current) {
    current.quantity += 1;
  } else {
    state.cartItems = [...state.cartItems, { colorId: color.id, quantity: 1 }];
  }

  persistCart();
  renderCartStatus();
  rerenderActiveRecommendation();
}

function normalizeHexInput(value) {
  const normalized = String(value || "")
    .trim()
    .replace(/^#?/, "#")
    .toUpperCase();

  return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : "";
}

function isNeutralColor(hsl) {
  return hsl.s < 0.12 || hsl.l < 0.08 || hsl.l > 0.94;
}

function buildBaseColor(hex) {
  const normalizedHex = normalizeHexInput(hex) || DEFAULT_BASE_HEX;
  const hsl = hexToHsl(normalizedHex);
  const lab = hexToLab(normalizedHex);
  const lch = labToLch(lab);

  return {
    id: "base",
    hex: normalizedHex,
    hsl,
    lab,
    lch,
    textColor: getContrastingText(normalizedHex),
    isNeutral: isNeutralColor(hsl),
  };
}

function buildColorRecord(input) {
  const hex = normalizeHexInput(input.hex);

  if (!hex) {
    throw new Error("Couleur de catalogue invalide.");
  }

  const hsl = hexToHsl(hex);
  const lab = hexToLab(hex);

  return {
    ...input,
    hex,
    hsl,
    lab,
    lch: labToLch(lab),
    textColor: getContrastingText(hex),
    isNeutral: isNeutralColor(hsl),
  };
}

function normalizeManufacturerCatalog(catalog) {
  const manufacturer = catalog?.manufacturer;
  const colors = Array.isArray(catalog?.colors) ? catalog.colors : [];

  if (!manufacturer?.id || !manufacturer?.label) {
    throw new Error("Catalogue fabricant invalide.");
  }

  return {
    manufacturer: {
      id: manufacturer.id,
      label: manufacturer.label,
      series: manufacturer.series || "",
      source: manufacturer.source || null,
    },
    colors: colors.map((entry, index) =>
      buildColorRecord({
        id: `${manufacturer.id}-${entry.id || entry.code || index + 1}`,
        code: String(entry.code || "").trim(),
        name: String(entry.name || entry.label || "").trim(),
        label: String(entry.label || [entry.code, entry.name].filter(Boolean).join(" ") || entry.hex).trim(),
        sourceLabel: String(entry.sourceLabel || entry.label || entry.name || "").trim(),
        brandLabel: manufacturer.label,
        finish: String(entry.finish || "").trim(),
        family: typeof entry?.meta?.family === "string" ? entry.meta.family : "",
        meta: entry?.meta && typeof entry.meta === "object" ? entry.meta : {},
        hex: entry.hex,
      }),
    ),
  };
}

function getManifestEntry(manufacturerId) {
  return state.manifest.find((entry) => entry.id === manufacturerId) || null;
}

function getStoredSelection() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("manufacturer");

  if (fromUrl) {
    return fromUrl;
  }

  try {
    return window.localStorage.getItem(SELECTION_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function getStoredBaseHex() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = normalizeHexInput(params.get("hex"));

  if (fromUrl) {
    return fromUrl;
  }

  try {
    return normalizeHexInput(window.localStorage.getItem(BASE_HEX_STORAGE_KEY)) || DEFAULT_BASE_HEX;
  } catch {
    return DEFAULT_BASE_HEX;
  }
}

function getStoredBaseColorId() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("base");

  if (fromUrl) {
    return fromUrl;
  }

  try {
    return window.localStorage.getItem(BASE_COLOR_ID_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function getStoredRampSize() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("tones");

  if (fromUrl === "3" || fromUrl === "4") {
    return fromUrl;
  }

  try {
    const stored = window.localStorage.getItem(RAMP_SIZE_STORAGE_KEY);
    return stored === "3" || stored === "4" ? stored : "3";
  } catch {
    return "3";
  }
}

function persistState() {
  const url = new URL(window.location.href);

  if (state.selectedManufacturerId) {
    url.searchParams.set("manufacturer", state.selectedManufacturerId);
  }

  if (state.selectedBaseColorId) {
    url.searchParams.set("base", state.selectedBaseColorId);
  } else {
    url.searchParams.delete("base");
  }

  url.searchParams.set("hex", state.baseHex);
  url.searchParams.set("tones", state.rampSize);
  window.history.replaceState({}, "", url);

  try {
    window.localStorage.setItem(SELECTION_STORAGE_KEY, state.selectedManufacturerId);
    window.localStorage.setItem(BASE_COLOR_ID_STORAGE_KEY, state.selectedBaseColorId);
    window.localStorage.setItem(BASE_HEX_STORAGE_KEY, state.baseHex);
    window.localStorage.setItem(RAMP_SIZE_STORAGE_KEY, state.rampSize);
  } catch {
    // Keep the page usable even if persistence fails.
  }
}

function renderFeedback(message, isError = false) {
  elements.tonesFeedback.textContent = message || "";
  elements.tonesFeedback.classList.toggle("is-error", Boolean(message && isError));
  elements.tonesFeedback.hidden = !message;
}

function renderManufacturerOptions() {
  elements.manufacturerSelect.innerHTML = state.manifest
    .map((entry) => `<option value="${escapeHtml(entry.id)}">${escapeHtml(entry.label)}</option>`)
    .join("");

  if (state.selectedManufacturerId) {
    elements.manufacturerSelect.value = state.selectedManufacturerId;
  }
}

function renderRampSizeControls() {
  for (const button of elements.rampSizeButtons) {
    const active = button.dataset.rampSize === state.rampSize;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  }
}

function renderTopbarMeta(selectedCatalog) {
  const manufacturerCount = state.manifest.length;
  const colorCount = selectedCatalog ? selectedCatalog.colors.length : 0;

  elements.tonesTopbarMeta.innerHTML = `
    <span class="meta-pill">${escapeHtml(formatCount(manufacturerCount, "fabricant"))}</span>
    <span class="meta-pill">${escapeHtml(formatCount(colorCount, "reference"))}</span>
    <span class="meta-pill">${escapeHtml(`${state.rampSize} tonalites`)}</span>
  `;
}

function renderSelectionSummary(selectedCatalog, baseColor = null, midToneCount = 0) {
  if (!selectedCatalog) {
    elements.tonesSelectionSummary.innerHTML = "";
    return;
  }

  const baseLabel = baseColor
    ? [baseColor.code, baseColor.name || baseColor.label].filter(Boolean).join(" ").trim() || baseColor.label
    : state.baseHex;
  const pills = [
    `<span class="base-pill">${escapeHtml(selectedCatalog.manufacturer.label)}</span>`,
    `<span class="base-pill">${escapeHtml(baseLabel)}</span>`,
    `<span class="base-pill">${escapeHtml(`${state.rampSize} tons`)}</span>`,
  ];

  if (selectedCatalog.manufacturer.series) {
    pills.splice(1, 0, `<span class="base-pill">${escapeHtml(selectedCatalog.manufacturer.series)}</span>`);
  }

  if (midToneCount) {
    pills.push(`<span class="base-pill">${escapeHtml(formatCount(midToneCount, "base mid tone", "bases mid tone"))}</span>`);
  }

  elements.tonesSelectionSummary.innerHTML = pills.join("");
}

function renderCatalogHeader(selectedCatalog) {
  if (!selectedCatalog) {
    elements.tonesTitle.textContent = "Catalogue indisponible";
    elements.tonesSubtitle.textContent = "";
    elements.tonesSummary.innerHTML = "";
    document.title = "Tonalites par fabricant";
    return;
  }

  const { manufacturer, colors } = selectedCatalog;
  const summaryPills = [
    `<span class="base-pill">${escapeHtml(formatCount(colors.length, "reference"))}</span>`,
    `<span class="base-pill">${escapeHtml(`${state.rampSize} tonalites`)}</span>`,
  ];

  if (manufacturer.series) {
    summaryPills.push(`<span class="base-pill">${escapeHtml(manufacturer.series)}</span>`);
  }

  elements.tonesTitle.textContent = manufacturer.label;
  elements.tonesSubtitle.textContent = manufacturer.source?.name
    ? `${manufacturer.source.name}${manufacturer.source.note ? ` · ${manufacturer.source.note}` : ""}`
    : "Nuances d'une meme couleur, converties en recommandations de sprays reels.";
  elements.tonesSummary.innerHTML = summaryPills.join("");
  document.title = `${manufacturer.label} · Tonalites sprays`;
}

function isSpecialColor(color) {
  const haystack = [
    color.label,
    color.name,
    color.code,
    color.finish,
    color.family,
    color.meta?.category,
    color.meta?.title,
  ]
    .filter(Boolean)
    .join(" ");

  return SPECIAL_COLOR_PATTERN.test(haystack);
}

function isMidToneColor(color, { relaxed = false } = {}) {
  if (isSpecialColor(color)) {
    return false;
  }

  const minimumLightness = relaxed ? 26 : 32;
  const maximumLightness = relaxed ? 82 : 74;

  if (color.lab.l < minimumLightness || color.lab.l > maximumLightness) {
    return false;
  }

  if (color.isNeutral) {
    return relaxed ? color.lab.l >= 30 && color.lab.l <= 78 : color.lab.l >= 36 && color.lab.l <= 68;
  }

  return relaxed ? color.lch.c >= 6 : color.lch.c >= 10;
}

function compareBasePaletteColors(first, second) {
  if (first.isNeutral !== second.isNeutral) {
    return first.isNeutral ? 1 : -1;
  }

  if (first.isNeutral && second.isNeutral) {
    return first.lab.l - second.lab.l || first.label.localeCompare(second.label);
  }

  const hueDelta = first.lch.h - second.lch.h;

  if (Math.abs(hueDelta) > 0.001) {
    return hueDelta;
  }

  return Math.abs(first.lab.l - 54) - Math.abs(second.lab.l - 54) || first.label.localeCompare(second.label);
}

function sampleEvenly(items, limit) {
  if (items.length <= limit) {
    return [...items];
  }

  if (limit <= 1) {
    return [items[Math.floor(items.length / 2)]];
  }

  const sampled = [];
  const usedIndexes = new Set();

  for (let index = 0; index < limit; index += 1) {
    const rawIndex = Math.round((index * (items.length - 1)) / (limit - 1));
    let resolvedIndex = rawIndex;

    while (usedIndexes.has(resolvedIndex) && resolvedIndex < items.length - 1) {
      resolvedIndex += 1;
    }

    while (usedIndexes.has(resolvedIndex) && resolvedIndex > 0) {
      resolvedIndex -= 1;
    }

    if (!usedIndexes.has(resolvedIndex)) {
      usedIndexes.add(resolvedIndex);
      sampled.push(items[resolvedIndex]);
    }
  }

  return sampled;
}

function getMidToneBaseColors(catalog) {
  if (!catalog) {
    return [];
  }

  const strict = catalog.colors.filter((color) => isMidToneColor(color));

  const basePool =
    strict.length >= 8
      ? [...strict].sort(compareBasePaletteColors)
      : [...catalog.colors.filter((color) => isMidToneColor(color, { relaxed: true }))].sort(compareBasePaletteColors);

  if (basePool.length <= MID_TONE_BASE_LIMIT) {
    return basePool;
  }

  const colored = basePool.filter((color) => !color.isNeutral);
  const neutrals = basePool.filter((color) => color.isNeutral);
  const neutralLimit = Math.min(neutrals.length, MID_TONE_NEUTRAL_LIMIT);
  const coloredLimit = Math.max(MID_TONE_BASE_LIMIT - neutralLimit, 1);

  return [...sampleEvenly(colored, coloredLimit), ...sampleEvenly(neutrals, neutralLimit)].sort(compareBasePaletteColors);
}

function resolveBaseColor(catalog) {
  const midToneColors = getMidToneBaseColors(catalog);
  const seedHex = normalizeHexInput(state.baseHex) || DEFAULT_BASE_HEX;
  const seed = buildBaseColor(seedHex);
  const direct =
    midToneColors.find((color) => color.id === state.selectedBaseColorId) ||
    midToneColors.find((color) => color.hex === seedHex) ||
    null;

  if (direct) {
    return {
      baseColor: direct,
      midToneColors,
    };
  }

  const fallbackPool = midToneColors.length ? midToneColors : catalog.colors.filter((color) => !isSpecialColor(color));
  const nearest =
    [...fallbackPool].sort((first, second) => deltaE(seed.lab, first.lab) - deltaE(seed.lab, second.lab))[0] ||
    catalog.colors[0] ||
    null;

  if (!nearest) {
    throw new Error("Aucune base exploitable n'a ete trouvee dans ce catalogue.");
  }

  return {
    baseColor: nearest,
    midToneColors,
  };
}

function mixLightness(baseLightness, anchorLightness, amount) {
  return clamp(baseLightness + (anchorLightness - baseLightness) * amount, 0, 100);
}

function createToneTarget(baseColor, descriptor) {
  const lightness = descriptor.keepBase
    ? clamp(baseColor.lch.l, 0, 100)
    : mixLightness(baseColor.lch.l, descriptor.anchorLightness, descriptor.mix);
  const chroma =
    baseColor.lch.c < 3 ? baseColor.lch.c : clamp(baseColor.lch.c * descriptor.chromaScale, 0, 132);
  const hex = lchToHex(lightness, chroma, baseColor.lch.h).toUpperCase();
  const hsl = hexToHsl(hex);
  const lab = hexToLab(hex);

  return {
    id: descriptor.id,
    label: descriptor.label,
    note: descriptor.note,
    direction: descriptor.direction,
    directionWeight: descriptor.directionWeight,
    hex,
    hsl,
    lab,
    lch: labToLch(lab),
    textColor: getContrastingText(hex),
  };
}

function getToneTargets(baseColor) {
  return RAMP_CONFIGS[state.rampSize].map((descriptor) => createToneTarget(baseColor, descriptor));
}

function buildToneCandidate(target, color, baseColor) {
  const distance = deltaE(target.lab, color.lab);
  const hueGap = !baseColor.isNeutral && !color.isNeutral ? hueDistance(target.lch.h, color.lch.h) : 0;
  const chromaGap = Math.abs(target.lch.c - color.lch.c);
  const lightnessGap = Math.abs(target.lab.l - color.lab.l);
  let score = distance;

  if (!baseColor.isNeutral && !color.isNeutral) {
    score += Math.max(0, hueGap - 12) * 0.22;
  }

  score += chromaGap * 0.04;

  if (target.direction === 0) {
    score += Math.abs(baseColor.lab.l - color.lab.l) * 0.18;
  }

  if (target.direction < 0 && color.lab.l >= baseColor.lab.l - 1.5) {
    score += (9 + (color.lab.l - baseColor.lab.l + 1.5) * 0.42) * target.directionWeight;
  }

  if (target.direction > 0 && color.lab.l <= baseColor.lab.l + 1.5) {
    score += (9 + (baseColor.lab.l + 1.5 - color.lab.l) * 0.42) * target.directionWeight;
  }

  if (!baseColor.isNeutral && color.isNeutral) {
    score += 8;
  }

  if (isSpecialColor(color)) {
    score += 16;
  }

  return {
    color,
    target,
    score,
    distance,
    hueGap,
    chromaGap,
    lightnessGap,
  };
}

function assignDistinctMatches(targets, colors, baseColor) {
  const candidateLists = targets.map((target) =>
    colors
      .map((color) => buildToneCandidate(target, color, baseColor))
      .sort((first, second) => first.score - second.score || first.distance - second.distance)
      .slice(0, Math.min(colors.length, 14)),
  );

  let best = null;

  function visit(index, usedIds, totalScore, picks) {
    if (best && totalScore >= best.totalScore) {
      return;
    }

    if (index >= candidateLists.length) {
      best = {
        totalScore,
        picks: [...picks],
      };
      return;
    }

    const candidates = candidateLists[index];

    for (const candidate of candidates) {
      if (usedIds.has(candidate.color.id)) {
        continue;
      }

      usedIds.add(candidate.color.id);
      picks.push(candidate);
      visit(index + 1, usedIds, totalScore + candidate.score, picks);
      picks.pop();
      usedIds.delete(candidate.color.id);
    }
  }

  visit(0, new Set(), 0, []);

  if (best?.picks?.length === targets.length) {
    return best.picks;
  }

  return candidateLists.map((candidates) => candidates[0] || null).filter(Boolean);
}

function getQualityBadge(candidate) {
  if (!candidate) {
    return { label: "Indisponible", tone: "is-loose" };
  }

  if (candidate.score <= 7) {
    return { label: "Tres precise", tone: "is-excellent" };
  }

  if (candidate.score <= 12) {
    return { label: "Solide", tone: "is-good" };
  }

  if (candidate.score <= 18) {
    return { label: "Approchee", tone: "is-approx" };
  }

  return { label: "Libre", tone: "is-loose" };
}

function buildRecommendations(catalog) {
  if (!catalog) {
    return null;
  }

  const { baseColor, midToneColors } = resolveBaseColor(catalog);
  const targets = getToneTargets(baseColor);
  const matches = assignDistinctMatches(targets, catalog.colors, baseColor);

  return {
    baseColor,
    midToneColors,
    targets,
    matches,
  };
}

async function copyTextToClipboard(value) {
  const text = String(value || "");

  if (!text) {
    return false;
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy copy approach.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.append(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  } catch {
    return false;
  }
}

function rerenderActiveRecommendation() {
  if (!state.currentCatalog || !state.currentRecommendation) {
    return;
  }

  renderBasePreview(state.currentRecommendation.baseColor, state.currentCatalog);
  renderToneMatches(state.currentRecommendation.matches);
}

function flashCopiedToneAction(actionKey) {
  state.copiedToneActionKey = actionKey;

  if (copiedToneActionTimer) {
    window.clearTimeout(copiedToneActionTimer);
  }

  rerenderActiveRecommendation();

  copiedToneActionTimer = window.setTimeout(() => {
    copiedToneActionTimer = 0;
    state.copiedToneActionKey = null;
    rerenderActiveRecommendation();
  }, 1400);
}

function getCurrentCatalogColor(colorId) {
  return state.currentCatalog?.colors.find((color) => color.id === colorId) || null;
}

async function copyToneColorValue(color, copyKind, scope) {
  if (!color) {
    return;
  }

  const value = copyKind === "reference" ? buildColorReferenceText(color) : color.hex;
  const actionKey = buildToneCopyActionKey(scope, color.id, copyKind);
  const copied = await copyTextToClipboard(value);

  if (!copied) {
    window.alert("Impossible de copier cette valeur.");
    return;
  }

  flashCopiedToneAction(actionKey);
}

function renderBasePreview(baseColor, catalog) {
  const copyHexActionKey = buildToneCopyActionKey("base", baseColor.id, "hex");
  const copyReferenceActionKey = buildToneCopyActionKey("base", baseColor.id, "reference");
  const copyHexLabel = state.copiedToneActionKey === copyHexActionKey ? "Copie" : "Copier HEX";
  const copyReferenceLabel = state.copiedToneActionKey === copyReferenceActionKey ? "Copie" : "Copier ref";
  const cartQuantity = getCartQuantity(baseColor.id);
  const cartLabel = cartQuantity > 0 ? `Ajouter au panier · x${cartQuantity}` : "Ajouter au panier";

  if (!catalog) {
    elements.tonesBaseContext.textContent = "";
  } else {
    const label = [baseColor.code, baseColor.name || baseColor.label].filter(Boolean).join(" ").trim();
    elements.tonesBaseContext.textContent = `Base mid tone ${label || baseColor.label} · ${catalog.manufacturer.label} sert de point de depart a la rampe sombre vers clair.`;
  }

  elements.tonesBasePreview.innerHTML = `
    <div class="tones-base-swatch" style="background:${baseColor.hex}; color:${baseColor.textColor}">
      <span class="tone-code-pill">${escapeHtml(baseColor.code || "BASE")}</span>
      <span class="tone-hex-pill">${escapeHtml(baseColor.hex)}</span>
    </div>
    <div class="tones-base-details">
      <div>
        <h3 class="tone-base-title">Couleur de depart</h3>
        <p class="tone-card-copy">
          ${escapeHtml(
            `Cette base est une vraie reference mid tone du catalogue: ${
              [baseColor.code, baseColor.name || baseColor.label].filter(Boolean).join(" ") || baseColor.label
            }. Le moteur construit ensuite les variantes sombres et claires a partir de cette reference.`,
          )}
        </p>
      </div>
      <div class="tones-base-detail-grid">
        <div class="tones-data-pill">
          <strong>Hue</strong>
          <span>${escapeHtml(`${Math.round(baseColor.hsl.h)} deg`)}</span>
        </div>
        <div class="tones-data-pill">
          <strong>Saturation</strong>
          <span>${escapeHtml(formatPercent(baseColor.hsl.s))}</span>
        </div>
        <div class="tones-data-pill">
          <strong>Lightness</strong>
          <span>${escapeHtml(formatPercent(baseColor.hsl.l))}</span>
        </div>
        <div class="tones-data-pill">
          <strong>L*</strong>
          <span>${escapeHtml(`${Math.round(baseColor.lab.l)}`)}</span>
        </div>
      </div>
      ${
        cartQuantity > 0
          ? `<div class="tone-pill-row"><span class="match-cart-badge">${escapeHtml(`Panier x${cartQuantity}`)}</span></div>`
          : ""
      }
      <div class="tones-base-actions">
        <button
          class="cart-action match-action tone-cart-button ${cartQuantity > 0 ? "is-in-cart" : ""}"
          type="button"
          data-tone-cart-color-id="${escapeHtml(baseColor.id)}"
        >
          ${escapeHtml(cartLabel)}
        </button>
        <button
          class="cart-action match-action match-copy-action ${state.copiedToneActionKey === copyHexActionKey ? "is-copied" : ""}"
          type="button"
          data-tone-copy-color-id="${escapeHtml(baseColor.id)}"
          data-tone-copy-kind="hex"
          data-tone-copy-scope="base"
        >
          ${escapeHtml(copyHexLabel)}
        </button>
        <button
          class="cart-action match-action match-copy-action ${state.copiedToneActionKey === copyReferenceActionKey ? "is-copied" : ""}"
          type="button"
          data-tone-copy-color-id="${escapeHtml(baseColor.id)}"
          data-tone-copy-kind="reference"
          data-tone-copy-scope="base"
        >
          ${escapeHtml(copyReferenceLabel)}
        </button>
      </div>
    </div>
  `;
}

function renderToneRamp(targets) {
  elements.toneRamp.innerHTML = targets
    .map(
      (target) => `
        <article class="tone-ramp-card">
          <div class="tone-ramp-swatch" style="background:${target.hex}; color:${target.textColor}">
            <span class="tone-role-badge">${escapeHtml(target.label)}</span>
            <span class="tone-hex-pill">${escapeHtml(target.hex)}</span>
          </div>
          <div class="tone-ramp-body">
            <h4 class="tone-role-title">${escapeHtml(target.label)}</h4>
            <p class="tone-card-copy">${escapeHtml(target.note)}</p>
            <div class="tone-pill-row">
              <span class="meta-pill">H ${escapeHtml(`${Math.round(target.hsl.h)} deg`)}</span>
              <span class="meta-pill">S ${escapeHtml(formatPercent(target.hsl.s))}</span>
              <span class="meta-pill">L ${escapeHtml(formatPercent(target.hsl.l))}</span>
            </div>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderToneMatches(matches) {
  elements.toneMatchGrid.innerHTML = matches
    .map((candidate) => {
      const quality = getQualityBadge(candidate);
      const color = candidate.color;
      const target = candidate.target;
      const colorLabel = [color.code, color.name || color.label].filter(Boolean).join(" ").trim() || color.label;
      const copyHexActionKey = buildToneCopyActionKey("match", color.id, "hex");
      const copyReferenceActionKey = buildToneCopyActionKey("match", color.id, "reference");
      const copyHexLabel = state.copiedToneActionKey === copyHexActionKey ? "Copie" : "Copier HEX";
      const copyReferenceLabel = state.copiedToneActionKey === copyReferenceActionKey ? "Copie" : "Copier ref";
      const cartQuantity = getCartQuantity(color.id);
      const cartLabel = cartQuantity > 0 ? `Ajouter au panier · x${cartQuantity}` : "Ajouter au panier";

      return `
        <article class="tone-match-card ${cartQuantity > 0 ? "is-in-cart" : ""}">
          <div class="tone-match-swatch" style="background:${color.hex}; color:${color.textColor}">
            <div class="tone-card-topline">
              <span class="tone-role-badge">${escapeHtml(target.label)}</span>
              <div class="tone-pill-row">
                ${cartQuantity > 0 ? `<span class="match-cart-badge">${escapeHtml(`Panier x${cartQuantity}`)}</span>` : ""}
                <span class="tone-quality-badge ${escapeHtml(quality.tone)}">${escapeHtml(quality.label)}</span>
              </div>
            </div>
            <span class="tone-hex-pill">${escapeHtml(color.hex)}</span>
          </div>
          <div class="tone-match-body">
            <div>
              <h4 class="tone-role-title">${escapeHtml(colorLabel)}</h4>
              <p class="tone-card-copy">${escapeHtml(color.sourceLabel || color.label)}</p>
            </div>
            <div class="tone-pill-row">
              ${color.code ? `<span class="meta-pill">${escapeHtml(color.code)}</span>` : ""}
              <span class="meta-pill">DeltaE ${escapeHtml(formatDeltaE(candidate.distance))}</span>
              <span class="meta-pill">L ${escapeHtml(`${Math.round(color.lab.l)}`)}</span>
              ${color.finish ? `<span class="meta-pill">${escapeHtml(color.finish)}</span>` : ""}
            </div>
            <div class="tone-match-target">
              <span class="tone-meta-copy">Cible theorique</span>
              <span class="tone-mini-target">
                <span class="tone-mini-dot" style="background:${target.hex}"></span>
                <span class="tone-meta-copy">${escapeHtml(target.hex)}</span>
              </span>
            </div>
            <div class="tone-match-actions">
              <button
                class="cart-action match-action tone-cart-button ${cartQuantity > 0 ? "is-in-cart" : ""}"
                type="button"
                data-tone-cart-color-id="${escapeHtml(color.id)}"
              >
                ${escapeHtml(cartLabel)}
              </button>
              <button
                class="cart-action match-action match-copy-action ${state.copiedToneActionKey === copyHexActionKey ? "is-copied" : ""}"
                type="button"
                data-tone-copy-color-id="${escapeHtml(color.id)}"
                data-tone-copy-kind="hex"
                data-tone-copy-scope="match"
              >
                ${escapeHtml(copyHexLabel)}
              </button>
              <button
                class="cart-action match-action match-copy-action ${state.copiedToneActionKey === copyReferenceActionKey ? "is-copied" : ""}"
                type="button"
                data-tone-copy-color-id="${escapeHtml(color.id)}"
                data-tone-copy-kind="reference"
                data-tone-copy-scope="match"
              >
                ${escapeHtml(copyReferenceLabel)}
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderMidToneBaseList(midToneColors, baseColor) {
  elements.tonesBaseListCount.textContent = midToneColors.length
    ? formatCount(midToneColors.length, "base proposee", "bases proposees")
    : "0 base";

  if (!midToneColors.length) {
    elements.tonesBaseList.innerHTML = `
      <div class="tones-base-empty">
        Aucune base mid tone n'a ete detectee automatiquement pour cette marque.
      </div>
    `;
    return;
  }

  elements.tonesBaseList.innerHTML = midToneColors
    .map((color) => {
      const active = color.id === baseColor.id;
      const label = color.name || color.label;

      return `
        <button
          class="tones-base-chip ${active ? "is-active" : ""}"
          type="button"
          data-base-color-id="${escapeHtml(color.id)}"
          aria-pressed="${active ? "true" : "false"}"
        >
          <span class="tones-base-chip-swatch" style="background:${color.hex}; color:${color.textColor}">
            <span class="tone-code-pill">${escapeHtml(color.code || "BASE")}</span>
            <span class="tone-hex-pill">${escapeHtml(color.hex)}</span>
          </span>
          <span class="tones-base-chip-body">
            <span class="tones-base-chip-code">${escapeHtml(color.code || color.hex)}</span>
            <span class="tones-base-chip-name">${escapeHtml(label)}</span>
          </span>
        </button>
      `;
    })
    .join("");
}

function renderRecommendations(catalog, recommendation = null) {
  if (!catalog) {
    state.currentCatalog = null;
    state.currentRecommendation = null;
    elements.tonesBaseListCount.textContent = "";
    elements.tonesBaseList.innerHTML = "";
    elements.tonesBaseContext.textContent = "";
    elements.tonesBasePreview.innerHTML = "";
    elements.toneRamp.innerHTML = "";
    elements.toneMatchGrid.innerHTML = "";
    return;
  }

  const resolvedRecommendation = recommendation || buildRecommendations(catalog);

  state.currentCatalog = catalog;
  state.currentRecommendation = resolvedRecommendation;

  const { baseColor, midToneColors, targets, matches } = resolvedRecommendation;
  renderMidToneBaseList(midToneColors, baseColor);
  renderBasePreview(baseColor, catalog);
  renderToneRamp(targets);
  renderToneMatches(matches);

  return {
    baseColor,
    midToneColors,
  };
}

async function loadManifest() {
  const response = await fetch(MANIFEST_URL);

  if (!response.ok) {
    throw new Error("Impossible de charger la liste des fabricants.");
  }

  const manifest = await response.json();
  const manufacturers = Array.isArray(manifest?.manufacturers) ? manifest.manufacturers : [];

  if (!manufacturers.length) {
    throw new Error("Aucun fabricant n'est disponible.");
  }

  state.manifest = manufacturers.map((entry) => ({
    id: entry.id,
    path: entry.path,
    label: entry.label || entry.id,
  }));
}

async function loadCatalog(manufacturerId) {
  if (state.catalogs.has(manufacturerId)) {
    return state.catalogs.get(manufacturerId);
  }

  const manifestEntry = getManifestEntry(manufacturerId);

  if (!manifestEntry) {
    throw new Error("Fabricant introuvable.");
  }

  const response = await fetch(new URL(manifestEntry.path, MANIFEST_URL));

  if (!response.ok) {
    throw new Error(`Impossible de charger le catalogue ${manifestEntry.label}.`);
  }

  const catalog = normalizeManufacturerCatalog(await response.json());
  state.catalogs.set(manufacturerId, catalog);
  return catalog;
}

async function renderSelectedManufacturer() {
  renderFeedback("Chargement du nuancier tonal...");
  state.copiedToneActionKey = null;

  if (copiedToneActionTimer) {
    window.clearTimeout(copiedToneActionTimer);
    copiedToneActionTimer = 0;
  }

  try {
    const catalog = await loadCatalog(state.selectedManufacturerId);
    const recommendation = buildRecommendations(catalog);

    state.selectedBaseColorId = recommendation.baseColor.id;
    state.baseHex = recommendation.baseColor.hex;
    persistState();

    renderTopbarMeta(catalog);
    renderSelectionSummary(catalog, recommendation.baseColor, recommendation.midToneColors.length);
    renderCatalogHeader(catalog);
    renderRecommendations(catalog, recommendation);
    renderFeedback("");
  } catch (error) {
    renderTopbarMeta(null);
    renderSelectionSummary(null, null, 0);
    renderCatalogHeader(null);
    renderRecommendations(null);
    renderFeedback(error.message || "Erreur de chargement du nuancier tonal.", true);
  }
}

async function setManufacturer(manufacturerId) {
  state.selectedManufacturerId = manufacturerId;
  elements.manufacturerSelect.value = manufacturerId;
  await renderSelectedManufacturer();
}

async function setRampSize(rampSize) {
  if (rampSize !== "3" && rampSize !== "4") {
    return;
  }

  state.rampSize = rampSize;
  renderRampSizeControls();
  await renderSelectedManufacturer();
}

async function setBaseColor(colorId) {
  const catalog = await loadCatalog(state.selectedManufacturerId);
  const midToneColors = getMidToneBaseColors(catalog);
  const color = midToneColors.find((entry) => entry.id === colorId);

  if (!color) {
    return;
  }

  state.selectedBaseColorId = color.id;
  state.baseHex = color.hex;
  await renderSelectedManufacturer();
}

async function boot() {
  renderFeedback("Chargement des fabricants...");
  loadCartFromStorage();
  renderCartStatus();
  state.baseHex = getStoredBaseHex();
  state.selectedBaseColorId = getStoredBaseColorId();
  state.rampSize = getStoredRampSize();
  renderRampSizeControls();

  try {
    await loadManifest();
    const storedSelection = getStoredSelection();
    const initialSelection = getManifestEntry(storedSelection)?.id || state.manifest[0].id;

    renderManufacturerOptions();

    elements.manufacturerSelect.addEventListener("change", (event) => {
      setManufacturer(event.currentTarget.value);
    });

    elements.rampSizeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setRampSize(button.dataset.rampSize);
      });
    });

    elements.tonesBaseList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-base-color-id]");

      if (!button) {
        return;
      }

      setBaseColor(button.dataset.baseColorId);
    });

    const handleToneCopy = (event) => {
      const cartButton = event.target.closest("[data-tone-cart-color-id]");

      if (cartButton) {
        const color = getCurrentCatalogColor(cartButton.dataset.toneCartColorId);

        if (color) {
          addColorToCart(color);
        }
        return;
      }

      const copyButton = event.target.closest("[data-tone-copy-color-id][data-tone-copy-kind][data-tone-copy-scope]");

      if (!copyButton) {
        return;
      }

      const color = getCurrentCatalogColor(copyButton.dataset.toneCopyColorId);

      if (color) {
        void copyToneColorValue(color, copyButton.dataset.toneCopyKind, copyButton.dataset.toneCopyScope);
      }
    };

    elements.tonesBasePreview.addEventListener("click", handleToneCopy);
    elements.toneMatchGrid.addEventListener("click", handleToneCopy);
    window.addEventListener("storage", (event) => {
      if (event.key && event.key !== CART_STORAGE_KEY) {
        return;
      }

      loadCartFromStorage();
      renderCartStatus();
      rerenderActiveRecommendation();
    });

    await setManufacturer(initialSelection);
  } catch (error) {
    renderTopbarMeta(null);
    renderSelectionSummary(null);
    renderCatalogHeader(null);
    renderRecommendations(null);
    renderFeedback(error.message || "Erreur au demarrage de la page tonalites.", true);
  }
}

boot();
