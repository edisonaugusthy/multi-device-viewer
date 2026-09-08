from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

REPO = Path(__file__).resolve().parents[2]
FIXTURE_ROOT = REPO / 'output/playwright/device-audit'
ASSET_ROOT = REPO / 'public/mockups'


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(FIXTURE_ROOT), **kwargs)

    def translate_path(self, path):
        route = urlsplit(path).path
        if route.startswith('/mockups/'):
            asset = (ASSET_ROOT / route.removeprefix('/mockups/')).resolve()
            if asset.is_relative_to(ASSET_ROOT):
                return str(asset)
            return str(FIXTURE_ROOT / '__invalid_asset__')
        return super().translate_path(path)


if __name__ == '__main__':
    ThreadingHTTPServer(('127.0.0.1', 5190), Handler).serve_forever()
