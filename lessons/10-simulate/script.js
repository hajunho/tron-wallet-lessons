// Lesson 10 — 리허설: 보내기 전에 미리 해보기 (실행: npm run l10)
// USDT(TRC-20) transfer 를 우체통에 넣기 전에 "리허설"(시뮬레이션)로 결과와 비용을 미리 본다.
//  1) triggerConstantContract 소액 리허설 → result / energy_used / constant_result
//  2) 잔고 초과 리허설 → 예외 'REVERT opcode executed' + 노드 원본 message
//  3) estimateEnergy → feeLimit = 에너지 × 가격 × 1.2   4) 점검표 7항목   5) (선택) BTTC estimateGas 비교
// Nile 테스트넷 읽기 전용. 아무것도 브로드캐스트하지 않는다 (SEND_TX 를 켜도 보내지 않는다).
// 환경변수: MNEMONIC(없으면 데모), TO(기본 index 1 주소), AMOUNT_USDT(기본 1), SKIP_BTTC=true, LEVEL
const { TronWeb, utils: tronUtils } = require('tronweb');
const { ethers } = require('ethers');
const { DEMO_MNEMONIC, walletFromMnemonic, describeMnemonic } = require('../../lib/wallet');
const { NILE, SUN_PER_TRX, TRC20_ABI, createTronWeb, sunToTrx, errorMessage, formatUnits, parseUnits, decodeNodeMessage } = require('../../lib/tron');
const { DONAU, createBttcProvider } = require('../../lib/bttc');
const print = require('../../lib/print');

const AMOUNT_USDT = process.env.AMOUNT_USDT ?? '1';
const USDT_DECIMALS = 6; // Nile USDT (TXYZ…) decimals = 6
const FEE_LIMIT_MARGIN = 1.2; // 예상 에너지의 20% 여유
const FUNCTION = 'transfer(address,uint256)';

/** 네트워크 호출 공통 try/catch. 실패하면 한국어 안내 후 null 반환 (429 는 "잠시 후 다시") */
async function tryNet(label, fn) {
  try {
    return await fn();
  } catch (error) {
    const msg = errorMessage(error);
    if (/429|Too Many|rate/i.test(msg)) print.warn(`${label}: 요청이 너무 많습니다(429). 잠시 후 다시 실행하세요.`);
    else if (/ENOTFOUND|ECONN|fetch failed|network|timeout/i.test(msg)) print.warn(`${label}: 네트워크 연결 실패 — ${msg}. 인터넷 연결을 확인하세요.`);
    else print.warn(`${label}: 오류 — ${msg}`);
    return null;
  }
}

function comma(n) {
  return BigInt(n).toLocaleString('en-US');
}

function fmtSun(sun) {
  return `${comma(sun)} sun (${sunToTrx(sun)} TRX)`;
}

/** transfer(address,uint256) 파라미터 */
function transferParams(to, amountRaw) {
  return [
    { type: 'address', value: to },
    { type: 'uint256', value: amountRaw.toString() },
  ];
}

/** tronweb 을 거치지 않고 노드의 /wallet/triggerconstantcontract 원본 응답을 그대로 받는다.
 *  (tronweb 6.5.0 으로 동작 확인. 요청 본문 필드 이름은 노드 HTTP API 규격 — 확인 필요) */
async function rawSimulate(from, to, amountRaw) {
  const parameter = tronUtils.abi.encodeParams(['address', 'uint256'], [to, amountRaw.toString()]).replace(/^0x/, '');
  const res = await fetch(`${NILE.fullHost}/wallet/triggerconstantcontract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ owner_address: from, contract_address: NILE.usdt, function_selector: FUNCTION, parameter, visible: true }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function checkRow(okFlag, label, detail) {
  console.log(`  ${okFlag === null ? '❓' : okFlag ? '✅' : '❌'} ${label.padEnd(22)} ${detail}`);
}

async function main() {
  console.log('Lesson 10 — 리허설: 보내기 전에 미리 해보기');
  console.log(`네트워크: ${NILE.name} (${NILE.fullHost}) — 읽기 전용, 아무것도 보내지 않습니다.`);

  // ---------- [1] 지갑과 리허설 대상 준비 ----------
  print.step('지갑과 리허설 대상 준비');
  let mnemonic = process.env.MNEMONIC?.trim();
  let demoMode = false;
  if (!mnemonic) {
    mnemonic = DEMO_MNEMONIC;
    demoMode = true;
    print.warn('MNEMONIC 이 없어 데모 니모닉으로 실행합니다 (데모 모드: 조회·리허설만, 전송 없음).');
  } else if (mnemonic === DEMO_MNEMONIC) {
    demoMode = true;
    print.warn('데모 니모닉(공개 값)입니다 (데모 모드: 조회·리허설만, 전송 없음).');
  }
  const me = walletFromMnemonic(mnemonic, 0);
  const other = walletFromMnemonic(mnemonic, 1); // 자기 자신에게는 못 보내므로 기본 수신자는 두 번째 주소
  const to = (process.env.TO ?? other.address).trim();
  const amountRaw = parseUnits(AMOUNT_USDT, USDT_DECIMALS);
  const tronWeb = createTronWeb();
  tronWeb.setAddress(me.address); // .call() 에도 "누가 묻는지"가 필요하다 (개인키는 등록하지 않음)
  print.info('니모닉', describeMnemonic(mnemonic) + (demoMode ? ' ← 데모' : ''));
  print.info('보내는 사람(from)', me.address);
  print.info('받는 사람(to)', to);
  print.info('사탕통(USDT 컨트랙트)', NILE.usdt);
  print.info('금액', `${AMOUNT_USDT} USDT (= ${comma(amountRaw)} 최소 단위, decimals ${USDT_DECIMALS})`);
  print.info('함수', FUNCTION);
  print.explain({
    kid: '학예회 전 리허설처럼, 편지를 우체통에 넣기 전에 미리 해 봐요. 리허설은 공짜예요.',
    teen: '시뮬레이션은 노드가 트랜잭션을 "실행만 하고 장부에는 안 적는" 것입니다. 서명도 수수료도 필요 없습니다.',
    dev: 'triggerConstantContract = eth_call 에 해당. from 주소만 있으면 되고, 개인키·서명·브로드캐스트 없음.',
    adult: '지갑 앱이 보내기 버튼 앞에서 보여 주는 "예상 수수료 / 실패할 수 있습니다"가 바로 이 리허설 결과입니다.',
  });

  // ---------- [2] 소액 transfer 리허설 ----------
  print.step(`소액 transfer 리허설 — triggerConstantContract (${AMOUNT_USDT} USDT)`);
  let sim = null;
  try {
    sim = await tronWeb.transactionBuilder.triggerConstantContract(NILE.usdt, FUNCTION, {}, transferParams(to, amountRaw), me.address);
  } catch (error) {
    const msg = errorMessage(error);
    if (/REVERT/.test(msg)) print.warn(`리허설에서 REVERT 가 났습니다 (${msg}). 이 금액(${AMOUNT_USDT} USDT)은 실제로 보내면 실패합니다 → 보내지 않습니다.`);
    else if (/429|Too Many|rate/i.test(msg)) print.warn('리허설: 요청이 너무 많습니다(429). 잠시 후 다시 실행하세요.');
    else print.warn(`리허설: 오류 — ${msg}`);
  }
  let energyUsed = null;
  if (sim) {
    energyUsed = sim.energy_used ?? 0;
    print.info('result', print.json(sim.result, 0));
    print.info('energy_used', `${comma(energyUsed)} (이 호출을 실제로 실행하면 드는 에너지)`);
    const constant = sim.constant_result?.[0] ?? '';
    print.info('constant_result[0]', constant === '' ? '(빈 값)' : `${constant.slice(0, 16)}… (${constant.length / 2} bytes)`);
    if (/^0*$/.test(constant)) print.info('해석', '전부 0 → 이 컨트랙트의 transfer 는 bool 을 돌려주지 않습니다 (Tether 계열 특성). 성공 여부는 result 와 REVERT 유무로 판단합니다.');
    print.info('logs(발자국) 개수', `${sim.logs?.length ?? 0} (리허설에서도 Transfer 이벤트가 나옵니다. 장부에는 남지 않습니다)`);
    print.info('transaction.txID', `${sim.transaction?.txID ?? '(없음)'} ← 만들어졌지만 서명도 브로드캐스트도 안 했습니다`);
    print.ok('리허설 성공. 이 봉투를 실제로 보내면 성공할 가능성이 높습니다 (같은 블록 상태라면).');
  } else {
    print.warn('리허설 결과를 받지 못해 아래 단계는 예상치 없이 진행합니다.');
  }
  print.explain({
    kid: '리허설에서 안 넘어졌어요. 이 편지는 무대(장부)에 올려도 될 것 같아요.',
    teen: 'energy_used 는 "이 호출이 실제로 쓸 에너지"입니다. 결과값이 0 이어도 REVERT 가 없으면 성공입니다.',
    dev: 'constant_result 가 32바이트 0 인 것은 Tether 컨트랙트가 bool 을 안 돌려주기 때문. 성공 판단은 예외/REVERT 유무로.',
    adult: '앱의 "예상 수수료" 숫자는 이 energy_used 에 에너지 가격을 곱한 것입니다.',
  });

  // ---------- [3] 잔고 초과 transfer 리허설 → REVERT ----------
  print.step('잔고 초과 transfer 리허설 — 실패하는 봉투는 리허설에서 걸러진다');
  const usdt = tronWeb.contract(TRC20_ABI, NILE.usdt);
  const usdtBalance = await tryNet('USDT balanceOf', async () => BigInt(await usdt.balanceOf(me.address).call()));
  const tooMuch = (usdtBalance ?? 0n) + 1n; // 잔고보다 최소 단위 1 만큼 더
  print.info('내 USDT 잔고', usdtBalance === null ? '(조회 실패)' : `${formatUnits(usdtBalance, USDT_DECIMALS)} USDT (${comma(usdtBalance)} 최소 단위)`);
  print.info('리허설 금액', `${formatUnits(tooMuch, USDT_DECIMALS)} USDT (잔고 + 1 최소 단위)`);
  try {
    const r = await tronWeb.transactionBuilder.triggerConstantContract(NILE.usdt, FUNCTION, {}, transferParams(to, tooMuch), me.address);
    print.warn(`예외가 나지 않았습니다. result=${print.json(r.result, 0)} (잔고가 바뀌었거나 컨트랙트 동작이 다를 수 있음)`);
  } catch (error) {
    const msg = errorMessage(error);
    print.info('tronweb 예외', msg);
    if (/REVERT/.test(msg)) print.ok('REVERT opcode executed — 컨트랙트가 "잔고 부족"으로 되돌렸습니다. 리허설이라 아무 비용도 안 들었습니다.');
    else if (/429|Too Many|rate/i.test(msg)) print.warn('요청이 너무 많습니다(429). 잠시 후 다시 실행하세요.');
  }
  // 노드 원본 응답: tronweb 은 message 를 보고 예외를 던지지만, 노드는 result.result=true 와 함께 message 를 준다
  const raw = await tryNet('노드 원본 응답(/wallet/triggerconstantcontract)', () => rawSimulate(me.address, to, tooMuch));
  if (raw) {
    print.info('노드 원본 result', print.json(raw.result ?? {}, 0));
    print.info('노드 원본 energy_used', `${comma(raw.energy_used ?? 0)} (REVERT 까지 실행하는 데 쓴 에너지)`);
    print.info('노드 원본 constant_result', print.json(raw.constant_result ?? [], 0));
    if (raw.result?.message) print.info('message 해석', `${raw.result.message} — 노드는 "실행은 했다(result:true)"고 하면서 message 로 REVERT 를 알립니다. 진짜 성공 판단은 message 유무입니다.`);
    const decoded = decodeNodeMessage(raw.result);
    if (decoded && decoded !== raw.result?.message) print.info('message(hex 디코드)', decoded);
  }
  print.warn('이 봉투를 리허설 없이 실제로 보냈다면: REVERT 로 실패하고도 실행에 쓴 에너지·대역폭만큼 수수료가 나갑니다. 실패는 공짜가 아닙니다.');
  print.explain({
    kid: '사탕이 모자라서 리허설에서 넘어졌어요. 무대에서 넘어졌으면 우표까지 냈을 거예요.',
    teen: '실패한 트랜잭션도 장부에 "실패"로 적히고 수수료를 냅니다. 리허설은 그 수수료를 아끼는 장치입니다.',
    dev: 'tronweb 은 result.message 가 있으면 throw. 노드 원본은 { result: { result: true, message: "REVERT opcode executed" }, energy_used }. 직접 fetch 하면 message 를 그대로 볼 수 있다.',
    adult: '앱이 "이 거래는 실패할 수 있습니다"라고 하면 이 REVERT 를 미리 본 것입니다. 그래도 보내면 수수료만 잃습니다.',
  });

  // ---------- [4] estimateEnergy → feeLimit ----------
  print.step('필요 에너지 추정 (estimateEnergy) → feeLimit 계산');
  const est = await tryNet('estimateEnergy', () =>
    tronWeb.transactionBuilder.estimateEnergy(NILE.usdt, FUNCTION, {}, transferParams(to, amountRaw), me.address),
  );
  const energyRequired = est?.energy_required ?? energyUsed ?? null;
  print.info('estimateEnergy.energy_required', est ? comma(est.energy_required) : '(조회 실패)');
  if (energyUsed !== null && est) {
    print.info('리허설 energy_used 와 비교', `${comma(energyUsed)} vs ${comma(est.energy_required)} → 이번 실행에서는 estimateEnergy 가 더 큰(보수적인) 값을 냈습니다. feeLimit 은 큰 쪽으로 잡습니다.`);
  }
  const params = await tryNet('getChainParameters', () => tronWeb.trx.getChainParameters());
  const energyFee = Number(params?.find((p) => p.key === 'getEnergyFee')?.value ?? 100);
  print.info('에너지 가격(getEnergyFee)', `${energyFee} sun/energy${params ? '' : ' (조회 실패 → 기본값 100 사용)'}`);
  let feeLimitSun = null;
  if (energyRequired !== null) {
    const base = Math.max(energyRequired, energyUsed ?? 0);
    const burnSun = base * energyFee;
    feeLimitSun = Math.ceil(burnSun * FEE_LIMIT_MARGIN);
    print.info('에너지 스테이킹이 없을 때 소각', `${comma(base)} × ${energyFee} sun = ${fmtSun(burnSun)}`);
    print.info(`feeLimit = 소각 × ${FEE_LIMIT_MARGIN}`, fmtSun(feeLimitSun));
    print.info('트랜잭션에 넣는 값', `{ feeLimit: ${feeLimitSun} }  // sun 단위`);
    print.ok('feeLimit 은 "이 호출에 최대 얼마까지 태워도 되나"의 상한입니다. 너무 작으면 실패, 너무 크면 실패 시 그만큼 잃을 수 있습니다.');
  }
  print.explain({
    kid: '입장권이 몇 장 필요한지 미리 세어 봤어요. 조금 넉넉하게 준비해요.',
    teen: `feeLimit(sun) = 에너지 × ${energyFee} sun × 1.2. 1 TRX = ${comma(SUN_PER_TRX)} sun 이므로 sun 을 100만으로 나누면 TRX 입니다.`,
    dev: 'feeLimit 은 에너지 소각 상한(sun). 스테이킹 에너지가 있으면 그만큼은 소각되지 않는다. 대역폭 비용은 feeLimit 과 별개.',
    adult: '앱의 "최대 수수료" 칸이 feeLimit 입니다. 예상 수수료보다 조금 큰 것이 정상입니다.',
  });

  // ---------- [5] 보내기 전 점검표 7항목 ----------
  print.step('보내기 전 점검표 7항목');
  const [toAccount, trxBalanceSun, resources] = await Promise.all([
    tryNet('getAccount(to)', () => tronWeb.trx.getAccount(to)),
    tryNet('getBalance(from)', () => tronWeb.trx.getBalance(me.address)),
    tryNet('getAccountResources(from)', () => tronWeb.trx.getAccountResources(me.address)),
  ]);
  const okAddress = TronWeb.isAddress(to) && to !== me.address;
  checkRow(okAddress, '1. 주소 형식', `${to} → isAddress ${TronWeb.isAddress(to)}${to === me.address ? ', 자기 자신(보낼 수 없음)' : ''}`);

  const toActive = toAccount === null ? null : Object.keys(toAccount).length > 0;
  checkRow(toActive, '2. 수신자 활성화', toActive === null ? '조회 실패' : toActive ? 'getAccount(to) 에 내용 있음 (활성화됨)' : 'getAccount(to) = {} (미활성화 — 처음 받는 주소. 수신자 USDT 잔고가 0이면 에너지가 더 들 수 있음: 14,650~21,975)');

  const okTrx = trxBalanceSun === null ? null : feeLimitSun === null ? trxBalanceSun > 0 : trxBalanceSun >= feeLimitSun;
  checkRow(okTrx, '3. TRX 잔고', trxBalanceSun === null ? '조회 실패' : `${sunToTrx(trxBalanceSun)} TRX${feeLimitSun !== null ? ` (feeLimit ${sunToTrx(feeLimitSun)} TRX 이상 필요)` : ''}`);

  const okUsdt = usdtBalance === null ? null : usdtBalance >= amountRaw;
  checkRow(okUsdt, '4. USDT 잔고 ≥ 금액', usdtBalance === null ? '조회 실패' : `${formatUnits(usdtBalance, USDT_DECIMALS)} USDT ≥ ${AMOUNT_USDT} USDT`);

  let okResource = null;
  let resourceDetail = '조회 실패';
  if (resources) {
    const energyLeft = (resources.EnergyLimit ?? 0) - (resources.EnergyUsed ?? 0);
    const netLeft = (resources.freeNetLimit ?? 0) - (resources.freeNetUsed ?? 0) + (resources.NetLimit ?? 0) - (resources.NetUsed ?? 0);
    const need = energyRequired ?? 0;
    const canBurn = trxBalanceSun !== null && feeLimitSun !== null && trxBalanceSun >= feeLimitSun;
    okResource = energyLeft >= need || canBurn;
    resourceDetail = `에너지 ${comma(energyLeft)} 남음 (필요 ${comma(need)}), 대역폭 ${comma(netLeft)} 남음${energyLeft >= need ? ' → 스테이킹 에너지로 충분' : canBurn ? ' → 에너지 부족하지만 TRX 소각 가능' : ' → 에너지도 TRX 도 부족'}`;
  }
  checkRow(okResource, '5. 대역폭/에너지', resourceDetail);

  const okNetwork = /nile/i.test(NILE.fullHost);
  checkRow(okNetwork, '6. 네트워크(Nile)', `${NILE.fullHost} — 상대가 말한 나라와 글자까지 같은지 확인`);

  const okFeeLimit = feeLimitSun !== null && feeLimitSun > 0;
  checkRow(okFeeLimit, '7. feeLimit 설정', feeLimitSun !== null ? `${comma(feeLimitSun)} sun (${sunToTrx(feeLimitSun)} TRX)` : '계산하지 못함');

  const results = [okAddress, toActive, okTrx, okUsdt, okResource, okNetwork, okFeeLimit];
  const passed = results.filter((r) => r === true).length;
  const failed = results.filter((r) => r === false).length;
  const unknown = results.filter((r) => r === null).length;
  print.info('점검 결과', `✅ ${passed} / ❌ ${failed} / ❓ ${unknown} (7항목)`);
  if (failed === 0 && unknown === 0) print.ok('7항목 모두 통과. 이제 레슨 5·6 순서대로 봉투 → 도장 → (SEND_TX=true) 우체통입니다. 이 레슨은 보내지 않습니다.');
  else print.warn('❌ 또는 ❓ 가 있으면 보내지 않습니다. 규칙 10: 앱이 "실패할 것 같다"고 하면 보내지 않는다.');
  if (demoMode) print.warn('데모 주소는 권한 키가 바뀌어 있어 점검을 통과해도 실제 전송은 거부됩니다 (레슨 13에서 확인).');
  print.explain({
    kid: '주소, 사탕통, 사탕상자, 입장권, 나라 이름을 하나씩 손가락으로 짚어요. 하나라도 ❌ 면 안 보내요.',
    teen: '점검표는 리허설이 잡지 못하는 것(네트워크, feeLimit, 대역폭)까지 봅니다. 리허설 성공 = 절반의 확인입니다.',
    dev: '리허설은 "컨트랙트 실행"만 검증한다. 수신자 활성화·자원·feeLimit·네트워크는 별도 조회로 확인해야 한다.',
    adult: '앱이 자동으로 해 주는 점검이지만, "나라"와 "받는 주소"는 앱이 대신 확인해 주지 못합니다.',
  });

  // ---------- [6] (선택) 옆 나라 BTTC 의 리허설 ----------
  print.step('(선택) 옆 나라 BTTC 에도 리허설이 있다 — estimateGas (레슨 11 예고)');
  if (process.env.SKIP_BTTC === 'true') {
    print.info('건너뜀', 'SKIP_BTTC=true');
  } else {
    const bttc = await tryNet('BTTC estimateGas', async () => {
      const provider = createBttcProvider();
      const gas = await provider.estimateGas({ from: me.evmAddress, to: other.evmAddress, value: 0n });
      const { gasPrice } = await provider.getFeeData();
      return { gas, gasPrice };
    });
    if (bttc) {
      const cost = bttc.gasPrice ? ethers.formatEther(bttc.gas * bttc.gasPrice) : '?';
      print.info(`${DONAU.name} (chainId ${DONAU.chainId})`, `estimateGas ${bttc.gas.toString()} gas × gasPrice ${bttc.gasPrice?.toString() ?? '?'} wei ≈ ${cost} ${DONAU.symbol} (단순 전송, 테스트넷 값)`);
      print.info('비교', `트론은 에너지(${energyRequired !== null ? comma(energyRequired) : '?'}) × sun 가격, BTTC 는 gas(${bttc.gas}) × gasPrice. 이름은 달라도 "리허설로 비용을 먼저 본다"는 같습니다.`);
    }
  }
  print.info('API 대응', 'eth_estimateGas ↔ estimateEnergy, eth_call ↔ triggerConstantContract. 레슨 11에서 같은 키로 BTTC 를 직접 다룹니다.');
  print.ok('규칙 10: 앱이 "실패할 것 같다"고 하면 보내지 않는다.');

  console.log('\n➡️  다음: Lesson 11 한 열쇠, 두 나라, 두 경로 — 같은 열쇠로 옆 나라 BTTC 우편함을 열고, 나라 이름을 글자까지 맞춥니다.');
}

main().catch((error) => {
  console.error('lesson10 실패:', errorMessage(error));
  process.exitCode = 1;
});
