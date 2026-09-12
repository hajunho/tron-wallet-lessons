// Lesson 13 — 내 지갑 점검과 졸업 (실행: npm run l13 또는 npm run audit)
// 이 스크립트는 Nile 테스트넷에서 "읽기"만 한다. 서명도, 전송도 없다. 한 달에 한 번 돌리는 점검표다.
// 하는 일: 기본 정보(잔고·활성화) → 계정 권한(열쇠 구멍 주인이 나인가) → 자원·스테이킹
//          → 토큰 잔고와 허락증(allowance) → 최근 거래 5건 → 점검 요약 + 사고 대응 순서 + 졸업 체크리스트.
// 환경변수: ADDRESS(또는 첫 번째 인자로 T주소. 없으면 MNEMONIC 의 index 0 주소, 그것도 없으면 데모 주소)
//          SPENDERS="T1,T2" (허락증을 확인할 상대. 없으면 같은 니모닉의 index 1 주소), LEVEL=kid|teen|dev|adult
const { TronWeb } = require('tronweb');
const { DEMO_MNEMONIC, walletFromMnemonic } = require('../../lib/wallet');
const {
  NILE,
  TRC20_ABI,
  createTronWeb,
  sunToTrx,
  explorerAddress,
  explorerTx,
  errorMessage,
  formatUnits,
} = require('../../lib/tron');
const { UNLIMITED } = require('../../lib/guard');
const print = require('../../lib/print');

const RULES = [
  '열쇠(12단어)는 나만 안다. 고객센터도 모른다.',
  '주소는 모두에게, 열쇠는 아무에게도.',
  '잔고는 앱이 아니라 장부(탐색기)에서 확인하고, 토큰은 이름이 아니라 컨트랙트 주소로 알아본다.',
  'USDT만 있고 TRX가 0이면 아무것도 못 보낸다. 연료(입장권)가 먼저다.',
  '도장을 찍기 전에 봉투(트랜잭션 내용)를 끝까지 읽는다.',
  '보내면 되돌릴 수 없다. 처음 보내는 곳은 소액 먼저.',
  '"보냈다"는 말 대신 txID로 영수증을 본다.',
  '무엇에 도장 찍는지 읽지 못하면 찍지 않는다.',
  '허락(approve)은 필요한 만큼만, 다 쓰면 0으로.',
  '앱이 "실패할 것 같다"고 하면 보내지 않는다.',
  '보내기 전에 나라(네트워크)를 상대와 글자까지 맞춘다.',
  '실패는 단서다. "고쳐 준다"는 사람은 사기다.',
  '한 달에 한 번 점검, 사고가 나면 순서대로, 혼자 끙끙대지 않기.',
];

/** 네트워크 호출을 감싸서 실패해도 점검이 멈추지 않게 한다. 실패하면 null. */
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

/** 밀리초 타임스탬프 → 사람이 읽는 시각(KST) */
function toKst(ms) {
  return new Date(Number(ms)).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
}

/** 숫자에 천 단위 쉼표 */
function comma(n) {
  return BigInt(n).toLocaleString('ko-KR');
}

/** 41hex → T주소 (이미 T주소면 그대로) */
function toBase58(hex) {
  if (!hex) return '(없음)';
  return String(hex).startsWith('T') ? hex : TronWeb.address.fromHex(hex);
}

/** 주소를 앞 6 + 뒤 4 로 줄여 표에 넣는다 (마스킹 아님, 주소는 공개값) */
function short(addr) {
  const s = String(addr);
  return s.length > 14 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s;
}

/**
 * 주소를 T주소로 정규화한다. T주소는 그대로, `41`+40hex 는 T주소로 바꾼다. 형식이 아니면 null.
 * TronWeb.isAddress 는 hex 형식도 true 를 주기 때문에, 탐색기 링크·문자열 비교가 깨지지 않도록 여기서 한 번에 맞춘다.
 */
function normalizeAddress(given) {
  const s = String(given ?? '').trim();
  if (/^41[0-9a-fA-F]{40}$/.test(s)) {
    const t = TronWeb.address.fromHex(s);
    return TronWeb.isAddress(t) ? t : null;
  }
  if (/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(s) && TronWeb.isAddress(s)) return s;
  return null;
}

/** 점검할 주소 정하기: 인자 > ADDRESS > MNEMONIC index0 > 데모 주소 */
function resolveTarget() {
  const arg = process.argv[2]?.trim();
  const fromEnv = process.env.ADDRESS?.trim();
  const given = arg || fromEnv;
  if (given) {
    const address = normalizeAddress(given);
    if (!address) {
      throw new Error(`주소가 트론 주소 형식이 아닙니다: ${given} (T로 시작하는 34글자, 또는 41+40글자 hex)`);
    }
    const where = arg ? '첫 번째 인자' : 'ADDRESS 환경변수';
    const source = address === given ? where : `${where} — hex 를 T주소로 바꿔 씁니다`;
    return { address, source, mnemonic: null, demo: false };
  }
  const mnemonic = process.env.MNEMONIC?.trim();
  if (mnemonic && mnemonic !== DEMO_MNEMONIC) {
    return { address: walletFromMnemonic(mnemonic, 0).address, source: '.env 의 MNEMONIC (index 0)', mnemonic, demo: false };
  }
  return { address: walletFromMnemonic(DEMO_MNEMONIC, 0).address, source: '데모 니모닉 (index 0)', mnemonic: DEMO_MNEMONIC, demo: true };
}

/**
 * 허락증을 확인할 상대: SPENDERS 환경변수 > 같은 니모닉의 index 1 주소.
 * main() 시작부에서 먼저 불러 형식을 확정한다. 잘못 적은 항목은 건너뛰고(경고만) 나머지로 점검을 끝까지 진행한다.
 */
function resolveSpenders(mnemonic) {
  const fromEnv = process.env.SPENDERS?.trim();
  if (fromEnv) {
    const spenders = [];
    const invalid = [];
    for (const s of fromEnv.split(',').map((x) => x.trim()).filter(Boolean)) {
      const normalized = normalizeAddress(s);
      if (normalized) spenders.push(normalized);
      else invalid.push(s);
    }
    return { spenders, invalid, source: 'SPENDERS 환경변수' };
  }
  if (mnemonic) return { spenders: [walletFromMnemonic(mnemonic, 1).address], invalid: [], source: '같은 니모닉의 index 1 (SPENDERS 로 바꿀 수 있음)' };
  return { spenders: [], invalid: [], source: '없음 (SPENDERS="T1,T2" 로 지정하세요)' };
}

/** 최근 거래 한 건에서 표에 넣을 값을 뽑는다 (TronGrid v1 REST 응답) */
function summarizeTx(tx, myHex) {
  const c = tx.raw_data?.contract?.[0] ?? {};
  const v = c.parameter?.value ?? {};
  const type = c.type ?? '(알 수 없음)';
  const mine = String(v.owner_address ?? '').toLowerCase() === myHex.toLowerCase();
  let counterpart = v.to_address ?? v.receiver_address ?? v.contract_address ?? v.owner_address;
  let direction = mine ? '→' : '←';
  if (!mine && v.owner_address) counterpart = v.owner_address;
  let amount = '-';
  if (v.amount !== undefined) amount = `${sunToTrx(v.amount)} TRX`;
  else if (v.balance !== undefined) amount = `${sunToTrx(v.balance)} TRX (${v.resource ?? 'resource 미표기'})`;
  else if (v.call_value !== undefined) amount = `${sunToTrx(v.call_value)} TRX`;
  const fee = tx.ret?.[0]?.fee ?? (Number(tx.net_fee ?? 0) + Number(tx.energy_fee ?? 0));
  return {
    mine, // owner_address 가 나인가 = 내가 보낸 거래인가
    time: toKst(tx.block_timestamp),
    type,
    result: tx.ret?.[0]?.contractRet ?? '?',
    counterpart: `${direction} ${short(toBase58(counterpart))}`,
    amount,
    fee: `${sunToTrx(fee)} TRX`,
    txID: tx.txID,
  };
}

async function main() {
  console.log('Lesson 13 — 내 지갑 점검과 졸업');
  console.log(`네트워크: ${NILE.name} (${NILE.fullHost}) — 읽기만 합니다. 서명·전송 없음.`);

  const { address, source, mnemonic, demo } = resolveTarget();
  const hexAddress = TronWeb.address.toHex(address);
  // 상대 주소 목록은 점검을 시작하기 전에 확정한다. [4] 중간에서 형식 오류로 멈추면 요약·사고 대응이 사라진다.
  const { spenders, invalid: badSpenders, source: spenderSource } = resolveSpenders(mnemonic);
  if (demo) {
    console.log('ℹ️  데모 모드: MNEMONIC/ADDRESS 가 없어(또는 데모 니모닉이라) 공개 데모 주소를 점검합니다.');
  }
  print.info('점검 주소', `${address} (${source})`);
  print.info('hex 주소', hexAddress);
  print.info('탐색기', explorerAddress(address));
  print.info('점검 날짜', toKst(Date.now()));
  for (const bad of badSpenders) {
    print.warn(`SPENDERS 의 "${bad}" 는 트론 주소 형식이 아닙니다. 이 항목만 건너뛰고 점검을 계속합니다.`);
  }

  const tronWeb = createTronWeb();
  tronWeb.setAddress(address); // 컨트랙트 읽기(.call)에 "누가 묻는지" 주소가 필요하다. 개인키 없음.

  /** 점검 결과 모음: { label, state } — 'ok' ✅ / 'warn' ⚠️ / 'todo' ❓(조회 실패·사람이 직접 확인) */
  const checks = [];
  const pass = (label, msg) => { checks.push({ label, state: 'ok' }); print.ok(msg ?? label); };
  const flag = (label, msg) => { checks.push({ label, state: 'warn' }); print.warn(msg ?? label); };
  const todo = (label, msg) => { checks.push({ label, state: 'todo' }); console.log('  ❓', msg ?? label); };

  // ── [1] 기본 정보 ──────────────────────────────────────────────────────────
  print.step('기본 정보 — 잔고, 활성화, 만든 날');
  const balanceSun = await tryCall('getBalance', () => tronWeb.trx.getBalance(address));
  const account = await tryCall('getAccount', () => tronWeb.trx.getAccount(address));
  // 조회 실패(null)와 미활성화({})는 다른 상태다. 뭉개면 "조회 실패"가 "정상 통과"로 보인다.
  const accountFailed = account === null;
  const activated = !accountFailed && Object.keys(account).length > 0;
  if (balanceSun !== null) {
    print.info('TRX 잔고', `${sunToTrx(balanceSun)} TRX (${comma(balanceSun)} sun)`);
    if (Number(balanceSun) > 0) pass('TRX 잔고', 'TRX 가 있습니다. 연료(대역폭·에너지가 모자랄 때 소각할 TRX)가 준비되어 있습니다.');
    else flag('TRX 잔고', 'TRX 가 0 입니다. USDT 가 있어도 아무것도 못 보냅니다(규칙 4).');
  } else {
    todo('TRX 잔고', '잔고를 조회하지 못했습니다(호출 실패) — 이 항목은 점검하지 못했습니다.');
  }
  if (accountFailed) {
    todo('계정 활성화', '계정 정보를 조회하지 못했습니다(호출 실패) — 활성화 여부를 확인하지 못했습니다.');
  } else if (activated) {
    pass('계정 활성화', '활성화된 계정입니다 (장부에 이 주소의 장이 있습니다).');
    print.info('계정 생성 시각', `${toKst(account.create_time)} (create_time ${account.create_time})`);
  } else {
    flag('계정 활성화', 'getAccount 결과가 빈 객체 {} 입니다 → 아직 활성화되지 않은 계정입니다 (TRX 를 한 번도 받은 적 없음).');
    print.info('활성화 방법', `faucet 에서 테스트 TRX 를 받으면 됩니다: ${NILE.faucet}`);
  }

  // ── [2] 계정 권한 ──────────────────────────────────────────────────────────
  print.step('계정 권한 — 이 상자의 열쇠 구멍 주인은 나인가?');
  if (activated) {
    const owner = account.owner_permission;
    const actives = account.active_permission ?? [];
    const ownerKeys = owner?.keys ?? [];
    print.info('owner threshold / 키 수', `${owner?.threshold ?? '(없음)'} / ${ownerKeys.length}`);
    ownerKeys.forEach((k, i) => print.info(`owner 키 #${i + 1}`, `${k.address} (weight ${k.weight})`));
    print.info('내 hex 주소', hexAddress);
    const ownerIsMe = ownerKeys.length === 1 && ownerKeys[0].address.toLowerCase() === hexAddress.toLowerCase();
    if (ownerIsMe) pass('owner 권한', 'owner 권한 키 = 내 주소 하나뿐. 정상입니다.');
    else flag('owner 권한', `다른 키가 권한을 가짐! owner 키 ${ownerKeys.length}개 중 내 주소가 ${ownerKeys.some((k) => k.address.toLowerCase() === hexAddress.toLowerCase()) ? '있지만 다른 키도 있습니다' : '없습니다'}.`);

    actives.forEach((p, i) => {
      const keys = p.keys ?? [];
      print.info(`active #${i + 1} (${p.permission_name ?? 'active'}) threshold / 키 수`, `${p.threshold ?? '?'} / ${keys.length}`);
      keys.forEach((k, j) => print.info(`  active #${i + 1} 키 #${j + 1}`, `${k.address} (weight ${k.weight})`));
    });
    const activeIsMe = actives.length > 0 && actives.every((p) => (p.keys ?? []).length === 1 && p.keys[0].address.toLowerCase() === hexAddress.toLowerCase());
    if (activeIsMe) pass('active 권한', 'active 권한 키도 내 주소 하나뿐. 정상입니다.');
    else flag('active 권한', 'active 권한에 다른 키가 있습니다. 권한 키가 내 것이 아니므로 원래 열쇠로는 전송이 거부될 것입니다(실제 브로드캐스트는 확인하지 않았습니다).');

    if (!ownerIsMe || !activeIsMe) {
      print.info('무슨 일?', '누군가 updateAccountPermissions 로 owner/active 권한 키를 자기 키로 바꿔 두었습니다.');
      if (demo) print.info('왜?', '데모 니모닉은 전 세계에 공개된 값입니다. 공개된 니모닉의 주소는 이미 남의 것입니다.');
      print.info('그러면?', '조회·시뮬레이션은 되지만 원래 열쇠로는 아무것도 못 보냅니다. 이 주소는 버리고 새 지갑으로 옮기는 것이 순서입니다.');
    }
  } else if (accountFailed) {
    todo('계정 권한 조회', '권한을 확인하지 못했습니다(getAccount 호출 실패) — 점검 미완료. 잠시 후 다시 실행하세요.');
  } else {
    print.info('권한 확인', '활성화되지 않은 계정은 권한 정보가 없습니다(getAccount 가 {}). 활성화 뒤 다시 확인하세요.');
  }
  print.explain({
    kid: '레슨 3의 "주인이 다른 상자"가 이거예요. 주문이 새면 남이 열쇠 구멍을 바꿔 버려요.',
    teen: '트론은 계정 권한(owner/active, threshold, weight)을 바꿀 수 있습니다. 정상은 키 1개 = 내 hex 주소, threshold 1 입니다.',
    dev: 'owner_permission.keys[0].address === 내 hex 가 정상. active_permission 은 배열이라 모든 항목의 키를 검사합니다.',
    adult: '탐색기 주소 페이지의 권한(Permission) 항목에서 내 주소가 아닌 키가 보이면, 그 지갑은 이미 내 것이 아닙니다.',
  });

  // ── [3] 자원·스테이킹 ────────────────────────────────────────────────────
  print.step('자원과 스테이킹 — 입장권은 남아 있나, 맡긴 TRX 는 얼마인가');
  if (accountFailed) {
    todo('대역폭', '계정 조회가 실패해 활성화 여부를 몰라 자원 점검을 건너뜁니다 — 점검 미완료.');
  } else if (!activated) {
    print.info('자원 정보', '활성화되지 않은 계정은 한도 필드가 응답에 없어 0 으로 보입니다. 활성화하면 무료 대역폭 600 이 생깁니다.');
    todo('대역폭', '활성화 전에는 대역폭을 점검할 수 없습니다. 이 상태에서 전송하면 대역폭과 무관하게 `account does not exist` 로 거부됩니다(Lesson 12).');
  } else {
    const res = await tryCall('getAccountResources', () => tronWeb.trx.getAccountResources(address));
    if (res) {
      const freeLeft = (res.freeNetLimit ?? 0) - (res.freeNetUsed ?? 0);
      print.info('무료 대역폭', `${freeLeft} / ${res.freeNetLimit ?? 0} 남음 (freeNetUsed ${res.freeNetUsed ?? 0})`);
      print.info('스테이킹 대역폭', `${(res.NetLimit ?? 0) - (res.NetUsed ?? 0)} / ${res.NetLimit ?? 0} 남음`);
      print.info('에너지', `${(res.EnergyLimit ?? 0) - (res.EnergyUsed ?? 0)} / ${res.EnergyLimit ?? 0} 남음`);
      if (freeLeft > 0 || (res.NetLimit ?? 0) > (res.NetUsed ?? 0)) pass('대역폭', '대역폭이 남아 있습니다. 단순 전송은 TRX 소각 없이 가능합니다.');
      else flag('대역폭', '오늘 쓸 대역폭이 남지 않았습니다. 전송하면 부족분이 1000 sun/byte 로 TRX 소각됩니다(정확한 정산은 receipt 의 net_usage/net_fee 로 확인). 무료 600 은 매일 다시 찹니다.');
    } else {
      todo('대역폭', '자원 정보를 조회하지 못했습니다(호출 실패) — 이 항목은 점검하지 못했습니다.');
    }
    // frozenV2 의 첫 항목에는 type 이 없다. 이를 대역폭으로 보는 것은 관례이며 확인되지 않았다.
    // amount 가 없는 항목(예: TRON_POWER)은 "0 을 맡겼다"가 아니라 맡긴 금액이 없는 항목이므로 표시하지 않는다.
    const frozen = (account.frozenV2 ?? []).filter((f) => Number(f.amount ?? 0) > 0);
    const rows = frozen.map((f) => `${f.type ?? 'type 없음(대역폭 추정)'}=${sunToTrx(f.amount)} TRX`);
    print.info('맡긴 TRX (frozenV2)', rows.length ? rows.join(', ') : '없음');
    if (frozen.some((f) => !f.type)) print.info('참고', 'type 이 없는 항목을 대역폭으로 보는 것은 관례입니다(확인 필요).');
    const unfrozen = account.unfrozenV2 ?? [];
    print.info('돌려받는 중 (unfrozenV2)', unfrozen.length ? `${unfrozen.length}건` : '없음');
    const unfreeze = await tryCall('getAvailableUnfreezeCount', () => tronWeb.trx.getAvailableUnfreezeCount(address));
    if (unfreeze) print.info('언스테이킹 가능 횟수', `${unfreeze.count ?? 0}회 (getAvailableUnfreezeCount)`);
  }

  // ── [4] 토큰과 허락증 ────────────────────────────────────────────────────
  print.step('토큰과 허락증 — USDT 잔고, 누구에게 얼마까지 허락했나');
  const usdt = tronWeb.contract(TRC20_ABI, NILE.usdt);
  print.info('USDT 컨트랙트', `${NILE.usdt} (토큰은 이름이 아니라 이 주소로 알아봅니다)`);
  const decimals = await tryCall('USDT decimals', async () => Number(await usdt.decimals().call()));
  const usdtBalance = await tryCall('USDT balanceOf', async () => BigInt(await usdt.balanceOf(address).call()));
  if (usdtBalance !== null && decimals !== null) {
    print.info('USDT 잔고', `${formatUnits(usdtBalance, decimals)} USDT (최소 단위 ${comma(usdtBalance)})`);
  }
  print.info('허락증 확인 상대', `${spenders.length}명 — ${spenderSource}`);
  for (const spender of spenders) {
    const allowance = await tryCall(`allowance(${short(spender)})`, async () => BigInt(await usdt.allowance(address, spender).call()));
    if (allowance === null) continue;
    if (allowance >= UNLIMITED / 2n) {
      flag(`allowance ${short(spender)}`, `${spender} 에게 사실상 무제한 허락! 지금 바로 approve(0) 으로 거두세요(규칙 9).`);
    } else if (allowance > 0n) {
      flag(`allowance ${short(spender)}`, `${spender} 에게 ${formatUnits(allowance, decimals ?? 6)} USDT 허락이 남아 있습니다. 다 썼으면 0 으로.`);
    } else {
      pass(`allowance ${short(spender)}`, `${spender} 에게 남은 허락 0. 깨끗합니다.`);
    }
  }
  if (!spenders.length) print.info('참고', '허락증은 상대 주소별로만 물어볼 수 있습니다. DEX/브릿지 컨트랙트 주소를 SPENDERS 에 넣으세요.');
  print.explain({
    kid: '허락증은 "누구에게 몇 알까지"를 상대마다 물어봐야 알 수 있어요. 빈칸 허락증은 없어야 해요.',
    teen: 'allowance(owner, spender) 는 상대별 값입니다. 전체 목록을 주는 함수는 없어서 의심되는 상대를 직접 넣어 확인합니다.',
    dev: 'UNLIMITED/2 이상이면 무제한으로 봅니다(lib/guard 와 같은 기준). 무제한이면 approve(0) 트랜잭션이 필요합니다(Lesson 09).',
    adult: 'DEX·브릿지에서 "승인"을 누른 적이 있다면 그 컨트랙트 주소를 넣어 보세요. 다 썼으면 0 으로 돌려놓으세요.',
  });

  // ── [5] 최근 거래 ──────────────────────────────────────────────────────────
  print.step('최근 거래 — 내가 보낸 봉투는 몇 건인가, 실패한 봉투가 있나');
  const txUrl = `${NILE.fullHost}/v1/accounts/${address}/transactions?limit=5&only_confirmed=true`;
  const trc20Url = `${NILE.fullHost}/v1/accounts/${address}/transactions/trc20?limit=5`;
  const txList = await tryCall('최근 트랜잭션(REST)', async () => {
    const r = await fetch(txUrl);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return (await r.json()).data ?? [];
  });
  if (txList) {
    print.info('최근 트랜잭션', `${txList.length}건 (${txUrl})`);
    console.log('  시각 | 종류 | 결과 | 상대 | 금액 | 수수료');
    const rows = txList.map((tx) => summarizeTx(tx, hexAddress));
    for (const s of rows) {
      console.log(`  ${s.time} | ${s.type} | ${s.result} | ${s.counterpart} | ${s.amount} | ${s.fee}`);
    }
    // 방향은 owner_address 로 가른다. 보낸 것(→)만 "내 열쇠가 서명했다"는 뜻이다.
    const sent = rows.filter((r) => r.mine).length;
    print.info('방향별', `내가 보낸 것(→) ${sent}건 / 남이 나에게 한 것(←) ${rows.length - sent}건`);
    if (txList.length) print.info('가장 최근 txID', `${txList[0].txID} → ${explorerTx(txList[0].txID)}`);
    const failed = txList.filter((t) => t.ret?.[0]?.contractRet !== 'SUCCESS').length;
    if (failed) flag('최근 거래 결과', `${failed}건이 SUCCESS 가 아닙니다. 영수증을 열어 단서를 읽으세요(규칙 12).`);
    else if (!txList.length) pass('최근 거래 결과', '거래 기록이 없습니다. 실패한 봉투도 없습니다.');
    else pass('최근 거래 결과', `최근 ${txList.length}건 모두 SUCCESS.`);
    // 이 항목은 코드가 판정할 수 없다. "내가 보낸 기억이 있나"는 사람만 안다.
    if (sent > 0) todo('내가 보낸 거래 확인', `내가 보낸 거래가 ${sent}건입니다. 기억에 없는 것이 있는지 txID 로 직접 확인하세요(받은 거래 ← 는 유출 신호가 아닙니다).`);
    else pass('내가 보낸 거래 확인', '최근 목록에 내가 보낸(→) 거래가 없습니다. 직접 확인할 것이 없습니다.');
  } else {
    todo('최근 거래 결과', '최근 거래를 조회하지 못했습니다(호출 실패) — 이 항목은 점검하지 못했습니다.');
  }
  const trc20List = await tryCall('최근 TRC-20 이동(REST)', async () => {
    const r = await fetch(trc20Url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return (await r.json()).data ?? [];
  });
  if (trc20List) {
    print.info('최근 TRC-20 이동', `${trc20List.length}건 (${trc20Url})`);
    console.log('  시각 | 토큰(컨트랙트) | 방향 | 상대 | 금액');
    for (const t of trc20List) {
      const out = t.from === address;
      const other = out ? t.to : t.from;
      const amount = `${formatUnits(t.value, t.token_info?.decimals ?? 0)} ${t.token_info?.symbol ?? '?'}`;
      console.log(`  ${toKst(t.block_timestamp)} | ${t.token_info?.symbol ?? '?'} (${short(t.token_info?.address)}) | ${out ? '보냄 →' : '받음 ←'} | ${short(other)} | ${amount}`);
    }
    const unknownToken = trc20List.filter((t) => t.token_info?.address !== NILE.usdt).length;
    // 성공/경고 어느 쪽이든 라벨은 같아야 한다. 달라지면 달마다 항목이 '삭제+추가'로 보인다.
    if (unknownToken) flag('토큰 컨트랙트', `${unknownToken}건이 Nile USDT(${short(NILE.usdt)})가 아닌 토큰입니다. 컨트랙트 주소를 직접 확인하세요(이름이 같아도 주소가 다르면 다른 토큰).`);
    else pass('토큰 컨트랙트', '최근 TRC-20 이동은 모두 Nile USDT 컨트랙트입니다.');
  }
  print.explain({
    kid: '내가 보낸 편지 중에 기억에 없는 게 있으면 어른에게 바로 말해요. 받은 편지는 괜찮아요.',
    teen: '내가 보낸(→, owner_address 가 나인) 거래 중 기억에 없는 것이 있으면 열쇠가 샜다는 뜻입니다. 받은 거래(←)나 남이 걸어 준 위임은 유출 신호가 아닙니다.',
    dev: 'TronGrid v1 REST: /v1/accounts/{addr}/transactions 와 /transactions/trc20. 수수료는 ret[0].fee(sun) = net_fee + energy_fee.',
    adult: '앱의 "거래 내역"이 이것입니다. 내가 보낸 항목 중 기억에 없는 것이 있으면 사고 대응 순서로 들어가세요.',
  });

  // ── [6] 요약 + 사고 대응 + 졸업 ──────────────────────────────────────────
  print.step('점검 결과 요약, 사고 대응 순서, 졸업 체크리스트');
  const okCount = checks.filter((c) => c.state === 'ok').length;
  const warnCount = checks.filter((c) => c.state === 'warn').length;
  const todoCount = checks.filter((c) => c.state === 'todo').length;
  print.info('점검 항목', `${checks.length}개 — ✅ ${okCount}개 / ⚠️ ${warnCount}개 / ❓ ${todoCount}개(직접 확인·조회 실패)`);
  const marks = { ok: '✅', warn: '⚠️ ', todo: '❓' };
  for (const c of checks) console.log(`  ${marks[c.state]} ${c.label}`);
  if (warnCount === 0 && todoCount === 0) print.ok('이번 달 점검 통과. 다음 달에 다시 만나요.');
  else if (warnCount === 0) print.warn(`경고는 없지만 직접 확인·미완료가 ${todoCount}개입니다. ❓ 항목을 눈으로 확인하고 나서 통과입니다.`);
  else print.warn(`경고가 ${warnCount}개입니다${todoCount ? ` (직접 확인·미완료 ${todoCount}개 별도)` : ''}. 아래 순서를 읽고, 혼자 끙끙대지 말고 어른(또는 동료)과 함께 움직이세요.`);
  if (demo) print.info('데모 주소라면', '⚠️ 는 예상된 결과입니다. 공개된 니모닉의 주소는 이미 남의 것이라는 실제 증거입니다.');

  console.log('\n  사고 대응 순서 (열쇠가 샜거나, 모르는 거래·권한이 보일 때)');
  console.log('  1. 멈추기: 그 지갑으로 더 이상 서명하지 않고, "고쳐 준다"는 사람의 말을 듣지 않는다(규칙 12).');
  console.log('  2. 새 지갑 만들기: 새 12단어를 만들고(npm run new-wallet) 종이에 적는다. 새 주소를 탐색기에서 확인한다.');
  console.log('  3. 자산 옮기기: TRX(연료)를 먼저 조금 보내 새 주소를 활성화하고, 남은 TRX·USDT 를 새 주소로 보낸다. 소액 먼저(규칙 6).');
  console.log('  4. 허락 취소: 옛 지갑에서 approve(0) 을 보낼 수 있으면 보내고, 권한이 이미 바뀌었다면 옛 지갑은 버린다(규칙 9).');
  console.log('  5. 알리기·신고: 가족이나 동료에게 알리고, 거래소·서비스에 연락하고, 필요하면 수사기관에 신고한다(신고처는 나라마다 다름, 확인 필요).');

  console.log('\n  졸업 체크리스트 — 13대 안전 규칙 (읽고 ☐ 에 표시하세요)');
  RULES.forEach((r, i) => console.log(`  ☐ 규칙 ${String(i + 1).padStart(2, ' ')}. ${r}`));
  print.explain({
    kid: '13개 규칙을 다 말할 수 있으면 졸업이에요. 한 달에 한 번, 부모님과 이 점검을 다시 해요.',
    teen: '점검은 ✅/⚠️ 개수로 끝나지 않습니다. ⚠️ 하나마다 "어느 규칙"인지 짚을 수 있으면 졸업입니다.',
    dev: 'npm run audit 을 매달 cron 처럼 돌리고, ⚠️ 가 0 이 아니면 알림을 보내도록 확장해 보세요(도전 과제).',
    adult: '한 달에 한 번: 잔고·권한·허락·최근 거래. 사고가 나면 순서대로. 혼자 끙끙대지 않기.',
  });

  console.log('\n요약');
  console.log(`  주소 ${address}`);
  console.log(`  ✅ ${okCount} / ⚠️ ${warnCount} / ❓ ${todoCount} (항목 ${checks.length}개)`);
  console.log(`  규칙 13: ${RULES[12]}`);
  console.log('\n🎓 졸업을 축하합니다. ➡️ 다음: 한 달 뒤 npm run audit 으로 다시 점검 (Lesson 01 부터 복습해도 좋아요)');
}

main().catch((error) => {
  console.error('lesson13 실패:', errorMessage(error));
  process.exitCode = 1;
});
