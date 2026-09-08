"""Detect saturated fixture content bleeding through neutral header/footer edges.

Unlike portrait-only checks, landscape screen edges may include gray hardware
antialiasing. Inspect two wholly interior display-pixel rows for fixture color,
allowing up to 15 RGB levels of neutral artwork/compositing tint.
"""
import argparse, json, math
from pathlib import Path
from PIL import Image
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('audit',type=Path)
parser.add_argument('--dpr',type=float,required=True)
args=parser.parse_args()
audit=json.loads(args.audit.read_text());failures=[];images={};samples=0
for case in audit['results']:
    im=images.setdefault(case['filename'],Image.open(args.audit.parent/case['filename']))
    rect=case['rect'];top=math.ceil(rect['top']*args.dpr);bottom=math.floor(rect['bottom']*args.dpr)
    for fraction in (.3,.65,.8):
        x=round((rect['x']+rect['width']*fraction)*args.dpr)
        for y in (top,top+1,bottom-2,bottom-1):
            rgb=im.getpixel((x,y))[:3];samples+=1
            if max(rgb)-min(rgb)>15:
                failures.append({'id':case['id'],'orientation':case.get('orientation'),'zoom':case['zoom'],'scroll':case['scroll'],'filename':case['filename'],'pixel':[x,y],'rgb':rgb})
print(json.dumps({'devices':audit['devices'],'cases':audit['cases'],'samples':samples,'failures':failures},indent=2))
raise SystemExit(bool(failures))
