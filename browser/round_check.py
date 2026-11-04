# Real-browser check: goal card, task rows, 🧳 trip pop, score editor. Serve site/public on :8811 first.
from playwright.sync_api import sync_playwright
O = '/tmp/claude-0/s/shots/'
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 1300, 'height': 900}, color_scheme='dark')
    ctx.route('**/api/me*', lambda r: r.fulfill(status=200, content_type='application/json', body='{"email":"hi@kavikaplan.com","role":"House","name":"Kavi"}'))
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('http://localhost:8811/', wait_until='load'); pg.wait_for_timeout(7000)
    pg.evaluate("__cm.closeSheet(); __cm2.setPlan(3, false, 0)"); pg.wait_for_timeout(1200)
    g = pg.query_selector('#home-view .cm-hmgoal'); g and g.scroll_into_view_if_needed(); pg.wait_for_timeout(300); g and g.screenshot(path=O + 'goal.png')
    # tasks
    pg.evaluate("""(() => { const h = document.createElement('div'); h.id='tkdemo'; h.className='cm-tkpanel'; h.style.cssText='position:fixed;top:60px;right:20px'; document.body.append(h);
      const co = __cm.rowsOf('companies').find(c => c.iso === 'CL') || {}; const t = (x, d, src) => __cm3.taskRowX({ id: 'x'+Math.random(), text: x, due: d, cid: co.id, company: co.company || co.name || 'Clínica Sur', src }, () => {});
      const y = new Date(Date.now()-864e5*3).toISOString().slice(0,10), td = new Date().toISOString().slice(0,10), nx = new Date(Date.now()+864e5*4).toISOString().slice(0,10);
      h.append(Object.assign(document.createElement('div'), { className: 'gl', textContent: 'Late · 3' }), t('💬 Send WhatsApp to confirm the price list', y, 'ai'), t('Call Juan about the CENABAST tender', y), t('Prepare INVIMA registration dossier', y),
        Object.assign(document.createElement('div'), { className: 'gl', textContent: 'Today · 2' }), t('Email the shoulder catalogue', td), t('Confirm dispatch of the sample order', td), Object.assign(document.createElement('div'), { className: 'gl', textContent: 'Later' }), t('Book a demo visit', nx), t('Think about pricing', '')); })()""")
    pg.wait_for_timeout(400); pg.query_selector('#tkdemo').screenshot(path=O + 'tasks.png'); pg.evaluate("document.getElementById('tkdemo').remove()")
    # trip pop from a fair
    pg.evaluate("cmCongressTab && 0; dash.setParams({view:'congresses'})"); pg.wait_for_timeout(1500); pg.evaluate("cmCongressTab('fairs')"); pg.wait_for_timeout(2000)
    bt = [x for x in pg.query_selector_all('#congress-view .cm-fxcard button') if '🧳' in x.inner_text()]
    print('fair trip buttons:', len(bt))
    if bt:
        bt[0].scroll_into_view_if_needed(); bt[0].evaluate('b => b.click()'); pg.wait_for_timeout(500)
        card = bt[0].evaluate_handle("b => b.closest('.cm-fxcard')"); pg.screenshot(path=O + 'trippop.png')
        pg.evaluate("[...document.querySelectorAll('.cm-tpadd button')].find(b => /New trip/.test(b.textContent)).click()"); pg.wait_for_timeout(2500); pg.screenshot(path=O + 'trip.png', full_page=False)
    # score editor
    pg.evaluate("dash.setParams({view:'country', iso:'CL', tags:['chile'], ctab:'companies', csub:'partners'})"); pg.wait_for_timeout(3500)
    sc = pg.query_selector('.cm-partner .sc'); print('list score:', sc and sc.inner_text())
    if sc:
        sc.scroll_into_view_if_needed(); sc.evaluate('b => b.click()'); pg.wait_for_timeout(500)
        pg.evaluate("[...document.querySelectorAll('.cm-scpan .cm-scpart')].find(x => /Imports/.test(x.textContent)).querySelectorAll('.cm-chip')[3].click()"); pg.wait_for_timeout(200)
        pn = pg.query_selector('.cm-scpan'); pn.screenshot(path=O + 'score.png')
    print('page errors:', errs[:3]); b.close()
