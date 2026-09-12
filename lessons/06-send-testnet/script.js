// Lesson 06 — 진짜로 보내기(연습 나라에서) (실행: npm run l06)
// 하는 일: 내 계정(잔고·활성화·무료 대역폭)과 수신자를 확인하고, TRX 전송 트랜잭션을
//          빌드·서명해 미리보기 표를 보여 준 뒤, guard(assertCanSend)를 통과했을 때만
//          Nile 테스트넷에 브로드캐스트하고 최대 30초 동안 영수증(getTransactionInfo)을 기다린다.
// 환경변수: MNEMONIC(필수, 없으면 안내 후 exit 1) · TO(기본 같은 니모닉의 index 1 주소)
//          AMOUNT_TRX(기본 1) · SEND_TX(기본 false = 미리보기) · COUNTDOWN(기본 3초)
// 기본은 미리보기. 실제 전송은 SEND_TX=true 를 명시하고 .env 의 연습용 니모닉일 때만 일어난다.

const fs = require('node:fs');
const path = require('node:path');
const { TronWeb } = require('tronweb');
const { DEMO_MNEMONIC, loadMnemonic, walletFromMnemonic, describeMnemonic } = require('../../lib/wallet');
const {
  NILE,
  createTronWeb,
  isSendEnabled,
  sunToTrx,
  trxToSun,
  explorerTx,
  explorerAddress,
  decodeNodeMessage,
  errorMessage,
} = require('../../lib/tron');
const { assertCanSend, GuardError } = require('../../lib/guard');
const print = require('../../lib/print');

const LAST_TX_FILE = path.join(__dirname, '..', '..', '.last-tx.json'); // 레슨 7이 읽는 파일
const ACTIVATION_FEE_SUN = 1_000_000; // getCreateNewAccountFeeInSystemContract (새 계정 활성화 1 TRX)
const BANDWIDTH_PRICE_SUN = 1000; // sun/byte (무료 대역폭이 없을 때 소각 단가)
const EST_TX_BYTES = 266; // 단순 TRX 전송 1건의 대략적인 크기(실제는 receipt 의 net_usage/net_fee 로 확인)
const POLL_MAX_MS = 30_000;
const POLL_INTERVAL_MS = 3_000;

/** 네트워크 오류를 한국어로 안내한다 (429 는 "잠시 후 다시") */
function networkHint(error) {
  const msg = errorMessage(error);
  if (/429|Too Many|rate limit/i.test(msg)) {
    return `요청이 너무 많습니다(429). 잠시 후 다시 실행하세요. (원문: ${msg})`;
  }
  if (/ENOTFOUND|ECONNREFUSED|fetch failed|network|timeout/i.test(msg)) {
    return `Nile 노드(${NILE.fullHost})에 연결하지 못했습니다. 인터넷 연결을 확인하세요. (원문: ${msg})`;
  }
  return msg;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function humanTime(ms) {
  return new Date(Number(ms)).toISOString();
}

async function main() {
  // 0. 니모닉 — 이 레슨은 실제 전송 레슨이라 데모 자동 대체를 하지 않는다.
  let mnemonic;
  try {
    mnemonic = loadMnemonic();
  } catch (error) {
    console.log('❌', errorMessage(error));
    console.log('   이 레슨은 "내 연습용 지갑"으로 보내는 연습이라 MNEMONIC 이 꼭 필요합니다.');
    console.log('   1) cp .env.example .env   2) npm run new-wallet   3) faucet 에서 테스트 TRX 받기:', NILE.faucet);
    process.exitCode = 1;
    return;
  }
  const isDemo = mnemonic.trim() === DEMO_MNEMONIC;

  const me = walletFromMnemonic(mnemonic, 0);
  const to = (process.env.TO || walletFromMnemonic(mnemonic, 1).address).trim();
  const amountTrx = process.env.AMOUNT_TRX || '1';
  const amountSun = trxToSun(amountTrx);

  console.log(`Lesson 06 — 진짜로 보내기(연습 나라에서) · ${NILE.name}`);
  console.log(`  니모닉: ${describeMnemonic(mnemonic)}${isDemo ? ' ← 데모 니모닉(공개 값): 미리보기까지만 가능' : ''}`);
  console.log(`  보내는 사람: ${me.address}`);
  console.log(`  받는 사람:   ${to}`);
  console.log(`  금액:        ${amountTrx} TRX (= ${amountSun} sun)`);
  console.log(`  SEND_TX:     ${isSendEnabled() ? 'true (실제 전송 모드!)' : 'false (미리보기 모드, 기본값)'}`);

  if (!TronWeb.isAddress(to)) {
    console.log(`❌ 받는 주소가 올바르지 않습니다: ${to}`);
    process.exitCode = 1;
    return;
  }
  if (!Number.isFinite(amountSun) || amountSun <= 0) {
    console.log(`❌ AMOUNT_TRX 가 올바르지 않습니다: ${amountTrx}`);
    process.exitCode = 1;
    return;
  }
  if (isDemo) {
    print.warn('데모 주소(TUEZ…)는 owner/active 권한 키가 다른 키로 바뀌어 있어 개인키가 있어도 실제 전송이 거부됩니다.');
    print.warn('guard 도 데모 니모닉 전송을 막습니다. 4단계 "미리보기 종료"까지만 진행합니다.');
  }

  const tronWeb = createTronWeb(me.privateKey);

  // 1. 내 계정 상태
  print.step('내 계정 확인 — 활성화 · 잔고 · 무료 대역폭');
  let balanceSun;
  let freeNetLeft;
  try {
    const [account, balance, resources] = await Promise.all([
      tronWeb.trx.getAccount(me.address),
      tronWeb.trx.getBalance(me.address),
      tronWeb.trx.getAccountResources(me.address),
    ]);
    const activated = Object.keys(account).length > 0;
    balanceSun = Number(balance);
    const freeNetLimit = resources.freeNetLimit ?? 0;
    const freeNetUsed = resources.freeNetUsed ?? 0;
    freeNetLeft = freeNetLimit - freeNetUsed;
    print.info('활성화', activated ? `예 (create_time ${humanTime(account.create_time)})` : '아니오 (한 번도 TRX 를 받은 적 없음)');
    print.info('TRX 잔고', `${sunToTrx(balanceSun)} TRX (${balanceSun} sun)`);
    print.info('무료 대역폭', `${freeNetLeft} / ${freeNetLimit} bytes 남음 (오늘 사용 ${freeNetUsed})`);
    print.info('스테이킹 대역폭/에너지', `NetLimit ${resources.NetLimit ?? 0}, EnergyLimit ${resources.EnergyLimit ?? 0}`);

    if (!activated || balanceSun === 0) {
      console.log(`❌ 계정이 비어 있습니다. faucet 에서 테스트 TRX 를 받은 뒤 다시 실행하세요: ${NILE.faucet}`);
      console.log(`   탐색기에서 확인: ${explorerAddress(me.address)}`);
      process.exitCode = 1;
      return;
    }
    // 필요한 최대 금액 = 보낼 금액 + 활성화비(수신자가 새 계정일 때) + 대역폭 소각(무료 대역폭이 없을 때)
    const needSun = amountSun + ACTIVATION_FEE_SUN + EST_TX_BYTES * BANDWIDTH_PRICE_SUN;
    if (balanceSun < needSun) {
      console.log(`❌ 잔고가 부족합니다. 최대 ${sunToTrx(needSun)} TRX 가 필요할 수 있습니다(금액 + 활성화 1 TRX + 대역폭 ≈ 0.266 TRX).`);
      console.log(`   faucet: ${NILE.faucet}`);
      process.exitCode = 1;
      return;
    }
    print.ok(`보낼 수 있습니다 (잔고 ${sunToTrx(balanceSun)} TRX ≥ 필요 최대 ${sunToTrx(needSun)} TRX)`);
    if (freeNetLeft < EST_TX_BYTES) {
      print.warn(`무료 대역폭이 ${freeNetLeft} bytes 뿐이라 약 ${sunToTrx(EST_TX_BYTES * BANDWIDTH_PRICE_SUN)} TRX 가 소각될 수 있습니다.`);
    }
  } catch (error) {
    console.log('❌ 내 계정 조회 실패:', networkHint(error));
    process.exitCode = 1;
    return;
  }
  print.explain({
    kid: '보내기 전에 내 보물상자에 사탕이 있는지, 종이 입장권이 남았는지 먼저 봐요.',
    teen: '잔고는 지갑 앱이 아니라 노드(getBalance)에서 읽습니다. 무료 대역폭은 하루 600 bytes 입니다.',
    dev: 'getAccount 가 {} 이면 미활성화. getAccountResources 의 사용량 필드는 0 이면 생략되므로 ?? 0 처리.',
    adult: '앱의 "보내기" 버튼을 누르기 전, 잔고와 수수료 여유를 먼저 확인하는 단계입니다.',
  });

  // 2. 수신자 상태
  print.step('받는 사람 확인 — 활성화 여부');
  try {
    const toAccount = await tronWeb.trx.getAccount(to);
    const toActivated = Object.keys(toAccount).length > 0;
    print.info('받는 주소', to);
    print.info('활성화', toActivated ? `예 (잔고 ${sunToTrx(toAccount.balance ?? 0)} TRX)` : '아니오');
    if (!toActivated) {
      print.warn(`처음 TRX 를 받는 주소입니다. 활성화비 ${sunToTrx(ACTIVATION_FEE_SUN)} TRX 가 추가로 듭니다 (getCreateNewAccountFeeInSystemContract).`);
    } else {
      print.ok('이미 활성화된 계정이라 활성화비가 들지 않습니다.');
    }
    print.info('탐색기', explorerAddress(to));
  } catch (error) {
    console.log('❌ 받는 사람 조회 실패:', networkHint(error));
    process.exitCode = 1;
    return;
  }

  // 3. 빌드 → 서명 → 미리보기
  print.step('봉투 만들기 → 도장 찍기 → 미리보기 (레슨 5 요약)');
  let signedTx;
  try {
    const tx = await tronWeb.transactionBuilder.sendTrx(to, amountSun, me.address);
    const value = tx.raw_data.contract[0].parameter.value;
    const beforeSign = JSON.parse(JSON.stringify(tx));
    signedTx = await tronWeb.trx.sign(tx, me.privateKey);
    const expiresIn = Math.round((tx.raw_data.expiration - tx.raw_data.timestamp) / 1000);
    console.log('  ┌ 미리보기 ───────────────────────────────────────────────');
    console.log(`  │ 네트워크    ${NILE.name} (${NILE.fullHost})`);
    console.log(`  │ 종류        ${tx.raw_data.contract[0].type}`);
    console.log(`  │ 보내는 사람 ${TronWeb.address.fromHex(value.owner_address)}`);
    console.log(`  │ 받는 사람   ${TronWeb.address.fromHex(value.to_address)}`);
    console.log(`  │ 금액        ${sunToTrx(value.amount)} TRX (${value.amount} sun)`);
    console.log(`  │ 유효기간    ${expiresIn}초 (expiration ${humanTime(tx.raw_data.expiration)})`);
    console.log(`  │ 참조 블록   ref_block_bytes ${tx.raw_data.ref_block_bytes}, ref_block_hash ${tx.raw_data.ref_block_hash}`);
    console.log(`  │ raw_data    ${tx.raw_data_hex.length / 2} bytes`);
    console.log(`  │ txID        ${tx.txID}`);
    console.log(`  │ 서명        ${signedTx.signature.length}개, ${signedTx.signature[0].length / 2} bytes`);
    console.log('  └────────────────────────────────────────────────────────');
    print.info('txID 변화', beforeSign.txID === signedTx.txID ? '서명 전후 같음 (txID 는 raw_data 의 sha256)' : '다름(!)');
    print.info('예상 수수료', `무료 대역폭이 있으면 0 TRX, 없으면 약 ${sunToTrx(EST_TX_BYTES * BANDWIDTH_PRICE_SUN)} TRX (정확한 값은 receipt 의 net_usage/net_fee)`);
  } catch (error) {
    console.log('❌ 트랜잭션 빌드/서명 실패:', networkHint(error));
    process.exitCode = 1;
    return;
  }
  print.explain({
    kid: '봉투에 받는 사람과 사탕 수, 유효기간을 쓰고 도장을 찍었어요. 아직 우체통엔 안 넣었어요.',
    teen: '유효기간이 60초라서, 도장을 찍고 오래 두면 우체통(노드)이 받지 않습니다.',
    dev: 'sign 은 입력 객체를 제자리에서 수정한다. 브로드캐스트는 expiration 안에 해야 한다.',
    adult: '앱의 "확인" 화면이 이 표입니다. 받는 사람·금액·네트워크·수수료를 끝까지 읽으세요.',
  });

  // 4. 관문(guard)
  print.step('관문 통과 확인 — assertCanSend');
  try {
    await assertCanSend({ mnemonic, what: 'TRX 전송' });
    print.ok('관문 통과. 이제 되돌릴 수 없는 단계로 들어갑니다.');
  } catch (error) {
    if (error instanceof GuardError) {
      print.warn(error.message);
      console.log('\n🛑 미리보기 종료 — 아무것도 보내지 않았습니다. 장부에는 아무 흔적도 남지 않습니다.');
      console.log('   실제로 보내려면(연습용 니모닉 + Nile 만): SEND_TX=true npm run l06');
      print.explain({
        kid: '우체통 앞에서 한 번 더 멈췄어요. 넣으면 못 꺼내니까요.',
        teen: '미리보기(SEND_TX=false)가 기본값입니다. 실제 전송은 명시적으로 켜야 합니다.',
        dev: 'GuardError 는 정상 흐름이다. exit 0 으로 끝난다.',
        adult: '보내기 직전 "정말 보낼까요?" 화면에서 멈춘 것과 같습니다.',
      });
      console.log('\n➡️ 다음: Lesson 07 영수증과 발자국 — txID 로 receipt 를 읽습니다.');
      return;
    }
    throw error;
  }

  // 5. 브로드캐스트 (여기부터는 되돌릴 수 없다)
  print.step('우체통에 넣기 — sendRawTransaction');
  let txid;
  try {
    const result = await tronWeb.trx.sendRawTransaction(signedTx);
    if (result.result === true) {
      txid = result.txid;
      print.ok(`브로드캐스트 성공. txid ${txid}`);
      print.info('탐색기', explorerTx(txid));
      const record = { txid, sentAt: new Date().toISOString(), from: me.address, to, amountTrx, network: NILE.name };
      fs.writeFileSync(LAST_TX_FILE, print.json(record) + '\n');
      print.info('저장', `${path.relative(process.cwd(), LAST_TX_FILE)} (레슨 7이 이 txid 를 읽습니다)`);
    } else {
      console.log('❌ 노드가 거부했습니다.');
      print.info('code', result.code);
      print.info('message', decodeNodeMessage(result) || '(없음)');
      if (/does not exist/.test(decodeNodeMessage(result))) {
        console.log(`   → 보내는 계정이 활성화되지 않았습니다. faucet: ${NILE.faucet}`);
      }
      process.exitCode = 1;
      return;
    }
  } catch (error) {
    console.log('❌ 브로드캐스트 실패:', networkHint(error));
    process.exitCode = 1;
    return;
  }
  print.explain({
    kid: '우체통에 넣었어요. 이제 지우개는 없어요.',
    teen: '노드가 result true 를 돌려주면 접수된 것입니다. 장부에 적히는 것은 그 다음 블록입니다.',
    dev: 'result 가 없고 code/message 만 오면 거부. message 는 hex → decodeNodeMessage.',
    adult: '"보냈다"는 말 대신 txid 를 남기세요. 이 값이 영수증 번호입니다.',
  });

  // 6. 영수증 폴링 (최대 30초)
  print.step('영수증 기다리기 — getTransactionInfo (최대 30초)');
  const started = Date.now();
  let info = {};
  while (Date.now() - started < POLL_MAX_MS) {
    try {
      info = await tronWeb.trx.getTransactionInfo(txid);
    } catch (error) {
      print.warn(`조회 오류, 다시 시도: ${networkHint(error)}`);
    }
    if (info && info.blockNumber) break;
    process.stdout.write('  … 아직 장부에 안 적혔어요 (3초 뒤 다시)\n');
    await sleep(POLL_INTERVAL_MS);
  }
  if (info && info.blockNumber) {
    const receipt = info.receipt ?? {};
    print.ok(`블록 ${info.blockNumber} 에 기록됨 (${humanTime(info.blockTimeStamp)})`);
    print.info('수수료', `${sunToTrx(info.fee ?? 0)} TRX (${info.fee ?? 0} sun)`);
    print.info('receipt', print.json(receipt, 0));
    if (receipt.net_usage !== undefined) print.info('대역폭', `무료 대역폭 ${receipt.net_usage} bytes 사용 (소각 없음)`);
    if (receipt.net_fee !== undefined) print.info('대역폭', `${receipt.net_fee} sun 소각 (= ${receipt.net_fee / BANDWIDTH_PRICE_SUN} bytes)`);
    print.info('탐색기', explorerTx(txid));
  } else {
    print.warn('30초 안에 receipt 가 나오지 않았습니다. 잠시 후 레슨 7에서 같은 txid 로 다시 확인하세요.');
    print.info('탐색기', explorerTx(txid));
  }
  print.explain({
    kid: '영수증이 나왔어요. 몇 번째 장에 적혔는지, 우표는 얼마였는지 적혀 있어요.',
    teen: 'receipt 의 net_usage 는 무료 대역폭 사용, net_fee 는 TRX 소각을 뜻합니다.',
    dev: '방금 들어간 tx 의 getTransactionInfo 는 {} 일 수 있다. blockNumber 가 생길 때까지 폴링.',
    adult: '영수증(receipt)을 읽는 법은 다음 레슨에서 자세히 다룹니다.',
  });

  console.log('\n➡️ 다음: Lesson 07 영수증과 발자국 — 이 txid 로 receipt 와 이벤트를 읽습니다.');
}

main().catch((error) => {
  console.error('lesson06 실패:', errorMessage(error));
  process.exitCode = 1;
});
