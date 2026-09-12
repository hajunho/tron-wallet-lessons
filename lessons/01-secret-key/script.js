// Lesson 01 — 12개 단어로 만든 비밀 열쇠 (실행: npm run l01)
// 하는 일: 아무도 못 맞히는 무작위 16바이트(엔트로피) → 체크섬 4비트 → 12단어(니모닉) → 시드(64바이트) → 트론 주소까지를
//          한 단계씩 손으로 계산하고, bip39 / tronweb 라이브러리가 낸 결과와 같은지 확인한다. 네트워크는 쓰지 않는다.
// 환경변수: WORDLIST=korean|english (기본 korean)
//          DICE="1,4,6,…"  주사위 눈 50개 이상. 있으면 crypto.randomBytes 대신 주사위 눈에서 엔트로피를 만든다.
//          PASSPHRASE      시드에 섞는 추가 문구(없으면 빈 문자열, 비교용으로 '연습'을 한 번 더 써 본다)
//          SHOW_SECRETS=true 마스킹 해제 / LEVEL=kid|teen|dev|adult 해설 대상 선택
const crypto = require('node:crypto');
const bip39 = require('bip39');
const { BIP32Factory } = require('bip32');
const ecc = require('tiny-secp256k1');
const { TronWeb } = require('tronweb');
const { DEMO_MNEMONIC, tronPath, walletFromMnemonic } = require('../../lib/wallet');
const { errorMessage } = require('../../lib/tron');
const print = require('../../lib/print');

const bip32 = BIP32Factory(ecc);
const WORDLIST_NAME = (process.env.WORDLIST || 'korean').toLowerCase();
const WORDLIST = bip39.wordlists[WORDLIST_NAME];
const WORDS_PER_MNEMONIC = 12;
const ENTROPY_BYTES = 16; // 128비트
const CHECKSUM_BITS = ENTROPY_BYTES * 8 / 32; // BIP-39: 엔트로피 32비트당 체크섬 1비트 → 4비트
const BITS_PER_WORD = 11; // 2^11 = 2048 = 단어표 크기

// ---- 지역 도우미 (lib 에 없는 것은 여기서 만든다) ----
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest();
const toBits = (buf) => [...buf].map((b) => b.toString(2).padStart(8, '0')).join('');
const showWord = (w) => w.normalize('NFC'); // bip39 한국어 단어표는 NFKD(풀어쓰기)라 화면용으로 합친다
const secretsShown = () => process.env.SHOW_SECRETS === 'true';
const sciNotation = (big) => {
  const s = big.toString();
  return `${s[0]}.${s[1]}×10^${s.length - 1}`;
};

/** 엔트로피 16바이트 → 12단어. bip39.entropyToMnemonic 과 같은 계산을 눈에 보이게 풀어 쓴 것 */
function entropyToWordsByHand(entropy, wordlist) {
  const entropyBits = toBits(entropy); // 128비트
  const checksumBits = toBits(sha256(entropy)).slice(0, CHECKSUM_BITS); // sha256 앞 4비트
  const allBits = entropyBits + checksumBits; // 132비트
  const rows = [];
  for (let i = 0; i < WORDS_PER_MNEMONIC; i += 1) {
    const chunk = allBits.slice(i * BITS_PER_WORD, (i + 1) * BITS_PER_WORD);
    const index = parseInt(chunk, 2);
    rows.push({ no: i + 1, chunk, index, word: wordlist[index] });
  }
  return { entropyBits, checksumBits, allBits, rows };
}

/** 시드 → BIP-32 경로 → 개인키 → T주소 (ethers 를 거치지 않아 어떤 언어 단어표든 동작) */
function addressFromSeed(seed, index = 0) {
  const node = bip32.fromSeed(seed).derivePath(tronPath(index));
  const privateKey = Buffer.from(node.privateKey).toString('hex'); // 0x 없음
  return { privateKey, address: TronWeb.address.fromPrivateKey(privateKey) };
}

function makeEntropy() {
  const diceText = process.env.DICE?.trim();
  if (!diceText) {
    const entropy = crypto.randomBytes(ENTROPY_BYTES);
    print.info('방법', 'crypto.randomBytes(16) — 운영체제의 난수 생성기');
    return entropy;
  }
  const dice = diceText.split(/[\s,]+/).filter(Boolean).map(Number);
  const bad = dice.filter((d) => !Number.isInteger(d) || d < 1 || d > 6);
  if (bad.length) {
    print.warn(`DICE 에 주사위 눈이 아닌 값이 있습니다: ${bad.slice(0, 5).join(', ')} → 무작위 바이트로 대신합니다.`);
    return crypto.randomBytes(ENTROPY_BYTES);
  }
  const bitsFromDice = dice.length * Math.log2(6);
  print.info('방법', `DICE 주사위 눈 ${dice.length}개 → sha256 → 앞 16바이트`);
  print.info('주사위가 주는 정보량', `${dice.length}개 × log2(6)≈2.585비트 = 약 ${bitsFromDice.toFixed(1)}비트`);
  if (dice.length < 50) {
    print.warn(`주사위 눈이 ${dice.length}개뿐이라 128비트에 못 미칩니다(최소 50개). 무작위 바이트로 대신합니다.`);
    return crypto.randomBytes(ENTROPY_BYTES);
  }
  return sha256(Buffer.from(dice.join(','))).subarray(0, ENTROPY_BYTES);
}

async function main() {
  if (!WORDLIST) {
    throw new Error(`WORDLIST=${WORDLIST_NAME} 는 모르는 단어표입니다. korean 또는 english 를 쓰세요.`);
  }
  console.log('Lesson 01 · 12개 단어로 만든 비밀 열쇠 (네트워크 없이 실행)');
  console.log(`단어표: ${WORDLIST_NAME} (${WORDLIST.length}단어, 첫 단어 "${showWord(WORDLIST[0])}", 마지막 단어 "${showWord(WORDLIST[WORDLIST.length - 1])}")`);

  // ------------------------------------------------------------
  print.step('아무도 못 맞히는 무작위 만들기 (엔트로피 128비트)');
  const entropy = makeEntropy();
  const combos = 1n << BigInt(ENTROPY_BYTES * 8);
  print.info('엔트로피(hex)', print.mask(entropy.toString('hex')));
  print.info('비트 수', `${ENTROPY_BYTES}바이트 × 8 = ${ENTROPY_BYTES * 8}비트`);
  print.info('가짓수', `2^${ENTROPY_BYTES * 8} = ${combos.toString()} ≈ ${sciNotation(combos)} (${combos.toString().length}자리)`);
  print.ok('이 숫자를 맞히는 것은 불가능에 가깝습니다. 그래서 "비밀"이 됩니다.');
  print.explain({
    kid: '주사위를 아주 많이 굴려서 아무도 못 맞히는 숫자를 만들었어요.',
    teen: '동전 128개를 동시에 던진 결과와 같은 가짓수입니다. 2^128 이 얼마나 큰지 위 숫자로 확인하세요.',
    dev: '엔트로피는 randomBytes 또는 물리 주사위에서 온다. 여기서 약하면 아래 모든 단계가 무의미하다.',
    adult: '지갑 앱이 "복구 구문을 만드는 중"일 때 뒤에서 하는 일이 바로 이것입니다.',
  });

  // ------------------------------------------------------------
  print.step('체크섬 4비트를 붙여 11비트씩 12조각 → 12단어(니모닉)');
  const hand = entropyToWordsByHand(entropy, WORDLIST);
  print.info('sha256(엔트로피) 앞 4비트 = 체크섬', hand.checksumBits);
  print.info('전체 비트 수', `${hand.entropyBits.length} + ${hand.checksumBits.length} = ${hand.allBits.length}비트 = ${BITS_PER_WORD}비트 × ${WORDS_PER_MNEMONIC}`);
  console.log('  번호 | 11비트      | 인덱스 | 단어');
  console.log('  -----+-------------+--------+------');
  for (const r of hand.rows) {
    // print.maskMnemonic 과 같은 규칙: 첫 두 단어와 마지막 단어만 보여 준다 (SHOW_SECRETS=true 면 전부)
    const visible = secretsShown() || r.no <= 2 || r.no === WORDS_PER_MNEMONIC;
    const chunk = visible ? r.chunk : '*'.repeat(BITS_PER_WORD);
    const index = visible ? String(r.index).padStart(4) : '****';
    const word = visible ? showWord(r.word) : '****';
    console.log(`  ${String(r.no).padStart(4)} | ${chunk} | ${index}   | ${word}`);
  }
  const handMnemonic = hand.rows.map((r) => r.word).join(' ');
  const libMnemonic = bip39.entropyToMnemonic(entropy, WORDLIST);
  if (handMnemonic !== libMnemonic) throw new Error('손으로 만든 니모닉과 bip39.entropyToMnemonic 결과가 다릅니다.');
  print.ok('손으로 만든 12단어 == bip39.entropyToMnemonic(entropy, wordlist)');
  print.info('니모닉', print.maskMnemonic(showWord(libMnemonic)));
  const mnemonic = libMnemonic;
  print.explain({
    kid: '숫자를 12개 단어로 바꿨어요. 단어는 숫자보다 적기 쉬워요.',
    teen: '단어 하나가 11비트(0~2047)입니다. 마지막 단어에는 체크섬 4비트가 섞여 있어 아무 단어나 올 수 없습니다.',
    dev: '12단어는 엔트로피의 다른 표기일 뿐이다. 단어를 알면 엔트로피를 알고, 엔트로피를 알면 열쇠를 안다.',
    adult: '앱이 보여 주는 "복구 구문 12단어"가 이것입니다. 종이에 적는 순간 그 종이가 지갑입니다.',
  });

  // ------------------------------------------------------------
  print.step('검증(validateMnemonic): 단어를 바꾸거나 순서를 바꾸면?');
  const words = mnemonic.split(' ');
  print.info('원본 12단어', bip39.validateMnemonic(mnemonic, WORDLIST));
  const lastIndex = WORDLIST.indexOf(words[WORDS_PER_MNEMONIC - 1]);
  const replaced = [...words];
  replaced[WORDS_PER_MNEMONIC - 1] = WORDLIST[(lastIndex + 1) % WORDLIST.length];
  const replacedValid = bip39.validateMnemonic(replaced.join(' '), WORDLIST);
  print.info(`마지막 단어를 "${showWord(replaced[WORDS_PER_MNEMONIC - 1])}"(단어표 다음 단어)로 바꿈`, replacedValid);
  if (replacedValid) print.warn('우연히 체크섬 4비트가 맞았습니다. 바로 다음 단어로 바꾸면 엔트로피가 그대로일 때가 많아 거의 항상 false 이고(약 1/256), 아무 단어로 바꿀 때가 약 1/16 입니다. 어느 쪽이든 열쇠는 전혀 다른 열쇠가 됩니다.');
  const swapped = [...words];
  [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
  const swappedValid = bip39.validateMnemonic(swapped.join(' '), WORDLIST);
  print.info('1번째와 2번째 단어 순서를 바꿈', swappedValid);
  if (swappedValid) {
    print.warn(swapped[0] === swapped[1]
      ? '두 단어가 같아서 바꿔도 그대로입니다.'
      : '순서를 바꿔도 체크섬이 맞는 경우입니다(확률 1/16). 검증이 통과해도 원래 열쇠와는 다른 열쇠입니다.');
  }
  print.ok('검증은 "오타가 있다"는 것만 잡아 줍니다. "내 것이 맞다"는 것은 잡아 주지 못합니다.');

  // ------------------------------------------------------------
  print.step('시드 64바이트 만들기 (PBKDF2 2048회) — PASSPHRASE 가 있으면 시드가 달라진다');
  const passphrase = process.env.PASSPHRASE ?? '';
  const seed = bip39.mnemonicToSeedSync(mnemonic, passphrase);
  print.info('PASSPHRASE', passphrase ? `"${passphrase}"` : '(없음, 빈 문자열)');
  print.info('시드(hex)', `${print.mask(seed.toString('hex'))} — ${seed.length}바이트`);
  const otherPassphrase = passphrase ? '' : '연습';
  const otherSeed = bip39.mnemonicToSeedSync(mnemonic, otherPassphrase);
  print.info(`PASSPHRASE 를 ${otherPassphrase ? `"${otherPassphrase}"` : '(없음)'} 으로 바꾸면`, print.mask(otherSeed.toString('hex')));
  print.info('두 시드가 같은가', seed.equals(otherSeed));
  print.warn('같은 12단어라도 PASSPHRASE 가 한 글자만 달라도 완전히 다른 지갑이 됩니다. 적어 두지 않으면 아무도 못 찾습니다.');
  print.explain({
    kid: '12단어 주문을 오래오래 섞어서 진짜 열쇠 재료(시드)를 만들어요.',
    teen: '시드는 12단어를 2048번 반복 계산해 만든 64바이트입니다. PASSPHRASE 를 바꾸면 시드가 통째로 바뀌는 것을 위에서 확인하세요.',
    dev: 'mnemonicToSeedSync(mnemonic, passphrase). passphrase(12단어에서는 13번째 단어)는 검증되지 않으므로 오타도 "다른 지갑"이 된다.',
    adult: '어떤 앱은 "추가 비밀번호"를 지원합니다. 12단어에서는 13번째 단어에 해당합니다. 이것을 잊으면 12단어가 있어도 지갑을 못 엽니다.',
  });

  // ------------------------------------------------------------
  print.step("시드 → 경로 m/44'/195'/0'/0/0 → 열쇠 → T주소 (열쇠는 마스킹)");
  // 5-a. 영어 니모닉으로 세 가지 방법이 같은 주소를 내는지 확인. TronWeb/ethers 의 fromMnemonic 은 passphrase 를 받지 않으므로
  //      교차 검증은 세 방법 모두 PASSPHRASE 없이(빈 문자열) 한다.
  const englishMnemonic = WORDLIST_NAME === 'english' ? mnemonic : bip39.entropyToMnemonic(entropy, bip39.wordlists.english);
  const viaTronWeb = TronWeb.fromMnemonic(englishMnemonic);
  const viaLib = walletFromMnemonic(englishMnemonic);
  const viaBip32 = addressFromSeed(bip39.mnemonicToSeedSync(englishMnemonic, ''));
  print.info('같은 엔트로피의 영어 니모닉', print.maskMnemonic(englishMnemonic));
  print.info('  TronWeb.fromMnemonic (PASSPHRASE 없이)', viaTronWeb.address);
  print.info('  lib.walletFromMnemonic (ethers, PASSPHRASE 없이)', viaLib.address);
  print.info('  bip32.fromSeed().derivePath (직접, PASSPHRASE 없이)', viaBip32.address);
  if (viaTronWeb.address !== viaLib.address || viaLib.address !== viaBip32.address) {
    throw new Error('세 방법의 주소가 다릅니다. 경로나 시드 계산을 확인하세요.');
  }
  print.ok('세 방법 모두 같은 T주소 (경로 ' + viaLib.path + ', PASSPHRASE 없이 계산)');
  print.info('열쇠(개인키)', print.mask(viaBip32.privateKey));

  // 5-b. 한국어 니모닉: ethers/TronWeb.fromMnemonic 은 한국어 단어표를 모르므로 bip32 로 직접 만든다
  const koreanMnemonic = WORDLIST_NAME === 'korean' ? mnemonic : bip39.entropyToMnemonic(entropy, bip39.wordlists.korean);
  print.info('같은 엔트로피의 한국어 니모닉', print.maskMnemonic(showWord(koreanMnemonic)));
  try {
    const attempt = TronWeb.fromMnemonic(koreanMnemonic);
    print.info('  TronWeb.fromMnemonic', attempt.address);
  } catch (error) {
    print.warn(`TronWeb.fromMnemonic 은 한국어 단어표를 읽지 못합니다: ${errorMessage(error).split('(')[0].trim()}`);
  }
  // 5-c. 언어 비교는 같은 PASSPHRASE 로 만든 시드끼리 한다(passphrase 유무가 섞이면 무엇 때문에 달라졌는지 알 수 없다)
  const englishAddress = addressFromSeed(bip39.mnemonicToSeedSync(englishMnemonic, passphrase)).address;
  const koreanAddress = addressFromSeed(bip39.mnemonicToSeedSync(koreanMnemonic, passphrase)).address;
  print.info('  bip32.fromSeed().derivePath (직접)', koreanAddress);
  print.ok('한국어 12단어도 시드 → 경로 → 열쇠 → 주소 순서는 똑같습니다.');
  print.info('영어 12단어와 한국어 12단어의 주소가 같은가 (같은 PASSPHRASE 로 비교)', englishAddress === koreanAddress);
  print.warn('같은 엔트로피라도 단어표(언어)가 다르면 시드가 달라져 다른 지갑이 됩니다. 복구할 때 언어까지 맞춰야 합니다.');
  // 최종 주소는 [4]에서 만든 시드(= 이번 단어표 + PASSPHRASE)로 계산한다. PASSPHRASE 를 바꾸면 이 줄이 바뀐다.
  print.info(`이번에 만든 ${WORDLIST_NAME} 12단어의 T주소 (PASSPHRASE 적용)`, addressFromSeed(seed).address);
  print.explain({
    kid: '주문으로 열쇠를 깎고, 열쇠로 우편함 번호까지 만들었어요. 다음 시간에 자세히 봐요.',
    teen: '누가 계산하든 같은 12단어면 같은 주소입니다. 그래서 12단어를 아는 사람은 누구나 이 지갑의 주인입니다.',
    dev: '경로가 같으면 tronweb, ethers, bip32 어느 라이브러리로 계산해도 같은 키가 나온다. 언어 단어표는 시드에 포함된다.',
    adult: '앱을 지우고 다른 앱에 12단어를 넣어도 같은 주소가 나오는 이유입니다. 앱이 아니라 12단어가 지갑입니다.',
  });

  // ------------------------------------------------------------
  print.step('데모 니모닉(abandon×11 about)은 엔트로피 0x00 에서 나온 공개 값');
  const zeroMnemonic = bip39.entropyToMnemonic(Buffer.alloc(ENTROPY_BYTES), bip39.wordlists.english);
  print.info('엔트로피 00×16 → 니모닉', print.maskMnemonic(zeroMnemonic));
  print.info('lib 의 DEMO_MNEMONIC 과 같은가', zeroMnemonic === DEMO_MNEMONIC);
  const demo = walletFromMnemonic(DEMO_MNEMONIC);
  print.info('데모 주소', `${demo.address} (hex ${demo.hexAddress})`);
  print.warn('이 주소는 전 세계가 아는 니모닉의 주소입니다. Nile 에서 실제로 owner/active 권한 키가 41156f4463ce90ac11e1855ff99e4273806ad847cf 로 바뀌어 있어, 개인키가 있어도 전송할 수 없습니다.');
  print.ok('공개된(또는 새어 나간) 12단어의 지갑은 이미 남의 것입니다. 조회·연습에만 씁니다.');
  print.explain({
    kid: '누구나 아는 주문으로 만든 보물상자는 벌써 남의 상자예요.',
    teen: '엔트로피가 0 이면 12단어도 뻔합니다. 무작위가 약하면 "비밀"이 아닙니다.',
    dev: '데모 니모닉은 조회·시뮬레이션 전용. lib/guard.js 가 이 니모닉의 전송을 막는다.',
    adult: '인터넷에 떠도는 "샘플 복구 구문"을 내 지갑으로 쓰면 안 되는 이유입니다.',
  });

  console.log('\n규칙 1. 열쇠(12단어)는 나만 안다. 고객센터도 모른다.');
  console.log('➡️ 다음: Lesson 02 열쇠에서 우편함 번호가 나와요 (npm run l02)');
}

main().catch((error) => {
  console.error('lesson01 실패:', errorMessage(error));
  process.exitCode = 1;
});
