import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const rawDir = path.join(__dirname, "raw");
const manufacturersDir = path.join(projectRoot, "manufacturers");

async function readJson(filename) {
  const filePath = path.join(rawDir, filename);
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeJson(filename, value) {
  await mkdir(manufacturersDir, { recursive: true });
  const filePath = path.join(manufacturersDir, filename);
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function parseMontanaTitle(colorTitle) {
  const raw = String(colorTitle || "").trim();
  const parts = raw.split(/\s+/).filter(Boolean);

  if (parts[0] !== "BLK") {
    return {
      code: "",
      name: raw,
    };
  }

  if (parts[1] === "TR" && parts[2]) {
    return {
      code: parts.slice(0, 3).join(" "),
      name: parts.slice(3).join(" ") || raw,
    };
  }

  return {
    code: parts.slice(0, 2).join(" "),
    name: parts.slice(2).join(" ") || raw,
  };
}

function normalizeLoopCatalog(items) {
  return {
    manufacturer: {
      id: "loop",
      label: "Loop",
      accent: "#0F8F63",
      series: "400ml",
      source: {
        name: "Loop Colors",
        url: "https://loopcolors.com/product/loop-400ml/",
      },
    },
    colors: items.map((item, index) => ({
      id: item.reference || `loop-${index + 1}`,
      code: item.reference || "",
      name: item.name || item.raw || `Loop ${index + 1}`,
      label: [item.reference, item.name].filter(Boolean).join(" ") || item.raw || `Loop ${index + 1}`,
      hex: String(item.hex || "").toUpperCase(),
      finish: null,
      opacity: item.opacity || null,
      coverage: null,
      lightfastness: null,
      pigments: null,
      aliases: [],
      sourceLabel: item.raw || "",
      meta: {
        uvResistance: item.uv_resistance || null,
      },
    })),
  };
}

function normalizeMontanaBlackCatalog(items) {
  return {
    manufacturer: {
      id: "montana-black",
      label: "Montana BLACK",
      accent: "#7F858F",
      series: "400ml",
      source: {
        name: "Montana Cans",
        url: "https://www.montana-cans.com/",
      },
    },
    colors: items.map((item, index) => {
      const parsed = parseMontanaTitle(item.colorTitle);

      return {
        id: item.ordernumber || item.pid || `montana-black-${index + 1}`,
        code: parsed.code,
        name: parsed.name || item.colorTitle || `Montana BLACK ${index + 1}`,
        label: parsed.code ? `${parsed.code} ${parsed.name}` : parsed.name,
        hex: String(item.hex || "").toUpperCase(),
        finish: null,
        opacity: null,
        coverage: item.coverage || null,
        lightfastness: item.lightfastness || null,
        pigments: item.pigments || null,
        aliases: item.altParsing ? [item.altParsing] : [],
        sourceLabel: item.colorTitle || "",
        meta: {
          title: item.title || null,
          altParsing: item.altParsing || null,
          ordernumber: item.ordernumber || null,
          ean: item.ean || null,
          pid: item.pid || null,
          rgb: item.rgb || null,
          cmyk: item.cmyk || null,
        },
      };
    }),
  };
}

function normalizeMontanaBlueCatalog(rawCatalog) {
  const detectFinish = (item) => {
    const label = [item.code, item.name].filter(Boolean).join(" ").toLowerCase();

    if (item.family === "F" || label.includes("fluor") || label.includes("flour")) {
      return "fluorescent";
    }

    return "matt";
  };

  return {
    manufacturer: {
      id: "montana-blue",
      label: "Montana BLUE",
      accent: "#2F73C8",
      series: "400ml Water-Based",
      source: {
        name: rawCatalog.source?.name || "Montana BLUE 400ml",
        url: rawCatalog.source?.primaryUrl || "https://www.montana-cans.com/",
        note: rawCatalog.source?.note || null,
      },
    },
    colors: rawCatalog.colors.map((item, index) => ({
      id: item.ordernumber || item.pid || `montana-blue-${index + 1}`,
      code: item.code || "",
      name: item.name || `Montana BLUE ${index + 1}`,
      label: [item.code, item.name].filter(Boolean).join(" ") || `Montana BLUE ${index + 1}`,
      hex: String(item.hex || "").toUpperCase(),
      finish: detectFinish(item),
      opacity: null,
      coverage: item.coverage || null,
      lightfastness: item.lightfastness || null,
      pigments: item.pigments || null,
      aliases: item.aliases || [],
      sourceLabel: item.sourceLabel || "",
      meta: {
        sourceType: rawCatalog.source?.type || "shop-page",
        sourceUrl: item.sourceUrl || rawCatalog.source?.primaryUrl || null,
        title: item.title || null,
        family: item.family || null,
        rawCode: item.rawCode || null,
        rawName: item.rawName || null,
        ordernumber: item.ordernumber || null,
        ean: item.ean || null,
        pid: item.pid || null,
        rgb: item.rgb || null,
        cmyk: item.cmyk || null,
      },
    })),
  };
}

function normalizeMontanaGoldCatalog(rawCatalog) {
  const buildSourceNote = () => {
    const categories = Array.isArray(rawCatalog.source?.urls)
      ? rawCatalog.source.urls.map((entry) => entry.title).join(", ")
      : "";
    const chartReference = rawCatalog.source?.chartReferenceNote || null;

    return [categories ? `Combined from official product pages: ${categories}.` : null, chartReference]
      .filter(Boolean)
      .join(" ");
  };

  const detectFinish = (item) => {
    if (item.family === "T") {
      return "transparent";
    }

    if (item.category === "metallic") {
      return "matt";
    }

    return null;
  };

  return {
    manufacturer: {
      id: "montana-gold",
      label: "Montana GOLD",
      accent: "#C59B56",
      series: "400ml",
      source: {
        name: rawCatalog.source?.name || "Montana GOLD 400ml",
        url: rawCatalog.source?.primaryUrl || rawCatalog.source?.chartReferenceUrl || "https://www.montana-cans.com/",
        note: buildSourceNote() || null,
      },
    },
    colors: rawCatalog.colors.map((item, index) => ({
      id: item.ordernumber || item.pid || `montana-gold-${index + 1}`,
      code: item.code || "",
      name: item.name || `Montana GOLD ${index + 1}`,
      label: [item.code, item.name].filter(Boolean).join(" ") || `Montana GOLD ${index + 1}`,
      hex: String(item.hex || "").toUpperCase(),
      finish: detectFinish(item),
      opacity: null,
      coverage: item.coverage ? String(item.coverage).toLowerCase() : null,
      lightfastness: item.lightfastness || null,
      pigments: item.pigments || null,
      aliases: item.aliases || [],
      sourceLabel: item.sourceLabel || "",
      meta: {
        sourceType: rawCatalog.source?.type || "shop-pages",
        sourceUrl: item.sourceUrl || null,
        title: item.title || null,
        category: item.category || null,
        family: item.family || null,
        rawCode: item.rawCode || null,
        rawName: item.rawName || null,
        ordernumber: item.ordernumber || null,
        ean: item.ean || null,
        pid: item.pid || null,
        rgb: item.rgb || null,
        cmyk: item.cmyk || null,
        secondaryHex: item.hex2 || null,
        hexFallbackNote: item.fallbackNote || null,
      },
    })),
  };
}

function normalizeFlameCatalog(rawCatalog, manufacturer) {
  return {
    manufacturer: {
      id: manufacturer.id,
      label: manufacturer.label,
      accent: manufacturer.accent,
      series: manufacturer.series,
      source: {
        name: "FLAME",
        url: rawCatalog.source?.url || "https://www.flame-paint.com/",
        note: rawCatalog.source?.note || null,
      },
    },
    colors: rawCatalog.colors.map((item, index) => ({
      id: item.code || `flame-orange-${index + 1}`,
      code: item.code || "",
      name: item.name || `FLAME ORANGE ${index + 1}`,
      label: [item.code, item.name].filter(Boolean).join(" ") || `FLAME ORANGE ${index + 1}`,
      hex: String(item.hex || "").toUpperCase(),
      finish: null,
      opacity: null,
      coverage: null,
      lightfastness: null,
      pigments: null,
      aliases: [],
      sourceLabel: item.sourceLabel || "",
      meta: {
        sourceType: rawCatalog.source?.type || "pdf",
        sourcePage: rawCatalog.source?.page || 1,
        hexApproximation: rawCatalog.source?.hexApproximation || false,
        variants: item.variants || [],
      },
    })),
  };
}

function normalizeMolotowBeltonCatalog(rawCatalog) {
  const detectFinish = (item) => {
    const label = [item.code, item.name, item.englishName, item.frenchName].filter(Boolean).join(" ").toLowerCase();

    if (label.includes("transparent")) {
      return "transparent";
    }

    if (label.includes("fluo") || label.includes("neon")) {
      return "fluorescent";
    }

    if (item.code === "#220" || item.code === "#220-1") {
      return "metallic";
    }

    return null;
  };

  return {
    manufacturer: {
      id: "molotow-belton",
      label: "Molotow Belton",
      accent: "#2E3138",
      series: "PREMIUM 400ml",
      source: {
        name: "MOLOTOW PREMIUM",
        url: rawCatalog.source?.url || "https://www.molotow.com/",
        note: rawCatalog.source?.note || null,
      },
    },
    colors: rawCatalog.colors.map((item, index) => {
      const name = item.name || item.englishName || item.germanName || `Molotow Belton ${index + 1}`;
      const aliases = [...new Set([...(item.aliases || []), item.germanName].filter(Boolean))].filter(
        (alias) => alias !== name,
      );

      return {
        id: item.code || `molotow-belton-${index + 1}`,
        code: item.code || "",
        name,
        label: [item.code, name].filter(Boolean).join(" ") || `Molotow Belton ${index + 1}`,
        hex: String(item.hex || "").toUpperCase(),
        finish: detectFinish(item),
        opacity: null,
        coverage: null,
        lightfastness: null,
        pigments: null,
        aliases,
        sourceLabel: item.sourceLabel || "",
        meta: {
          sourceType: rawCatalog.source?.type || "pdf",
          sourcePages: rawCatalog.source?.pages || null,
          sourcePage: item.page || null,
          hexApproximation: rawCatalog.source?.hexApproximation || false,
          productUrl: rawCatalog.source?.productUrl || null,
          variants: item.variants || [],
          cmyk: item.cmyk || null,
          rgb: item.rgb || null,
          germanName: item.germanName || null,
          englishName: item.englishName || null,
          frenchName: item.frenchName || null,
          spanishName: item.spanishName || null,
          advancedFormula: item.advancedFormula || false,
          hexFallbackNote: item.hexFallbackNote || null,
        },
      };
    }),
  };
}

function normalizeMtnHardcore2Catalog(rawCatalog) {
  return {
    manufacturer: {
      id: "mtn-hardcore-2",
      label: "MTN Hardcore 2",
      accent: "#F26922",
      series: "400ml",
      source: {
        name: "Montana Colors MTN Hardcore 2",
        url: rawCatalog.source?.url || "https://www.montanacolors.com/",
        note: rawCatalog.source?.note || null,
      },
    },
    colors: rawCatalog.colors.map((item, index) => {
      const name = item.name || item.englishName || item.spanishName || `MTN Hardcore 2 ${index + 1}`;
      const aliases = [...new Set([...(item.aliases || []), item.spanishName].filter(Boolean))].filter(
        (alias) => alias !== name,
      );

      return {
        id: item.code || `mtn-hardcore-2-${index + 1}`,
        code: item.code || "",
        name,
        label: [item.code, name].filter(Boolean).join(" ") || `MTN Hardcore 2 ${index + 1}`,
        hex: String(item.hex || "").toUpperCase(),
        finish: item.family === "RV" ? "gloss" : null,
        opacity: null,
        coverage: null,
        lightfastness: null,
        pigments: null,
        aliases,
        sourceLabel: item.sourceLabel || "",
        meta: {
          sourceType: rawCatalog.source?.type || "pdf",
          sourcePages: rawCatalog.source?.pages || null,
          sourcePage: item.page || null,
          hexApproximation: rawCatalog.source?.hexApproximation || false,
          family: item.family || null,
          reference: item.reference || null,
          spanishName: item.spanishName || null,
          englishName: item.englishName || null,
        },
      };
    }),
  };
}

function normalizeMontana94Catalog(rawCatalog) {
  return {
    manufacturer: {
      id: "montana-94",
      label: "Montana 94",
      accent: "#58BFE8",
      series: "400ml",
      source: {
        name: "Montana Colors 94",
        url: rawCatalog.source?.url || "https://www.montanacolors.com/",
        note: rawCatalog.source?.note || null,
      },
    },
    colors: rawCatalog.colors.map((item, index) => {
      const name = item.name || item.englishName || item.spanishName || `Montana 94 ${index + 1}`;
      const aliases = [...new Set([...(item.aliases || []), item.spanishName].filter(Boolean))].filter(
        (alias) => alias !== name,
      );

      return {
        id: item.code || `montana-94-${index + 1}`,
        code: item.code || "",
        name,
        label: [item.code, name].filter(Boolean).join(" ") || `Montana 94 ${index + 1}`,
        hex: String(item.hex || "").toUpperCase(),
        finish: "matt",
        opacity: null,
        coverage: null,
        lightfastness: null,
        pigments: null,
        aliases,
        sourceLabel: item.sourceLabel || "",
        meta: {
          sourceType: rawCatalog.source?.type || "pdf",
          sourcePages: rawCatalog.source?.pages || null,
          sourcePage: item.page || null,
          hexApproximation: rawCatalog.source?.hexApproximation || false,
          family: item.family || null,
          reference: item.reference || null,
          spanishName: item.spanishName || null,
          englishName: item.englishName || null,
        },
      };
    }),
  };
}

function normalizeKobraCatalog(rawCatalog, manufacturer) {
  const detectFinish = (itemName) => {
    const normalized = String(itemName || "").toLowerCase();

    if (normalized.includes("transparent")) {
      return "transparent";
    }

    if (normalized.includes("supergloss")) {
      return "gloss";
    }

    if (normalized.includes("satin")) {
      return "satin";
    }

    return manufacturer.defaultFinish || null;
  };

  return {
    manufacturer: {
      id: manufacturer.id,
      label: manufacturer.label,
      accent: manufacturer.accent,
      series: manufacturer.series,
      source: {
        name: "Kobra Paint",
        url: rawCatalog.source?.url || "https://kobrapaint.com/",
        note: rawCatalog.source?.note || null,
      },
    },
    colors: rawCatalog.colors.map((item, index) => ({
      id: item.code || `${manufacturer.id}-${index + 1}`,
      code: item.code || "",
      name: item.name || `${manufacturer.label} ${index + 1}`,
      label: [item.code, item.name].filter(Boolean).join(" ") || `${manufacturer.label} ${index + 1}`,
      hex: String(item.hex || "").toUpperCase(),
      finish: detectFinish(item.name),
      opacity: null,
      coverage: null,
      lightfastness: null,
      pigments: null,
      aliases: [],
      sourceLabel: item.sourceLabel || "",
      meta: {
        sourceType: rawCatalog.source?.type || "pdf",
        sourcePage: rawCatalog.source?.page || null,
        hexApproximation: rawCatalog.source?.hexApproximation || false,
        pressure: manufacturer.pressure,
        descriptor: item.descriptor || null,
        hexInferred: item.hexInferred || false,
        codeNormalizedFrom: item.codeNormalizedFrom || null,
      },
    })),
  };
}

async function main() {
  const loopRaw = await readJson("loop.json");
  const montanaBlackRaw = await readJson("montana-black.json");
  const montanaBlueRaw = await readJson("montana-blue.json");
  const montanaGoldRaw = await readJson("montana-gold.json");
  const flameOrangeRaw = await readJson("flame-orange.json");
  const flameBlueRaw = await readJson("flame-blue.json");
  const molotowBeltonRaw = await readJson("molotow-belton.json");
  const mtnHardcore2Raw = await readJson("mtn-hardcore-2.json");
  const montana94Raw = await readJson("montana-94.json");
  const kobraLowPressureRaw = await readJson("kobra-low-pressure-400ml.json");
  const kobraHighPressureRaw = await readJson("kobra-high-pressure-400ml.json");

  const loop = normalizeLoopCatalog(loopRaw);
  const montanaBlack = normalizeMontanaBlackCatalog(montanaBlackRaw);
  const montanaBlue = normalizeMontanaBlueCatalog(montanaBlueRaw);
  const montanaGold = normalizeMontanaGoldCatalog(montanaGoldRaw);
  const flameOrange = normalizeFlameCatalog(flameOrangeRaw, {
    id: "flame-orange",
    label: "FLAME ORANGE",
    accent: "#F37B20",
    series: "400ml / 500ml / 600ml",
  });
  const flameBlue = normalizeFlameCatalog(flameBlueRaw, {
    id: "flame-blue",
    label: "FLAME BLUE",
    accent: "#2F8EDC",
    series: "400ml",
  });
  const molotowBelton = normalizeMolotowBeltonCatalog(molotowBeltonRaw);
  const mtnHardcore2 = normalizeMtnHardcore2Catalog(mtnHardcore2Raw);
  const montana94 = normalizeMontana94Catalog(montana94Raw);
  const kobraLowPressure = normalizeKobraCatalog(kobraLowPressureRaw, {
    id: "kobra-low-pressure-400ml",
    label: "Kobra Low pressure 400ml",
    accent: "#9BD400",
    pressure: "low",
    series: "400ml",
    defaultFinish: "matt",
  });
  const kobraHighPressure = normalizeKobraCatalog(kobraHighPressureRaw, {
    id: "kobra-high-pressure-400ml",
    label: "Kobra High pressure 400ml",
    accent: "#7DC242",
    pressure: "high",
    series: "400ml",
    defaultFinish: "matt",
  });
  const manifest = {
    version: 1,
    manufacturers: [
      {
        id: loop.manufacturer.id,
        path: "./loop.json",
      },
      {
        id: montanaBlack.manufacturer.id,
        path: "./montana-black.json",
      },
      {
        id: montanaBlue.manufacturer.id,
        path: "./montana-blue.json",
      },
      {
        id: montanaGold.manufacturer.id,
        path: "./montana-gold.json",
      },
      {
        id: flameOrange.manufacturer.id,
        path: "./flame-orange.json",
      },
      {
        id: flameBlue.manufacturer.id,
        path: "./flame-blue.json",
      },
      {
        id: molotowBelton.manufacturer.id,
        path: "./molotow-belton.json",
      },
      {
        id: mtnHardcore2.manufacturer.id,
        path: "./mtn-hardcore-2.json",
      },
      {
        id: montana94.manufacturer.id,
        path: "./montana-94.json",
      },
      {
        id: kobraLowPressure.manufacturer.id,
        path: "./kobra-low-pressure-400ml.json",
      },
      {
        id: kobraHighPressure.manufacturer.id,
        path: "./kobra-high-pressure-400ml.json",
      },
    ],
  };

  await writeJson("index.json", manifest);
  await writeJson("loop.json", loop);
  await writeJson("montana-black.json", montanaBlack);
  await writeJson("montana-blue.json", montanaBlue);
  await writeJson("montana-gold.json", montanaGold);
  await writeJson("flame-orange.json", flameOrange);
  await writeJson("flame-blue.json", flameBlue);
  await writeJson("molotow-belton.json", molotowBelton);
  await writeJson("mtn-hardcore-2.json", mtnHardcore2);
  await writeJson("montana-94.json", montana94);
  await writeJson("kobra-low-pressure-400ml.json", kobraLowPressure);
  await writeJson("kobra-high-pressure-400ml.json", kobraHighPressure);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
