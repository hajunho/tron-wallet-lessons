// tools/make-expected-outputs.js — 각 레슨을 데모 니모닉·미리보기 모드로 실행해 expected-output.txt 를 갱신한다.
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { DEMO_MNEMONIC } = require('../lib/wallet');

const lessonsDir = path.join(__dirname, '..', 'lessons');
const only = process.argv.slice(2);
const slugs = fs.readdirSync(lessonsDir).filter((d) => /^\d{2}-/.test(d)).filter((s) => !only.length || only.some((o) => s.startsWith(o))).sort();
const today = new Date().toISOString().slice(0, 10);
for (const slug of slugs) {
  const script = path.join(lessonsDir, slug, 'script.js');
  if (!fs.existsSync(script)) continue;
  const r = spawnSync(process.execPath, [script], {
    env: { ...process.env, MNEMONIC: DEMO_MNEMONIC, SEND_TX: 'false', COUNTDOWN: '0', WORDLIST: process.env.WORDLIST || 'english' },
    encoding: 'utf8',
    timeout: 120_000,
  });
  const header = `$ npm run l${slug.slice(0, 2)}   # 데모 니모닉, SEND_TX=false, ${today} 실행 (exit ${r.status})\n\n`;
  fs.writeFileSync(path.join(lessonsDir, slug, 'expected-output.txt'), header + (r.stdout || '') + (r.stderr ? '\n[stderr]\n' + r.stderr : ''));
  console.log(`${r.status === 0 ? '✅' : '❌'} ${slug} → expected-output.txt`);
}
