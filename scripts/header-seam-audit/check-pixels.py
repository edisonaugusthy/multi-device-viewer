"""Validate the solid website-header edge in captures from check.js (requires Pillow)."""
import argparse
import json
import math
from pathlib import Path
from PIL import Image

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("audit", type=Path)
parser.add_argument("--dpr", type=float, required=True)
args = parser.parse_args()
audit = json.loads(args.audit.read_text())
failures = []
images = {}
for case in audit["results"]:
    image = images.setdefault(case["filename"], Image.open(args.audit.parent / case["filename"]))
    rect = case["rect"]
    top = math.floor(rect["y"] * args.dpr)
    for fraction in (0.3, 0.65, 0.8):
        x = round((rect["x"] + rect["width"] * fraction) * args.dpr)
        # Top-address layouts retain their intentional browser-toolbar separator.
        for y in range(top + (2 if case["topAddress"] else -1), top + 4):
            color = image.getpixel((x, y))[:3]
            if color != (255, 255, 255):
                failures.append({"id": case["id"], "zoom": case["zoom"], "scroll": case["scroll"], "pixel": [x, y], "rgb": color})
print(json.dumps({"devices": audit["devices"], "cases": audit["cases"], "failures": failures}, indent=2))
raise SystemExit(bool(failures))
