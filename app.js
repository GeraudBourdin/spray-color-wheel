import {
  clamp,
  deltaE,
  getContrastingText,
  hexToHsl,
  hexToLab,
  hexToRgb,
  hslToHex,
  labToLch,
  lchToLab,
  lchToHex,
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
const WHEEL_RADIUS = 198;
const WHEEL_CHROMA_MAX = 110;
const WHEEL_SURFACE_RESOLUTION_FACTOR = 0.28;
const WHEEL_SURFACE_RESOLUTION_MIN = 96;
const WHEEL_SURFACE_RESOLUTION_MAX = 144;
const SNAP_CAN_ACCESS_MAX_DISTANCE = 18;
const UNAVAILABLE_CAN_HEX = "#A3A9B5";
const IMAGE_SAMPLE_MAX_SIDE = 960;
const IMAGE_PREVIEW_FALLBACK_WIDTH = 320;
const IMAGE_PREVIEW_MAX_HEIGHT = 260;
const IMAGE_MODAL_FALLBACK_WIDTH = 860;
const IMAGE_MODAL_FALLBACK_HEIGHT = 680;
const IMAGE_MODAL_ZOOM_MIN = 1;
const IMAGE_MODAL_ZOOM_MAX = 6;
const IMAGE_MODAL_ZOOM_STEP = 0.25;
const IMAGE_MODAL_ZOOM_DEFAULT = 1;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const SIDEBAR_TABS = new Set(["image-upload", "image-palette", "hue", "picker"]);
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
let copiedChoiceActionTimer = 0;
let wheelSurfaceCacheKey = "";

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
  imageModalZoom: IMAGE_MODAL_ZOOM_DEFAULT,
  isCartModalOpen: false,
  copiedChoiceActionKey: null,
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
  wheelDragLightness: null,
  wheelSnapMode: "theory",
  showWheelSprays: true,
  showWheelSurface: true,
  showWheelGuide: false,
  baseWheelPointSource: null,
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
  topbarContactLink: document.querySelector("#topbar-contact-link"),
  languageLabel: document.querySelector("#language-label"),
  languageSelect: document.querySelector("#language-select"),
  algorithmsLabel: document.querySelector("#algorithms-label"),
  manufacturersLabel: document.querySelector("#manufacturers-label"),
  baseControlsLabel: document.querySelector("#base-controls-label"),
  sidebarTabButtons: Array.from(document.querySelectorAll("[data-side-tab]")),
  sidebarTabImageUploadLabel: document.querySelector("#sidebar-tab-image-upload-label"),
  sidebarTabImagePaletteLabel: document.querySelector("#sidebar-tab-image-palette-label"),
  sidebarTabHueLabel: document.querySelector("#sidebar-tab-hue-label"),
  sidebarTabPickerLabel: document.querySelector("#sidebar-tab-picker-label"),
  sidebarPanels: {
    "image-upload": document.querySelector("#sidebar-panel-image-upload"),
    "image-palette": document.querySelector("#sidebar-panel-image-palette"),
    hue: document.querySelector("#sidebar-panel-hue"),
    picker: document.querySelector("#sidebar-panel-picker"),
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
  imageModalViewport: document.querySelector("#image-modal-viewport"),
  imageModalCanvas: document.querySelector("#image-modal-canvas"),
  imageModalCrosshair: document.querySelector("#image-modal-crosshair"),
  imageModalZoomLabel: document.querySelector("#image-modal-zoom-label"),
  imageModalZoomValue: document.querySelector("#image-modal-zoom-value"),
  imageModalZoomOut: document.querySelector("#image-modal-zoom-out"),
  imageModalZoomRange: document.querySelector("#image-modal-zoom-range"),
  imageModalZoomIn: document.querySelector("#image-modal-zoom-in"),
  imageModalZoomReset: document.querySelector("#image-modal-zoom-reset"),
  imageModalSample: document.querySelector("#image-modal-sample"),
  imageModalSaveColor: document.querySelector("#image-modal-save-color"),
  imageModalPaletteLabel: document.querySelector("#image-modal-palette-label"),
  imageModalPalette: document.querySelector("#image-modal-palette"),
  cartModalOpen: document.querySelector("#cart-modal-open"),
  cartModalOpenLabel: document.querySelector("#cart-modal-open-label"),
  cartModalOpenCount: document.querySelector("#cart-modal-open-count"),
  cartModal: document.querySelector("#cart-modal"),
  cartModalEyebrow: document.querySelector("#cart-modal-eyebrow"),
  cartModalTitle: document.querySelector("#cart-modal-title"),
  cartModalClose: document.querySelector("#cart-modal-close"),
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
  wheelDisplayLabel: document.querySelector("#wheel-display-label"),
  wheelSnapLabel: document.querySelector("#wheel-snap-label"),
  wheelSurfaceToggle: document.querySelector("#wheel-surface-toggle"),
  wheelSpraysToggle: document.querySelector("#wheel-sprays-toggle"),
  wheelSnapTheory: document.querySelector("#wheel-snap-theory"),
  wheelSnapCans: document.querySelector("#wheel-snap-cans"),
  wheelGuideLabel: document.querySelector("#wheel-guide-label"),
  wheelGuideToggle: document.querySelector("#wheel-guide-toggle"),
  wheelLegend: document.querySelector("#wheel-legend"),
  wheelGuideCopy: document.querySelector("#wheel-guide-copy"),
  wheelGuidePanel: document.querySelector("#wheel-guide-panel"),
  wheelPanel: document.querySelector(".wheel-panel"),
  wheelShell: document.querySelector("#wheel-shell"),
  wheelSurface: document.querySelector("#wheel-surface"),
  wheelSvg: document.querySelector("#wheel-svg"),
  wheelGuideOverlay: document.querySelector("#wheel-guide-overlay"),
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

function clampImageModalZoom(value) {
  const normalized = Math.round((Number(value) || IMAGE_MODAL_ZOOM_DEFAULT) / IMAGE_MODAL_ZOOM_STEP) * IMAGE_MODAL_ZOOM_STEP;
  return clamp(Number(normalized.toFixed(2)), IMAGE_MODAL_ZOOM_MIN, IMAGE_MODAL_ZOOM_MAX);
}

function formatImageModalZoom(value) {
  return `${Math.round(clampImageModalZoom(value) * 100)}%`;
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
    brandId: typeof input.brandId === "string" ? input.brandId : "image",
    brandLabel: typeof input.brandLabel === "string" ? input.brandLabel : "image",
    name: input.name || input.label || normalizedHex,
    code: typeof input.code === "string" ? input.code : "",
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
    brandId: color.brandId,
    brandLabel: color.brandLabel,
    code: color.code || "",
    meta: color.meta || {},
  };
}

function serializeWheelPointSource(pointSource) {
  const lch = pointSource?.lch;

  if (!lch || !Number.isFinite(lch.l) || !Number.isFinite(lch.c) || !Number.isFinite(lch.h)) {
    return null;
  }

  return {
    l: lch.l,
    c: lch.c,
    h: lch.h,
  };
}

function normalizeStoredWheelPointSource(input) {
  if (!input || typeof input !== "object") {
    return null;
  }

  const l = Number(input.l);
  const c = Number(input.c);
  const h = Number(input.h);

  if (!Number.isFinite(l) || !Number.isFinite(c) || !Number.isFinite(h)) {
    return null;
  }

  return {
    lch: {
      l,
      c: Math.max(c, 0),
      h: normalizeHue(h),
    },
    lab: lchToLab(l, Math.max(c, 0), normalizeHue(h)),
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
    wheelSnapMode: state.wheelSnapMode,
    showWheelSprays: state.showWheelSprays,
    showWheelSurface: state.showWheelSurface,
    showWheelGuide: state.showWheelGuide,
    baseWheelPointSource: serializeWheelPointSource(state.baseWheelPointSource),
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
  elements.topbarContactLink.textContent = `${ui("stayInTouch")} · Instagram`;
  elements.topbarContactLink.setAttribute("aria-label", `${ui("stayInTouch")} Instagram`);
  elements.languageLabel.textContent = ui("languageLabel");
  elements.algorithmsLabel.textContent = ui("algorithmsLabel");
  elements.manufacturersLabel.textContent = ui("manufacturersLabel");
  elements.baseControlsLabel.textContent = ui("baseControlsLabel");
  elements.sidebarTabImageUploadLabel.textContent = ui("imageUploadLabel");
  elements.sidebarTabImagePaletteLabel.textContent = ui("imagePaletteLabel");
  elements.sidebarTabHueLabel.textContent = ui("baseControlsLabel");
  elements.sidebarTabPickerLabel.textContent = ui("pickerLabel");
  elements.hexLabel.textContent = ui("hexLabel");
  elements.hueLabel.textContent = ui("hueLabel");
  elements.saturationLabel.textContent = ui("saturationLabel");
  elements.lightnessLabel.textContent = ui("lightnessLabel");
  elements.imageLabel.textContent = ui("imageLabel");
  elements.imageUploadLabel.textContent = ui("imageUploadLabel");
  elements.imageHint.textContent = ui("imageHint");
  elements.imageClear.textContent = ui("imageRemove");
  elements.imagePaletteReset.textContent = ui("clear");
  elements.imageClear.setAttribute("aria-label", ui("imageRemove"));
  elements.imagePaletteReset.setAttribute("aria-label", ui("clear"));
  elements.imageOpenModal.textContent = ui("imageOpenModal");
  elements.imageSaveColor.textContent = ui("imageSaveColor");
  elements.imageInlinePaletteLabel.textContent = ui("imagePaletteLabel");
  elements.imagePaletteLabel.textContent = ui("imagePaletteLabel");
  elements.imageModalEyebrow.textContent = ui("imageLabel");
  elements.imageModalTitle.textContent = ui("imageModalTitle");
  elements.imageModalClose.textContent = ui("close");
  elements.imageModalZoomLabel.textContent = ui("imageModalZoomLabel");
  elements.imageModalZoomOut.setAttribute("aria-label", ui("imageModalZoomOut"));
  elements.imageModalZoomIn.setAttribute("aria-label", ui("imageModalZoomIn"));
  elements.imageModalZoomReset.textContent = ui("imageModalZoomReset");
  elements.imageModalZoomReset.setAttribute("aria-label", ui("imageModalZoomReset"));
  elements.imageModalHint.textContent = ui("imageModalHint");
  elements.imageModalSaveColor.textContent = ui("imageSaveColor");
  elements.imageModalPaletteLabel.textContent = ui("imagePaletteLabel");
  elements.cartModalOpenLabel.textContent = ui("cartLabel");
  elements.cartModalEyebrow.textContent = ui("cartLabel");
  elements.cartModalTitle.textContent = ui("cartLabel");
  elements.cartModalClose.textContent = ui("close");
  elements.pickerLabel.textContent = ui("pickerLabel");
  elements.pickerSearch.placeholder = ui("pickerPlaceholder");
  elements.wheelEyebrow.textContent = ui("wheelEyebrow");
  elements.wheelDisplayLabel.textContent = ui("wheelLayersLabel");
  elements.wheelSnapLabel.textContent = ui("wheelSnapLabel");
  elements.wheelGuideLabel.textContent = ui("wheelGuideLabel");
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
  elements.imageModalZoomRange.setAttribute("aria-label", ui("imageModalZoomLabel"));
  elements.languageSelect.setAttribute("aria-label", ui("languageLabel"));
  elements.imageInput.setAttribute("aria-label", ui("imageUploadLabel"));
  elements.imageOpenModal.setAttribute("aria-label", ui("imageOpenModal"));
  elements.imageModalClose.setAttribute("aria-label", ui("close"));
  elements.cartModalOpen.setAttribute("aria-label", ui("cartLabel"));
  elements.cartModalClose.setAttribute("aria-label", ui("close"));
  elements.pickerSearch.setAttribute("aria-label", ui("pickerLabel"));
}

function renderWheelVisibilityControls() {
  const surfaceVisible = state.showWheelSurface;
  const spraysVisible = state.showWheelSprays;
  const snapTheory = state.wheelSnapMode === "theory";
  const snapCans = state.wheelSnapMode === "cans";

  elements.wheelSurfaceToggle.textContent = ui(surfaceVisible ? "hideWheelSurface" : "showWheelSurface");
  elements.wheelSurfaceToggle.setAttribute("aria-pressed", surfaceVisible ? "true" : "false");
  elements.wheelSurfaceToggle.setAttribute("aria-label", ui(surfaceVisible ? "hideWheelSurface" : "showWheelSurface"));
  elements.wheelSurfaceToggle.classList.toggle("active", surfaceVisible);

  elements.wheelSpraysToggle.textContent = ui(spraysVisible ? "hideWheelSprays" : "showWheelSprays");
  elements.wheelSpraysToggle.setAttribute("aria-pressed", spraysVisible ? "true" : "false");
  elements.wheelSpraysToggle.setAttribute("aria-label", ui(spraysVisible ? "hideWheelSprays" : "showWheelSprays"));
  elements.wheelSpraysToggle.classList.toggle("active", spraysVisible);

  elements.wheelSnapTheory.textContent = ui("snapToTheory");
  elements.wheelSnapTheory.setAttribute("aria-pressed", snapTheory ? "true" : "false");
  elements.wheelSnapTheory.setAttribute("aria-label", ui("snapToTheory"));
  elements.wheelSnapTheory.classList.toggle("active", snapTheory);

  elements.wheelSnapCans.textContent = ui("snapToCans");
  elements.wheelSnapCans.setAttribute("aria-pressed", snapCans ? "true" : "false");
  elements.wheelSnapCans.setAttribute("aria-label", ui("snapToCans"));
  elements.wheelSnapCans.classList.toggle("active", snapCans);
}

function renderWheelGuide(baseColor) {
  const guideVisible = state.showWheelGuide;
  const lightness = formatPercent(baseColor.l);
  const guideToggleLabel = ui(guideVisible ? "hideWheelGuide" : "showWheelGuide");
  const legendItems = [
    { tone: "hue", label: ui("wheelLegendHue") },
    { tone: "center", label: ui("wheelLegendCenter") },
    { tone: "edge", label: ui("wheelLegendEdge") },
    { tone: "lightness", label: ui("wheelLegendLightness", { lightness }) },
  ];
  const guideSteps = [
    {
      step: "1",
      title: ui("wheelGuideStepAngleTitle"),
      copy: ui("wheelGuideStepAngleCopy"),
    },
    {
      step: "2",
      title: ui("wheelGuideStepRadiusTitle"),
      copy: ui("wheelGuideStepRadiusCopy"),
    },
    {
      step: "3",
      title: ui("wheelGuideStepLightnessTitle"),
      copy: ui("wheelGuideStepLightnessCopy", { lightness }),
    },
  ];

  elements.wheelGuideToggle.textContent = guideToggleLabel;
  elements.wheelGuideToggle.setAttribute("aria-label", guideToggleLabel);
  elements.wheelGuideToggle.setAttribute("aria-pressed", guideVisible ? "true" : "false");
  elements.wheelGuideToggle.setAttribute("aria-expanded", guideVisible ? "true" : "false");
  elements.wheelGuideToggle.classList.toggle("active", guideVisible);

  elements.wheelLegend.innerHTML = legendItems
    .map((item) => `<span class="wheel-legend-pill is-${item.tone}">${escapeHtml(item.label)}</span>`)
    .join("");
  elements.wheelGuideCopy.textContent = ui("wheelGuideCopy");

  elements.wheelGuidePanel.hidden = !guideVisible;
  elements.wheelGuideOverlay.hidden = !guideVisible;
  elements.wheelShell.classList.toggle("is-guide-mode", guideVisible);

  elements.wheelGuidePanel.innerHTML = guideSteps
    .map(
      (item) => `
        <article class="wheel-guide-card">
          <span class="wheel-guide-step">${item.step}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.copy)}</p>
        </article>
      `,
    )
    .join("");

  elements.wheelGuideOverlay.innerHTML = guideVisible
    ? `
        <div class="wheel-guide-ring is-center"></div>
        <div class="wheel-guide-ring is-edge"></div>
      `
    : "";
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

function flashCopiedChoiceAction(actionKey) {
  state.copiedChoiceActionKey = actionKey;

  if (copiedChoiceActionTimer) {
    window.clearTimeout(copiedChoiceActionTimer);
  }

  render();

  copiedChoiceActionTimer = window.setTimeout(() => {
    copiedChoiceActionTimer = 0;
    state.copiedChoiceActionKey = null;
    render();
  }, 1400);
}

async function copySprayChoiceValue(color, copyKind) {
  if (!color) {
    return;
  }

  const value = copyKind === "reference" ? buildColorReferenceText(color) : color.hex;
  const actionKey = `${copyKind}:${color.id}`;
  const copied = await copyTextToClipboard(value);

  if (!copied) {
    window.alert(ui("copyFailed"));
    return;
  }

  flashCopiedChoiceAction(actionKey);
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
  const lab = hexToLab(hex);

  return {
    ...input,
    hex,
    h: hsl.h,
    s: hsl.s,
    l: hsl.l,
    rgb: hexToRgb(hex),
    lab,
    lch: labToLch(lab),
    isNeutral: isNeutralColor(hsl),
    textColor: getContrastingText(hex),
  };
}

function getWheelSelectionLightness() {
  if (state.draggingWheel && Number.isFinite(state.wheelDragLightness)) {
    return clamp(state.wheelDragLightness, 0, 1);
  }

  return clamp(state.base.l, 0, 1);
}

function getWheelPlacement(entry) {
  const lab = entry?.lab || hexToLab(entry?.hex || "#000000");
  const lch = entry?.lch || labToLch(lab);
  const radius = clamp(lch.c / WHEEL_CHROMA_MAX, 0, 1);

  return {
    lab,
    lch,
    radius,
    point: polarPoint(lch.h, radius),
  };
}

function createWheelEntry(color) {
  const placement = getWheelPlacement(color);

  return {
    color,
    rgb: color.rgb || hexToRgb(color.hex),
    lightness: clamp(typeof color.l === "number" ? color.l : placement.lab.l / 100, 0, 1),
    point: placement.point,
    radius: placement.radius,
    hue: placement.lch.h,
    chroma: placement.lch.c,
  };
}

function buildWheelEntries(colors) {
  return colors.map((color) => createWheelEntry(color));
}

function getWheelPointScore(entry, x, y) {
  const dx = entry.point.x - x;
  const dy = entry.point.y - y;

  return dx ** 2 + dy ** 2;
}

function findClosestWheelEntry(x, y, wheelEntries) {
  let best = null;

  for (const entry of wheelEntries) {
    const score = getWheelPointScore(entry, x, y);

    if (!best || score < best.score) {
      best = {
        entry,
        score,
      };
    }
  }

  return best;
}

function blendWheelSurfaceColor(x, y, wheelEntries) {
  let red = 0;
  let green = 0;
  let blue = 0;
  let totalWeight = 0;

  for (const entry of wheelEntries) {
    const dx = entry.point.x - x;
    const dy = entry.point.y - y;
    const distanceSquared = dx ** 2 + dy ** 2;
    const weight = 1 / (distanceSquared + 64);

    red += entry.rgb.r * weight;
    green += entry.rgb.g * weight;
    blue += entry.rgb.b * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) {
    return null;
  }

  return {
    r: Math.round(red / totalWeight),
    g: Math.round(green / totalWeight),
    b: Math.round(blue / totalWeight),
  };
}

function getWheelInteractionRect() {
  const surfaceRect = elements.wheelSurface?.getBoundingClientRect();

  if (surfaceRect && surfaceRect.width > 0 && surfaceRect.height > 0) {
    return surfaceRect;
  }

  return elements.wheelShell.getBoundingClientRect();
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
    meta: {
      sourceKind: "image",
    },
  });
}

function createPaletteColorFromSpray(color) {
  return buildColorRecord({
    id: color.id,
    brandId: color.brandId,
    brandLabel: color.brandLabel,
    name: color.name,
    code: color.code || "",
    label: color.label || color.name,
    hex: color.hex,
    searchTerms: Array.isArray(color.searchTerms) ? [...color.searchTerms] : [],
    meta: {
      ...(color.meta && typeof color.meta === "object" ? color.meta : {}),
      sourceKind: "spray",
      sourceColorId: color.id,
      sourceBrandLabel: color.brandLabel || "",
    },
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

function drawZoomableImageCanvas(canvas, maxWidth, maxHeight, zoom = IMAGE_MODAL_ZOOM_DEFAULT) {
  if (!state.imageAsset || !canvas) {
    return;
  }

  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  const { displayWidth: fitWidth, displayHeight: fitHeight } = getImageFitDimensions(maxWidth, maxHeight);
  const safeZoom = clampImageModalZoom(zoom);
  const displayWidth = Math.max(1, Math.round(fitWidth * safeZoom));
  const displayHeight = Math.max(1, Math.round(fitHeight * safeZoom));
  const devicePixelRatio = window.devicePixelRatio || 1;
  const renderScale = Math.min(1, state.imageAsset.sampleWidth / displayWidth);
  const renderWidth = Math.max(1, Math.round(displayWidth * renderScale * devicePixelRatio));
  const renderHeight = Math.max(1, Math.round(displayHeight * renderScale * devicePixelRatio));

  canvas.width = renderWidth;
  canvas.height = renderHeight;
  canvas.style.width = `${displayWidth}px`;
  canvas.style.maxWidth = "none";
  canvas.style.height = `${displayHeight}px`;
  canvas.style.maxHeight = "none";
  canvas.style.aspectRatio = `${fitWidth} / ${fitHeight}`;
  canvas.style.imageRendering = safeZoom > 2 ? "pixelated" : "auto";

  context.setTransform(1, 0, 0, 1, 0, 0);
  context.imageSmoothingEnabled = true;
  context.clearRect(0, 0, renderWidth, renderHeight);
  context.drawImage(state.imageAsset.sampleCanvas, 0, 0, renderWidth, renderHeight);
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
  canvas.style.imageRendering = "";
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
  const offsetParentRect =
    crosshair.parentElement?.getBoundingClientRect() || crosshair.offsetParent?.getBoundingClientRect() || rect;

  if (!rect.width || !rect.height) {
    hideImageCrosshair(crosshair);
    return;
  }

  const minX = rect.left - offsetParentRect.left;
  const maxX = minX + rect.width;
  const minY = rect.top - offsetParentRect.top;
  const maxY = minY + rect.height;
  const x = clamp(clientX - offsetParentRect.left, minX, maxX);
  const y = clamp(clientY - offsetParentRect.top, minY, maxY);

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
      sourceKind: "image",
      sampleX: centerX,
      sampleY: centerY,
    },
  };
}

function getImageModalViewportAnchor() {
  const viewport = elements.imageModalViewport;

  if (!viewport) {
    return null;
  }

  const contentWidth = Math.max(viewport.scrollWidth, viewport.clientWidth, 1);
  const contentHeight = Math.max(viewport.scrollHeight, viewport.clientHeight, 1);

  return {
    x: (viewport.scrollLeft + viewport.clientWidth / 2) / contentWidth,
    y: (viewport.scrollTop + viewport.clientHeight / 2) / contentHeight,
  };
}

function restoreImageModalViewportAnchor(anchor) {
  const viewport = elements.imageModalViewport;

  if (!viewport || !anchor) {
    return;
  }

  const contentWidth = Math.max(viewport.scrollWidth, viewport.clientWidth, 1);
  const contentHeight = Math.max(viewport.scrollHeight, viewport.clientHeight, 1);
  const maxScrollLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  const maxScrollTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight);

  viewport.scrollLeft = clamp(anchor.x * contentWidth - viewport.clientWidth / 2, 0, maxScrollLeft);
  viewport.scrollTop = clamp(anchor.y * contentHeight - viewport.clientHeight / 2, 0, maxScrollTop);
}

function setImageModalZoom(nextZoom) {
  const normalizedZoom = clampImageModalZoom(nextZoom);

  if (normalizedZoom === state.imageModalZoom) {
    return;
  }

  const anchor = getImageModalViewportAnchor();
  state.imageModalZoom = normalizedZoom;
  hideImageCrosshair(elements.imageModalCrosshair);
  render();

  window.requestAnimationFrame(() => {
    restoreImageModalViewportAnchor(anchor);
  });
}

function resetImageModalZoom() {
  setImageModalZoom(IMAGE_MODAL_ZOOM_DEFAULT);
}

function renderImageModalZoomControls() {
  const hasImage = Boolean(state.imageAsset);
  const zoom = clampImageModalZoom(state.imageModalZoom);
  const canZoomOut = zoom > IMAGE_MODAL_ZOOM_MIN;
  const canZoomIn = zoom < IMAGE_MODAL_ZOOM_MAX;

  elements.imageModalZoomRange.min = String(IMAGE_MODAL_ZOOM_MIN);
  elements.imageModalZoomRange.max = String(IMAGE_MODAL_ZOOM_MAX);
  elements.imageModalZoomRange.step = String(IMAGE_MODAL_ZOOM_STEP);
  elements.imageModalZoomRange.value = String(zoom);
  elements.imageModalZoomValue.textContent = formatImageModalZoom(zoom);
  elements.imageModalZoomOut.disabled = !hasImage || !canZoomOut;
  elements.imageModalZoomIn.disabled = !hasImage || !canZoomIn;
  elements.imageModalZoomRange.disabled = !hasImage;
  elements.imageModalZoomReset.disabled = !hasImage || zoom === IMAGE_MODAL_ZOOM_DEFAULT;
}

function openImageModal() {
  if (!state.imageAsset || isCompactMobileViewport()) {
    return;
  }

  state.activeSidebarTab = "image-upload";
  state.isCartModalOpen = false;
  state.isImageModalOpen = true;
  state.imageModalZoom = IMAGE_MODAL_ZOOM_DEFAULT;
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
  state.imageModalZoom = IMAGE_MODAL_ZOOM_DEFAULT;
  hideImageCrosshair(elements.imageModalCrosshair);
  render();

  if (restoreFocus) {
    window.requestAnimationFrame(() => {
      elements.imageOpenModal?.focus?.();
    });
  }
}

function openCartModal() {
  state.isImageModalOpen = false;
  state.isCartModalOpen = true;
  render();

  window.requestAnimationFrame(() => {
    elements.cartModalClose?.focus?.();
  });
}

function closeCartModal({ restoreFocus = true } = {}) {
  if (!state.isCartModalOpen) {
    return;
  }

  state.isCartModalOpen = false;
  render();

  if (restoreFocus) {
    window.requestAnimationFrame(() => {
      elements.cartModalOpen?.focus?.();
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
    state.activeSidebarTab = "image-upload";
    state.isImageModalOpen = !isCompactMobileViewport();
    state.imageModalZoom = IMAGE_MODAL_ZOOM_DEFAULT;

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
    state.isImageModalOpen = false;
    state.imageModalZoom = IMAGE_MODAL_ZOOM_DEFAULT;
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
  state.isImageModalOpen = false;
  state.imageModalZoom = IMAGE_MODAL_ZOOM_DEFAULT;
  state.activeSidebarTab = "image-upload";

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
  state.wheelSnapMode = snapshot.wheelSnapMode === "cans" ? "cans" : "theory";
  state.showWheelSprays = typeof snapshot.showWheelSprays === "boolean" ? snapshot.showWheelSprays : true;
  state.showWheelSurface = typeof snapshot.showWheelSurface === "boolean" ? snapshot.showWheelSurface : true;
  state.showWheelGuide = typeof snapshot.showWheelGuide === "boolean" ? snapshot.showWheelGuide : false;
  state.baseWheelPointSource = normalizeStoredWheelPointSource(snapshot.baseWheelPointSource);
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
      state.baseWheelPointSource = null;
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
      state.baseWheelPointSource = null;
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

  const existing = state.imagePalette.find(
    (color) => color.hex === state.imageSampleColor.hex && (color.meta?.sourceKind || "image") === "image",
  );

  if (existing) {
    setBaseFromImageColor(existing);
    return;
  }

  const color = createImagePaletteColor(state.imageSampleColor.hex);
  state.imagePalette = [...state.imagePalette, color];
  setBaseFromImageColor(color);
}

function addSprayColorToPalette(color) {
  if (!color) {
    return;
  }

  const existing = state.imagePalette.find(
    (entry) => entry.id === color.id && entry.meta?.sourceKind === "spray",
  );

  if (existing) {
    return;
  }

  state.imagePalette = [...state.imagePalette, createPaletteColorFromSpray(color)];
  render();
}

function getPaletteSpraySource(color) {
  if (!color) {
    return null;
  }

  const sourceId = color.meta?.sourceColorId || color.id;
  return state.allColors.find((entry) => entry.id === sourceId) || null;
}

function isSprayColorInPalette(colorId) {
  return state.imagePalette.some((entry) => {
    if ((entry.meta?.sourceKind || "image") !== "spray") {
      return false;
    }

    return (entry.meta?.sourceColorId || entry.id) === colorId;
  });
}

function isPaletteColorActive(color) {
  if (!color || !state.baseOrigin?.id) {
    return false;
  }

  if (state.baseOrigin.kind === "image") {
    return state.baseOrigin.id === color.id;
  }

  const spraySource = getPaletteSpraySource(color);
  return Boolean(spraySource && state.baseOrigin.kind === "spray" && state.baseOrigin.id === spraySource.id);
}

function selectPaletteColor(color) {
  if (!color) {
    return;
  }

  const spraySource = getPaletteSpraySource(color);

  if (spraySource) {
    setBaseFromColor(spraySource);
    return;
  }

  setBaseFromImageColor(color);
}

function removePaletteColor(colorId) {
  const color = state.imagePalette.find((entry) => entry.id === colorId);

  if (!color) {
    return;
  }

  state.imagePalette = state.imagePalette.filter((entry) => entry.id !== colorId);

  if (state.baseOrigin?.kind === "image" && state.baseOrigin.id === colorId) {
    state.baseOrigin = null;
  }

  render();
}

function addPaletteColorToCart(color) {
  const spraySource = getPaletteSpraySource(color);

  if (!spraySource) {
    return;
  }

  addColorToCart(spraySource);
}

function clearPalette() {
  if (!state.imagePalette.length) {
    return;
  }

  state.imagePalette = [];

  if (state.baseOrigin?.kind === "image") {
    state.baseOrigin = null;
  }

  render();
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
  const origin = getBaseOrigin();
  const isImageOrigin = state.baseOrigin?.kind === "image";
  const hex = (origin?.hex || hslToHex(state.base.h, state.base.s, state.base.l)).toUpperCase();
  const hsl = origin
    ? {
        h: origin.h,
        s: origin.s,
        l: origin.l,
      }
    : hexToHsl(hex);
  const lab = origin?.lab || hexToLab(hex);
  const textColor = origin?.textColor || getContrastingText(hex);

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
    lab,
    isNeutral: isNeutralColor(hsl),
    textColor,
  };
}

function createWheelTargetColor(x, y, l) {
  const lightness = clamp(l, 0, 1);
  const distance = Math.min(Math.sqrt(x ** 2 + y ** 2), WHEEL_RADIUS);
  const hue = normalizeHue((Math.atan2(y, x) * 180) / Math.PI + 90);
  const chroma = clamp(distance / WHEEL_RADIUS, 0, 1) * WHEEL_CHROMA_MAX;
  const lch = {
    l: lightness * 100,
    c: chroma,
    h: hue,
  };
  const hex = lchToHex(lightness * 100, chroma, hue).toUpperCase();
  const hsl = hexToHsl(hex);

  return {
    kind: "wheel",
    hex,
    h: hsl.h,
    s: hsl.s,
    l: hsl.l,
    lab: hexToLab(hex),
    wheelPointSource: {
      lch,
      lab: lchToLab(lch.l, lch.c, lch.h),
    },
    isNeutral: isNeutralColor(hsl),
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

function getUnavailableCanPresentation() {
  const hsl = hexToHsl(UNAVAILABLE_CAN_HEX);

  return {
    hex: UNAVAILABLE_CAN_HEX,
    hsl,
    lab: hexToLab(UNAVAILABLE_CAN_HEX),
    textColor: getContrastingText(UNAVAILABLE_CAN_HEX),
  };
}

function getBestStopMatch(stop) {
  let best = null;

  for (const entry of stop.matches || []) {
    if (!entry?.match) {
      continue;
    }

    if (!best || entry.match.distance < best.match.distance) {
      best = entry;
    }
  }

  return best;
}

function isAccessibleCanMatch(match) {
  return Boolean(match && match.distance <= SNAP_CAN_ACCESS_MAX_DISTANCE);
}

function getStopPresentation(stop) {
  const fallback = {
    displayHex: stop.hex,
    displayHsl: stop.hsl,
    displayLab: stop.lab,
    displayTextColor: stop.textColor,
    displayNote: stop.note,
    pointSource: stop.pointSource || stop,
    isUnavailable: false,
  };

  if (state.wheelSnapMode !== "cans" || stop.key === "base") {
    return fallback;
  }

  const best = getBestStopMatch(stop);

  if (best?.match && isAccessibleCanMatch(best.match)) {
    return {
      displayHex: best.match.color.hex,
      displayHsl: {
        h: best.match.color.h,
        s: best.match.color.s,
        l: best.match.color.l,
      },
      displayLab: best.match.color.lab,
      displayTextColor: best.match.color.textColor,
      displayNote: stop.note,
      pointSource: best.match.color,
      isUnavailable: false,
    };
  }

  const unavailable = getUnavailableCanPresentation();

  return {
    displayHex: unavailable.hex,
    displayHsl: unavailable.hsl,
    displayLab: unavailable.lab,
    displayTextColor: unavailable.textColor,
    displayNote: `${stop.note} · ${ui("noAccessibleCan")}`,
    pointSource: stop,
    isUnavailable: true,
  };
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
    pointSource: state.baseWheelPointSource || baseColor,
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
  const canClearImage = hasImage || Boolean(state.imageSampleColor);
  const canClearPalette = state.imagePalette.length > 0;

  elements.imageClear.disabled = !canClearImage;
  elements.imagePaletteReset.disabled = !canClearPalette;
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

  renderImageModalZoomControls();
  elements.imageModal.hidden = !open;
  syncModalOpenState();
  elements.imageModalEmpty.innerHTML = `
    <p class="empty-copy">${escapeHtml(ui("imageEmpty"))}</p>
  `;
  elements.imageModalStage.classList.toggle("is-empty", !hasImage);
  elements.imageModalStage.classList.toggle("is-interactive", hasImage);
  elements.imageModalViewport.hidden = !hasImage;
  elements.imageModalViewport.classList.toggle("is-zoomed", state.imageModalZoom > IMAGE_MODAL_ZOOM_DEFAULT);
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

  drawZoomableImageCanvas(elements.imageModalCanvas, maxWidth, maxHeight, state.imageModalZoom);
}

function syncModalOpenState() {
  document.body.classList.toggle(
    "modal-open",
    !elements.imageModal.hidden || !elements.cartModal.hidden,
  );
}

function renderCartModal() {
  const open = state.isCartModalOpen;

  elements.cartModal.hidden = !open;
  syncModalOpenState();
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
      const active = isPaletteColorActive(color);
      const spraySource = getPaletteSpraySource(color);
      const cartQuantity = spraySource ? getCartQuantity(spraySource.id) : 0;
      const sourceMeta =
        color.meta?.sourceKind === "spray" && color.brandLabel ? `${escapeHtml(color.brandLabel)} · ` : "";

      return `
        <article class="image-palette-chip ${active ? "active" : ""}">
          <button class="image-palette-select" type="button" data-palette-select-color-id="${color.id}" aria-pressed="${active}">
            <span class="image-swatch image-palette-swatch" style="background:${color.hex}; color:${color.textColor}">
              ${escapeHtml(color.hex)}
            </span>
            <span class="image-palette-body">
              <span class="image-palette-title">${escapeHtml(color.label || color.name)}</span>
              <span class="image-palette-meta">${sourceMeta}H ${escapeHtml(formatDegrees(color.h))} · S ${escapeHtml(formatPercent(color.s))} · L ${escapeHtml(formatPercent(color.l))}</span>
            </span>
            ${active ? `<span class="image-palette-badge">${escapeHtml(ui("imageActive"))}</span>` : ""}
          </button>
          <div class="image-palette-actions">
            ${
              spraySource
                ? `<button class="cart-action image-palette-action" type="button" data-palette-cart-color-id="${color.id}">${escapeHtml(
                    cartQuantity > 0 ? `${ui("cartActionLabel")} x${cartQuantity}` : ui("cartActionLabel"),
                  )}</button>`
                : ""
            }
            <button class="cart-action image-palette-action" type="button" data-palette-remove-color-id="${color.id}">
              ${escapeHtml(ui("removeAction"))}
            </button>
          </div>
        </article>
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
    .map((color) => {
      const active = state.baseOrigin?.kind === "spray" && color.id === state.baseOrigin.id;
      const inPalette = isSprayColorInPalette(color.id);

      return `
        <article class="picker-card">
          <button class="picker-chip ${active ? "active" : ""}" type="button" data-color-id="${color.id}" aria-pressed="${active}">
            <div class="picker-swatch" style="background:${color.hex}"></div>
            <div>
              <span class="picker-title">${escapeHtml(color.label || color.name)}</span>
              <span class="picker-meta">${escapeHtml(color.brandLabel)} · ${escapeHtml(color.hex)}</span>
            </div>
          </button>
          <button class="cart-action picker-palette-action" type="button" data-palette-color-id="${color.id}" ${inPalette ? "disabled" : ""}>
            ${escapeHtml(ui(inPalette ? "inPalette" : "addToPalette"))}
          </button>
        </article>
      `;
    })
    .join("");
}

function renderSprayChoiceRow({ brand, color, badge, score, active, quantity, tooltipId }) {
  const inPalette = isSprayColorInPalette(color.id);
  const cartLabel = quantity > 0 ? `${ui("cartActionLabel")} x${quantity}` : ui("cartActionLabel");
  const rowClasses = [active ? "is-selected-base" : "", quantity > 0 ? "in-cart" : ""]
    .filter(Boolean)
    .join(" ");
  const matchTooltipId = tooltipId || `choice-${brand.id}-${color.id}`;
  const copyHexActionKey = `hex:${color.id}`;
  const copyReferenceActionKey = `reference:${color.id}`;
  const copyHexLabel = ui(state.copiedChoiceActionKey === copyHexActionKey ? "copiedAction" : "copyHexAction");
  const copyReferenceLabel = ui(
    state.copiedChoiceActionKey === copyReferenceActionKey ? "copiedAction" : "copyReferenceAction",
  );

  return `
    <article class="match-row ${rowClasses}">
      <span class="match-brand-head">
        <span class="match-brand-copy">
          <span class="match-brand-dot" style="background:${brand.accent}"></span>
          <span class="match-brand" style="color:${brand.accent}">${escapeHtml(brand.label)}</span>
        </span>
        <span class="match-statuses">
          ${badge ? `<span class="match-cart-badge">${escapeHtml(badge)}</span>` : ""}
        </span>
      </span>
      <button class="match-select" type="button" data-choice-color-id="${color.id}" aria-pressed="${active}">
        <span class="match-main">
          <span class="color-tooltip-anchor match-color-tooltip-anchor">
            <span
              class="match-swatch color-tooltip-trigger"
              style="background:${color.hex}"
              data-color-tooltip-trigger="true"
              data-color-tooltip-id="${escapeHtml(matchTooltipId)}"
            ></span>
            ${renderColorCodeTooltip(matchTooltipId, color.hex)}
          </span>
          <span class="match-copy">
            <span class="match-name" title="${escapeHtml(color.label || color.name)}">${escapeHtml(color.label || color.name)}</span>
          </span>
          <span class="match-actions">
            ${score ? `<span class="match-score">${escapeHtml(score)}</span>` : ""}
          </span>
        </span>
      </button>
      <div class="match-row-actions">
        <button
          class="cart-action match-action match-copy-action ${state.copiedChoiceActionKey === copyHexActionKey ? "is-copied" : ""}"
          type="button"
          data-choice-copy-color-id="${color.id}"
          data-choice-copy-kind="hex"
        >
          ${escapeHtml(copyHexLabel)}
        </button>
        <button
          class="cart-action match-action match-copy-action ${state.copiedChoiceActionKey === copyReferenceActionKey ? "is-copied" : ""}"
          type="button"
          data-choice-copy-color-id="${color.id}"
          data-choice-copy-kind="reference"
        >
          ${escapeHtml(copyReferenceLabel)}
        </button>
        <button class="cart-action match-action" type="button" data-choice-palette-color-id="${color.id}" ${inPalette ? "disabled" : ""}>
          ${escapeHtml(ui(inPalette ? "inPalette" : "imagePaletteLabel"))}
        </button>
        <button class="cart-action match-action" type="button" data-choice-cart-color-id="${color.id}">
          ${escapeHtml(cartLabel)}
        </button>
      </div>
    </article>
  `;
}

function renderCart() {
  const items = getCartItems();
  const uniqueBrands = new Set(items.map((entry) => entry.color.brandId));
  const sprayCount = getCartSprayCount();

  elements.cartSummary.innerHTML = `
    <span class="meta-pill">${escapeHtml(countText("reference", getCartReferenceCount()))}</span>
    <span class="meta-pill">${escapeHtml(countText("spray", sprayCount))}</span>
    <span class="meta-pill">${escapeHtml(countText("manufacturer", uniqueBrands.size))}</span>
  `;
  elements.cartModalOpenCount.textContent = String(sprayCount);

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
    <span class="meta-pill">${escapeHtml(countText("block", hasBaseOnlyGroup ? groups.length : groups.length + 1))}</span>
    <span class="meta-pill">${escapeHtml(countText("color", totalStops))}</span>
    <span class="meta-pill">${escapeHtml(countText("algorithm", state.activeTheoryIds.size))}</span>
    <span class="meta-pill">${getSelectedManufacturers().map((brand) => brand.label).join(" + ")}</span>
  `;
}

function renderPaletteReference() {
  elements.paletteReference.innerHTML = "";
  elements.paletteReference.hidden = true;
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
    .map((stop) => {
      const presentedStop = getStopPresentation(stop);

      return `
        <div
          class="algo-preview-chip ${presentedStop.isUnavailable ? "is-unavailable" : ""}"
          style="background:${presentedStop.displayHex}; color:${presentedStop.displayTextColor}"
          title="${escapeHtml(stop.title)}"
        >
          <span class="algo-preview-letter">${escapeHtml(stop.letter)}</span>
        </div>
      `;
    })
    .join("");
}

function renderSwatches(groups, baseStop) {
  const hasBaseOnlyGroup = groups.length === 1 && groups[0].id === "base-only";
  const baseReferenceExpanded = isAlgoExpanded("base-reference");
  const presentedBaseStop = getStopPresentation(baseStop);
  const baseReferenceMarkup = hasBaseOnlyGroup
    ? ""
    : `
          <section class="algo-block">
        <div class="algo-head">
          <div>
            <h3 class="algo-title" title="${escapeHtml(ui("baseReferenceLabel"))}">${escapeHtml(
              ui("baseReferenceLabel"),
            )}</h3>
            <p class="algo-formula">${escapeHtml(baseStop.hex)}</p>
          </div>
          <span class="algo-head-actions">
            <span class="algo-count">${escapeHtml(countText("color", 1))}</span>
            <button
              class="algo-toggle"
              type="button"
              data-algo-toggle-id="base-reference"
              aria-expanded="${baseReferenceExpanded}"
            >
              ${escapeHtml(ui(baseReferenceExpanded ? "collapseResults" : "expandResults"))}
            </button>
          </span>
        </div>
        ${
          baseReferenceExpanded
            ? `
              <p class="algo-note">${escapeHtml(baseStop.note)}</p>
              <div class="algo-swatches">
                <article class="swatch-card reference-card">
                  <div class="swatch-visual" style="background:${presentedBaseStop.displayHex}; color:${presentedBaseStop.displayTextColor}">
                    <span class="swatch-index">${escapeHtml(baseStop.letter)}</span>
                    <div class="swatch-label">${escapeHtml(ui("baseColorName"))}</div>
                  </div>
                  <div class="swatch-body">
                    <p class="swatch-note">
                      H ${escapeHtml(formatDegrees(baseStop.hsl.h))} · S ${escapeHtml(formatPercent(baseStop.hsl.s))} · L ${escapeHtml(formatPercent(baseStop.hsl.l))}
                    </p>
                    <div class="match-list">
                      ${baseStop.matches
                        .map(({ brand, match }) => {
                          if (!match) {
                            return "";
                          }

                          const isSelectedBase =
                            state.baseOrigin?.kind === "spray" && state.baseOrigin.id === match.color.id;
                          return renderSprayChoiceRow({
                            brand,
                            color: match.color,
                            badge: isSelectedBase ? ui("reference") : "",
                            score: match.score,
                            active: isSelectedBase,
                            quantity: getCartQuantity(match.color.id),
                            tooltipId: `base-reference-${match.color.id}`,
                          });
                        })
                        .join("")}
                    </div>
                  </div>
                </article>
              </div>
            `
            : `<div class="algo-preview">${renderAlgoPreview([baseStop])}</div>`
        }
      </section>
    `;

  elements.swatchStrip.innerHTML = `${baseReferenceMarkup}${groups
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
          const presentedStop = getStopPresentation(stop);
          const isReference = group.id === "base-only";
          const matchesMarkup = stop.matches
            .map(({ brand, match }) => {
              if (!match) {
                return "";
              }

              const quantity = getCartQuantity(match.color.id);
              const inCart = quantity > 0;
              const isSelectedBase =
                state.baseOrigin?.kind === "spray" && state.baseOrigin.id === match.color.id;

              return renderSprayChoiceRow({
                brand,
                color: match.color,
                badge: inCart ? `x${quantity}` : "",
                score: match.score,
                active: isSelectedBase,
                quantity,
                tooltipId: `match-${group.id}-${stop.letter}-${match.color.id}`,
              });
            })
            .join("");

          return `
            <article class="swatch-card ${isReference ? "reference-card" : ""} ${presentedStop.isUnavailable ? "is-unavailable" : ""}">
              <div class="swatch-visual" style="background:${presentedStop.displayHex}; color:${presentedStop.displayTextColor}">
                <span class="swatch-index">${escapeHtml(stop.letter)}</span>
                <div class="swatch-label">${escapeHtml(stop.title)}</div>
              </div>
              <div class="swatch-body">
                <p class="swatch-note">${escapeHtml(presentedStop.displayNote)}</p>
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
    .join("")}`;
}

function renderWheelSurface(wheelEntries) {
  if (!elements.wheelSurface) {
    return;
  }

  elements.wheelSurface.classList.toggle("is-hidden", !state.showWheelSurface);

  if (!state.showWheelSurface) {
    return;
  }

  const rect = getWheelInteractionRect();

  if (!rect.width || !rect.height) {
    return;
  }

  const resolution = clamp(
    Math.round(Math.min(rect.width, rect.height) * (window.devicePixelRatio || 1) * WHEEL_SURFACE_RESOLUTION_FACTOR),
    WHEEL_SURFACE_RESOLUTION_MIN,
    WHEEL_SURFACE_RESOLUTION_MAX,
  );
  const cacheKey = `${[...state.selectedBrands].sort().join("|")}|${resolution}`;

  if (wheelSurfaceCacheKey === cacheKey) {
    return;
  }

  const context = elements.wheelSurface.getContext("2d");

  if (!context) {
    return;
  }

  elements.wheelSurface.width = resolution;
  elements.wheelSurface.height = resolution;
  context.clearRect(0, 0, resolution, resolution);
  context.imageSmoothingEnabled = true;

  if (!wheelEntries.length) {
    wheelSurfaceCacheKey = cacheKey;
    return;
  }

  const center = resolution / 2;
  const maxRadius = center - 1;
  const imageData = context.createImageData(resolution, resolution);
  const { data } = imageData;

  for (let y = 0; y < resolution; y += 1) {
    for (let x = 0; x < resolution; x += 1) {
      const normalizedX = (x + 0.5 - center) / maxRadius;
      const normalizedY = (y + 0.5 - center) / maxRadius;
      const radialDistance = Math.sqrt(normalizedX ** 2 + normalizedY ** 2);

      if (radialDistance > 1) {
        continue;
      }

      const worldX = normalizedX * WHEEL_RADIUS;
      const worldY = normalizedY * WHEEL_RADIUS;
      const mixed = blendWheelSurfaceColor(worldX, worldY, wheelEntries);

      if (!mixed) {
        continue;
      }

      const alpha = radialDistance > 0.97 ? clamp((1 - radialDistance) / 0.03, 0, 1) : 1;
      const offset = (y * resolution + x) * 4;

      data[offset] = mixed.r;
      data[offset + 1] = mixed.g;
      data[offset + 2] = mixed.b;
      data[offset + 3] = Math.round(alpha * 255);
    }
  }

  context.putImageData(imageData, 0, 0);
  wheelSurfaceCacheKey = cacheKey;
}

function renderWheel(wheelEntries, stops) {
  const cloud = state.showWheelSprays
    ? [...wheelEntries]
        .sort((first, second) => {
          if (first.color.isNeutral !== second.color.isNeutral) {
            return first.color.isNeutral ? -1 : 1;
          }

          return second.lightness - first.lightness || second.radius - first.radius;
        })
        .map((entry) => {
          const radius = entry.color.isNeutral ? 4.2 : 4.8;
          const opacity = 1;

          return `<circle class="wheel-cloud-dot${entry.color.isNeutral ? " is-neutral" : ""}" cx="${entry.point.x.toFixed(
            2,
          )}" cy="${entry.point.y.toFixed(2)}" r="${radius}" fill="${entry.color.hex}" opacity="${opacity}" />`;
        })
        .join("")
    : "";

  const guides = [0.25, 0.5, 0.75, 1]
    .map(
      (step) =>
        `<circle cx="0" cy="0" r="${(step * WHEEL_RADIUS).toFixed(2)}" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1" />`,
    )
    .join("");

  const axes = [0, 45, 90, 135]
    .map((angle) => {
      const radians = angle * (Math.PI / 180);
      const x = Math.cos(radians) * WHEEL_RADIUS;
      const y = Math.sin(radians) * WHEEL_RADIUS;
      return `<line x1="${(-x).toFixed(2)}" y1="${(-y).toFixed(2)}" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" stroke="rgba(255,255,255,0.08)" stroke-width="1" />`;
    })
    .join("");

  const boundary = `<circle cx="0" cy="0" r="${WHEEL_RADIUS.toFixed(2)}" fill="none" stroke="rgba(15,23,42,0.18)" stroke-width="1.4" />`;

  const points = stops.map((stop) => {
    const presentedStop = getStopPresentation(stop);

    return {
      ...stop,
      ...presentedStop,
      point: getWheelPlacement(presentedStop.pointSource).point,
    };
  });

  const connectors = points
    .slice(1)
    .map(
      (stop) =>
        `<line x1="${points[0].point.x.toFixed(2)}" y1="${points[0].point.y.toFixed(2)}" x2="${stop.point.x.toFixed(2)}" y2="${stop.point.y.toFixed(2)}" stroke="${stop.displayHex}" stroke-width="${points.length > 8 ? "1.8" : "2.6"}" stroke-linecap="round" opacity="${stop.isUnavailable ? "0.38" : points.length > 8 ? "0.62" : "0.9"}" />`,
    )
    .join("");

  const handles = points
    .map((stop, index) => {
      const radius = index === 0 ? 16 : 13;
      const showLabel = index === 0 || points.length <= 8;
      return `
        <g transform="translate(${stop.point.x.toFixed(2)} ${stop.point.y.toFixed(2)})">
          <circle r="${radius}" fill="${stop.displayHex}" stroke="${stop.isUnavailable ? "rgba(71,85,105,0.92)" : "rgba(255,255,255,0.94)"}" stroke-width="3"></circle>
          ${showLabel ? `<text class="wheel-handle-label" x="0" y="1">${escapeHtml(stop.letter)}</text>` : ""}
        </g>
      `;
    })
    .join("");

  elements.wheelSvg.innerHTML = `
    <g>
      ${guides}
      ${axes}
      ${boundary}
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
  const wheelEntries = buildWheelEntries(activeColors);
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
  renderCartModal();
  renderPickerResults(pickerResults);
  renderCart();
  renderRule(contexts);
  renderWheelVisibilityControls();
  renderWheelGuide(baseColor);
  renderBaseCaption(baseColor);
  renderTheoryNote(contexts);
  renderPaletteSummary(palette.groups);
  renderPaletteReference(palette.baseStop, palette.groups);
  renderSwatches(palette.groups, palette.baseStop);
  renderWheelSurface(wheelEntries);
  renderWheel(wheelEntries, wheelStops);
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
  state.baseWheelPointSource = null;
  render();
}

function setBaseFromImageColor(color) {
  state.base = {
    h: color.h,
    s: color.s,
    l: color.l,
  };
  state.baseOrigin = { kind: "image", id: color.id };
  state.baseWheelPointSource = null;
  render();
}

function setBase(next, origin = null, pointSource = undefined) {
  state.base = {
    h: normalizeHue(next.h ?? state.base.h),
    s: clamp(next.s ?? state.base.s, 0, 1),
    l: clamp(next.l ?? state.base.l, 0, 1),
  };
  state.baseOrigin = origin;
  if (pointSource !== undefined) {
    state.baseWheelPointSource = pointSource;
  } else if (!origin && state.baseWheelPointSource && next.s == null) {
    const current = state.baseWheelPointSource.lch;
    state.baseWheelPointSource = {
      lch: {
        l: (next.l ?? state.base.l) * 100,
        c: current.c,
        h: normalizeHue(next.h ?? current.h),
      },
      lab: lchToLab((next.l ?? state.base.l) * 100, current.c, normalizeHue(next.h ?? current.h)),
    };
  } else {
    state.baseWheelPointSource = null;
  }
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

function toggleWheelLayer(layer) {
  if (layer === "surface") {
    state.showWheelSurface = !state.showWheelSurface;
  }

  if (layer === "sprays") {
    state.showWheelSprays = !state.showWheelSprays;
  }

  render();
}

function setWheelSnapMode(mode) {
  if (mode !== "theory" && mode !== "cans") {
    return;
  }

  if (state.wheelSnapMode === mode) {
    return;
  }

  state.wheelSnapMode = mode;
  render();
}

function toggleWheelGuide() {
  state.showWheelGuide = !state.showWheelGuide;
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
  const rect = getWheelInteractionRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const scale = (WHEEL_RADIUS * 2) / Math.min(rect.width, rect.height);
  const x = (event.clientX - centerX) * scale;
  const y = (event.clientY - centerY) * scale;
  const lightness = getWheelSelectionLightness();
  const wheelEntries = buildWheelEntries(getActiveColors());
  const target = createWheelTargetColor(x, y, lightness);
  
  if (state.wheelSnapMode === "cans") {
    const match = findClosestWheelEntry(x, y, wheelEntries);

    if (match?.entry?.color) {
      setBaseFromColor(match.entry.color);
      return;
    }
  }

  setBase(
    {
      h: target.h,
      s: target.s,
      l: target.l,
    },
    null,
    target.wheelPointSource,
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
  elements.cartModalOpen.addEventListener("click", openCartModal);

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
  elements.imagePaletteReset.addEventListener("click", clearPalette);
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
  elements.imageModalZoomOut.addEventListener("click", () => {
    setImageModalZoom(state.imageModalZoom - IMAGE_MODAL_ZOOM_STEP);
  });
  elements.imageModalZoomIn.addEventListener("click", () => {
    setImageModalZoom(state.imageModalZoom + IMAGE_MODAL_ZOOM_STEP);
  });
  elements.imageModalZoomReset.addEventListener("click", resetImageModalZoom);
  elements.imageModalZoomRange.addEventListener("input", (event) => {
    setImageModalZoom(Number(event.currentTarget.value));
  });
  elements.imageModal.addEventListener("click", (event) => {
    if (event.target.closest("[data-image-modal-close]")) {
      closeImageModal();
    }
  });
  elements.cartModalClose.addEventListener("click", () => {
    closeCartModal();
  });
  elements.cartModal.addEventListener("click", (event) => {
    if (event.target.closest("[data-cart-modal-close]")) {
      closeCartModal();
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

  const handlePaletteInteraction = (event) => {
    const removeTarget = event.target.closest("[data-palette-remove-color-id]");

    if (removeTarget) {
      removePaletteColor(removeTarget.dataset.paletteRemoveColorId);
      return;
    }

    const cartTarget = event.target.closest("[data-palette-cart-color-id]");

    if (cartTarget) {
      const color = state.imagePalette.find((entry) => entry.id === cartTarget.dataset.paletteCartColorId);

      if (color) {
        addPaletteColorToCart(color);
      }
      return;
    }

    const selectTarget = event.target.closest("[data-palette-select-color-id]");

    if (!selectTarget) {
      return;
    }

    const color = state.imagePalette.find((entry) => entry.id === selectTarget.dataset.paletteSelectColorId);

    if (color) {
      selectPaletteColor(color);
    }
  };

  elements.imageInlinePalette.addEventListener("click", handlePaletteInteraction);
  elements.imagePalette.addEventListener("click", handlePaletteInteraction);
  elements.imageModalPalette.addEventListener("click", handlePaletteInteraction);

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

  elements.wheelSurfaceToggle.addEventListener("click", () => {
    toggleWheelLayer("surface");
  });

  elements.wheelSpraysToggle.addEventListener("click", () => {
    toggleWheelLayer("sprays");
  });

  elements.wheelSnapTheory.addEventListener("click", () => {
    setWheelSnapMode("theory");
  });

  elements.wheelSnapCans.addEventListener("click", () => {
    setWheelSnapMode("cans");
  });

  elements.wheelGuideToggle.addEventListener("click", () => {
    toggleWheelGuide();
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
    const paletteTarget = event.target.closest("[data-palette-color-id]");

    if (paletteTarget) {
      const color = state.allColors.find((entry) => entry.id === paletteTarget.dataset.paletteColorId);

      if (color) {
        addSprayColorToPalette(color);
      }
      return;
    }

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

    const choiceCopyTarget = event.target.closest("[data-choice-copy-color-id][data-choice-copy-kind]");

    if (choiceCopyTarget) {
      const color = state.allColors.find((entry) => entry.id === choiceCopyTarget.dataset.choiceCopyColorId);

      if (color) {
        state.activeColorTooltipId = null;
        void copySprayChoiceValue(color, choiceCopyTarget.dataset.choiceCopyKind);
      }
      return;
    }

    const choicePaletteTarget = event.target.closest("[data-choice-palette-color-id]");

    if (choicePaletteTarget) {
      const color = state.allColors.find((entry) => entry.id === choicePaletteTarget.dataset.choicePaletteColorId);

      if (color) {
        state.activeColorTooltipId = null;
        addSprayColorToPalette(color);
      }
      return;
    }

    const choiceCartTarget = event.target.closest("[data-choice-cart-color-id]");

    if (choiceCartTarget) {
      const color = state.allColors.find((entry) => entry.id === choiceCartTarget.dataset.choiceCartColorId);

      if (color) {
        state.activeColorTooltipId = null;
        addColorToCart(color);
      }
      return;
    }

    const selectTarget = event.target.closest("[data-choice-color-id]");

    if (!selectTarget) {
      state.activeColorTooltipId = null;
      return;
    }

    const color = state.allColors.find((entry) => entry.id === selectTarget.dataset.choiceColorId);
    if (color) {
      state.activeColorTooltipId = null;
      setBaseFromColor(color);
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
    state.wheelDragLightness = state.base.l;
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
    state.wheelDragLightness = null;
  };

  elements.wheelShell.addEventListener("pointerup", stopDrag);
  elements.wheelShell.addEventListener("pointercancel", stopDrag);

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.isImageModalOpen) {
      closeImageModal();
      return;
    }

    if (event.key === "Escape" && state.isCartModalOpen) {
      closeCartModal();
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
