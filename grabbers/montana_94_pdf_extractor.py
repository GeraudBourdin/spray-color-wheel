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
LINE_RE = re.compile(r"<line [^>]*>(.*?)</line>", re.S)
WORD_RE = re.compile(r"<word [^>]*>(.*?)</word>")
PAGE_RE = re.compile(r'<page width="([0-9.]+)" height="([0-9.]+)">')
CODE_RE = re.compile(r"^(R-V\d+|R-\d+)$")


def parse_args():
  parser = argparse.ArgumentParser()
  parser.add_argument(
      "--pdf",
      default="grabbers/raw/pdfs/montana-94.pdf",
      help="Path to the source PDF.",
  )
  parser.add_argument(
      "--output",
      default="grabbers/raw/montana-94.json",
      help="Path to the extracted raw JSON.",
  )
  parser.add_argument(
      "--source-url",
      default=(
          "https://streetcontrol.jimdofree.com/app/download/4809568966/"
          "Nuancier+Montana+94.pdf?t=1655908943"
      ),
      help="Official source URL saved into the output metadata.",
  )
  parser.add_argument(
      "--page",
      type=int,
      default=2,
      help="PDF page containing the color chart.",
  )
  return parser.parse_args()


def run(*args):
  subprocess.run(args, check=True)


def normalize_text(value):
  cleaned = re.sub(r"\s+", " ", value).strip()
  cleaned = re.sub(r"(?<!^)(R-V\d+|R-\d+)", r" \1", cleaned)
  return (
      cleaned.replace("´", "'")
      .replace("’", "'")
      .replace("–", "-")
      .replace("AÇAÍ", "ACAI")
      .replace("ORQUÍDEA", "ORQUIDEA")
      .replace("ÉBANO", "EBANO")
      .replace("ÍCARO", "ICARO")
      .replace("ODISEA", "ODISEA")
      .replace("POSEIDÓN", "POSEIDON")
      .replace("GlÓRIA", "GLORIA")
      .replace("GÉMINIS", "GEMINIS")
      .replace("BERILO", "BERILO")
      .replace("FÉNIX", "FENIX")
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
      if brightness(candidate) < 245 and count >= total_pixels * 0.01:
        quantized = candidate
        break

  average = tuple(round(sums[quantized][index] / counts[quantized]) for index in range(3))
  return "#{:02X}{:02X}{:02X}".format(*average)


def parse_block_lines(raw_block):
  lines = []
  for line_match in LINE_RE.finditer(raw_block):
    words = []
    for word in WORD_RE.findall(line_match.group(1)):
      normalized = normalize_text(html.unescape(word))
      if not normalized:
        continue
      words.extend(token for token in normalized.split(" ") if token)
    if words:
      lines.append(words)
  return lines


def clean_name_tokens(tokens):
  cleaned = []
  for token in tokens:
    if CODE_RE.fullmatch(token):
      continue
    cleaned.append(token)
  return cleaned


def fix_english_name(spanish_name, english_name):
  corrections = {
      "MART ORANGE": "MARS ORANGE",
      "LUMINOUSE GREEN": "LUMINOUS GREEN",
      "POSEYDON BLUE": "POSEIDON BLUE",
  }

  if english_name in corrections:
    return corrections[english_name]

  if spanish_name.endswith(" MARTE") and english_name == "MART ORANGE":
    return "MARS ORANGE"

  return english_name


def parse_color_block(lines):
  if len(lines) < 2:
    return None

  first_line = lines[0]
  second_line = clean_name_tokens(lines[1])

  if not first_line:
    return None

  code = first_line[0]
  if not CODE_RE.fullmatch(code):
    return None

  spanish_name = " ".join(clean_name_tokens(first_line[1:])).strip()
  english_name = " ".join(second_line).strip() or spanish_name
  english_name = fix_english_name(spanish_name, english_name)

  aliases = [spanish_name] if spanish_name and spanish_name != english_name else []

  return {
      "code": code,
      "family": "R-V" if code.startswith("R-V") else "R",
      "reference": code.split("-", 1)[1],
      "name": english_name,
      "englishName": english_name,
      "spanishName": spanish_name or None,
      "aliases": aliases,
      "sourceLabel": f"{code} {spanish_name} / {english_name}" if spanish_name else f"{code} {english_name}",
  }


def extract_colors(pdf_path, source_url, page_number):
  with tempfile.TemporaryDirectory(prefix="montana-94-") as tmp_dir:
    tmp_dir_path = Path(tmp_dir)
    image_base = tmp_dir_path / "page"
    bbox_path = tmp_dir_path / "page.html"

    run("pdftoppm", "-f", str(page_number), "-l", str(page_number), "-singlefile", "-png", "-r", "200", str(pdf_path), str(image_base))
    run("pdftotext", "-f", str(page_number), "-l", str(page_number), "-bbox-layout", str(pdf_path), str(bbox_path))

    content = bbox_path.read_text()
    page_match = PAGE_RE.search(content)
    if not page_match:
      raise RuntimeError("Unable to read page size from pdftotext output.")

    image = Image.open(f"{image_base}.png").convert("RGB")
    scale_x = image.width / float(page_match.group(1))
    scale_y = image.height / float(page_match.group(2))

    colors = []
    skipped_uncoded = []

    for match in BLOCK_RE.finditer(content):
      lines = parse_block_lines(match.group(5))
      item = parse_color_block(lines)

      if not item:
        plain_lines = [" ".join(line).strip() for line in lines if line]
        plain_text = " | ".join(plain_lines)
        if plain_text in {"BLANCO | WHITE", "NEGRO | BLACK"}:
          skipped_uncoded.append(plain_text)
        continue

      crop_x0 = max(0, int((float(match.group(1)) - 2) * scale_x))
      crop_y0 = max(0, int((float(match.group(2)) - 3) * scale_y))
      crop_x1 = min(image.width, int((float(match.group(3)) + 2) * scale_x))
      crop_y1 = min(image.height, int((float(match.group(4)) + 2) * scale_y))

      item["hex"] = dominant_hex(
          image.crop((crop_x0, crop_y0, crop_x1, crop_y1)),
          item["name"],
      )
      item["page"] = page_number
      colors.append(item)

  colors.sort(key=lambda entry: (entry["family"], int(entry["reference"].replace("V", "")) if entry["reference"].startswith("V") else int(entry["reference"])))

  return {
      "source": {
          "type": "pdf",
          "url": source_url,
          "pages": [page_number],
          "hexApproximation": True,
          "note": "Hex values sampled from swatches on the color chart PDF.",
          "uncodedSkipped": skipped_uncoded,
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
