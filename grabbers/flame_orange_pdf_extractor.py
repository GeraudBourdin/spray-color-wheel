#!/usr/bin/env python3

import argparse
import html
import json
import re
import subprocess
import tempfile
from collections import defaultdict
from pathlib import Path

from PIL import Image


WORD_RE = re.compile(
    r'<word xMin="([0-9.]+)" yMin="([0-9.]+)" xMax="([0-9.]+)" yMax="([0-9.]+)">(.*?)</word>',
)
PAGE_RE = re.compile(r'<page width="([0-9.]+)" height="([0-9.]+)">')
ITEM_RE = re.compile(r"\d{3}\.\d{3}(?:\*{1,2})?")


def parse_args():
  parser = argparse.ArgumentParser()
  parser.add_argument(
      "--pdf",
      default="grabbers/raw/pdfs/flame-orange-product-info.pdf",
      help="Path to the source PDF.",
  )
  parser.add_argument(
      "--output",
      default="grabbers/raw/flame-orange.json",
      help="Path to the extracted raw JSON.",
  )
  parser.add_argument(
      "--code-prefix",
      default="FO",
      help="Code prefix used in the PDF, for example FO or FB.",
  )
  parser.add_argument(
      "--source-url",
      default=(
          "https://brand.molotow.com/fileadmin/Dateien/PDF/Info_Sheets/"
          "Spray/Action/FLAME_Orange_ProductInfoSheet.pdf"
      ),
      help="Official source URL saved into the output metadata.",
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

  return (
      float(page_match.group(1)),
      float(page_match.group(2)),
      words,
  )


def cluster_columns(code_words, tolerance=3):
  columns = []
  for word in sorted(code_words, key=lambda entry: entry["x0"]):
    if not columns or abs(columns[-1] - word["x0"]) > tolerance:
      columns.append(word["x0"])
  return columns


def clean_name(value):
  cleaned = re.sub(r"\s+", " ", value).strip()
  cleaned = cleaned.replace("m iddle", "middle")
  return cleaned


def item_variant(item_number):
  if item_number.endswith("**"):
    return {
        "itemNumber": item_number[:-2],
        "format": "500ml",
    }

  if item_number.endswith("*"):
    return {
        "itemNumber": item_number[:-1],
        "format": "600ml",
    }

  return {
      "itemNumber": item_number,
      "format": "400ml",
  }


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


def extract_colors(pdf_path, source_url, code_prefix):
  code_re = re.compile(rf"{re.escape(code_prefix)}-\d+")

  with tempfile.TemporaryDirectory(prefix=f"flame-{code_prefix.lower()}-") as tmp_dir:
    tmp_dir_path = Path(tmp_dir)
    image_base = tmp_dir_path / "page1"
    bbox_path = tmp_dir_path / "page1.html"

    run("pdftoppm", "-f", "1", "-singlefile", "-png", "-r", "200", str(pdf_path), str(image_base))
    run("pdftotext", "-f", "1", "-l", "1", "-bbox-layout", str(pdf_path), str(bbox_path))

    image = Image.open(f"{image_base}.png").convert("RGB")
    page_width, page_height, words = parse_bbox_words(bbox_path)

    code_words = [word for word in words if code_re.fullmatch(word["text"])]
    columns = cluster_columns(code_words)

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

    for entries in code_words_by_column.values():
      entries.sort(key=lambda entry: entry["y0"])

    scale_x = image.width / page_width
    scale_y = image.height / page_height
    colors = []

    for column_index, entries in sorted(code_words_by_column.items()):
      _, right_bound = column_bounds[column_index]

      for index, code_word in enumerate(entries):
        next_y = entries[index + 1]["y0"] if index + 1 < len(entries) else code_word["y0"] + 11.4
        left_bound, right_bound = column_bounds[column_index]
        bounded_right = page_width if right_bound == float("inf") else right_bound

        text_band = [
            word
            for word in words
            if left_bound < word["x0"] < right_bound
            and code_word["y0"] - 4.5 <= word["y0"] < code_word["y0"] + 6.5
        ]

        variants = [item_variant(word["text"]) for word in text_band if ITEM_RE.fullmatch(word["text"])]
        name_words = [
            word
            for word in text_band
            if word["text"] != code_word["text"] and not ITEM_RE.fullmatch(word["text"])
        ]
        name_words.sort(key=lambda word: (round(word["y0"], 2), word["x0"]))
        name = clean_name(" ".join(word["text"] for word in name_words))

        crop_x0 = max(0, int((code_word["x0"] - 2) * scale_x))
        crop_x1 = min(image.width, int((bounded_right - 1) * scale_x))
        crop_y0 = max(0, int((code_word["y0"] - 3.5) * scale_y))
        crop_y1 = min(image.height, int((min(next_y - 1, code_word["y0"] + 6.5)) * scale_y))

        colors.append(
            {
                "code": code_word["text"],
                "name": name,
                "hex": dominant_hex(image.crop((crop_x0, crop_y0, crop_x1, crop_y1)), name),
                "variants": variants,
                "sourceLabel": clean_name(f"{code_word['text']} {name}"),
            },
        )

    colors.sort(key=lambda entry: entry["code"])

    return {
        "source": {
            "type": "pdf",
            "url": source_url,
            "page": 1,
            "hexApproximation": True,
            "note": "Hex values sampled from swatches on the product info PDF.",
        },
        "colors": colors,
    }


def main():
  args = parse_args()
  pdf_path = Path(args.pdf)
  output_path = Path(args.output)

  data = extract_colors(pdf_path, args.source_url, args.code_prefix)
  output_path.parent.mkdir(parents=True, exist_ok=True)
  output_path.write_text(f"{json.dumps(data, indent=2)}\n")


if __name__ == "__main__":
  main()
