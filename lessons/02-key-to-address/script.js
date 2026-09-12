// Lesson 02 — 열쇠에서 우편함 번호가 나와요 (실행: npm run l02)
// 개인키(32바이트) → 공개키(secp256k1) → keccak256 뒤 20바이트 → 0x41 + base58check → T주소를
// 손으로 한 단계씩 만들어 보고, TronWeb 이 만든 주소와 같은지 확인한다. 네트워크는 쓰지 않는다.
// 환경변수: MNEMONIC(없으면 데모 니모닉으로 자동 대체), SHOW_SECRETS=true(열쇠 전체 표시), LEVEL=kid|teen|dev|adult
// 같은 12단어에서 경로 인덱스만 바꾸면 주소가 여러 개 나오고, 이더리움 경로(60')로 만들면 전혀 다른 주소가 나온다.
// 마지막에 T주소 오타 감지(base58check)와 "앞뒤만 닮은 주소" 위험을 실제 계산으로 보여 준다.

const crypto = require('node:crypto');
const { TronWeb } = require('tronweb');
const { ethers } = require('ethers');
const ecc = require('tiny-secp256k1');

const wallet = require('../../lib/wallet');
const { errorMessage } = require('../../lib/tron');
const print = require('../../lib/print');

const { DEMO_MNEMONIC, walletFromMnemonic, tronPath, describeMnemonic, ETH_COIN_TYPE } = wallet;

// ---------- 지역 도우미 (lib 에 없는 것만 여기서 만든다) ----------

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest();
}

/** 21바이트(41 + 20바이트) hex → base58check T주소. 트론 주소 규칙을 그대로 손으로 구현. */
function base58check(payloadHex) {
  const payload = Buffer.from(payloadHex, 'hex');
  const checksum = sha256(sha256(payload)).subarray(0, 4);
  return { address: ethers.encodeBase58(Buffer.concat([payload, checksum])), checksum: checksum.toString('hex') };
}

/** 비압축 공개키(0x04 + 64바이트) → T주소를 한 단계씩 계산해 중간값을 모두 돌려준다 */
function addressFromPublicKeyManually(uncompressedPubHex) {
  const pubHex = uncompressedPubHex.replace(/^0x/, '');
  const xy = '0x' + pubHex.slice(2); // 앞의 04 를 떼면 x(32) + y(32) = 64바이트
  const hash = ethers.keccak256(xy); // 0x + 64hex
  const last20 = hash.slice(-40); // 뒤 20바이트
  const payload = '41' + last20; // 트론 프리픽스 0x41
  const { address, checksum } = base58check(payload);
  return { xy, hash, last20, payload, checksum, address };
}

/** 32바이트 개인키 Buffer → T주소 (닮은 주소 찾기용, tiny-secp256k1 로 빠르게) */
function fastAddressFromPrivateKey(pkBuffer) {
  const pub = Buffer.from(ecc.pointFromScalar(pkBuffer, false)); // 비압축 65바이트
  const hash = ethers.keccak256(pub.subarray(1));
  return base58check('41' + hash.slice(-40)).address;
}

/** T주소의 한 글자를 다른 base58 글자로 바꾼다(오타 흉내) */
function typo(address, position) {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const original = address[position];
  const replacement = alphabet[(alphabet.indexOf(original) + 1) % alphabet.length];
  return address.slice(0, position) + replacement + address.slice(position + 1);
}

/** 개인키 hex 의 마지막 한 글자만 바꾼 "이웃 열쇠" (같은 입력이 아니면 결과가 전부 달라짐을 보여 준다) */
function neighborPrivateKey(pkHex) {
  const last = pkHex[pkHex.length - 1];
  const replacement = last === 'f' ? 'e' : (parseInt(last, 16) + 1).toString(16);
  return pkHex.slice(0, -1) + replacement;
}

// ---------- 본문 ----------

async function main() {
  console.log('Lesson 02 — 열쇠에서 우편함 번호가 나와요 (규칙 2: 주소는 모두에게, 열쇠는 아무에게도)');

  let mnemonic = process.env.MNEMONIC?.trim();
  if (!mnemonic) {
    mnemonic = DEMO_MNEMONIC;
    print.warn('MNEMONIC 이 없어 데모 니모닉(abandon … about)으로 진행합니다. 데모 모드 — 공개된 열쇠이므로 절대 실제 자산에 쓰지 마세요.');
  }
  // 단어 수를 먼저 검사한다. ethers 는 영어로만 에러를 내므로 한국어 안내를 먼저 보여 준다.
  const wordCount = mnemonic.split(/\s+/).filter(Boolean).length;
  if (![12, 15, 18, 21, 24].includes(wordCount)) {
    print.warn(`MNEMONIC 이 ${wordCount}단어입니다. MNEMONIC 은 12 또는 24 단어여야 합니다.`);
    print.warn('`npm run new-wallet` 로 연습용(테스트넷 전용) 니모닉을 만들어 넣으세요.');
    process.exitCode = 1;
    return;
  }
  const isDemo = mnemonic === DEMO_MNEMONIC;
  print.info('니모닉', `${print.maskMnemonic(mnemonic)} — ${describeMnemonic(mnemonic)}${isDemo ? ' [데모]' : ''}`);

  // ----- [1] 경로 → 개인키 → 공개키 -----
  print.step("경로 m/44'/195'/0'/0/0 로 열쇠(개인키)와 공개키 만들기");
  const me = walletFromMnemonic(mnemonic, 0);
  const signingKey = new ethers.SigningKey('0x' + me.privateKey);
  const pubCompressed = signingKey.compressedPublicKey; // 0x02/03 + 64hex (33바이트)
  const pubUncompressed = signingKey.publicKey; // 0x04 + 128hex (65바이트)
  print.info('경로', me.path);
  print.info('개인키(32바이트)', print.mask(me.privateKey));
  print.info('압축 공개키(33바이트)', pubCompressed);
  print.info('비압축 공개키(65바이트)', pubUncompressed);
  if (pubCompressed !== me.publicKey) throw new Error('압축 공개키가 lib/wallet 의 값과 다릅니다');
  // TronWeb.fromMnemonic 은 기본 경로가 같은 m/44'/195'/0'/0/0 이라 개인키·공개키가 일치해야 한다
  const viaTronWeb = TronWeb.fromMnemonic(mnemonic);
  const samePk = viaTronWeb.privateKey.toLowerCase() === '0x' + me.privateKey.toLowerCase();
  const samePub = viaTronWeb.publicKey.toLowerCase() === pubUncompressed.toLowerCase();
  if (samePk && samePub) print.ok('TronWeb.fromMnemonic 의 개인키·비압축 공개키와 정확히 일치');
  else print.warn(`TronWeb.fromMnemonic 과 불일치 (개인키 ${samePk}, 공개키 ${samePub})`);
  print.explain({
    kid: '열쇠(개인키)에서 "공개해도 되는 반쪽"(공개키)이 나와요. 반대로는 못 가요.',
    teen: '개인키(256비트 숫자) × 생성점 G = 공개키. 곱하기는 쉽고 나누기(이산로그)는 사실상 불가능합니다.',
    dev: 'secp256k1: pub = priv·G. 압축(33B)은 x 와 y 의 홀짝만, 비압축(65B)은 x, y 모두. 트론 주소는 비압축의 64바이트를 쓴다.',
    adult: '앱이 보여 주는 T주소는 이 열쇠에서 계산된 것입니다. 열쇠는 앱이 대신 보관할 뿐, 열쇠를 아는 사람이 곧 주인입니다.',
  });

  // ----- [2] 공개키 → keccak256 → 41 + 20바이트 → base58check -----
  print.step('공개키 → keccak256 → 뒤 20바이트 → 0x41 붙이기 → base58check = T주소 (손으로 만들기)');
  const manual = addressFromPublicKeyManually(pubUncompressed);
  print.info('keccak256 입력(공개키 64바이트)', manual.xy.slice(0, 22) + '… (' + (manual.xy.length - 2) / 2 + '바이트)');
  print.info('keccak256 결과(32바이트)', manual.hash);
  print.info('뒤 20바이트', manual.last20);
  print.info("'41' + 20바이트 = 21바이트", manual.payload);
  print.info('체크섬 = sha256(sha256(21바이트)) 앞 4바이트', manual.checksum);
  print.info('base58(21바이트 + 체크섬 4바이트)', manual.address);
  const viaLib = TronWeb.address.fromPrivateKey(me.privateKey);
  print.info('TronWeb.address.fromPrivateKey', viaLib);
  if (manual.address === viaLib && viaLib === me.address) print.ok(`손으로 만든 주소 == TronWeb 주소 (${manual.address.length}글자, T로 시작)`);
  else throw new Error(`수동 생성 주소가 TronWeb 결과와 다릅니다: ${manual.address} vs ${viaLib}`);
  // 한 글자만 다른 열쇠 → 전혀 다른 주소 (활동 "색깔 믹서"의 근거)
  const neighborPk = neighborPrivateKey(me.privateKey);
  const neighborAddress = TronWeb.address.fromPrivateKey(neighborPk);
  print.info('개인키 마지막 한 글자만 바꾼 "이웃 열쇠"의 주소', neighborAddress);
  print.warn('열쇠가 한 글자만 달라도 주소는 처음부터 끝까지 다르다. 주소에서 열쇠로 되돌아가는 길은 없다(해시는 한 방향).');
  print.explain({
    kid: '열쇠를 특별한 기계(해시)에 넣으면 T로 시작하는 우편함 번호가 나와요. 번호로 열쇠는 못 만들어요.',
    teen: '해시는 입력이 1비트만 달라도 출력이 완전히 달라지고, 출력에서 입력을 찾는 방법이 없습니다.',
    dev: 'T주소 = base58check(0x41 ‖ keccak256(pubkey64)[-20:]). 체크섬 4바이트가 붙어서 오타를 잡는다.',
    adult: '"받기" 화면의 T주소는 열쇠의 지문 같은 것입니다. 남에게 알려 줘도 열쇠를 알아낼 수 없습니다.',
  });

  // ----- [3] T ↔ 41hex ↔ 0x -----
  print.step('T주소 ↔ 41hex ↔ 0x주소 변환 (T주소 안에 옆 나라 주소가 숨어 있다)');
  const hex41 = TronWeb.address.toHex(me.address);
  const backToT = TronWeb.address.fromHex(hex41);
  const evmFromT = ethers.getAddress('0x' + hex41.slice(2));
  print.info('T주소', me.address);
  print.info('TronWeb.address.toHex', hex41);
  print.info('TronWeb.address.fromHex', backToT);
  print.info("'41' 을 떼고 '0x' 를 붙이면", evmFromT);
  print.info('lib/wallet 의 evmAddress(ethers 가 계산)', me.evmAddress);
  if (backToT === me.address && evmFromT.toLowerCase() === me.evmAddress.toLowerCase()) {
    print.ok('T주소의 20바이트 == 같은 열쇠의 EVM(0x) 주소. 트론 주소는 "0x주소 + 프리픽스 41 + 체크섬" 이다');
  } else {
    throw new Error('T주소 ↔ 0x 변환 결과가 evmAddress 와 다릅니다');
  }
  print.info('비티의 예고', '"네 우편함 번호 안에 우리 나라 번호가 숨어 있어!" — 이 0x주소는 레슨 11에서 BTTC(옆 나라)의 주소로 다시 만난다');
  print.explain({
    kid: '비티가 말한 비밀이에요. T로 시작하는 번호 안에 0x로 시작하는 옆 나라 번호가 숨어 있어요.',
    teen: '표기만 다를 뿐 같은 20바이트입니다. 41 = 트론 표시, 0x = EVM 표시. 그래서 같은 열쇠가 두 나라에서 통합니다.',
    dev: "TronWeb.address.toHex(T) → '41'+40hex, fromHex → T. ethers.getAddress('0x'+hex40) 는 ethers 가 만드는 대소문자 섞인 체크섬 표기.",
    adult: 'BTTC 같은 옆 나라 네트워크에서는 같은 열쇠가 0x 로 시작하는 주소로 보입니다. 모양이 달라도 같은 주인입니다.',
  });

  // ----- [4] index 0~4 -----
  print.step('같은 12단어, 다른 우편함: 경로 인덱스 0~4 의 주소 5개');
  const rows = [];
  for (let i = 0; i < 5; i += 1) {
    const w = walletFromMnemonic(mnemonic, i);
    rows.push({ index: i, path: w.path, address: w.address, evm: w.evmAddress });
  }
  console.log('  index | 경로                     | T주소                              | 0x주소');
  console.log('  ------+--------------------------+------------------------------------+-------------------------------------------');
  for (const r of rows) {
    console.log(`  ${String(r.index).padEnd(5)} | ${r.path.padEnd(24)} | ${r.address} | ${r.evm}`);
  }
  const unique = new Set(rows.map((r) => r.address)).size;
  if (unique === rows.length) print.ok(`주소 ${rows.length}개가 모두 다르다. 열쇠도 각각 다르지만 12단어 하나로 전부 다시 만들 수 있다`);
  print.info('참고', `index 1 주소(${rows[1].address})는 뒤 레슨에서 "기본 수신자"로 쓴다 (자기 자신에게는 보낼 수 없기 때문)`);
  // (explain 은 가이드대로 핵심 단계 5곳만: [1] [2] [3] [5] [6])

  // ----- [5] 이더리움 경로 -----
  print.step("이더리움 경로(coin_type 60')로 만들면 다른 주소가 나온다");
  const ethPath = `m/44'/${ETH_COIN_TYPE}'/0'/0/0`;
  const ethNode = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, ethPath);
  const ethPkAsTron = TronWeb.address.fromPrivateKey(ethNode.privateKey.slice(2));
  print.info('트론 경로 ' + tronPath(0), me.address);
  print.info('이더 경로 ' + ethPath, ethPkAsTron + '  (0x 표기: ' + ethNode.address + ')');
  if (ethPkAsTron !== me.address) print.ok('같은 12단어라도 경로가 다르면 열쇠가 다르고 주소도 다르다');
  else print.warn('두 경로의 주소가 같습니다 — 예상 밖의 결과입니다');
  print.warn('지갑 앱마다 어느 경로를 쓰는지 다를 수 있다. 다른 앱에서 복구했는데 잔고가 0으로 보이면 "경로가 다른가?"를 먼저 의심한다.');
  print.explain({
    kid: '같은 주문이라도 "트론 마을 길"로 가면 토리 우편함, "다른 마을 길"로 가면 다른 우편함이 나와요.',
    teen: "경로의 두 번째 칸(coin_type)이 195 면 트론, 60 이면 이더리움. 이 숫자 하나로 열쇠가 완전히 달라집니다.",
    dev: "HDNodeWallet.fromPhrase(mnemonic, undefined, \"m/44'/60'/0'/0/0\") 의 privateKey 를 T주소로 바꿔도 195' 경로와 다르다. 데모 니모닉이면 TPrkFhZ8… vs TUEZ….",
    adult: '"복구했는데 잔고가 안 보여요"의 흔한 원인이 경로 차이입니다. 12단어가 틀린 것이 아닐 수 있습니다.',
  });

  // ----- [6] 오타 감지와 닮은 주소 -----
  print.step('오타 감지(base58check)와 "앞뒤만 닮은 주소" 경고');
  const typoAddress = typo(me.address, 10);
  print.info('원래 주소', me.address);
  print.info('11번째 글자를 바꾼 주소', typoAddress);
  print.info('TronWeb.isAddress(원래)', TronWeb.isAddress(me.address));
  print.info('TronWeb.isAddress(오타)', TronWeb.isAddress(typoAddress));
  if (TronWeb.isAddress(me.address) && !TronWeb.isAddress(typoAddress)) {
    print.ok('한 글자 오타는 체크섬 4바이트가 잡아 준다 → 지갑 앱이 "잘못된 주소"라고 거부한다');
  }

  // 앞 3글자가 같은 "닮은 주소"를 실제로 만들어 본다 (결정적: sha256('lookalike:i') 를 열쇠로 사용)
  const prefixLen = 3;
  const maxTries = 40_000;
  let lookalike = null;
  for (let i = 0; i < maxTries; i += 1) {
    const pk = sha256(Buffer.from(`lookalike:${i}`));
    if (!ecc.isPrivate(pk)) continue;
    const candidate = fastAddressFromPrivateKey(pk);
    if (candidate.slice(0, prefixLen) === me.address.slice(0, prefixLen)) {
      lookalike = { address: candidate, tries: i + 1 };
      break;
    }
  }
  if (lookalike) {
    print.info(`앞 ${prefixLen}글자가 같은 유효한 주소`, `${lookalike.address}  (${lookalike.tries}번 시도)`);
    print.info('TronWeb.isAddress(닮은 주소)', TronWeb.isAddress(lookalike.address));
    print.warn('이 주소는 체크섬까지 멀쩡한 "진짜" 주소다. 오타가 아니라 다른 사람의 열쇠에서 나온 주소라서 앱은 거부하지 않는다.');
  } else {
    print.warn(`${maxTries}번 안에 앞 ${prefixLen}글자가 같은 주소를 못 찾았다. 시도를 늘리면 반드시 나온다.`);
  }
  print.info('T 다음 글자', 'base58 글자는 58종이지만, 페이로드 첫 바이트가 0x41 로 고정이라 T 다음 글자는 25종(9, A~Z 중 I·O 제외)만 나온다');
  print.info('계산', '앞 3글자 ≈ 25 × 58 ≈ 1,450번, 앞 4·뒤 4 (T 는 고정이라 실제 7글자) ≈ 25 × 58^6 ≈ 9.5×10^11번 — 사람에겐 불가능해도 컴퓨터로는 가능한 범위');
  print.warn('그래서 "앞 4글자·뒤 4글자만 확인"은 위험하다. 전체를 비교하거나 QR·주소록을 쓴다 (주소 오염 사기).');
  print.explain({
    kid: '번호 한 글자가 틀리면 우체통이 "그런 번호 없어요" 해요. 하지만 앞뒤만 같은 진짜 번호는 못 잡아요. 끝까지 봐요.',
    teen: '체크섬은 "실수"를 잡고, "고의로 만든 닮은 주소"는 못 잡습니다. 시도 횟수는 맞출 글자 수의 거듭제곱으로 늘어납니다.',
    dev: 'isAddress 는 base58 디코딩 후 sha256(sha256(payload))[:4] 를 비교한다. 접두어 매칭 주소 생성은 단순 반복이라 누구나 할 수 있다.',
    adult: '복사한 주소의 앞뒤 몇 글자만 맞춰 보는 습관은 사기꾼이 노리는 지점입니다. 전체 비교 또는 QR 을 쓰세요.',
  });

  console.log('\n요약');
  console.log('  열쇠(개인키) → 공개키 → keccak256 → 20바이트 → 41 + 체크섬 → base58 → T주소. 방향은 한쪽뿐.');
  console.log('  T주소 안에는 0x주소(옆 나라 BTTC 주소)가 그대로 들어 있다.');
  console.log('  규칙 2: 주소는 모두에게, 열쇠는 아무에게도.');
  console.log('\n➡️ 다음: Lesson 03 — 광장에 걸린 장부: 1 TRX는 사탕 100만 알 (npm run l03)');
}

main().catch((error) => {
  const message = errorMessage(error);
  if (/mnemonic|phrase/i.test(message)) {
    console.error('lesson02 실패: MNEMONIC 값을 니모닉으로 읽을 수 없습니다 (원문:', message + ')');
    console.error('  MNEMONIC 은 BIP-39 단어표에 있는 12 또는 24 단어여야 하고, 마지막 단어(체크섬)까지 맞아야 합니다.');
    console.error('  `npm run new-wallet` 로 연습용(테스트넷 전용) 니모닉을 만들어 넣으세요.');
  } else {
    console.error('lesson02 실패:', message);
  }
  process.exitCode = 1;
});
