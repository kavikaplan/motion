# Real-browser check of 📂 Import a lead list → ✨ Not in NetHunt. Serve site/public on :8811 first.
from playwright.sync_api import sync_playwright
O = '/tmp/claude-0/s/shots/'
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 1300, 'height': 950}, color_scheme='dark')
    ctx.route('**/api/me*', lambda r: r.fulfill(status=200, content_type='application/json', body='{"email":"hi@kavikaplan.com","role":"House","name":"Kavi"}'))
    ctx.route('**/api/leadstore*', lambda r: r.fulfill(status=200, content_type='application/json', body='{"rows":[],"now":1}'))
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('http://localhost:8811/', wait_until='load'); pg.wait_for_timeout(7000)
    pg.evaluate("__cm.closeSheet(); __cm3.openImport(document.body)"); pg.wait_for_timeout(500)
    pg.set_input_files('#cm-sheet .cm-impdrop input[type=file]', '/tmp/claude-0/s/imp/leads.csv'); pg.wait_for_timeout(1200)
    pg.evaluate("(() => { const t = document.querySelectorAll('#cm-sheet .cm-cpset input.cm-cpin')[1]; t.value = 'Lead generation, Oct 2026'; t.dispatchEvent(new Event('change')); })()"); pg.wait_for_timeout(500)
    pg.screenshot(path=O + 'imp1.png')
    pg.evaluate("document.querySelector('#cm-sheet .cm-ibmain, #cm-sheet .cm-sheet-body, #cm-sheet') && document.querySelectorAll('#cm-sheet .cm-cpbox')[2].scrollIntoView()"); pg.wait_for_timeout(300); pg.screenshot(path=O + 'imp2.png')
    pg.evaluate("[...document.querySelectorAll('#cm-sheet .cm-cpgo .cm-btn')].pop().click()"); pg.wait_for_timeout(800); pg.screenshot(path=O + 'imp3.png')
    pg.evaluate("[...document.querySelectorAll('#cm-sheet .cm-impdone .cm-btn')].pop().click()"); pg.wait_for_timeout(3000)
    pg.screenshot(path=O + 'imp4.png')
    print('page errors:', errs[:3]); b.close()
