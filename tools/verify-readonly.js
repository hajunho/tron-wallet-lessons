// tools/verify-readonly.js — 읽기 전용 레슨을 데모 니모닉·미리보기 모드로 모두 실행해 깨진 곳이 없는지 확인한다.
// (SEND_TX=false 고정, 실제 전송 없음. 주 1회 CI 에서도 이 스크립트를 돌린다.)
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { DEMO_MNEMONIC } = require('../lib/wallet');

const READ_ONLY = [
  '01-secret-key', '02-key-to-address', '03-read-balance', '04-bandwidth-energy', '05-build-and-sign',
  '06-send-testnet', '07-receipt', '08-sign-message', '09-trc20-approve', '10-simulate',
  '11-bttc-same-key', '12-error-detective', '13-audit-and-graduation',
];

const only = process.argv.slice(2);
const targets = only.length ? READ_ONLY.filter((s) => only.some((o) => s.startsWith(o))) : READ_ONLY;
let failed = 0;
for (const slug of targets) {
  const script = path.join(__dirname, '..', 'lessons', slug, 'script.js');
  const started = Date.now();
  const r = spawnSync(process.execPath, [script], {
    env: { ...process.env, MNEMONIC: DEMO_MNEMONIC, SEND_TX: 'false', COUNTDOWN: '0', WORDLIST: process.env.WORDLIST || 'english' },
    encoding: 'utf8',
    timeout: 120_000,
  });
  const ms = Date.now() - started;
  const ok = r.status === 0;
  if (!ok) failed += 1;
  console.log(`${ok ? '✅' : '❌'} ${slug} (${(ms / 1000).toFixed(1)}s, exit ${r.status})`);
  if (!ok) console.log((r.stderr || r.stdout).split('\n').slice(-8).join('\n'));
}
console.log(`\n${targets.length - failed}/${targets.length} 통과`);
process.exitCode = failed ? 1 : 0;
