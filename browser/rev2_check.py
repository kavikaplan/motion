# Real-browser look: picture toolbar + drag handle in the email box, ✍️ My Arabic panel. Serve site/public on :8811 first.
import json
from playwright.sync_api import sync_playwright
O = '/tmp/claude-0/s/shots/'
ACC = {'role': 'House', 'accounts': [{'mailbox': 'hi@kavikaplan.com', 'aliases': [{'email': 'export@duni-tech.com', 'mailbox': 'hi@kavikaplan.com', 'name': 'Dunitech Nails - Export', 'isDefault': True, 'signature': 'Kind regards,<br>Yaman'}]}]}
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 1300, 'height': 950}, color_scheme='dark')
    ctx.route('**/api/me*', lambda r: r.fulfill(status=200, content_type='application/json', body='{"email":"hi@kavikaplan.com","role":"House","name":"Kavi"}'))
    ctx.route('**/api/gmail/**', lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps(ACC) if '/accounts' in r.request.url else '{}'))
    ctx.route('**/api/files/_templates.json', lambda r: r.fulfill(status=200, content_type='application/json', body='[]'))
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('http://localhost:8811/', wait_until='load'); pg.wait_for_timeout(5000)
    pg.evaluate("__cm.closeSheet(); __cm.uiFlags = { ...(__cm.uiFlags||{}), mailOn: true, aiDrafts: false }; __cm3.openMail({ anchor: document.body, to: 'contact@datsmedical.com', subject: 'Intro', company: 'STE', brand: 'Dunitech' })"); pg.wait_for_timeout(1500)
    pg.evaluate("""(() => { const ed = document.querySelector('#cm-sheet .cm-mlbody'); ed.innerHTML = 'Hello, this is Yaman from Dunitech.<br><img src="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27600%27 height=%27200%27%3E%3Crect width=%27600%27 height=%27200%27 fill=%27%23f59e0b%27/%3E%3Ctext x=%2720%27 y=%27110%27 font-size=%2740%27%3EBanner%3C/text%3E%3C/svg%3E" data-up="1"><br>Best regards'; })()""")
    pg.wait_for_timeout(300); pg.click('#cm-sheet .cm-mlbody img'); pg.wait_for_timeout(200)
    pg.click('#cm-sheet .cm-mlimgbar button[title="Medium"]'); pg.wait_for_timeout(300)
    h = pg.query_selector('#cm-sheet .cm-mlimgh').bounding_box(); pg.mouse.move(h['x'] + 8, h['y'] + 8); pg.mouse.down(); pg.mouse.move(h['x'] + 90, h['y'] + 30, steps=6); pg.mouse.up(); pg.wait_for_timeout(300)
    print('width after drag:', pg.evaluate("document.querySelector('#cm-sheet .cm-mlbody img').getAttribute('width')"))
    pg.query_selector('#cm-sheet .cm-mledw').screenshot(path=O + 'img_resize.png')
    pg.evaluate("__cm.closeSheet(); __cm.openSheet(document.body, '⚡ test', (b) => b.append(__cm3.arPanel(() => {})), { center: true })"); pg.wait_for_timeout(400)
    pg.query_selector('#cm-sheet .cm-arpanel').screenshot(path=O + 'ar_panel.png')
    print('page errors:', errs[:3]); b.close()
