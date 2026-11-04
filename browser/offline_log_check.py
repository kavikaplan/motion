# Real-browser check: serve site/public on http://localhost:8811 (python3 -m http.server 8811), then: python3 tests/browser/offline_log_check.py
import time, json
from playwright.sync_api import sync_playwright
calls = []; state = {'off': False}
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 1300, 'height': 900}, color_scheme='dark', service_workers='allow')
    def api(route):
        req = route.request; url = req.url
        if state['off']: return route.abort('internetdisconnected')
        if '/api/me?' in url or url.endswith('/api/me'): return route.fulfill(status=200, content_type='application/json', body='{"email":"hi@kavikaplan.com","role":"House","name":"Kavi"}')
        if '/api/nethunt' in url:
            body = json.loads(req.post_data or '{}'); calls.append(body.get('tool'))
            return route.fulfill(status=200, content_type='application/json', body=json.dumps({'content': [{'type': 'text', 'text': json.dumps({'records': [], 'id': 'x1', 'events': []})}]}))
        calls.append(req.method + ' ' + url.split('/api/')[1][:12])
        return route.fulfill(status=200, content_type='application/json', body='{}')
    ctx.route('**/api/**', api)
    pg = ctx.new_page(); errs = [];  pg.on('pageerror', lambda e: errs.append(str(e)))
    cl = "(() => { const t = (document.getElementById('cm-sheet-title')||{}).textContent||''; if (/Good/.test(t)) __cm.closeSheet(); })()"
    pg.goto('http://localhost:8811/', wait_until='load'); pg.wait_for_timeout(int(6*1000)); pg.evaluate(cl)
    cid = pg.evaluate("__cm.rowsOf('company_index').find(x => x.country === 'Chile' && x.city).id")
    pg.evaluate("(c) => { window.cmCompanyIso = 'CL'; dash.setParams({view:'company', cid: c, iso:'CL'}) }", cid); pg.wait_for_timeout(int(3*1000)); pg.evaluate(cl)
    state['off'] = True
    pg.evaluate("(c) => __cm3.openLog(document.body, c, 'Test Co', {kind:'Note'})", cid); pg.wait_for_timeout(int(1*1000))
    pg.wait_for_timeout(int(1.5*1000)); pg.evaluate("(() => { const t = document.querySelector('#cm-sheet textarea'); t.value = 'Spoke with Ana, wants prices for nails. Call back Monday.'; t.dispatchEvent(new Event('input', {bubbles:true})); })()"); pg.wait_for_timeout(int(0.5*1000))
    pg.evaluate("[...document.querySelectorAll('#cm-sheet button')].find(b => /Save/.test(b.textContent)).click()"); pg.wait_for_timeout(int(3*1000))
    print('queued:', pg.evaluate("cmNet.outbox().map(x => (JSON.parse(x.body||'{}').tool) || x.url.split('?')[0])"), '| pill:', pg.evaluate("(document.getElementById('cmd-net')||{}).textContent"))
    calls.clear(); state['off'] = False; pg.evaluate("window.dispatchEvent(new Event('online'))"); pg.wait_for_timeout(int(6*1000))
    print('sent:', calls, '| left:', pg.evaluate("cmNet.outbox().length"), '| pill:', repr(pg.evaluate("(document.getElementById('cmd-net')||{}).textContent")))
    print('waiting box gone:', pg.evaluate("!document.querySelector('.cm-obq')"), '| toast:', pg.evaluate("[...document.querySelectorAll('.cm-toast')].map(x=>x.textContent).join(' | ')"))
    print('errors:', errs[:3]); b.close()
