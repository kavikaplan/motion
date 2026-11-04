// every server file (functions/ and scheduler/) must parse — the same check Cloudflare's build does; a broken file stops the whole deploy
const { execFileSync } = require('child_process'); const fs = require('fs'); const path = require('path');
const root = path.join(__dirname, '..'); const files = [];
const walk = (d) => { if (!fs.existsSync(d)) return; for (const n of fs.readdirSync(d)) { const p = path.join(d, n); if (fs.statSync(p).isDirectory()) { n !== 'node_modules' && walk(p); } else if (/\.(js|mjs)$/.test(n)) files.push(p); } };
walk(path.join(root, 'functions')); walk(path.join(root, 'scheduler'));
const bad = []; for (const f of files) { try { execFileSync(process.execPath, [ '--experimental-default-type=module', '--check', f ], { stdio: 'pipe' }); } catch (e) { bad.push(`${path.relative(root, f)}: ${String(e.stderr || e.message).split('\n').slice(0, 5).join(' ')}`); } }
console.log(`${files.length} server files checked`); bad.forEach((b) => console.log('✗', b));
console.log(`errors ${bad.length}`, bad.length ? 'syntax' : ''); process.exit(0);
