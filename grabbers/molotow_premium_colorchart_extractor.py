#!/usr/bin/env python3

import argparse
import html
import json
import re
import subprocess
import tempfile
from pathlib import Path


WORD_RE = re.compile(
    r'<word xMin="([0-9.]+)" yMin="([0-9.]+)" xMax="([0-9.]+)" yMax="([0-9.]+)">(.*?)</word>',
)
PAGE_RE = re.compile(r"<page[^>]*>(.*?)</page>", re.S)
CODE_RE = re.compile(r"#\d{3}(?:-\d+)?")
ITEM_RE = re.compile(r"327\.\d{3}")
CMYK_RE = re.compile(r"\d{1,3}-\d{1,3}-\d{1,3}-\d{1,3}")
RGB_RE = re.compile(r"\d{1,3}-\d{1,3}-\d{1,3}")
HEX_RE = re.compile(r"[0-9A-Fa-f]{6}")

METALLIC_HEX_FALLBACKS = {
    "#220": "#81807E",
    "#220-1": "#C0A879",
}

COLUMNS = {
    "code": (94, 116.5),
    "de": (116.5, 190),
    "en": (190, 264),
    "fr": (264, 338),
    "es": (338, 414),
    "item": (413.5, 444),
    "cmyk": (444, 494),
    "rgb": (494, 538),
    "hex": (538, 580),
}


def parse_args():
  parser = argparse.ArgumentParser()
  parser.add_argument(
      "--pdf",
      default="grabbers/raw/pdfs/molotow-premium-colorchart.pdf",
      help="Path to the official MOLOTOW PREMIUM color chart PDF.",
  )
  parser.add_argument(
      "--output",
      default="grabbers/raw/molotow-belton.json",
      help="Path to the extracted raw JSON.",
  )
  parser.add_argument(
      "--source-url",
      default="https://brand.molotow.com/colorchart_premium/",
      help="Official source URL saved into the output metadata.",
  )
  parser.add_argument(
      "--product-url",
      default="https://molotow.fr/bombe-de-peinture-tout-support-belton-molotow-premium-400ml.html",
      help="Requested product page kept as source context.",
  )
  return parser.parse_args()


def run(*args):
  subprocess.run(args, check=True)


def normalize_text(value):
  return (
      re.sub(r"\s+", " ", value)
      .replace("\x07", "")
      .replace("´", "'")
      .replace("’", "'")
      .strip()
  )


def parse_words(page_content):
  words = []

  for match in WORD_RE.finditer(page_content):
    text = html.unescape(match.group(5)).strip()
    if not text:
      continue

    words.append(
        {
            "x0": float(match.group(1)),
            "y0": float(match.group(2)),
            "x1": float(match.group(3)),
            "y1": float(match.group(4)),
            "text": normalize_text(text),
        },
    )

  return words


def words_in_column(words, column_name):
  left, right = COLUMNS[column_name]
  return [
      word
      for word in words
      if left <= word["x0"] < right
      and word["text"] not in {"Farbe", "Color", "Sort.#", "D", "EN", "FR", "ES"}
  ]


def column_text(words, column_name):
  return normalize_text(" ".join(word["text"] for word in words_in_column(words, column_name)))


def column_compact(words, column_name):
  return column_text(words, column_name).replace(" ", "")


def compact_code(words):
  parts = [word["text"] for word in sorted(words_in_column(words, "code"), key=lambda item: (item["y0"], item["x0"]))]
  code = normalize_text("".join(parts).replace(" ", ""))
  if CODE_RE.fullmatch(code):
    return code
  return ""


def has_advanced_formula(*values):
  return any(re.search(r"(?:^|\s)\*(?:\s|$)", value or "") for value in values)


def strip_formula_marker(value):
  return normalize_text(re.sub(r"(?:^|\s)\*(?:\s|$)", " ", value or ""))


def parse_row(row_words, page_number):
  code = compact_code(row_words)
  german_name = column_text(row_words, "de")
  english_name = column_text(row_words, "en")
  french_name = column_text(row_words, "fr")
  spanish_name = column_text(row_words, "es")
  item_number = column_compact(row_words, "item")
  cmyk = column_compact(row_words, "cmyk")
  rgb = column_compact(row_words, "rgb")
  hex_value = column_compact(row_words, "hex").upper()

  advanced_formula = has_advanced_formula(german_name, english_name, french_name, spanish_name)
  german_name = strip_formula_marker(german_name)
  english_name = strip_formula_marker(english_name)
  french_name = strip_formula_marker(french_name)
  spanish_name = strip_formula_marker(spanish_name)

  if not CODE_RE.fullmatch(code):
    raise RuntimeError(f"Unable to parse color code on page {page_number}: {column_text(row_words, 'code')}")
  if not ITEM_RE.fullmatch(item_number):
    raise RuntimeError(f"Unable to parse item number for {code}: {item_number}")
  if cmyk != "---" and not CMYK_RE.fullmatch(cmyk):
    raise RuntimeError(f"Unable to parse CMYK for {code}: {cmyk}")
  if rgb != "---" and not RGB_RE.fullmatch(rgb):
    raise RuntimeError(f"Unable to parse RGB for {code}: {rgb}")
  hex_fallback_note = None
  if hex_value == "---" and code in METALLIC_HEX_FALLBACKS:
    hex_value = METALLIC_HEX_FALLBACKS[code].removeprefix("#")
    hex_fallback_note = "Metallic color has no HEX value in the official chart; sampled fallback kept from the previous PDF extraction."
  elif hex_value == "---":
    return None
  if not HEX_RE.fullmatch(hex_value):
    raise RuntimeError(f"Unable to parse HEX for {code}: {hex_value}")

  name = french_name or english_name or german_name
  aliases = [value for value in [english_name, german_name, spanish_name] if value and value != name]

  return {
      "code": code,
      "name": name,
      "frenchName": french_name or None,
      "englishName": english_name or None,
      "germanName": german_name or None,
      "spanishName": spanish_name or None,
      "aliases": aliases,
      "advancedFormula": advanced_formula,
      "variants": [{"itemNumber": item_number, "format": "400ml"}],
      "sourceLabel": normalize_text(f"{code} {name}"),
      "hex": f"#{hex_value}",
      "cmyk": None if cmyk == "---" else cmyk,
      "rgb": None if rgb == "---" else rgb,
      "hexFallbackNote": hex_fallback_note,
      "page": page_number,
  }


def page_rows(words, page_number):
  item_words = [
      word
      for word in words
      if 410 <= word["x0"] < 430 and ITEM_RE.fullmatch(word["text"])
  ]
  item_words.sort(key=lambda word: word["y0"])

  rows = []
  for index, item_word in enumerate(item_words):
    previous_y = item_words[index - 1]["y0"] if index > 0 else item_word["y0"] - 18
    next_y = item_words[index + 1]["y0"] if index + 1 < len(item_words) else item_word["y0"] + 18
    row_top = (previous_y + item_word["y0"]) / 2
    row_bottom = (item_word["y0"] + next_y) / 2
    row_words = [
        word
        for word in words
        if row_top <= word["y0"] < row_bottom
        and 94 <= word["x0"] < 580
    ]

    row = parse_row(row_words, page_number)
    if row:
      rows.append(row)

  return rows


def code_sort_key(code):
  match = re.fullmatch(r"#(\d+)(?:-(\d+))?", code or "")
  if not match:
    return float("inf"), float("inf")
  return int(match.group(1)), int(match.group(2) or 0)


def extract_colors(pdf_path):
  with tempfile.TemporaryDirectory(prefix="molotow-premium-colorchart-") as tmp_dir:
    bbox_path = Path(tmp_dir) / "colorchart.html"
    run("pdftotext", "-bbox-layout", str(pdf_path), str(bbox_path))
    content = bbox_path.read_text()

  colors = []
  for page_index, page_match in enumerate(PAGE_RE.finditer(content), start=1):
    colors.extend(page_rows(parse_words(page_match.group(1)), page_index))

  unique_colors = {}
  for color in colors:
    if color["code"] in unique_colors:
      raise RuntimeError(f"Duplicate color code: {color['code']}")
    unique_colors[color["code"]] = color

  return sorted(unique_colors.values(), key=lambda item: code_sort_key(item["code"]))


def main():
  args = parse_args()
  pdf_path = Path(args.pdf)
  output_path = Path(args.output)

  colors = extract_colors(pdf_path)
  data = {
      "source": {
          "type": "pdf",
          "url": args.source_url,
          "productUrl": args.product_url,
          "pages": list(range(1, 9)),
          "hexApproximation": False,
          "note": "Official MOLOTOW PREMIUM color chart. Product page is kept in metadata; clear coats without HEX values are omitted.",
      },
      "colors": colors,
  }

  output_path.parent.mkdir(parents=True, exist_ok=True)
  output_path.write_text(f"{json.dumps(data, indent=2, ensure_ascii=False)}\n")


if __name__ == "__main__":
  main()
