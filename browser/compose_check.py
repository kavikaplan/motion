# Real-browser check of the ✉ rich email box (dark theme) and the Power hour ➕ Add info box. Serve site/public on :8811 first.
import json
from playwright.sync_api import sync_playwright
O = '/tmp/claude-0/s/shots/'
ACC = {'role': 'House', 'accounts': [{'mailbox': 'hi@kavikaplan.com', 'aliases': [{'email': 'export@duni-tech.com', 'mailbox': 'hi@kavikaplan.com', 'name': 'Dunitech Nails - Export', 'isDefault': True, 'signature': '<div dir="ltr"><span style="color:#000000">Kind regards,<br>Dunitech Nails | <a href="https://www.duni-tech.com">www.duni-tech.com</a><br>+90 552 795 2296</span></div>'}]}]}
def gm(route):
    u = route.request.url; j = lambda o: route.fulfill(status=200, content_type='application/json', body=json.dumps(o))
    if '/accounts' in u: return j(ACC)
    return j({})
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 1300, 'height': 950}, color_scheme='dark')
    ctx.route('**/api/me*', lambda r: r.fulfill(status=200, content_type='application/json', body='{"email":"hi@kavikaplan.com","role":"House","name":"Kavi"}'))
    ctx.route('**/api/gmail/**', gm); ctx.route('**/api/files/_templates.json', lambda r: r.fulfill(status=200, content_type='application/json', body='[]'))
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('http://localhost:8811/', wait_until='load'); pg.wait_for_timeout(6000)
    pg.evaluate("__cm.closeSheet(); __cm.uiFlags = { ...(__cm.uiFlags||{}), mailOn: true, aiDrafts: false }; __cm3.openMail({ anchor: document.body, to: 'contact@datsmedical.com', subject: 'Dunitech – STE DATS MEDICAL', company: 'STE DATS MEDICAL', brand: 'Dunitech' })"); pg.wait_for_timeout(1500)
    pg.evaluate("""(() => { const ed = document.querySelector('#cm-sheet .cm-mlbody'); ed.innerHTML = 'Hello, this is Yaman from Dunitech. We make intramedullary nails and are looking for a distributor in Tunisia.<div style="text-align:center"><b>Centred line</b></div><img src="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27220%27 height=%2760%27%3E%3Crect width=%27220%27 height=%2760%27 fill=%27%23f59e0b%27/%3E%3C/svg%3E">'; })()""")
    pg.wait_for_timeout(300); pg.screenshot(path=O + 'compose_dark.png')
    pg.set_viewport_size({'width': 390, 'height': 844}); pg.wait_for_timeout(500); pg.screenshot(path=O + 'compose_mobile.png')
    pg.set_viewport_size({'width': 1300, 'height': 950})
    pg.evaluate("__cm.closeSheet(); __cm.openSheet(document.body, '⚡ test', (b) => { const F = new Map([['Phone number','+216 71 123 456']]); b.append(__cm3.piBox('cX', 'STE Bio Medical', F, () => {})); }, { center: true, wide: true })"); pg.wait_for_timeout(500)
    pg.fill('#cm-sheet .cm-piin', 'Tel: +216 71 123 456 / Mob 00216 98 765 432\nEmail: info@biomed.tn\nwww.biomed.tn\nDistributor for 12 private clinics in Sfax'); pg.wait_for_timeout(600)
    pg.query_selector('#cm-sheet .cm-phinfo').screenshot(path=O + 'addinfo.png')
    print('page errors:', errs[:3]); b.close()
