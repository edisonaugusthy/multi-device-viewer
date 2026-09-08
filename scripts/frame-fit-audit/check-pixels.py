"""Check straight header edges against the screen boundary in light UI captures."""
import json, math, sys
from pathlib import Path
from PIL import Image

failures, checked = [], 0
for arg in sys.argv[1:]:
    path = Path(arg)
    audit = json.loads(path.read_text())
    dpr = audit['dpr']
    for case in audit['results']:
        if case['darkMode'] or case['zoom'] == 'larger':
            continue  # Dark chrome lacks contrast; enlarged previews can be cropped by the workspace.
        image = Image.open(path.parent / (case['filename'] + '.png')).convert('RGB')
        for item in case['measurements']:
            r, bar = item['screen'], item['bar']
            for side in ['left', 'right']:
                edge = r[side] * dpr
                expected = math.ceil(edge) if side == 'left' else math.floor(edge) - 1
                for fraction in [.25, .5, .75]:
                    y = round((bar['top'] + bar['height'] * fraction) * dpr)
                    xs = range(expected - 5, expected + 6)
                    bright = [x for x in xs if 0 <= x < image.width and min(image.getpixel((x, y))) > 195]
                    actual = (min(bright) if side == 'left' else max(bright)) if bright else None
                    if actual is None or abs(actual - expected) > 1:
                        failures.append({'file': case['filename'], 'device': item['id'], 'side': side, 'y': y, 'expected': expected, 'actual': actual})
                    checked += 1
print(json.dumps({'edgeSamples': checked, 'failures': failures}, indent=2))
raise SystemExit(bool(failures))
