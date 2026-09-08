"""Run the production-bridge audits in an already opened playwright-cli session."""
import json
import subprocess
import sys
from pathlib import Path

session, label = sys.argv[1:3]
cli = Path.home() / '.codex/skills/playwright/scripts/playwright_cli.sh'
output = Path('output/playwright/sync-audit')
output.mkdir(parents=True, exist_ok=True)
results = []
for script in ['check.js', 'check-transitions.js', 'check-cross-origin.js', 'check-boundaries.js']:
    result = subprocess.run([str(cli), '-s=' + session, 'run-code',
                             Path('scripts/sync-audit', script).read_text()], capture_output=True, text=True)
    text = result.stdout + result.stderr
    (output / f'{label}-{Path(script).stem}.txt').write_text(text)
    if result.returncode or '### Error' in text or '### Result\n' not in text:
        print(text[:4000])
        raise SystemExit(1)
    payload = json.loads(text.split('### Result\n', 1)[1].split('\n### ', 1)[0])
    results.append(payload)
    print(json.dumps(payload), flush=True)
(output / f'{label}.json').write_text(json.dumps(results, indent=2) + '\n')
