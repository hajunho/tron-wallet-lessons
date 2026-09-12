// Lesson 04 — 연료: 대역폭 입장권과 에너지 입장권 (실행: npm run l04)
// 트론은 gas 대신 "자원"을 쓴다. 이 스크립트는 Nile 테스트넷을 읽기만 하며(전송 없음)
//  ① 내 계정의 대역폭/에너지 한도와 사용량, ② 체인의 자원 가격과 가격 변경 이력,
//  ③ TRX 전송 1건의 바이트 수 → 소각 TRX, ④ USDT 전송에 필요한 에너지 → 소각 TRX,
//  ⑤ "TRX 0 + USDT 100" 시나리오 계산표, ⑥ 새 계정 활성화 비용을 보여 준다.
// 환경변수: ADDRESS(조회할 T주소) 또는 MNEMONIC(index 0 주소 사용). 둘 다 없으면 데모 니모닉으로 자동 대체.
const { TronWeb } = require('tronweb');
const { DEMO_MNEMONIC, walletFromMnemonic } = require('../../lib/wallet');
const { NILE, SUN_PER_TRX, createTronWeb, sunToTrx, errorMessage, explorerAddress } = require('../../lib/tron');
const print = require('../../lib/print');

const SIGNATURE_BYTES = 65; // 서명 1개 = 65 bytes (r 32 + s 32 + v 1)
// 실제 체인 receipt 에서 직접 관찰된 값은 net_fee: 266000 sun 뿐이다.
// 266 bytes 는 266000 sun ÷ 1000 sun/byte 로 역산한 값. 무료 대역폭을 쓴 경우
// net_usage 에 바이트가 적히는지는 확인되지 않았다(확인 필요).
const OBSERVED_TRANSFER_BYTES = 266;

/** "ts:price,ts:price,…" 문자열 → [{ at: Date, price }] */
function parsePriceHistory(text) {
  return String(text)
    .split(',')
    .filter(Boolean)
    .map((pair) => {
      const [ts, price] = pair.split(':');
      return { at: Number(ts), price: Number(price) };
    });
}

function fmtDate(ms) {
  return ms === 0 ? '체인 시작(0)' : new Date(ms).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
}

function fmtSun(sun) {
  return `${Number(sun).toLocaleString('en-US')} sun (${sunToTrx(sun)} TRX)`;
}

/** 네트워크 호출 공통 try/catch. 실패하면 한국어 안내 후 null 반환 */
async function tryNet(label, fn) {
  try {
    return await fn();
  } catch (error) {
    const msg = errorMessage(error);
    if (/429|Too Many|rate/i.test(msg)) print.warn(`${label}: 요청이 너무 많습니다(429). 잠시 후 다시 실행하세요.`);
    else print.warn(`${label}: 네트워크 오류 — ${msg}`);
    return null;
  }
}

async function main() {
  console.log('Lesson 04 — 연료: 대역폭 입장권과 에너지 입장권');
  console.log(`네트워크: ${NILE.name} (${NILE.fullHost}) — 읽기 전용, 아무것도 보내지 않습니다.`);

  // ── 조회할 주소 정하기 ──────────────────────────────────────────────
  let mnemonic = process.env.MNEMONIC?.trim();
  let demoMode = false;
  if (!mnemonic) {
    mnemonic = DEMO_MNEMONIC;
    demoMode = true;
  } else if (mnemonic === DEMO_MNEMONIC) {
    demoMode = true;
  }
  const me = walletFromMnemonic(mnemonic, 0);
  const other = walletFromMnemonic(mnemonic, 1); // 같은 12단어의 두 번째 우편함 (자기 자신에게는 보낼 수 없어서)
  const address = process.env.ADDRESS?.trim() || me.address;
  if (!TronWeb.isAddress(address)) throw new Error(`ADDRESS 형식이 잘못되었습니다: ${address}`);
  const recipient = other.address === address ? me.address : other.address;

  if (demoMode) print.warn(`데모 모드: MNEMONIC 이 없거나 데모 니모닉이어서, 데모 니모닉(${print.maskMnemonic(DEMO_MNEMONIC)})의 주소를 조회합니다.`);
  print.info('조회 주소', address);
  print.info('탐색기', explorerAddress(address));

  const tronWeb = createTronWeb();

  // ── [1] 내 입장권 지갑: 대역폭/에너지 ──────────────────────────────
  print.step('내 계정의 자원(대역폭·에너지) 한도와 사용량 — getAccountResources');
  const res = await tryNet('getAccountResources', () => tronWeb.trx.getAccountResources(address));
  let freeNetLeft = 0;
  let stakedNetLeft = 0;
  let energyLeft = 0;
  if (res) {
    const freeNetLimit = res.freeNetLimit ?? 0;
    const freeNetUsed = res.freeNetUsed ?? 0;
    const netLimit = res.NetLimit ?? 0;
    const netUsed = res.NetUsed ?? 0;
    const energyLimit = res.EnergyLimit ?? 0;
    const energyUsed = res.EnergyUsed ?? 0;
    freeNetLeft = freeNetLimit - freeNetUsed;
    stakedNetLeft = netLimit - netUsed;
    energyLeft = energyLimit - energyUsed;
    print.info('무료 대역폭(종이 입장권)', `${freeNetUsed} / ${freeNetLimit} 사용 → 남은 ${freeNetLeft} bytes (매일 새로 채워짐)`);
    print.info('스테이킹 대역폭', `${netUsed} / ${netLimit} 사용 → 남은 ${stakedNetLeft} bytes`);
    print.info('에너지(기계 입장권)', `${energyUsed} / ${energyLimit} 사용 → 남은 ${energyLeft} (무료 없음)`);
    print.info('네트워크 전체 한도', `대역폭 ${Number(res.TotalNetLimit ?? 0).toLocaleString('en-US')} / 에너지 ${Number(res.TotalEnergyLimit ?? 0).toLocaleString('en-US')}`);
    print.info('tronPowerLimit(투표권)', res.tronPowerLimit ?? 0);
    if (energyLimit === 0) print.warn('에너지 한도가 0 입니다. 이 계정은 컨트랙트를 부를 때마다 TRX 를 태워서(소각) 에너지를 대신합니다.');
    else print.ok('스테이킹으로 얻은 에너지가 있습니다.');
    print.explain({
      kid: '종이 입장권은 매일 600장 공짜예요. 기계 입장권은 공짜가 없어요.',
      teen: '사용량이 0이면 노드가 필드를 아예 빼고 응답합니다. 그래서 코드에 ?? 0 이 붙어 있습니다.',
      dev: 'freeNetLimit=600 은 계정마다 매일 리셋. EnergyLimit 은 스테이킹(freezeBalanceV2)으로만 생긴다. 사용량 0 → 필드 생략 → ?? 0.',
      adult: '지갑 앱의 "대역폭/에너지" 게이지가 바로 이 숫자입니다. 에너지 0 은 고장이 아니라 기본값입니다.',
    });
  }

  // ── [2] 가격표 ──────────────────────────────────────────────────────
  print.step('체인 가격표 — getChainParameters + 가격 변경 이력');
  const params = await tryNet('getChainParameters', () => tronWeb.trx.getChainParameters());
  const price = {};
  if (params) {
    const wanted = {
      getTransactionFee: '대역폭 1 byte 가격',
      getEnergyFee: '에너지 1 단위 가격',
      getCreateNewAccountFeeInSystemContract: '새 계정 활성화(시스템 컨트랙트)',
      getCreateAccountFee: '새 계정 생성 수수료',
      getMemoFee: '메모(data) 붙이기',
      getTotalEnergyLimit: '네트워크 전체 에너지 한도',
    };
    for (const p of params) {
      if (wanted[p.key] !== undefined) {
        price[p.key] = Number(p.value ?? 0);
        const isEnergyLimit = p.key === 'getTotalEnergyLimit';
        print.info(`${p.key} (${wanted[p.key]})`, isEnergyLimit ? Number(p.value).toLocaleString('en-US') + ' energy' : fmtSun(p.value));
      }
    }
  }
  const bwPrice = price.getTransactionFee ?? 1000;
  const energyPrice = price.getEnergyFee ?? 100;
  const bwHistory = await tryNet('getBandwidthPrices', () => tronWeb.trx.getBandwidthPrices());
  const enHistory = await tryNet('getEnergyPrices', () => tronWeb.trx.getEnergyPrices());
  if (bwHistory) {
    const h = parsePriceHistory(bwHistory);
    const last = h[h.length - 1];
    print.info('대역폭 가격 이력', `${h.length - 1}번 변경(초기값 ${h[0].price} sun 포함 ${h.length}항목), 현재 ${last.price} sun/byte (마지막 변경 ${fmtDate(last.at)})`);
  }
  if (enHistory) {
    const h = parsePriceHistory(enHistory);
    const last = h[h.length - 1];
    print.info('에너지 가격 이력', `${h.map((x) => x.price).join(' → ')} sun (마지막 변경 ${fmtDate(last.at)})`);
    print.info('에너지 현재 가격', `${last.price} sun/energy`);
  }
  // (해설은 핵심 단계 3~5곳만 — [2] 가격표는 출력 자체가 설명이라 explain 을 두지 않는다)

  // ── [3] 편지 한 통의 크기 → 종이 입장권 ─────────────────────────────
  print.step('TRX 전송 1건은 몇 바이트? — 로컬 빌드만(브로드캐스트 없음)');
  const built = await tryNet('sendTrx 빌드', () =>
    tronWeb.transactionBuilder.sendTrx(recipient, SUN_PER_TRX, address),
  );
  let transferBurnSun = OBSERVED_TRANSFER_BYTES * bwPrice;
  if (built) {
    const rawBytes = built.raw_data_hex.length / 2;
    const estimate = rawBytes + SIGNATURE_BYTES;
    print.info('보내는 사람 → 받는 사람', `${address} → ${recipient} (1 TRX, 서명·전송 안 함)`);
    print.info('txID', built.txID);
    print.info('raw_data_hex 크기', `${rawBytes} bytes`);
    print.info('서명 크기', `${SIGNATURE_BYTES} bytes (1개)`);
    print.info('raw_data + 서명', `${estimate} bytes`);
    print.info('실제 체인 receipt 관찰값', `net_fee 266,000 sun = ${OBSERVED_TRANSFER_BYTES} bytes × ${bwPrice} sun (protobuf 봉투 포함)`);
    print.info('무료 대역폭을 쓴 경우', 'net_usage 에 바이트가 적히는지는 확인 필요 — 정산은 내 receipt 로 확인하세요');
    print.info('무료 대역폭으로 보낼 때', `600 - ${OBSERVED_TRANSFER_BYTES} = ${600 - OBSERVED_TRANSFER_BYTES} bytes 남음, 소각 0 TRX`);
    print.info('무료 대역폭이 없을 때 소각', `${OBSERVED_TRANSFER_BYTES} bytes × ${bwPrice} sun = ${fmtSun(transferBurnSun)}`);
    print.info('하루 600 bytes 로 가능한 단순 전송', `약 ${Math.floor(600 / OBSERVED_TRANSFER_BYTES)}건`);
    print.explain({
      kid: '편지 한 통은 종이 입장권 약 266장이에요. 매일 600장이니 두 통은 공짜예요.',
      teen: '대역폭은 "건수"가 아니라 "바이트"로 셉니다. 메모를 붙이면 봉투가 커져 입장권이 더 듭니다.',
      dev: 'raw_data_hex 133B + sig 65B = 198B 는 하한. 관찰된 receipt 값은 net_fee 266000 sun(= 266B × 1000). 정산은 항상 내 receipt 로.',
      adult: 'TRX 전송은 하루 2건까지 수수료 0 이 흔합니다. 세 번째부터 약 0.27 TRX 가 빠지는 이유입니다.',
    });
  }

  // ── [4] 자판기(USDT 컨트랙트) 한 번 → 기계 입장권 ──────────────────
  print.step('USDT 전송에 필요한 에너지 — estimateEnergy (리허설, 전송 없음)');
  const oneUsdt = 1_000_000; // decimals 6
  const fresh = TronWeb.createRandom(); // USDT 잔고가 없고 활성화도 안 된 새 주소 (비교용, 실행할 때마다 다름)
  const cases = [
    { label: `USDT 를 이미 가진 주소로 (${recipient})`, to: recipient },
    { label: `USDT 가 0 인 새 주소로 (${fresh.address})`, to: fresh.address },
  ];
  let energyNeeded = null;
  for (const c of cases) {
    const est = await tryNet(`estimateEnergy → ${c.to}`, () =>
      tronWeb.transactionBuilder.estimateEnergy(
        NILE.usdt,
        'transfer(address,uint256)',
        {},
        [
          { type: 'address', value: c.to },
          { type: 'uint256', value: oneUsdt },
        ],
        address,
      ),
    );
    if (est?.result?.result) {
      const e = Number(est.energy_required);
      if (energyNeeded === null) energyNeeded = e;
      print.info(c.label, `energy_required ${e.toLocaleString('en-US')} → 스테이킹 없으면 ${e} × ${energyPrice} sun = ${fmtSun(e * energyPrice)} 소각`);
    } else if (est) {
      print.warn(`${c.label}: 예측 실패 — ${JSON.stringify(est.result ?? est)}`);
    }
  }
  if (energyNeeded === null) {
    print.warn('에너지 예측을 받지 못했습니다. (조회 주소에 USDT 가 없으면 리허설이 REVERT 로 실패합니다.)');
  } else {
    print.info('에너지 잔량과 비교', `남은 에너지 ${energyLeft} → ${energyLeft >= energyNeeded ? '스테이킹 에너지로 충분' : '부족분은 TRX 소각'}`);
  }
  print.explain({
    kid: '자판기를 한 번 쓰려면 기계 입장권이 많이 필요해요. 없으면 사탕상자를 태워서 대신해요.',
    teen: '받는 사람이 USDT 를 처음 받으면(잔고 0) 장부에 새 칸을 만들어야 해서 에너지가 더 듭니다.',
    dev: 'estimateEnergy 는 노드 시뮬레이션. feeLimit 은 이 값 × 에너지 가격보다 여유 있게(레슨 10).',
    adult: 'USDT 한 번에 약 1.5~2.2 TRX(받는 사람이 이미 USDT 를 가진 경우), 처음 받는 주소면 더 큽니다 — 위 [4] 출력을 보세요. 스테이킹으로 미리 확보하면 소각이 줄어듭니다.',
  });

  // ── [5] 시나리오 계산표 ──────────────────────────────────────────────
  print.step('시나리오: "TRX 0 + USDT 100" 지갑은 무엇을 할 수 있을까?');
  const usdtBurn = energyNeeded === null ? null : energyNeeded * energyPrice;
  const rows = [
    ['잔고 조회·받기', '가능', '읽기와 받기는 입장권이 안 듭니다'],
    ['TRX 보내기', '불가능', '보낼 TRX 자체가 0'],
    ['USDT 보내기 (무료 대역폭 있음)', '불가능', `바이트는 무료 600 으로 되지만 에너지 ${energyNeeded ?? '(예측 실패)'} 을 태울 TRX 가 0`],
    ['USDT 보내기 (무료 대역폭도 없음)', '불가능', '에너지 + 대역폭 둘 다 TRX 소각 필요'],
    ['해결책', 'TRX 를 먼저 채우기', usdtBurn === null ? '필요량은 estimateEnergy 로 계산' : `최소 ${sunToTrx(usdtBurn)} TRX(에너지) + 여유분, 대역폭까지 태우면 + 약 ${sunToTrx(transferBurnSun)} TRX`],
  ];
  for (const [what, can, why] of rows) print.info(`${what} → ${can}`, why);
  print.warn('규칙 4: USDT만 있고 TRX가 0이면 아무것도 못 보낸다. 연료(입장권)가 먼저다.');
  print.explain({
    kid: '사탕통만 있고 사탕상자가 0이면 자판기가 안 움직여요.',
    teen: '토큰 잔고와 연료는 다른 장부에 있습니다. USDT 100 이 있어도 TRX 0 이면 컨트랙트 호출이 거절됩니다.',
    dev: 'USDT 는 TRC-20 컨트랙트의 상태, 연료는 계정 상태. 전송 전 점검: TRX 잔고 ≥ energy×price + bytes×price.',
    adult: '"USDT 는 있는데 전송이 안 돼요"의 정체. TRX 를 소량 넣거나 에너지를 확보한 뒤 다시 시도하세요.',
  });

  // ── [6] 새 계정 활성화 비용 ──────────────────────────────────────────
  print.step('처음 받는 주소로 보내면 활성화 비용 — getAccount 가 {} 인 계정');
  const activationSun = price.getCreateNewAccountFeeInSystemContract ?? 1_000_000;
  const freshAccount = await tryNet('getAccount(새 주소)', () => tronWeb.trx.getAccount(fresh.address));
  const knownAccount = await tryNet('getAccount(받는 주소)', () => tronWeb.trx.getAccount(recipient));
  if (freshAccount) {
    const empty = Object.keys(freshAccount).length === 0;
    print.info(`새 주소 ${fresh.address}`, empty ? 'getAccount → {} (활성화 안 됨)' : '활성화된 계정');
    if (empty) print.info('이 주소로 처음 TRX 를 보내면', `활성화 비용 ${fmtSun(activationSun)} 가 추가로 듭니다 (getCreateNewAccountFeeInSystemContract)`);
  }
  if (knownAccount) {
    const active = Object.keys(knownAccount).length > 0;
    print.info(`받는 주소 ${recipient}`, active ? '이미 활성화됨 → 활성화 비용 없음' : '활성화 안 됨 → +1 TRX');
  }
  print.info('메모를 붙이면', `${fmtSun(price.getMemoFee ?? 1_000_000)} 추가 (getMemoFee)`);
  print.explain({
    kid: '새 친구 우편함을 처음 만들 때는 사탕상자 1개가 더 들어요.',
    teen: '트론에는 "계정 활성화"가 있습니다. 한 번도 TRX 를 받은 적 없는 주소는 장부에 칸이 없습니다.',
    dev: '수신자 getAccount 가 {} 면 전송 시 1 TRX 추가 소각. 레슨 6 에서 전송 전 경고로 사용한다.',
    adult: '처음 보내는 주소에 1 TRX 가 더 빠졌다면 고장이 아니라 활성화 비용입니다.',
  });

  console.log('\n요약: 대역폭 = 바이트(매일 600 무료), 에너지 = 컨트랙트 실행(무료 없음). 부족하면 TRX 소각. 스테이킹으로 미리 확보.');
  console.log('➡️ 다음: Lesson 05 편지 쓰고 도장 찍기(아직 안 보내요)');
}

main().catch((error) => {
  console.error('lesson04 실패:', errorMessage(error));
  process.exitCode = 1;
});
