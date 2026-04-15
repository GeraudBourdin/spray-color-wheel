#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultOutputPath = path.join(__dirname, "raw", "montana-gold.json");

const SOURCE_PAGES = [
  {
    category: "colors",
    title: "Montana GOLD 400ml - Colors",
    url: "https://www.montana-cans.com/Montana-GOLD-400ml-Colors/285202",
    expectedCount: 193,
  },
  {
    category: "chrome-effect",
    title: "Montana GOLD 400ml - Chrome Effect Colors",
    url: "https://www.montana-cans.com/Montana-GOLD-400ml-Chrome-Effect-Colors/285936",
    expectedCount: 3,
  },
  {
    category: "metallic",
    title: "Montana GOLD 400ml - Metallic Colors",
    url: "https://www.montana-cans.com/Montana-GOLD-400ml-Metallic-Colors/369759",
    expectedCount: 2,
  },
  {
    category: "fluorescent",
    title: "Montana GOLD 400ml - Fluorescent Colors",
    url: "https://www.montana-cans.com/Montana-GOLD-400ml-Fluorescent-Colors/521409",
    expectedCount: 8,
  },
  {
    category: "transparent",
    title: "Montana GOLD 400ml - Transparent Colors",
    url: "https://www.montana-cans.com/Montana-GOLD-400ml-Transparent-Colors/419362",
    expectedCount: 9,
  },
];

const EXPECTED_TOTAL = 215;
const CHART_REFERENCE_URL = "https://cloud.montana-cans.com/index.php/s/GpyicN3nxScyJip";

const HEX_FALLBACKS = {
  "M 1000 Silverchrome": {
    hex: "#9C9C9C",
    coverage: "opaque",
    lightfastness: "4",
    note: "Approximated from the Montana GOLD color chart PDF in the shared Montana Cloud folder.",
  },
};

function parseArgs(argv) {
  let outputPath = defaultOutputPath;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--output") {
      outputPath = path.resolve(argv[index + 1] || "");
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return { outputPath };
}

function printHelp() {
  console.log(`Usage: node grabbers/montana_gold_grabber.mjs [--output path]

Fetches the official Montana GOLD 400ml product pages and writes a raw JSON catalog.`);
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#38;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)));
}

function collapseWhitespace(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractAttribute(attributes, name) {
  const match = attributes.match(new RegExp(`${name}="([\\s\\S]*?)"`));
  return match ? decodeHtml(match[1]) : "";
}

function parseChannels(value) {
  const decoded = collapseWhitespace(decodeHtml(value));

  if (!decoded) {
    return null;
  }

  if (decoded.startsWith("{")) {
    const parsed = JSON.parse(decoded);

    return Object.fromEntries(
      Object.entries(parsed).map(([key, channel]) => [key, Number(channel)]),
    );
  }

  const matches = [...decoded.matchAll(/([A-Z]+)\s*([0-9]+)/g)];
  if (!matches.length) {
    return null;
  }

  return Object.fromEntries(matches.map(([, key, channel]) => [key, Number(channel)]));
}

function normalizeCode(rawCode, rawName) {
  const code = collapseWhitespace(rawCode);
  const name = collapseWhitespace(rawName);

  let match = code.match(/^G(\d+)$/i);
  if (match) {
    return `G ${match[1]}`;
  }

  match = code.match(/^F(\d+)$/i);
  if (match) {
    return `F ${match[1]}`;
  }

  match = code.match(/^T(\d+)$/i);
  if (match) {
    return `T ${match[1]}`;
  }

  match = code.match(/^SHOCK\s+(\d+)$/i);
  if (match) {
    return `S ${match[1]}`;
  }

  match = code.match(/^CLASSIC\s+(\d+)$/i);
  if (match) {
    return `CL ${match[1]}`;
  }

  match = code.match(/^METALLIC\s+(\d+)$/i);
  if (match) {
    return `M ${match[1]}`;
  }

  match = code.match(/^M\s+(\d+)$/i);
  if (match) {
    return `M ${match[1]}`;
  }

  match = code.match(/^(\d+)$/);
  if (match && /^100%/i.test(name)) {
    return `P ${match[1]}`;
  }

  return code;
}

function inferFamily(code) {
  const normalized = collapseWhitespace(code).toUpperCase();

  if (normalized.startsWith("CL ")) {
    return "CL";
  }

  if (normalized.startsWith("S ")) {
    return "S";
  }

  if (normalized.startsWith("P ")) {
    return "P";
  }

  const match = normalized.match(/^([A-Z]+)\s/);
  return match ? match[1] : null;
}

function normalizeName(rawCode, rawName) {
  const code = collapseWhitespace(rawCode);
  const name = collapseWhitespace(rawName);

  if (/^SHOCK\s+/i.test(code) && !/^Shock /i.test(name)) {
    return `Shock ${name}`;
  }

  return name;
}

function normalizeCoverage(rawCoverage, family, category) {
  const coverage = collapseWhitespace(rawCoverage).toLowerCase();

  if (coverage) {
    return coverage;
  }

  if (family === "T" || category === "transparent") {
    return "transparent";
  }

  return null;
}

function buildAliases({ rawCode, rawName, normalizedCode, normalizedName, sourceLabel }) {
  const aliases = new Set();
  const compactNormalizedCode = normalizedCode.replace(/\s+/g, "");

  if (rawCode && rawCode !== normalizedCode) {
    aliases.add(rawCode);
  }

  if (rawName && rawName !== normalizedName) {
    aliases.add(rawName);
  }

  if (compactNormalizedCode && compactNormalizedCode !== normalizedCode) {
    aliases.add(compactNormalizedCode);
  }

  if (sourceLabel && sourceLabel !== `${normalizedCode} ${normalizedName}`.trim()) {
    aliases.add(sourceLabel);
  }

  return [...aliases].filter(Boolean);
}

function extractLabelData(blockHtml) {
  const attributesMatch = blockHtml.match(/<label\b([\s\S]*?)>/);
  if (!attributesMatch) {
    return null;
  }

  const attributes = attributesMatch[1];
  const codeMatch = blockHtml.match(/<div\s+class="color-code"[\s\S]*?<span>\s*([^<]+?)\s*<\/span>/);
  const nameMatch = blockHtml.match(/<div\s+class="color-code"[\s\S]*?<\/div>\s*<span>\s*([^<]+?)\s*<\/span>/);
  const rawCode = collapseWhitespace(codeMatch?.[1]);
  const rawName = collapseWhitespace(nameMatch?.[1]);

  if (!rawCode || !rawName) {
    return null;
  }

  const normalizedCode = normalizeCode(rawCode, rawName);
  const normalizedName = normalizeName(rawCode, rawName);
  const family = inferFamily(normalizedCode);
  const sourceLabel = collapseWhitespace(`${rawCode} ${rawName}`);
  const fallback = HEX_FALLBACKS[`${normalizedCode} ${normalizedName}`];
  const primaryHex = collapseWhitespace(extractAttribute(attributes, "data-hex")).toUpperCase();
  const hex = primaryHex && primaryHex !== "#" ? primaryHex : fallback?.hex || "";
  const title = collapseWhitespace(extractAttribute(attributes, "data-title"));
  const pigments = collapseWhitespace(extractAttribute(attributes, "data-pigments"));
  const lightfastness = collapseWhitespace(extractAttribute(attributes, "data-lightfastness")) || fallback?.lightfastness || "";

  return {
    title,
    rawCode,
    rawName,
    code: normalizedCode,
    name: normalizedName,
    family,
    sourceLabel,
    aliases: buildAliases({
      rawCode,
      rawName,
      normalizedCode,
      normalizedName,
      sourceLabel,
    }),
    ordernumber: collapseWhitespace(extractAttribute(attributes, "data-ordernumber")) || null,
    ean: collapseWhitespace(extractAttribute(attributes, "data-ean")) || null,
    pid: collapseWhitespace(extractAttribute(attributes, "data-pid")) || null,
    pigments: pigments || null,
    lightfastness: lightfastness || null,
    rawCoverage: extractAttribute(attributes, "data-coverage") || fallback?.coverage || "",
    rgb: parseChannels(extractAttribute(attributes, "data-rgb")),
    cmyk: parseChannels(extractAttribute(attributes, "data-cmyk")),
    hex: hex || null,
    hex2: collapseWhitespace(extractAttribute(attributes, "data-hex2")).toUpperCase() || null,
    fallbackNote: fallback?.note || null,
  };
}

function parsePage(html, source) {
  const items = [...html.matchAll(/<li\s+[^>]*class="color-variant-item"[\s\S]*?<\/li>/g)]
    .map((match) => extractLabelData(match[0]))
    .filter(Boolean)
    .map((item) => {
      const { rawCoverage, ...rest } = item;

      return {
        ...rest,
      category: source.category,
        coverage: normalizeCoverage(rawCoverage, item.family, source.category),
      sourceUrl: source.url,
      };
    });

  if (items.length !== source.expectedCount) {
    throw new Error(
      `Expected ${source.expectedCount} colors for "${source.title}" but parsed ${items.length}.`,
    );
  }

  return items;
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "ColorPalette Montana GOLD grabber/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

async function main() {
  const { outputPath } = parseArgs(process.argv.slice(2));
  const colors = [];
  const seenIds = new Set();

  for (const source of SOURCE_PAGES) {
    const html = await fetchHtml(source.url);

    for (const item of parsePage(html, source)) {
      const stableId = item.ordernumber || item.pid || item.sourceLabel;
      if (seenIds.has(stableId)) {
        continue;
      }

      seenIds.add(stableId);
      colors.push(item);
    }
  }

  if (colors.length !== EXPECTED_TOTAL) {
    throw new Error(`Expected ${EXPECTED_TOTAL} unique Montana GOLD colors but parsed ${colors.length}.`);
  }

  const output = {
    source: {
      type: "shop-pages",
      name: "Montana GOLD 400ml",
      primaryUrl: SOURCE_PAGES[0].url,
      urls: SOURCE_PAGES.map((entry) => ({
        category: entry.category,
        title: entry.title,
        url: entry.url,
      })),
      chartReferenceUrl: CHART_REFERENCE_URL,
      chartReferenceNote:
        "Lineup count verified against the shared Montana Cloud GOLD chart folder (EN PDF updated 2026-03-23).",
      expectedColorCount: EXPECTED_TOTAL,
    },
    colors,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Wrote ${colors.length} Montana GOLD colors to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
