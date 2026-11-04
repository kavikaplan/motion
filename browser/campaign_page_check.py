# Real-browser check of the 📣 Campaigns page (top bar) → receivers window. Serve site/public on :8811 first.
import json, time
from playwright.sync_api import sync_playwright
O = '/tmp/claude-0/s/shots/'
NOW = int(time.time() * 1000)
names = ['Promed Chile', 'Traumed', 'Ortomedica Andes', 'Implantes del Sur', 'Medisur', 'Osteomed Clinic', 'Biotech Ortopedia', 'Surgimed SpA', 'Andes Trauma', 'Columna Chile']
COS = [{'id': f'c{i}', 'fields': {'Name': n, 'Country': ['Chile'], 'City': [['Santiago', 'Concepción', 'Temuco', 'Valparaíso'][i % 4]], 'Status': ['Lead', 'Contacted', 'Unprocessed', 'Follow Up'][i % 4], 'Category': 'Ortho', 'Tags': [['NEXT', 'Alibaba'], ['Global Trade Data'], [], ['MEDICA 24', 'NEXT', 'Email', 'Sample']][i % 4],
        'Email': ([f'info@{n.split()[0].lower()}.con'] if i == 0 else [f'ventas@{n.split()[0].lower()}.cl'] if i % 3 else []), 'Related records': ['aaaaaaaaaaaaaaaaaaaaaaa1'] if i == 0 else [], 'Last Interaction Date': NOW - (i * 37 + 5) * 86400000 if i % 5 else None}} for i, n in enumerate(names)]
PEOPLE = {'records': [{'id': 'p1', 'fields': {'Name': 'Ana Ruiz', 'Title': 'Gerente General', 'Email': ['ana@promed.cl'], 'Company': ['c0']}}, {'id': 'p2', 'fields': {'Name': 'Pedro Soto', 'Title': 'Compras', 'Email': ['pedro@traumed.cl'], 'Company': ['c1']}}, {'id': 'p3', 'fields': {'Name': 'Rosa Vega', 'Title': 'Gerente comercial de importaciones', 'Email': ['rosa@ortomedica.cl'], 'Company': ['c2']}}, {'id': 'p4', 'fields': {'Name': 'Bo Díaz', 'Company': ['c3']}}]}
def nh(route):
    b = json.loads(route.request.post_data or '{}'); t = b.get('tool'); a = b.get('args') or {}
    out = None
    if t == 'filter_records' and a.get('folderId') == '6682e9b8b6386800f586c0b2' and 'Country' in json.dumps(a.get('filter', {})): out = {'records': COS, 'total': len(COS)}
    elif t == 'filter_records' and a.get('folderId') == '6682e9b8b6386800f586c0b0': out = PEOPLE
    elif t == 'get_record' and a.get('recordId') == 'aaaaaaaaaaaaaaaaaaaaaaa1': out = {'id': a['recordId'], 'fields': {'Name': 'Luis Soto', 'Title': 'Director', 'Email': ['luis@promed.cl']}}
    if out is None: return route.continue_()
    route.fulfill(status=200, content_type='application/json', body=json.dumps({'content': [{'type': 'text', 'text': json.dumps(out)}]}))
def gm(route):
    u = route.request.url; j = lambda o: route.fulfill(status=200, content_type='application/json', body=json.dumps(o))
    if '/camp/busyco' in u: return j({'rows': [{'id': 'c9', 'camp': 'Oct run'}]})
    if '/camp/check' in u: return j({'busy': [], 'bounced': [{'email': 'rosa@ortomedica.cl', 'why': 'Address not found'}]})
    if '/camp/load' in u: return j({'boxes': [{'mailbox': 'hi@kavikaplan.com', 'cap': 50, 'today': 12, 'waiting': 30, 'later': 0, 'days': [{'d': time.strftime('%Y-%m-%d', time.gmtime(NOW / 1000 + i * 86400)), 'camp': [20, 10, 0][i] if i < 3 else 0, 'single': 0} for i in range(14)]}]})
    if '/accounts' in u: return j({'role': 'House', 'accounts': [{'mailbox': 'hi@kavikaplan.com', 'aliases': [{'email': 'hi@kavikaplan.com', 'name': 'Kavi Kaplan', 'isDefault': True}]}]})
    return j({'labels': [], 'threads': [], 'rows': [], 'camps': []})
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 1300, 'height': 950}, color_scheme='dark')
    ctx.route('**/api/me*', lambda r: r.fulfill(status=200, content_type='application/json', body='{"email":"hi@kavikaplan.com","role":"House","name":"Kavi"}'))
    ctx.route('**/api/gmail/**', gm); ctx.route('**/api/nethunt', nh)
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('http://localhost:8811/', wait_until='load'); pg.wait_for_timeout(7000)
    pg.screenshot(path=O + 'cpg_top.png', clip={'x': 0, 'y': 0, 'width': 1300, 'height': 200})
    pg.evaluate("__cm.closeSheet(); document.querySelector('.cm-cpgbtn').click()"); pg.wait_for_timeout(600)
    pg.evaluate("__cm3.CAx().isos.push('CL'); __cm3.caRun()"); pg.wait_for_timeout(2500)
    pg.evaluate("document.querySelectorAll('#cm-cpg .cm-cams')[1].open = true"); pg.wait_for_timeout(300)
    pg.screenshot(path=O + 'cpg_page.png')
    pg.evaluate("document.querySelectorAll('#cm-cpg .cm-cams')[1].open = false; [...document.querySelectorAll('#cm-cpg .cm-lpbar .cm-mini')].find(b => /Select all/.test(b.textContent)).click()"); pg.wait_for_timeout(300)
    pg.evaluate("document.querySelector('#cm-cpg .cm-cacreate').click()"); pg.wait_for_timeout(3500)
    pg.screenshot(path=O + 'cpg_receivers.png')
    pg.evaluate("(() => { const d = __cm3.CP.draft; d.steps[0].subject = 'Shoulder implants for {company}'; d.steps[0].body = 'Hi {name},\\n\\nIs {company} in {city} working with shoulder surgeons? As {title} you may…\\n\\nBest regards,\\n{my_name}'; d.steps[0].images = [ { key: 'k1', name: 'next-shoulder.png', size: 120000 } ]; d.steps[0].files = [ { key: 'k2', name: 'Next Shoulder catalogue 2026.pdf', size: 2400000 } ]; __cm.sheetDraw(); })()"); pg.wait_for_timeout(800)
    pg.evaluate("document.querySelector('#cm-sheet .cm-cpstep').scrollIntoView()"); pg.wait_for_timeout(300); pg.screenshot(path=O + 'cpg_email.png')
    pg.evaluate("document.querySelector('#cm-sheet .cm-cpfb').scrollIntoView()"); pg.wait_for_timeout(300); pg.screenshot(path=O + 'cpg_fb.png')
    pg.set_viewport_size({'width': 390, 'height': 844}); pg.wait_for_timeout(500); pg.screenshot(path=O + 'cpg_receivers_m.png')
    print('page errors:', errs[:3]); b.close()
