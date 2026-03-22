#!/usr/bin/env python3

import argparse
import html
import json
import re
import subprocess
import tempfile
from pathlib import Path

from PIL import Image


BLOCK_RE = re.compile(
    r'<block xMin="([0-9.]+)" yMin="([0-9.]+)" xMax="([0-9.]+)" yMax="([0-9.]+)">(.*?)</block>',
    re.S,
)
PAGE_RE = re.compile(r'<page width="([0-9.]+)" height="([0-9.]+)">')
CODE_RE = re.compile(r"^(RV|R)\s+(\d+)$")


def parse_args():
  parser = argparse.ArgumentParser()
  parser.add_argument(
      "--pdf",
      default="grabbers/raw/pdfs/mtn-hardcore-2.pdf",
      help="Path to the source PDF.",
  )
  parser.add_argument(
      "--output",
      default="grabbers/raw/mtn-hardcore-2.json",
      help="Path to the extracted raw JSON.",
  )
  parser.add_argument(
      "--source-url",
      default=(
          "https://streetcontrol.jimdofree.com/app/download/4805954366/"
          "Nuancier+hardcore+2.pdf?t=1655908943"
      ),
      help="Official source URL saved into the output metadata.",
  )
  parser.add_argument(
      "--page",
      type=int,
      default=3,
      help="PDF page containing the color chart.",
  )
  return parser.parse_args()


def run(*args):
  subprocess.run(args, check=True)


def normalize_text(value):
  cleaned = re.sub(r"\s+", " ", value).strip()
  return (
      cleaned.replace("´", "'")
      .replace("’", "'")
      .replace("–", "-")
      .replace("¡", "")
      .strip()
  )


def strip_tags(value):
  return normalize_text(re.sub(r"<[^>]+>", " ", html.unescape(value)))


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
      if brightness(candidate) < 245 and count >= total_pixels * 0.01:
        quantized = candidate
        break

  average = tuple(round(sums[quantized][index] / counts[quantized]) for index in range(3))
  return "#{:02X}{:02X}{:02X}".format(*average)


def parse_blocks(bbox_path):
  content = Path(bbox_path).read_text()
  page_match = PAGE_RE.search(content)
  if not page_match:
    raise RuntimeError("Unable to read page size from pdftotext output.")

  blocks = []
  for match in BLOCK_RE.finditer(content):
    text = strip_tags(match.group(5))
    if not text:
      continue

    blocks.append(
        {
            "x0": float(match.group(1)),
            "y0": float(match.group(2)),
            "x1": float(match.group(3)),
            "y1": float(match.group(4)),
            "text": text,
        },
    )

  return float(page_match.group(1)), float(page_match.group(2)), blocks


def parse_color_block(block_text):
  parts = [normalize_text(part) for part in block_text.split("/") if normalize_text(part)]
  if len(parts) < 3:
    return None

  code = parts[0]
  code_match = CODE_RE.fullmatch(code)
  if not code_match:
    return None

  spanish_name = parts[1]
  english_name = parts[2]

  if english_name.endswith(" Y"):
    english_name = english_name[:-2].rstrip()

  if spanish_name.endswith(" Y"):
    spanish_name = spanish_name[:-2].rstrip()

  english_name = english_name.replace("Tepuyy", "Tepuy")
  spanish_name = spanish_name.replace("Tepuyy", "Tepuy")

  return {
      "code": f"{code_match.group(1)} {code_match.group(2)}",
      "family": code_match.group(1),
      "reference": code_match.group(2),
      "name": english_name,
      "englishName": english_name,
      "spanishName": spanish_name,
      "aliases": [spanish_name] if spanish_name != english_name else [],
      "sourceLabel": f"{code_match.group(1)} {code_match.group(2)} {spanish_name} / {english_name}",
  }


def extract_colors(pdf_path, source_url, page_number):
  with tempfile.TemporaryDirectory(prefix="mtn-hardcore2-") as tmp_dir:
    tmp_dir_path = Path(tmp_dir)
    image_base = tmp_dir_path / "page"
    bbox_path = tmp_dir_path / "page.html"

    run("pdftoppm", "-f", str(page_number), "-l", str(page_number), "-singlefile", "-png", "-r", "200", str(pdf_path), str(image_base))
    run("pdftotext", "-f", str(page_number), "-l", str(page_number), "-bbox-layout", str(pdf_path), str(bbox_path))

    image = Image.open(f"{image_base}.png").convert("RGB")
    page_width, page_height, blocks = parse_blocks(bbox_path)
    scale_x = image.width / page_width
    scale_y = image.height / page_height

    colors = []
    for block in blocks:
      item = parse_color_block(block["text"])
      if not item:
        continue

      crop_x0 = max(0, int((block["x1"] + 2) * scale_x))
      crop_x1 = min(image.width, int((block["x1"] + 18) * scale_x))
      crop_y0 = max(0, int((block["y0"] - 2) * scale_y))
      crop_y1 = min(image.height, int((block["y1"] + 2) * scale_y))

      item["hex"] = dominant_hex(
          image.crop((crop_x0, crop_y0, crop_x1, crop_y1)),
          item["name"],
      )
      item["page"] = page_number
      colors.append(item)

  colors.sort(key=lambda entry: (entry["family"], int(entry["reference"])))

  return {
      "source": {
          "type": "pdf",
          "url": source_url,
          "pages": [page_number],
          "hexApproximation": True,
          "note": "Hex values sampled from swatches on the color chart PDF.",
      },
      "colors": colors,
  }


def main():
  args = parse_args()
  pdf_path = Path(args.pdf)
  output_path = Path(args.output)

  data = extract_colors(pdf_path, args.source_url, args.page)
  output_path.parent.mkdir(parents=True, exist_ok=True)
  output_path.write_text(f"{json.dumps(data, indent=2, ensure_ascii=False)}\n")


if __name__ == "__main__":
  main()
