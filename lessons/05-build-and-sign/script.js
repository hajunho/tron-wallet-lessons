// Lesson 05 — 편지 쓰고 도장 찍기(아직 안 보내요) (실행: npm run l05)
// 이 스크립트는 TRX 전송 트랜잭션(봉투)을 만들고, 내용을 한 칸씩 읽고, 서명(도장)까지만 한다.
// 브로드캐스트(우체통에 넣기)는 하지 않는다. Nile 노드에는 최근 블록(ref_block)을 읽으러만 접속한다.
// 환경변수: MNEMONIC(없으면 데모 니모닉으로 자동 대체), TO(없으면 같은 니모닉의 index 1 주소),
//           AMOUNT_TRX(기본 1), MEMO(있으면 메모를 붙임, 메모 수수료 1 TRX), EXTEND(있으면 유효기간을 N초 연장)
// 결과: out/05-signed.json 에 서명된 봉투를 저장한다. 이 파일을 우체통에 넣는 것이 Lesson 06.
const fs = require('node:fs');
const path = require('node:path');
const { ethers } = require('ethers');
const { TronWeb } = require('tronweb');
const { DEMO_MNEMONIC, walletFromMnemonic, describeMnemonic } = require('../../lib/wallet');
const { NILE, createTronWeb, sunToTrx, trxToSun, errorMessage, explorerAddress } = require('../../lib/tron');
const print = require('../../lib/print');

const OUT_FILE = path.join(__dirname, '..', '..', 'out', '05-signed.json');

/** 깊은 복사: 서명/연장은 입력 객체를 제자리에서 바꾸므로 "전" 모습을 남겨 두려면 복사가 필요하다 */
function snapshot(tx) {
  return JSON.parse(JSON.stringify(tx));
}

function toIso(ms) {
  return new Date(ms).toISOString();
}

/** 네트워크 오류를 사람이 읽는 한국어로 */
function networkHint(error) {
  const msg = errorMessage(error);
  if (/429|Too Many|rate/i.test(msg)) return 'Nile 공개 노드가 요청을 제한했습니다(429). 잠시 후 다시 실행하세요.';
  if (/ENOTFOUND|ECONN|fetch failed|network|timeout/i.test(msg)) return '노드에 연결하지 못했습니다. 인터넷 연결과 TRON_FULL_HOST 를 확인하세요.';
  return msg;
}

/** 빌드 실패가 네트워크 때문인지(= 노드 연결 안내를 붙일지) 판단 */
function looksLikeNetworkError(error) {
  return /429|Too Many|rate|ENOTFOUND|ECONN|fetch failed|network|timeout/i.test(errorMessage(error));
}

/** 빌드 실패 원인별 한국어 안내 한 줄. 원인을 못 가르면 null */
function buildFailureHint(error) {
  const msg = errorMessage(error);
  if (/same account/i.test(msg)) return 'TO 가 보내는 주소와 같습니다. 다른 주소(기본: 같은 니모닉 index 1)를 쓰세요.';
  if (/recipient address/i.test(msg)) return 'TO 가 올바른 T주소가 아닙니다. 34글자 T주소인지 확인하세요.';
  if (looksLikeNetworkError(error)) return '빌드는 최근 블록(ref_block)을 노드에서 읽어야 하므로 네트워크가 필요합니다.';
  return null;
}

async function main() {
  console.log('Lesson 05 · 편지 쓰고 도장 찍기(아직 안 보내요)');
  console.log(`네트워크: ${NILE.name} (${NILE.fullHost}) — 이 레슨은 읽기만 하며 브로드캐스트하지 않습니다.`);

  // ---------------------------------------------------------------- [1]
  print.step('보내는 사람과 받는 사람 정하기');
  const envMnemonic = process.env.MNEMONIC?.trim();
  const mnemonic = envMnemonic || DEMO_MNEMONIC;
  const isDemo = mnemonic === DEMO_MNEMONIC;
  if (!envMnemonic) print.warn('MNEMONIC 이 없어 데모 니모닉으로 대체합니다 (데모 모드).');
  else if (isDemo) print.warn('데모 니모닉입니다 (데모 모드). 조회·서명 연습에만 씁니다.');
  print.info('니모닉', describeMnemonic(mnemonic));

  const me = walletFromMnemonic(mnemonic, 0);
  const receiver = walletFromMnemonic(mnemonic, 1);
  const to = process.env.TO?.trim() || receiver.address;
  const amountTrx = process.env.AMOUNT_TRX?.trim() || '1';
  if (!TronWeb.isAddress(to)) throw new Error(`TO 가 올바른 T주소가 아닙니다: ${to}`);
  if (!(Number(amountTrx) > 0)) throw new Error(`AMOUNT_TRX 는 0보다 커야 합니다: ${amountTrx}`);
  const amountSun = trxToSun(amountTrx);

  print.info('보내는 사람(from, index 0)', me.address);
  print.info('받는 사람(to' + (process.env.TO ? ', TO 환경변수' : ', 같은 니모닉 index 1') + ')', to);
  print.info('금액', `${amountTrx} TRX = ${amountSun} sun`);
  print.info('개인키(마스킹)', print.mask(me.privateKey));
  if (isDemo) {
    print.warn('데모 주소는 owner/active 권한 키가 다른 사람 키로 바뀌어 있어, 실제 전송은 어차피 노드가 거부합니다.');
    print.warn('그래도 봉투 만들기·읽기·도장 찍기 연습은 똑같이 할 수 있습니다.');
  }
  print.explain({
    kid: '토리가 봉투에 적을 것: 받는 친구 우편함 번호, 사탕 수. 열쇠는 주머니에 그대로.',
    teen: '보내는 주소는 니모닉 index 0, 받는 주소는 index 1. 자기 자신에게는 보낼 수 없어 두 번째 주소를 씁니다.',
    dev: 'from/to 는 T주소, 금액은 sun(정수). 개인키는 아직 쓰지 않는다(빌드에는 필요 없음).',
    adult: '앱의 "보내기" 화면에서 받는 주소와 금액을 입력하는 단계입니다.',
  });

  // ---------------------------------------------------------------- [2]
  print.step('봉투 만들기 — sendTrx 빌드(미서명, 브로드캐스트 없음)');
  const tronWeb = createTronWeb();
  let tx;
  try {
    tx = await tronWeb.transactionBuilder.sendTrx(to, amountSun, me.address);
  } catch (error) {
    print.warn('봉투를 만들지 못했습니다: ' + networkHint(error));
    const hint = buildFailureHint(error);
    if (hint) print.warn(hint);
    throw error;
  }
  const contract = tx.raw_data.contract[0];
  const value = contract.parameter.value;
  const life = tx.raw_data.expiration - tx.raw_data.timestamp;
  print.info('contract[0].type', contract.type);
  print.info('owner_address (hex41)', `${value.owner_address} → ${TronWeb.address.fromHex(value.owner_address)}`);
  print.info('to_address (hex41)', `${value.to_address} → ${TronWeb.address.fromHex(value.to_address)}`);
  print.info('amount (sun)', `${value.amount} = ${sunToTrx(value.amount)} TRX`);
  print.info('ref_block_bytes / ref_block_hash', `${tx.raw_data.ref_block_bytes} / ${tx.raw_data.ref_block_hash} (최근 블록 참조)`);
  print.info('timestamp', `${tx.raw_data.timestamp} = ${toIso(tx.raw_data.timestamp)}`);
  print.info('expiration', `${tx.raw_data.expiration} = ${toIso(tx.raw_data.expiration)} (timestamp + ${life / 1000}초)`);
  print.info('raw_data_hex 크기', `${tx.raw_data_hex.length / 2} bytes`);
  print.info('signature', tx.signature === undefined ? '(없음 — 아직 도장을 안 찍었습니다)' : tx.signature);
  print.ok('트론에는 nonce 가 없습니다. ref_block + expiration 이 중복·재생을 막습니다.');
  print.explain({
    kid: '봉투에 받는 사람, 사탕 수, 유효기간(60초)이 적혔어요. 아직 도장은 없어요.',
    teen: 'nonce(순번) 대신 "어느 블록을 봤는지"와 "언제까지 유효한지"를 적습니다. 60초가 지나면 우체통이 안 받습니다.',
    dev: 'raw_data = { contract[TransferContract], ref_block_bytes, ref_block_hash, timestamp, expiration }. signature 필드는 아직 없다.',
    adult: '앱의 "확인" 화면이 바로 이 봉투입니다. 받는 주소·금액·네트워크를 여기서 읽습니다.',
  });

  // ---------------------------------------------------------------- [3]
  print.step('봉투 번호(txID)는 도장 전에 정해진다 — txID === sha256(raw_data_hex)');
  const computed = ethers.sha256('0x' + tx.raw_data_hex).slice(2);
  print.info('txID (노드가 준 값)', tx.txID);
  print.info('sha256(raw_data_hex) (직접 계산)', computed);
  if (computed === tx.txID) print.ok('일치합니다. txID 는 서명이 아니라 봉투 내용의 해시입니다.');
  else print.warn('일치하지 않습니다. tronweb 버전이나 raw_data_hex 가 바뀌었는지 확인하세요.');
  print.explain({
    kid: '봉투 번호는 봉투에 적힌 글자로 만들어져요. 한 글자만 바꿔도 번호가 달라져요.',
    teen: '해시는 내용 → 번호 한쪽 방향. 내용이 1비트만 달라도 전혀 다른 txID 가 나옵니다.',
    dev: 'txID = sha256(raw_data_hex). 서명은 이 32바이트에 대해 만든다. 레슨 7에서 이 txID 로 영수증을 찾는다.',
    adult: '앱이 보여 주는 긴 거래 번호(txID)는 보내기 전에 이미 정해집니다. 나중에 탐색기에서 이 번호로 찾습니다.',
  });

  // ---------------------------------------------------------------- [4]
  print.step('메모 붙이기(선택) — 서명 전에만 가능, 메모 수수료 1 TRX');
  const memo = process.env.MEMO;
  if (memo) {
    const txIdBefore = tx.txID;
    try {
      tx = await tronWeb.transactionBuilder.addUpdateData(tx, memo, 'utf8');
    } catch (error) {
      print.warn('메모를 붙이지 못했습니다: ' + networkHint(error));
      throw error;
    }
    print.info('MEMO', memo);
    print.info('raw_data.data (hex)', tx.raw_data.data);
    print.info('hex → 문자', Buffer.from(tx.raw_data.data, 'hex').toString('utf8'));
    print.info('txID 전', txIdBefore);
    print.info('txID 후', tx.txID);
    print.ok(txIdBefore !== tx.txID ? '봉투 내용이 바뀌었으니 txID 도 바뀌었습니다.' : 'txID 가 그대로입니다(확인 필요).');
    print.warn('메모가 있는 트랜잭션은 메모 수수료 1 TRX(getMemoFee 1,000,000 sun)가 추가로 듭니다.');
    print.warn('메모는 장부에 공개됩니다. 개인정보를 적지 마세요.');
  } else {
    print.info('MEMO', '(없음) — 붙이려면 MEMO="안녕" 을 앞에 붙여 실행하세요');
    print.warn('메모는 반드시 서명 전에 붙입니다. 서명 후에는 봉투를 고칠 수 없습니다. 메모 수수료는 1 TRX 입니다.');
  }
  print.explain({
    kid: '봉투에 한마디 적을 수 있어요. 대신 도장 찍기 전에만, 그리고 사탕상자 1개가 더 들어요.',
    teen: '메모를 붙이면 raw_data.data 가 생기고 raw_data_hex 가 바뀌므로 txID 도 바뀝니다.',
    dev: 'addUpdateData(tx, text, "utf8") 는 새 tx 객체를 돌려준다. 서명 뒤에 부르면 실패한다.',
    adult: '거래소 입금 시 "메모/태그"와 비슷하지만, 트론 TRX 전송 메모는 1 TRX 가 더 듭니다.',
  });

  // ---------------------------------------------------------------- [5]
  print.step('유효기간 늘리기(선택) — extendExpiration 은 반환값만 쓴다');
  const extend = Number(process.env.EXTEND || 0);
  if (extend > 0) {
    const original = snapshot(tx); // 원본 보관: extendExpiration 은 입력의 raw_data 를 제자리에서 고친다
    let extended;
    try {
      extended = await tronWeb.transactionBuilder.extendExpiration(tx, extend);
    } catch (error) {
      print.warn('유효기간을 늘리지 못했습니다: ' + networkHint(error));
      throw error;
    }
    print.info('EXTEND', `${extend}초`);
    print.info('expiration 전', `${original.raw_data.expiration} = ${toIso(original.raw_data.expiration)}`);
    print.info('expiration 후', `${extended.raw_data.expiration} = ${toIso(extended.raw_data.expiration)} (+${(extended.raw_data.expiration - original.raw_data.expiration) / 1000}초)`);
    print.info('txID 전', original.txID);
    print.info('txID 후', extended.txID);
    print.info('입력 객체의 txID', `${tx.txID} (${tx.txID === original.txID ? '옛 값 그대로' : '바뀜'})`);
    print.info('입력 객체의 expiration', `${tx.raw_data.expiration} (${tx.raw_data.expiration === extended.raw_data.expiration ? '제자리에서 바뀜' : '그대로'})`);
    print.warn('입력 객체는 raw_data 만 바뀌고 txID 는 옛 값이라 서로 어긋납니다. 그 객체로 서명하면 실패합니다.');
    print.ok('반환된 객체만 사용합니다.');
    tx = extended;
  } else {
    print.info('EXTEND', `(없음) — 기본 유효기간 ${life / 1000}초. 늘리려면 EXTEND=600 을 앞에 붙여 실행하세요`);
    print.warn('extendExpiration 은 입력 객체의 raw_data 를 제자리에서 고치고 새 txID 를 가진 새 객체를 돌려줍니다. 반환값만 쓰세요.');
  }
  print.explain({
    kid: '유효기간이 짧으면 새 봉투로 다시 써요. 옛 봉투는 버려요.',
    teen: '기간을 늘리면 봉투 내용이 바뀌므로 txID 도 새로 생깁니다.',
    dev: 'extendExpiration(tx, sec) 는 입력을 제자리 수정 + 새 객체 반환. 원본이 필요하면 미리 JSON 복사.',
    adult: '앱에서 "거래가 만료되었습니다"가 뜨면 처음부터 다시 만들면 됩니다. 만료된 봉투는 장부에 안 들어갑니다.',
  });

  // ---------------------------------------------------------------- [6]
  print.step('도장 찍기 — trx.sign (오프라인, 노드 접속 없음)');
  const before = snapshot(tx);
  print.info('서명 전 필드', Object.keys(before).join(', '));
  let signed;
  try {
    signed = await tronWeb.trx.sign(tx, me.privateKey);
  } catch (error) {
    print.warn('서명에 실패했습니다: ' + errorMessage(error));
    throw error;
  }
  const sig = signed.signature[0];
  print.info('서명 후 필드', Object.keys(signed).join(', '));
  print.info('signature[0]', `${sig.slice(0, 16)}… (${sig.length} hex = ${sig.length / 2} bytes)`);
  print.info('같은 객체인가 (signed === tx)', signed === tx);
  print.info('txID 변화', before.txID === signed.txID ? '없음 (서명은 txID 를 바꾸지 않는다)' : '있음(확인 필요)');
  print.info('raw_data 변화', JSON.stringify(before.raw_data) === JSON.stringify(signed.raw_data) ? '없음' : '있음(확인 필요)');
  print.info('서명 전 스냅샷에 signature', before.signature === undefined ? '없음' : '있음');
  print.info('서명 후 객체에 signature', Array.isArray(signed.signature) ? `${signed.signature.length}개` : '없음');
  print.ok('trx.sign 은 입력 객체를 제자리에서 바꾸고 같은 객체를 돌려줍니다. "서명 전" 모습은 복사본에만 남습니다.');
  print.explain({
    kid: '봉투를 끝까지 읽고 나서 톡, 도장을 찍었어요. 도장은 이 봉투에만 맞아요.',
    teen: '서명은 개인키로 txID(32바이트)에 대해 만든 65바이트 값. 다른 봉투에 붙이면 맞지 않습니다.',
    dev: 'sign 은 노드 없이 동작한다(에어갭 서명 가능). signature 는 130 hex = 65 bytes.',
    adult: '앱의 "확인"을 누르는 순간이 도장입니다. 누르기 전에 받는 주소·금액·네트워크·수수료를 다시 읽으세요.',
  });

  // ---------------------------------------------------------------- [7]
  print.step('서명된 봉투 저장 — out/05-signed.json (우체통에는 안 넣음)');
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, print.json(signed) + '\n');
  print.info('저장 위치', path.relative(path.join(__dirname, '..', '..'), OUT_FILE));
  print.info('파일 크기', `${fs.statSync(OUT_FILE).size} bytes`);
  print.info('유효기간까지 남은 시간', `${Math.max(0, Math.round((signed.raw_data.expiration - Date.now()) / 1000))}초 (지나면 이 파일은 쓸 수 없어 새로 만들어야 합니다)`);
  print.info('보내는 주소 탐색기', explorerAddress(me.address));
  print.ok('이 레슨은 여기까지입니다. sendRawTransaction(브로드캐스트)은 호출하지 않았습니다.');
  print.ok('이 파일을 우체통에 넣는 것이 Lesson 06 입니다 (SEND_TX=true 와 .env 의 연습용 니모닉이 필요).');
  if (isDemo) print.warn('데모 니모닉으로는 Lesson 06 도 전송하지 않습니다(guard 가 막고, 권한도 바뀌어 있습니다).');

  console.log('\n➡️ 다음: Lesson 06 진짜로 보내기(연습 나라에서) — 도장 찍은 봉투를 우체통에 넣습니다.');
}

main().catch((error) => {
  console.error('lesson05 실패:', errorMessage(error));
  process.exitCode = 1;
});
