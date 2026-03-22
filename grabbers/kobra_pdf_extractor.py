#!/usr/bin/env python3

import argparse
import html
import json
import re
import subprocess
import tempfile
from pathlib import Path


BLOCK_RE = re.compile(
    r'<block xMin="([0-9.]+)" yMin="([0-9.]+)" xMax="([0-9.]+)" yMax="([0-9.]+)">(.*?)</block>',
    re.S,
)
WORD_RE = re.compile(r"<word [^>]*>(.*?)</word>")
PAGE_RE = re.compile(r'<page width="([0-9.]+)" height="([0-9.]+)">')
HEX_RE = re.compile(r"^#[0-9a-fA-F]{6}$")
LOW_CODE_RE = re.compile(r"^LP\d{3}$")
HIGH_CODE_RE = re.compile(r"^(?:HP[0-9O]{3,4}|HPOO1|HPO03)$")


def parse_args():
  parser = argparse.ArgumentParser()
  parser.add_argument(
      "--pdf",
      default="grabbers/raw/pdfs/kobra-color-chart.pdf",
      help="Path to the source PDF.",
  )
  parser.add_argument(
      "--low-output",
      default="grabbers/raw/kobra-low-pressure-400ml.json",
      help="Path to the extracted low pressure raw JSON.",
  )
  parser.add_argument(
      "--high-output",
      default="grabbers/raw/kobra-high-pressure-400ml.json",
      help="Path to the extracted high pressure raw JSON.",
  )
  parser.add_argument(
      "--source-url",
      default="https://kobrapaint.com/assets/downloads/color_chart_kobra_web.pdf",
      help="Official source URL saved into the output metadata.",
  )
  return parser.parse_args()


def run(*args):
  subprocess.run(args, check=True)


def normalize_token(value):
  cleaned = re.sub(r"\s+", " ", value).strip()
  return cleaned.replace("’", "'").replace("–", "-").replace("EXTRIME", "EXTREME")


def normalize_high_code(code):
  suffix = code[2:].replace("O", "0")
  return f"HP{suffix}"


def parse_blocks(bbox_path):
  content = Path(bbox_path).read_text()
  page_match = PAGE_RE.search(content)
  if not page_match:
    raise RuntimeError("Unable to read page size from pdftotext output.")

  blocks = []
  for match in BLOCK_RE.finditer(content):
    tokens = []
    for word_match in WORD_RE.finditer(match.group(5)):
      token = normalize_token(html.unescape(word_match.group(1)))
      if token:
        tokens.append(token)

    if not tokens:
      continue

    blocks.append(
        {
            "x0": float(match.group(1)),
            "y0": float(match.group(2)),
            "x1": float(match.group(3)),
            "y1": float(match.group(4)),
            "tokens": tokens,
            "text": " ".join(tokens),
            "midY": (float(match.group(2)) + float(match.group(4))) / 2,
        },
    )

  return blocks


def find_matching_hex(block, hex_blocks):
  candidates = [
      candidate
      for candidate in hex_blocks
      if candidate["x0"] >= block["x1"] - 3 and abs(candidate["midY"] - block["midY"]) <= 4
  ]

  if not candidates:
    return None

  candidates.sort(key=lambda candidate: (candidate["x0"] - block["x1"], abs(candidate["midY"] - block["midY"])))
  return candidates[0]["tokens"][0].upper()


def infer_hex_from_name(name):
  normalized = name.upper()
  if "WHITE" in normalized:
    return "#FFFFFF", True
  if "BLACK" in normalized:
    return "#000000", True
  return None, False


def extract_low_pressure(blocks):
  hex_blocks = [block for block in blocks if len(block["tokens"]) == 1 and HEX_RE.fullmatch(block["tokens"][0])]
  colors = []

  for block in blocks:
    tokens = block["tokens"]
    if not tokens or not LOW_CODE_RE.fullmatch(tokens[-1]):
      continue

    code = tokens[-1]
    name = " ".join(tokens[:-1]).strip()
    hex_value = find_matching_hex(block, hex_blocks)
    hex_inferred = False

    if not hex_value:
      hex_value, hex_inferred = infer_hex_from_name(name)

    if not hex_value:
      raise RuntimeError(f"Unable to resolve hex for low pressure color {code}.")

    colors.append(
        {
            "code": code,
            "name": name,
            "hex": hex_value,
            "sourceLabel": f"{name} {code}",
            "hexInferred": hex_inferred,
            "page": 1,
        },
    )

  colors.sort(key=lambda entry: entry["code"])
  if len(colors) != 94:
    raise RuntimeError(f"Expected 94 low pressure colors, got {len(colors)}.")

  return {
      "source": {
          "type": "pdf",
          "url": args.source_url,
          "page": 1,
          "hexApproximation": False,
          "note": "Hex values read from the PDF text. LP901 and LP902 are inferred from their names because the chart omits their hex values.",
      },
      "colors": colors,
  }


def extract_high_pressure(blocks):
  hex_blocks = [block for block in blocks if len(block["tokens"]) == 1 and HEX_RE.fullmatch(block["tokens"][0])]
  colors = []

  for block in blocks:
    tokens = block["tokens"]
    code_index = next((index for index, token in enumerate(tokens) if HIGH_CODE_RE.fullmatch(token)), None)
    if code_index is None:
      continue

    raw_code = tokens[code_index]
    code = normalize_high_code(raw_code)
    name_tokens = tokens[:code_index]
    tail_tokens = tokens[code_index + 1 :]

    inline_hex = next((token.upper() for token in tail_tokens if HEX_RE.fullmatch(token)), None)
    descriptor_tokens = [token for token in tail_tokens if not HEX_RE.fullmatch(token)]
    name = " ".join(name_tokens).strip()
    hex_value = inline_hex or find_matching_hex(block, hex_blocks)

    if not hex_value:
      raise RuntimeError(f"Unable to resolve hex for high pressure color {code}.")

    colors.append(
        {
            "code": code,
            "name": name,
            "hex": hex_value,
            "descriptor": " ".join(descriptor_tokens).strip() or None,
            "sourceLabel": f"{name} {code}",
            "codeNormalizedFrom": raw_code if raw_code != code else None,
            "page": 2,
        },
    )

  # The page also contains other code families (DIY, BIG, cap refs). Keep HP only.
  deduped = {entry["code"]: entry for entry in colors}
  colors = sorted(deduped.values(), key=lambda entry: entry["code"])
  if len(colors) != 100:
    raise RuntimeError(f"Expected 100 high pressure colors, got {len(colors)}.")

  return {
      "source": {
          "type": "pdf",
          "url": args.source_url,
          "page": 2,
          "hexApproximation": False,
          "note": "Hex values read from the PDF text. Some HP codes were normalized from OCR ambiguities where O and 0 are confusable.",
      },
      "colors": colors,
  }


def write_json(path, value):
  output_path = Path(path)
  output_path.parent.mkdir(parents=True, exist_ok=True)
  output_path.write_text(f"{json.dumps(value, indent=2)}\n")


def main():
  global args
  args = parse_args()
  pdf_path = Path(args.pdf)

  with tempfile.TemporaryDirectory(prefix="kobra-") as tmp_dir:
    tmp_dir_path = Path(tmp_dir)
    page1_bbox = tmp_dir_path / "page1.html"
    page2_bbox = tmp_dir_path / "page2.html"

    run("pdftotext", "-f", "1", "-l", "1", "-bbox-layout", str(pdf_path), str(page1_bbox))
    run("pdftotext", "-f", "2", "-l", "2", "-bbox-layout", str(pdf_path), str(page2_bbox))

    low_catalog = extract_low_pressure(parse_blocks(page1_bbox))
    high_catalog = extract_high_pressure(parse_blocks(page2_bbox))

  write_json(args.low_output, low_catalog)
  write_json(args.high_output, high_catalog)


if __name__ == "__main__":
  main()
