import {
  clamp,
  deltaE,
  getContrastingText,
  hexToHsl,
  hexToLab,
  hslToHex,
  normalizeHue,
} from "./color-utils.js";
import { THEORIES, THEORY_SECTIONS } from "./theories.js";
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  getLocaleTag,
  getTheoryAliasEntries,
  getLocalizedTheory,
  getLocalizedTheorySection,
  localizeGeneratedText,
  t,
} from "./i18n.js";

const DEFAULT_MANUFACTURER_ACCENTS = [
  "#0F8F63",
  "#7F858F",
  "#FF9F1C",
  "#3A86FF",
  "#FB5607",
  "#90BE6D",
];

const CART_STORAGE_KEY = "spray-color-wheel.cart";
const LANGUAGE_STORAGE_KEY = "spray-color-wheel.language";
const APP_STATE_STORAGE_KEY = "spray-color-wheel.state";
const WHEEL_RADIUS = 142;
const IMAGE_SAMPLE_MAX_SIDE = 960;
const IMAGE_PREVIEW_FALLBACK_WIDTH = 320;
const IMAGE_PREVIEW_MAX_HEIGHT = 260;
const IMAGE_MODAL_FALLBACK_WIDTH = 860;
const IMAGE_MODAL_FALLBACK_HEIGHT = 680;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const SIDEBAR_TABS = new Set(["image-upload", "image-palette", "cart", "hue"]);
const THEORY_BY_ID = new Map(THEORIES.map((theory) => [theory.id, theory]));
const THEORY_ALIAS_ENTRIES = getTheoryAliasEntries()
  .flatMap((entry) =>
    entry.aliases.map((alias) => ({
      theoryId: entry.id,
      alias,
      lowerAlias: alias.toLowerCase(),
    })),
  )
  .sort((first, second) => second.alias.length - first.alias.length);

let persistedAppSnapshot = null;
let persistAppStateTimer = 0;

const state = {
  manufacturers: [],
  allColors: [],
  language: DEFAULT_LANGUAGE,
  selectedBrands: new Set(),
  activeTheoryIds: new Set(["complementary"]),
  cartItems: [],
  imageAsset: null,
  imagePalette: [],
  imageSampleColor: null,
  activeSidebarTab: "hue",
  isImageModalOpen: false,
  activeColorTooltipId: null,
  expandedAlgoIds: new Set(),
  base: {
    h: 24,
    s: 0.82,
    l: 0.5,
  },
  baseOrigin: null,
  pickerSearch: "",
  draggingWheel: false,
  isControlMenuOpen: false,
};

const elements = {
  appShell: document.querySelector(".app-shell"),
  controlPanel: document.querySelector(".control-panel"),
  controlMenuToggle: document.querySelector("#control-menu-toggle"),
  controlMenuBackdrop: document.querySelector("#control-menu-backdrop"),
  controlMenuEyebrow: document.querySelector("#control-menu-eyebrow"),
  controlMenuTitle: document.querySelector("#control-menu-title"),
  controlMenuClose: document.querySelector("#control-menu-close"),
  topbarEyebrow: document.querySelector("#topbar-eyebrow"),
  topbarTitle: document.querySelector("#topbar-title"),
  topbarMeta: document.querySelector("#topbar-meta"),
  languageLabel: document.querySelector("#language-label"),
  languageSelect: document.querySelector("#language-select"),
  algorithmsLabel: document.querySelector("#algorithms-label"),
  manufacturersLabel: document.querySelector("#manufacturers-label"),
  baseControlsLabel: document.querySelector("#base-controls-label"),
  sidebarTabButtons: Array.from(document.querySelectorAll("[data-side-tab]")),
  sidebarTabImageUploadLabel: document.querySelector("#sidebar-tab-image-upload-label"),
  sidebarTabImagePaletteLabel: document.querySelector("#sidebar-tab-image-palette-label"),
  sidebarTabCartLabel: document.querySelector("#sidebar-tab-cart-label"),
  sidebarTabHueLabel: document.querySelector("#sidebar-tab-hue-label"),
  sidebarPanels: {
    "image-upload": document.querySelector("#sidebar-panel-image-upload"),
    "image-palette": document.querySelector("#sidebar-panel-image-palette"),
    cart: document.querySelector("#sidebar-panel-cart"),
    hue: document.querySelector("#sidebar-panel-hue"),
  },
  hexLabel: document.querySelector("#hex-label"),
  hueLabel: document.querySelector("#hue-label"),
  saturationLabel: document.querySelector("#saturation-label"),
  lightnessLabel: document.querySelector("#lightness-label"),
  pickerLabel: document.querySelector("#picker-label"),
  imageLabel: document.querySelector("#image-label"),
  imageUploadLabel: document.querySelector("#image-upload-label"),
  imageHint: document.querySelector("#image-hint"),
  imageInput: document.querySelector("#image-input"),
  imageClear: document.querySelector("#image-clear"),
  imagePaletteReset: document.querySelector("#image-palette-reset"),
  imageStage: document.querySelector("#image-stage"),
  imageEmpty: document.querySelector("#image-empty"),
  imageCanvas: document.querySelector("#image-canvas"),
  imageCrosshair: document.querySelector("#image-crosshair"),
  imageOpenModal: document.querySelector("#image-open-modal"),
  imageSample: document.querySelector("#image-sample"),
  imageSaveColor: document.querySelector("#image-save-color"),
  imageInlinePaletteLabel: document.querySelector("#image-inline-palette-label"),
  imageInlinePalette: document.querySelector("#image-inline-palette"),
  imagePaletteLabel: document.querySelector("#image-palette-label"),
  imagePalette: document.querySelector("#image-palette"),
  imageModal: document.querySelector("#image-modal"),
  imageModalEyebrow: document.querySelector("#image-modal-eyebrow"),
  imageModalTitle: document.querySelector("#image-modal-title"),
  imageModalClose: document.querySelector("#image-modal-close"),
  imageModalHint: document.querySelector("#image-modal-hint"),
  imageModalStage: document.querySelector("#image-modal-stage"),
  imageModalEmpty: document.querySelector("#image-modal-empty"),
  imageModalCanvas: document.querySelector("#image-modal-canvas"),
  imageModalCrosshair: document.querySelector("#image-modal-crosshair"),
  imageModalSample: document.querySelector("#image-modal-sample"),
  imageModalSaveColor: document.querySelector("#image-modal-save-color"),
  imageModalPaletteLabel: document.querySelector("#image-modal-palette-label"),
  imageModalPalette: document.querySelector("#image-modal-palette"),
  theoryGroups: document.querySelector("#theory-groups"),
  brandPresets: document.querySelector("#brand-presets"),
  brandToggles: document.querySelector("#brand-toggles"),
  hexInput: document.querySelector("#hex-input"),
  hueRange: document.querySelector("#hue-range"),
  satRange: document.querySelector("#sat-range"),
  lightRange: document.querySelector("#light-range"),
  hueValue: document.querySelector("#hue-value"),
  satValue: document.querySelector("#sat-value"),
  lightValue: document.querySelector("#light-value"),
  pickerSearch: document.querySelector("#picker-search"),
  pickerResults: document.querySelector("#picker-results"),
  cartSummary: document.querySelector("#cart-summary"),
  cartList: document.querySelector("#cart-list"),
  cartDownload: document.querySelector("#cart-download"),
  cartClear: document.querySelector("#cart-clear"),
  cartLabel: document.querySelector("#cart-label"),
  cartCopy: document.querySelector("#cart-copy"),
  ruleTitle: document.querySelector("#rule-title"),
  ruleFormula: document.querySelector("#rule-formula"),
  ruleDescription: document.querySelector("#rule-description"),
  wheelEyebrow: document.querySelector("#wheel-eyebrow"),
  wheelPanel: document.querySelector(".wheel-panel"),
  wheelShell: document.querySelector("#wheel-shell"),
  wheelSvg: document.querySelector("#wheel-svg"),
  cartPanel: document.querySelector(".cart-panel"),
  baseCaption: document.querySelector("#base-caption"),
  theoryNote: document.querySelector("#theory-note"),
  paletteEyebrow: document.querySelector("#palette-eyebrow"),
  paletteTitle: document.querySelector("#palette-title"),
  paletteSummary: document.querySelector("#palette-summary"),
  paletteReference: document.querySelector("#palette-reference"),
  swatchStrip: document.querySelector("#swatch-strip"),
};

const escapeHtmlMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => escapeHtmlMap[character]);
}

function ui(key, params = {}) {
  return t(state.language, key, params);
}

function countText(key, count) {
  return ui(`count.${key}`, { count });
}

function getLocalizedTheoryEntry(theory) {
  return getLocalizedTheory(theory, state.language);
}

function getLocalizedTheorySections() {
  return THEORY_SECTIONS.map((section) => getLocalizedTheorySection(section, state.language));
}

function localizeOutputText(value) {
  return localizeGeneratedText(value, state.language);
}

function formatLanguageDate(value) {
  return new Intl.DateTimeFormat(getLocaleTag(state.language), {
    dateStyle: "long",
    timeStyle: "short",
  }).format(value);
}

function loadLanguageFromStorage() {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (SUPPORTED_LANGUAGES.some((language) => language.id === stored)) {
      state.language = stored;
    }
  } catch {
    state.language = DEFAULT_LANGUAGE;
  }
}

function persistLanguage() {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, state.language);
  } catch {
    // Ignore storage failures and keep the in-memory language.
  }
}

function sanitizePersistedBase(input) {
  if (!input || typeof input !== "object") {
    return null;
  }

  const h = Number(input.h);
  const s = Number(input.s);
  const l = Number(input.l);

  if (!Number.isFinite(h) || !Number.isFinite(s) || !Number.isFinite(l)) {
    return null;
  }

  return {
    h: normalizeHue(h),
    s: clamp(s, 0, 1),
    l: clamp(l, 0, 1),
  };
}

function normalizeStoredImageColor(input) {
  if (!input || typeof input !== "object" || typeof input.id !== "string" || typeof input.hex !== "string") {
    return null;
  }

  const normalizedHex = input.hex.startsWith("#") ? input.hex : `#${input.hex}`;

  if (!/^#[0-9A-F]{6}$/i.test(normalizedHex)) {
    return null;
  }

  return buildColorRecord({
    id: input.id,
    brandId: "image",
    brandLabel: "image",
    name: input.name || input.label || normalizedHex,
    code: "",
    label: input.label || input.name || normalizedHex,
    hex: normalizedHex,
    searchTerms: [],
    meta: input.meta && typeof input.meta === "object" ? input.meta : {},
  });
}

function serializeImageColor(color) {
  if (!color) {
    return null;
  }

  return {
    id: color.id,
    name: color.name,
    label: color.label,
    hex: color.hex,
    meta: color.meta || {},
  };
}

function buildStoredImageDataUrl(sampleCanvas) {
  if (!sampleCanvas) {
    return "";
  }

  try {
    return sampleCanvas.toDataURL("image/png");
  } catch {
    return "";
  }
}

function serializeImageAsset() {
  if (!state.imageAsset) {
    return null;
  }

  const dataUrl = state.imageAsset.storedDataUrl || buildStoredImageDataUrl(state.imageAsset.sampleCanvas);

  if (!dataUrl) {
    return null;
  }

  return {
    fileName: state.imageAsset.fileName || "",
    dataUrl,
  };
}

function serializeAppState() {
  return {
    version: 1,
    selectedBrands: [...state.selectedBrands],
    activeTheoryIds: [...state.activeTheoryIds],
    imageAsset: serializeImageAsset(),
    imagePalette: state.imagePalette.map(serializeImageColor).filter(Boolean),
    imageSampleColor: serializeImageColor(state.imageSampleColor),
    activeSidebarTab: state.activeSidebarTab,
    expandedAlgoIds: [...state.expandedAlgoIds],
    base: {
      h: state.base.h,
      s: state.base.s,
      l: state.base.l,
    },
    baseOrigin: state.baseOrigin ? { ...state.baseOrigin } : null,
    pickerSearch: state.pickerSearch,
  };
}

function persistAppState() {
  if (persistAppStateTimer) {
    window.clearTimeout(persistAppStateTimer);
    persistAppStateTimer = 0;
  }

  try {
    window.localStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(serializeAppState()));
  } catch {
    // Ignore storage failures and keep the UI usable without persistence.
  }
}

function schedulePersistAppState() {
  if (persistAppStateTimer) {
    window.clearTimeout(persistAppStateTimer);
  }

  persistAppStateTimer = window.setTimeout(() => {
    persistAppStateTimer = 0;
    persistAppState();
  }, 180);
}

function loadAppStateFromStorage() {
  try {
    const raw = window.localStorage.getItem(APP_STATE_STORAGE_KEY);
    persistedAppSnapshot = raw ? JSON.parse(raw) : null;
  } catch {
    persistedAppSnapshot = null;
  }
}

function renderLanguageOptions() {
  elements.languageSelect.innerHTML = SUPPORTED_LANGUAGES.map(
    (language) => `<option value="${language.id}">${escapeHtml(language.label)}</option>`,
  ).join("");
}

function renderStaticText() {
  document.documentElement.lang = state.language;
  document.title = ui("documentTitle");

  elements.controlMenuEyebrow.textContent = ui("controlMenuEyebrow");
  elements.controlMenuTitle.textContent = ui("controlMenuTitle");
  elements.controlMenuToggle.setAttribute("aria-label", ui("controlMenuOpen"));
  elements.controlMenuClose.textContent = ui("close");
  elements.controlMenuClose.setAttribute("aria-label", ui("controlMenuClose"));
  elements.topbarEyebrow.textContent = ui("topbarEyebrow");
  elements.topbarTitle.textContent = ui("topbarTitle");
  elements.languageLabel.textContent = ui("languageLabel");
  elements.algorithmsLabel.textContent = ui("algorithmsLabel");
  elements.manufacturersLabel.textContent = ui("manufacturersLabel");
  elements.baseControlsLabel.textContent = ui("baseControlsLabel");
  elements.sidebarTabImageUploadLabel.textContent = ui("imageUploadLabel");
  elements.sidebarTabImagePaletteLabel.textContent = ui("imagePaletteLabel");
  elements.sidebarTabCartLabel.textContent = ui("cartLabel");
  elements.sidebarTabHueLabel.textContent = ui("hueLabel");
  elements.hexLabel.textContent = ui("hexLabel");
  elements.hueLabel.textContent = ui("hueLabel");
  elements.saturationLabel.textContent = ui("saturationLabel");
  elements.lightnessLabel.textContent = ui("lightnessLabel");
  elements.imageLabel.textContent = ui("imageLabel");
  elements.imageUploadLabel.textContent = ui("imageUploadLabel");
  elements.imageHint.textContent = ui("imageHint");
  elements.imageClear.textContent = ui("imageReset");
  elements.imagePaletteReset.textContent = ui("imageReset");
  elements.imageClear.setAttribute("aria-label", ui("imageReset"));
  elements.imagePaletteReset.setAttribute("aria-label", ui("imageReset"));
  elements.imageOpenModal.textContent = ui("imageOpenModal");
  elements.imageSaveColor.textContent = ui("imageSaveColor");
  elements.imageInlinePaletteLabel.textContent = ui("imagePaletteLabel");
  elements.imagePaletteLabel.textContent = ui("imagePaletteLabel");
  elements.imageModalEyebrow.textContent = ui("imageLabel");
  elements.imageModalTitle.textContent = ui("imageModalTitle");
  elements.imageModalClose.textContent = ui("close");
  elements.imageModalHint.textContent = ui("imageModalHint");
  elements.imageModalSaveColor.textContent = ui("imageSaveColor");
  elements.imageModalPaletteLabel.textContent = ui("imagePaletteLabel");
  elements.pickerLabel.textContent = ui("pickerLabel");
  elements.pickerSearch.placeholder = ui("pickerPlaceholder");
  elements.wheelEyebrow.textContent = ui("wheelEyebrow");
  elements.cartLabel.textContent = ui("cartLabel");
  elements.cartCopy.textContent = ui("cartCopy");
  elements.cartClear.textContent = ui("cartEmptyAction");
  elements.cartClear.setAttribute("aria-label", ui("cartEmptyAction"));
  elements.cartDownload.textContent = ui("downloadPrintable");
  elements.paletteEyebrow.textContent = ui("paletteEyebrow");
  elements.paletteTitle.textContent = ui("paletteTitle");
  elements.languageSelect.value = state.language;
  elements.wheelSvg.setAttribute("aria-label", ui("wheelAria"));
  elements.imageCanvas.setAttribute("aria-label", ui("imagePreviewAria"));
  elements.imageModalCanvas.setAttribute("aria-label", ui("imageCanvasAria"));
  elements.languageSelect.setAttribute("aria-label", ui("languageLabel"));
  elements.imageInput.setAttribute("aria-label", ui("imageUploadLabel"));
  elements.imageOpenModal.setAttribute("aria-label", ui("imageOpenModal"));
  elements.imageModalClose.setAttribute("aria-label", ui("close"));
  elements.pickerSearch.setAttribute("aria-label", ui("pickerLabel"));
}

function isMobileControlMenu() {
  return window.innerWidth <= 1279;
}

function isCompactMobileViewport() {
  return window.innerWidth <= 767;
}

function renderControlMenu() {
  const open = isMobileControlMenu() && state.isControlMenuOpen;

  document.body.classList.toggle("control-menu-open", open);
  elements.controlPanel.classList.toggle("is-mobile-open", open);
  elements.controlMenuBackdrop.hidden = !open;
  elements.controlMenuToggle.setAttribute("aria-expanded", String(open));
  elements.controlMenuToggle.setAttribute("aria-label", ui(open ? "controlMenuClose" : "controlMenuOpen"));
  elements.controlPanel.setAttribute("aria-hidden", String(isMobileControlMenu() && !open));
}

function renderSidebarTabs() {
  if (!SIDEBAR_TABS.has(state.activeSidebarTab)) {
    state.activeSidebarTab = "hue";
  }

  elements.sidebarTabButtons.forEach((button) => {
    const tabId = button.dataset.sideTab;
    const active = state.activeSidebarTab === tabId;
    const panel = elements.sidebarPanels[tabId];

    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;

    if (panel) {
      panel.hidden = !active;
    }
  });
}

function isTooltipAliasBoundary(character) {
  return !character || !/[A-Za-zÀ-ÿ0-9-]/.test(character);
}

function matchTheoryAlias(copy, index) {
  const lowerCopy = copy.toLowerCase();

  for (const entry of THEORY_ALIAS_ENTRIES) {
    if (!lowerCopy.startsWith(entry.lowerAlias, index)) {
      continue;
    }

    const previous = copy[index - 1];
    const next = copy[index + entry.alias.length];

    if (!isTooltipAliasBoundary(previous) || !isTooltipAliasBoundary(next)) {
      continue;
    }

    return entry;
  }

  return null;
}

function renderTooltipCopy(copy) {
  if (!copy) {
    return "";
  }

  let index = 0;
  let buffer = "";
  const parts = [];

  while (index < copy.length) {
    const entry = matchTheoryAlias(copy, index);

    if (!entry) {
      buffer += copy[index];
      index += 1;
      continue;
    }

    if (buffer) {
      parts.push(escapeHtml(buffer));
      buffer = "";
    }

    const theory = THEORY_BY_ID.get(entry.theoryId);
    const label = theory ? getLocalizedTheoryEntry(theory).label : entry.alias;

    parts.push(
      `<button class="theory-inline-ref" type="button" data-theory-ref-id="${entry.theoryId}" aria-label="${escapeHtml(
        ui("tooltipActivateTheory", { theory: label }),
      )}">${escapeHtml(label)}</button>`,
    );

    index += entry.alias.length;
  }

  if (buffer) {
    parts.push(escapeHtml(buffer));
  }

  return parts.join("");
}

function setAccordionSectionOpen(section, open) {
  if (!section) {
    return;
  }

  const trigger = section.querySelector("[data-accordion-trigger]");
  const content = section.querySelector(".accordion-content");

  section.classList.toggle("is-open", open);

  if (trigger) {
    trigger.setAttribute("aria-expanded", String(open));
  }

  if (content) {
    content.hidden = !open;
  }
}

function initializeAccordionSections() {
  elements.controlPanel.querySelectorAll("[data-accordion-section]").forEach((section) => {
    setAccordionSectionOpen(section, section.classList.contains("is-open"));
  });
}

function renderTheoryTooltip(theory) {
  if (!theory.tooltip) {
    return "";
  }

  const tooltipId = `theory-tooltip-${theory.id}`;
  const sections = [
    { label: ui("tooltipPrinciple"), copy: theory.tooltip.summary },
    { label: ui("tooltipConstruction"), copy: theory.tooltip.construction },
    { label: ui("tooltipUsage"), copy: theory.tooltip.usage },
  ].filter((section) => section.copy);

  return `
    <div class="theory-tooltip" id="${tooltipId}" role="tooltip">
      <div class="theory-tooltip-head">
        <div class="theory-tooltip-title">${escapeHtml(theory.label)}</div>
        <button class="theory-tooltip-close" type="button" data-theory-tooltip-close>
          ${escapeHtml(ui("close"))}
        </button>
      </div>
      ${sections
        .map(
          (section) => `
            <section class="theory-tooltip-section">
              <div class="theory-tooltip-label">${escapeHtml(section.label)}</div>
              <p class="theory-tooltip-copy">${renderTooltipCopy(section.copy)}</p>
            </section>
          `,
        )
        .join("")}
    </div>
  `;
}

function closeTheoryTooltip(closeButton) {
  const wrap = closeButton.closest(".theory-help-wrap");

  if (!wrap) {
    return;
  }

  wrap.classList.add("is-dismissed");
  closeButton.blur?.();
  wrap.querySelector(".theory-chip-help")?.blur?.();
}

function formatDegrees(value) {
  return `${Math.round(value)} ${ui("units.degree")}`;
}

function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

function rgbToHex(red, green, blue) {
  return `#${[red, green, blue]
    .map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
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
    // Ignore storage failures to keep the UI usable without persistence.
  }
}

function isColorInCart(colorId) {
  return state.cartItems.some((entry) => entry.colorId === colorId);
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

function getCartItems() {
  if (!state.allColors.length || !state.cartItems.length) {
    return [];
  }

  const colorsById = new Map(state.allColors.map((color) => [color.id, color]));
  return state.cartItems
    .map((entry) => {
      const color = colorsById.get(entry.colorId);

      if (!color) {
        return null;
      }

      return {
        ...entry,
        color,
      };
    })
    .filter(Boolean);
}

function reconcileCart() {
  if (!state.allColors.length) {
    return;
  }

  const nextItems = getCartItems().map((entry) => ({
    colorId: entry.color.id,
    quantity: Math.max(1, entry.quantity),
  }));

  if (JSON.stringify(nextItems) !== JSON.stringify(state.cartItems)) {
    state.cartItems = nextItems;
    persistCart();
  }
}

function addColorToCart(color) {
  if (!color) {
    return;
  }

  const current = getCartItem(color.id);

  if (current) {
    current.quantity += 1;
  } else {
    state.cartItems = [...state.cartItems, { colorId: color.id, quantity: 1 }];
  }

  persistCart();
  render();
}

function setCartQuantity(colorId, quantity) {
  const nextQuantity = Math.max(0, quantity);
  const current = getCartItem(colorId);

  if (!current && nextQuantity === 0) {
    return;
  }

  if (nextQuantity === 0) {
    state.cartItems = state.cartItems.filter((entry) => entry.colorId !== colorId);
  } else if (current) {
    current.quantity = nextQuantity;
  } else {
    state.cartItems = [...state.cartItems, { colorId, quantity: nextQuantity }];
  }

  persistCart();
  render();
}

function incrementCartColor(colorId) {
  setCartQuantity(colorId, getCartQuantity(colorId) + 1);
}

function decrementCartColor(colorId) {
  setCartQuantity(colorId, getCartQuantity(colorId) - 1);
}

function removeColorFromCart(colorId) {
  if (!isColorInCart(colorId)) {
    return;
  }

  state.cartItems = state.cartItems.filter((entry) => entry.colorId !== colorId);
  persistCart();
  render();
}

function clearCart() {
  if (!state.cartItems.length) {
    return;
  }

  state.cartItems = [];
  persistCart();
  render();
}

function buildPrintableCartDocument(items) {
  const createdAt = formatLanguageDate(new Date());

  const itemMarkup = items
    .map((entry) => {
      const { color, quantity } = entry;
      const title = color.label || color.name;
      const code = color.code ? `<div class="item-code">${escapeHtml(color.code)}</div>` : "";
      const quantityLabel = `<div class="item-quantity">${escapeHtml(ui("quantityLabel", { count: quantity }))}</div>`;
      return `
        <article class="item">
          <svg class="swatch" viewBox="0 0 84 84" role="img" aria-label="${escapeHtml(title)} ${escapeHtml(color.hex)}">
            <rect x="1" y="1" width="82" height="82" rx="16" fill="${escapeHtml(color.hex)}" stroke="rgba(0, 0, 0, 0.18)" stroke-width="2"></rect>
            <text x="42" y="68" text-anchor="middle" font-size="10" font-weight="700" fill="${escapeHtml(color.textColor)}">${escapeHtml(color.hex)}</text>
          </svg>
          <div class="content">
            <h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(color.brandLabel)}</p>
            ${code}
            ${quantityLabel}
          </div>
        </article>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="${escapeHtml(state.language)}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(ui("printHtmlTitle"))}</title>
    <style>
      @page {
        size: A4;
        margin: 14mm;
      }

      :root {
        color-scheme: light;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: "Avenir Next", "Trebuchet MS", sans-serif;
        color: #16181d;
        background: #ffffff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      main {
        max-width: 960px;
        margin: 0 auto;
        padding: 28px;
      }

      .toolbar {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: end;
        margin-bottom: 24px;
        padding-bottom: 18px;
        border-bottom: 2px solid #e5e7eb;
      }

      .eyebrow {
        margin: 0;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: #6b7280;
      }

      h1 {
        margin: 8px 0 0;
        font-size: 32px;
        line-height: 0.95;
      }

      .meta {
        text-align: right;
        color: #4b5563;
        font-size: 14px;
      }

      .print-button {
        padding: 10px 14px;
        border-radius: 999px;
        border: 1px solid #d1d5db;
        background: #f3f4f6;
        color: #111827;
        font: inherit;
        cursor: pointer;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .item {
        display: grid;
        grid-template-columns: 84px 1fr;
        gap: 14px;
        align-items: center;
        padding: 14px;
        border: 1px solid #d1d5db;
        border-radius: 16px;
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .swatch {
        width: 84px;
        height: 84px;
        display: block;
        overflow: visible;
      }

      .content h2 {
        margin: 0;
        font-size: 18px;
      }

      .content p,
      .item-code,
      .item-quantity {
        margin: 6px 0 0;
        font-size: 14px;
        color: #374151;
      }

      .item-code,
      .item-quantity {
        font-weight: 700;
      }

      @media (max-width: 720px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }

      @media print {
        main {
          max-width: none;
          padding: 0;
        }

        .print-button {
          display: none;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <header class="toolbar">
        <div>
          <p class="eyebrow">${escapeHtml(ui("printAppName"))}</p>
          <h1>${escapeHtml(ui("printTitle"))}</h1>
        </div>
        <div class="meta">
          <div>${escapeHtml(countText("reference", items.length))}</div>
          <div>${escapeHtml(countText("spray", items.reduce((total, entry) => total + entry.quantity, 0)))}</div>
          <div>${escapeHtml(ui("printGeneratedOn", { date: createdAt }))}</div>
          <button class="print-button" type="button" onclick="window.print()">${escapeHtml(ui("printButton"))}</button>
        </div>
      </header>

      <section class="grid">
        ${itemMarkup}
      </section>
    </main>
  </body>
</html>`;
}

function downloadCart() {
  const items = getCartItems();

  if (!items.length) {
    return;
  }

  const documentHtml = buildPrintableCartDocument(items);
  const blob = new Blob([documentHtml], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const filenameDate = new Date().toISOString().slice(0, 10);

  anchor.href = url;
  anchor.download = `selection-sprays-${filenameDate}.html`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function makeMarkerLabel(index) {
  const base = LETTERS[index % LETTERS.length];
  const cycle = Math.floor(index / LETTERS.length);
  return cycle === 0 ? base : `${base}${cycle + 1}`;
}

function isNeutralColor(hsl) {
  return hsl.s < 0.12 || hsl.l < 0.08 || hsl.l > 0.94;
}

function buildColorRecord(input) {
  const hex = input.hex.toUpperCase();
  const hsl = hexToHsl(hex);

  return {
    ...input,
    hex,
    h: hsl.h,
    s: hsl.s,
    l: hsl.l,
    lab: hexToLab(hex),
    isNeutral: isNeutralColor(hsl),
    textColor: getContrastingText(hex),
  };
}

function createImagePaletteColor(hex) {
  return buildColorRecord({
    id: `image-${hex.slice(1)}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    brandId: "image",
    brandLabel: "image",
    name: hex,
    code: "",
    label: hex,
    hex,
    searchTerms: [],
    meta: {},
  });
}

async function buildImageAssetFromSource(source, fileName = "") {
  const image = new Image();

  image.src = source;

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const sampleScale = Math.min(1, IMAGE_SAMPLE_MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
  const sampleWidth = Math.max(1, Math.round(image.naturalWidth * sampleScale));
  const sampleHeight = Math.max(1, Math.round(image.naturalHeight * sampleScale));
  const sampleCanvas = document.createElement("canvas");
  const sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });

  if (!sampleCtx) {
    throw new Error("image-canvas-context");
  }

  sampleCanvas.width = sampleWidth;
  sampleCanvas.height = sampleHeight;
  sampleCtx.drawImage(image, 0, 0, sampleWidth, sampleHeight);

  return {
    fileName,
    sampleCanvas,
    sampleCtx,
    sampleWidth,
    sampleHeight,
    storedDataUrl: buildStoredImageDataUrl(sampleCanvas),
  };
}

function getImageFitDimensions(maxWidth, maxHeight) {
  if (!state.imageAsset) {
    return {
      displayWidth: 0,
      displayHeight: 0,
    };
  }

  const safeMaxWidth = Math.max(1, Math.floor(maxWidth || state.imageAsset.sampleWidth));
  const safeMaxHeight = Math.max(1, Math.floor(maxHeight || state.imageAsset.sampleHeight));
  const scale = Math.min(
    1,
    safeMaxWidth / state.imageAsset.sampleWidth,
    safeMaxHeight / state.imageAsset.sampleHeight,
  );

  return {
    displayWidth: Math.max(1, Math.round(state.imageAsset.sampleWidth * scale)),
    displayHeight: Math.max(1, Math.round(state.imageAsset.sampleHeight * scale)),
  };
}

function drawImageCanvas(canvas, maxWidth, maxHeight) {
  if (!state.imageAsset || !canvas) {
    return;
  }

  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  const { displayWidth, displayHeight } = getImageFitDimensions(maxWidth, maxHeight);
  const devicePixelRatio = window.devicePixelRatio || 1;

  canvas.width = Math.max(1, Math.round(displayWidth * devicePixelRatio));
  canvas.height = Math.max(1, Math.round(displayHeight * devicePixelRatio));
  canvas.style.width = "100%";
  canvas.style.maxWidth = `${displayWidth}px`;
  canvas.style.height = "auto";
  canvas.style.maxHeight = `${displayHeight}px`;
  canvas.style.aspectRatio = `${displayWidth} / ${displayHeight}`;

  context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  context.imageSmoothingEnabled = true;
  context.clearRect(0, 0, displayWidth, displayHeight);
  context.drawImage(state.imageAsset.sampleCanvas, 0, 0, displayWidth, displayHeight);
}

function clearRenderedImageCanvas(canvas) {
  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d");

  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  canvas.width = 0;
  canvas.height = 0;
  canvas.hidden = true;
  canvas.style.width = "";
  canvas.style.maxWidth = "";
  canvas.style.height = "";
  canvas.style.maxHeight = "";
  canvas.style.aspectRatio = "";
}

function hideImageCrosshair(crosshair = elements.imageCrosshair) {
  if (crosshair) {
    crosshair.hidden = true;
  }
}

function hideAllImageCrosshairs() {
  hideImageCrosshair(elements.imageCrosshair);
  hideImageCrosshair(elements.imageModalCrosshair);
}

function positionImageCrosshair(canvas, crosshair, clientX, clientY) {
  if (!state.imageAsset || !canvas || !crosshair || canvas.hidden) {
    hideImageCrosshair(crosshair);
    return;
  }

  const rect = canvas.getBoundingClientRect();

  if (!rect.width || !rect.height) {
    hideImageCrosshair(crosshair);
    return;
  }

  const x = clamp(clientX - rect.left, 0, rect.width);
  const y = clamp(clientY - rect.top, 0, rect.height);

  crosshair.hidden = false;
  crosshair.style.left = `${x}px`;
  crosshair.style.top = `${y}px`;
}

function sampleImageColorAtCanvas(canvas, clientX, clientY) {
  if (!state.imageAsset?.sampleCtx || !canvas) {
    return null;
  }

  const rect = canvas.getBoundingClientRect();

  if (!rect.width || !rect.height) {
    return null;
  }

  const normalizedX = clamp((clientX - rect.left) / rect.width, 0, 0.999999);
  const normalizedY = clamp((clientY - rect.top) / rect.height, 0, 0.999999);
  const centerX = clamp(Math.round(normalizedX * (state.imageAsset.sampleWidth - 1)), 0, state.imageAsset.sampleWidth - 1);
  const centerY = clamp(Math.round(normalizedY * (state.imageAsset.sampleHeight - 1)), 0, state.imageAsset.sampleHeight - 1);
  const radius = 1;
  const startX = Math.max(0, centerX - radius);
  const startY = Math.max(0, centerY - radius);
  const width = Math.min(state.imageAsset.sampleWidth - startX, radius * 2 + 1);
  const height = Math.min(state.imageAsset.sampleHeight - startY, radius * 2 + 1);
  const data = state.imageAsset.sampleCtx.getImageData(startX, startY, width, height).data;

  let totalRed = 0;
  let totalGreen = 0;
  let totalBlue = 0;
  let count = 0;

  for (let index = 0; index < data.length; index += 4) {
    totalRed += data[index];
    totalGreen += data[index + 1];
    totalBlue += data[index + 2];
    count += 1;
  }

  if (!count) {
    return null;
  }

  const hex = rgbToHex(totalRed / count, totalGreen / count, totalBlue / count);
  return {
    ...createImagePaletteColor(hex),
    meta: {
      sampleX: centerX,
      sampleY: centerY,
    },
  };
}

function openImageModal() {
  if (!state.imageAsset || isCompactMobileViewport()) {
    return;
  }

  state.activeSidebarTab = "image-upload";
  state.isImageModalOpen = true;
  render();

  window.requestAnimationFrame(() => {
    elements.imageModalClose?.focus?.();
  });
}

function closeImageModal({ restoreFocus = true } = {}) {
  if (!state.isImageModalOpen) {
    return;
  }

  state.isImageModalOpen = false;
  hideImageCrosshair(elements.imageModalCrosshair);
  render();

  if (restoreFocus) {
    window.requestAnimationFrame(() => {
      elements.imageOpenModal?.focus?.();
    });
  }
}

function openControlMenu() {
  if (!isMobileControlMenu()) {
    return;
  }

  state.isControlMenuOpen = true;
  renderControlMenu();

  window.requestAnimationFrame(() => {
    elements.controlMenuClose?.focus?.();
  });
}

function closeControlMenu({ restoreFocus = true } = {}) {
  if (!state.isControlMenuOpen) {
    return;
  }

  state.isControlMenuOpen = false;
  renderControlMenu();

  if (restoreFocus) {
    window.requestAnimationFrame(() => {
      elements.controlMenuToggle?.focus?.();
    });
  }
}

function toggleControlMenu() {
  if (state.isControlMenuOpen) {
    closeControlMenu();
    return;
  }

  openControlMenu();
}

async function loadImageFile(file) {
  if (!file) {
    return;
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    state.imageAsset = await buildImageAssetFromSource(objectUrl, file.name);
    state.imageSampleColor = null;
    state.imagePalette = [];
    state.activeSidebarTab = "image-upload";
    state.isImageModalOpen = !isCompactMobileViewport();

    if (state.baseOrigin?.kind === "image") {
      state.baseOrigin = null;
    }

    elements.imageInput.value = "";
    hideAllImageCrosshairs();
    render();

    if (state.isImageModalOpen) {
      window.requestAnimationFrame(() => {
        elements.imageModalClose?.focus?.();
      });
    }
  } catch {
    state.imageAsset = null;
    state.imageSampleColor = null;
    state.imagePalette = [];
    state.isImageModalOpen = false;
    hideAllImageCrosshairs();
    render();
    window.alert(ui("imageLoadError"));
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function clearImageSelection() {
  state.imageAsset = null;
  state.imageSampleColor = null;
  state.imagePalette = [];
  state.isImageModalOpen = false;
  state.activeSidebarTab = "image-upload";

  if (state.baseOrigin?.kind === "image") {
    state.baseOrigin = null;
  }

  elements.imageInput.value = "";
  clearRenderedImageCanvas(elements.imageCanvas);
  clearRenderedImageCanvas(elements.imageModalCanvas);
  hideAllImageCrosshairs();
  render();
}

async function restoreAppState(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    return false;
  }

  const allBrandIds = state.manufacturers.map((manufacturer) => manufacturer.id);
  const validBrandIds = new Set(allBrandIds);
  const validTheoryIds = new Set(THEORIES.map((theory) => theory.id));

  state.selectedBrands = new Set(allBrandIds);

  if (Array.isArray(snapshot.selectedBrands)) {
    const restoredBrandIds = snapshot.selectedBrands.filter((brandId) => validBrandIds.has(brandId));

    if (restoredBrandIds.length) {
      state.selectedBrands = new Set(restoredBrandIds);
    }
  }

  if (Array.isArray(snapshot.activeTheoryIds)) {
    state.activeTheoryIds = new Set(
      snapshot.activeTheoryIds.filter((theoryId) => validTheoryIds.has(theoryId)),
    );
  }

  state.activeSidebarTab = SIDEBAR_TABS.has(snapshot.activeSidebarTab)
    ? snapshot.activeSidebarTab
    : "hue";
  state.expandedAlgoIds = Array.isArray(snapshot.expandedAlgoIds)
    ? new Set(snapshot.expandedAlgoIds.filter((groupId) => typeof groupId === "string"))
    : new Set();
  state.pickerSearch = typeof snapshot.pickerSearch === "string" ? snapshot.pickerSearch : "";

  if (snapshot.imageAsset?.dataUrl && typeof snapshot.imageAsset.dataUrl === "string") {
    try {
      state.imageAsset = await buildImageAssetFromSource(
        snapshot.imageAsset.dataUrl,
        snapshot.imageAsset.fileName || "",
      );
    } catch {
      state.imageAsset = null;
    }
  } else {
    state.imageAsset = null;
  }

  state.imagePalette = Array.isArray(snapshot.imagePalette)
    ? snapshot.imagePalette
        .map(normalizeStoredImageColor)
        .filter(Boolean)
        .filter(
          (entry, index, entries) => entries.findIndex((candidate) => candidate.id === entry.id) === index,
        )
    : [];
  state.imageSampleColor = normalizeStoredImageColor(snapshot.imageSampleColor);
  state.isImageModalOpen = false;
  state.activeColorTooltipId = null;

  const restoredBase = sanitizePersistedBase(snapshot.base);
  const restoredBaseOrigin =
    snapshot.baseOrigin &&
    typeof snapshot.baseOrigin === "object" &&
    typeof snapshot.baseOrigin.id === "string" &&
    (snapshot.baseOrigin.kind === "spray" || snapshot.baseOrigin.kind === "image")
      ? { kind: snapshot.baseOrigin.kind, id: snapshot.baseOrigin.id }
      : null;

  state.baseOrigin = null;

  if (restoredBaseOrigin?.kind === "spray") {
    const color = state.allColors.find((entry) => entry.id === restoredBaseOrigin.id);

    if (color) {
      state.base = {
        h: color.h,
        s: color.s,
        l: color.l,
      };
      state.baseOrigin = restoredBaseOrigin;
      return true;
    }
  }

  if (restoredBaseOrigin?.kind === "image") {
    const color = state.imagePalette.find((entry) => entry.id === restoredBaseOrigin.id);

    if (color) {
      state.base = {
        h: color.h,
        s: color.s,
        l: color.l,
      };
      state.baseOrigin = restoredBaseOrigin;
      return true;
    }
  }

  if (restoredBase) {
    state.base = restoredBase;
    return true;
  }

  return false;
}

function saveCurrentImageColor() {
  if (!state.imageSampleColor) {
    return;
  }

  const existing = state.imagePalette.find((color) => color.hex === state.imageSampleColor.hex);

  if (existing) {
    setBaseFromImageColor(existing);
    return;
  }

  const color = createImagePaletteColor(state.imageSampleColor.hex);
  state.imagePalette = [...state.imagePalette, color];
  setBaseFromImageColor(color);
}

function getManufacturerById(brandId) {
  return state.manufacturers.find((manufacturer) => manufacturer.id === brandId) || null;
}

function getSelectedManufacturers() {
  return state.manufacturers.filter((manufacturer) => state.selectedBrands.has(manufacturer.id));
}

function normalizeManufacturerCatalog(catalog, catalogIndex) {
  const manufacturerData = catalog?.manufacturer;
  const colorsData = Array.isArray(catalog?.colors) ? catalog.colors : null;

  if (!manufacturerData?.id || !colorsData) {
    throw new Error(ui("errorLoadingApp"));
  }

  const manufacturer = {
    id: manufacturerData.id,
    label: manufacturerData.label || manufacturerData.id,
    accent:
      manufacturerData.accent ||
      DEFAULT_MANUFACTURER_ACCENTS[catalogIndex % DEFAULT_MANUFACTURER_ACCENTS.length],
    series: manufacturerData.series || "",
  };

  const colors = colorsData.map((item, colorIndex) =>
    buildColorRecord({
      id: `${manufacturer.id}-${item.id || item.code || colorIndex + 1}`,
      brandId: manufacturer.id,
      brandLabel: manufacturer.label,
      name: item.name || item.label || `${manufacturer.label} ${colorIndex + 1}`,
      code: item.code || "",
      label:
        item.label ||
        [item.code, item.name].filter(Boolean).join(" ") ||
        `${manufacturer.label} ${colorIndex + 1}`,
      hex: item.hex,
      searchTerms: [
        item.sourceLabel,
        manufacturer.series,
        ...(Array.isArray(item.aliases) ? item.aliases : []),
      ].filter(Boolean),
      meta: {
        sourceLabel: item.sourceLabel || "",
        aliases: Array.isArray(item.aliases) ? item.aliases : [],
        finish: item.finish || null,
        opacity: item.opacity || null,
        coverage: item.coverage || null,
        lightfastness: item.lightfastness || null,
        pigments: item.pigments || null,
        ...item.meta,
      },
    }),
  );

  return {
    manufacturer,
    colors,
  };
}

function sortByName(first, second) {
  return first.name.localeCompare(second.name) || first.brandLabel.localeCompare(second.brandLabel);
}

function getActiveColors() {
  return state.allColors.filter((color) => state.selectedBrands.has(color.brandId));
}

function getColorsByBrand(colors) {
  return getSelectedManufacturers().map((brand) => ({
    brandId: brand.id,
    brand,
    colors: colors.filter((color) => color.brandId === brand.id),
  }));
}

function getBrandPresets() {
  const manufacturers = state.manufacturers;

  if (!manufacturers.length) {
    return [];
  }

  if (manufacturers.length === 1) {
    return [
      {
        id: "all",
        label: manufacturers[0].label,
        brands: [manufacturers[0].id],
      },
    ];
  }

  return [
    {
      id: "all",
      label: manufacturers.length === 2 ? ui("presetBoth") : ui("presetAll"),
      brands: manufacturers.map((manufacturer) => manufacturer.id),
    },
    ...manufacturers.map((manufacturer) => ({
      id: `${manufacturer.id}-only`,
      label: ui("presetOnly", { brand: manufacturer.label }),
      brands: [manufacturer.id],
    })),
  ];
}

function getBaseOrigin() {
  if (!state.baseOrigin?.id) {
    return null;
  }

  if (state.baseOrigin.kind === "spray") {
    return state.allColors.find((color) => color.id === state.baseOrigin.id) || null;
  }

  if (state.baseOrigin.kind === "image") {
    return state.imagePalette.find((color) => color.id === state.baseOrigin.id) || null;
  }

  return null;
}

function createBaseColor() {
  const hex = hslToHex(state.base.h, state.base.s, state.base.l).toUpperCase();
  const hsl = hexToHsl(hex);
  const origin = getBaseOrigin();
  const isImageOrigin = state.baseOrigin?.kind === "image";

  return {
    id: "virtual-base",
    brandId: "virtual",
    brandLabel: isImageOrigin ? ui("imagePaletteBrand") : ui("customBrand"),
    name: origin?.label || ui("baseColorName"),
    code: "",
    label: ui("baseColorName"),
    hex,
    h: hsl.h,
    s: hsl.s,
    l: hsl.l,
    lab: hexToLab(hex),
    isNeutral: isNeutralColor(hsl),
    textColor: getContrastingText(hex),
  };
}

function getSelectedTheories() {
  return THEORIES.filter((theory) => state.activeTheoryIds.has(theory.id));
}

function getTheoryContexts(baseColor) {
  return getSelectedTheories().map((theory) => {
    const localizedTheory = getLocalizedTheoryEntry(theory);

    if (theory.requiresChromatic && baseColor.isNeutral) {
      return {
        theory: localizedTheory,
        targets: [],
        reason: ui("chromaticRequired"),
      };
    }

    const targets = theory.generate(baseColor).map((target) => ({
      ...target,
      label: localizeOutputText(target.label),
      note: localizeOutputText(target.note),
      hex: target.hex.toUpperCase(),
      lab: hexToLab(target.hex),
      textColor: getContrastingText(target.hex),
    }));

    return {
      theory: localizedTheory,
      targets,
      reason: "",
    };
  });
}

function findClosestColor(target, colors) {
  let best = null;

  for (const color of colors) {
    let distance = deltaE(target.lab, color.lab);

    if (target.kind === "hue" && color.isNeutral) {
      distance += 10;
    }

    if (!best || distance < best.distance) {
      best = {
        color,
        distance,
        score: Math.max(0, Math.round(100 - distance * 1.4)),
      };
    }
  }

  return best;
}

function createBaseStop(baseColor, activeColors) {
  const origin = getBaseOrigin();
  const baseStop = {
    key: "base",
    letter: makeMarkerLabel(0),
    title: ui("reference"),
    note:
      state.baseOrigin?.kind === "image"
        ? ui("sourceImage")
        : origin
          ? ui("sourceColor")
          : ui("freeBase"),
    hex: baseColor.hex,
    hsl: {
      h: baseColor.h,
      s: baseColor.s,
      l: baseColor.l,
    },
    textColor: baseColor.textColor,
    lab: baseColor.lab,
    matches: getColorsByBrand(activeColors).map(({ brandId, brand, colors }) => ({
      brandId,
      brand,
      match: findClosestColor(baseColor, colors),
    })),
  };

  return baseStop;
}

function buildPaletteGroups(baseColor, contexts, activeColors) {
  const baseStop = createBaseStop(baseColor, activeColors);
  let markerIndex = 1;

  if (contexts.length === 0) {
    return {
      baseStop,
      groups: [
        {
          id: "base-only",
          title: ui("baseTitle"),
          formula: "",
          description: ui("noActiveAlgorithmShort"),
          reason: "",
          stops: [baseStop],
        },
      ],
    };
  }

  const groups = [];

  for (const context of contexts) {
    const group = {
      id: context.theory.id,
      title: context.theory.label,
      formula: context.theory.formula,
      description: context.theory.description,
      reason: context.reason,
      stops: [],
    };

    if (!context.reason) {
      for (const target of context.targets) {
        group.stops.push({
          key: `${context.theory.id}-${target.label}-${markerIndex}`,
          letter: makeMarkerLabel(markerIndex),
          title: target.label,
          note: target.note || target.kind,
          theoryId: context.theory.id,
          theoryLabel: context.theory.label,
          theoryFormula: context.theory.formula,
          hex: target.hex,
          hsl: target.hsl,
          textColor: target.textColor,
          lab: target.lab,
          matches: getColorsByBrand(activeColors).map(({ brandId, brand, colors }) => ({
            brandId,
            brand,
            match: findClosestColor(target, colors),
          })),
        });
        markerIndex += 1;
      }
    }

    groups.push(group);
  }

  return {
    baseStop,
    groups,
  };
}

function buildWheelStops(baseStop, groups) {
  return [
    baseStop,
    ...groups.flatMap((group) => group.stops),
  ];
}

function getPickerResults(baseColor, activeColors) {
  const search = state.pickerSearch.trim().toLowerCase();
  let results = activeColors;

  if (search) {
    results = activeColors.filter((color) => {
      const haystack = [
        color.name,
        color.code,
        color.label,
        color.brandLabel,
        color.hex,
        color.meta.sourceLabel,
        ...(Array.isArray(color.searchTerms) ? color.searchTerms : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });

    return results.sort(sortByName).slice(0, 12);
  }

  return [...results]
    .sort((first, second) => deltaE(baseColor.lab, first.lab) - deltaE(baseColor.lab, second.lab))
    .slice(0, 12);
}

function polarPoint(hue, saturation) {
  const angle = (hue - 90) * (Math.PI / 180);
  const radius = clamp(saturation, 0, 1) * WHEEL_RADIUS;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

function renderTopbar(activeColors) {
  elements.topbarMeta.innerHTML = `
    <span class="meta-pill">${escapeHtml(countText("sprayColor", activeColors.length))}</span>
    <span class="meta-pill">${escapeHtml(countText("manufacturer", state.selectedBrands.size))}</span>
    <span class="meta-pill">${escapeHtml(countText("activeAlgorithm", state.activeTheoryIds.size))}</span>
    <span class="meta-pill">${escapeHtml(countText("sprayInCart", getCartSprayCount()))}</span>
  `;
}

function renderTheoryGroups() {
  elements.theoryGroups.innerHTML = getLocalizedTheorySections().map((section) => {
    const chips = THEORIES.filter((theory) => theory.section === section.id)
      .map((theory) => {
        const localizedTheory = getLocalizedTheoryEntry(theory);
        const active = state.activeTheoryIds.has(theory.id);
        const tooltipId = localizedTheory.tooltip ? `theory-tooltip-${theory.id}` : "";
        return `
          <div class="theory-chip-wrap">
            <button
              class="theory-chip ${active ? "active" : ""}"
              type="button"
              data-theory-id="${theory.id}"
              aria-pressed="${active}"
            >
              <span>${escapeHtml(localizedTheory.label)}</span>
            </button>
            ${
              localizedTheory.tooltip
                ? `
                  <div class="theory-help-wrap">
                    <button
                      class="theory-chip-help ${active ? "active" : ""}"
                      type="button"
                      aria-label="${escapeHtml(ui("helpAria", { theory: localizedTheory.label }))}"
                      aria-describedby="${tooltipId}"
                    >
                      ?
                    </button>
                    ${renderTheoryTooltip(localizedTheory)}
                  </div>
                `
                : ""
            }
          </div>
        `;
      })
      .join("");

    return `
      <section class="theory-section">
        <div class="theory-section-label">${escapeHtml(section.label)}</div>
        <div class="theory-chip-row">${chips}</div>
      </section>
    `;
  }).join("");
}

function renderBrandToggles() {
  elements.brandToggles.innerHTML = state.manufacturers
    .map((brand) => {
      const active = state.selectedBrands.has(brand.id);
      const count = state.allColors.filter((color) => color.brandId === brand.id).length;

      return `
        <button class="brand-toggle ${active ? "active" : ""}" type="button" data-brand-id="${brand.id}" aria-pressed="${active}">
          <span class="brand-dot" style="background:${brand.accent}"></span>
          <span>${escapeHtml(brand.label)}</span>
          <span class="brand-count">${count}</span>
        </button>
      `;
    })
    .join("");
}

function renderBrandPresets() {
  const presets = getBrandPresets();

  elements.brandPresets.innerHTML = presets
    .map((preset) => {
      const active =
        preset.brands.length === state.selectedBrands.size &&
        preset.brands.every((brandId) => state.selectedBrands.has(brandId));

      return `
        <button class="brand-preset ${active ? "active" : ""}" type="button" data-brand-preset="${preset.id}">
          ${escapeHtml(preset.label)}
        </button>
      `;
    })
    .join("");
}

function renderControls(baseColor) {
  elements.hexInput.value = baseColor.hex;
  elements.hueRange.value = Math.round(baseColor.h);
  elements.satRange.value = Math.round(baseColor.s * 100);
  elements.lightRange.value = Math.round(baseColor.l * 100);
  elements.hueValue.value = formatDegrees(baseColor.h);
  elements.satValue.value = formatPercent(baseColor.s);
  elements.lightValue.value = formatPercent(baseColor.l);
}

function renderImageWorkspace() {
  const hasImage = Boolean(state.imageAsset);
  const compactMobile = isCompactMobileViewport();
  const canResetImageState = hasImage || state.imagePalette.length > 0 || Boolean(state.imageSampleColor);

  elements.imageClear.disabled = !canResetImageState;
  elements.imagePaletteReset.disabled = !canResetImageState;
  elements.imageOpenModal.disabled = !hasImage;
  elements.imageOpenModal.hidden = compactMobile;
  elements.imageEmpty.innerHTML = `
    <p class="empty-copy">${escapeHtml(ui("imageEmpty"))}</p>
  `;
  elements.imageStage.classList.toggle("is-empty", !hasImage);
  elements.imageStage.classList.toggle("is-interactive", hasImage);
  elements.imageEmpty.hidden = hasImage;
  elements.imageCanvas.hidden = !hasImage;
  hideImageCrosshair(elements.imageCrosshair);

  if (!hasImage) {
    return;
  }

  const maxWidth = Math.max(200, (elements.imageStage.clientWidth || IMAGE_PREVIEW_FALLBACK_WIDTH) - 18);
  drawImageCanvas(elements.imageCanvas, maxWidth, compactMobile ? 280 : IMAGE_PREVIEW_MAX_HEIGHT);
}

function buildImageSampleMarkup() {
  if (!state.imageSampleColor) {
    return `
      <div class="empty-state compact-empty">
        <p class="empty-copy">${escapeHtml(ui("imageSampleEmpty"))}</p>
      </div>
    `;
  }

  const color = state.imageSampleColor;

  return `
    <article class="image-sample-card">
      <div class="image-swatch" style="background:${color.hex}; color:${color.textColor}">
        ${escapeHtml(color.hex)}
      </div>
      <div class="image-sample-body">
        <div class="image-sample-title">${escapeHtml(ui("imageSampleLabel"))}</div>
        <p class="image-sample-meta">
          H ${escapeHtml(formatDegrees(color.h))} · S ${escapeHtml(formatPercent(color.s))} · L ${escapeHtml(formatPercent(color.l))}
        </p>
      </div>
    </article>
  `;
}

function renderImageSample() {
  const markup = buildImageSampleMarkup();
  const disabled = !state.imageSampleColor;

  elements.imageSample.innerHTML = markup;
  elements.imageModalSample.innerHTML = markup;
  elements.imageSaveColor.disabled = disabled;
  elements.imageModalSaveColor.disabled = disabled;
}

function renderImageModal() {
  const hasImage = Boolean(state.imageAsset);
  const open = state.isImageModalOpen && hasImage && !isCompactMobileViewport();

  elements.imageModal.hidden = !open;
  document.body.classList.toggle("modal-open", open);
  elements.imageModalEmpty.innerHTML = `
    <p class="empty-copy">${escapeHtml(ui("imageEmpty"))}</p>
  `;
  elements.imageModalStage.classList.toggle("is-empty", !hasImage);
  elements.imageModalStage.classList.toggle("is-interactive", hasImage);
  elements.imageModalEmpty.hidden = hasImage;
  elements.imageModalCanvas.hidden = !hasImage;

  if (!open) {
    hideImageCrosshair(elements.imageModalCrosshair);
    return;
  }

  const viewportHeight = Math.max(
    window.visualViewport?.height || 0,
    window.innerHeight || 0,
    document.documentElement.clientHeight || 0,
    IMAGE_MODAL_FALLBACK_HEIGHT,
  );
  const compactViewport = window.matchMedia("(max-width: 767px)").matches;
  const viewportStageCap = Math.floor(viewportHeight * (compactViewport ? 0.4 : 0.56));
  const maxWidth = Math.max(
    220,
    (elements.imageModalStage.clientWidth || IMAGE_MODAL_FALLBACK_WIDTH) - 24,
  );
  const maxHeight = Math.max(
    180,
    Math.min(elements.imageModalStage.clientHeight || viewportStageCap, viewportStageCap) - 24,
  );

  drawImageCanvas(elements.imageModalCanvas, maxWidth, maxHeight);
}

function renderImagePalette() {
  const emptyMarkup = `
    <div class="empty-state compact-empty">
      <p class="empty-copy">${escapeHtml(ui("imagePaletteEmpty"))}</p>
    </div>
  `;

  if (!state.imagePalette.length) {
    elements.imageInlinePalette.innerHTML = emptyMarkup;
    elements.imagePalette.innerHTML = emptyMarkup;
    elements.imageModalPalette.innerHTML = emptyMarkup;
    return;
  }

  const markup = state.imagePalette
    .map((color) => {
      const active = state.baseOrigin?.kind === "image" && state.baseOrigin.id === color.id;

      return `
        <button class="image-palette-chip ${active ? "active" : ""}" type="button" data-image-color-id="${color.id}" aria-pressed="${active}">
          <span class="image-swatch image-palette-swatch" style="background:${color.hex}; color:${color.textColor}">
            ${escapeHtml(color.hex)}
          </span>
          <span class="image-palette-body">
            <span class="image-palette-title">${escapeHtml(color.label || color.name)}</span>
            <span class="image-palette-meta">H ${escapeHtml(formatDegrees(color.h))} · S ${escapeHtml(formatPercent(color.s))} · L ${escapeHtml(formatPercent(color.l))}</span>
          </span>
          ${active ? `<span class="image-palette-badge">${escapeHtml(ui("imageActive"))}</span>` : ""}
        </button>
      `;
    })
    .join("");

  elements.imageInlinePalette.innerHTML = markup;
  elements.imagePalette.innerHTML = markup;
  elements.imageModalPalette.innerHTML = markup;
}

function updateImageSampleFromCanvasEvent(canvas, crosshair, event) {
  const sample = sampleImageColorAtCanvas(canvas, event.clientX, event.clientY);

  if (!sample) {
    return;
  }

  positionImageCrosshair(canvas, crosshair, event.clientX, event.clientY);
  state.imageSampleColor = sample;
  render();
}

function renderPickerResults(results) {
  if (!results.length) {
    elements.pickerResults.innerHTML = `
      <div class="empty-state">
        <p class="empty-copy">${escapeHtml(ui("noSearchResult"))}</p>
      </div>
    `;
    return;
  }

  elements.pickerResults.innerHTML = results
    .map(
      (color) => `
        <button class="picker-chip ${state.baseOrigin?.kind === "spray" && color.id === state.baseOrigin.id ? "active" : ""}" type="button" data-color-id="${color.id}">
          <div class="picker-swatch" style="background:${color.hex}"></div>
          <div>
            <span class="picker-title">${escapeHtml(color.label || color.name)}</span>
            <span class="picker-meta">${escapeHtml(color.brandLabel)} · ${escapeHtml(color.hex)}</span>
          </div>
        </button>
      `,
    )
    .join("");
}

function renderCart() {
  const items = getCartItems();
  const uniqueBrands = new Set(items.map((entry) => entry.color.brandId));

  elements.cartSummary.innerHTML = `
    <span class="meta-pill">${escapeHtml(countText("reference", getCartReferenceCount()))}</span>
    <span class="meta-pill">${escapeHtml(countText("spray", getCartSprayCount()))}</span>
    <span class="meta-pill">${escapeHtml(countText("manufacturer", uniqueBrands.size))}</span>
  `;

  elements.cartDownload.disabled = items.length === 0;
  elements.cartClear.disabled = items.length === 0;

  if (!items.length) {
    elements.cartList.innerHTML = `
      <div class="empty-state compact-empty">
        <p class="empty-copy">${escapeHtml(ui("emptyCart"))}</p>
      </div>
    `;
    return;
  }

  elements.cartList.innerHTML = items
    .map((entry) => {
      const { color, quantity } = entry;
      const title = color.label || color.name;
      const code = color.code ? `<div class="cart-item-code">${escapeHtml(color.code)}</div>` : "";

      return `
        <article class="cart-item">
          <div class="cart-item-swatch" style="background:${color.hex}; color:${color.textColor}">${escapeHtml(color.hex)}</div>
          <div class="cart-item-body">
            <h3>${escapeHtml(title)}</h3>
            <p class="cart-item-meta">${escapeHtml(color.brandLabel)}</p>
            ${code}
          </div>
          <div class="cart-quantity" aria-label="${escapeHtml(ui("quantityAria", { title }))}">
            <button class="cart-step" type="button" data-cart-color-id="${color.id}" data-cart-step="-1">-</button>
            <span class="cart-quantity-value">${escapeHtml(String(quantity))}</span>
            <button class="cart-step" type="button" data-cart-color-id="${color.id}" data-cart-step="1">+</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderRule(contexts) {
  const validContexts = contexts.filter((context) => !context.reason);

  if (validContexts.length === 0 && contexts.length === 0) {
    elements.ruleTitle.textContent = ui("baseAloneTitle");
    elements.ruleFormula.textContent = ui("zeroAlgorithm");
    elements.ruleDescription.textContent = ui("activateAlgorithms");
    return;
  }

  if (validContexts.length === 0) {
    elements.ruleTitle.textContent = ui("blockedAlgorithmsTitle");
    elements.ruleFormula.textContent = countText("selection", contexts.length);
    elements.ruleDescription.textContent = ui("blockedAlgorithmsDescription");
    return;
  }

  if (validContexts.length === 1) {
    const [context] = validContexts;
    elements.ruleTitle.textContent = context.theory.label;
    elements.ruleFormula.textContent = context.theory.formula;
    elements.ruleDescription.textContent = context.theory.description;
    return;
  }

  const labels = validContexts.map((context) => context.theory.label);
  const compactLabels =
    labels.length <= 4 ? labels.join(" · ") : `${labels.slice(0, 4).join(" · ")} +${labels.length - 4}`;

  elements.ruleTitle.textContent = countText("activeAlgorithm", validContexts.length);
  elements.ruleFormula.textContent = compactLabels;
  elements.ruleDescription.textContent = ui("overlaidRulesDescription");
}

function renderBaseCaption(baseColor) {
  const origin = getBaseOrigin();
  const pills = [
    `<span class="base-pill">${escapeHtml(baseColor.hex)}</span>`,
    `<span class="base-pill">H ${escapeHtml(formatDegrees(baseColor.h))}</span>`,
    `<span class="base-pill">S ${escapeHtml(formatPercent(baseColor.s))}</span>`,
    `<span class="base-pill">L ${escapeHtml(formatPercent(baseColor.l))}</span>`,
  ];

  if (origin) {
    pills.push(
      `<span class="base-pill">${escapeHtml(
        ui("sourcePrefix", {
          source:
            state.baseOrigin?.kind === "image"
              ? `${ui("imagePaletteBrand")} ${origin.label || origin.name}`
              : origin.label || origin.name,
        }),
      )}</span>`,
    );
  } else {
    pills.push(`<span class="base-pill">${escapeHtml(ui("sourceCustom"))}</span>`);
  }

  elements.baseCaption.innerHTML = pills.join("");
}

function renderTheoryNote(contexts) {
  if (contexts.length === 0) {
    elements.theoryNote.textContent = ui("noActiveWheelNote");
    elements.theoryNote.style.display = "block";
    return;
  }

  const blocked = contexts.filter((context) => context.reason);
  if (!blocked.length) {
    elements.theoryNote.textContent = "";
    elements.theoryNote.style.display = "none";
    return;
  }

  elements.theoryNote.textContent = blocked
    .map((context) => `${context.theory.label}: ${context.reason}`)
    .join(" ");
  elements.theoryNote.style.display = "block";
}

function renderPaletteSummary(groups) {
  const hasBaseOnlyGroup = groups.length === 1 && groups[0].id === "base-only";
  const derivedStops = groups.reduce((count, group) => {
    if (group.reason || group.id === "base-only") {
      return count;
    }

    return count + group.stops.length;
  }, 0);
  const totalStops = hasBaseOnlyGroup ? groups[0].stops.length : 1 + derivedStops;

  elements.paletteSummary.innerHTML = `
    <span class="meta-pill">${escapeHtml(countText("block", groups.length))}</span>
    <span class="meta-pill">${escapeHtml(countText("color", totalStops))}</span>
    <span class="meta-pill">${escapeHtml(countText("algorithm", state.activeTheoryIds.size))}</span>
    <span class="meta-pill">${getSelectedManufacturers().map((brand) => brand.label).join(" + ")}</span>
  `;
}

function renderPaletteReference(baseStop, groups) {
  const hasBaseOnlyGroup = groups.length === 1 && groups[0].id === "base-only";

  if (hasBaseOnlyGroup) {
    elements.paletteReference.innerHTML = "";
    return;
  }

  elements.paletteReference.innerHTML = `
    <article class="palette-reference-card">
      <div class="palette-reference-head">
        <span class="field-label">${escapeHtml(ui("reference"))}</span>
        <span class="palette-reference-badge">${escapeHtml(baseStop.hex)}</span>
      </div>
      <div class="palette-reference-body">
        <div class="palette-reference-swatch" style="background:${baseStop.hex}; color:${baseStop.textColor}">
          ${escapeHtml(baseStop.hex)}
        </div>
        <div>
          <div class="palette-reference-title">${escapeHtml(ui("baseColorName"))}</div>
          <p class="palette-reference-meta">
            H ${escapeHtml(formatDegrees(baseStop.hsl.h))} · S ${escapeHtml(formatPercent(baseStop.hsl.s))} · L ${escapeHtml(formatPercent(baseStop.hsl.l))}
          </p>
          <p class="palette-reference-copy">${escapeHtml(baseStop.note)}</p>
        </div>
      </div>
    </article>
  `;
}

function renderColorCodeTooltip(tooltipId, hex) {
  const open = state.activeColorTooltipId === tooltipId;

  return `
    <span class="color-code-tooltip ${open ? "is-open" : ""}" role="status" aria-hidden="${open ? "false" : "true"}">
      ${escapeHtml(hex)}
    </span>
  `;
}

function isAlgoExpanded(groupId) {
  return state.expandedAlgoIds.has(groupId);
}

function renderAlgoPreview(displayStops) {
  return displayStops
    .map(
      (stop) => `
        <div
          class="algo-preview-chip"
          style="background:${stop.hex}; color:${stop.textColor}"
          title="${escapeHtml(stop.title)}"
        >
          <span class="algo-preview-letter">${escapeHtml(stop.letter)}</span>
        </div>
      `,
    )
    .join("");
}

function renderSwatches(groups, baseStop) {
  elements.swatchStrip.innerHTML = groups
    .map((group) => {
      if (group.reason) {
        return `
          <section class="algo-block">
            <div class="algo-head">
              <div>
                <h3 class="algo-title" title="${escapeHtml(group.title)}">${escapeHtml(group.title)}</h3>
                <p class="algo-formula">${escapeHtml(group.formula)}</p>
              </div>
              <span class="algo-count">${escapeHtml(ui("blockedLabel"))}</span>
            </div>
            <p class="algo-note">${escapeHtml(group.reason)}</p>
          </section>
        `;
      }

      const displayStops = group.stops;
      const expanded = isAlgoExpanded(group.id);

      const stopsMarkup = displayStops
        .map((stop) => {
          const isReference = group.id === "base-only";
          const stopTooltipId = `stop-${group.id}-${stop.letter}`;
          const matchesMarkup = stop.matches
            .map(({ brand, match }) => {
              if (!match) {
                return "";
              }

              const quantity = getCartQuantity(match.color.id);
              const inCart = quantity > 0;
              const matchTooltipId = `match-${stop.letter}-${match.color.id}`;

              return `
                <button
                  class="match-row ${inCart ? "in-cart" : ""}"
                  type="button"
                  data-cart-color-id="${match.color.id}"
                  aria-pressed="${inCart}"
                >
                  <span class="match-brand-head">
                    <span class="match-brand-copy">
                      <span class="match-brand-dot" style="background:${brand.accent}"></span>
                      <span class="match-brand" style="color:${brand.accent}">${escapeHtml(brand.label)}</span>
                    </span>
                    <span class="match-cart-badge">${inCart ? `x${escapeHtml(String(quantity))}` : escapeHtml(ui("add"))}</span>
                  </span>
                  <span class="match-main">
                    <span class="color-tooltip-anchor match-color-tooltip-anchor">
                      <span
                        class="match-swatch color-tooltip-trigger"
                        style="background:${match.color.hex}"
                        data-color-tooltip-trigger="true"
                        data-color-tooltip-id="${escapeHtml(matchTooltipId)}"
                      ></span>
                      ${renderColorCodeTooltip(matchTooltipId, match.color.hex)}
                    </span>
                    <span class="match-copy">
                      <span class="match-name" title="${escapeHtml(match.color.label || match.color.name)}">${escapeHtml(match.color.label || match.color.name)}</span>
                    </span>
                    <span class="match-actions">
                      <span class="match-score">${match.score}</span>
                    </span>
                  </span>
                </button>
              `;
            })
            .join("");

          return `
            <article class="swatch-card ${isReference ? "reference-card" : ""}">
              <div class="swatch-visual" style="background:${stop.hex}; color:${stop.textColor}">
                <span class="swatch-index">${escapeHtml(stop.letter)}</span>
                <div class="swatch-label">${escapeHtml(stop.title)}</div>
              </div>
              <div class="swatch-body">
                <div class="swatch-tools">
                  <button
                    class="color-tooltip-trigger-button"
                    type="button"
                    data-color-tooltip-trigger="true"
                    data-color-tooltip-id="${escapeHtml(stopTooltipId)}"
                    aria-label="${escapeHtml(`${ui("hexLabel")} ${stop.hex}`)}"
                    style="--tooltip-swatch:${stop.hex}"
                  ></button>
                  ${renderColorCodeTooltip(stopTooltipId, stop.hex)}
                </div>
                <p class="swatch-note">${escapeHtml(stop.note)}</p>
                <div class="match-list">${matchesMarkup}</div>
              </div>
            </article>
          `;
        })
        .join("");

      return `
        <section class="algo-block">
          <div class="algo-head">
            <div>
              <h3 class="algo-title" title="${escapeHtml(group.title)}">${escapeHtml(group.title)}</h3>
              <p class="algo-formula">${escapeHtml(group.formula)}</p>
            </div>
            <span class="algo-head-actions">
              <span class="algo-count">${escapeHtml(countText("color", displayStops.length))}</span>
              <button
                class="algo-toggle"
                type="button"
                data-algo-toggle-id="${group.id}"
                aria-expanded="${expanded}"
              >
                ${escapeHtml(ui(expanded ? "collapseResults" : "expandResults"))}
              </button>
            </span>
          </div>
          ${
            displayStops.length
              ? expanded
                ? `
                  <p class="algo-note">${escapeHtml(ui("basePrefix", { hex: baseStop.hex, description: group.description }))}</p>
                  <div class="algo-swatches">${stopsMarkup}</div>
                `
                : `<div class="algo-preview">${renderAlgoPreview(displayStops)}</div>`
              : `<div class="empty-state compact-empty"><p class="empty-copy">${escapeHtml(ui("noDerivedOutput"))}</p></div>`
          }
        </section>
      `;
    })
    .join("");
}

function renderWheel(activeColors, stops) {
  const cloud = activeColors
    .filter((color) => !color.isNeutral)
    .map((color) => {
      const point = polarPoint(color.h, color.s);
      return `<circle class="wheel-cloud-dot" cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="2" fill="${color.hex}" />`;
    })
    .join("");

  const guides = [0.25, 0.5, 0.75, 1]
    .map((step) => `<circle cx="0" cy="0" r="${(step * WHEEL_RADIUS).toFixed(2)}" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1" />`)
    .join("");

  const axes = [0, 45, 90, 135]
    .map((angle) => {
      const radians = angle * (Math.PI / 180);
      const x = Math.cos(radians) * WHEEL_RADIUS;
      const y = Math.sin(radians) * WHEEL_RADIUS;
      return `<line x1="${(-x).toFixed(2)}" y1="${(-y).toFixed(2)}" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" stroke="rgba(255,255,255,0.08)" stroke-width="1" />`;
    })
    .join("");

  const points = stops.map((stop) => ({
    ...stop,
    point: polarPoint(stop.hsl.h, stop.hsl.s),
  }));

  const connectors = points
    .slice(1)
    .map(
      (stop) =>
        `<line x1="${points[0].point.x.toFixed(2)}" y1="${points[0].point.y.toFixed(2)}" x2="${stop.point.x.toFixed(2)}" y2="${stop.point.y.toFixed(2)}" stroke="${stop.hex}" stroke-width="${points.length > 8 ? "1.8" : "2.6"}" stroke-linecap="round" opacity="${points.length > 8 ? "0.62" : "0.9"}" />`,
    )
    .join("");

  const handles = points
    .map((stop, index) => {
      const radius = index === 0 ? 16 : 13;
      const showLabel = index === 0 || points.length <= 8;
      return `
        <g transform="translate(${stop.point.x.toFixed(2)} ${stop.point.y.toFixed(2)})">
          <circle r="${radius}" fill="${stop.hex}" stroke="rgba(255,255,255,0.94)" stroke-width="3"></circle>
          ${showLabel ? `<text class="wheel-handle-label" x="0" y="1">${escapeHtml(stop.letter)}</text>` : ""}
        </g>
      `;
    })
    .join("");

  elements.wheelSvg.innerHTML = `
    <g>
      ${guides}
      ${axes}
      ${cloud}
      ${connectors}
      ${handles}
    </g>
  `;
}

function syncWheelPanelHeight() {
  if (!elements.appShell || !elements.wheelPanel) {
    return;
  }

  if (window.innerWidth <= 1100) {
    elements.appShell.style.removeProperty("--wheel-panel-height");
    return;
  }

  elements.appShell.style.setProperty("--wheel-panel-height", `${elements.wheelPanel.offsetHeight}px`);
}

function render() {
  const activeColors = getActiveColors();
  const baseColor = createBaseColor();
  const contexts = getTheoryContexts(baseColor);
  const palette = buildPaletteGroups(baseColor, contexts, activeColors);
  const wheelStops = buildWheelStops(palette.baseStop, palette.groups);
  const pickerResults = getPickerResults(baseColor, activeColors);

  renderStaticText();
  renderControlMenu();
  renderSidebarTabs();
  renderTopbar(activeColors);
  renderTheoryGroups();
  renderBrandPresets();
  renderBrandToggles();
  renderControls(baseColor);
  renderImageWorkspace();
  renderImageSample();
  renderImagePalette();
  renderImageModal();
  renderPickerResults(pickerResults);
  renderCart();
  renderRule(contexts);
  renderBaseCaption(baseColor);
  renderTheoryNote(contexts);
  renderPaletteSummary(palette.groups);
  renderPaletteReference(palette.baseStop, palette.groups);
  renderSwatches(palette.groups, palette.baseStop);
  renderWheel(activeColors, wheelStops);
  syncWheelPanelHeight();
  schedulePersistAppState();
}

function setBaseFromColor(color) {
  state.base = {
    h: color.h,
    s: color.s,
    l: color.l,
  };
  state.baseOrigin = { kind: "spray", id: color.id };
  render();
}

function setBaseFromImageColor(color) {
  state.base = {
    h: color.h,
    s: color.s,
    l: color.l,
  };
  state.baseOrigin = { kind: "image", id: color.id };
  render();
}

function setBase(next, origin = null) {
  state.base = {
    h: normalizeHue(next.h ?? state.base.h),
    s: clamp(next.s ?? state.base.s, 0, 1),
    l: clamp(next.l ?? state.base.l, 0, 1),
  };
  state.baseOrigin = origin;
  render();
}

function toggleBrand(brandId) {
  if (state.selectedBrands.has(brandId)) {
    if (state.selectedBrands.size === 1) {
      return;
    }
    state.selectedBrands.delete(brandId);
  } else {
    state.selectedBrands.add(brandId);
  }

  render();
}

function setBrandPreset(presetId) {
  const preset = getBrandPresets().find((entry) => entry.id === presetId);

  if (!preset) {
    return;
  }

  state.selectedBrands = new Set(preset.brands);

  render();
}

function toggleTheory(theoryId) {
  if (state.activeTheoryIds.has(theoryId)) {
    state.activeTheoryIds.delete(theoryId);
  } else {
    state.activeTheoryIds.add(theoryId);
  }

  render();
}

function activateTheoryFromTooltip(theoryId) {
  if (!THEORY_BY_ID.has(theoryId)) {
    return;
  }

  state.activeTheoryIds.add(theoryId);
  render();

  window.requestAnimationFrame(() => {
    const chip = elements.theoryGroups.querySelector(`[data-theory-id="${theoryId}"]`);
    chip?.scrollIntoView({ block: "nearest", inline: "nearest" });
    chip?.focus?.();
  });
}

function parseHexInput(value) {
  const trimmed = value.trim().toUpperCase();
  const normalized = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;

  if (!/^#[0-9A-F]{6}$/.test(normalized)) {
    return null;
  }

  return normalized;
}

function updateBaseFromWheelEvent(event) {
  const rect = elements.wheelShell.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const scale = 440 / rect.width;
  const x = (event.clientX - centerX) * scale;
  const y = (event.clientY - centerY) * scale;
  const distance = Math.min(Math.sqrt(x ** 2 + y ** 2), WHEEL_RADIUS);
  const hue = normalizeHue((Math.atan2(y, x) * 180) / Math.PI + 90);
  const saturation = clamp(distance / WHEEL_RADIUS, 0, 1);

  setBase(
    {
      h: hue,
      s: saturation,
      l: state.base.l,
    },
    null,
  );
}

function setActiveSidebarTab(tabId) {
  if (!SIDEBAR_TABS.has(tabId) || state.activeSidebarTab === tabId) {
    return;
  }

  state.activeSidebarTab = tabId;
  render();
}

function toggleAlgoExpanded(groupId) {
  if (state.expandedAlgoIds.has(groupId)) {
    state.expandedAlgoIds.delete(groupId);
  } else {
    state.expandedAlgoIds.add(groupId);
  }

  render();
}

function toggleColorTooltip(tooltipId) {
  state.activeColorTooltipId = state.activeColorTooltipId === tooltipId ? null : tooltipId;
  render();
}

function bindEvents() {
  elements.controlMenuToggle.addEventListener("click", toggleControlMenu);
  elements.controlMenuClose.addEventListener("click", () => {
    closeControlMenu();
  });
  elements.controlMenuBackdrop.addEventListener("click", () => {
    closeControlMenu({ restoreFocus: false });
  });

  elements.languageSelect.addEventListener("change", (event) => {
    state.language = event.currentTarget.value;
    persistLanguage();
    render();
  });

  elements.cartPanel.addEventListener("click", (event) => {
    const target = event.target.closest("[data-side-tab]");

    if (!target) {
      return;
    }

    setActiveSidebarTab(target.dataset.sideTab);
  });

  elements.controlPanel.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-accordion-trigger]");

    if (!trigger) {
      return;
    }

    const section = trigger.closest("[data-accordion-section]");

    if (!section) {
      return;
    }

    const isOpen = section.classList.contains("is-open");
    setAccordionSectionOpen(section, !isOpen);
  });

  elements.imageInput.addEventListener("change", async (event) => {
    const [file] = event.currentTarget.files || [];
    await loadImageFile(file);
  });

  elements.imageClear.addEventListener("click", clearImageSelection);
  elements.imagePaletteReset.addEventListener("click", clearImageSelection);
  elements.imageStage.addEventListener("click", () => {
    if (state.imageAsset && !isCompactMobileViewport()) {
      openImageModal();
    }
  });
  elements.imageOpenModal.addEventListener("click", openImageModal);

  elements.imageSaveColor.addEventListener("click", saveCurrentImageColor);
  elements.imageModalSaveColor.addEventListener("click", saveCurrentImageColor);
  elements.imageModalClose.addEventListener("click", () => {
    closeImageModal();
  });
  elements.imageModal.addEventListener("click", (event) => {
    if (event.target.closest("[data-image-modal-close]")) {
      closeImageModal();
    }
  });
  elements.imageCanvas.addEventListener("pointermove", (event) => {
    if (!isCompactMobileViewport()) {
      return;
    }

    positionImageCrosshair(
      elements.imageCanvas,
      elements.imageCrosshair,
      event.clientX,
      event.clientY,
    );
  });
  elements.imageCanvas.addEventListener("pointerleave", () => {
    hideImageCrosshair(elements.imageCrosshair);
  });
  elements.imageCanvas.addEventListener("click", (event) => {
    if (!isCompactMobileViewport()) {
      return;
    }

    updateImageSampleFromCanvasEvent(elements.imageCanvas, elements.imageCrosshair, event);
  });
  elements.imageModalCanvas.addEventListener("pointermove", (event) => {
    positionImageCrosshair(
      elements.imageModalCanvas,
      elements.imageModalCrosshair,
      event.clientX,
      event.clientY,
    );
  });
  elements.imageModalCanvas.addEventListener("pointerleave", () => {
    hideImageCrosshair(elements.imageModalCrosshair);
  });
  elements.imageModalCanvas.addEventListener("click", (event) => {
    updateImageSampleFromCanvasEvent(elements.imageModalCanvas, elements.imageModalCrosshair, event);
  });

  elements.imageInlinePalette.addEventListener("click", (event) => {
    const target = event.target.closest("[data-image-color-id]");

    if (!target) {
      return;
    }

    const color = state.imagePalette.find((entry) => entry.id === target.dataset.imageColorId);

    if (color) {
      setBaseFromImageColor(color);
    }
  });
  elements.imagePalette.addEventListener("click", (event) => {
    const target = event.target.closest("[data-image-color-id]");

    if (!target) {
      return;
    }

    const color = state.imagePalette.find((entry) => entry.id === target.dataset.imageColorId);

    if (color) {
      setBaseFromImageColor(color);
    }
  });

  elements.imageModalPalette.addEventListener("click", (event) => {
    const target = event.target.closest("[data-image-color-id]");

    if (!target) {
      return;
    }

    const color = state.imagePalette.find((entry) => entry.id === target.dataset.imageColorId);

    if (color) {
      setBaseFromImageColor(color);
    }
  });

  elements.theoryGroups.addEventListener("click", (event) => {
    const tooltipClose = event.target.closest("[data-theory-tooltip-close]");

    if (tooltipClose) {
      event.preventDefault();
      event.stopPropagation();
      closeTheoryTooltip(tooltipClose);
      return;
    }

    const tooltipHelp = event.target.closest(".theory-chip-help");

    if (tooltipHelp) {
      tooltipHelp.closest(".theory-help-wrap")?.classList.remove("is-dismissed");
    }

    const theoryReference = event.target.closest("[data-theory-ref-id]");

    if (theoryReference) {
      activateTheoryFromTooltip(theoryReference.dataset.theoryRefId);
      return;
    }

    const target = event.target.closest("[data-theory-id]");
    if (!target) {
      return;
    }

    toggleTheory(target.dataset.theoryId);
  });

  elements.brandPresets.addEventListener("click", (event) => {
    const target = event.target.closest("[data-brand-preset]");
    if (!target) {
      return;
    }

    setBrandPreset(target.dataset.brandPreset);
  });

  elements.brandToggles.addEventListener("click", (event) => {
    const target = event.target.closest("[data-brand-id]");
    if (!target) {
      return;
    }

    toggleBrand(target.dataset.brandId);
  });

  elements.hueRange.addEventListener("input", (event) => {
    setBase(
      {
        h: Number(event.currentTarget.value),
      },
      null,
    );
  });

  elements.satRange.addEventListener("input", (event) => {
    setBase(
      {
        s: Number(event.currentTarget.value) / 100,
      },
      null,
    );
  });

  elements.lightRange.addEventListener("input", (event) => {
    setBase(
      {
        l: Number(event.currentTarget.value) / 100,
      },
      null,
    );
  });

  const commitHex = () => {
    const parsed = parseHexInput(elements.hexInput.value);

    if (!parsed) {
      render();
      return;
    }

    const hsl = hexToHsl(parsed);
    setBase(
      {
        h: hsl.h,
        s: hsl.s,
        l: hsl.l,
      },
      null,
    );
  };

  elements.hexInput.addEventListener("change", commitHex);
  elements.hexInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      commitHex();
    }
  });

  elements.pickerSearch.addEventListener("input", (event) => {
    state.pickerSearch = event.currentTarget.value;
    render();
  });

  elements.pickerResults.addEventListener("click", (event) => {
    const target = event.target.closest("[data-color-id]");
    if (!target) {
      return;
    }

    const color = state.allColors.find((entry) => entry.id === target.dataset.colorId);
    if (color) {
      setBaseFromColor(color);
    }
  });

  elements.swatchStrip.addEventListener("click", (event) => {
    const algoToggle = event.target.closest("[data-algo-toggle-id]");

    if (algoToggle) {
      toggleAlgoExpanded(algoToggle.dataset.algoToggleId);
      return;
    }

    const tooltipTrigger = event.target.closest("[data-color-tooltip-trigger]");

    if (tooltipTrigger) {
      event.preventDefault();
      event.stopPropagation();
      toggleColorTooltip(tooltipTrigger.dataset.colorTooltipId);
      return;
    }

    const target = event.target.closest("[data-cart-color-id]");
    if (!target) {
      state.activeColorTooltipId = null;
      return;
    }

    const color = state.allColors.find((entry) => entry.id === target.dataset.cartColorId);
    if (color) {
      state.activeColorTooltipId = null;
      addColorToCart(color);
    }
  });

  elements.cartList.addEventListener("click", (event) => {
    const target = event.target.closest("[data-cart-color-id][data-cart-step]");
    if (!target) {
      return;
    }

    const step = Number(target.dataset.cartStep);
    const colorId = target.dataset.cartColorId;

    if (step > 0) {
      incrementCartColor(colorId);
      return;
    }

    decrementCartColor(colorId);
  });

  elements.cartClear.addEventListener("click", clearCart);
  elements.cartDownload.addEventListener("click", downloadCart);

  elements.wheelShell.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    state.draggingWheel = true;
    elements.wheelShell.setPointerCapture(event.pointerId);
    updateBaseFromWheelEvent(event);
  });

  elements.wheelShell.addEventListener("pointermove", (event) => {
    if (!state.draggingWheel) {
      return;
    }

    event.preventDefault();
    updateBaseFromWheelEvent(event);
  });

  const stopDrag = () => {
    state.draggingWheel = false;
  };

  elements.wheelShell.addEventListener("pointerup", stopDrag);
  elements.wheelShell.addEventListener("pointercancel", stopDrag);

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.isImageModalOpen) {
      closeImageModal();
      return;
    }

    if (event.key === "Escape" && state.isControlMenuOpen) {
      closeControlMenu();
    }
  });
}

function pickInitialBaseColor(colors) {
  const seed = buildColorRecord({
    id: "seed",
    brandId: "virtual",
    brandLabel: "Custom",
    name: "Seed",
    code: "",
    label: "Seed",
    hex: "#F05A28",
    meta: {},
  });

  return [...colors]
    .filter((color) => !color.isNeutral)
    .sort((first, second) => deltaE(seed.lab, first.lab) - deltaE(seed.lab, second.lab))[0] || colors[0];
}

function renderFatalError(error) {
  document.documentElement.lang = state.language;
  document.title = ui("errorLoadingTitle");
  document.body.innerHTML = `
    <main class="app-shell">
      <section class="panel palette-panel">
        <div class="empty-state">
          <h1>${escapeHtml(ui("errorLoadingTitle"))}</h1>
          <p class="empty-copy">${escapeHtml(error.message || ui("errorLoadingApp"))}</p>
          <p class="empty-copy">${escapeHtml(ui("runViaServer"))}</p>
        </div>
      </section>
    </main>
  `;
}

async function loadData() {
  const manifestUrl = new URL("./manufacturers/index.json", window.location.href);
  const manifestResponse = await fetch(manifestUrl);

  if (!manifestResponse.ok) {
    throw new Error(ui("manifestLoadError"));
  }

  const manifest = await manifestResponse.json();
  const entries = Array.isArray(manifest?.manufacturers) ? manifest.manufacturers : [];

  if (!entries.length) {
    throw new Error(ui("noManufacturersDeclared"));
  }

  const catalogs = await Promise.all(
    entries.map(async (entry, catalogIndex) => {
      const response = await fetch(new URL(entry.path, manifestUrl));

      if (!response.ok) {
        throw new Error(ui("catalogLoadError", { name: entry.id || entry.path }));
      }

      const json = await response.json();
      return normalizeManufacturerCatalog(json, catalogIndex);
    }),
  );

  state.manufacturers = catalogs.map((catalog) => catalog.manufacturer);
  state.selectedBrands = new Set(state.manufacturers.map((manufacturer) => manufacturer.id));
  state.allColors = catalogs.flatMap((catalog) => catalog.colors);
  reconcileCart();

  if (!state.allColors.length) {
    throw new Error(ui("noColorsLoaded"));
  }

  const restored = await restoreAppState(persistedAppSnapshot);

  if (!restored) {
    const initial = pickInitialBaseColor(state.allColors);
    state.base = {
      h: initial.h,
      s: initial.s,
      l: initial.l,
    };
    state.baseOrigin = { kind: "spray", id: initial.id };
  }

  render();
}

async function boot() {
  loadLanguageFromStorage();
  loadCartFromStorage();
  loadAppStateFromStorage();
  renderLanguageOptions();
  renderStaticText();
  renderControlMenu();
  initializeAccordionSections();
  bindEvents();
  await loadData();

  if (typeof ResizeObserver !== "undefined" && elements.wheelPanel) {
    const observer = new ResizeObserver(() => {
      syncWheelPanelHeight();
    });
    observer.observe(elements.wheelPanel);
  }

  window.addEventListener("resize", () => {
    if (isMobileControlMenu()) {
      renderControlMenu();
    } else if (state.isControlMenuOpen) {
      closeControlMenu({ restoreFocus: false });
    }
    renderImageWorkspace();
    renderImageModal();
    syncWheelPanelHeight();
  });
  window.addEventListener("pagehide", persistAppState);
}

boot().catch(renderFatalError);
