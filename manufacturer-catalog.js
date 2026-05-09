import { deltaE, getContrastingText, hexToHsl, hexToLab } from "./color-utils.js";

const MANIFEST_URL = new URL("./manufacturers/index.json", window.location.href);
const CART_STORAGE_KEY = "spray-color-wheel.cart";
const SELECTION_STORAGE_KEY = "spray-color-wheel.catalog-manufacturer";
const VIEW_MODE_STORAGE_KEY = "spray-color-wheel.catalog-view-mode";
const GROUP_FILTER_STORAGE_KEY = "spray-color-wheel.catalog-group-filter";
const AUTO_ADD_SEARCH_TO_CART_STORAGE_KEY = "spray-color-wheel.catalog-auto-add-search";
const HUE_GROUPS = [
  { id: "whites", label: "Blancs & cremes" },
  { id: "yellows", label: "Jaunes" },
  { id: "oranges", label: "Oranges" },
  { id: "reds", label: "Rouges" },
  { id: "pinks", label: "Roses & magentas" },
  { id: "purples", label: "Violets" },
  { id: "blues", label: "Bleus" },
  { id: "turquoises", label: "Turquoises" },
  { id: "greens", label: "Verts" },
  { id: "olives", label: "Olives" },
  { id: "browns", label: "Bruns" },
  { id: "grays", label: "Gris" },
  { id: "blacks", label: "Noirs" },
  { id: "specials", label: "Speciaux" },
];

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
  selectedManufacturerId: "",
  viewMode: "both",
  selectedGroupIds: new Set(),
  cartItems: [],
  searchRaw: "",
  searchResults: null,
  searchStatus: "idle",
  searchRunId: 0,
  autoAddSearchMatches: false,
  copiedCatalogActionKey: null,
};

const elements = {
  manufacturerSelect: document.querySelector("#manufacturer-select"),
  catalogSearchInput: document.querySelector("#catalog-search-input"),
  catalogSearchAutoAdd: document.querySelector("#catalog-search-auto-add"),
  catalogSearchRun: document.querySelector("#catalog-search-run"),
  catalogSearchClear: document.querySelector("#catalog-search-clear"),
  catalogCartLink: document.querySelector("#catalog-cart-link"),
  catalogTopbarMeta: document.querySelector("#catalog-topbar-meta"),
  catalogSelectionSummary: document.querySelector("#catalog-selection-summary"),
  catalogTitle: document.querySelector("#catalog-title"),
  catalogSubtitle: document.querySelector("#catalog-subtitle"),
  catalogSummary: document.querySelector("#catalog-summary"),
  catalogCartSummary: document.querySelector("#catalog-cart-summary"),
  catalogFeedback: document.querySelector("#catalog-feedback"),
  catalogGroupIndexShell: document.querySelector("#catalog-group-index-shell"),
  catalogGroupIndexSummary: document.querySelector("#catalog-group-index-summary"),
  catalogGroupIndex: document.querySelector("#catalog-group-index"),
  catalogSearchResultsShell: document.querySelector("#catalog-search-results-shell"),
  catalogSearchResultsSummary: document.querySelector("#catalog-search-results-summary"),
  catalogSearchResults: document.querySelector("#catalog-search-results"),
  catalogCompactShell: document.querySelector("#catalog-compact-shell"),
  catalogCompactGroups: document.querySelector("#catalog-compact-groups"),
  catalogGroups: document.querySelector("#catalog-groups"),
  viewModeButtons: Array.from(document.querySelectorAll("[data-view-mode]")),
};

let focusedColorTimer = 0;
let copiedCatalogActionTimer = 0;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => escapeHtmlMap[character]);
}

function formatCount(count, singular, plural = `${singular}s`) {
  return `${count} ${count > 1 ? plural : singular}`;
}

function getColorDisplayLabel(color) {
  return String(color?.label || color?.name || color?.hex || "").trim();
}

function buildCatalogReferenceText(color) {
  if (!color) {
    return "";
  }

  const sourceLabel = String(color.sourceLabel || "").trim();

  if (sourceLabel) {
    return sourceLabel;
  }

  const code = String(color.code || "").trim();
  const label = getColorDisplayLabel(color);
  return [code, label].filter(Boolean).join(" ").trim() || label;
}

function buildCatalogCopyActionKey(scope, colorId) {
  return `${scope}:reference:${colorId}`;
}

function isKnownGroupId(groupId) {
  return HUE_GROUPS.some((group) => group.id === groupId);
}

function normalizeGroupFilterIds(values) {
  return [...new Set((Array.isArray(values) ? values : []).map((value) => String(value || "").trim()).filter(isKnownGroupId))];
}

function getStoredGroupFilterIds() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = normalizeGroupFilterIds(String(params.get("groups") || "").split(","));

  if (fromUrl.length) {
    return fromUrl;
  }

  try {
    const raw = window.localStorage.getItem(GROUP_FILTER_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    return normalizeGroupFilterIds(JSON.parse(raw));
  } catch {
    return [];
  }
}

function getStoredAutoAddSearchMatches() {
  try {
    return window.localStorage.getItem(AUTO_ADD_SEARCH_TO_CART_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function getSelectedGroupIdsInOrder() {
  return HUE_GROUPS.map((group) => group.id).filter((groupId) => state.selectedGroupIds.has(groupId));
}

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9#]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function compactSearchText(value) {
  return normalizeSearchText(value).replace(/\s+/g, "");
}

function tokenizeSearchText(value) {
  return normalizeSearchText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
}

function getUniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
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

  if (elements.catalogCartLink) {
    elements.catalogCartLink.textContent = `Panier sprays · ${sprayCount}`;
    elements.catalogCartLink.setAttribute(
      "aria-label",
      sprayCount ? `${formatCount(sprayCount, "spray")} dans le panier` : "Panier sprays vide",
    );
  }

  if (elements.catalogCartSummary) {
    elements.catalogCartSummary.innerHTML = `
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
  renderCatalogViews(state.currentCatalog);
  renderBulkSearchResults();
}

function addResolvedSearchResultsToCart(searchResults) {
  const matchedEntries = Array.isArray(searchResults?.entries)
    ? searchResults.entries.filter((entry) => entry?.resolution?.color?.id)
    : [];

  if (!matchedEntries.length) {
    return 0;
  }

  const additionsByColorId = new Map();

  for (const entry of matchedEntries) {
    const colorId = entry.resolution.color.id;
    additionsByColorId.set(colorId, (additionsByColorId.get(colorId) || 0) + 1);
  }

  const nextItems = state.cartItems.map((entry) => ({ ...entry }));
  let addedCount = 0;

  for (const [colorId, quantity] of additionsByColorId) {
    const current = nextItems.find((entry) => entry.colorId === colorId);

    if (current) {
      current.quantity += quantity;
    } else {
      nextItems.push({ colorId, quantity });
    }

    addedCount += quantity;
  }

  if (!addedCount) {
    return 0;
  }

  state.cartItems = nextItems;
  persistCart();
  renderCartStatus();
  renderCatalogViews(state.currentCatalog);
  return addedCount;
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

function rerenderCatalogReferenceActions() {
  renderCatalogViews(state.currentCatalog);
  renderBulkSearchResults();
}

function flashCopiedCatalogAction(actionKey) {
  state.copiedCatalogActionKey = actionKey;

  if (copiedCatalogActionTimer) {
    window.clearTimeout(copiedCatalogActionTimer);
  }

  rerenderCatalogReferenceActions();

  copiedCatalogActionTimer = window.setTimeout(() => {
    copiedCatalogActionTimer = 0;
    state.copiedCatalogActionKey = null;
    rerenderCatalogReferenceActions();
  }, 1400);
}

async function copyCatalogReference(color, scope) {
  if (!color) {
    return;
  }

  const copied = await copyTextToClipboard(buildCatalogReferenceText(color));

  if (!copied) {
    window.alert("Impossible de copier cette reference.");
    return;
  }

  flashCopiedCatalogAction(buildCatalogCopyActionKey(scope, color.id));
}

function isStrongSearchMatch(match) {
  return Boolean(match && ["code-exact", "label-exact", "code-detected"].includes(match.matchKind));
}

function isSpecialCatalogColor(color) {
  return /chrome|metal|metallic|transparent|effect|glitter|tar|varnish|primer|texture/i.test(
    [color.label, color.name, color.finish, color.family, color.sourceLabel].filter(Boolean).join(" "),
  );
}

function makeDomId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeManufacturerCatalog(catalog) {
  const manufacturer = catalog?.manufacturer;
  const colors = Array.isArray(catalog?.colors) ? catalog.colors : [];

  if (!manufacturer?.id || !manufacturer?.label) {
    throw new Error("Catalogue fabricant invalide.");
  }

  return {
    manufacturer,
    colors: colors.map((entry, index) => normalizeColor(entry, manufacturer, index)),
  };
}

function normalizeColor(entry, manufacturer, index) {
  const hex = String(entry?.hex || "").toUpperCase();

  if (!/^#[0-9A-F]{6}$/.test(hex)) {
    throw new Error(`Couleur invalide dans ${manufacturer.label} a l'index ${index + 1}.`);
  }

  const label = String(entry.label || [entry.code, entry.name].filter(Boolean).join(" ") || hex).trim();
  const code = String(entry.code || "").trim();
  const name = String(entry.name || label || code || hex).trim();
  const sourceLabel = String(entry.sourceLabel || label).trim();
  const hsl = hexToHsl(hex);
  const lab = hexToLab(hex);
  const searchAliases = getUniqueValues([
    code,
    name,
    label,
    sourceLabel,
    hex,
    [code, name].filter(Boolean).join(" "),
    [code, label].filter(Boolean).join(" "),
  ]);
  const normalizedAliases = getUniqueValues(searchAliases.map((value) => normalizeSearchText(value)));
  const compactAliases = getUniqueValues(searchAliases.map((value) => compactSearchText(value)));
  const searchTokens = getUniqueValues(searchAliases.flatMap((value) => tokenizeSearchText(value)));

  return {
    id: `${manufacturer.id}-${entry.id || code || index + 1}`,
    domId: makeDomId(`${manufacturer.id}-${entry.id || code || label || index + 1}`),
    code,
    name,
    label,
    hex,
    hsl,
    lab,
    textColor: getContrastingText(hex),
    finish: entry.finish || "",
    family: typeof entry?.meta?.family === "string" ? entry.meta.family : "",
    sourceLabel,
    brandId: manufacturer.id,
    brandLabel: manufacturer.label,
    searchCodeCompact: compactSearchText(code),
    searchAliases,
    normalizedAliases,
    compactAliases,
    searchTokens,
  };
}

function compareCodes(first, second) {
  return String(first || "").localeCompare(String(second || ""), undefined, { numeric: true, sensitivity: "base" });
}

function getColorGroupId(color) {
  const { h, s, l } = color.hsl;
  const lowerLabel = color.label.toLowerCase();

  if (/chrome|metallic|transparent|effect|glitter|tar|varnish/.test(lowerLabel)) {
    return "specials";
  }

  if (s < 0.12) {
    if (l >= 0.86) {
      return "whites";
    }
    if (l <= 0.18) {
      return "blacks";
    }
    return "grays";
  }

  if (l < 0.2) {
    return "blacks";
  }

  if (l < 0.46 && h >= 40 && h < 78) {
    return "olives";
  }

  if (l < 0.44 && h >= 12 && h < 45) {
    return "browns";
  }

  if (h >= 45 && h < 70) {
    return "yellows";
  }

  if (h >= 15 && h < 45) {
    return "oranges";
  }

  if (h < 15 || h >= 345) {
    return "reds";
  }

  if (h >= 300 && h < 345) {
    return "pinks";
  }

  if (h >= 250 && h < 300) {
    return "purples";
  }

  if (h >= 200 && h < 250) {
    return "blues";
  }

  if (h >= 165 && h < 200) {
    return "turquoises";
  }

  if (h >= 70 && h < 165) {
    return "greens";
  }

  return "specials";
}

function sortColorsInGroup(groupId, colors) {
  const sorted = [...colors];

  sorted.sort((first, second) => {
    const lightnessDelta = second.hsl.l - first.hsl.l;

    if (Math.abs(lightnessDelta) > 0.0001) {
      return lightnessDelta;
    }

    if (groupId === "whites" || groupId === "grays" || groupId === "blacks" || groupId === "specials") {
      return compareCodes(first.code, second.code) || first.label.localeCompare(second.label);
    }

    return second.hsl.s - first.hsl.s || first.hsl.h - second.hsl.h || compareCodes(first.code, second.code);
  });

  return sorted;
}

function groupColors(colors) {
  const grouped = new Map(HUE_GROUPS.map((group) => [group.id, []]));

  for (const color of colors) {
    grouped.get(getColorGroupId(color)).push(color);
  }

  return HUE_GROUPS.map((group) => ({
    ...group,
    colors: sortColorsInGroup(group.id, grouped.get(group.id)),
  })).filter((group) => group.colors.length > 0);
}

function getSelectedGroupsForCatalog(groups) {
  if (!groups.length) {
    return [];
  }

  return groups.filter((group) => state.selectedGroupIds.has(group.id));
}

function getVisibleGroups(groups) {
  const selectedGroups = getSelectedGroupsForCatalog(groups);
  return selectedGroups.length ? selectedGroups : groups;
}

function syncSelectedGroupsForCatalog(catalog) {
  const groups = groupColors(catalog?.colors || []);
  const availableIds = new Set(groups.map((group) => group.id));
  const nextSelected = getSelectedGroupIdsInOrder().filter((groupId) => availableIds.has(groupId));

  if (nextSelected.length === state.selectedGroupIds.size) {
    return;
  }

  state.selectedGroupIds = new Set(nextSelected);
  persistGroupFilters();
}

function getManifestEntry(manufacturerId) {
  return state.manifest.find((entry) => entry.id === manufacturerId) || null;
}

function getStoredViewMode() {
  try {
    const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return stored === "compact" || stored === "detailed" || stored === "both" ? stored : "both";
  } catch {
    return "both";
  }
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

function persistSelection(manufacturerId) {
  const url = new URL(window.location.href);
  url.searchParams.set("manufacturer", manufacturerId);
  window.history.replaceState({}, "", url);

  try {
    window.localStorage.setItem(SELECTION_STORAGE_KEY, manufacturerId);
  } catch {
    // Ignore storage failures and keep the page usable.
  }
}

function persistViewMode(viewMode) {
  try {
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  } catch {
    // Ignore storage failures and keep the page usable.
  }
}

function persistGroupFilters() {
  const url = new URL(window.location.href);
  const selected = getSelectedGroupIdsInOrder();

  if (selected.length) {
    url.searchParams.set("groups", selected.join(","));
  } else {
    url.searchParams.delete("groups");
  }

  window.history.replaceState({}, "", url);

  try {
    window.localStorage.setItem(GROUP_FILTER_STORAGE_KEY, JSON.stringify(selected));
  } catch {
    // Ignore storage failures and keep the page usable.
  }
}

function persistAutoAddSearchMatches(value) {
  try {
    window.localStorage.setItem(AUTO_ADD_SEARCH_TO_CART_STORAGE_KEY, value ? "true" : "false");
  } catch {
    // Ignore storage failures and keep the page usable.
  }
}

function cleanSearchLine(value) {
  return String(value || "")
    .replace(/^[\s\-–—•*]+/, "")
    .replace(/^\d+\s*[x×]\s*/i, "")
    .trim();
}

function splitBulkSearchInput(value) {
  return String(value || "")
    .split(/[\n\r\t;,]+/g)
    .map((entry) => cleanSearchLine(entry))
    .filter(Boolean);
}

function buildSearchResultLabel(matchKind) {
  switch (matchKind) {
    case "code-exact":
      return "Code exact";
    case "label-exact":
      return "Libelle exact";
    case "code-detected":
      return "Code detecte";
    case "alias-contains":
      return "Correspondance forte";
    case "token-match":
      return "Approximation";
    default:
      return "Correspondance";
  }
}

function scoreSearchCandidate(color, rawLine) {
  const query = cleanSearchLine(rawLine);
  const loose = normalizeSearchText(query);
  const compact = compactSearchText(query);
  const tokens = tokenizeSearchText(query);

  if (!loose || !compact || !tokens.length) {
    return null;
  }

  const compactTokens = new Set(tokens.map((token) => token.replace(/\s+/g, "")));
  const overlapCount = tokens.filter((token) => color.searchTokens.includes(token)).length;
  const coverage = overlapCount / tokens.length;

  if (color.searchCodeCompact && (compact === color.searchCodeCompact || compactTokens.has(color.searchCodeCompact))) {
    return { color, matchKind: "code-exact", score: 0, overlapCount, coverage };
  }

  if (color.normalizedAliases.includes(loose) || color.compactAliases.includes(compact)) {
    return { color, matchKind: "label-exact", score: 1, overlapCount, coverage };
  }

  if (color.searchCodeCompact && compact.includes(color.searchCodeCompact)) {
    return { color, matchKind: "code-detected", score: 2, overlapCount, coverage };
  }

  if (loose.length >= 4 && color.normalizedAliases.some((alias) => alias.includes(loose))) {
    return { color, matchKind: "alias-contains", score: 3, overlapCount, coverage };
  }

  if (tokens.length >= 2 && overlapCount >= 2 && coverage >= 0.66) {
    return { color, matchKind: "token-match", score: 4 + (1 - coverage), overlapCount, coverage };
  }

  return null;
}

function findColorForSearchLine(colors, rawLine) {
  const candidates = colors
    .map((color) => scoreSearchCandidate(color, rawLine))
    .filter(Boolean)
    .sort((first, second) => {
      if (first.score !== second.score) {
        return first.score - second.score;
      }

      if (first.overlapCount !== second.overlapCount) {
        return second.overlapCount - first.overlapCount;
      }

      if (first.coverage !== second.coverage) {
        return second.coverage - first.coverage;
      }

      return compareCodes(first.color.code, second.color.code) || first.color.label.localeCompare(second.color.label);
    });

  const best = candidates[0] || null;
  const second = candidates[1] || null;

  if (!best) {
    return null;
  }

  const weakMatch = best.matchKind === "alias-contains" || best.matchKind === "token-match";
  const similarAlternative =
    second &&
    second.score <= best.score + 0.2 &&
    second.overlapCount >= Math.max(0, best.overlapCount - 1);

  if (weakMatch && similarAlternative) {
    return null;
  }

  return best;
}

function analyzeBulkSearch(rawValue, catalog) {
  const lines = splitBulkSearchInput(rawValue);
  const entries = lines.map((line, index) => {
    const match = catalog ? findColorForSearchLine(catalog.colors, line) : null;

    return {
      index: index + 1,
      raw: line,
      resolution: match
        ? {
            type: "direct",
            color: match.color,
            matchKind: match.matchKind,
          }
        : null,
    };
  });
  const matchedEntries = entries.filter((entry) => entry.resolution);
  const unmatchedEntries = entries.filter((entry) => !entry.resolution);

  return {
    rawValue,
    entries,
    lineCount: entries.length,
    matchedCount: matchedEntries.length,
    unmatchedCount: unmatchedEntries.length,
    substitutionCount: 0,
    uniqueMatchCount: new Set(matchedEntries.map((entry) => entry.resolution.color.id)).size,
  };
}

function findExternalReferenceForSearchLine(catalogs, rawLine) {
  const candidates = catalogs
    .map((catalog) => {
      const match = findColorForSearchLine(catalog.colors, rawLine);

      if (!isStrongSearchMatch(match)) {
        return null;
      }

      return {
        catalog,
        manufacturer: catalog.manufacturer,
        match,
      };
    })
    .filter(Boolean)
    .sort((first, second) => {
      if (first.match.score !== second.match.score) {
        return first.match.score - second.match.score;
      }

      if (first.match.overlapCount !== second.match.overlapCount) {
        return second.match.overlapCount - first.match.overlapCount;
      }

      return (
        compareCodes(first.match.color.code, second.match.color.code) ||
        first.match.color.label.localeCompare(second.match.color.label)
      );
    });

  return candidates[0] || null;
}

function findNearestColorInCatalog(sourceColor, catalog) {
  if (!sourceColor || !catalog?.colors?.length) {
    return null;
  }

  const preferRegularPool = !isSpecialCatalogColor(sourceColor);
  const filteredPool = preferRegularPool
    ? catalog.colors.filter((color) => !isSpecialCatalogColor(color))
    : [...catalog.colors];
  const pool = filteredPool.length ? filteredPool : catalog.colors;
  const ranked = [...pool]
    .map((color) => ({
      color,
      distance: deltaE(sourceColor.lab, color.lab),
    }))
    .sort((first, second) => {
      if (first.distance !== second.distance) {
        return first.distance - second.distance;
      }

      return compareCodes(first.color.code, second.color.code) || first.color.label.localeCompare(second.color.label);
    });

  return ranked[0] || null;
}

async function analyzeBulkSearchWithFallback(rawValue, selectedCatalog) {
  const lines = splitBulkSearchInput(rawValue);

  if (!selectedCatalog) {
    return {
      rawValue,
      entries: lines.map((line, index) => ({
        index: index + 1,
        raw: line,
        resolution: null,
      })),
      lineCount: lines.length,
      matchedCount: 0,
      unmatchedCount: lines.length,
      substitutionCount: 0,
      uniqueMatchCount: 0,
    };
  }

  const otherCatalogs = await Promise.all(
    state.manifest
      .filter((entry) => entry.id !== selectedCatalog.manufacturer.id)
      .map((entry) => loadCatalog(entry.id)),
  );

  const entries = lines.map((line, index) => {
    const directMatch = findColorForSearchLine(selectedCatalog.colors, line);
    const externalReference = findExternalReferenceForSearchLine(otherCatalogs, line);
    const useDirect = isStrongSearchMatch(directMatch) || !externalReference;

    if (useDirect && directMatch) {
      return {
        index: index + 1,
        raw: line,
        resolution: {
          type: "direct",
          color: directMatch.color,
          matchKind: directMatch.matchKind,
        },
      };
    }

    if (externalReference) {
      const substitute = findNearestColorInCatalog(externalReference.match.color, selectedCatalog);

      if (substitute?.color) {
        return {
          index: index + 1,
          raw: line,
          resolution: {
            type: "substitution",
            color: substitute.color,
            distance: substitute.distance,
            sourceManufacturer: externalReference.manufacturer,
            sourceMatch: externalReference.match,
          },
        };
      }
    }

    if (directMatch) {
      return {
        index: index + 1,
        raw: line,
        resolution: {
          type: "direct",
          color: directMatch.color,
          matchKind: directMatch.matchKind,
        },
      };
    }

    return {
      index: index + 1,
      raw: line,
      resolution: null,
    };
  });
  const matchedEntries = entries.filter((entry) => entry.resolution);
  const unmatchedEntries = entries.filter((entry) => !entry.resolution);
  const substitutionEntries = entries.filter((entry) => entry.resolution?.type === "substitution");

  return {
    rawValue,
    entries,
    lineCount: entries.length,
    matchedCount: matchedEntries.length,
    unmatchedCount: unmatchedEntries.length,
    substitutionCount: substitutionEntries.length,
    uniqueMatchCount: new Set(matchedEntries.map((entry) => entry.resolution.color.id)).size,
  };
}

function renderBulkSearchControls() {
  const hasInput = Boolean(String(elements.catalogSearchInput?.value || "").trim());
  const busy = state.searchStatus === "loading";

  if (elements.catalogSearchAutoAdd) {
    elements.catalogSearchAutoAdd.disabled = busy;
    elements.catalogSearchAutoAdd.checked = state.autoAddSearchMatches;
  }

  if (elements.catalogSearchRun) {
    elements.catalogSearchRun.disabled = !state.currentCatalog || !hasInput || busy;
    elements.catalogSearchRun.textContent = busy ? "Recherche..." : "Retrouver la selection";
  }

  if (elements.catalogSearchClear) {
    elements.catalogSearchClear.disabled = busy || (!hasInput && !state.searchResults);
  }
}

function renderGroupIndex(selectedCatalog) {
  if (!elements.catalogGroupIndexShell || !elements.catalogGroupIndexSummary || !elements.catalogGroupIndex) {
    return;
  }

  const groups = groupColors(selectedCatalog?.colors || []);

  if (!groups.length) {
    elements.catalogGroupIndexShell.hidden = true;
    elements.catalogGroupIndexSummary.innerHTML = "";
    elements.catalogGroupIndex.innerHTML = "";
    return;
  }

  const selectedGroups = getSelectedGroupsForCatalog(groups);
  const activeCount = selectedGroups.length || groups.length;

  elements.catalogGroupIndexShell.hidden = false;
  elements.catalogGroupIndexSummary.innerHTML = `
    <span class="base-pill">${escapeHtml(formatCount(activeCount, "famille"))}</span>
    <span class="base-pill">${escapeHtml(selectedGroups.length ? "Filtre actif" : "Toutes les familles")}</span>
  `;
  elements.catalogGroupIndex.innerHTML = `
    <button
      class="catalog-group-filter ${selectedGroups.length === 0 ? "is-active" : ""}"
      type="button"
      data-group-filter-reset="true"
      aria-pressed="${selectedGroups.length === 0 ? "true" : "false"}"
    >
      <span>Toutes</span>
      <span class="catalog-group-filter-count">${escapeHtml(String(groups.length))}</span>
    </button>
    ${groups
      .map(
        (group) => `
          <button
            class="catalog-group-filter ${state.selectedGroupIds.has(group.id) ? "is-active" : ""}"
            type="button"
            data-group-filter-id="${escapeHtml(group.id)}"
            aria-pressed="${state.selectedGroupIds.has(group.id) ? "true" : "false"}"
          >
            <span>${escapeHtml(group.label)}</span>
            <span class="catalog-group-filter-count">${escapeHtml(String(group.colors.length))}</span>
          </button>
        `,
      )
      .join("")}
  `;
}

function renderBulkSearchResults() {
  renderBulkSearchControls();

  if (!elements.catalogSearchResultsShell || !elements.catalogSearchResultsSummary || !elements.catalogSearchResults) {
    return;
  }

  if (state.searchStatus === "loading") {
    elements.catalogSearchResultsShell.hidden = false;
    elements.catalogSearchResultsSummary.innerHTML = `<span class="base-pill">Recherche multi-marques</span>`;
    elements.catalogSearchResults.innerHTML = `
      <article class="catalog-search-row">
        <div class="catalog-search-query">
          <div class="catalog-search-query-line">
            <span class="catalog-search-line-number">...</span>
            <span class="catalog-search-line-text">Analyse des references et substitutions en cours.</span>
          </div>
        </div>
      </article>
    `;
    return;
  }

  if (!state.searchResults?.entries?.length) {
    elements.catalogSearchResultsShell.hidden = true;
    elements.catalogSearchResultsSummary.innerHTML = "";
    elements.catalogSearchResults.innerHTML = "";
    return;
  }

  const { lineCount, matchedCount, unmatchedCount, substitutionCount, uniqueMatchCount, entries } = state.searchResults;

  elements.catalogSearchResultsShell.hidden = false;
  elements.catalogSearchResultsSummary.innerHTML = `
    <span class="base-pill">${escapeHtml(formatCount(lineCount, "ligne"))}</span>
    <span class="base-pill">${escapeHtml(formatCount(matchedCount, "correspondance"))}</span>
    <span class="base-pill">${escapeHtml(formatCount(uniqueMatchCount, "reference"))}</span>
    <span class="base-pill">${escapeHtml(formatCount(substitutionCount, "substitution"))}</span>
    <span class="base-pill">${escapeHtml(formatCount(unmatchedCount, "introuvable"))}</span>
  `;
  elements.catalogSearchResults.innerHTML = entries
    .map((entry) => {
      if (!entry.resolution) {
        return `
          <article class="catalog-search-row is-miss">
            <div class="catalog-search-query">
              <div class="catalog-search-query-line">
                <span class="catalog-search-line-number">L${escapeHtml(String(entry.index))}</span>
                <span class="catalog-search-line-text">${escapeHtml(entry.raw)}</span>
              </div>
            </div>
            <div class="catalog-search-result">
              <span class="catalog-search-miss-copy">Aucune correspondance trouvee dans ce fabricant.</span>
            </div>
            <div class="catalog-search-actions-row">
              <span class="meta-pill">Introuvable</span>
            </div>
          </article>
        `;
      }

      const { color } = entry.resolution;
      const cartQuantity = getCartQuantity(color.id);
      const cartLabel = cartQuantity > 0 ? `Ajouter au panier · x${cartQuantity}` : "Ajouter au panier";
      const title = [color.code, color.label].filter(Boolean).join(" · ");
      const copyReferenceActionKey = buildCatalogCopyActionKey("search", color.id);
      const copyReferenceLabel = state.copiedCatalogActionKey === copyReferenceActionKey ? "Copie" : "Copier ref";
      const isSubstitution = entry.resolution.type === "substitution";
      const resultBadge = isSubstitution
        ? `Substitution depuis ${entry.resolution.sourceManufacturer.label}`
        : buildSearchResultLabel(entry.resolution.matchKind);
      const resultMeta = isSubstitution
        ? `${entry.resolution.sourceMatch.color.brandLabel} · ${
            [entry.resolution.sourceMatch.color.code, entry.resolution.sourceMatch.color.label].filter(Boolean).join(" · ")
          } · DeltaE ${entry.resolution.distance.toFixed(1)}`
        : color.sourceLabel || color.name;

      return `
        <article class="catalog-search-row">
          <div class="catalog-search-query">
            <div class="catalog-search-query-line">
              <span class="catalog-search-line-number">L${escapeHtml(String(entry.index))}</span>
              <span class="catalog-search-line-text">${escapeHtml(entry.raw)}</span>
            </div>
          </div>
          <div class="catalog-search-result">
            <div class="catalog-search-result-main">
              <span class="catalog-search-swatch" style="background:${color.hex}"></span>
              <div class="catalog-search-result-copy">
                <strong>${escapeHtml(title || color.hex)}</strong>
                <span>${escapeHtml(resultMeta)}</span>
              </div>
            </div>
          </div>
          <div class="catalog-search-actions-row">
            <span class="meta-pill">${escapeHtml(resultBadge)}</span>
            <button
              class="cart-action"
              type="button"
              data-search-focus-dom-id="${escapeHtml(color.domId)}"
            >
              Voir
            </button>
            <button
              class="cart-action match-action match-copy-action ${state.copiedCatalogActionKey === copyReferenceActionKey ? "is-copied" : ""}"
              type="button"
              data-search-copy-color-id="${escapeHtml(color.id)}"
            >
              ${escapeHtml(copyReferenceLabel)}
            </button>
            <button
              class="cart-action catalog-cart-button ${cartQuantity > 0 ? "is-in-cart" : ""}"
              type="button"
              data-search-cart-color-id="${escapeHtml(color.id)}"
            >
              ${escapeHtml(cartLabel)}
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

async function runBulkSearch(options = {}) {
  const { userTriggered = false } = options;
  state.searchRaw = String(elements.catalogSearchInput?.value || "");

  if (!String(state.searchRaw).trim()) {
    state.searchResults = null;
    state.searchStatus = "idle";
    renderBulkSearchResults();
    return;
  }

  const runId = state.searchRunId + 1;
  state.searchRunId = runId;
  state.searchStatus = "loading";
  renderBulkSearchResults();

  try {
    const nextResults = await analyzeBulkSearchWithFallback(state.searchRaw, state.currentCatalog);

    if (state.searchRunId !== runId) {
      return;
    }

    state.searchResults = nextResults;
    state.searchStatus = "idle";

    if (userTriggered && state.autoAddSearchMatches) {
      const addedCount = addResolvedSearchResultsToCart(nextResults);
      renderFeedback(
        addedCount
          ? `${formatCount(addedCount, "spray")} ajoutes au panier depuis la recherche.`
          : "Aucune correspondance ajoutee au panier.",
      );
    }

    renderBulkSearchResults();
  } catch {
    if (state.searchRunId !== runId) {
      return;
    }

    state.searchResults = analyzeBulkSearch(state.searchRaw, state.currentCatalog);
    state.searchStatus = "idle";

    if (userTriggered && state.autoAddSearchMatches) {
      const addedCount = addResolvedSearchResultsToCart(state.searchResults);
      renderFeedback(
        addedCount
          ? `${formatCount(addedCount, "spray")} ajoutes au panier depuis la recherche.`
          : "Aucune correspondance ajoutee au panier.",
      );
    }

    renderBulkSearchResults();
  }
}

function clearBulkSearch() {
  state.searchRaw = "";
  state.searchResults = null;
  state.searchStatus = "idle";

  if (elements.catalogSearchInput) {
    elements.catalogSearchInput.value = "";
  }

  renderBulkSearchResults();
}

function renderTopbarMeta(selectedCatalog) {
  const manufacturerCount = state.manifest.length;
  const colorCount = selectedCatalog ? selectedCatalog.colors.length : 0;
  const groupCount = selectedCatalog ? groupColors(selectedCatalog.colors).length : 0;

  elements.catalogTopbarMeta.innerHTML = `
    <span class="meta-pill">${escapeHtml(formatCount(manufacturerCount, "fabricant"))}</span>
    <span class="meta-pill">${escapeHtml(formatCount(colorCount, "reference"))}</span>
    <span class="meta-pill">${escapeHtml(formatCount(groupCount, "famille"))}</span>
  `;
}

function renderSelectionSummary(selectedCatalog) {
  if (!selectedCatalog) {
    elements.catalogSelectionSummary.innerHTML = "";
    return;
  }

  const pills = [
    `<span class="base-pill">${escapeHtml(selectedCatalog.manufacturer.label)}</span>`,
  ];

  if (selectedCatalog.manufacturer.series) {
    pills.push(`<span class="base-pill">${escapeHtml(selectedCatalog.manufacturer.series)}</span>`);
  }

  pills.push(`<span class="base-pill">${escapeHtml(formatCount(selectedCatalog.colors.length, "couleur"))}</span>`);
  elements.catalogSelectionSummary.innerHTML = pills.join("");
}

function renderCatalogHeader(selectedCatalog) {
  if (!selectedCatalog) {
    elements.catalogTitle.textContent = "Catalogue indisponible";
    elements.catalogSubtitle.textContent = "";
    elements.catalogSummary.innerHTML = "";
    document.title = "Catalogue fabricants de sprays";
    return;
  }

  const { manufacturer, colors } = selectedCatalog;
  const groups = groupColors(colors);
  const summaryPills = [
    `<span class="base-pill">${escapeHtml(formatCount(colors.length, "reference"))}</span>`,
    `<span class="base-pill">${escapeHtml(formatCount(groups.length, "famille chromatique", "familles chromatiques"))}</span>`,
  ];

  if (manufacturer.series) {
    summaryPills.push(`<span class="base-pill">${escapeHtml(manufacturer.series)}</span>`);
  }

  elements.catalogTitle.textContent = manufacturer.label;
  elements.catalogSubtitle.textContent = manufacturer.source?.name
    ? `${manufacturer.source.name}${manufacturer.source.note ? ` · ${manufacturer.source.note}` : ""}`
    : "Toutes les couleurs de la marque, classees par famille visuelle.";
  elements.catalogSummary.innerHTML = summaryPills.join("");
  document.title = `${manufacturer.label} · Catalogue sprays`;
}

function renderFeedback(message, isError = false) {
  elements.catalogFeedback.textContent = message || "";
  elements.catalogFeedback.classList.toggle("is-error", Boolean(message && isError));
  elements.catalogFeedback.hidden = !message;
}

function renderViewModeControls() {
  for (const button of elements.viewModeButtons) {
    const active = button.dataset.viewMode === state.viewMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  }
}

function applyViewMode() {
  elements.catalogCompactShell.hidden = state.viewMode === "detailed";
  elements.catalogGroups.hidden = state.viewMode === "compact";
}

function setViewMode(viewMode) {
  if (!["both", "compact", "detailed"].includes(viewMode)) {
    return;
  }

  state.viewMode = viewMode;
  persistViewMode(viewMode);
  renderViewModeControls();
  applyViewMode();
}

function getCompactChipBorderColor(color) {
  if (color.hsl.l > 0.86) {
    return "rgba(15, 23, 42, 0.28)";
  }

  if (color.hsl.l < 0.22) {
    return "rgba(255, 255, 255, 0.34)";
  }

  return "rgba(255, 255, 255, 0.42)";
}

function buildCompactColorLabel(color) {
  return [color.code, color.name || color.label, color.hex].filter(Boolean).join(" · ");
}

function renderCompactGroups(selectedCatalog) {
  if (!selectedCatalog) {
    elements.catalogCompactGroups.innerHTML = "";
    return;
  }

  const groups = getVisibleGroups(groupColors(selectedCatalog.colors));

  elements.catalogCompactGroups.innerHTML = groups
    .map(
      (group) => `
        <section class="catalog-compact-group">
          <div class="catalog-group-head">
            <div>
              <h3 class="catalog-group-title">${escapeHtml(group.label)}</h3>
              <p class="catalog-subtitle">${escapeHtml(formatCount(group.colors.length, "reference"))}</p>
            </div>
          </div>
          <div class="catalog-compact-row">
            ${group.colors
              .map(
                (color) => `
                  <a
                    class="catalog-compact-chip ${getCartQuantity(color.id) > 0 ? "is-in-cart" : ""}"
                    href="#${escapeHtml(color.domId)}"
                    data-color-dom-id="${escapeHtml(color.domId)}"
                    title="${escapeHtml(
                      getCartQuantity(color.id) > 0
                        ? `${buildCompactColorLabel(color)} · panier x${getCartQuantity(color.id)}`
                        : buildCompactColorLabel(color),
                    )}"
                    aria-label="${escapeHtml(
                      getCartQuantity(color.id) > 0
                        ? `${buildCompactColorLabel(color)} · panier x${getCartQuantity(color.id)}`
                        : buildCompactColorLabel(color),
                    )}"
                    style="background:${color.hex}; border-color:${getCompactChipBorderColor(color)}"
                  ></a>
                `,
              )
              .join("")}
          </div>
        </section>
      `,
    )
    .join("");
}

function renderGroups(selectedCatalog) {
  if (!selectedCatalog) {
    elements.catalogGroups.innerHTML = "";
    return;
  }

  const groups = getVisibleGroups(groupColors(selectedCatalog.colors));

  elements.catalogGroups.innerHTML = groups
    .map(
      (group) => `
        <section class="catalog-group">
          <div class="catalog-group-head">
            <div>
              <h3 class="catalog-group-title">${escapeHtml(group.label)}</h3>
              <p class="catalog-subtitle">${escapeHtml(formatCount(group.colors.length, "reference"))}</p>
            </div>
          </div>
          <div class="catalog-color-grid">
            ${group.colors.map(renderColorCard).join("")}
          </div>
        </section>
      `,
    )
    .join("");
}

function renderCatalogViews(selectedCatalog) {
  renderGroupIndex(selectedCatalog);
  renderCompactGroups(selectedCatalog);
  renderGroups(selectedCatalog);
  applyViewMode();
}

function renderColorCard(color) {
  const cartQuantity = getCartQuantity(color.id);
  const cartLabel = cartQuantity > 0 ? `Ajouter au panier · x${cartQuantity}` : "Ajouter au panier";
  const copyReferenceActionKey = buildCatalogCopyActionKey("card", color.id);
  const copyReferenceLabel = state.copiedCatalogActionKey === copyReferenceActionKey ? "Copie" : "Copier ref";
  const pills = [
    `<span class="meta-pill">${escapeHtml(color.hex)}</span>`,
  ];

  if (color.code) {
    pills.push(`<span class="meta-pill">${escapeHtml(color.code)}</span>`);
  }

  if (color.family) {
    pills.push(`<span class="meta-pill">${escapeHtml(`Famille ${color.family}`)}</span>`);
  }

  if (color.finish) {
    pills.push(`<span class="meta-pill">${escapeHtml(color.finish)}</span>`);
  }

  return `
    <article id="${escapeHtml(color.domId)}" class="catalog-color-card ${cartQuantity > 0 ? "is-in-cart" : ""}">
      <div class="catalog-color-swatch" style="background:${color.hex}; color:${color.textColor}">
        <span class="catalog-color-code">${escapeHtml(color.code || "Sans code")}</span>
        <span class="catalog-color-hex">${escapeHtml(color.hex)}</span>
      </div>
      <div class="catalog-color-body">
        <h4 class="catalog-color-title">${escapeHtml(color.label)}</h4>
        <p class="catalog-color-meta">${escapeHtml(color.sourceLabel || color.name)}</p>
        <div class="catalog-color-pills">${pills.join("")}</div>
        ${
          cartQuantity > 0
            ? `<div class="catalog-color-pills"><span class="match-cart-badge">${escapeHtml(`Panier x${cartQuantity}`)}</span></div>`
            : ""
        }
        <div class="catalog-color-actions">
          <button
            class="cart-action match-action match-copy-action ${state.copiedCatalogActionKey === copyReferenceActionKey ? "is-copied" : ""}"
            type="button"
            data-catalog-copy-color-id="${escapeHtml(color.id)}"
          >
            ${escapeHtml(copyReferenceLabel)}
          </button>
          <button
            class="cart-action catalog-cart-button ${cartQuantity > 0 ? "is-in-cart" : ""}"
            type="button"
            data-catalog-cart-color-id="${escapeHtml(color.id)}"
          >
            ${escapeHtml(cartLabel)}
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderManufacturerOptions() {
  elements.manufacturerSelect.innerHTML = state.manifest
    .map((entry) => `<option value="${escapeHtml(entry.id)}">${escapeHtml(entry.label)}</option>`)
    .join("");

  if (state.selectedManufacturerId) {
    elements.manufacturerSelect.value = state.selectedManufacturerId;
  }
}

function focusColorCard(domId) {
  const revealDetailed = state.viewMode === "compact";
  const color = state.currentCatalog?.colors.find((entry) => entry.domId === domId) || null;

  if (revealDetailed) {
    setViewMode("both");
  }

  if (color) {
    const groupId = getColorGroupId(color);
    const groups = groupColors(state.currentCatalog?.colors || []);
    const selectedGroups = getSelectedGroupsForCatalog(groups);

    if (selectedGroups.length && !state.selectedGroupIds.has(groupId)) {
      state.selectedGroupIds.add(groupId);
      persistGroupFilters();
      renderCatalogViews(state.currentCatalog);
    }
  }

  window.requestAnimationFrame(() => {
    const card = document.getElementById(domId);

    if (!card) {
      return;
    }

    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.classList.add("is-focused");

    if (focusedColorTimer) {
      window.clearTimeout(focusedColorTimer);
    }

    focusedColorTimer = window.setTimeout(() => {
      card.classList.remove("is-focused");
      focusedColorTimer = 0;
    }, 1600);
  });
}

function getCurrentCatalogColor(colorId) {
  return state.currentCatalog?.colors.find((color) => color.id === colorId) || null;
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

async function selectManufacturer(manufacturerId) {
  state.selectedManufacturerId = manufacturerId;
  elements.manufacturerSelect.value = manufacturerId;
  persistSelection(manufacturerId);
  renderFeedback("Chargement du catalogue...");

  try {
    const catalog = await loadCatalog(manufacturerId);
    state.currentCatalog = catalog;
    syncSelectedGroupsForCatalog(catalog);
    renderTopbarMeta(catalog);
    renderSelectionSummary(catalog);
    renderCatalogHeader(catalog);
    renderCatalogViews(catalog);
    if (String(state.searchRaw).trim()) {
      await runBulkSearch();
    } else {
      state.searchResults = null;
      state.searchStatus = "idle";
      renderBulkSearchResults();
    }
    renderFeedback("");
  } catch (error) {
    state.currentCatalog = null;
    renderTopbarMeta(null);
    renderSelectionSummary(null);
    renderCatalogHeader(null);
    renderCatalogViews(null);
    state.searchResults = String(state.searchRaw).trim() ? analyzeBulkSearch(state.searchRaw, null) : null;
    state.searchStatus = "idle";
    renderBulkSearchResults();
    renderFeedback(error.message || "Erreur de chargement du catalogue.", true);
  }
}

async function boot() {
  renderFeedback("Chargement des fabricants...");
  state.selectedGroupIds = new Set(getStoredGroupFilterIds());
  state.autoAddSearchMatches = getStoredAutoAddSearchMatches();
  loadCartFromStorage();
  renderCartStatus();
  state.viewMode = getStoredViewMode();
  renderViewModeControls();
  applyViewMode();
  renderBulkSearchControls();

  try {
    await loadManifest();
    const storedSelection = getStoredSelection();
    const initialSelection = getManifestEntry(storedSelection)?.id || state.manifest[0].id;

    renderManufacturerOptions();
    elements.manufacturerSelect.addEventListener("change", (event) => {
      selectManufacturer(event.currentTarget.value);
    });
    elements.catalogSearchInput.addEventListener("input", () => {
      state.searchRaw = elements.catalogSearchInput.value;
      renderBulkSearchControls();

      if (!String(state.searchRaw).trim()) {
        state.searchResults = null;
        renderBulkSearchResults();
      }
    });
    elements.catalogSearchInput.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        void runBulkSearch({ userTriggered: true });
      }
    });
    elements.catalogSearchAutoAdd?.addEventListener("change", (event) => {
      state.autoAddSearchMatches = Boolean(event.currentTarget.checked);
      persistAutoAddSearchMatches(state.autoAddSearchMatches);
      renderBulkSearchControls();
    });
    elements.catalogSearchRun.addEventListener("click", () => {
      void runBulkSearch({ userTriggered: true });
    });
    elements.catalogSearchClear.addEventListener("click", clearBulkSearch);
    elements.viewModeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setViewMode(button.dataset.viewMode);
      });
    });
    elements.catalogGroupIndex.addEventListener("click", (event) => {
      const resetButton = event.target.closest("[data-group-filter-reset]");

      if (resetButton) {
        state.selectedGroupIds = new Set();
        persistGroupFilters();
        renderCatalogViews(state.currentCatalog);
        return;
      }

      const filterButton = event.target.closest("[data-group-filter-id]");

      if (!filterButton) {
        return;
      }

      const groupId = filterButton.dataset.groupFilterId;

      if (!isKnownGroupId(groupId)) {
        return;
      }

      if (state.selectedGroupIds.has(groupId)) {
        state.selectedGroupIds.delete(groupId);
      } else {
        state.selectedGroupIds.add(groupId);
      }

      persistGroupFilters();
      renderCatalogViews(state.currentCatalog);
    });
    elements.catalogCompactGroups.addEventListener("click", (event) => {
      const chip = event.target.closest("[data-color-dom-id]");

      if (!chip) {
        return;
      }

      event.preventDefault();
      focusColorCard(chip.dataset.colorDomId);
    });
    elements.catalogGroups.addEventListener("click", (event) => {
      const copyButton = event.target.closest("[data-catalog-copy-color-id]");

      if (copyButton) {
        const color = getCurrentCatalogColor(copyButton.dataset.catalogCopyColorId);

        if (color) {
          void copyCatalogReference(color, "card");
        }
        return;
      }

      const cartButton = event.target.closest("[data-catalog-cart-color-id]");

      if (!cartButton || !state.currentCatalog) {
        return;
      }

      const color = state.currentCatalog.colors.find((entry) => entry.id === cartButton.dataset.catalogCartColorId);

      if (color) {
        addColorToCart(color);
      }
    });
    elements.catalogSearchResults.addEventListener("click", (event) => {
      const focusButton = event.target.closest("[data-search-focus-dom-id]");

      if (focusButton) {
        focusColorCard(focusButton.dataset.searchFocusDomId);
        return;
      }

      const copyButton = event.target.closest("[data-search-copy-color-id]");

      if (copyButton) {
        const color = getCurrentCatalogColor(copyButton.dataset.searchCopyColorId);

        if (color) {
          void copyCatalogReference(color, "search");
        }
        return;
      }

      const cartButton = event.target.closest("[data-search-cart-color-id]");

      if (!cartButton || !state.currentCatalog) {
        return;
      }

      const color = state.currentCatalog.colors.find((entry) => entry.id === cartButton.dataset.searchCartColorId);

      if (color) {
        addColorToCart(color);
      }
    });
    window.addEventListener("storage", (event) => {
      if (event.key && event.key !== CART_STORAGE_KEY) {
        return;
      }

      loadCartFromStorage();
      renderCartStatus();
      renderCatalogViews(state.currentCatalog);
      renderBulkSearchResults();
    });

    await selectManufacturer(initialSelection);
  } catch (error) {
    state.currentCatalog = null;
    renderTopbarMeta(null);
    renderSelectionSummary(null);
    renderCatalogHeader(null);
    renderCatalogViews(null);
    renderBulkSearchResults();
    renderFeedback(error.message || "Erreur au demarrage de la page catalogue.", true);
  }
}

boot();
