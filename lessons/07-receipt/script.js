// Lesson 07 — 영수증과 발자국 (실행: npm run l07)
// "보냈다"는 말 대신 txID로 영수증(getTransactionInfo)을 읽는다.
// 영수증에는 들어간 블록, 수수료(대역폭/에너지), 결과(SUCCESS/REVERT), 발자국(이벤트 로그)이 남는다.
// Nile 테스트넷 읽기 전용. 아무것도 보내지 않는다.
// 환경변수: TXID(볼 트랜잭션 ID, 64자리 16진수. 없으면 .last-tx.json → 없으면 최근 블록에서 로그가 있는 컨트랙트 호출을 자동 선택)
//           MNEMONIC(이 레슨은 쓰지 않음. 없으면 데모 모드 안내만 출력), LEVEL=kid|teen|dev|adult
const fs = require('node:fs');
const path = require('node:path');
const { TronWeb } = require('tronweb');
const { NILE, createTronWeb, sunToTrx, explorerTx, explorerAddress, errorMessage, formatUnits, topicToAddress, logAddressToBase58 } = require('../../lib/tron');
const { DEMO_MNEMONIC } = require('../../lib/wallet');
const print = require('../../lib/print');

const TRANSFER_TOPIC = TronWeb.sha3('Transfer(address,address,uint256)').replace(/^0x/, '');
const USDT_HEX40 = TronWeb.address.toHex(NILE.usdt).slice(2).toLowerCase(); // 로그 address 는 '41' 없는 40hex
const LAST_TX_FILE = path.join(__dirname, '..', '..', '.last-tx.json');

/** 네트워크 오류를 사람이 읽는 한국어로 */
function describeNetworkError(error) {
  const msg = errorMessage(error);
  if (/429|Too Many|rate/i.test(msg)) return 'Nile 노드가 요청 제한(429)에 걸렸습니다. 잠시 후 다시 실행하세요.';
  if (/ENOTFOUND|ECONN|fetch failed|network/i.test(msg)) return `네트워크 연결에 실패했습니다 (${msg}). 인터넷 연결을 확인하세요.`;
  return msg;
}

function toKst(ms) {
  return new Date(ms).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false }) + ' (KST)';
}

/**
 * txID 는 반드시 64자리 16진수여야 한다.
 * 글자가 섞이면 노드는 예외가 아니라 `{ Error: '... INVALID hex String' }` 객체를 돌려주므로
 * 그대로 진행하면 blockNumber: undefined, fee 0 같은 엉뚱한 영수증이 찍힌다. 그래서 먼저 형식을 막는다.
 */
function normalizeTxId(raw, source) {
  const txid = String(raw ?? '').trim().replace(/^0x/, '');
  if (!/^[0-9a-f]{64}$/i.test(txid)) {
    throw new Error(
      `TXID 는 64자리 16진수(0-9, a-f)여야 합니다. 받은 값은 "${txid}" (${txid.length}글자, 출처: ${source}) 입니다. ` +
        '탐색기 주소 …/#/transaction/ 뒤의 64글자를 공백 없이 다시 복사하세요.',
    );
  }
  return txid;
}

/** 1) TXID 환경변수 → 2) .last-tx.json(레슨 6이 남긴 파일) → 3) 최근 블록 자동 탐색 */
async function pickTxId(tronWeb) {
  if (process.env.TXID) {
    print.info('출처', 'TXID 환경변수');
    return normalizeTxId(process.env.TXID, 'TXID 환경변수');
  }
  if (fs.existsSync(LAST_TX_FILE)) {
    let saved = null;
    try {
      saved = JSON.parse(fs.readFileSync(LAST_TX_FILE, 'utf8'));
    } catch {
      print.warn('.last-tx.json 을 읽지 못해 자동 탐색으로 넘어갑니다.');
    }
    if (saved?.txid) {
      print.info('출처', `.last-tx.json (레슨 6에서 보낸 트랜잭션, ${saved.at ?? '시각 없음'})`);
      return normalizeTxId(saved.txid, '.last-tx.json');
    }
  }
  print.info('출처', '최근 블록 자동 탐색 (TXID 도 .last-tx.json 도 없음)');
  const head = await tronWeb.trx.getCurrentBlock();
  const headNumber = head.block_header.raw_data.number;
  // 영수증(receipt)은 몇 블록 뒤에 생기므로 최신보다 25블록 앞에서 시작해 최대 60블록을 거슬러 본다
  let fallback = null;
  let infoCalls = 0;
  for (let number = headNumber - 25; number > headNumber - 85 && infoCalls < 40; number -= 1) {
    const block = await tronWeb.trx.getBlock(number);
    for (const tx of block.transactions ?? []) {
      const contract = tx.raw_data?.contract?.[0];
      if (contract?.type !== 'TriggerSmartContract' || tx.ret?.[0]?.contractRet !== 'SUCCESS') continue;
      infoCalls += 1;
      const info = await tronWeb.trx.getTransactionInfo(tx.txID);
      if (!info.log?.length) continue;
      if (info.log.some((l) => l.topics?.[0] === TRANSFER_TOPIC)) {
        print.info('선택', `블록 ${number} 의 컨트랙트 호출 (Transfer 발자국 있음)`);
        return tx.txID;
      }
      fallback ??= { number, txID: tx.txID };
      if (infoCalls >= 40) break;
    }
  }
  if (fallback) {
    print.info('선택', `블록 ${fallback.number} 의 컨트랙트 호출 (발자국 있음, Transfer 는 아님)`);
    return fallback.txID;
  }
  throw new Error('최근 블록에서 발자국(로그)이 있는 트랜잭션을 찾지 못했습니다. TXID=<txid> 를 지정해 다시 실행하세요.');
}

function explainReceipt(receipt) {
  const r = receipt ?? {};
  const netUsage = r.net_usage ?? 0;
  const netFee = r.net_fee ?? 0;
  const energyTotal = r.energy_usage_total ?? 0;
  const energyFee = r.energy_fee ?? 0;
  const energyUsage = r.energy_usage ?? 0;
  print.info('receipt.net_usage', `${netUsage} bytes — 무료·스테이킹 대역폭으로 낸 몫 (0이면 필드가 생략됨)`);
  print.info('receipt.net_fee', `${netFee} sun = ${sunToTrx(netFee)} TRX — 대역폭이 모자라 TRX 를 태운 몫 (1000 sun/byte)`);
  if (energyTotal || energyFee || r.result) {
    print.info('receipt.energy_usage_total', `${energyTotal} energy — 컨트랙트 실행에 쓴 에너지 전체`);
    print.info('receipt.energy_usage', `${energyUsage} energy — 그중 내 스테이킹 에너지로 낸 몫 (확인 필요)`);
    print.info('receipt.origin_energy_usage', `${r.origin_energy_usage ?? 0} energy — 컨트랙트 배포자 쪽에서 낸 몫 (확인 필요)`);
    print.info('receipt.energy_fee', `${energyFee} sun = ${sunToTrx(energyFee)} TRX — 에너지가 모자라 TRX 를 태운 몫 (100 sun/energy)`);
    print.info('receipt.result', `${r.result ?? '(없음)'} — 컨트랙트 실행 결과`);
  } else {
    print.info('receipt.energy_*', '없음 — 단순 TRX 전송은 에너지를 쓰지 않습니다');
  }
  return { netFee, energyFee };
}

async function main() {
  console.log('Lesson 07 · 영수증과 발자국 — 규칙 7: "보냈다"는 말 대신 txID로 영수증을 본다.');
  console.log(`네트워크: ${NILE.name} (${NILE.fullHost}) · 읽기 전용, 아무것도 보내지 않습니다.`);
  const envMnemonic = process.env.MNEMONIC?.trim();
  if (!envMnemonic) {
    console.log('ℹ️  데모 모드: MNEMONIC 이 없어도 됩니다. 이 레슨은 열쇠를 쓰지 않고 장부만 읽습니다.');
  } else if (envMnemonic === DEMO_MNEMONIC) {
    console.log('ℹ️  데모 모드: 데모 니모닉이 설정돼 있지만, 이 레슨은 열쇠를 쓰지 않고 장부만 읽습니다.');
  } else {
    console.log('ℹ️  MNEMONIC 이 설정돼 있지만 이 레슨은 쓰지 않습니다 (읽기 전용).');
  }
  const tronWeb = createTronWeb();

  print.step('영수증을 찾을 봉투 번호(txID) 정하기');
  let txid;
  try {
    txid = await pickTxId(tronWeb);
  } catch (error) {
    throw new Error(describeNetworkError(error));
  }
  print.info('txID', txid);
  print.explain({
    kid: '친구가 "보냈어!"라고만 하면 몰라요. 봉투 번호를 받아서 영수증을 찾아요.',
    teen: 'txID 는 봉투 내용의 sha256 이라 도장 전에 정해집니다. 이 번호 하나로 누구나 같은 영수증을 봅니다.',
    dev: 'txID(64hex) 하나면 getTransaction / getTransactionInfo / 이벤트 API 를 모두 조회할 수 있다.',
    adult: '"보냈어요" 캡처 대신 txID(64글자)를 요구하세요. 캡처는 꾸밀 수 있지만 txID 는 장부와 대조됩니다.',
  });

  print.step('getTransaction — 봉투 자체 (무엇을, 누가 도장 찍었나)');
  let tx;
  try {
    tx = await tronWeb.trx.getTransaction(txid);
  } catch (error) {
    const msg = errorMessage(error);
    if (/Transaction not found/i.test(msg)) {
      throw new Error(`장부에 없는 txID 입니다 (Transaction not found). 번호를 다시 확인하세요: ${txid}`);
    }
    throw new Error(describeNetworkError(error));
  }
  // 노드는 형식이 틀린 txID 에 예외가 아니라 { Error: '... INVALID hex String' } 을 돌려준다
  if (tx?.Error || !tx?.txID) {
    throw new Error(`노드가 이 txID 를 거부했습니다: ${tx?.Error ?? '응답에 txID 가 없습니다'} — 받은 값: ${txid}`);
  }
  const contract = tx.raw_data?.contract?.[0];
  print.info('ret[0].contractRet', tx.ret?.[0]?.contractRet ?? '(없음)');
  print.info('contract.type', contract?.type ?? '(없음)');
  print.info('서명 수', `${tx.signature?.length ?? 0}개 (signature 배열 길이, 멀티시그면 2개 이상 — 확인 필요)`);
  if (contract?.type === 'TriggerSmartContract') {
    const v = contract.parameter.value;
    print.info('호출자(owner_address)', TronWeb.address.fromHex(v.owner_address));
    print.info('컨트랙트(contract_address)', TronWeb.address.fromHex(v.contract_address));
    print.info('data 앞 4바이트(함수 선택자)', String(v.data ?? '').slice(0, 8) || '(없음)');
    print.info('fee_limit', `${tx.raw_data.fee_limit ?? 0} sun = ${sunToTrx(tx.raw_data.fee_limit ?? 0)} TRX (에너지 소각 상한)`);
  } else if (contract?.type === 'TransferContract') {
    const v = contract.parameter.value;
    print.info('보낸 사람', TronWeb.address.fromHex(v.owner_address));
    print.info('받는 사람', TronWeb.address.fromHex(v.to_address));
    print.info('금액', `${v.amount} sun = ${sunToTrx(v.amount)} TRX`);
  }
  print.explain({
    kid: '봉투에는 누가 누구에게 보냈는지 적혀 있어요. 하지만 "성공"은 영수증에서 봐요.',
    teen: 'getTransaction 은 봉투(raw_data)와 도장(signature)을 돌려줍니다. contractRet 이 SUCCESS 가 아니면 실패한 봉투입니다.',
    dev: 'getTransaction = raw_data + signature + ret. 수수료·블록·로그는 여기 없고 getTransactionInfo 에 있다.',
    adult: '앱 화면의 "전송 완료"는 봉투를 우체통에 넣었다는 뜻일 뿐, 장부에 SUCCESS 로 적혔는지는 영수증에서 확인하세요.',
  });

  print.step('getTransactionInfo — 우체국 영수증(receipt)');
  let info;
  try {
    info = await tronWeb.trx.getTransactionInfo(txid);
  } catch (error) {
    throw new Error(describeNetworkError(error));
  }
  if (info?.Error) {
    throw new Error(`노드가 영수증 조회를 거부했습니다: ${info.Error} — 받은 값: ${txid}`);
  }
  if (!info || Object.keys(info).length === 0) {
    print.warn('영수증이 아직 비어 있습니다({}). 방금 보낸 봉투는 몇 블록(3초씩) 뒤에야 영수증이 나옵니다. 잠시 후 다시 실행하세요.');
    console.log('\n➡️ 다음: Lesson 08 — \'나야\'라고 증명하기(돈은 안 들어요)');
    return;
  }
  print.info('blockNumber', `${info.blockNumber} (장부의 몇 번째 장에 적혔나)`);
  print.info('blockTimeStamp', `${info.blockTimeStamp} ms → ${toKst(info.blockTimeStamp)}`);
  print.info('fee', `${info.fee ?? 0} sun = ${sunToTrx(info.fee ?? 0)} TRX (실제로 태운 TRX 전체)`);
  const { netFee, energyFee } = explainReceipt(info.receipt);
  if ((info.fee ?? 0) === netFee + energyFee) {
    print.ok(`fee = net_fee + energy_fee = ${netFee} + ${energyFee} = ${info.fee ?? 0} sun`);
  } else {
    print.warn(`fee(${info.fee ?? 0}) 와 net_fee + energy_fee(${netFee + energyFee}) 가 다릅니다 — 다른 수수료(활성화·메모 등)가 섞였을 수 있습니다`);
  }
  if (info.contractResult) print.info('contractResult', info.contractResult.map((r) => (r === '' ? '(빈 값)' : r.slice(0, 64))).join(', '));
  print.explain({
    kid: '영수증에는 몇 번째 장에 적혔는지, 우표 요금이 얼마인지, 성공했는지가 찍혀 있어요.',
    teen: '수수료는 두 종류입니다. 대역폭(바이트) 값과 에너지(컨트랙트 실행) 값. 무료·스테이킹으로 낸 몫은 usage, TRX 를 태운 몫은 fee 입니다.',
    dev: 'receipt.result 와 ret[0].contractRet 이 SUCCESS 인지, fee(sun) 가 예상 범위인지 여기서 본다. REVERT 여도 fee 는 나간다.',
    adult: '탐색기의 "수수료" 칸이 바로 이 fee 입니다. 결과가 SUCCESS 가 아니면 돈은 안 갔지만 수수료는 나갔을 수 있습니다.',
  });

  print.step('확정(solidified) 여부 — 뒤에 장이 충분히 붙었나');
  try {
    const confirmed = await tronWeb.trx.getConfirmedCurrentBlock();
    const current = await tronWeb.trx.getCurrentBlock();
    const confirmedNumber = confirmed.block_header.raw_data.number;
    const currentNumber = current.block_header.raw_data.number;
    print.info('현재 블록', currentNumber);
    print.info('확정 블록', `${confirmedNumber} (현재보다 ${currentNumber - confirmedNumber} 장 뒤)`);
    if (info.blockNumber <= confirmedNumber) {
      print.ok(`확정됨: 영수증 블록 ${info.blockNumber} ≤ 확정 블록 ${confirmedNumber} (${confirmedNumber - info.blockNumber} 장 더 붙음)`);
    } else {
      print.warn(`아직 미확정: 영수증 블록 ${info.blockNumber} > 확정 블록 ${confirmedNumber}. 조금 더 기다리세요.`);
    }
  } catch (error) {
    print.warn(`확정 블록 조회 실패: ${describeNetworkError(error)}`);
  }
  print.explain({
    kid: '새 장이 붙자마자는 아직이에요. 뒤에 장이 여러 장 더 붙어야 "확정된 장"이에요.',
    teen: '최신 블록과 확정 블록의 차이를 숫자로 확인하세요. 큰 금액을 받을 때는 확정 블록 안에 들어왔는지 봅니다.',
    dev: 'getConfirmedCurrentBlock 은 solidified 블록. 영수증 blockNumber ≤ 확정 블록이면 되돌아갈 일이 없다고 본다.',
    adult: '입금을 확인할 때는 "들어왔다"가 아니라 "확정됐다"까지 보세요. 탐색기에서도 확정 표시를 봅니다.',
  });

  print.step('발자국(이벤트 로그) 직접 읽기 — topics 와 data');
  const logs = info.log ?? [];
  if (!logs.length) {
    print.info('log', '없음 — 단순 TRX 전송이나 이벤트를 내지 않는 호출은 발자국을 남기지 않습니다');
  }
  print.info('Transfer 토픽', `sha3('Transfer(address,address,uint256)') = ${TRANSFER_TOPIC}`);
  logs.forEach((log, i) => {
    const contractAddress = logAddressToBase58(log.address);
    console.log(`  log[${i}]`);
    print.info('    컨트랙트', `${contractAddress} (address ${log.address})`);
    print.info('    topics 수', `${log.topics?.length ?? 0}개, data ${((log.data ?? '').length / 2)} bytes`);
    const topic0 = log.topics?.[0];
    if (topic0 === TRANSFER_TOPIC && (log.topics?.length ?? 0) >= 3) {
      const from = topicToAddress(log.topics[1]);
      const to = topicToAddress(log.topics[2]);
      const raw = BigInt('0x' + (log.data || '0'));
      const isUsdt = log.address.toLowerCase() === USDT_HEX40;
      console.log('    ✅ topics[0] == Transfer 토픽 → Transfer(from, to, value) 발자국');
      print.info('    from (topics[1])', from);
      print.info('    to   (topics[2])', to);
      print.info('    value (data)', `${raw.toString()} (raw, 최소 단위)`);
      if (isUsdt) {
        print.info('    Nile USDT 라서 decimals 6 적용', `${formatUnits(raw, 6)} USDT`);
      } else {
        print.info('    decimals', '이 로그만으로는 알 수 없음 — 컨트랙트의 decimals() 를 따로 조회해야 사람이 읽는 수가 됩니다');
      }
    } else {
      print.info('    topics[0]', `${topic0 ?? '(없음)'} — Transfer 토픽과 다름 (다른 이벤트)`);
    }
  });
  print.explain({
    kid: '자판기를 쓴 봉투에는 발자국이 남아요. 누가, 누구에게, 몇 알을 옮겼는지 발자국에 적혀 있어요.',
    teen: 'topics[0] 은 이벤트 이름의 해시입니다. 같은 이름이면 어느 컨트랙트든 같은 값이라, 이 값으로 Transfer 인지 알아냅니다.',
    dev: 'log.address 는 41 없는 40hex, topics 는 0x 없는 64hex. indexed 인자는 topics, 나머지는 data. decimals 는 로그에 없다.',
    adult: '탐색기의 "토큰 전송" 탭이 이 발자국을 예쁘게 보여 주는 것입니다. 발자국이 없으면 토큰은 움직이지 않은 것입니다.',
  });

  print.step('TronGrid 이벤트 API 와 대조 — getEventsByTransactionID');
  try {
    const events = await tronWeb.event.getEventsByTransactionID(txid);
    const list = events?.data ?? [];
    print.info('이벤트 수', `${list.length}개 (success: ${events?.success})`);
    list.forEach((ev, i) => {
      const named = Object.entries(ev.result ?? {}).filter(([k]) => !/^\d+$/.test(k));
      console.log(`  event[${i}] ${ev.event_name} @ ${ev.contract_address} (block ${ev.block_number})`);
      named.forEach(([k, v]) => {
        const s = String(v);
        // TronGrid 는 주소를 0x 형식으로 돌려준다 → 41 을 붙여 T 주소로 바꿔 5단계와 비교
        const asT = /^0x[0-9a-fA-F]{40}$/.test(s) ? ` = ${TronWeb.address.fromHex('41' + s.slice(2))}` : '';
        print.info(`    ${k}`, s + asT);
      });
    });
    if (logs.length === 0 && list.length === 0) {
      print.info('이벤트', '없음 — 발자국이 없으니 이벤트도 없는 것이 정상입니다 (단순 TRX 전송)');
    } else if (list.length === logs.length) {
      print.ok(`로그 ${logs.length}개 = 이벤트 ${list.length}개 — 내가 직접 읽은 발자국과 TronGrid 가 ABI 로 풀어 준 결과가 같은 봉투를 가리킵니다`);
    } else {
      print.warn(`로그 ${logs.length}개, 이벤트 ${list.length}개 — 수가 다르면 TronGrid 가 아직 색인 중이거나 ABI 가 없는 컨트랙트입니다`);
    }
  } catch (error) {
    print.warn(`이벤트 API 조회 실패: ${describeNetworkError(error)}`);
  }

  print.step('탐색기에서 같은 영수증 보기');
  print.info('트랜잭션', explorerTx(txid));
  if (contract?.type === 'TriggerSmartContract') {
    print.info('컨트랙트 주소', explorerAddress(TronWeb.address.fromHex(contract.parameter.value.contract_address)));
  }
  print.ok('규칙 7: "보냈다"는 말 대신 txID로 영수증을 본다.');
  console.log('\n➡️ 다음: Lesson 08 — \'나야\'라고 증명하기(돈은 안 들어요)');
}

main().catch((error) => {
  console.error('lesson07 실패:', errorMessage(error));
  process.exitCode = 1;
});
