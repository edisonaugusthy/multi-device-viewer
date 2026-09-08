"""Local dummy session/CSP fixtures. No accounts or external requests."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit, parse_qs
import time


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        route = urlsplit(self.path)
        query = parse_qs(route.query)
        if route.path == '/slow' and self.headers.get('Sec-Fetch-Dest') == 'iframe':
            time.sleep(8)
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        logged_in = 'mdv_dummy_session=present' in self.headers.get('Cookie', '')
        if route.path == '/login':
            self.send_header('Set-Cookie', 'mdv_dummy_session=present; HttpOnly; SameSite=Strict; Path=/')
            logged_in = True
        if route.path == '/logout':
            self.send_header('Set-Cookie', 'mdv_dummy_session=; HttpOnly; SameSite=Strict; Max-Age=0; Path=/')
            logged_in = False
        if route.path in ('/protected', '/session', '/login', '/logout'):
            self.send_header('X-Frame-Options', 'DENY')
            self.send_header('Content-Security-Policy', "frame-ancestors 'none'")
        if route.path == '/host-csp':
            self.send_header('Content-Security-Policy', "frame-src 'none'; style-src 'none'")
        self.end_headers()
        if route.path == '/outside':
            body = '<iframe title="Protected outside viewer" src="/protected"></iframe>'
        else:
            body = '''<h1>Mobile View compatibility fixture</h1>
<p id="server-session">%s</p><textarea id="draft" aria-label="Unsaved draft"></textarea>
<div style="height:2200px;background:linear-gradient(#def,#fed)">Scroll fixture</div>
<footer style="position:fixed;bottom:0;background:#84193d;color:white">Fixed footer</footer>
<script>window.liveDocumentToken=crypto.randomUUID();document.documentElement.lang='en';
if(new URLSearchParams(location.search).has('error'))setTimeout(()=>{throw new Error('Dummy site script failure')},1200);
</script>''' % ('signed-in' if logged_in else 'signed-out')
        self.wfile.write(('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mobile View compatibility fixture</title><body>' + body + '</body></html>').encode())


if __name__ == '__main__':
    ThreadingHTTPServer(('127.0.0.1', 4191), Handler).serve_forever()
