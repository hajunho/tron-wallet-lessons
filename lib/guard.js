// lib/guard.js — 실제 브로드캐스트 직전에 반드시 거치는 단일 관문
// 통과 조건: SEND_TX=true 명시, 데모 니모닉 아님, 메인넷 아님, 무제한 approve 아님
const { DEMO_MNEMONIC } = require('./wallet');
const { NILE } = require('./tron');

const MAINNET_HOSTS = ['api.trongrid.io', 'rpc.bittorrentchain.io'];
const UNLIMITED = (1n << 256n) - 1n;

class GuardError extends Error {}

/**
 * @param {object} opts
 * @param {string} opts.mnemonic   사용 중인 니모닉
 * @param {string} [opts.host]     연결 host (기본 NILE.fullHost)
 * @param {bigint|string|number} [opts.approveAmount]  approve 금액이면 무제한 검사
 * @param {string} [opts.what]     로그용 설명
 */
async function assertCanSend({ mnemonic, host = NILE.fullHost, approveAmount, what = '트랜잭션' }) {
  if (process.env.SEND_TX !== 'true') {
    throw new GuardError(`SEND_TX=false (기본값) 이므로 ${what}을(를) 보내지 않습니다. 실제로 보내려면 SEND_TX=true 를 앞에 붙이세요.`);
  }
  if (mnemonic && mnemonic.trim() === DEMO_MNEMONIC) {
    throw new GuardError('데모 니모닉(abandon … about)으로는 전송할 수 없습니다. npm run new-wallet 로 만든 연습용 니모닉을 .env 에 넣으세요.');
  }
  if (MAINNET_HOSTS.some((h) => String(host).includes(h))) {
    throw new GuardError(`메인넷 주소(${host})로는 이 학습 저장소에서 전송하지 않습니다. 테스트넷만 사용하세요.`);
  }
  if (approveAmount !== undefined && BigInt(approveAmount) >= UNLIMITED / 2n) {
    throw new GuardError('무제한(또는 사실상 무제한) approve 는 이 저장소에서 막습니다. 필요한 만큼만 approve 하세요.');
  }
  const seconds = Number(process.env.COUNTDOWN ?? 3);
  if (seconds > 0) {
    process.stdout.write(`⚠️  ${seconds}초 뒤 ${what}을(를) 실제로 보냅니다. 멈추려면 Ctrl+C `);
    for (let i = seconds; i > 0; i -= 1) {
      process.stdout.write(`${i} `);
      await new Promise((r) => setTimeout(r, 1000));
    }
    process.stdout.write('\n');
  }
}

module.exports = { assertCanSend, GuardError, UNLIMITED };
