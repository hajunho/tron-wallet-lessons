# Lesson 07. 영수증과 발자국 — 규칙 7: "보냈다"는 말 대신 txID로 영수증을 본다.

> 🧭 한 줄 지도: 레슨 6에서 도장 찍은 봉투를 연습 나라 우체통에 넣었고(브로드캐스트) 되돌릴 수 없다는 것을 배웠다 → 이번엔 그 봉투 번호(txID)로 우체국 영수증(receipt)을 찾아 수수료·결과·발자국(이벤트 로그)을 읽는다. (wallet-practice 대응: Lesson 10)
> 대상별 바로가기: [🧒 이야기](#story) · [✋ 손으로](#hands) · [🔍 원리](#why) · [💻 코드](#code) · [🏠 내 생활](#life) · [🛡️ 안전 카드](#card) · [✅ 확인](#check)

## 🧒 이야기로 시작 <a id="story"></a>

친구가 "사탕 보냈어!" 하고 말해요.
토리가 보물상자를 열어 보니 아직 없어요.
토리가 광장으로 달려가 아저씨에게 물어요.
"말 대신 봉투 번호를 받으렴."
토리가 친구에게 봉투 번호를 받아 와요.
레슨 5에서 도장 찍기 전에 정해졌던 그 번호예요.
장부에서 영수증(receipt)을 찾아봐요.
영수증엔 몇 번째 장과 시각이 있어요.
우표 요금과 "성공"도 찍혀 있어요.
자판기를 쓴 봉투라 발자국도 남았어요.
장이 몇 장 더 붙어야 영수증이 나와요.
토리는 이제 번호부터 달라고 해요.

**핵심 한 문장:** "보냈다"는 말 대신 txID로 영수증을 본다.

**엄마 아빠에게 물어보기:** "택배가 왔는지 어떻게 확인하나요? 말로만 믿나요?"

## ✋ 손으로 해보기 <a id="hands"></a>

**활동: 우체국 영수증 읽기** (교실 20~30분, 자세한 진행은 [activity.md](./activity.md))

준비물: 인쇄용 워크시트 "영수증 탐정" 1장, 교사용 영수증 카드 3장, 색연필(성공 파랑·실패 빨강).

진행 요약

1. **상황 제시(3분)** — "친구가 보냈다고만 해요. 어떻게 알까요?" 답을 칠판에 모읍니다.
2. **봉투 번호 소개(3분)** — 카드 1번으로 영수증 칸 이름을 읽습니다: 장 번호·시각·요금·결과·발자국.
3. **영수증 채우기(10분)** — 카드 2번(성공)과 3번(실패)을 워크시트 1번 표에 옮겨 적고 결과 칸을 색칠합니다.
4. **발자국 추적(7분)** — 카드 2번의 발자국을 화살표 그림으로 그립니다. 카드 3번엔 왜 발자국이 없는지 이야기합니다.
5. **정리(3분)** — "'보냈다'는 말 대신 ____로 ____을 본다" 빈칸을 채웁니다.

카드 값은 이 레슨 `expected-output.txt`의 실제 값입니다(블록 70892020, 요금 701000 sun = 0.701 TRX, 발자국 3개).

**워크시트 1번 — 영수증 옮겨 적기**

| 영수증 칸 | 정식 이름 | 카드 2 값 | 어떻게 읽나요 |
|---|---|---|---|
| 몇 번째 장 | blockNumber | 70892020 | 장부의 이 장에 적혔어요 |
| 시각 | blockTimeStamp | 16시 29분 3초 | 그 장이 붙은 시각이에요 |
| 종이 입장권 요금 | net_fee | 701000 sun | 사탕 701,000알 = 사탕상자 0.701개 |
| 기계 입장권 요금 | energy_fee | 0 sun | 이번엔 사탕을 안 태웠어요 |
| 요금 전체 | fee | 701000 sun | 두 요금을 더한 값이에요 |
| 결과 | result | SUCCESS | 파랑으로 색칠 |
| 발자국 | log | 3개 | 첫 발자국은 사탕통 장부의 사탕 0.3개(USDT) |

**워크시트 2번 — 발자국 그리기** (카드 2의 첫 발자국)

```
   ┌─────────────────────────┐   사탕 300000 알(raw)   ┌─────────────────────────┐
   │ from  TF5n96auHbEc…22y9 │ ──────────────────────▶ │ to  TCETRh3aED4k…wBpNT  │
   └─────────────────────────┘   = 0.3 개(decimals 6)  └─────────────────────────┘
```

**워크시트 3번 — 계산해 보기**: 요금 전체 = 종이 입장권 요금 + 기계 입장권 요금. 카드 2는 `701000 + 0 = 701000 sun`, 사탕상자로는 `701000 ÷ 1,000,000 = 0.701`개입니다.

**워크시트 4번 — 맞으면 O, 틀리면 X**

| 문장 | 답 |
|---|---|
| 친구가 "보냈어"라고 말하면 사탕이 온 것이다. | X |
| 봉투 번호(txID)만 있으면 누구나 영수증을 찾을 수 있다. | O |
| 결과가 REVERT면 요금도 안 낸다. | X |
| 발자국(log)은 자판기(컨트랙트)를 쓴 봉투에만 남는다. | O |
| 영수증은 봉투를 넣자마자 바로 나온다. | X |

**놀이터 — 화면과 웹에서 같은 값 찾기** (컴퓨터가 있으면)

1. `npm run l07` 화면을 크게 띄웁니다.
2. 워크시트 칸마다 화면에서 같은 줄을 손가락으로 찾습니다(`blockNumber`, `net_fee`, `result`, `log[0]`).
3. 7단계에 찍힌 탐색기 링크를 브라우저에서 엽니다.
4. 웹 화면에서도 같은 블록 번호·요금·결과를 찾아 워크시트와 짝지어 봅니다.
5. 다 같이 말합니다: "장부는 누구나 볼 수 있어요."

**무장비 5분 버전 — 영수증 소리 내어 읽기**: 교사가 영수증 한 장을 칠판에 적거나 읽어 줍니다. "몇 번째 장?" → 학생 "70892020!", "요금?" → "0.701 상자!", "결과?" → "성공!", "발자국?" → "3개!" 순서로 묻고 답합니다. 마지막엔 다 같이 "보냈다는 말 대신, 영수증을 본다!"를 외칩니다. 교사가 결과를 "REVERT"로 바꿔 읽으면 학생은 "사탕은 안 갔어요, 요금은 냈어요!"라고 답합니다.

**발문 3개**

1. 친구가 "보냈어!"라고 말한 것과 영수증에 "SUCCESS"가 찍힌 것은 무엇이 다른가요?
2. 요금(fee)은 찍혔는데 결과가 "REVERT(실패)"예요. 사탕은 갔을까요? 요금은 냈을까요?
3. 발자국(log)이 하나도 없는 영수증이 있어요. 이 봉투는 어떤 편지였을까요?

## 🔍 원리 들여다보기 <a id="why"></a>

### 비유 → 정식 용어

| 비유 | 정식 용어 | 코드에서 보이는 자리 |
|---|---|---|
| 봉투 번호 | txID (raw_data_hex의 sha256, 64hex) | `tx.txID`, 탐색기 `/#/transaction/<txid>` |
| 봉투 자체 | `getTransaction` (raw_data + signature + ret) | `ret[0].contractRet` |
| 우체국 영수증 | receipt = `getTransactionInfo` | `blockNumber`, `fee`, `receipt`, `log` |
| 종이 입장권 요금 | 대역폭: `net_usage`(무료·스테이킹) / `net_fee`(TRX 소각, 1000 sun/byte) | `receipt.net_fee` |
| 기계 입장권 요금 | 에너지: `energy_usage_total` / `energy_fee`(TRX 소각, 100 sun/energy) | `receipt.energy_fee` |
| 발자국 | 이벤트 로그 (`log[i].address / topics / data`) | 5단계 |
| 확정된 장 | solidified 블록 (`getConfirmedCurrentBlock`) | 4단계 |

### 수수료는 두 칸, 합이 fee

| 무엇을 썼나 | 무료·스테이킹으로 낸 몫 | TRX를 태운 몫 | 가격 |
|---|---|---|---|
| 봉투 크기(바이트) | `net_usage` | `net_fee` | 1000 sun/byte |
| 컨트랙트 실행 | `energy_usage_total` | `energy_fee` | 100 sun/energy |

`fee = net_fee + energy_fee`입니다. 태우지 않은 몫(`usage`)은 `fee`에 들어가지 않습니다. 그래서 컨트랙트를 실행해 에너지를 67573이나 썼는데도 `energy_fee`가 0일 수 있습니다.

### 실험 1 — 출력에서 한 줄 찾기

`npm run l07`을 실행하고 3단계에서 `fee`, `receipt.net_fee`, `receipt.energy_fee` 세 줄을 찾으세요. 스크립트가 세 값을 `✅`로 대조해 줍니다. 이번 실행에서는 `701000 + 0 = 701000 sun`이었습니다. `energy_usage_total`이 67573인데 `energy_fee`가 0인 이유는 무엇일까요? (힌트: 위 표의 왼쪽 칸으로 냈다면 TRX를 태우지 않습니다.)

### 실험 2 — 환경변수 바꿔 보기

- `TXID=<7단계 링크의 64글자> npm run l07` — 같은 영수증이 다시 나옵니다. 몇 번을 실행해도 값이 같습니다. 장부는 바뀌지 않기 때문입니다.
- `TXID=0000000000000000000000000000000000000000000000000000000000000000 npm run l07` — 없는 번호는 2단계에서 `Transaction not found`로 종료됩니다(exit 1). "번호가 있다"와 "장부에 있다"는 다릅니다.
- `TXID=zz npm run l07` — 16진수가 아닌 글자가 섞이면 1단계에서 형식 오류로 종료됩니다(exit 1). 노드까지 가지도 않습니다.
- `LEVEL=teen npm run l07` — 💬 해설 줄이 중고등용으로 바뀝니다.

### 왜 그렇게 설계했을까?

트론은 왜 `getTransaction`(봉투)과 `getTransactionInfo`(영수증)를 따로 두었을까요? 봉투는 우체통에 넣는 순간 존재하지만, 수수료·블록 번호·로그는 장부에 적힌 **뒤에야** 정해집니다. 그래서 방금 넣은 봉투의 영수증은 `{}`(빈 객체)일 수 있습니다. 둘을 나누면 "넣었다"와 "적혔다"를 구분할 수 있습니다.

### 영수증이 "없어" 보이는 세 경우

같은 빈 화면처럼 보여도 원인이 다릅니다. 구분해서 읽어야 합니다.

1. **아직 안 적혔다** — `getTransactionInfo`가 `{}`. 장이 몇 장 더 붙으면 나옵니다. 기다립니다.
2. **장부에 없는 번호다** — `getTransaction`이 `Transaction not found` 예외. 기다려도 안 나옵니다.
3. **번호 형식이 틀렸다** — 노드가 `{ Error: '… INVALID hex String' }`. 번호를 다시 복사합니다.

### 비유의 한계

영수증은 계산대에서 바로 나오지만, receipt은 몇 장(블록) 뒤에 나오고 그 전엔 빈 종이 `{}`입니다. 또 발자국은 누구나 남기지만, 로그는 자판기(컨트랙트)를 쓴 봉투에만 남습니다. 단순 TRX 전송에는 로그가 없습니다.

## 💻 코드로 확인하기 <a id="code"></a>

```bash
npm run l07                      # TXID 없으면 .last-tx.json → 없으면 최근 블록에서 자동 선택
TXID=<64hex> npm run l07         # 특정 영수증 (아래 출력은 이 방식으로 고정해 받은 것)
```

Nile 읽기 전용입니다. 니모닉이 없어도 돌고, 아무것도 보내지 않습니다. 자동 선택은 실행마다 다른 봉투를 고르므로 `expected-output.txt`는 `TXID=dd46b445…c8bd8`로 고정해 받았습니다. **아래 인용은 그 파일에서 옮겼고, 줄 수를 줄이려 일부를 생략했습니다(`…` 줄). 전체는 [expected-output.txt](./expected-output.txt)를 보세요.**

### [1/7] txID 정하기

```
[1] 영수증을 찾을 봉투 번호(txID) 정하기
  출처: TXID 환경변수
  txID: dd46b445a40a4344bfdd1dbd91d27b292f32b78cd6e64431b3fcff3b2b0c8bd8
```

우선순위는 `TXID` 환경변수 → 레슨 6이 남긴 `.last-tx.json` → 자동 탐색(최신보다 25블록 앞에서 시작, `getTransactionInfo` 최대 40번)입니다. 어느 출처든 먼저 형식을 막습니다. 글자가 섞인 번호는 노드가 예외 대신 `{ Error: '… INVALID hex String' }` 객체로 돌려주기 때문에, 그냥 넘기면 `blockNumber: undefined`, `fee 0` 같은 엉뚱한 영수증이 찍힙니다.

아래는 `script.js`의 `normalizeTxId`입니다(에러 문구 본문만 주석으로 줄였습니다).

```js
  const txid = String(raw ?? '').trim().replace(/^0x/, '');
  if (!/^[0-9a-f]{64}$/i.test(txid)) {
    throw new Error(/* "TXID 는 64자리 16진수(0-9, a-f)여야 합니다. 받은 값은 …" — 전문은 script.js */);
  }
  return txid;
```

### [2/7] getTransaction — 봉투

```
[2] getTransaction — 봉투 자체 (무엇을, 누가 도장 찍었나)
  ret[0].contractRet: SUCCESS
  contract.type: TriggerSmartContract
  컨트랙트(contract_address): THQGuFzL87ZqhxkgqYEryRAd7gqFqL5rdc
  … (서명 수, 호출자, 함수 선택자 6f21b898, fee_limit 줄 생략)
```

`getTransaction`은 `{ ret, raw_data, signature, txID }`를 돌려줍니다. 수수료·블록 번호·로그는 여기 없습니다. 없는 txID면 예외 `Transaction not found`를 잡아 안내하고, 응답에 `Error`가 있거나 `txID`가 없으면 "노드가 이 txID 를 거부했습니다"로 종료합니다.

### [3/7] getTransactionInfo — 영수증

```
[3] getTransactionInfo — 우체국 영수증(receipt)
  blockNumber: 70892020 (장부의 몇 번째 장에 적혔나)
  fee: 701000 sun = 0.701 TRX (실제로 태운 TRX 전체)
  receipt.net_fee: 701000 sun = 0.701 TRX — 대역폭이 모자라 TRX 를 태운 몫 (1000 sun/byte)
  receipt.energy_fee: 0 sun = 0 TRX — 에너지가 모자라 TRX 를 태운 몫 (100 sun/energy)
  receipt.result: SUCCESS — 컨트랙트 실행 결과
  ✅ fee = net_fee + energy_fee = 701000 + 0 = 701000 sun
  … (blockTimeStamp, net_usage, energy_usage_total 67573, energy_usage, origin_energy_usage, contractResult 줄 생략)
```

응답이 `{ Error: … }`면 즉시 종료합니다. 빈 객체 `{}`면 "아직 처리 중" 안내 후 정상 종료(exit 0)합니다. 사용량이 0인 필드는 응답에서 생략되므로 `?? 0`으로 받습니다. 단순 TRX 전송은 에너지 필드가 없어 `receipt.energy_*: 없음` 한 줄만 나옵니다.

### [4/7] 확정 여부

```
[4] 확정(solidified) 여부 — 뒤에 장이 충분히 붙었나
  현재 블록: 70900829
  확정 블록: 70900809 (현재보다 20 장 뒤)
  ✅ 확정됨: 영수증 블록 70892020 ≤ 확정 블록 70900809 (8789 장 더 붙음)
```

`getConfirmedCurrentBlock()`의 solidified 블록 번호와 영수증 `blockNumber`를 비교합니다. 확정 블록은 최신보다 스무 장쯤 뒤였습니다(실행 시각마다 다름).

### [5/7] 로그 직접 디코딩

```
[5] 발자국(이벤트 로그) 직접 읽기 — topics 와 data
  log[0]
      컨트랙트: TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf (address eca9bc828a3005b9a3b909f2cc5c2a54794de05f)
    ✅ topics[0] == Transfer 토픽 → Transfer(from, to, value) 발자국
      from (topics[1]): TF5n96auHbEcTrR5GmY1Qm9XXMbjPe22y9
      to   (topics[2]): TCETRh3aED4kdkaYQY7CcxeTJtrQvwBpNT
      value (data): 300000 (raw, 최소 단위)
      Nile USDT 라서 decimals 6 적용: 0.3 USDT
  … (Transfer 토픽 줄, log[1](같은 USDT Transfer 20 USDT), log[2](topics[0] 이 달라 "다른 이벤트") 생략)
```

`log.address`는 `41` 없는 40hex, `topics`는 `0x` 없는 64hex입니다. `from`/`to`는 `topicToAddress`(lib/tron)가 `'41' + 뒤 40hex`로 T주소를 만들고, `value`는 `BigInt('0x' + log.data)`입니다. `decimals`는 로그에 없어서 `log.address`를 Nile USDT와 비교해 맞을 때만 6을 적용합니다.

### [6/7] TronGrid 이벤트 API와 대조

```
[6] TronGrid 이벤트 API 와 대조 — getEventsByTransactionID
  이벤트 수: 3개 (success: true)
  event[0] GasFreeTransfer @ THQGuFzL87ZqhxkgqYEryRAd7gqFqL5rdc (block 70892020)
  … (event[1] 은 log[1] 과 같은 20 USDT Transfer 생략)
  event[2] Transfer @ TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf (block 70892020)
      to: 0x18d288392b8b75ef398f235693a9103b523a1fc3 = TCETRh3aED4kdkaYQY7CcxeTJtrQvwBpNT
      value: 300000
  ✅ 로그 3개 = 이벤트 3개 — 내가 직접 읽은 발자국과 TronGrid 가 ABI 로 풀어 준 결과가 같은 봉투를 가리킵니다
```

이 API는 TronGrid가 ABI로 디코딩한 `event_name`과 `result`를 줍니다. `result`의 주소는 `0x` 형식으로 왔고(실행에서 관찰, 확인 필요), 스크립트가 `'41' + hex`로 바꿔 5단계와 대조합니다. 이벤트 순서는 로그 순서와 다를 수 있습니다(위 event[2]가 log[0]에 대응). 로그도 이벤트도 0개면 "발자국이 없으니 이벤트도 없는 것이 정상" 한 줄이 나옵니다. 마지막 [7/7] 단계는 `explorerTx(txid)`(lib/tron)로 `https://nile.tronscan.org/#/transaction/<txid>` 링크를, 컨트랙트 호출이면 `explorerAddress(컨트랙트 T주소)` 링크를 찍습니다. 브라우저에서 열어 3단계의 블록·수수료·결과와 같은지 대조하세요.

### 트론 vs EVM 차이

| | 트론 (Nile) | EVM (BTTC 등, ethers) |
|---|---|---|
| 영수증 조회 | `getTransactionInfo(txid)` — 처리 전엔 `{}` | `getTransactionReceipt(hash)` — 처리 전엔 `null` |
| 수수료 항목 | `net_fee`/`net_usage`(대역폭) + `energy_fee`/`energy_usage_total`(에너지), 합이 `fee`(sun) | `gasUsed × gasPrice`(wei) |
| 결과 | `ret[0].contractRet`와 `receipt.result` (`SUCCESS`/`REVERT`) | `status` 1/0 |
| 로그 주소 형식 | `address` 40hex(41 없음), `topics` 0x 없음 | `address` 0x40hex, `topics` 0x64hex |
| Transfer 토픽 | `ddf252ad…b3ef` (EVM과 동일) | 동일 |
| 확정 | `getConfirmedCurrentBlock()`(solidified) | 컨펌 수 / finalized 태그 |

> 트론 열은 이 레슨 실행으로 확인한 값입니다. **EVM 열은 ethers v6 일반 지식이며 이 저장소에서 실행 검증하지 않았습니다(확인 필요).** BTTC에서 실제로 확인한 것은 `getBalance`·`getFeeData`·`estimateGas`·`sendTransaction`까지입니다(레슨 11).

### 함정 1개

`getTransactionInfo(모르는 id)`는 **예외 없이 `{}`**를 돌려주고, `getTransaction(모르는 id)`는 **예외 `Transaction not found`**를 던집니다. 게다가 hex가 아닌 id를 주면 둘 다 예외 없이 `{ Error: '… INVALID hex String' }` 객체를 돌려줍니다. 그래서 스크립트는 (1) 형식을 `/^[0-9a-f]{64}$/i`로 먼저 막고, (2) `getTransaction`으로 존재를 확인하고, (3) 응답의 `Error` 필드까지 본 뒤에야 영수증을 읽습니다.

### 도전

- **쉬움**: `TXID=`에 아무 단순 TRX 전송의 txid를 넣어 3단계의 `receipt.energy_*: 없음` 줄과 `net_fee`/`net_usage`가 어떻게 나오는지, 6단계에서 이벤트 0개 줄이 나오는지 확인하세요. 무료 대역폭을 썼다면 `net_fee` 없이 `net_usage`가 나옵니다(확인 필요).
- **어려움**: 5단계에서 `topics[0]`이 Transfer가 아닌 로그(예: 이번 실행의 `fe6f7f85…0d12`)를 만났을 때, `tronWeb.trx.getContract(주소)`로 체인의 ABI(`abi.entrys`)를 읽어 `event` 항목의 이름·인자 타입으로 서명 문자열을 조립하고 `TronWeb.sha3`로 해시해 `topics[0]`과 맞는 이벤트를 찾아 이름을 출력하도록 확장하세요. 6단계의 `event_name`과 같아야 합니다.

## 🏠 내 생활에서는 <a id="life"></a>

지갑 앱(TronLink 등)에서 전송을 마치면 거래 내역 화면에 항목이 생기고, 그 항목을 누르면 긴 영문·숫자 64글자가 보입니다(메뉴 이름과 화면 배치는 앱·버전마다 다를 수 있음, 확인 필요). 그것이 txID입니다. 옆에 있는 "탐색기에서 보기" 같은 버튼을 누르면 이 레슨 3단계의 영수증이 웹 화면으로 나옵니다.

탐색기 화면에서 읽을 칸은 다섯 개입니다(칸 이름은 탐색기마다 다를 수 있음, 확인 필요).

| 탐색기에서 보이는 칸 | 이 레슨의 이름 | 무엇을 확인하나요 |
|---|---|---|
| 블록(Block) | `blockNumber` | 장부의 몇 번째 장에 적혔나 |
| 시각(Time) | `blockTimeStamp` | 그 장이 붙은 시각 |
| 수수료(Fee) | `fee` | 실제로 태운 TRX 전체 |
| 결과(Status/Result) | `receipt.result` | SUCCESS인지 REVERT인지 |
| 토큰 전송(Token Transfer) | `log`의 Transfer 발자국 | 받는 주소가 내 주소인지 |

입금을 확인할 때는 상대의 말이나 캡처가 아니라 txID를 받아 탐색기에서 직접 보세요(`https://nile.tronscan.org` 는 연습 나라이고, 진짜 나라는 앱의 탐색기 링크를 쓰세요). 확인할 것은 세 가지입니다. 결과가 SUCCESS인지, 토큰 전송의 받는 주소가 내 주소인지, 토큰 컨트랙트 주소가 진짜인지(레슨 3).

확정도 보세요. 거래 페이지에는 블록 번호와 함께 확정 여부가 표시됩니다(표시 문구는 탐색기마다 다름, 확인 필요). 금액이 클수록 "들어왔다"가 아니라 "확정됐다"까지 기다린 뒤 다음 행동을 하세요.

**이런 요청이 오면 사기인가?**

| 상황 | 사기? | 이유 |
|---|---|---|
| "보냈어요" 캡처만 보내고 물건·환불을 재촉한다 | 예(의심) | 캡처는 꾸밀 수 있습니다. txID를 요구하고 탐색기에서 SUCCESS·받는 주소를 확인하세요. |
| txID를 줬는데 탐색기에 내 주소로 들어온 기록이 없다 | 예 | 장부에 없는 입금은 없는 것입니다. "탐색기가 느리다"는 말도 믿지 마세요. |
| 거래소·상대가 출금 완료 후 txID를 알려 준다 | 아니오 | 정상입니다. 그 txID로 직접 확인하면 됩니다. |

**사기 유형 1개 — "가짜 입금 캡처"**: 전송 화면을 편집하거나, 실패(REVERT)한 트랜잭션의 캡처를 보내며 "보냈으니 먼저 보내 달라"고 재촉합니다. 실패한 트랜잭션도 txID와 수수료가 있어 그럴듯해 보입니다. 결과 칸이 SUCCESS인지, 발자국의 받는 주소가 내 것인지까지 보세요.

**오늘 실천 습관 1개:** 앱의 최근 거래 하나를 골라 탐색기로 열어 블록 번호·수수료·결과 세 칸을 소리 내어 읽어 보세요.

## 🛡️ 안전 규칙 카드 <a id="card"></a>

**규칙 7. "보냈다"는 말 대신 txID로 영수증을 본다.**

**해야 할 것**
- ✅ 입금 확인은 txID(64글자)로, 탐색기에서 직접 본다.
- ✅ 결과가 SUCCESS인지, 받는 주소가 내 주소인지, 확정됐는지 세 가지를 본다.
- ✅ 영수증이 비어 있으면 몇 블록(3초씩) 기다렸다 다시 본다.

**절대 하지 말 것**
- ❌ 캡처나 말만 믿고 물건·돈을 먼저 보내지 않는다.
- ❌ "탐색기가 느리다", "곧 뜬다"는 말에 재촉당하지 않는다.
- ❌ 입금 확인을 이유로 복구 구문·개인키를 누구에게도 보여 주지 않는다.

## ✅ 확인하기 <a id="check"></a>

[quiz.md](./quiz.md)에서 대상별로 한 문제씩 미리 봅니다.

- **초등:** 친구가 "사탕 보냈어!"라고만 말해요. 토리가 제일 먼저 할 일은? (가) 믿고 기다려요 (나) 봉투 번호를 받아 영수증을 찾아요 (다) 아저씨에게 12단어를 말해요
- **중고등:** 이 레슨 영수증에 `net_fee: 701000`이 찍혔습니다. 대역폭 가격이 1000 sun/byte일 때 이 봉투는 몇 바이트였을까요? 무료 대역폭이 남아 있었다면 어떻게 달라졌을까요?
- **개발자:** 1초 전 브로드캐스트한 txID로 `getTransactionInfo`를 부르면 `info`는 무엇일 가능성이 높고, 스크립트는 어느 줄을 출력할까요?
- **일반인:** 상대가 "전송 완료" 캡처를 보냈습니다. 물건을 보내기 전에 무엇을 요구해야 할까요?

정답은 [quiz.md](./quiz.md) 에 있습니다.

➡️ 다음: **[Lesson 08. '나야'라고 증명하기(돈은 안 들어요)](../08-sign-message/README.md)** — 봉투가 아닌 "그냥 종이"에 도장을 찍어 봅니다. 돈은 안 들지만, 무엇에 찍는지 읽지 못하면 찍지 않습니다.
