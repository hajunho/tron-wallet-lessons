// Lesson 12 — 실패 탐정: 왜 안 됐을까? (실행: npm run l12)
// 트론(Nile)과 BTTC(Donau)에서 자주 만나는 실패 9가지를 "일부러" 일으켜 보고, 메시지(단서)를 읽어 원인과 해결을 정리한다.
//  - 사건 3은 (잔고 0 새 지갑으로) 봉투를 빌드·서명까지 한다. 브로드캐스트 직전에 lib/guard.js 의 assertCanSend 를 거친다.
//  - SEND_TX=false(기본)면 사건 3은 관문에서 멈추고 빌드·서명까지만 보여 준다. 자산 이동 없음.
//  - MNEMONIC 은 없어도 된다(없으면 데모 니모닉, 데모 모드).
//  - CASE=번호(1~9) 로 사건 하나만 실행할 수 있다. 예: CASE=3 npm run l12
// 환경변수: MNEMONIC(선택), CASE(선택, 1~9), LEVEL(kid|teen|dev|adult), SHOW_SECRETS
const { ethers } = require('ethers');
const { TronWeb } = require('tronweb');
const { DEMO_MNEMONIC, walletFromMnemonic, describeMnemonic } = require('../../lib/wallet');
const { NILE, TRC20_ABI, createTronWeb, sunToTrx, decodeNodeMessage, errorMessage, formatUnits, explorerAddress } = require('../../lib/tron');
const { DONAU, createBttcProvider } = require('../../lib/bttc');
const { assertCanSend, GuardError } = require('../../lib/guard');
const print = require('../../lib/print');

const ONLY = process.env.CASE ? Number(process.env.CASE) : null;
const ZERO_TXID = '0'.repeat(64);

// 사건 기록부: 각 사건이 끝나면 { no, symptom, clue, cause, fix } 를 넣고 마지막에 표로 찍는다.
const casebook = [];
function record(no, symptom, clue, cause, fix) {
  casebook.push({ no, symptom, clue, cause, fix });
}

// 네트워크 오류 판별: 에러 문구에는 주소·hex·가스 숫자가 섞여 들어오므로 숫자(429/502/503)를 본문에서 찾으면 안 된다.
// 먼저 error.code / HTTP status 로 보고, 문자열 매칭은 오분류가 없는 문구로만 좁힌다.
const NETWORK_CODES = ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'SERVER_ERROR', 'TIMEOUT'];
const NETWORK_STATUS = [429, 502, 503];

function networkStatus(error) {
  return Number(error?.status ?? error?.response?.status ?? error?.info?.status ?? NaN);
}

/** 네트워크(429 등) 오류인지 — 예상한 실패(단서)와 구분하기 위해 */
function isNetworkTrouble(error) {
  if (NETWORK_CODES.includes(error?.code)) return true;
  if (NETWORK_STATUS.includes(networkStatus(error))) return true;
  return /Too Many Requests|fetch failed|ETIMEDOUT|ENOTFOUND|ECONNREFUSED/i.test(errorMessage(error));
}

function networkHint(error) {
  const m = errorMessage(error);
  if (networkStatus(error) === 429 || /Too Many Requests/i.test(m)) return '노드가 요청 수를 제한했습니다(429). 잠시 후 다시 실행하세요.';
  return `네트워크 오류입니다: ${m} — 인터넷 연결을 확인하고 잠시 후 다시 실행하세요.`;
}

/** 네트워크 오류로 조사하지 못한 사건도 기록부에 남긴다(구멍 방지) */
function recordNetworkGap(no, symptom, error) {
  record(no, symptom, networkHint(error), '네트워크 오류로 조사 못 함', '잠시 후 다시 실행해 이 사건만 조사한다 (CASE=' + no + ' npm run l12)');
}

/** CASE 환경변수가 있으면 그 사건만 실행 */
function want(no) {
  return ONLY === null || ONLY === no;
}

/** 0x 없는 개인키 (createRandom 은 0x 를 붙여 준다) */
function strip0x(hex) {
  return String(hex).replace(/^0x/, '');
}

async function main() {
  console.log('Lesson 12 · 실패 탐정: 왜 안 됐을까? — 규칙 12: 실패는 단서다. "고쳐 준다"는 사람은 사기다.');
  console.log(`네트워크: ${NILE.name} (${NILE.fullHost}) + ${DONAU.name} (${DONAU.rpcUrl})`);
  console.log(`SEND_TX=${process.env.SEND_TX === 'true' ? 'true' : 'false(기본)'} · 사건 3의 브로드캐스트 직전에 assertCanSend 관문이 있다(기본값이면 관문에서 멈춤)`);
  if (ONLY !== null) {
    if (!Number.isInteger(ONLY) || ONLY < 1 || ONLY > 9) throw new Error(`CASE 는 1~9 사이의 숫자여야 합니다 (받은 값: ${process.env.CASE})`);
    console.log(`CASE=${ONLY} → 사건 ${ONLY}만 조사합니다.`);
  }

  // ---------- 준비 ----------
  print.step('탐정 준비 — 조사에 쓸 주소 3개');
  let mnemonic = process.env.MNEMONIC?.trim();
  if (!mnemonic) {
    mnemonic = DEMO_MNEMONIC;
    print.warn('MNEMONIC 이 없어 데모 니모닉으로 실행합니다 (데모 모드, 조회만 하므로 문제 없음).');
  }
  const me = walletFromMnemonic(mnemonic, 0);
  const friend = walletFromMnemonic(mnemonic, 1);
  const stranger = TronWeb.createRandom(); // 방금 만든 지갑: 잔고 0, 한 번도 활성화된 적 없음
  const strangerPk = strip0x(stranger.privateKey);
  const tronWeb = createTronWeb();
  print.info('니모닉', describeMnemonic(mnemonic));
  print.info('내 주소(index 0)', me.address);
  print.info('친구 주소(index 1)', friend.address);
  print.info('새 지갑(createRandom, 잔고 0)', stranger.address);
  print.info('새 지갑 개인키', print.mask(strangerPk));
  print.info('USDT(Nile) 컨트랙트', NILE.usdt);
  print.explain({
    kid: '탐정 토리는 반송된 편지를 여러 통 받았어요. 반송 도장(에러 메시지)마다 이유가 적혀 있어요.',
    teen: '실패는 두 곳에서 납니다. 내 컴퓨터(tronweb)가 먼저 거르는 것과, 노드가 거부하는 것. 어느 쪽인지부터 봅니다.',
    dev: '사건 3만 빌드·서명 후 브로드캐스트를 시도한다. 브로드캐스트 직전 assertCanSend 관문이 있어 SEND_TX=false 면 거기서 멈춘다.',
    adult: '실패 문구는 그대로 캡처해 두세요. 문구가 곧 원인입니다. 문구를 보고 "고쳐 준다"며 열쇠를 달라는 사람은 사기입니다.',
  });

  // ---------- 사건 1: 잘못된 주소 ----------
  if (want(1)) {
    print.step('사건 1 · 잘못된 주소 — 우편함 번호 한 글자가 틀렸어요');
    const bad = me.address.slice(0, -1) + (me.address.endsWith('H') ? 'J' : 'H'); // 마지막 글자만 바꿈
    print.info('증상', `받는 주소 ${bad} 로 보내려는데 안 됨`);
    print.info('TronWeb.isAddress(원래 주소)', TronWeb.isAddress(me.address));
    print.info('TronWeb.isAddress(한 글자 바꾼 주소)', TronWeb.isAddress(bad));
    try {
      await tronWeb.transactionBuilder.sendTrx(bad, 1, me.address);
      print.warn('예상과 달리 빌드가 성공했습니다 (확인 필요).');
    } catch (error) {
      const clue = errorMessage(error);
      print.info('단서(예외)', clue);
      print.ok('노드까지 가지 않았습니다. 내 컴퓨터(tronweb)가 base58check 검사에서 먼저 걸렀습니다.');
      record(1, '보내기 버튼이 안 눌리거나 즉시 오류', clue, 'T주소 오타(base58check 불일치)', '주소를 복사·붙여넣기로 다시 받고 앞 4글자·뒤 4글자를 상대와 맞춘다');
    }
  }

  // ---------- 사건 2: 자기 자신에게 ----------
  if (want(2)) {
    print.step('사건 2 · 자기 자신에게 — 받는 사람이 나예요');
    print.info('증상', `${me.address} → ${me.address} (같은 주소) 로 1 sun 보내기`);
    try {
      await tronWeb.transactionBuilder.sendTrx(me.address, 1, me.address);
      print.warn('예상과 달리 빌드가 성공했습니다 (확인 필요).');
    } catch (error) {
      const clue = errorMessage(error);
      print.info('단서(예외)', clue);
      print.ok('트론은 자기 자신에게 TRX 를 보내는 트랜잭션을 만들지 않습니다 (EVM 은 허용).');
      record(2, '내 주소를 받는 주소에 넣었더니 오류', clue, '트론은 to === from 전송을 금지', '받는 주소를 다시 확인. 테스트라면 같은 니모닉의 index 1 주소로 보낸다');
    }
  }

  // ---------- 사건 3: 미활성화 계정에서 보내기 ----------
  if (want(3)) {
    print.step('사건 3 · 미활성화 계정에서 보내기 — 새 지갑이라 장부에 없어요 (빌드·서명 → 관문)');
    print.info('증상', `새 지갑 ${stranger.address} 에서 친구에게 1 sun 보내기`);
    try {
      const account = await tronWeb.trx.getAccount(stranger.address);
      print.info('getAccount(새 지갑)', `${print.json(account, 0)} ← 빈 객체 = 장부에 아직 없는 계정`);
      const tx = await tronWeb.transactionBuilder.sendTrx(friend.address, 1, stranger.address);
      print.info('빌드', `txID ${tx.txID.slice(0, 16)}… (빌드는 됩니다)`);
      const signed = await tronWeb.trx.sign(tx, strangerPk);
      print.info('서명', `${signed.signature.length}개 (서명도 됩니다 — 여기까지는 모두 내 컴퓨터 안)`);

      // 관문(guard): 브로드캐스트 직전에 반드시 통과해야 한다. 기본값 SEND_TX=false 면 GuardError.
      let gatePassed = false;
      try {
        await assertCanSend({ mnemonic, what: '미활성화 계정 전송 실험' });
        gatePassed = true;
        print.ok('관문 통과. 이제 되돌릴 수 없는 단계로 들어갑니다.');
      } catch (error) {
        if (!(error instanceof GuardError)) throw error;
        print.warn(error.message);
        print.ok('관문에서 멈췄습니다. 빌드·서명까지만 했고 우체통(노드)에는 넣지 않았습니다. 자산 이동 없음.');
        print.info('브로드캐스트했다면 올 응답(2026-09-12 잔고 0 새 지갑으로 관찰한 기록)', 'CONTRACT_VALIDATE_ERROR / Contract validate error : account [T…] does not exist');
        record(3, '새 지갑에서 보내면 "account does not exist"', 'CONTRACT_VALIDATE_ERROR: Contract validate error : account [T…] does not exist (관찰 기록 인용 — 이번 실행은 관문에서 멈춤)', '트론 계정은 TRX 를 한 번 받아야 활성화됨(활성화 비용 1 TRX)', '먼저 그 주소로 TRX 를 조금 받는다(faucet 또는 다른 지갑). 그 뒤에 보낸다');
      }

      if (gatePassed) {
        const result = await tronWeb.trx.sendRawTransaction(signed);
        if (result.result === true) {
          print.warn(`예상과 달리 브로드캐스트가 성공했습니다: ${result.txid} (확인 필요)`);
        } else {
          const clue = `${result.code}: ${decodeNodeMessage(result)}`;
          print.info('노드 응답 code', result.code);
          print.info('노드 응답 message(hex→문자)', decodeNodeMessage(result));
          print.ok('빌드·서명은 내 컴퓨터에서 되지만, 노드가 "그런 계정 없음"으로 거부했습니다. 자산 이동 없음.');
          record(3, '새 지갑에서 보내면 "account does not exist"', clue, '트론 계정은 TRX 를 한 번 받아야 활성화됨(활성화 비용 1 TRX)', '먼저 그 주소로 TRX 를 조금 받는다(faucet 또는 다른 지갑). 그 뒤에 보낸다');
        }
      }
    } catch (error) {
      if (isNetworkTrouble(error)) {
        print.warn(networkHint(error));
        recordNetworkGap(3, '새 지갑에서 보내기를 조사하려 했음', error);
      } else {
        print.info('단서(예외)', errorMessage(error));
        record(3, '새 지갑에서 보내면 오류', errorMessage(error), '계정 미활성화', '먼저 TRX 를 받아 활성화한다');
      }
    }
    print.explain({
      kid: '새 보물상자는 사탕상자 1개를 한 번 받아야 광장 장부에 이름이 적혀요.',
      teen: 'getAccount 가 {} 이면 미활성화. 빌드·서명은 오프라인이라 되지만 노드가 브로드캐스트를 거부합니다.',
      dev: 'sendRawTransaction → { code: "CONTRACT_VALIDATE_ERROR", message: hex }. message 는 Buffer.from(hex,"hex") 로 디코딩.',
      adult: '"USDT 는 들어왔는데 TRX 가 0" 인 새 지갑은 아무것도 못 보냅니다. TRX 부터 조금 받으세요(레슨 4).',
    });
  }

  // ---------- 사건 4: 토큰 잔고 초과 ----------
  if (want(4)) {
    print.step('사건 4 · 토큰 잔고 초과 — 사탕통보다 많이 꺼내려 했어요 (리허설로 확인)');
    try {
      tronWeb.setAddress(me.address); // contract().call() 은 기본 주소(owner_address)가 있어야 한다
      const usdt = tronWeb.contract(TRC20_ABI, NILE.usdt);
      const balance = BigInt((await usdt.balanceOf(me.address).call()).toString());
      const tooMuch = balance + 1n;
      print.info('내 USDT 잔고(raw)', `${balance} = ${formatUnits(balance, 6)} USDT`);
      print.info('보내려는 양(raw)', `${tooMuch} (잔고 + 1)`);
      await tronWeb.transactionBuilder.triggerConstantContract(
        NILE.usdt,
        'transfer(address,uint256)',
        {},
        [{ type: 'address', value: friend.address }, { type: 'uint256', value: tooMuch.toString() }],
        me.address,
      );
      print.warn('예상과 달리 리허설이 통과했습니다 (확인 필요).');
    } catch (error) {
      if (isNetworkTrouble(error)) {
        print.warn(networkHint(error));
        recordNetworkGap(4, '토큰 잔고 초과 리허설을 조사하려 했음', error);
      } else {
        const clue = errorMessage(error);
        print.info('단서(예외)', clue);
        print.ok('컨트랙트가 되돌렸습니다(REVERT). 리허설이라 수수료 0. 실제로 보냈다면 실패해도 에너지 수수료는 나갑니다.');
        record(4, '토큰 전송이 "실패"로 끝나고 수수료만 나감', clue, '잔고 부족 등 컨트랙트 조건 위반(require 실패)', '보내기 전 리허설(triggerConstantContract). 잔고·allowance·받는 주소를 다시 본다');
      }
    }
    print.explain({
      kid: '사탕통에 3알뿐인데 4알 꺼내 달라고 하면 자판기가 "안 돼요" 하고 되돌려요.',
      teen: 'REVERT 는 컨트랙트 코드가 스스로 거부한 것. 리허설(레슨 10)에서는 공짜지만 실전에서는 에너지 수수료를 냅니다.',
      dev: 'triggerConstantContract 가 예외 "REVERT opcode executed". 노드 원본은 result.message 에 같은 문자열, energy_used 도 함께 온다.',
      adult: '앱이 "실패할 것 같다"고 미리 알려 주면 보내지 마세요(규칙 10). 실패해도 수수료는 돌아오지 않습니다.',
    });
  }

  // ---------- 사건 5: 다른 키로 서명 ----------
  if (want(5)) {
    print.step('사건 5 · 다른 키로 서명 — 남의 봉투에 내 도장을 찍었어요');
    try {
      const tx = await tronWeb.transactionBuilder.sendTrx(friend.address, 1, me.address);
      print.info('봉투', `owner ${me.address} → ${friend.address}, 1 sun`);
      print.info('찍으려는 도장', `새 지갑(${stranger.address})의 열쇠`);
      await tronWeb.trx.sign(tx, strangerPk);
      print.warn('예상과 달리 서명이 됐습니다 (확인 필요).');
    } catch (error) {
      if (isNetworkTrouble(error)) {
        print.warn(networkHint(error));
        recordNetworkGap(5, '다른 키로 서명을 조사하려 했음', error);
      } else {
        const clue = errorMessage(error);
        print.info('단서(예외)', clue);
        print.ok('tronweb 이 "봉투의 owner_address 와 열쇠의 주소가 다르다"고 서명 단계에서 막았습니다. 노드까지 가지 않음.');
        record(5, '서명 버튼에서 즉시 오류', clue, '트랜잭션 owner_address 와 서명 키의 주소가 다름', '지갑 앱에서 "현재 계정"이 보내는 주소와 같은지 확인하고 다시 만든다');
      }
    }
  }

  // ---------- 사건 6: 없는 txID ----------
  if (want(6)) {
    print.step('사건 6 · 없는 txID — 영수증을 찾았는데 빈 종이예요');
    print.info('조회할 txID', ZERO_TXID);
    try {
      const info = await tronWeb.trx.getTransactionInfo(ZERO_TXID);
      print.info('getTransactionInfo', `${print.json(info, 0)} ← 예외 없이 빈 객체`);
      try {
        await tronWeb.trx.getTransaction(ZERO_TXID);
        print.warn('예상과 달리 getTransaction 이 성공했습니다 (확인 필요).');
      } catch (error) {
        const clue = errorMessage(error);
        print.info('getTransaction → 예외', clue);
        print.ok('같은 txID 인데 한쪽은 {} 한쪽은 예외. "빈 영수증"은 "아직"일 수도 "없음"일 수도 있어 getTransaction 으로 존재부터 확인합니다.');
        record(6, '"보냈다"는 txID 로 찾으니 아무것도 없음', `getTransactionInfo → {} / getTransaction → ${clue}`, '없는 txID(가짜) 또는 아직 블록에 안 들어감', '몇 블록(3초씩) 기다렸다 다시 조회. 계속 없으면 그 txID 는 장부에 없는 것');
      }
    } catch (error) {
      print.warn(isNetworkTrouble(error) ? networkHint(error) : errorMessage(error));
      recordNetworkGap(6, '없는 txID 조회를 조사하려 했음', error);
    }
  }

  // ---------- 사건 7: 만료 ----------
  if (want(7)) {
    print.step('사건 7 · 만료 — 봉투 유효기간 60초가 지났어요 (설명만, 브로드캐스트 안 함)');
    try {
      const tx = await tronWeb.transactionBuilder.sendTrx(friend.address, 1, me.address);
      const life = (tx.raw_data.expiration - tx.raw_data.timestamp) / 1000;
      print.info('timestamp', `${tx.raw_data.timestamp} (${new Date(tx.raw_data.timestamp).toISOString()})`);
      print.info('expiration', `${tx.raw_data.expiration} (${new Date(tx.raw_data.expiration).toISOString()})`);
      print.info('유효기간', `${life}초 — 이 안에 브로드캐스트하지 않으면 노드가 받지 않습니다`);
      print.info('원래 txID', tx.txID);
      const copy = JSON.parse(JSON.stringify(tx)); // extendExpiration 은 입력을 제자리 수정하므로 복사본을 넘긴다
      const extended = await tronWeb.transactionBuilder.extendExpiration(copy, 600);
      const newLife = (extended.raw_data.expiration - extended.raw_data.timestamp) / 1000;
      print.info('extendExpiration(복사본, 600) 뒤 유효기간', `${newLife}초`);
      print.info('연장된 txID', extended.txID);
      print.info('txID 가 바뀌었나', tx.txID !== extended.txID ? '예 — expiration 도 raw_data 의 일부라 해시가 달라짐' : '아니오 (확인 필요)');
      print.warn('extendExpiration 은 서명 전에만. 서명 뒤에 연장하면 "You can not extend the expiration of a signed transaction".');
      print.warn('반환값(extended)만 쓰세요. 원본 객체는 raw_data 만 바뀌고 txID 문자열은 옛것이라 서명하면 "Invalid transaction" 이 납니다.');
      record(7, '한참 뒤 보내기를 눌렀더니 실패', '만료 시각(expiration) 경과 — 실제 만료 브로드캐스트는 이 레슨에서 하지 않음(확인 필요)', '트론 트랜잭션은 기본 60초 유효(nonce 대신 ref_block + expiration)', '트랜잭션을 새로 만든다. 오프라인 서명이 필요하면 서명 전에 extendExpiration 으로 늘린다');
    } catch (error) {
      print.warn(isNetworkTrouble(error) ? networkHint(error) : errorMessage(error));
      recordNetworkGap(7, '봉투 유효기간을 조사하려 했음', error);
    }
  }

  // ---------- 사건 8: BTTC 잔고 부족 ----------
  if (want(8)) {
    print.step('사건 8 · 옆 나라 BTTC 잔고 부족 — 0 BTT 주소에서 1 BTT 보내기 리허설(estimateGas)');
    try {
      const provider = createBttcProvider();
      const balance = await provider.getBalance(me.evmAddress);
      print.info('보내는 주소(0x, 트론 경로 키)', me.evmAddress);
      print.info('Donau 잔고', `${ethers.formatEther(balance)} BTT`);
      print.info('보내려는 양', '1 BTT');
      await provider.estimateGas({ from: me.evmAddress, to: friend.evmAddress, value: ethers.parseEther('1') });
      print.warn('예상과 달리 estimateGas 가 통과했습니다 (잔고가 생겼거나 노드 정책 변경, 확인 필요).');
    } catch (error) {
      if (isNetworkTrouble(error)) {
        print.warn(networkHint(error));
        recordNetworkGap(8, 'BTTC 잔고 부족 리허설을 조사하려 했음', error);
      } else {
        const clue = errorMessage(error);
        print.info('단서(예외, ethers shortMessage)', clue);
        if (error?.code) print.info('ethers error.code', error.code);
        if (error?.info?.error?.message) print.info('노드 원본 message', error.info.error.message);
        print.ok('EVM 쪽 리허설도 잔고를 봅니다. 트론의 REVERT 처럼 "보내기 전"에 걸러 줍니다.');
        record(8, 'BTTC 에서 보내기가 안 됨', clue, '가스비+금액보다 BTT 잔고가 적음(또는 잘못된 네트워크)', '그 주소에 BTT 를 먼저 받는다(Donau faucet). 네트워크(chainId 1029)가 맞는지 본다');
      }
    }
  }

  // ---------- 사건 9: 권한 불일치 ----------
  if (want(9)) {
    print.step('사건 9 · 권한 불일치 — 열쇠는 맞는데 열쇠 구멍 주인이 바뀌었어요');
    try {
      const account = await tronWeb.trx.getAccount(me.address);
      if (!account || Object.keys(account).length === 0) {
        print.warn(`${me.address} 는 아직 활성화되지 않은 계정({})이라 권한 정보가 없습니다. 활성화되면 owner_permission 이 생깁니다.`);
      } else {
        const ownerKey = account.owner_permission?.keys?.[0]?.address ?? '(없음)';
        const activeKey = account.active_permission?.[0]?.keys?.[0]?.address ?? '(없음)';
        const same = ownerKey.toLowerCase() === me.hexAddress.toLowerCase();
        print.info('내 주소(hex)', me.hexAddress);
        print.info('owner_permission.keys[0].address', ownerKey);
        print.info('active_permission[0].keys[0].address', activeKey);
        print.info('owner threshold / key weight', `${account.owner_permission?.threshold ?? '?'} / ${account.owner_permission?.keys?.[0]?.weight ?? '?'}`);
        if (same) {
          print.ok('owner 권한 키 = 내 주소. 정상입니다.');
          record(9, '(이 계정은 정상) 권한 키 = 내 주소', '일치', '-', '한 달에 한 번 이 값을 다시 본다(레슨 13)');
        } else {
          print.warn(`owner 권한 키(${ownerKey})가 내 주소(${me.hexAddress})가 아닙니다!`);
          print.warn('누군가 updateAccountPermissions 로 권한을 자기 키로 바꿔 두었습니다. 내 개인키가 맞아도 이 계정으로는 아무것도 보낼 수 없습니다.');
          print.info('탐색기에서 보기', explorerAddress(me.address));
          print.ok('공개된(새어 나간) 니모닉의 주소는 이미 남의 것입니다. 이 데모 주소는 조회·서명 연습에만 씁니다.');
          record(9, '개인키가 맞는데 전송이 거부됨', `owner 권한 키 ${ownerKey.slice(0, 10)}… ≠ 내 주소 ${me.hexAddress.slice(0, 10)}…`, '니모닉 유출 → 공격자가 계정 권한(owner/active)을 자기 키로 변경', '그 계정은 포기하고 새 니모닉으로 새 지갑을 만든다. 남은 자산이 있어도 원래 키로는 못 옮긴다');
        }
      }
    } catch (error) {
      print.warn(isNetworkTrouble(error) ? networkHint(error) : errorMessage(error));
      recordNetworkGap(9, '계정 권한 키를 조사하려 했음', error);
    }
    print.explain({
      kid: '주문(12단어)이 새면 남이 열쇠 구멍을 바꿔 버려요. 내 열쇠가 맞아도 상자가 안 열려요.',
      teen: '트론 계정은 owner/active 권한을 다른 키로 바꿀 수 있습니다. 개인키가 맞아도 권한 키가 아니면 서명이 무효입니다.',
      dev: '정상: owner_permission.keys[0].address === 계정 hex. 다르면 updateAccountPermissions 가 실행된 것. 레슨 13 점검 항목.',
      adult: '"복구 구문을 알려 주면 고쳐 드릴게요"는 이 사건을 만드는 방법입니다. 절대 알려 주지 마세요.',
    });
  }

  // ---------- 사건 기록부 ----------
  print.step('사건 기록부 — 증상 → 단서 → 원인 → 해결');
  if (casebook.length === 0) {
    print.warn('기록된 사건이 없습니다 (네트워크 오류로 건너뛰었거나 CASE 값이 맞지 않음).');
  } else {
    for (const c of casebook) {
      console.log(`  사건 ${c.no}`);
      console.log(`    증상: ${c.symptom}`);
      console.log(`    단서: ${c.clue}`);
      console.log(`    원인: ${c.cause}`);
      console.log(`    해결: ${c.fix}`);
    }
  }
  // 실제로 기록된 번호만 나열한다(CASE 로 한 사건만 돌렸을 때 실행되지 않은 번호가 붙지 않게).
  const recorded = (nos) => nos.filter((n) => casebook.some((c) => c.no === n));
  const localNos = recorded([1, 2, 5]);
  const remoteNos = recorded([3, 4, 6, 7, 8, 9]);
  print.info('내 컴퓨터가 먼저 거른 사건(노드 안 감)', localNos.length ? `${localNos.length}건 (사건 ${localNos.join('·')})` : '0건 (이번 실행에서는 없음)');
  print.info('노드·컨트랙트가 알려 주는 사건(사건 3·7은 문구만 설명)', remoteNos.length ? `${remoteNos.length}건 (사건 ${remoteNos.join('·')})` : '0건 (이번 실행에서는 없음)');
  print.warn('어느 사건도 "12단어를 알려 주면" 해결되지 않습니다. 고쳐 준다며 열쇠를 달라는 사람은 여우 씨입니다.');
  print.ok('규칙 12: 실패는 단서다. "고쳐 준다"는 사람은 사기다.');
  print.explain({
    kid: '반송 도장을 다 읽었어요. 여우 씨가 "열쇠 주면 고쳐 줄게" 해도 안 줘요.',
    teen: '실패 문구를 표로 정리하면 대부분 5분 안에 원인이 나옵니다. 문구를 지우지 말고 저장하세요.',
    dev: '예외는 문자열/객체/{code,message(hex)} 세 형태. errorMessage + decodeNodeMessage 로 통일해 로그에 남길 것.',
    adult: '실패 화면은 캡처해 두고, 공식 문서나 아는 사람에게 "문구"만 보여 주세요. 복구 구문·개인키는 어떤 도움에도 필요 없습니다.',
  });

  console.log('\n➡️  다음: Lesson 13 내 지갑 점검과 졸업 — 사건 9의 권한 키를 포함해 한 달에 한 번 점검할 항목을 스크립트 하나로 돌립니다.');
}

main().catch((error) => {
  console.error('lesson12 실패:', errorMessage(error));
  process.exitCode = 1;
});
