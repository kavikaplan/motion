# Real-browser look: Power hour header (← back, country + flag by the weather) and the Next / Dunitech status menus. Serve site/public on :8811 first.
from playwright.sync_api import sync_playwright
O = '/tmp/claude-0/s/shots/'
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 1300, 'height': 950}, color_scheme='dark')
    ctx.route('**/api/me*', lambda r: r.fulfill(status=200, content_type='application/json', body='{"email":"team@kavikaplan.com","role":"Person","name":"Yaman"}'))
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('http://localhost:8811/', wait_until='load'); pg.wait_for_timeout(5000)
    pg.evaluate("__cm.closeSheet(); dash.setParams({ view: 'country', iso: 'CL', tags: ['chile'], ctab: 'companies', csub: 'partners', ours: 'dunitech' })"); pg.wait_for_timeout(3000)
    pg.evaluate("document.querySelector('.cm-phbtn').click()"); pg.wait_for_timeout(3500)
    pg.evaluate("[...document.querySelectorAll('#cm-sheet button')].find(b => b.textContent === 'Skip').click()"); pg.wait_for_timeout(3500)
    pg.screenshot(path=O + 'ph_v3.png', clip={'x': 0, 'y': 0, 'width': 1300, 'height': 420})
    print('page errors:', errs[:3]); b.close()
