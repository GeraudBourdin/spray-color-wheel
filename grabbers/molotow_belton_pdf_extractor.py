#!/usr/bin/env python3

import argparse
import html
import json
import re
import statistics
import subprocess
import tempfile
from collections import defaultdict
from pathlib import Path

from PIL import Image


WORD_RE = re.compile(
    r'<word xMin="([0-9.]+)" yMin="([0-9.]+)" xMax="([0-9.]+)" yMax="([0-9.]+)">(.*?)</word>',
)
PAGE_RE = re.compile(r'<page width="([0-9.]+)" height="([0-9.]+)">')
CODE_RE = re.compile(r"#\d+(?:-\d+)?")
ITEM_RE = re.compile(r"\d{3}\.\d{3}")


def parse_args():
  parser = argparse.ArgumentParser()
  parser.add_argument(
      "--pdf",
      default="grabbers/raw/pdfs/molotow-belton-premium-400-600.pdf",
      help="Path to the source PDF.",
  )
  parser.add_argument(
      "--output",
      default="grabbers/raw/molotow-belton.json",
      help="Path to the extracted raw JSON.",
  )
  parser.add_argument(
      "--source-url",
      default=(
          "https://brand.molotow.com/fileadmin/Dateien/PDF/Info_Sheets/"
          "Spray/Artist/Infosheet_Premium_400_600.pdf"
      ),
      help="Official source URL saved into the output metadata.",
  )
  parser.add_argument(
      "--first-page",
      type=int,
      default=2,
      help="First color page to extract.",
  )
  parser.add_argument(
      "--last-page",
      type=int,
      default=6,
      help="Last color page to extract.",
  )
  return parser.parse_args()


def run(*args):
  subprocess.run(args, check=True)


def parse_bbox_words(bbox_path):
  content = Path(bbox_path).read_text()
  page_match = PAGE_RE.search(content)
  if not page_match:
    raise RuntimeError("Unable to read page size from pdftotext output.")

  words = []
  for match in WORD_RE.finditer(content):
    text = html.unescape(match.group(5)).replace("\x07", " ").strip()
    if not text:
      continue

    words.append(
        {
            "x0": float(match.group(1)),
            "y0": float(match.group(2)),
            "x1": float(match.group(3)),
            "y1": float(match.group(4)),
            "text": re.sub(r"\s+", " ", text),
        },
    )

  return float(page_match.group(1)), float(page_match.group(2)), words


def normalize_text(value):
  cleaned = re.sub(r"\s+", " ", value).strip()
  return (
      cleaned.replace("´", "'")
      .replace("’", "'")
      .replace("–", "-")
      .replace("  ", " ")
      .strip()
  )


def brightness(color):
  return sum(color) / 3


def dominant_hex(crop, color_name):
  counts = {}
  sums = {}

  for pixel in crop.getdata():
    quantized = tuple(max(0, min(255, int(round(channel / 8) * 8))) for channel in pixel)
    counts[quantized] = counts.get(quantized, 0) + 1
    if quantized not in sums:
      sums[quantized] = [0, 0, 0]
    for index, channel in enumerate(pixel):
      sums[quantized][index] += channel

  ordered = sorted(counts.items(), key=lambda item: item[1], reverse=True)
  quantized = ordered[0][0]

  if brightness(quantized) > 245 and "white" not in color_name.lower():
    total_pixels = sum(counts.values())
    for candidate, count in ordered[1:]:
      if brightness(candidate) < 245 and count >= total_pixels * 0.015:
        quantized = candidate
        break

  average = tuple(round(sums[quantized][index] / counts[quantized]) for index in range(3))
  return "#{:02X}{:02X}{:02X}".format(*average)


def cluster_columns(code_words, tolerance=15):
  columns = []
  for word in sorted(code_words, key=lambda entry: entry["x0"]):
    if not columns or abs(columns[-1] - word["x0"]) > tolerance:
      columns.append(word["x0"])
  return columns


def group_name_lines(words, tolerance=3):
  lines = []
  for word in sorted(words, key=lambda entry: (entry["y0"], entry["x0"])):
    if not lines or abs(lines[-1]["y"] - word["y0"]) > tolerance:
      lines.append({"y": word["y0"], "words": [word]})
      continue

    lines[-1]["words"].append(word)
    total = sum(entry["y0"] for entry in lines[-1]["words"])
    lines[-1]["y"] = total / len(lines[-1]["words"])

  for line in lines:
    line["words"].sort(key=lambda entry: entry["x0"])

  return lines


def line_to_text(words):
  tokens = []
  has_star = False

  for word in words:
    token = word["text"].strip()
    if token == "*":
      has_star = True
      continue
    if token.endswith("*"):
      has_star = True
      token = token[:-1]
    token = normalize_text(token)
    if token:
      tokens.append(token)

  return normalize_text(" ".join(tokens)), has_star


def code_sort_key(code):
  match = re.fullmatch(r"#(\d+)(?:-(\d+))?", code or "")
  if not match:
    return float("inf"), float("inf")

  return int(match.group(1)), int(match.group(2) or 0)


def extract_entry(words, code_word, entry_bottom_y, left_bound, right_bound):
  entry_words = [
      word
      for word in words
      if left_bound < word["x0"] < right_bound
      and code_word["y0"] - 4.5 <= word["y0"] < entry_bottom_y - 0.5
  ]

  item_number = ""
  name_words = []
  for word in entry_words:
    text = word["text"]
    if text == code_word["text"]:
      continue
    if ITEM_RE.fullmatch(text):
      item_number = text
      continue
    name_words.append(word)

  lines = group_name_lines(name_words)
  line_texts = []
  advanced_formula = False
  for line in lines:
    text, has_star = line_to_text(line["words"])
    if text:
      line_texts.append(text)
    advanced_formula = advanced_formula or has_star

  german_name = line_texts[0] if line_texts else ""
  english_name = line_texts[1] if len(line_texts) > 1 else german_name
  name = english_name or german_name
  aliases = []
  if german_name and german_name != name:
    aliases.append(german_name)

  source_label_parts = [code_word["text"]]
  if german_name and german_name != name:
    source_label_parts.append(f"{german_name} / {name}")
  elif name:
    source_label_parts.append(name)

  return {
      "code": code_word["text"],
      "name": name,
      "englishName": english_name or None,
      "germanName": german_name or None,
      "aliases": aliases,
      "advancedFormula": advanced_formula,
      "variants": [{"itemNumber": item_number, "format": "400ml"}] if item_number else [],
      "sourceLabel": normalize_text(" ".join(source_label_parts)),
  }


def extract_page(pdf_path, page_number, tmp_dir_path):
  image_base = tmp_dir_path / f"page-{page_number}"
  bbox_path = tmp_dir_path / f"page-{page_number}.html"

  run("pdftoppm", "-f", str(page_number), "-l", str(page_number), "-singlefile", "-png", "-r", "200", str(pdf_path), str(image_base))
  run("pdftotext", "-f", str(page_number), "-l", str(page_number), "-bbox-layout", str(pdf_path), str(bbox_path))

  image = Image.open(f"{image_base}.png").convert("RGB")
  page_width, page_height, words = parse_bbox_words(bbox_path)
  scale_x = image.width / page_width
  scale_y = image.height / page_height

  code_words = [word for word in words if CODE_RE.fullmatch(word["text"])]
  columns = cluster_columns(code_words)

  if not columns:
    return []

  column_bounds = []
  for index, column_x in enumerate(columns):
    left = float("-inf") if index == 0 else (columns[index - 1] + column_x) / 2
    right = float("inf") if index == len(columns) - 1 else (column_x + columns[index + 1]) / 2
    column_bounds.append((left, right))

  for code_word in code_words:
    code_word["columnIndex"] = min(
        range(len(columns)),
        key=lambda index: abs(columns[index] - code_word["x0"]),
    )

  code_words_by_column = defaultdict(list)
  for code_word in code_words:
    code_words_by_column[code_word["columnIndex"]].append(code_word)

  colors = []
  for column_index, entries in code_words_by_column.items():
    entries.sort(key=lambda entry: entry["y0"])
    left_bound, right_bound = column_bounds[column_index]
    gaps = [
        entries[index + 1]["y0"] - entry["y0"]
        for index, entry in enumerate(entries[:-1])
        if entries[index + 1]["y0"] - entry["y0"] > 8
    ]
    row_height = statistics.median(gaps) if gaps else 21.25

    for index, code_word in enumerate(entries):
      next_code_y = entries[index + 1]["y0"] if index + 1 < len(entries) else None
      entry_bottom_y = (
          (code_word["y0"] + next_code_y) / 2 if next_code_y is not None else code_word["y0"] + row_height / 2
      )
      item = extract_entry(words, code_word, entry_bottom_y, left_bound, right_bound)

      crop_x0 = max(0, int((code_word["x0"] - 72) * scale_x))
      crop_x1 = min(image.width, int((code_word["x0"] - 8) * scale_x))
      crop_y0 = max(0, int((code_word["y0"] - 4.5) * scale_y))
      crop_y1 = min(image.height, int((entry_bottom_y - 1) * scale_y))

      item["hex"] = dominant_hex(
          image.crop((crop_x0, crop_y0, crop_x1, crop_y1)),
          item["name"] or item["germanName"] or "",
      )
      item["page"] = page_number
      colors.append(item)

  return colors


def extract_colors(pdf_path, source_url, first_page, last_page):
  with tempfile.TemporaryDirectory(prefix="molotow-belton-") as tmp_dir:
    tmp_dir_path = Path(tmp_dir)
    colors = []

    for page_number in range(first_page, last_page + 1):
      colors.extend(extract_page(pdf_path, page_number, tmp_dir_path))

  colors.sort(key=lambda entry: code_sort_key(entry["code"]))

  return {
      "source": {
          "type": "pdf",
          "url": source_url,
          "pages": list(range(first_page, last_page + 1)),
          "hexApproximation": True,
          "note": "Hex values sampled from swatches on the product info PDF.",
      },
      "colors": colors,
  }


def main():
  args = parse_args()
  pdf_path = Path(args.pdf)
  output_path = Path(args.output)

  data = extract_colors(pdf_path, args.source_url, args.first_page, args.last_page)
  output_path.parent.mkdir(parents=True, exist_ok=True)
  output_path.write_text(f"{json.dumps(data, indent=2, ensure_ascii=False)}\n")


if __name__ == "__main__":
  main()
