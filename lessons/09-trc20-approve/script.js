// Lesson 09 — 사탕통 장부와 허락증(TRC-20) (실행: npm run l09)
// TRC-20(USDT on Nile)의 approve(spender, amount) = "내 대신 amount 까지 꺼내 가도 됨" 허락증을 다룬다.
//  1) balanceOf / allowance 조회  2) ethers.Interface 로 approve calldata 만들고 되읽기(붙여넣은 hex 읽는 법)
//  3) triggerConstantContract 리허설 → energy_used  4) triggerSmartContract 미서명 빌드(feeLimit 30 TRX)
//  5) guard: 무제한 금액(2^256-1)은 assertCanSend 가 막는다  6) SEND_TX=true + 내 니모닉일 때만 approve → 확인 → approve(0)
// 기본은 미리보기(SEND_TX=false). 데모 니모닉이면 조회·리허설·빌드까지만 하고 전송 단계는 guard 가 멈춘다.
// 환경변수: MNEMONIC(없으면 데모), SPENDER(기본 같은 니모닉의 index 1 주소), AMOUNT_USDT(기본 3), SEND_TX, COUNTDOWN, LEVEL, SHOW_SECRETS
const { ethers } = require('ethers');
const { TronWeb } = require('tronweb');
const { DEMO_MNEMONIC, walletFromMnemonic } = require('../../lib/wallet');
const {
  NILE,
  TRC20_ABI,
  createTronWeb,
  sunToTrx,
  explorerTx,
  explorerAddress,
  decodeNodeMessage,
  errorMessage,
  formatUnits,
  parseUnits,
} = require('../../lib/tron');
const { assertCanSend, GuardError, UNLIMITED } = require('../../lib/guard');
const print = require('../../lib/print');

const AMOUNT_USDT = process.env.AMOUNT_USDT ?? '3';
const FEE_LIMIT_SUN = 30_000_000; // 30 TRX — 에너지 소각 상한
const ENERGY_PRICE_FALLBACK = 100; // sun/energy (체인 파라미터 getEnergyFee 로 확인, 실패 시 이 값)
const POLL_INTERVAL_MS = 3000;
const POLL_MAX_MS = 15_000; // approve 와 approve(0) 두 번 기다리므로 각 15초 (전체 60초 이내)

/** 네트워크 호출을 감싸서 실패해도 스크립트가 멈추지 않게 한다. 실패하면 null. */
async function tryCall(label, fn) {
  try {
    return await fn();
  } catch (error) {
    const msg = errorMessage(error);
    if (/429|too many/i.test(msg)) {
      print.warn(`${label}: 요청이 너무 잦아 노드가 잠시 거절했습니다(429). 잠시 후 다시 실행하세요.`);
    } else {
      print.warn(`${label} 실패: ${msg}`);
    }
    return null;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** T 주소 → 0x 주소 (ethers 인코딩용). 41 을 떼면 EVM 주소 20바이트가 남는다. */
function tronToEvm(tAddress) {
  return ethers.getAddress('0x' + TronWeb.address.toHex(tAddress).slice(2));
}

/** 32바이트 워드(64 hex)에 담긴 주소 → T 주소 */
function wordToTron(word64) {
  return TronWeb.address.fromHex('41' + word64.slice(-40));
}

/** 허락 금액을 사람 말로: 0 / 보통 / 사실상 무제한 */
function describeAllowance(raw, decimals, symbol) {
  const v = BigInt(raw);
  if (v === 0n) return `0 ${symbol} (허락 없음)`;
  if (v >= UNLIMITED / 2n) return `${formatUnits(v, decimals)} ${symbol} — ⚠️ 사실상 무제한 (2^256-1 근처)`;
  return `${formatUnits(v, decimals)} ${symbol}`;
}

/** spender 정하기: SPENDER 환경변수(T주소) > 같은 니모닉의 index 1 */
function resolveSpender(mnemonic) {
  const fromEnv = process.env.SPENDER?.trim();
  if (fromEnv) {
    if (!TronWeb.isAddress(fromEnv)) throw new Error(`SPENDER 가 트론 주소 형식이 아닙니다: ${fromEnv}`);
    return { address: fromEnv, source: 'SPENDER 환경변수' };
  }
  return { address: walletFromMnemonic(mnemonic, 1).address, source: "같은 니모닉의 index 1 (m/44'/195'/0'/0/1)" };
}

/** approve 트랜잭션을 미서명으로 빌드한다 (feeLimit 30 TRX). 브로드캐스트하지 않는다. */
async function buildApprove(tronWeb, owner, spender, amountRaw) {
  const built = await tronWeb.transactionBuilder.triggerSmartContract(
    NILE.usdt,
    'approve(address,uint256)',
    { feeLimit: FEE_LIMIT_SUN, callValue: 0 },
    [
      { type: 'address', value: spender },
      { type: 'uint256', value: amountRaw.toString() },
    ],
    owner,
  );
  if (!built?.result?.result) throw new Error(`triggerSmartContract 빌드 실패: ${JSON.stringify(built?.result ?? built)}`);
  return built.transaction;
}

/** 최대 POLL_MAX_MS 동안 receipt(getTransactionInfo)를 기다린다. */
async function waitReceipt(tronWeb, txid) {
  const started = Date.now();
  let info = {};
  while (Date.now() - started < POLL_MAX_MS) {
    info = (await tryCall('getTransactionInfo', () => tronWeb.trx.getTransactionInfo(txid))) ?? {};
    if (info.blockNumber) return info;
    console.log('  … 아직 장부에 안 적혔어요 (3초 뒤 다시)');
    await sleep(POLL_INTERVAL_MS);
  }
  return null;
}

/** 서명 → 브로드캐스트 → receipt. 반드시 assertCanSend 를 통과한 뒤에만 호출한다. */
async function signSendWait(tronWeb, tx, privateKey, label) {
  const signed = await tronWeb.trx.sign(JSON.parse(JSON.stringify(tx)), privateKey);
  const result = await tronWeb.trx.sendRawTransaction(signed);
  if (result.result !== true) {
    console.log(`  ❌ 노드가 ${label} 을(를) 거부했습니다.`);
    print.info('code', result.code);
    print.info('message', decodeNodeMessage(result) || '(없음)');
    return null;
  }
  print.ok(`${label} 브로드캐스트 성공. txid ${result.txid}`);
  print.info('탐색기', explorerTx(result.txid));
  const info = await waitReceipt(tronWeb, result.txid);
  if (info) {
    const receipt = info.receipt ?? {};
    print.info('블록', info.blockNumber);
    print.info('결과', receipt.result ?? '(receipt.result 없음)');
    print.info('수수료', `${sunToTrx(info.fee ?? 0)} TRX (에너지 ${receipt.energy_usage_total ?? 0}, energy_fee ${receipt.energy_fee ?? 0} sun, net_fee ${receipt.net_fee ?? 0} sun)`);
    print.info('발자국(log) 수', (info.log ?? []).length);
  } else {
    print.warn('15초 안에 receipt 가 나오지 않았습니다. 레슨 7(npm run l07)에서 같은 txid 로 다시 확인하세요.');
  }
  return result.txid;
}

async function main() {
  console.log('Lesson 09 — 사탕통 장부와 허락증(TRC-20): 허락(approve)은 필요한 만큼만, 다 쓰면 0으로');
  console.log(`네트워크: ${NILE.name} (${NILE.fullHost}) — 기본은 읽기·리허설·빌드까지. 전송은 SEND_TX=true 일 때만.`);

  // ---------- [1] 사탕통 장부 읽기 ----------
  print.step('사탕통 장부 읽기 — balanceOf 와 allowance(owner, spender)');
  let mnemonic = process.env.MNEMONIC?.trim();
  let demo = false;
  if (!mnemonic || mnemonic === DEMO_MNEMONIC) {
    mnemonic = DEMO_MNEMONIC;
    demo = true;
    print.warn('MNEMONIC 이 없거나 데모 니모닉입니다 → 데모 모드. 조회·리허설·빌드는 되지만 전송은 guard 가 막습니다.');
  }
  const me = walletFromMnemonic(mnemonic, 0);
  const spender = resolveSpender(mnemonic);
  const tronWeb = createTronWeb(me.privateKey); // 서명 가능하지만, 브로드캐스트는 [6]에서 guard 를 통과해야만 한다
  print.info('니모닉', print.maskMnemonic(mnemonic));
  print.info('owner (나, 사탕통 주인)', me.address);
  print.info('spender (허락받는 쪽)', `${spender.address} (${spender.source})`);
  print.info('사탕통(USDT 컨트랙트)', NILE.usdt);

  const usdt = tronWeb.contract(TRC20_ABI, NILE.usdt);
  const meta = await tryCall('USDT symbol/decimals', async () => {
    const [symbol, decimals] = await Promise.all([usdt.symbol().call(), usdt.decimals().call()]);
    return { symbol: String(symbol), decimals: Number(decimals) };
  });
  const symbol = meta?.symbol ?? 'USDT';
  const decimals = meta?.decimals ?? 6;
  const amountRaw = parseUnits(AMOUNT_USDT, decimals);
  print.info('symbol / decimals', `${symbol} / ${decimals}`);
  const balance = await tryCall('balanceOf', async () => BigInt(await usdt.balanceOf(me.address).call()));
  if (balance !== null) print.info('balanceOf(owner)', `${formatUnits(balance, decimals)} ${symbol} (최소 단위 ${balance})`);
  const allowanceBefore = await tryCall('allowance', async () => BigInt(await usdt.allowance(me.address, spender.address).call()));
  if (allowanceBefore !== null) print.info('allowance(owner, spender)', describeAllowance(allowanceBefore, decimals, symbol));
  print.info('이번에 허락하려는 금액', `${AMOUNT_USDT} ${symbol} = 최소 단위 ${amountRaw}`);
  print.ok('allowance 는 "spender 가 owner 의 사탕통에서 앞으로 꺼내 갈 수 있는 상한"입니다. 잔고와는 다른 칸입니다.');
  print.explain({
    kid: '사탕통 장부에는 내 사탕 수 칸 말고, "친구가 몇 알까지 꺼내 가도 되나" 칸이 따로 있어요.',
    teen: 'balanceOf 는 잔고, allowance 는 허락 상한입니다. 둘 다 컨트랙트 안의 표(매핑)에 적혀 있습니다.',
    dev: 'TRC-20 = ERC-20 ABI. allowance(owner, spender) → uint256. 잔고보다 큰 allowance 도 저장은 된다(리허설 triggerConstantContract 로 확인. 잔고 검사는 transferFrom 때).',
    adult: 'DEX·브릿지의 "승인(Approve)" 버튼이 이 칸을 채우는 것입니다. 승인 뒤에도 토큰은 아직 내 지갑에 있습니다.',
  });

  // ---------- [2] approve calldata 만들고 되읽기 ----------
  print.step('허락증의 글자 — ethers.Interface 로 approve calldata 만들고 되읽기');
  const iface = new ethers.Interface(TRC20_ABI);
  const spenderEvm = tronToEvm(spender.address);
  const calldata = iface.encodeFunctionData('approve', [spenderEvm, amountRaw]);
  const selector = calldata.slice(0, 10);
  const expectedSelector = ethers.id('approve(address,uint256)').slice(0, 10);
  print.info('calldata', calldata);
  print.info('길이', `${(calldata.length - 2) / 2} bytes = 선택자 4 + 주소 32 + 금액 32`);
  print.info('선택자 (앞 4바이트)', `${selector} ${selector === expectedSelector ? '= keccak256("approve(address,uint256)")[:4] MATCH' : 'MISMATCH'}`);
  const word1 = calldata.slice(10, 74);
  const word2 = calldata.slice(74, 138);
  print.info('워드 1 (spender)', `${word1} → ${wordToTron(word1)}`);
  print.info('워드 2 (amount)', `${word2} → ${BigInt('0x' + word2)} = ${formatUnits(BigInt('0x' + word2), decimals)} ${symbol}`);
  const parsed = iface.parseTransaction({ data: calldata });
  print.info('parseTransaction', `${parsed.name}(${parsed.args.map(String).join(', ')})`);
  // 붙여넣은 hex 를 읽는 연습: 무제한 허락증은 이렇게 생겼다
  const unlimitedData = iface.encodeFunctionData('approve', [spenderEvm, UNLIMITED]);
  print.info('무제한 허락증의 워드 2', `${unlimitedData.slice(74)} → 2^256-1`);
  print.warn('앱이 보여 주는 hex 가 "095ea7b3 + 주소 + ffff…" 이면 그 주소에게 내 토큰 전부를 허락하는 것입니다.');
  print.explain({
    kid: '허락증 종이에는 "누구에게"와 "몇 알까지"가 적혀 있어요. 숫자 칸이 f 로 가득하면 "전부"라는 뜻이에요.',
    teen: '함수 선택자 4바이트 + 32바이트 칸 두 개. 주소 칸의 뒤 20바이트가 spender, 금액 칸은 16진수 정수입니다.',
    dev: 'selector 095ea7b3 는 EVM 과 같다. ethers Interface.encodeFunctionData(0x 주소) 결과가 트론 data 와 동일. 디코딩은 parseTransaction.',
    adult: '서명 팝업에 hex 만 보이면, 앞 8글자 095ea7b3 는 "승인"이라는 뜻입니다. 끝이 fff… 로 가득하면 무제한입니다.',
  });

  // ---------- [3] 리허설 ----------
  print.step('리허설 — triggerConstantContract(approve) → energy_used (아무것도 보내지 않음)');
  const energyPriceRow = await tryCall('getChainParameters', async () => {
    const params = await tronWeb.trx.getChainParameters();
    return params.find((p) => p.key === 'getEnergyFee');
  });
  const energyPrice = Number(energyPriceRow?.value ?? ENERGY_PRICE_FALLBACK);
  print.info('에너지 가격 (getEnergyFee)', `${energyPrice} sun/energy${energyPriceRow ? '' : ' (조회 실패, 기본값)'}`);
  const rehearsal = await tryCall('triggerConstantContract(approve)', () =>
    tronWeb.transactionBuilder.triggerConstantContract(
      NILE.usdt,
      'approve(address,uint256)',
      {},
      [
        { type: 'address', value: spender.address },
        { type: 'uint256', value: amountRaw.toString() },
      ],
      me.address,
    ),
  );
  let energyUsed = null;
  if (rehearsal?.result?.result) {
    energyUsed = Number(rehearsal.energy_used);
    const cr = rehearsal.constant_result?.[0] ?? '';
    print.info('result', rehearsal.result.result);
    print.info('energy_used', `${energyUsed} → 스테이킹 에너지가 없으면 ${energyUsed} × ${energyPrice} sun = ${sunToTrx(energyUsed * energyPrice)} TRX 소각`);
    print.info('constant_result[0]', `${cr.slice(0, 16)}…${cr.slice(-8)} (${/^0*1$/.test(cr) ? 'true' : /^0*$/.test(cr) ? '32바이트 0 — 이 컨트랙트는 bool 을 안 돌려줍니다' : cr})`);
    print.info('feeLimit 30 TRX 와 비교', `${sunToTrx(energyUsed * energyPrice)} TRX ≤ ${sunToTrx(FEE_LIMIT_SUN)} TRX → 상한 안`);
    print.ok('리허설은 공짜입니다. 장부에는 아무것도 적히지 않았습니다.');
  } else if (rehearsal) {
    print.warn(`리허설 결과가 이상합니다: ${JSON.stringify(rehearsal.result ?? rehearsal)}`);
  }
  print.explain({
    kid: '허락증을 진짜로 쓰기 전에 리허설을 해 봤어요. 기계 입장권이 몇 장 드는지 알려 줘요.',
    teen: '허락증도 자판기(컨트랙트) 호출이라 에너지가 듭니다. 에너지 × 100 sun 이 소각될 TRX 입니다.',
    dev: 'triggerConstantContract 는 상태를 바꾸지 않는 시뮬레이션. energy_used 로 feeLimit 을 잡는다(레슨 10 에서 자세히).',
    adult: '"승인" 버튼도 수수료(TRX)가 듭니다. TRX 가 0 이면 승인조차 못 합니다(규칙 4).',
  });

  // ---------- [4] 미서명 빌드 ----------
  print.step('봉투 만들기 — triggerSmartContract 미서명 빌드 (feeLimit 30 TRX, 서명·전송 없음)');
  const tx = await tryCall('triggerSmartContract 빌드', () => buildApprove(tronWeb, me.address, spender.address, amountRaw));
  if (tx) {
    const c = tx.raw_data.contract[0];
    print.info('txID', tx.txID);
    print.info('contract.type', c.type);
    print.info('contract_address', `${c.parameter.value.contract_address} → ${TronWeb.address.fromHex(c.parameter.value.contract_address)}`);
    print.info('owner_address', `${c.parameter.value.owner_address} → ${TronWeb.address.fromHex(c.parameter.value.owner_address)}`);
    print.info('fee_limit', `${tx.raw_data.fee_limit} sun = ${sunToTrx(tx.raw_data.fee_limit)} TRX`);
    print.info('data', `${c.parameter.value.data.slice(0, 8)}… (${c.parameter.value.data.length / 2} bytes)`);
    print.info('ethers calldata 와 비교', c.parameter.value.data.toLowerCase() === calldata.slice(2).toLowerCase() ? 'MATCH (트론 data = EVM calldata)' : 'MISMATCH');
    print.info('expiration', `${new Date(tx.raw_data.expiration).toISOString()} (생성 후 60초)`);
    print.info('signature', tx.signature ? '있음(?)' : '없음 — 아직 도장을 안 찍었습니다');
    print.ok('봉투는 만들었지만 서명도 브로드캐스트도 하지 않았습니다.');
  }
  // ---------- [5] guard: 무제한 approve 차단 ----------
  print.step('관문(guard) — 무제한 허락증(2^256-1)은 이 저장소가 막습니다');
  print.info('UNLIMITED', `${UNLIMITED} (= 2^256-1)`);
  print.info('guard 의 차단 기준', 'approveAmount ≥ UNLIMITED / 2 이면 GuardError');
  print.info(`이번 금액 ${AMOUNT_USDT} ${symbol} (${amountRaw})`, amountRaw >= UNLIMITED / 2n ? '⚠️ 차단 대상' : '통과 (필요한 만큼만)');
  print.info('무제한 금액 (2^256-1)', '⚠️ 차단 대상 — SEND_TX 가 true 여도, 내 니모닉이어도 4번째 관문에서 막힙니다');
  try {
    await assertCanSend({ mnemonic, approveAmount: UNLIMITED, what: '무제한 approve' });
    print.warn('무제한 approve 가 관문을 통과했습니다(있어서는 안 되는 상황). lib/guard.js 를 확인하세요.');
  } catch (error) {
    if (!(error instanceof GuardError)) throw error;
    print.info('assertCanSend(무제한) → GuardError', error.message);
    print.info('관문 순서', 'SEND_TX → 데모 니모닉 → 메인넷 host → 무제한 금액. 앞 관문에서 먼저 멈추면 그 메시지가 나옵니다.');
  }
  print.warn('앱에서 "무제한 승인(Unlimited)"을 고르면 그 spender 는 내 사탕통을 통째로 꺼내 갈 수 있습니다. 필요한 만큼만.');
  print.ok('규칙 9: 허락(approve)은 필요한 만큼만, 다 쓰면 0으로.');
  print.explain({
    kid: '숫자 칸이 비어 있는(전부) 허락증은 안 써 줘요. 3알이면 3알이라고 적어요.',
    teen: '2^256-1 은 사실상 무한대입니다. 컨트랙트에 구멍이 생기면 allowance 만큼 빠져나가므로 상한이 곧 위험의 크기입니다.',
    dev: 'guard 는 approveAmount ≥ (2^256-1)/2 를 무제한으로 본다. 앱 UI 의 "unlimited" 도 같은 값(uint256 max)이다.',
    adult: '"무제한 승인" 대신 "이번 금액만" 을 고르고, 다 쓰면 승인을 0 으로 되돌리세요.',
  });

  // ---------- [6] 실제 approve → 확인 → approve(0) ----------
  print.step(`실제 허락증 쓰기 — approve(${AMOUNT_USDT} ${symbol}) → allowance 확인 → approve(0) (SEND_TX=true + 내 니모닉일 때만)`);
  try {
    await assertCanSend({ mnemonic, approveAmount: amountRaw, what: `USDT approve(${AMOUNT_USDT})` });
  } catch (error) {
    if (!(error instanceof GuardError)) throw error;
    print.warn(error.message);
    if (demo) print.info('참고', '데모 주소는 계정 권한 키가 남의 것으로 바뀌어 있어(레슨 3·13), 설령 보내도 노드가 거부합니다.');
    console.log('\n🛑 미리보기 종료 — 아무것도 보내지 않았습니다. allowance 는 그대로입니다.');
    console.log('   실제로 하려면(연습용 니모닉 + Nile 만): SEND_TX=true npm run l09  (approve 뒤 자동으로 approve(0) 까지 실행)');
    print.explain({
      kid: '허락증은 여기까지 연습이에요. 진짜로 쓰려면 어른과 함께 연습 나라에서만 해요.',
      teen: '미리보기가 기본입니다. 실제 approve 는 두 번의 트랜잭션(허락 → 취소)으로 끝나야 합니다.',
      dev: 'GuardError 는 정상 흐름. exit 0. SEND_TX=true 면 approve → 폴링 → allowance → approve(0) → 폴링 → allowance.',
      adult: '승인 뒤 서비스를 다 썼으면 승인을 0 으로 되돌리는 것까지가 한 세트입니다.',
    });
    console.log('\n➡️  다음: Lesson 10 리허설: 보내기 전에 미리 해보기 — triggerConstantContract 와 estimateEnergy 로 실패를 미리 봅니다.');
    return;
  }

  // 여기부터는 되돌릴 수 없다 (연습용 니모닉, Nile 에서만)
  const freshTx = await buildApprove(tronWeb, me.address, spender.address, amountRaw); // expiration 60초라 새로 빌드
  const txid1 = await signSendWait(tronWeb, freshTx, me.privateKey, `approve(${AMOUNT_USDT} ${symbol})`);
  if (!txid1) {
    process.exitCode = 1;
    return;
  }
  const allowanceMid = await tryCall('allowance(재조회)', async () => BigInt(await usdt.allowance(me.address, spender.address).call()));
  if (allowanceMid !== null) print.info('allowance(owner, spender) 재조회', describeAllowance(allowanceMid, decimals, symbol));

  print.info('취소', 'approve(0) 을 보내 허락증을 0 으로 되돌립니다.');
  await assertCanSend({ mnemonic, approveAmount: 0n, what: 'USDT approve(0)' });
  const zeroTx = await buildApprove(tronWeb, me.address, spender.address, 0n);
  const txid2 = await signSendWait(tronWeb, zeroTx, me.privateKey, 'approve(0)');
  if (!txid2) {
    print.warn('approve(0) 이 거부되었습니다. allowance 가 남아 있습니다. 잠시 후 다시 실행하거나 지갑 앱에서 승인을 취소하세요.');
    process.exitCode = 1;
    return;
  }
  const allowanceAfter = await tryCall('allowance(취소 후)', async () => BigInt(await usdt.allowance(me.address, spender.address).call()));
  if (allowanceAfter !== null) print.info('allowance(owner, spender) 취소 후', describeAllowance(allowanceAfter, decimals, symbol));
  print.info('내 주소 페이지', explorerAddress(me.address));
  print.ok('허락 → 사용(이 레슨에서는 생략) → 0 으로 되돌리기. 한 세트가 끝났습니다.');
  print.explain({
    kid: '허락증을 써 주고, 다 쓴 다음 0 으로 고쳤어요. 이제 친구는 더 못 꺼내 가요.',
    teen: 'allowance 는 저절로 줄지 않습니다. 0 으로 다시 써야 끝납니다.',
    dev: 'approve 는 덮어쓰기(0 아닌 allowance 위에 approve 리허설 성공으로 확인). 취소도 approve(spender, 0) 트랜잭션이며 에너지가 든다.',
    adult: '승인 취소도 수수료가 드는 트랜잭션입니다. TRX 를 조금 남겨 두세요.',
  });

  console.log('\n➡️  다음: Lesson 10 리허설: 보내기 전에 미리 해보기 — triggerConstantContract 와 estimateEnergy 로 실패를 미리 봅니다.');
}

main().catch((error) => {
  console.error('lesson09 실패:', errorMessage(error));
  process.exitCode = 1;
});
