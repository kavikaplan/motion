# Real-browser look: 🎯 chips on congress & fair cards and the “Worth going?” window. Serve site/public on :8811 first.
from playwright.sync_api import sync_playwright
O = '/tmp/claude-0/s/shots/'
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 1300, 'height': 950}, color_scheme='dark')
    ctx.route('**/api/me*', lambda r: r.fulfill(status=200, content_type='application/json', body='{"email":"hi@kavikaplan.com","role":"House","name":"Kavi"}'))
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('http://localhost:8811/#view=congresses', wait_until='load'); pg.wait_for_timeout(6000)
    pg.evaluate("__cm.closeSheet(); dash.setParams({ view: 'congresses' })"); pg.wait_for_timeout(2500)
    pg.query_selector('#congress-view .cm-cglist').screenshot(path=O + 'ev_list.png', clip=None) if False else None
    el = pg.query_selector('#congress-view .cm-cgcard'); print('first card chip:', pg.evaluate("(document.querySelector('#congress-view .cm-evchip') || {}).textContent"))
    pg.evaluate("document.querySelector('#congress-view .cm-cglist').scrollIntoView()"); pg.wait_for_timeout(300); pg.screenshot(path=O + 'ev_cards.png')
    pg.evaluate("[...document.querySelectorAll('#congress-view .cm-evchip')].find(c => /Exhibit|Visit/.test(c.textContent)).click()"); pg.wait_for_timeout(800)
    pg.screenshot(path=O + 'ev_sheet.png')
    pg.set_viewport_size({'width': 390, 'height': 844}); pg.wait_for_timeout(500); pg.screenshot(path=O + 'ev_sheet_mobile.png')
    print('page errors:', errs[:3]); b.close()
