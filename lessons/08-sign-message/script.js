// Lesson 08 — '나야'라고 증명하기(돈은 안 들어요) (실행: npm run l08)
// 트랜잭션이 아닌 "메시지"에 서명하고 검증한다. 네트워크 호출 없음(가스 0, 오프라인).
//  1) signMessageV2 / verifyMessageV2 — 메시지 서명과 "복원 주소 == 기대 주소" 검증
//  2) 프리픽스(\x19TRON Signed Message:\n)를 직접 계산해 ethers 로 같은 주소 복원, 이더리움 프리픽스와 비교
//  3) signTypedData / verifyTypedData — 구조화 서명(TIP-712 = EIP-712), chainId 가 다르면 실패
//  4) ethers.TypedDataEncoder.hash 와 tronweb 서명이 같은 해시를 쓰는지 확인
//  5) "이 서명이 하는 일" 표 — Permit 서명에서 읽어야 할 필드(레슨 9 예고)
// 환경변수: MNEMONIC(없으면 데모 니모닉), MESSAGE(기본 "나는 토리예요"), CHAIN_ID(기본 3448148188 = Nile), SHOW_SECRETS, LEVEL
const { ethers } = require('ethers');
const { TronWeb, utils: tronUtils } = require('tronweb');
const { DEMO_MNEMONIC, walletFromMnemonic, describeMnemonic } = require('../../lib/wallet');
const { NILE, createTronWeb, errorMessage } = require('../../lib/tron');
const print = require('../../lib/print');

const MESSAGE = process.env.MESSAGE ?? '나는 토리예요';
const CHAIN_ID = Number(process.env.CHAIN_ID ?? NILE.chainId);
const ETH_PREFIX = '\x19Ethereum Signed Message:\n';

/** 0x 주소(20바이트) → T 주소. 서명에서 복원된 EVM 형식 주소를 트론 형식으로 바꾼다. */
function evmToTron(evmAddress) {
  return TronWeb.address.fromHex('41' + evmAddress.slice(2).toLowerCase());
}

/** T 주소 → 0x 주소. TIP-712 해시를 ethers 로 다시 계산할 때 쓴다. */
function tronToEvm(tAddress) {
  return ethers.getAddress('0x' + TronWeb.address.toHex(tAddress).slice(2));
}

/** 프리픽스 + 바이트 길이 + 메시지 를 keccak256 한 뒤 서명에서 주소를 복원한다. */
function recoverWithPrefix(prefix, message, signature) {
  const bytes = ethers.toUtf8Bytes(message);
  const digest = ethers.keccak256(ethers.concat([ethers.toUtf8Bytes(prefix), ethers.toUtf8Bytes(String(bytes.length)), bytes]));
  return { digest, address: evmToTron(ethers.recoverAddress(digest, signature)) };
}

function matchLabel(a, b) {
  return a === b ? 'MATCH' : 'MISMATCH';
}

async function main() {
  console.log('Lesson 08 — 메시지 서명: 돈은 안 들지만, 읽지 못하면 찍지 않는다 (네트워크 호출 없음)');

  // ---------- [1] 지갑 준비 ----------
  print.step('지갑 준비 (서명용 열쇠)');
  let mnemonic = process.env.MNEMONIC?.trim();
  if (!mnemonic) {
    mnemonic = DEMO_MNEMONIC;
    print.warn('MNEMONIC 이 없어 데모 니모닉으로 실행합니다 (데모 모드, 서명 연습에는 문제 없음).');
  }
  const me = walletFromMnemonic(mnemonic, 0);
  const tronWeb = createTronWeb(); // fullHost 는 설정되지만 이 레슨은 노드에 아무것도 묻지 않는다
  print.info('니모닉', describeMnemonic(mnemonic));
  print.info('경로', me.path);
  print.info('개인키', print.mask(me.privateKey));
  print.info('내 주소(T)', me.address);
  print.info('같은 키의 0x 주소', me.evmAddress);
  print.explain({
    kid: '도장(서명)은 편지가 아니라 그냥 종이에도 찍을 수 있어요. 우표는 안 들어요.',
    teen: '서명은 개인키로만 만들 수 있고, 검증은 주소만 알면 누구나 할 수 있습니다. 트랜잭션이 아니므로 수수료가 0입니다.',
    dev: 'signMessageV2/signTypedData 는 노드에 보내지 않는 순수 오프라인 연산. 대역폭/에너지 소모 없음.',
    adult: '"서명 요청" 팝업은 돈을 보내는 것이 아니지만, 무엇에 서명하는지에 따라 권한이 넘어갈 수 있습니다.',
  });

  // ---------- [2] 메시지 서명과 검증 ----------
  print.step('메시지 서명 (signMessageV2) 과 검증 (verifyMessageV2)');
  print.info('메시지', JSON.stringify(MESSAGE));
  print.info('메시지 바이트 길이(UTF-8)', ethers.toUtf8Bytes(MESSAGE).length);
  const signature = await tronWeb.trx.signMessageV2(MESSAGE, me.privateKey);
  print.info('서명', `${signature.slice(0, 10)}…${signature.slice(-8)} (0x + ${signature.length - 2} hex, 65바이트)`);
  const recovered = await tronWeb.trx.verifyMessageV2(MESSAGE, signature);
  print.info('복원된 주소', recovered);
  print.info('내 주소와 비교', matchLabel(recovered, me.address));
  if (recovered === me.address) print.ok('같은 메시지 + 같은 서명 → 내 주소가 복원됩니다.');

  // 메시지 한 글자만 바꾸면 "예외"가 아니라 "다른 주소"가 나온다
  const tampered = MESSAGE.slice(0, -1) + (MESSAGE.endsWith('!') ? '?' : '!');
  const recoveredTampered = await tronWeb.trx.verifyMessageV2(tampered, signature);
  print.info('바꾼 메시지', JSON.stringify(tampered));
  print.info('바꾼 메시지로 복원된 주소', recoveredTampered);
  print.info('내 주소와 비교', matchLabel(recoveredTampered, me.address));
  print.warn('verifyMessageV2 는 틀려도 예외를 던지지 않고 "다른 주소"를 돌려줍니다. 검증 = "복원 주소 == 기대 주소" 비교입니다.');
  print.explain({
    kid: '종이 글자를 하나만 바꿔도 도장 무늬가 다른 사람 것처럼 보여요.',
    teen: '검증 함수는 "누가 서명했는지"를 계산할 뿐, "맞다/틀리다"를 말하지 않습니다. 비교는 내가 해야 합니다.',
    dev: '형식이 올바른 서명이면 어떤 digest 에도 주소를 돌려준다. 반드시 expected 와 === 비교.',
    adult: '"검증됨" 표시만 믿지 말고, 어느 주소가 서명했는지까지 확인하세요.',
  });

  // ---------- [3] 프리픽스 직접 계산 ----------
  print.step('프리픽스 직접 계산: 같은 키라도 프리픽스가 다르면 다른 서명');
  const TRON_PREFIX = tronUtils.message.TRON_MESSAGE_PREFIX;
  print.info('트론 프리픽스', JSON.stringify(TRON_PREFIX));
  print.info('이더리움 프리픽스', JSON.stringify(ETH_PREFIX));
  const viaTron = recoverWithPrefix(TRON_PREFIX, MESSAGE, signature);
  print.info('keccak256(트론 프리픽스 + 길이 + 메시지)', viaTron.digest);
  print.info('tronweb hashMessage 와 비교', matchLabel(viaTron.digest, tronUtils.message.hashMessage(MESSAGE)));
  print.info('ethers.recoverAddress → T주소', `${viaTron.address} (${matchLabel(viaTron.address, me.address)})`);
  const viaEth = recoverWithPrefix(ETH_PREFIX, MESSAGE, signature);
  print.info('이더리움 프리픽스로 복원한 주소', `${viaEth.address} (${matchLabel(viaEth.address, me.address)})`);
  print.ok('트론 프리픽스로만 내 주소가 나옵니다. 프리픽스는 "이건 트랜잭션이 아니라 메시지다"라는 표시입니다.');
  print.explain({
    kid: '종이 맨 위에 "이건 편지가 아니에요" 도장을 먼저 찍어 두면, 종이가 편지인 척할 수 없어요.',
    teen: '프리픽스 덕분에 메시지 서명이 트랜잭션 서명으로 재사용될 수 없습니다. 체인마다 프리픽스가 다릅니다.',
    dev: 'digest = keccak256("\\x19TRON Signed Message:\\n" + byteLen + msg). ethers 로 재현 가능, EVM 프리픽스와는 다른 주소.',
    adult: '앱이 보여 주는 서명 요청 문구가 곧 이 "메시지"입니다. 문구를 읽을 수 있어야 합니다.',
  });

  // ---------- [4] 구조화 서명 (TIP-712) ----------
  print.step('구조화 서명 (signTypedData, TIP-712) 과 chainId 검증');
  const spender = walletFromMnemonic(mnemonic, 1).address; // 같은 니모닉의 index 1 주소를 spender 예시로
  const domain = { name: 'Lesson08 Permit', version: '1', chainId: CHAIN_ID, verifyingContract: NILE.usdt };
  const types = {
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  };
  const value = { owner: me.address, spender, value: '3000000', deadline: '1800000000' };
  print.info('domain', print.json(domain, 0));
  print.info('types.Permit', types.Permit.map((f) => `${f.name}:${f.type}`).join(', '));
  print.info('value', print.json(value, 0));
  const typedSig = await tronWeb.trx.signTypedData(domain, types, value, me.privateKey);
  print.info('서명', `${typedSig.slice(0, 10)}…${typedSig.slice(-8)} (0x + ${typedSig.length - 2} hex)`);
  const okTyped = await tronWeb.trx.verifyTypedData(domain, types, value, typedSig, me.address);
  print.info('verifyTypedData(같은 domain)', okTyped);

  const wrongDomain = { ...domain, chainId: CHAIN_ID === 3448148188 ? 1029 : 3448148188 };
  try {
    const r = await tronWeb.trx.verifyTypedData(wrongDomain, types, value, typedSig, me.address);
    print.info('verifyTypedData(chainId 바꿈)', r);
  } catch (error) {
    print.info('verifyTypedData(chainId 바꿈) → 예외', errorMessage(error));
    print.warn('verifyTypedData 는 불일치 시 false 가 아니라 예외를 던집니다. try/catch 가 필요합니다.');
  }
  print.ok(`서명에 chainId(${CHAIN_ID})가 묶여 있어 다른 나라(네트워크)에서는 재사용할 수 없습니다.`);
  print.explain({
    kid: '종이에 "어느 나라, 어느 사탕통, 누가, 몇 알까지"를 칸마다 적어 두면 읽기 쉬워요.',
    teen: '구조화 서명은 필드 이름과 타입까지 해시에 넣어, 지갑 앱이 사람이 읽는 표로 보여 줄 수 있습니다.',
    dev: 'TIP-712 domain = { name, version, chainId, verifyingContract }. chainId/컨트랙트가 다르면 digest 가 달라져 검증 실패.',
    adult: '서명 팝업에 표가 보이면 "누구에게(spender)", "얼마(value)", "언제까지(deadline)"를 꼭 읽으세요.',
  });

  // ---------- [5] TIP-712 == EIP-712 ----------
  print.step('TIP-712 해시가 EIP-712 해시와 같은지 확인 (ethers.TypedDataEncoder)');
  const evmDomain = { ...domain, verifyingContract: tronToEvm(domain.verifyingContract) };
  const evmValue = { ...value, owner: tronToEvm(value.owner), spender: tronToEvm(value.spender) };
  const evmHash = ethers.TypedDataEncoder.hash(evmDomain, types, evmValue);
  print.info('ethers.TypedDataEncoder.hash (주소를 0x 로 바꿔 계산)', evmHash);
  const recoveredTyped = evmToTron(ethers.recoverAddress(evmHash, typedSig));
  print.info('그 해시 + tronweb 서명으로 복원한 주소', `${recoveredTyped} (${matchLabel(recoveredTyped, me.address)})`);
  if (recoveredTyped === me.address) print.ok('tronweb signTypedData 와 ethers EIP-712 는 같은 해시에 서명합니다 (TIP-712 = EIP-712, 주소 표기만 다름).');
  print.explain({
    kid: '옆 나라 비티도 같은 규칙으로 종이를 읽어요. 우편함 번호 모양만 달라요.',
    teen: '트론과 EVM 은 서명 규칙이 같고 주소 표기(T… / 0x…)만 다릅니다. 레슨 11에서 다시 봅니다.',
    dev: '검증 서버를 ethers 로 짜도 된다: T→0x 변환 후 TypedDataEncoder.hash + recoverAddress.',
    adult: '같은 열쇠가 여러 나라에서 쓰이므로, 서명 요청의 chainId 가 어느 나라인지도 의미가 있습니다.',
  });

  // ---------- [6] 이 서명이 하는 일 ----------
  print.step('이 서명이 하는 일 — 읽어야 할 필드');
  const rows = [
    ['verifyingContract', domain.verifyingContract, '어느 사탕통(컨트랙트)에 대한 허락인가'],
    ['chainId', String(domain.chainId), '어느 나라(네트워크)에서만 유효한가'],
    ['spender', value.spender, '누가 내 대신 꺼내 갈 수 있나'],
    ['value', `${value.value} (= 3 USDT, decimals 6)`, '얼마까지 꺼내 가도 되나'],
    ['deadline', `${value.deadline} (${new Date(Number(value.deadline) * 1000).toISOString()})`, '언제까지 이 허락이 유효한가'],
  ];
  console.log('  필드                | 이번 서명의 값                                  | 뜻');
  console.log('  --------------------+-------------------------------------------------+------------------------------');
  for (const [field, v, meaning] of rows) console.log(`  ${field.padEnd(19)} | ${v.padEnd(47)} | ${meaning}`);
  print.info('참고', '위 Permit 은 이 레슨의 예시 구조입니다. Nile USDT 컨트랙트가 permit 을 지원하는지는 확인하지 않았습니다(확인 필요).');
  print.warn('Permit 서명 한 장이면 트랜잭션 없이도 spender 에게 value 만큼 허락(approve)이 넘어갈 수 있습니다 (레슨 9에서 approve 를 직접 봅니다).');
  print.warn('읽을 수 없는 hex 만 보이는 서명 요청, value 가 터무니없이 큰 요청, 모르는 spender → 찍지 않습니다.');
  print.ok('규칙 8: 무엇에 도장 찍는지 읽지 못하면 찍지 않는다.');
  print.explain({
    kid: '여우 씨가 빈 종이를 내밀면 안 찍어요. 뭐라고 써 있는지 읽을 수 있어야 찍어요.',
    teen: '가스 0 이라고 안전한 것이 아닙니다. 서명 자체가 권한 이전의 증거가 될 수 있습니다.',
    dev: '서명 = 허락의 증거. 트랜잭션은 다른 사람이 대신 제출할 수도 있다. spender/value/deadline/verifyingContract/chainId 를 UI 에 반드시 표시할 것.',
    adult: '"무료 서명", "에어드랍 확인용 서명"이라며 내용이 안 보이는 요청은 거절하세요.',
  });

  console.log('\n➡️  다음: Lesson 09 사탕통 장부와 허락증(TRC-20) — 이 Permit 이 실제로 어떤 허락(approve)인지 봅니다.');
}

main().catch((error) => {
  console.error('lesson08 실패:', errorMessage(error));
  process.exitCode = 1;
});
