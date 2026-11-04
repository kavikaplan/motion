# Real-browser check: the 📂 Import a lead list BUTTON on ✨ Not in NetHunt (not the function) opens the window in front and imports a file.
from playwright.sync_api import sync_playwright
O = '/tmp/claude-0/s/shots/'
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 1300, 'height': 950}, color_scheme='dark')
    ctx.route('**/api/me*', lambda r: r.fulfill(status=200, content_type='application/json', body='{"email":"hi@kavikaplan.com","role":"House","name":"Kavi"}'))
    ctx.route('**/api/leadstore*', lambda r: r.fulfill(status=200, content_type='application/json', body='{"rows":[],"now":1}'))
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append('console: ' + m.text))
    pg.goto('http://localhost:8811/', wait_until='load'); pg.wait_for_timeout(7000)
    pg.evaluate("__cm.closeSheet()")
    nb = pg.query_selector('button:has-text("Not in NetHunt")'); print('top button:', bool(nb)); nb.click(); pg.wait_for_timeout(2500)
    ib = pg.query_selector('.cm-impbtn'); print('import button:', bool(ib), ib and ib.is_visible())
    ib.click(); pg.wait_for_timeout(800)
    sh = pg.evaluate("(() => { const s = document.getElementById('cm-sheet'); const r = s.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + 40); return { hidden: s.hidden, title: document.getElementById('cm-sheet-title').textContent, z: getComputedStyle(s).zIndex, lpz: getComputedStyle(document.getElementById('cm-lp') || document.body).zIndex, onTop: !!(top && s.contains(top)) }; })()")
    print('sheet:', sh); pg.screenshot(path=O + 'impreal1.png')
    if sh['onTop']:
        pg.set_input_files('#cm-sheet .cm-impdrop input[type=file]', '/tmp/claude-0/s/imp/leads.csv'); pg.wait_for_timeout(1200); pg.screenshot(path=O + 'impreal2.png')
        n = pg.evaluate("document.querySelectorAll('#cm-sheet .cm-cpbox').length"); print('steps shown:', n)
        pg.evaluate("[...document.querySelectorAll('#cm-sheet .cm-cpgo .cm-btn')].pop().click()"); pg.wait_for_timeout(800)
        print('done box:', pg.evaluate("(document.querySelector('#cm-sheet .cm-impdone') || {}).textContent"))
    print('page errors:', errs[:5]); b.close()
