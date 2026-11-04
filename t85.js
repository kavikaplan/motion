const { run } = require('./harness');
(async () => { const h = run({ params: { view: 'home', ours: 'next' } }); await h.settle(); await new Promise((r) => setTimeout(r, 2000));
  const L = h.w.__cm3.waLand; [['+593 2 245 1234', 'EC landline'], ['+593 99 123 4567', 'EC mobile'], ['+507 8215514', 'PA 8 landline?'], ['+507 6123 4567', 'PA mobile'], ['+90 312 242 00 41', 'TR landline'], ['+90 552 795 22 96', 'TR mobile'], ['+57 1 234 5678', 'CO landline'], ['+57 310 123 4567', 'CO mobile'], ['+52 55 1234 5678', 'MX (unknown -> keep)'], ['+1 305 555 0101', 'US keep']].forEach(([n, l]) => console.log(l, '->', L(n) ? 'landline (no WhatsApp)' : 'WhatsApp ok'));
  console.log('errors', h.errors.length); process.exit(0); })();
