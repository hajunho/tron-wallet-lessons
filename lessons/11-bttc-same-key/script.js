// Lesson 11 — 한 열쇠, 두 나라, 두 경로: BTTC에서도 열려요 (실행: npm run l11)
// 하는 일: 트론 경로(m/44'/195'/0'/0/0) 열쇠를 ethers.Wallet 에 넣어 BTTC(EVM 호환) 주소가
//          T주소의 20바이트와 같은지 확인하고(레슨 2 비티의 예고 회수), BTTC Donau 테스트넷에서
//          잔고·nonce·gasPrice 를 읽은 뒤 BTT 전송 트랜잭션을 오프라인으로 조립·서명해 미리보기를 보여 준다.
//          guard(assertCanSend)를 통과했을 때만 실제로 브로드캐스트한다(기본은 미리보기).
// 환경변수: MNEMONIC(없으면 데모 니모닉으로 자동 대체) · TO(기본 같은 니모닉의 index 1 EVM 주소, T주소도 허용)
//          AMOUNT_BTT(기본 0.001) · SEND_TX(기본 false = 미리보기) · COUNTDOWN(기본 3초) · LEVEL=kid|teen|dev|adult
// 네트워크: BTTC Donau 테스트넷(chainId 1029)만. 메인넷 URL 은 코드에 두지 않는다.

const { ethers } = require('ethers');
const { TronWeb } = require('tronweb');
const { DEMO_MNEMONIC, walletFromMnemonic, describeMnemonic, tronPath, ETH_COIN_TYPE } = require('../../lib/wallet');
const { errorMessage } = require('../../lib/tron');
const { DONAU, createBttcProvider, explorerTx, explorerAddress } = require('../../lib/bttc');
const { assertCanSend, GuardError } = require('../../lib/guard');
const print = require('../../lib/print');

const SIMPLE_TRANSFER_GAS = 21_000n; // EVM 단순 전송의 고정 gas (estimateGas 가 실패할 때의 대체값)
const WAIT_MAX_MS = 30_000; // 영수증 대기 최대 30초

/** 네트워크 오류를 한국어로 안내한다 (429 는 "잠시 후 다시") */
function networkHint(error) {
  const msg = errorMessage(error);
  if (/429|Too Many|rate limit/i.test(msg)) {
    return `요청이 너무 많습니다(429). 잠시 후 다시 실행하세요. (원문: ${msg})`;
  }
  if (/ENOTFOUND|ECONNREFUSED|fetch failed|network|timeout|SERVER_ERROR/i.test(msg)) {
    return `BTTC Donau 노드(${DONAU.rpcUrl})에 연결하지 못했습니다. 인터넷 연결을 확인하세요. (원문: ${msg})`;
  }
  return msg;
}

/** T주소(41…)를 0x 주소로. 레슨 2의 "T주소 안에 0x주소가 숨어 있다"를 코드로 옮긴 것 */
function tronToEvm(tAddress) {
  const hex41 = TronWeb.address.toHex(tAddress); // '41' + 40hex
  return ethers.getAddress('0x' + hex41.slice(2)); // EIP-55 대소문자 체크섬 형태
}

/** TO 환경변수는 0x 주소도, T주소도 받는다 */
function resolveTo(raw, fallback) {
  const value = (raw || '').trim();
  if (!value) return { address: fallback, note: '기본값: 같은 니모닉의 index 1 주소' };
  if (ethers.isAddress(value)) return { address: ethers.getAddress(value), note: 'TO 환경변수(0x)' };
  if (TronWeb.isAddress(value)) return { address: tronToEvm(value), note: `TO 환경변수(T주소 ${value} → 0x 로 변환)` };
  return { address: null, note: value };
}

/** wei → "BTT" 표기 (18자리 소수를 그대로) */
function btt(wei) {
  return `${ethers.formatEther(wei)} BTT`;
}

function printComparison() {
  print.step('비교표 — 트론(Nile) vs BTTC(Donau): 같은 열쇠, 다른 규칙');
  console.log('  항목         | 트론 (Nile 테스트넷)                          | BTTC (Donau 테스트넷)');
  console.log('  -------------+-----------------------------------------------+-----------------------------------------------');
  console.log('  주소 표기    | T… (base58check, 41 + 20바이트 + 체크섬)        | 0x… (20바이트 hex, EIP-55 대소문자 체크섬)');
  console.log('  같은 열쇠    | T주소의 20바이트                               | == 0x주소 (프리픽스만 다름)');
  console.log('  순서·중복    | ref_block_bytes/hash + expiration(60초), nonce 없음 | nonce (계정별 순번, 0부터 1씩)');
  console.log('  수수료       | 대역폭(bytes, 하루 600 무료) · 에너지            | gas × gasPrice (legacy, 단순 전송 21000 gas)');
  console.log('  최소 단위    | 1 TRX = 1,000,000 sun (6자리)                  | 1 BTT = 10^18 wei (18자리)');
  console.log('  해시(ID)     | txID = sha256(raw_data), 서명 전에 정해짐       | hash = keccak256(서명된 RLP), 서명 후 정해짐');
  console.log('  네트워크 표시 | fullHost URL (chainId 3448148188 은 TIP-712 용) | chainId 1029 가 서명 안에 들어감');
  console.log(`  탐색기       | https://nile.tronscan.org/#/transaction/<txid>  | ${DONAU.explorer}/tx/<0xhash>`);
  print.warn('나라(네트워크)는 이름이 아니라 chainId·주소 모양·수수료 규칙까지 다르다. 보내기 전에 상대와 글자까지 맞춘다.');
  print.explain({
    kid: '옆 나라는 열쇠는 같아도 우편함 번호 모양(0x)과 우표 규칙이 달라요. 봉투에 나라 이름을 꼭 써요.',
    teen: '같은 개인키라도 체인마다 주소 표기·순서 규칙·수수료 단위가 다릅니다. chainId 가 서명에 들어가 다른 나라에서는 무효가 됩니다.',
    dev: '트론: nonce 없음, 만료 60초, txID=sha256(raw_data). EVM: nonce, gas×gasPrice, hash=keccak256(signed RLP), chainId 로 재생 방지.',
    adult: '거래소 출금 화면의 "네트워크" 칸이 곧 나라 이름입니다. TRON(TRC20)·BTTC·ERC20 중 상대가 말한 것과 글자까지 같아야 합니다.',
  });
}

async function main() {
  let mnemonic = process.env.MNEMONIC?.trim();
  if (!mnemonic) {
    mnemonic = DEMO_MNEMONIC;
    print.warn('MNEMONIC 이 없어 데모 니모닉(abandon … about)으로 진행합니다. 데모 모드 — 조회·오프라인 서명·미리보기만 합니다.');
  }
  const isDemo = mnemonic === DEMO_MNEMONIC;

  const me = walletFromMnemonic(mnemonic, 0); // 트론 경로 195'
  const defaultTo = walletFromMnemonic(mnemonic, 1).evmAddress;
  const to = resolveTo(process.env.TO, defaultTo);
  const amountBtt = process.env.AMOUNT_BTT || '0.001';
  let valueWei;
  try {
    valueWei = ethers.parseEther(amountBtt);
  } catch {
    valueWei = null;
  }

  console.log(`Lesson 11 — 한 열쇠, 두 나라, 두 경로 · ${DONAU.name} (chainId ${DONAU.chainId})`);
  console.log(`  니모닉:      ${describeMnemonic(mnemonic)}${isDemo ? ' ← 데모 니모닉(공개 값): 미리보기까지만 가능' : ''}`);
  console.log(`  보내는 사람: ${me.evmAddress}  (트론에서는 ${me.address})`);
  console.log(`  받는 사람:   ${to.address ?? '(잘못된 값)'}  ← ${to.note}`);
  console.log(`  금액:        ${amountBtt} BTT${valueWei !== null ? ` (= ${valueWei} wei)` : ''}`);
  console.log(`  SEND_TX:     ${process.env.SEND_TX === 'true' ? 'true (실제 전송 모드!)' : 'false (미리보기 모드, 기본값)'}`);

  if (!to.address) {
    console.log(`❌ 받는 주소가 올바르지 않습니다(0x 주소 또는 T주소): ${to.note}`);
    process.exitCode = 1;
    return;
  }
  if (valueWei === null || valueWei <= 0n) {
    console.log(`❌ AMOUNT_BTT 가 올바르지 않습니다: ${amountBtt}`);
    process.exitCode = 1;
    return;
  }
  const selfSend = to.address.toLowerCase() === me.evmAddress.toLowerCase();
  if (selfSend) {
    print.warn('받는 사람이 나 자신입니다. 트론은 같은 계정으로 보내는 것을 거부하지만(Cannot transfer TRX to the same account), EVM 쪽이 어떻게 처리하는지는 이 저장소에서 확인하지 않았습니다(확인 필요). 수수료만 나가는 일이라 이 스크립트는 미리보기까지만 진행합니다.');
  }

  // ----- [1] 같은 열쇠, 두 나라 -----
  print.step("트론 경로 열쇠를 ethers.Wallet 에 넣으면 — 비티의 예고 회수 (m/44'/195'/0'/0/0)");
  // ethers 는 '0x' 가 있어도 없어도 같은 지갑을 만든다(ethers 6 에서 확인). 여기서는 보기 좋게 붙여 준다.
  const wallet = new ethers.Wallet('0x' + me.privateKey);
  const hex41 = TronWeb.address.toHex(me.address);
  const evmFromT = tronToEvm(me.address);
  print.info('경로', me.path);
  print.info('개인키', print.mask(me.privateKey));
  print.info('T주소 (트론 마을 우편함)', me.address);
  print.info("TronWeb.address.toHex → '41' + 20바이트", hex41);
  print.info("'41' 을 떼고 '0x' 를 붙이면", evmFromT);
  print.info('ethers.Wallet(같은 개인키).address', wallet.address);
  print.info('lib/wallet 의 evmAddress', me.evmAddress);
  const same = wallet.address === evmFromT && evmFromT === me.evmAddress;
  if (same) print.ok('세 값이 모두 같다. 레슨 2에서 비티가 말한 "네 우편함 번호 안에 우리 나라 번호가 숨어 있어!"가 이것이다.');
  else throw new Error(`주소가 서로 다릅니다: ${wallet.address} / ${evmFromT} / ${me.evmAddress}`);
  print.explain({
    kid: '토리 열쇠 하나로 옆 나라 우편함도 열려요. T 번호 안에 숨어 있던 0x 번호가 옆 나라 번호였어요.',
    teen: '트론 주소 = 0x41 + keccak256(공개키)[-20:] + 체크섬. 0x41 과 체크섬을 빼면 EVM 주소 그대로입니다. 열쇠가 같으니 주소도 같습니다.',
    dev: "new ethers.Wallet('0x' + pk).address === ethers.getAddress('0x' + TronWeb.address.toHex(T).slice(2)). secp256k1 + keccak256 이 양쪽 다 같기 때문.",
    adult: '지갑 앱에서 BTTC 네트워크로 바꾸면 주소가 T… 에서 0x… 로 보입니다. 모양이 달라져도 열쇠와 주인은 같습니다.',
  });

  // ----- [2] 이더리움 경로 -----
  print.step("이더리움 경로(coin_type 60')로 만들면 다른 주소 — 지갑 앱마다 경로가 다를 수 있다");
  const ethPath = `m/44'/${ETH_COIN_TYPE}'/0'/0/0`;
  const ethNode = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, ethPath);
  print.info(`트론 경로 ${tronPath(0)}`, `${me.evmAddress}  (T 표기 ${me.address})`);
  print.info(`이더 경로 ${ethPath}`, `${ethNode.address}  (T 표기 ${TronWeb.address.fromPrivateKey(ethNode.privateKey.slice(2))})`);
  if (ethNode.address !== me.evmAddress) print.ok('같은 12단어라도 경로가 다르면 열쇠가 다르고 주소도 다르다.');
  else print.warn('두 경로의 주소가 같습니다 — 예상 밖의 결과입니다');
  print.warn("BTTC 는 EVM 이라 어떤 지갑 앱은 60' 경로를, 트론 지갑 앱은 195' 경로를 쓸 수 있다. 복구 후 잔고가 0으로 보이면 경로부터 의심한다(확인 필요).");
  print.explain({
    kid: '같은 주문이라도 길이 다르면 다른 우편함으로 가요. 같은 주문, 다른 길이에요. 어느 길로 갔는지 기억해 두어요.',
    teen: "경로의 coin_type 숫자(195 vs 60) 하나로 열쇠가 완전히 달라집니다. 이 레슨은 두 주소를 모두 Donau 에서 조회해 봅니다.",
    dev: "HDNodeWallet.fromPhrase(m, undefined, \"m/44'/60'/0'/0/0\"). 데모 니모닉이면 0x9858… (T 표기 TPrkFhZ8…). 195' 는 0xC859… (TUEZ…).",
    adult: '"복구했더니 BTTC 잔고가 안 보여요"의 흔한 원인이 경로 차이입니다. 12단어가 틀린 게 아닐 수 있습니다.',
  });

  // ----- [3] Donau 읽기 -----
  print.step(`옆 나라 장부 읽기 — chainId · 잔고 · nonce · gasPrice · estimateGas (${DONAU.rpcUrl})`);
  const provider = createBttcProvider();
  let nonce;
  let gasPrice;
  let gasLimit;
  let balanceWei;
  try {
    const [network, blockNumber, balance, ethBalance, myNonce, ethNonce, feeData] = await Promise.all([
      provider.getNetwork(),
      provider.getBlockNumber(),
      provider.getBalance(me.evmAddress),
      provider.getBalance(ethNode.address),
      provider.getTransactionCount(me.evmAddress),
      provider.getTransactionCount(ethNode.address),
      provider.getFeeData(),
    ]);
    balanceWei = balance;
    nonce = myNonce;
    gasPrice = feeData.gasPrice;
    print.info('chainId', `${network.chainId} ${Number(network.chainId) === DONAU.chainId ? '(= DONAU.chainId, 나라 이름이 맞다)' : '(!! DONAU.chainId 와 다르다)'}`);
    if (Number(network.chainId) !== DONAU.chainId) {
      console.log(`❌ 연결된 노드의 chainId 가 ${DONAU.chainId} 이 아닙니다. BTTC_RPC_URL 을 확인하세요.`);
      process.exitCode = 1;
      return;
    }
    print.info('최신 블록', blockNumber);
    print.info(`잔고 (트론 경로 ${me.evmAddress.slice(0, 8)}…)`, `${btt(balance)} (${balance} wei)`);
    print.info(`잔고 (이더 경로 ${ethNode.address.slice(0, 8)}…)`, `${btt(ethBalance)}`);
    print.info(`nonce (트론 경로)`, `${myNonce} ← 이 계정이 지금까지 보낸 트랜잭션 수. 다음 봉투의 번호`);
    print.info(`nonce (이더 경로)`, `${ethNonce}`);
    print.info('gasPrice', `${gasPrice} wei (= ${ethers.formatUnits(gasPrice, 'gwei')} gwei)`);
    print.info('EIP-1559 필드', `maxFeePerGas ${feeData.maxFeePerGas} → legacy(type 0) 트랜잭션만 쓴다`);
    try {
      gasLimit = await provider.estimateGas({ from: me.evmAddress, to: to.address, value: valueWei });
      print.info('estimateGas', `${gasLimit} gas`);
    } catch (error) {
      gasLimit = SIMPLE_TRANSFER_GAS;
      print.warn(`estimateGas 실패: ${networkHint(error)} → 단순 전송 고정값 ${SIMPLE_TRANSFER_GAS} gas 로 계산합니다.`);
      print.info('참고', '옆 나라에도 리허설(estimateGas)이 있다. 잔고가 모자라면 리허설 단계에서 먼저 넘어진다.');
    }
    const feeWei = gasLimit * gasPrice;
    print.info('예상 수수료', `${gasLimit} gas × ${gasPrice} wei = ${feeWei} wei = ${btt(feeWei)}`);
    print.info('필요 합계', `${btt(valueWei + feeWei)} (금액 ${amountBtt} + 수수료 ${ethers.formatEther(feeWei)})`);
    if (balance < valueWei + feeWei) {
      print.warn(`잔고 ${btt(balance)} 로는 부족하다. 미리보기(오프라인 서명)는 계속하고, 실제 전송은 하지 않는다. faucet: ${DONAU.faucet}`);
    } else {
      print.ok(`잔고 ${btt(balance)} ≥ 필요 합계. 보낼 수 있다.`);
    }
    print.info('탐색기', explorerAddress(me.evmAddress));
  } catch (error) {
    console.log('❌ Donau 조회 실패:', networkHint(error));
    process.exitCode = 1;
    return;
  }
  print.explain({
    kid: '옆 나라 장부를 봤어요. 우표 값이 트론 마을보다 훨씬 커 보여요. 봉투마다 번호(순서)도 붙여야 해요.',
    teen: '수수료 = gas × gasPrice. 단순 전송 21000 gas 에 Donau gasPrice 를 곱하면 BTT 로 수십~수백 개가 나옵니다. 큰 수여도 테스트넷 수치입니다.',
    dev: 'getTransactionCount 가 nonce. getFeeData().maxFeePerGas 가 null 이면 legacy 만 지원. estimateGas 는 잔고 부족이면 예외.',
    adult: 'BTTC 는 수수료 숫자가 커 보입니다(18자리 단위라서입니다. 값어치는 이 레슨에서 다루지 않습니다). 앱이 보여 주는 "네트워크 수수료" 칸이 바로 이 값입니다.',
  });

  // ----- [4] 오프라인 조립·서명 -----
  print.step('봉투 만들기 → 도장 찍기 (오프라인) — nonce · gasPrice · chainId 가 봉투에 들어간다');
  let signedRaw;
  let txHash;
  try {
    const txRequest = { to: to.address, value: valueWei, gasLimit, gasPrice, nonce, chainId: DONAU.chainId, type: 0 };
    signedRaw = await wallet.signTransaction(txRequest);
    const parsed = ethers.Transaction.from(signedRaw);
    txHash = ethers.keccak256(signedRaw);
    console.log('  ┌ 미리보기 ───────────────────────────────────────────────');
    console.log(`  │ 네트워크    ${DONAU.name} (chainId ${parsed.chainId})`);
    console.log(`  │ 종류        type ${parsed.type} (legacy)`);
    console.log(`  │ 보내는 사람 ${parsed.from}`);
    console.log(`  │ 받는 사람   ${parsed.to}`);
    console.log(`  │ 금액        ${btt(parsed.value)} (${parsed.value} wei)`);
    console.log(`  │ nonce       ${parsed.nonce}`);
    console.log(`  │ gasLimit    ${parsed.gasLimit}`);
    console.log(`  │ gasPrice    ${parsed.gasPrice} wei`);
    console.log(`  │ 유효기간    없음 (nonce 로 순서·중복을 막는다. 트론의 60초 expiration 과 다름)`);
    console.log(`  │ 서명 전     ${(parsed.unsignedSerialized.length - 2) / 2} bytes (RLP)`);
    console.log(`  │ 서명 후     ${(signedRaw.length - 2) / 2} bytes (RLP + v,r,s)`);
    console.log(`  │ hash        ${txHash}`);
    console.log('  └────────────────────────────────────────────────────────');
    print.info('hash 검산', parsed.hash === txHash ? 'keccak256(서명된 RLP) == Transaction.hash (서명 후에야 정해진다)' : '불일치(!)');
    print.info('서명자 복원', parsed.from === wallet.address ? `서명에서 복원한 주소 == ${wallet.address}` : '불일치(!)');
    print.info('탐색기(보낸 뒤)', explorerTx(txHash));
  } catch (error) {
    console.log('❌ 트랜잭션 조립/서명 실패:', networkHint(error));
    process.exitCode = 1;
    return;
  }
  print.explain({
    kid: '옆 나라 봉투에는 나라 이름(1029)과 순서 번호를 써요. 도장은 트론 마을과 같은 열쇠로 찍어요.',
    teen: 'chainId 가 서명 안에 들어가서, 같은 봉투를 다른 나라(다른 chainId)에 넣으면 서명이 맞지 않아 거부됩니다. 나라 이름을 글자까지 맞추는 이유입니다.',
    dev: 'wallet.signTransaction({ to, value, gasLimit, gasPrice, nonce, chainId, type: 0 }) → 0x RLP. hash = keccak256(signed). Transaction.from(raw).from 으로 서명자 복원.',
    adult: '앱의 확인 화면에서 "네트워크"가 상대가 말한 것과 같은지 보세요. 같은 주소 모양(0x)이라도 나라가 다르면 다른 장부입니다.',
  });

  // ----- [5] 관문 -----
  print.step('관문 통과 확인 — assertCanSend (host = Donau RPC)');
  try {
    await assertCanSend({ mnemonic, host: DONAU.rpcUrl, what: 'BTT 전송' });
    print.ok('관문 통과. 이제 되돌릴 수 없는 단계로 들어갑니다.');
  } catch (error) {
    if (error instanceof GuardError) {
      print.warn(error.message);
      console.log('\n🛑 미리보기 종료 — 아무것도 보내지 않았습니다. 옆 나라 장부에도 아무 흔적이 없습니다.');
      console.log('   실제로 보내려면(연습용 니모닉 + Donau + BTT 잔고 필요): SEND_TX=true npm run l11');
      print.explain({
        kid: '옆 나라 우체통 앞에서도 한 번 더 멈췄어요. 넣으면 못 꺼내는 건 똑같아요.',
        teen: '미리보기(SEND_TX=false)가 기본값입니다. guard 는 host 가 메인넷(rpc.bittorrentchain.io)이어도 막습니다.',
        dev: 'GuardError 는 정상 흐름. exit 0. assertCanSend 의 host 검사에 BTTC 메인넷 호스트도 들어 있다.',
        adult: '보내기 직전 "정말 보낼까요?" 화면에서 멈춘 것과 같습니다.',
      });
      printComparison();
      console.log('\n➡️ 다음: Lesson 12 실패 탐정 — 반송 도장(에러 메시지)을 읽고 원인을 찾습니다.');
      return;
    }
    throw error;
  }

  // ----- [6] 브로드캐스트 (SEND_TX=true, 연습용 니모닉, 잔고 충분할 때만) -----
  print.step('우체통에 넣기 — provider.broadcastTransaction → wait (최대 30초)');
  if (selfSend) {
    console.log('❌ 자기 자신에게 보내는 설정이라 미리보기까지만 진행합니다. TO 를 다른 주소로 바꾸세요.');
    printComparison();
    console.log('\n➡️ 다음: Lesson 12 실패 탐정 — 반송 도장(에러 메시지)을 읽고 원인을 찾습니다.');
    return;
  }
  if (balanceWei < valueWei + gasLimit * gasPrice) {
    console.log(`❌ BTT 잔고가 부족해 보내지 않습니다. faucet: ${DONAU.faucet}`);
    process.exitCode = 1;
    return;
  }
  try {
    const response = await provider.broadcastTransaction(signedRaw);
    print.ok(`브로드캐스트 성공. hash ${response.hash}`);
    print.info('탐색기', explorerTx(response.hash));
    // confirms=1 이므로 wait 은 null 을 돌려주지 않는다. 시간이 지나면 code 'TIMEOUT' 예외가 온다.
    const receipt = await response.wait(1, WAIT_MAX_MS);
    print.ok(`블록 ${receipt.blockNumber} 에 기록됨 (status ${receipt.status})`);
    print.info('gasUsed', `${receipt.gasUsed} gas`);
    print.info('실제 수수료', btt(receipt.gasUsed * receipt.gasPrice));
  } catch (error) {
    if (error?.code === 'TIMEOUT') {
      // 이미 우체통에 들어갔을 수 있다. 실패로 표시하지 않는다.
      print.warn(`30초 안에 영수증이 나오지 않았습니다. 이미 보냈을 수 있으니 탐색기에서 hash ${txHash} 로 확인하세요: ${explorerTx(txHash)}`);
    } else {
      console.log('❌ 브로드캐스트 실패:', networkHint(error));
      process.exitCode = 1;
    }
    return;
  }
  print.explain({
    kid: '옆 나라 우체통에 넣었어요. 영수증에는 몇 번째 장, 우표 값이 적혀 있어요.',
    teen: 'EVM 은 브로드캐스트 응답이 hash 문자열이고, 실패는 예외로 옵니다. wait() 가 영수증을 기다립니다.',
    dev: "broadcastTransaction(signedRaw) → TransactionResponse. wait(1, 30000) → receipt. 시간 초과는 code 'TIMEOUT' 예외이므로 '실패'로 표시하지 않는다.",
    adult: '"보냈다"는 말 대신 hash(0x…)를 남기세요. BTTC 탐색기에서 이 값으로 찾습니다.',
  });

  printComparison();
  console.log('\n➡️ 다음: Lesson 12 실패 탐정 — 반송 도장(에러 메시지)을 읽고 원인을 찾습니다.');
}

main().catch((error) => {
  console.error('lesson11 실패:', errorMessage(error));
  process.exitCode = 1;
});
