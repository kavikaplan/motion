# Real-browser check of 📣 campaigns (new campaign builder, campaign page, mailbox load). Serve site/public on :8811 first.
import json, time
from playwright.sync_api import sync_playwright
O = '/tmp/claude-0/s/shots/'
NOW = int(time.time() * 1000)
day = lambda i: time.strftime('%Y-%m-%d', time.gmtime(NOW / 1000 + i * 86400))
ACC = {'role': 'House', 'accounts': [{'mailbox': 'hi@kavikaplan.com', 'aliases': [{'email': 'hi@kavikaplan.com', 'name': 'Kavi Kaplan', 'isDefault': True, 'signature': 'Kavi Kaplan<br>United Vision'}, {'email': 'sales@kavikaplan.com', 'name': 'Kavi Sales'}]}, {'mailbox': 'team@kavikaplan.com', 'aliases': [{'email': 'team@kavikaplan.com', 'name': 'Team', 'isDefault': True}]}]}
LOAD = {'boxes': [{'mailbox': 'hi@kavikaplan.com', 'cap': 50, 'today': 31, 'waiting': 84, 'later': 0, 'days': [dict(d=day(i), camp=[19, 50, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0][i], single=[1, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0][i], **({'sent': 31} if i == 0 else {})) for i in range(14)]},
                   {'mailbox': 'team@kavikaplan.com', 'cap': 50, 'today': 0, 'waiting': 0, 'later': 0, 'days': [dict(d=day(i), camp=0, single=0) for i in range(14)]}]}
CAMP = {'camp': {'id': 'C1', 'name': 'Chile shoulder — Nov', 'mailbox': 'hi@kavikaplan.com', 'sender': 'sales@kavikaplan.com', 'status': 'active', 'on_touch': 'pause', 'created': NOW - 3 * 864e5, 'brand': 'Next Shoulder', 'login': 'hi@kavikaplan.com',
  'steps': [{'subject': 'Shoulder implants for {company}', 'body': 'Hi {name|there}', 'wait': 0, 'hour': 9}, {'subject': '', 'body': 'Following up', 'wait': 3, 'hour': 10}, {'subject': '', 'body': 'Last note', 'wait': 5, 'hour': 10}],
  'n': {'total': 6, 'companies': 3, 'emails': 8, 'active': 3, 'paused': 2, 'replied': 1, 'bounced': 1}},
  'rcpts': [
    {'id': 'a', 'company_id': 'c1', 'company': 'Promed Chile', 'city': 'Santiago', 'country': 'Chile', 'iso': 'CL', 'kind': 'person', 'name': 'Dr. Ana Ruiz', 'email': 'ana@promed.cl', 'tz': 'America/Santiago', 'step': 1, 'status': 'paused', 'reason': 'replied: “Yes, please send the catalogue”', 'thread_id': 't1', 'replied_at': NOW},
    {'id': 'b', 'company_id': 'c1', 'company': 'Promed Chile', 'city': 'Santiago', 'country': 'Chile', 'iso': 'CL', 'kind': 'company', 'name': '', 'email': 'info@promed.cl', 'tz': 'America/Santiago', 'step': 1, 'status': 'paused', 'reason': 'company paused: Dr. Ana Ruiz replied', 'thread_id': 't2'},
    {'id': 'c', 'company_id': 'c2', 'company': 'Traumed', 'city': 'Concepción', 'country': 'Chile', 'iso': 'CL', 'kind': 'person', 'name': 'Rosa Vega', 'email': 'rosa@traumed.cl', 'tz': 'America/Santiago', 'step': 2, 'status': 'active', 'next_at': NOW + 2 * 864e5, 'thread_id': 't3', 'on_touch': 'continue'},
    {'id': 'd', 'company_id': 'c2', 'company': 'Traumed', 'city': 'Concepción', 'country': 'Chile', 'iso': 'CL', 'kind': 'company', 'name': '', 'email': 'contacto@traumed.cl', 'tz': 'America/Santiago', 'step': 1, 'status': 'active', 'next_at': NOW + 864e5, 'thread_id': 't4', 'on_touch': 'continue'},
    {'id': 'e', 'company_id': 'c3', 'company': 'OrtoSur', 'city': 'Temuco', 'country': 'Chile', 'iso': 'CL', 'kind': 'person', 'name': 'Jorge Pérez', 'email': 'jorge@ortosur.cl', 'tz': 'America/Santiago', 'step': 1, 'status': 'bounced', 'reason': 'Address not found', 'thread_id': 't5'},
    {'id': 'f', 'company_id': 'c3', 'company': 'OrtoSur', 'city': 'Temuco', 'country': 'Chile', 'iso': 'CL', 'kind': 'company', 'name': '', 'email': 'ventas@ortosur.cl', 'tz': 'America/Santiago', 'step': 0, 'status': 'active', 'next_at': NOW + 3600e3}]}
NH = {'get_record:c1': {'id': 'c1', 'fields': {'Name': 'Promed Chile', 'Email': ['info@promed.cl', 'ana@promed.cl'], 'City': ['Santiago'], 'Country': ['Chile']}},
      'get_record:c2': {'id': 'c2', 'fields': {'Name': 'Traumed', 'Email': ['contacto@traumed.cl'], 'City': ['Concepción'], 'Country': ['Chile']}}}
PEOPLE = {'records': [{'id': 'p1', 'fields': {'Name': 'Dr. Ana Ruiz', 'Title': 'Gerente General', 'Email': ['ana@promed.cl'], 'Company': ['c1']}}, {'id': 'p2', 'fields': {'Name': 'Luis Soto', 'Title': 'Compras', 'Email': ['luis@promed.cl'], 'Company': ['c1']}}, {'id': 'p3', 'fields': {'Name': 'Rosa Vega', 'Title': 'Gerente', 'Email': ['rosa@traumed.cl'], 'Company': ['c2']}}, {'id': 'p4', 'fields': {'Name': 'Bo Díaz', 'Company': ['c2']}}]}
def nh(route):
    b = json.loads(route.request.post_data or '{}'); t = b.get('tool'); a = b.get('args') or {}
    out = NH.get(f"{t}:{a.get('recordId')}") or (PEOPLE if t == 'filter_records' and a.get('folderId') == '6682e9b8b6386800f586c0b0' else None)
    if out is None: return route.continue_()
    route.fulfill(status=200, content_type='application/json', body=json.dumps({'content': [{'type': 'text', 'text': json.dumps(out)}]}))
def gm(route):
    u = route.request.url; j = lambda o: route.fulfill(status=200, content_type='application/json', body=json.dumps(o))
    if '/camp/load' in u: return j(LOAD)
    if '/camp/list' in u: return j({'camps': [CAMP['camp'], {**CAMP['camp'], 'id': 'C2', 'name': 'Mexico trauma — Oct', 'status': 'done', 'sender': 'hi@kavikaplan.com', 'n': {'total': 22, 'companies': 12, 'emails': 58, 'done': 19, 'replied': 3}}]})
    if '/camp/get' in u: return j(CAMP)
    if '/camp/check' in u: return j({'busy': [{'email': 'contacto@traumed.cl', 'camp': 'Traumed Oct'}]})
    if '/camp/company' in u: return j({'rows': []})
    if '/accounts' in u: return j(ACC)
    if '/labels' in u: return j({'labels': []})
    if '/threads' in u: return j({'threads': []})
    if '/scheduled' in u: return j({'rows': []})
    return j({})
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 1300, 'height': 950}, color_scheme='dark')
    ctx.route('**/api/me*', lambda r: r.fulfill(status=200, content_type='application/json', body='{"email":"hi@kavikaplan.com","role":"House","name":"Kavi"}'))
    ctx.route('**/api/gmail/**', gm); ctx.route('**/api/nethunt', nh)
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('http://localhost:8811/', wait_until='load'); pg.wait_for_timeout(7000)
    pg.evaluate("__cm.closeSheet(); __cm3.campNew(['c1', 'c2'], document.body)"); pg.wait_for_timeout(2500)
    pg.evaluate("""(() => { const d = __cm3.CP.draft; d.name = 'Chile shoulder — Nov'; d.brand = 'Next Shoulder'; d.steps[0].subject = 'Shoulder implants for {company}'; d.steps[0].body = 'Hi {name|there},\\n\\nI work with Next Shoulder, a Turkish maker of shoulder prostheses. Is {company} working with shoulder surgeons in {city}?\\n\\nWould a short call next week make sense?\\n\\nBest regards,\\n{my_name}'; d.sender = 'sales@kavikaplan.com'; __cm.sheetDraw(); })()"""); pg.wait_for_timeout(800)
    body = pg.query_selector('#cm-sheet .cm-ibmain')
    pg.screenshot(path=O + 'camp_new1.png')
    boxes = pg.query_selector_all('#cm-sheet .cm-cpbox')
    for i, bx in enumerate(boxes): bx.screenshot(path=O + f'camp_new_box{i+1}.png')
    pg.evaluate("__cm3.CP.cur = 'C1'; __cm3.CP.data = null; document.querySelectorAll('.cm-ibl').forEach(b => /Campaigns/.test(b.textContent) && b.click())"); pg.wait_for_timeout(1500)
    pg.query_selector('#cm-sheet .cm-ibmain').screenshot(path=O + 'camp_list.png')
    pg.evaluate("document.querySelector('.cm-cpcard').click()"); pg.wait_for_timeout(1500)
    pg.query_selector('#cm-sheet .cm-ibmain').screenshot(path=O + 'camp_page.png')
    pg.set_viewport_size({'width': 390, 'height': 844}); pg.evaluate("__cm.sheetDraw()"); pg.wait_for_timeout(800); pg.screenshot(path=O + 'camp_page_mobile.png')
    print('page errors:', errs[:3]); b.close()
