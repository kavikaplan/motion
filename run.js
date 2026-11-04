// Medint test runner — runs every scenario in website mode and reports which pass.
// Usage (once): cd tests && npm install      Then: npm test        (or: node run.js t53 t62 to run some; node run.js --bundle to test the built site)
const { spawnSync } = require('child_process'); const fs = require('fs'); const path = require('path');
const bundle = process.argv.includes('--bundle'); // test the BUILT website bundle (public/app.<hash>.js) instead of the source files
const only = process.argv.slice(2).filter((a) => a !== '--bundle');
const BENV = {}; if (bundle) { const pub = path.join(__dirname, '..', 'public'); const b = fs.readdirSync(pub).find((f) => /^app\.[0-9a-f]+\.js$/.test(f)); const empty = path.join(__dirname, '.empty.js'); fs.writeFileSync(empty, ''); Object.assign(BENV, { APPJS: path.join(pub, b), APPJS2: empty, APPJS3: empty }); console.log(`testing the built bundle ${b}`); } const tests = fs.readdirSync(__dirname).filter((f) => /^t[\w]*\.js$/.test(f) && f !== 'run.js').map((f) => f.replace(/\.js$/, '')).filter((t) => !only.length || only.includes(t));
let fail = 0; const t0 = Date.now();
for (const t of tests) {
  const r = spawnSync(process.execPath, [path.join(__dirname, `${t}.js`)], { env: { ...process.env, SITE: '1', ...BENV }, encoding: 'utf8', timeout: 180000 });
  const out = `${r.stdout || ''}${r.stderr || ''}`; const last = (out.match(/errors[^\n]*/g) || []).pop() || '';
  const ok = r.status === 0 && /errors (total: )?0\b/.test(last);
  if (!ok) { fail++; console.log(`✗ ${t}  ${last || (r.error ? r.error.message : 'no result')}`); fs.writeFileSync(path.join(__dirname, `${t}.log`), out); } else console.log(`✓ ${t}`);
}
console.log(`\n${tests.length - fail} of ${tests.length} passed in ${Math.round((Date.now() - t0) / 1000)} s${fail ? ' — see the .log files of the failed ones' : ''}`); process.exit(fail ? 1 : 0);
