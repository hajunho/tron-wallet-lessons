// Lesson 03 — 광장에 걸린 장부: 1 TRX는 사탕 100만 알 (실행: npm run l03)
// 이 스크립트는 Nile 테스트넷에서 "읽기"만 한다. 서명도, 전송도 없다.
// 하는 일: 최신 블록/확정 블록 → TRX 잔고(sun) → 계정 정보(활성화·스테이킹·TRC-10)
//          → USDT(TRC-20) 잔고와 컨트랙트 이름 → 가짜 토큰 경고 → 계정 권한 키 확인.
// 환경변수: ADDRESS(조회할 T주소. 없으면 MNEMONIC 의 index 0 주소, 그것도 없으면 데모 주소)
//          MNEMONIC(.env), LEVEL=kid|teen|dev|adult (💬 해설 대상), SHOW_SECRETS 는 이 레슨에서 쓰지 않음.
const { TronWeb } = require('tronweb');
const { DEMO_MNEMONIC, walletFromMnemonic } = require('../../lib/wallet');
const {
  NILE,
  SUN_PER_TRX,
  TRC20_ABI,
  createTronWeb,
  sunToTrx,
  explorerAddress,
  errorMessage,
  formatUnits,
} = require('../../lib/tron');
const print = require('../../lib/print');

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

/** 밀리초 타임스탬프 → 사람이 읽는 시각(KST) */
function toKst(ms) {
  return new Date(Number(ms)).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
}

/** 숫자에 천 단위 쉼표 */
function comma(n) {
  return BigInt(n).toLocaleString('ko-KR');
}

/** 조회할 주소 정하기: ADDRESS > MNEMONIC index0 > 데모 주소 */
function resolveAddress() {
  const fromEnv = process.env.ADDRESS?.trim();
  if (fromEnv) {
    if (!TronWeb.isAddress(fromEnv)) {
      throw new Error(`ADDRESS 가 트론 주소 형식이 아닙니다: ${fromEnv} (T로 시작하는 34글자여야 합니다)`);
    }
    return { address: fromEnv, source: 'ADDRESS 환경변수' };
  }
  const mnemonic = process.env.MNEMONIC?.trim();
  if (mnemonic && mnemonic !== DEMO_MNEMONIC) {
    return { address: walletFromMnemonic(mnemonic, 0).address, source: '.env 의 MNEMONIC (index 0)' };
  }
  return { address: walletFromMnemonic(DEMO_MNEMONIC, 0).address, source: '데모 니모닉 (index 0)', demo: true };
}

async function main() {
  console.log('Lesson 03 — 광장에 걸린 장부: 1 TRX는 사탕 100만 알');
  console.log(`네트워크: ${NILE.name} (${NILE.fullHost}) — 읽기만 합니다. 서명·전송 없음.`);

  const { address, source, demo } = resolveAddress();
  const hexAddress = TronWeb.address.toHex(address);
  if (demo) {
    console.log('ℹ️  데모 모드: MNEMONIC/ADDRESS 가 없어(또는 데모 니모닉이라) 공개 데모 주소를 조회합니다.');
  }
  print.info('조회 주소', `${address} (${source})`);
  print.info('hex 주소', hexAddress);
  print.info('탐색기', explorerAddress(address));

  const tronWeb = createTronWeb();
  // 컨트랙트 읽기(.call)에도 "누가 묻는지" 주소가 필요하다. 등록이 없으면 노드가
  // `class java.security.InvalidParameterException : owner_address isn't set.` 를 돌려준다. 개인키 없이 주소만 등록한다.
  tronWeb.setAddress(address);

  // ── [1] 장부의 최신 장과 확정된 장 ────────────────────────────────────────
  print.step('광장의 장부: 최신 블록과 확정 블록');
  const latest = await tryCall('getCurrentBlock', () => tronWeb.trx.getCurrentBlock());
  const confirmed = await tryCall('getConfirmedCurrentBlock', () => tronWeb.trx.getConfirmedCurrentBlock());
  if (latest && confirmed) {
    const ln = latest.block_header.raw_data.number;
    const cn = confirmed.block_header.raw_data.number;
    print.info('최신 블록 번호', `${comma(ln)} (${toKst(latest.block_header.raw_data.timestamp)})`);
    print.info('확정 블록 번호', `${comma(cn)} (${toKst(confirmed.block_header.raw_data.timestamp)})`);
    print.info('차이', `${ln - cn} 블록 (블록은 약 3초마다 하나씩 붙고, 확정은 조금 뒤에 따라옵니다)`);
    print.info('최신 블록에 담긴 트랜잭션 수', (latest.transactions ?? []).length);
    print.ok('장부는 누구나 읽을 수 있습니다. 열쇠 없이도, 앱 없이도.');
  } else {
    print.warn('블록 정보를 읽지 못했습니다. 네트워크 연결을 확인하고 다시 실행하세요.');
  }
  print.explain({
    kid: '광장 장부는 3초마다 새 장이 붙어요. 조금 뒤에 붙은 장들이 앞 장을 꽉 눌러 주면 "확정된 장"이 돼요.',
    teen: '최신 블록과 확정(solidified) 블록의 번호 차이를 보세요. 확정 블록 이전의 기록은 되돌릴 수 없다고 봅니다.',
    dev: 'getCurrentBlock 은 최신, getConfirmedCurrentBlock 은 solidified 블록. 잔고 확인은 확정 블록 기준이 안전합니다.',
    adult: '탐색기에서 보이는 "확인 수"가 이 차이입니다. 입금은 확정된 뒤에 믿으세요.',
  });

  // ── [2] TRX 잔고: sun 과 TRX ───────────────────────────────────────────────
  print.step('TRX 잔고 — 사탕(sun)으로 세고 사탕상자(TRX)로 읽기');
  const balanceSun = await tryCall('getBalance', () => tronWeb.trx.getBalance(address));
  if (balanceSun !== null) {
    print.info('잔고 (sun)', `${comma(balanceSun)} sun`);
    print.info('잔고 (TRX)', `${sunToTrx(balanceSun)} TRX`);
    print.info('환산 규칙', `1 TRX = ${comma(SUN_PER_TRX)} sun (10^6). TronWeb.fromSun / TronWeb.toSun`);
    print.ok('이 숫자는 앱이 아니라 체인(장부)에서 왔습니다. 주소만 알면 누구나 같은 값을 봅니다.');
  }
  print.explain({
    kid: '사탕상자 1개는 사탕 100만 알이에요. 장부는 사탕 알 수로 적고, 앱은 상자 수로 보여 줘요.',
    teen: 'sun 은 정수라서 0.1 + 0.2 같은 소수 오차가 없습니다. 지갑 앱은 마지막에만 10^6 으로 나눕니다.',
    dev: 'getBalance 는 sun(number). 계산은 sun 정수로 하고 표시할 때만 fromSun. 큰 값은 BigInt 로 다루세요.',
    adult: '앱 잔고와 탐색기 잔고가 다르면 앱을 의심하세요. 장부가 원본입니다.',
  });

  // ── [3] 계정 정보: 활성화, 만든 날, 스테이킹, TRC-10 ─────────────────────
  print.step('계정 정보 — 활성화 여부, 만든 날, 맡긴 TRX(스테이킹), TRC-10 토큰');
  const account = await tryCall('getAccount', () => tronWeb.trx.getAccount(address));
  if (account !== null) {
    const activated = Object.keys(account).length > 0;
    if (!activated) {
      print.warn('getAccount 결과가 빈 객체 {} 입니다 → 아직 활성화되지 않은 계정입니다 (TRX 를 한 번도 받은 적 없음).');
      print.info('활성화 방법', `faucet 에서 테스트 TRX 를 받으면 됩니다: ${NILE.faucet}`);
    } else {
      print.ok('활성화된 계정입니다 (장부에 이 주소의 장이 있습니다).');
      print.info('계정 생성 시각', `${toKst(account.create_time)} (create_time ${account.create_time})`);
      // frozenV2: 스테이킹(Stake 2.0). 'ENERGY', 'TRON_POWER' 는 type 그대로. amount 없으면 0.
      // (확인 필요: type 이 생략된 첫 항목을 BANDWIDTH 로 해석하는 것은 관례이며 사실 문서에서 확인되지 않았다)
      const frozen = account.frozenV2 ?? [];
      const frozenRows = frozen.map((f) => `${f.type ?? 'BANDWIDTH'}=${sunToTrx(f.amount ?? 0)} TRX`);
      print.info('맡긴 TRX (frozenV2)', frozenRows.length ? frozenRows.join(', ') : '없음');
      // assetV2: TRC-10 (컨트랙트 없는 네이티브 토큰). key = 토큰 ID, value = 최소 단위 수량
      const assets = account.assetV2 ?? [];
      print.info('TRC-10 토큰 수', assets.length);
      if (assets.length) {
        const first = assets[0];
        const token = await tryCall('getTokenFromID', () => tronWeb.trx.getTokenFromID(first.key));
        if (token) {
          print.info(
            `TRC-10 #${first.key}`,
            `${token.name} (${token.abbr}) ${formatUnits(first.value, token.precision ?? 0)} 개 — precision ${token.precision ?? 0}`,
          );
        } else {
          print.info(`TRC-10 #${first.key}`, `${comma(first.value)} (최소 단위, 이름 조회 실패)`);
        }
      }
    }
  }
  print.explain({
    kid: '장부에 내 장이 생기려면 사탕상자를 한 번은 받아야 해요. 그 전엔 장부에 내 이름이 없어요.',
    teen: '빈 객체 {} 가 "계정 없음"의 표현입니다. 주소는 만들 수 있어도, 체인은 TRX 를 받은 뒤에야 그 주소를 압니다.',
    dev: 'getAccount → {} 이면 미활성화. frozenV2 는 Stake 2.0, assetV2 는 TRC-10. 사용량 0 인 필드는 생략되니 ?? 0 처리.',
    adult: '새 지갑 주소는 "존재하지 않는 계정"으로 보일 수 있습니다. 처음 TRX 를 받으면 활성화됩니다.',
  });

  // ── [4] USDT(TRC-20): 컨트랙트가 관리하는 별도 장부 ─────────────────────
  print.step('USDT(TRC-20) — 사탕통 장부는 컨트랙트가 따로 관리합니다');
  print.info('USDT 컨트랙트 주소', NILE.usdt);
  const onChain = await tryCall('getContract', () => tronWeb.trx.getContract(NILE.usdt));
  if (onChain) {
    print.info('체인에 기록된 컨트랙트 이름', `${onChain.name} (ABI 항목 ${onChain.abi?.entrys?.length ?? 0}개)`);
  }
  const usdt = tronWeb.contract(TRC20_ABI, NILE.usdt);
  const meta = await tryCall('USDT name/symbol/decimals/totalSupply', async () => {
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      usdt.name().call(),
      usdt.symbol().call(),
      usdt.decimals().call(),
      usdt.totalSupply().call(),
    ]);
    return { name: String(name), symbol: String(symbol), decimals: Number(decimals), totalSupply: BigInt(totalSupply) };
  });
  let usdtBalance = null;
  if (meta) {
    print.info('name / symbol / decimals', `${meta.name} / ${meta.symbol} / ${meta.decimals}`);
    print.info('totalSupply', `${formatUnits(meta.totalSupply, meta.decimals)} ${meta.symbol} (최소 단위 ${comma(meta.totalSupply)})`);
    usdtBalance = await tryCall('USDT balanceOf', async () => BigInt(await usdt.balanceOf(address).call()));
    if (usdtBalance !== null) {
      print.info('balanceOf (최소 단위)', comma(usdtBalance));
      print.info('balanceOf (사람 단위)', `${formatUnits(usdtBalance, meta.decimals)} ${meta.symbol}`);
      print.ok('TRX 잔고는 getBalance, USDT 잔고는 컨트랙트의 balanceOf. 장부가 둘입니다.');
    }
  }
  print.explain({
    kid: '사탕상자(TRX)는 광장 장부에, 사탕통(USDT)은 사탕통 장부에 따로 적혀 있어요. 장부가 두 개예요.',
    teen: 'TRX 는 체인이 직접 세고, USDT 는 컨트랙트 안의 표(balanceOf)가 셉니다. decimals 6 이라 10^6 으로 나눕니다.',
    dev: 'TRC-20 = ERC-20 ABI. balanceOf 는 uint256(bigint) → formatUnits(raw, decimals). tronweb.contract 는 JSON ABI 객체 배열만 받습니다.',
    adult: '앱의 USDT 잔고는 이 컨트랙트에 물어본 값입니다. 탐색기 토큰 탭에서 같은 값을 확인하세요.',
  });

  // ── [5] 가짜 토큰 경고 ─────────────────────────────────────────────────────
  print.step('가짜 토큰 경고 — 토큰은 이름이 아니라 컨트랙트 주소로 알아봅니다');
  print.info('이름 "USDT" 는', '누구나 컨트랙트를 만들 때 붙일 수 있는 글자입니다. 심볼도, 이름도, 로고도 복사할 수 있습니다.');
  print.info('바꿀 수 없는 것', `컨트랙트 주소. 이 강의가 쓰는 Nile 의 USDT 는 ${NILE.usdt} 입니다.`);
  print.warn('같은 이름 "USDT" 라도 컨트랙트 주소가 다르면 완전히 다른 토큰입니다. 받은 토큰의 주소를 꼭 확인하세요.');
  print.info('내 주소 페이지', explorerAddress(address));
  print.info('USDT 컨트랙트 페이지', `${NILE.explorer}/#/contract/${NILE.usdt} (경로 패턴 확인 필요)`);
  print.info('USDT 토큰 페이지', `${NILE.explorer}/#/token20/${NILE.usdt} (경로 패턴 확인 필요)`);
  // 💬 해설은 핵심 단계 3~5곳만 붙인다([1][2][3][4][6]). 이 단계는 출력 문구 자체가 규칙이라 생략.

  // ── [6] 계정 권한 키가 나인지 ───────────────────────────────────────────
  print.step('계정 권한 — 이 상자의 열쇠 구멍 주인은 나인가?');
  if (account && Object.keys(account).length > 0) {
    const ownerKey = account.owner_permission?.keys?.[0]?.address;
    print.info('owner_permission.keys[0].address', ownerKey ?? '(없음)');
    print.info('내 hex 주소', hexAddress);
    if (ownerKey && ownerKey.toLowerCase() === hexAddress.toLowerCase()) {
      print.ok('권한 키 = 내 주소. 정상입니다.');
    } else {
      print.warn('권한 키 ≠ 내 주소! 누군가 updateAccountPermissions 로 owner 권한을 자기 키로 바꿔 두었습니다.');
      if (demo) {
        print.info('왜?', '데모 니모닉은 전 세계에 공개된 값입니다. 공개된 니모닉의 주소는 이미 남의 것입니다.');
      }
      print.info('결과', '이 주소는 조회·시뮬레이션은 되지만, 원래 열쇠로는 아무것도 보낼 수 없습니다. (Lesson 13 에서 자세히)');
    }
  } else {
    print.info('권한 확인', '활성화되지 않은 계정은 권한 정보가 없습니다. 활성화 뒤 다시 확인하세요.');
  }
  print.explain({
    kid: '노드 아저씨가 말해요. "이 상자는 열쇠 구멍 주인이 다른 사람이네. 왜인지는 나중에."',
    teen: '트론은 계정 권한(owner/active)을 바꿀 수 있습니다. 니모닉이 새면 공격자가 권한을 바꿔 원래 키를 무력화합니다.',
    dev: '정상 계정은 owner_permission.keys[0].address === 계정 hex. 점검 스크립트에 이 비교를 넣으세요(Lesson 13).',
    adult: '한 달에 한 번 탐색기에서 내 주소의 권한(Permission)을 확인하는 습관을 들이세요.',
  });

  console.log('\n요약');
  console.log(`  주소 ${address}`);
  if (balanceSun !== null) console.log(`  TRX  ${sunToTrx(balanceSun)} TRX (${comma(balanceSun)} sun)`);
  if (usdtBalance !== null && meta) console.log(`  USDT ${formatUnits(usdtBalance, meta.decimals)} ${meta.symbol} @ ${NILE.usdt}`);
  console.log('  규칙 3: 잔고는 앱이 아니라 장부(탐색기)에서 확인하고, 토큰은 이름이 아니라 컨트랙트 주소로 알아본다.');
  console.log('\n➡️ 다음: Lesson 04 연료 — 대역폭 입장권과 에너지 입장권 (npm run l04)');
}

main().catch((error) => {
  console.error('lesson03 실패:', errorMessage(error));
  process.exitCode = 1;
});
