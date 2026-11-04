# Real-browser check: serve site/public on http://localhost:8811 (python3 -m http.server 8811), then: python3 tests/browser/offline_check.py
import time, json
from playwright.sync_api import sync_playwright
calls = []
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 1200, 'height': 850}, color_scheme='dark')
    state = {'signedout': False}
    def api(route):
        req = route.request; url = req.url
        if state['signedout'] and '/api/' in url:
            return route.fulfill(status=302, headers={'location': 'https://team.cloudflareaccess.com/cdn-cgi/access/login/medint'})
        if '/api/me' in url: return route.fulfill(status=200, content_type='application/json', body='{"email":"hi@kavikaplan.com","role":"House","name":"Kavi"}')
        if '/api/nethunt' in url:
            body = json.loads(req.post_data or '{}'); calls.append(body.get('tool'))
            return route.fulfill(status=200, content_type='application/json', body=json.dumps({'content': [{'type': 'text', 'text': json.dumps({'records': [], 'id': 'x1'})}]}))
        return route.fulfill(status=200, content_type='application/json', body='{}')
    ctx.route('**/api/**', api)
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('http://localhost:8811/', wait_until='load'); pg.wait_for_timeout(int(6*1000))
    print('sw registered:', pg.evaluate("navigator.serviceWorker.getRegistration().then(r => !!(r && r.active))"))
    pg.reload(wait_until='load'); pg.wait_for_timeout(int(5*1000))
    print('controlled:', pg.evaluate("!!navigator.serviceWorker.controller"))
    print('cached:', pg.evaluate("caches.keys().then(async ks => { const o = {}; for (const k of ks) o[k] = (await (await caches.open(k)).keys()).length; return o; })"))
    # offline
    ctx.set_offline(True); pg.reload(wait_until='load'); pg.wait_for_timeout(int(6*1000))
    print('offline page renders:', pg.evaluate("document.querySelectorAll('#dash-root *').length"), '| pill:', pg.evaluate("(document.getElementById('cmd-net')||{}).textContent"))
    r = pg.evaluate("""fetch('/api/nethunt', {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({tool:'create_record_comment', args:{folderId:'f', recordId:'r1', text:'offline note'}})}).then(async r => ({q: r.headers.get('x-medint-queued'), b: await r.text()}))""")
    print('offline write:', r, '| outbox:', pg.evaluate("cmNet.outbox().length"), '| pill:', pg.evaluate("(document.getElementById('cmd-net')||{}).textContent"))
    r2 = pg.evaluate("""fetch('/api/nethunt', {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({tool:'list_records', args:{folderId:'zz'}})}).then(r => r.status + ' ' + r.headers.get('x-medint-offline'))""")
    print('offline unseen read:', r2)
    pg.screenshot(path='/tmp/claude-0/s/off1.png', clip={'x':0,'y':0,'width':1200,'height':120})
    # back online → sent
    calls.clear(); ctx.set_offline(False); pg.evaluate("window.dispatchEvent(new Event('online'))"); pg.wait_for_timeout(int(5*1000))
    print('after online: sent', calls, '| outbox:', pg.evaluate("cmNet.outbox().length"), '| pill:', pg.evaluate("(document.getElementById('cmd-net')||{}).textContent"))
    # a read seen online is served while signed out
    pg.evaluate("""fetch('/api/nethunt', {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({tool:'list_records', args:{folderId:'seen'}})}).then(r => r.text())""")
    state['signedout'] = True
    r3 = pg.evaluate("""fetch('/api/nethunt', {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({tool:'list_records', args:{folderId:'seen'}})}).then(r => r.status + ' ' + r.headers.get('x-medint-saved'))""")
    print('signed out, saved read:', r3)
    pg.evaluate("cmNet.netCheck()"); pg.wait_for_timeout(int(1.5*1000))
    print('signed out pill:', pg.evaluate("(document.getElementById('cmd-net')||{}).textContent"))
    w = pg.evaluate("""fetch('/api/nethunt', {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({tool:'update_record', args:{folderId:'f', recordId:'r2', fields:{Title:'x'}}})}).then(r => r.headers.get('x-medint-queued'))""")
    print('signed-out write queued:', w, cmn := pg.evaluate("cmNet.outbox().length"))
    pg.screenshot(path='/tmp/claude-0/s/off2.png', clip={'x':0,'y':0,'width':1200,'height':120})
    # signed out navigation → saved app still opens
    pg.reload(wait_until='load'); pg.wait_for_timeout(int(4*1000))
    print('signed-out reload renders:', pg.evaluate("document.querySelectorAll('#dash-root *').length"), pg.url)
    print('errors:', errs[:3]); b.close()
