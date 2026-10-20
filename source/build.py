"""Assemble the stand-alone site from the dashboard's page + data. Run from /home/claude."""
import json, re, os, shutil, glob
SITE = 'site/public'
page = open('index.html').read()
app = open('app.js').read()
app2 = open('app2.js').read() if os.path.exists('app2.js') else ''  # APPMIN: source; the site uses the same readable source
# split the page: markup/styles stay, inline script becomes page.js (own scope, like inside Claude)
scripts = list(re.finditer(r'<script>([\s\S]*?)</script>', page))
assert len(scripts) == 1, len(scripts)
inline = scripts[0].group(1)
markup = page[:scripts[0].start()] + page[scripts[0].end():]
markup = markup.replace('<script src="app.js"></script>', '').replace('<script src="app2.js"></script>', '')
open(f'{SITE}/page.js', 'w').write('(function () {\n' + inline + '\n})();\n')
open(f'{SITE}/app.js', 'w').write('(function () {\n' + app + '\n})();\n' + ('(function () {\n' + app2 + '\n})();\n' if app2 else ''))
# speed: compressed scripts with content-hashed names (browsers keep them; a new deploy gets new names)
import hashlib, subprocess, base64
def _min_hash(name):
    src = os.path.abspath(f'{SITE}/{name}.js')
    subprocess.run(['npx', '--prefix', '/home/claude/h', 'terser', src, '--compress', 'passes=2', '--mangle', '--ecma', '2022', '--format', 'quote_style=1', '-o', src], check=True, cwd='/home/claude/h')
    h8 = hashlib.sha256(open(src, 'rb').read()).hexdigest()[:10]
    for old in glob.glob(f'{SITE}/{name}.*.js'): os.remove(old)
    shutil.move(src, f'{SITE}/{name}.{h8}.js'); return f'{name}.{h8}.js'
PAGE_JS, APP_JS = _min_hash('page'), _min_hash('app')
BOOT = f"cmBoot(['{PAGE_JS}', '{APP_JS}']);"
html = f'''<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Medint"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="theme-color" content="#111111">
<link rel="manifest" href="/manifest.webmanifest"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="robots" content="noindex, nofollow">
<title>Medint</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌍</text></svg>">
<link rel="stylesheet" href="theme.css">
<script src="https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js" integrity="sha384-CjloA8y00+1SDAUkjs099PVfnY2KmDC2BZnws9kh8D/lX1s46w6EPhpXdqMfjK6i" crossorigin="anonymous"></script>
<script src="dash-runtime.js"></script>
</head><body>
<div class="cmd-bar"><span class="t">🌍 Medint</span><button id="cmd-refresh" type="button" title="Reload live NetHunt data">↻ Refresh</button></div>
<div id="dash-root">
{markup}
</div>
<script>{BOOT}</script>
</body></html>
'''
open(f'{SITE}/index.html', 'w').write(html)
# dataset definitions and default filters
defs = {}
for f in glob.glob('/mnt/user-data/outputs/dashdb2/datasets/*.json'):
    d = json.load(open(f)); i = os.path.basename(f)[:-5]
    src = d['source']
    defs[i] = {'title': d.get('title', i), 'source': {'kind': src['kind'], **({'tool': src['tool'], 'args': src.get('args', {})} if src['kind'] == 'query' else {})}}
json.dump(defs, open(f'{SITE}/datasets.json', 'w'), ensure_ascii=False, indent=1)
json.dump(json.load(open('/mnt/user-data/outputs/dashdb2/dash/params.json')), open(f'{SITE}/params.json', 'w'), ensure_ascii=False)
# data files
A = '/mnt/user-data/outputs/dashassets/'
files = {}
for f in glob.glob('/mnt/user-data/outputs/dashdb2/datasets/*.json'):
    d = json.load(open(f)); i = os.path.basename(f)[:-5]
    if d['source']['kind'] == 'file':
        blob = d['source']['url'].split('/')[-1]
        files[i] = blob
for i, blob in files.items():
    src = A + blob + '.json'
    if not os.path.exists(src):
        src = {'pipeline': '/mnt/user-data/outputs/pipeline_snapshot.json', 'company_index': '/mnt/user-data/outputs/company_index.json', 'meeting_links': '/mnt/user-data/outputs/meeting_links.json', 'maps_places': '/mnt/user-data/outputs/maps_places.json', 'map_points': '/mnt/user-data/outputs/map_points.json', 'map_outlines': '/mnt/user-data/outputs/map_outlines.json', 'ortho_check': '/mnt/user-data/outputs/ortho_check.json', 'registration_rules': '/mnt/user-data/outputs/registration_rules.json'}[i]
    shutil.copy(src, f'{SITE}/data/{i}.json')
print('datasets', len(defs), 'files', sorted(files))

# security header: allow this inline boot line (by hash), mic for dictation and location for "Near me" on this site only
_hash = base64.b64encode(hashlib.sha256(BOOT.encode()).digest()).decode()
hd = open(f'{SITE}/_headers').read()
hd = re.sub(r"'sha256-[^']+'", f"'sha256-{_hash}'", hd, count=1)
hd = hd.replace('Permissions-Policy: camera=(), microphone=(), geolocation=()', 'Permissions-Policy: camera=(), microphone=(self), geolocation=(self)')
hd = hd.replace('/*.js\n  Cache-Control: no-cache', '/dash-runtime.js\n  Cache-Control: no-cache')
if '/page.*.js' not in hd:
    hd += '/page.*.js\n  Cache-Control: public, max-age=31536000, immutable\n/app.*.js\n  Cache-Control: public, max-age=31536000, immutable\n'
open(f'{SITE}/_headers', 'w').write(hd)
print('scripts', PAGE_JS, APP_JS)
