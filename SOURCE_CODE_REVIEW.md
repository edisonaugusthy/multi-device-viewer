# Firefox source-code review

Mobile View & Responsive Tester is built with Node.js, npm, TypeScript, Vite, React, and WXT. No private build tools or repositories are required.

## Reproducible build

Mozilla's default reviewer environment (Ubuntu 24.04, Node.js 24, and npm 11) is supported. From the root of the submitted source archive, run:

```sh
npm ci
npm run compile
npm run zip:firefox
npm run validate:firefox-zip -- .output/multi-device-viewer-0.2.0-firefox.zip
npm run lint:firefox -- .output/multi-device-viewer-0.2.0-firefox.zip
```

The unpacked Firefox extension is written to `.output/firefox-mv3/`. The uploadable add-on and its corresponding source archive are written to `.output/`.

The extension does not require environment variables, network services, generated secrets, or proprietary dependencies. The committed `package-lock.json` pins the dependency tree used by `npm ci`.
