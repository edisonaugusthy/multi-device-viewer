# Sync browser audit

These scripts drive the real preview bridge with Playwright CLI. They do not mock its messages or history observation. Use only the included local fixture; the installed audit resets simulator settings in its isolated browser profile.

1. Run `npm run dev:preview -- --host 127.0.0.1 --port 5174`.
2. Open a dedicated Playwright CLI Chromium session at `http://127.0.0.1:5174`. Use an explicit installed browser executable in its CLI config if necessary.
3. Run `python3 scripts/sync-audit/run.py SESSION_NAME chromium`. It runs four sequential audit scripts and writes both raw output and a combined JSON result to `output/playwright/sync-audit/`. Any failed assertion exits nonzero.

For installed Chrome, build with `MDV_OPEN_SHADOW_QA=1 npm run build`, copy `.output/chrome-mv3` into a separate directory below `output/`, and load that copy in a dedicated persistent Chrome for Testing profile using `--disable-extensions-except` and `--load-extension`. Pass `--persistent --profile=/tmp/mdv-sync-audit-profile` to the CLI `open` command; a non-persistent context does not reliably load the extension. Open `http://127.0.0.1:5174/scripts/sync-audit/fixture.html?native=1` in that session, then run `python3 scripts/sync-audit/run.py SESSION_NAME installed-chrome`. The `native=1` fixture does not import the bridge: the installed extension must inject it. The fixture server must also be reachable as `localhost` for the cross-origin audit.

Close the audit sessions afterward. Rebuild production packages without `MDV_OPEN_SHADOW_QA`; never ship the QA copy.
