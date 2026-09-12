// lib/print.js — 화면 출력 도우미 (비밀값 마스킹, 단계 표시, BigInt 안전 JSON)

function mask(secret, visible = 4) {
  const s = String(secret ?? '');
  if (process.env.SHOW_SECRETS === 'true') return s;
  if (s.length <= visible * 2) return '*'.repeat(s.length);
  return `${s.slice(0, visible)}…${s.slice(-visible)} (SHOW_SECRETS=true 로 전체 표시)`;
}

function maskMnemonic(mnemonic) {
  if (process.env.SHOW_SECRETS === 'true') return mnemonic;
  const words = String(mnemonic).trim().split(/\s+/);
  return `${words[0]} ${words[1]} … ${words[words.length - 1]} (${words.length}단어, SHOW_SECRETS=true 로 전체 표시)`;
}

let stepNo = 0;
function step(title) {
  stepNo += 1;
  console.log(`\n[${stepNo}] ${title}`);
}
function resetSteps() {
  stepNo = 0;
}

function ok(msg) {
  console.log('  ✅', msg);
}
function warn(msg) {
  console.log('  ⚠️ ', msg);
}
function info(label, value) {
  console.log(`  ${label}:`, value);
}

function json(value, indent = 2) {
  return JSON.stringify(value, (k, v) => (typeof v === 'bigint' ? v.toString() : v), indent);
}

/** 대상별 한 줄 해설. LEVEL=kid|teen|dev|adult (기본 dev) */
function explain({ kid, teen, dev, adult }) {
  const level = process.env.LEVEL || 'dev';
  const text = { kid, teen, dev, adult }[level] ?? dev;
  if (text) console.log('  💬', text);
}

module.exports = { mask, maskMnemonic, step, resetSteps, ok, warn, info, json, explain };
