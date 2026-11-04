# Real-browser look at 🎯 Days & goals → tap a day → 🏢 companies worked → the list. Serve site/public on :8811 first.
import json, time
from playwright.sync_api import sync_playwright
O = '/tmp/claude-0/s/shots/'
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 1300, 'height': 950}, color_scheme='dark')
    ctx.route('**/api/me*', lambda r: r.fulfill(status=200, content_type='application/json', body='{"email":"hi@kavikaplan.com","role":"House","name":"Kavi"}'))
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('http://localhost:8811/', wait_until='load'); pg.wait_for_timeout(5000)
    t0 = pg.evaluate("__cm2x.dayIdx(Date.now())"); now = int(time.time() * 1000)
    rows = [dict(person='Yaman', d=t0, action=a, company_id=c, company=n, at=now - k * 900000, n=m) for k, (a, c, n, m) in enumerate([('Email', 'c1', 'STE DATS MEDICAL', 1), ('Call', 'c2', 'Toucomex', 2), ('WhatsApp', 'c2', 'Toucomex', 1), ('Status', 'c3', 'STE GROUPEMENT BIO MEDICAL', 1), ('Comment', 'c4', 'IMPORTADORA HELICO LTDA', 1)])]
    ctx.route('**/api/medint?daily=1*', lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps({'rows': rows, 'plans': [], 'found': []})))
    pg.evaluate("__cm.closeSheet(); __cm2x.daysReset(); __cm2.openLog(document.body, 'days')"); pg.wait_for_timeout(2500)
    pg.evaluate("[...document.querySelectorAll('#cm-sheet .cm-daystbl tr')].find(r => /Yaman/.test(r.textContent)).querySelector('td.today, td:nth-last-child(5)').click()"); pg.wait_for_timeout(500)
    pg.evaluate("document.querySelector('#cm-sheet .cm-daycos').click()"); pg.wait_for_timeout(500)
    pg.evaluate("document.querySelector('#cm-sheet .cm-daydet').scrollIntoView()"); pg.wait_for_timeout(300)
    pg.query_selector('#cm-sheet .cm-daydet').screenshot(path=O + 'days_list.png')
    print('page errors:', errs[:3]); b.close()
