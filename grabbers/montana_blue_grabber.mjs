#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultOutputPath = path.join(__dirname, "raw", "montana-blue.json");

const SOURCE_PAGE = {
  title: "Montana BLUE 400ml - Colors",
  url: "https://www.montana-cans.com/Montana-BLUE-400ml-Colors/105428M",
  expectedCount: 82,
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
  console.log(`Usage: node grabbers/montana_blue_grabber.mjs [--output path]

Fetches the official Montana BLUE 400ml product page and writes a raw JSON catalog.`);
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
  return decodeHtml(value).replace(/\s+/g, " ").trim();
}

function extractAttribute(attributes, name) {
  const match = attributes.match(new RegExp(`${name}="([\\s\\S]*?)"`));
  return match ? collapseWhitespace(match[1]) : "";
}

function extractText(blockHtml, pattern) {
  return collapseWhitespace(blockHtml.match(pattern)?.[1] || "");
}

function inferFamily(code) {
  const suffix = code.replace(/^BLU\s+/i, "").trim().toUpperCase();

  if (suffix.startsWith("F")) {
    return "F";
  }

  return suffix.charAt(0) || null;
}

function buildAliases({ code, name, sourceLabel, colorTitle }) {
  const aliases = new Set();
  const compactCode = code.replace(/\s+/g, "");

  if (compactCode && compactCode !== code) {
    aliases.add(compactCode);
  }

  if (sourceLabel && sourceLabel !== `${code} ${name}`.trim()) {
    aliases.add(sourceLabel);
  }

  if (colorTitle && colorTitle !== sourceLabel) {
    aliases.add(colorTitle);
  }

  return [...aliases].filter(Boolean);
}

function extractLabelData(blockHtml) {
  const attributesMatch = blockHtml.match(/<label\b([\s\S]*?)>/);
  if (!attributesMatch) {
    return null;
  }

  const attributes = attributesMatch[1];
  const code = extractText(blockHtml, /<div\s+class="color-code"[\s\S]*?<span>\s*([^<]+?)\s*<\/span>/);
  const name = extractText(blockHtml, /<div\s+class="color-code"[\s\S]*?<\/div>\s*<span>\s*([^<]+?)\s*<\/span>/);
  const hex = collapseWhitespace(extractAttribute(attributes, "data-hex")).toUpperCase();
  const colorTitle = collapseWhitespace(extractAttribute(attributes, "data-color-title"));
  const sourceLabel = colorTitle || `${code} ${name}`.trim();

  if (!code || !name || !/^#[0-9A-F]{6}$/.test(hex)) {
    return null;
  }

  return {
    title: collapseWhitespace(extractAttribute(attributes, "data-title")),
    rawCode: code,
    rawName: name,
    code,
    name,
    family: inferFamily(code),
    sourceLabel,
    aliases: buildAliases({ code, name, sourceLabel, colorTitle }),
    ordernumber: collapseWhitespace(extractAttribute(attributes, "data-ordernumber")) || null,
    ean: collapseWhitespace(extractAttribute(attributes, "data-ean")) || null,
    pid: collapseWhitespace(extractAttribute(attributes, "data-pid")) || null,
    pigments: collapseWhitespace(extractAttribute(attributes, "data-pigments")) || null,
    lightfastness: collapseWhitespace(extractAttribute(attributes, "data-lightfastness")) || null,
    coverage: collapseWhitespace(extractAttribute(attributes, "data-coverage")) || null,
    rgb: null,
    cmyk: null,
    hex,
    sourceUrl: SOURCE_PAGE.url,
  };
}

function parsePage(html) {
  const items = [...html.matchAll(/<li\s+[^>]*class="color-variant-item"[\s\S]*?<\/li>/g)]
    .map((match) => extractLabelData(match[0]))
    .filter(Boolean);

  if (items.length !== SOURCE_PAGE.expectedCount) {
    throw new Error(`Expected ${SOURCE_PAGE.expectedCount} colors for "${SOURCE_PAGE.title}" but parsed ${items.length}.`);
  }

  return items;
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "ColorPalette Montana BLUE grabber/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

async function main() {
  const { outputPath } = parseArgs(process.argv.slice(2));
  const colors = parsePage(await fetchHtml(SOURCE_PAGE.url));

  const output = {
    source: {
      type: "shop-page",
      name: "Montana BLUE 400ml",
      primaryUrl: SOURCE_PAGE.url,
      urls: [
        {
          title: SOURCE_PAGE.title,
          url: SOURCE_PAGE.url,
        },
      ],
      expectedColorCount: SOURCE_PAGE.expectedCount,
      note: "Official Montana BLUE product page. The page provides direct HEX values but no RGB/CMYK metadata.",
    },
    colors,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Wrote ${colors.length} Montana BLUE colors to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
