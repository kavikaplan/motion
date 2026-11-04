# Real-browser check: serve site/public on http://localhost:8811 (python3 -m http.server 8811), then: python3 tests/browser/weather_tip_check.py
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 1300, 'height': 900})
    ctx.route('**/api/weather*', lambda r: r.fulfill(status=200, content_type='application/json', body='{"icon":"☀️","temp":20,"feels":19,"text":"Clear","wind":9,"place":"Santiago","source":"Open-Meteo","time":"2026-10-28T10:00:00Z"}'))
    ctx.route('**/api/me*', lambda r: r.fulfill(status=200, content_type='application/json', body='{"email":"hi@kavikaplan.com","role":"House","name":"Kavi"}'))
    pg = ctx.new_page(); pg.goto('http://localhost:8811/', wait_until='load'); pg.wait_for_timeout(7000)
    pg.evaluate("__cm.closeSheet(); window.__c = __cm.rowsOf('company_index').find(x => x.country === 'Chile' && x.city).id; window.cmCompanyIso = 'CL'; dash.setParams({view:'company', cid: window.__c, iso:'CL'})"); pg.wait_for_timeout(3000)
    pg.evaluate("__cm.closeSheet(); __cm2.openPowerHour(document.body, window.__c)"); pg.wait_for_timeout(3000)
    wx = pg.query_selector('#cm-sheet-title .cm-wx'); print('weather chip:', wx and wx.inner_text(), '| native title:', wx and wx.get_attribute('title'))
    wx.hover(); pg.wait_for_timeout(200); v1 = pg.evaluate("(() => { const t = document.querySelector('.cm-tip'); return !!(t && !t.hidden && /Clear/.test(t.textContent)); })()")
    pg.wait_for_timeout(450); v2 = pg.evaluate("(() => { const t = document.querySelector('.cm-tip'); return t && !t.hidden ? t.textContent : null; })()")
    print('shown at 0.2 s:', v1, '| at 0.65 s:', v2)
    print('last-from-them line:', pg.evaluate("!!document.querySelector('#cm-sheet .cm-phlast')")); b.close()
