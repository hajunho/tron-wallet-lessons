# 문제 해결 (증상 → 원인 → 해결)

스크립트가 멈추거나 낯선 문구가 나올 때 보는 문서입니다. **증상 문구를 그대로 검색하세요.** 문구가 곧 원인입니다(규칙 12: 실패는 단서다).

먼저 이 두 줄을 실행해 보세요. 대부분 여기서 원인이 드러납니다.

```bash
node -v            # v20 이상이어야 합니다
npm run check      # .env, Nile, BTTC 연결 상태를 한 번에 점검
```

> 이 문서의 어떤 해결책도 `SEND_TX=true` 실행이나 `.env` 파일을 요구하지 않습니다. 실제 자산이 있는 12단어를 넣어 해결하는 항목은 하나도 없습니다.

---

## 빠른 찾기 표

| # | 증상 | 원인 | 해결 |
|---|---|---|---|
| 1 | `npm run l01`이 문법 에러(`SyntaxError`)나 "unsupported engine"으로 죽는다 | Node가 20보다 낮다 | Node 20 이상(권장 22 이상)으로 올린다 → [1](#t1) |
| 2 | `npm install`이 `tiny-secp256k1` 또는 `bip32`에서 실패한다 | 대개 Node 버전·캐시·네트워크 문제 | `node -v` 확인 → `npm install` 재시도 → 레슨 03~13으로 우회 → [2](#t2) |
| 3 | "잠시 후 다시" 안내가 나오거나 조회가 자꾸 비어 온다 | 공용 노드 요청 제한(429) | 몇 분 기다렸다 다시, 호출 수 줄이기, `TRON_FULL_HOST` 교체 → [3](#t3) |
| 4 | 스크립트가 오래 멈춰 있다가 실패한다 | 네트워크 지연 또는 노드 응답 없음 | 오프라인 레슨으로 확인 후 재시도, `npm test`는 레슨당 120초 제한 → [4](#t4) |
| 5 | faucet에서 테스트 TRX·BTT를 못 받는다 | faucet 점검·인증 요구·한도 | 데모 지갑으로 조회만 하거나 오프라인 레슨(01·02·08)으로 진행 → [5](#t5) |
| 6 | 데모 주소 잔고가 0으로 나오고 레슨이 ⚠️로 끝난다 | 공개 지갑이라 누구나 쓸 수 있어 잔고가 변한다 | 다른 주소를 `ADDRESS`로 넣거나, 잔고가 필요 없는 레슨으로 우회 → [6](#t6) |
| 7 | 봉투를 만든 뒤 시간이 지나 브로드캐스트가 안 된다 | `expiration` 기본 60초 경과 | 봉투를 새로 만든다. 연장은 **서명 전**에만 → [7](#t7) |
| 8 | `Contract validate error : account [T...] does not exist` | 보내는 계정이 아직 활성화되지 않았다 | 그 주소로 TRX를 먼저 받는다(활성화 1 TRX) → [8](#t8) |
| 9 | `REVERT opcode executed` | 컨트랙트가 조건 위반으로 되돌렸다(잔고·allowance 등) | 리허설로 잔고·허락·주소를 다시 확인 → [9](#t9) |
| 10 | `Private key does not match address in transaction` | 봉투의 `owner_address`와 서명 키가 다르다 | 보내는 주소와 선택된 계정(인덱스)을 맞춘다 → [10](#t10) |
| 11 | `Cannot transfer TRX to the same account` | 받는 주소가 보내는 주소와 같다 | 받는 주소를 index 1 주소 등으로 바꾼다 → [11](#t11) |
| 12 | 인터넷이 없거나 막혀 있다 | 네트워크 호출이 불가능 | 레슨 01·02·08은 네트워크 없이 완결된다 → [12](#t12) |
| 13 | Windows에서 `LEVEL=teen npm run l04`가 안 먹는다 | cmd·PowerShell은 이 문법을 모른다 | 셸에 맞는 환경변수 지정 문법을 쓴다 → [13](#t13) |
| 14 | 출력 숫자가 문서의 예시와 다르다 | 장부가 계속 자라고 테스트넷 값이 변한다 | 고장이 아니다. 바뀌는 값과 안 바뀌는 값을 구분한다 → [14](#t14) |

---

## 1. Node 버전이 낮다 <a id="t1"></a>

| | |
|---|---|
| **증상** | `npm install` 중 "unsupported engine" 경고, 또는 스크립트가 `SyntaxError`·`ReferenceError`로 즉시 죽는다 |
| **원인** | `package.json`의 `engines`가 `node >=20`이다. 코드가 최신 문법(옵셔널 체이닝, `??`, `BigInt` 리터럴, `node:child_process` 접두사 등)을 쓴다 |
| **해결** | Node 20 이상으로 올린다. 권장은 22 이상이고, 이 저장소의 검증 환경은 **Node 23.11**이다 |

```bash
node -v      # v20.x 이상이면 통과
npm -v
```

버전을 올린 뒤에는 `node_modules`를 지우고 다시 설치하세요. 네이티브 모듈이 이전 버전에 맞춰져 있을 수 있습니다.

```bash
rm -rf node_modules
npm install
npm run l01
```

---

## 2. `npm install`이 tiny-secp256k1에서 실패한다 <a id="t2"></a>

| | |
|---|---|
| **증상** | 설치가 `tiny-secp256k1` 또는 `bip32` 단계에서 멈추거나 에러로 끝난다 (정확한 에러 문구는 환경마다 다름. 확인 필요) |
| **원인** | 이 저장소가 쓰는 `tiny-secp256k1` 2.2.4는 **WebAssembly로 동봉**되어 있어(`node_modules/tiny-secp256k1/lib/secp256k1.wasm`) 원래는 네이티브 컴파일이 필요하지 않다. 실패한다면 Node 버전, npm 캐시, 네트워크·프록시, 잠금 파일 불일치 쪽이 원인일 가능성이 크다 |
| **해결** | 아래 순서로 하나씩 확인한다 |

```bash
node -v                 # 20 이상인지 (→ 1번 항목)
npm cache verify        # 캐시 확인
rm -rf node_modules
npm install             # 재설치. 이 저장소는 package-lock.json 을 .gitignore 로 제외하므로 npm ci 는 쓸 수 없습니다
```

그래도 안 되면 **우회할 수 있습니다.** `bip32`와 `tiny-secp256k1`을 쓰는 스크립트는 **레슨 01과 02 둘뿐**입니다. 나머지 11개 레슨은 `tronweb`·`ethers`만 씁니다.

```bash
npm run l03      # 01·02 없이도 바로 진행 가능
```

레슨 01·02의 내용은 설치 없이 브라우저로도 확인할 수 있습니다: [주사위에서 T주소까지](playground/dice-to-words.html), [우편함 번호 엑스레이](playground/address-xray.html).

---

## 3. 429 — 공용 노드 요청 제한 <a id="t3"></a>

| | |
|---|---|
| **증상** | 조회가 실패하며 **"잠시 후 다시"** 안내가 출력된다. 또는 같은 스크립트가 번갈아 성공·실패한다 |
| **원인** | 기본 엔드포인트 `https://nile.trongrid.io`는 API 키 없이 쓸 수 있지만 **요청 수 제한**이 있다. 짧은 시간에 여러 레슨을 연달아 돌리거나 반복문으로 조회를 많이 하면 걸린다 |
| **해결** | ① 몇 분 기다렸다 다시 실행 ② 레슨을 하나씩 실행 ③ 조회 수를 줄이기 ④ 엔드포인트 교체 |

레슨 13처럼 여러 조회를 모아 하는 스크립트는 실패한 호출만 `null`로 처리하고 계속 진행하도록 되어 있습니다. 그래서 ⚠️ 개수가 늘어나도 스크립트 자체는 끝까지 돕니다.

엔드포인트는 `.env`의 `TRON_FULL_HOST`로 바꿀 수 있습니다. Nile은 `https://nile.trongrid.io` 외에 `https://api.nileex.io`도 HTTP API로 안내되어 있습니다.

```bash
# .env
TRON_FULL_HOST=https://api.nileex.io
```

> **`TRONGRID_API_KEY`는 이 저장소에서 지원하지 않습니다.** `lib/tron.js`는 `TRON_FULL_HOST`만 읽고 API 키 헤더를 붙이지 않습니다. 키를 발급해 붙이는 방법과 그때의 제한 완화 정도는 **확인 필요**입니다. `lib/`은 수정하지 않는 것이 이 저장소의 규칙이므로, 제한이 문제라면 먼저 호출 수를 줄이거나 엔드포인트를 바꾸세요.

---

## 4. 타임아웃 — 오래 멈춰 있다가 실패한다 <a id="t4"></a>

| | |
|---|---|
| **증상** | 출력이 중간에서 멈춘 채 한참 기다리다 실패한다. 특히 레슨 07·10·11·12·13 |
| **원인** | 공용 테스트넷 노드의 응답 지연, 사내망·프록시의 외부 HTTPS 차단, 또는 영수증 폴링이 끝까지 기다린 경우 |
| **해결** | 네트워크가 문제인지 먼저 가린 뒤 재시도한다 |

```bash
npm run l01        # 네트워크를 쓰지 않음. 여기서도 느리면 Node/설치 문제
npm run check      # Nile·BTTC 연결만 확인 (실패하면 ❌ 줄이 나옴)
npm run l03        # 가장 단순한 조회 레슨으로 재시도
```

참고 수치입니다. 2026-09-12 측정으로 가장 오래 걸린 레슨이 13번(4.0초)이었습니다. `npm test`(=`verify-readonly`)는 레슨 하나당 **120초** 제한을 두고 실행합니다. 수십 초씩 걸린다면 네트워크 쪽을 보세요.

BTTC(Donau) 쪽이 느리다면 레슨 10은 `SKIP_BTTC=true`로 그 부분을 건너뛸 수 있습니다. 각 레슨이 받는 환경변수는 그 레슨 README의 `💻 코드로 확인하기` 블록에 적혀 있습니다.

---

## 5. faucet에서 테스트 코인을 못 받는다 <a id="t5"></a>

| | |
|---|---|
| **증상** | faucet 페이지가 열리지 않거나, 인증을 요구하거나, "이미 받았다"며 거절한다 |
| **원인** | faucet은 외부 서비스라 점검·한도·인증 정책이 수시로 바뀐다(정책 세부 사항은 확인 필요) |
| **해결** | 테스트 코인 없이 진행할 수 있는 길이 넓다. 아래 세 가지 중 하나를 고른다 |

| faucet | 주소 | 받는 것 |
|---|---|---|
| Nile | `https://nileex.io/join/getJoinPage` | 테스트 TRX (트위터 인증 또는 웹 폼) |
| Donau | `https://testfaucet.bt.io/#/` | 테스트 BTT |
| 공식 안내 | `https://developers.tron.network/docs/getting-testnet-tokens-on-tron` | 테스트넷 토큰 받는 방법 문서 |

우회 방법:

1. **오프라인 레슨으로 진행** — 01·02·08은 네트워크도 코인도 필요 없습니다.
2. **데모 지갑으로 조회** — `.env`가 없으면 조회 레슨이 공개 데모 니모닉으로 자동 실행됩니다. 잔고가 있는 주소를 그대로 읽으므로 코인이 필요 없습니다.
3. **전송 레슨은 미리보기로** — 레슨 05는 봉투를 만들고 도장까지 찍는 데 잔고가 필요하지 않습니다. 실제 전송은 레슨 06뿐이고, 그것도 기본이 미리보기입니다.

---

## 6. 데모 주소 잔고가 0이 되면 <a id="t6"></a>

| | |
|---|---|
| **증상** | 문서에는 TRX 약 55,000개, USDT 약 19,588개로 적혀 있는데 실제로는 0이거나 훨씬 적게 나온다. 레슨 03·04·09·10이 ⚠️로 끝난다 |
| **원인** | 데모 니모닉(`abandon … about`)은 **누구나 아는 공개 값**이다. 전 세계 누구든 쓸 수 있으니 잔고는 언제든 변한다. 게다가 이 계정의 권한은 이미 다른 키로 바뀌어 있다 |
| **해결** | 잔고에 의존하지 않는 길로 우회한다 |

| 하려던 것 | 우회 |
|---|---|
| 잔고 조회 연습 | `ADDRESS`에 탐색기에서 찾은 다른 Nile 주소를 넣어 실행 (레슨 03·04·13이 조회할 주소를 받습니다) |
| 자원(에너지·대역폭) 보기 | 잔고가 0이어도 `getAccountResources`는 응답합니다. `freeNetLimit` 600은 계정마다 그대로입니다 |
| 봉투 만들기·도장 찍기 | 레슨 05는 잔고와 무관합니다 |
| 12단어·주소·서명 원리 | 레슨 01·02·08 (네트워크 불필요) |
| 실패 문구 읽기 | 레슨 12는 일부러 실패를 일으키는 레슨이라 잔고가 0이어도 그대로 배웁니다 |
| 내 지갑으로 연습 | `npm run new-wallet`로 연습용 니모닉을 만들고 faucet에서 받기 (→ [5](#t5)) |

문서의 숫자가 안 맞는 것은 문서가 틀린 것이 아니라 **그 시점의 관찰값**이기 때문입니다. 각 레슨의 `expected-output.txt` 첫 줄에 실행 명령과 날짜(2026-09-12)가 적혀 있습니다.

---

## 7. 봉투 60초 만료 <a id="t7"></a>

| | |
|---|---|
| **증상** | 봉투를 만들어 두고 한참 뒤에 브로드캐스트하면 노드가 받지 않는다 (그 응답 문구는 확인 필요 — 이 저장소는 만료된 봉투를 실제로 보내 보지 않았다) |
| **원인** | 트론에는 nonce가 없다. 대신 참조 블록(`ref_block_bytes`·`ref_block_hash`)과 **`expiration`(기본 생성 후 60초)**으로 재사용·중복을 막는다. 60초가 지난 봉투는 무효다 |
| **해결** | 봉투를 새로 만든다. 연장이 필요하면 **서명 전에** `extendExpiration`을 쓰고, 반환값만 사용한다 |

```js
// extendExpiration 은 입력 tx 의 raw_data 를 제자리 수정하고, 새 txID 를 가진 새 객체를 반환한다.
// 원본을 보관하려면 먼저 복사한다. 원본 객체로 sign 하면 txID 와 raw_data 가 어긋나 Invalid transaction 이 된다.
const copy = JSON.parse(JSON.stringify(tx));
const extended = await tronWeb.transactionBuilder.extendExpiration(copy, 600);
```

`expiration`도 `raw_data`의 일부이므로 연장하면 **txID가 바뀝니다.** 그래서 봉투를 고치는 일은 모두 서명 전에 끝내야 합니다. 메모(`addUpdateData`)도 같습니다. 서명한 봉투에 메모를 붙이려 하면 `You can not extend the expiration of a signed transaction`이 나옵니다(메모 수수료는 1 TRX).

**더 보기:** [Lesson 05 코드로 확인하기](lessons/05-build-and-sign/README.md#code) · [Lesson 12 사건 7](lessons/12-error-detective/README.md#code)

---

## 8. `account does not exist` <a id="t8"></a>

| | |
|---|---|
| **증상** | `sendRawTransaction`이 예외 없이 `{ code: 'CONTRACT_VALIDATE_ERROR', message: ... }`를 돌려주고, message를 풀면 `Contract validate error : account [T...] does not exist` |
| **원인** | 트론 특유의 **계정 활성화**. 한 번도 TRX를 받은 적 없는 새 주소는 장부에 아직 없다(`getAccount`가 빈 객체 `{}`를 돌려준다). 장부에 없는 계정은 보낼 수 없다 |
| **해결** | 그 주소로 TRX를 **먼저 받는다**. 새 계정 활성화 비용은 1 TRX(`getCreateNewAccountFeeInSystemContract` = 1,000,000 sun)이고, 보내는 쪽이 낸다 |

빌드와 서명은 내 컴퓨터에서 정상적으로 끝나고, 노드가 검증 단계에서 거부합니다. 그래서 "코드는 멀쩡한데 왜?"로 보입니다.

노드의 `message`는 hex로 오므로 사람이 읽으려면 디코딩이 필요합니다. `lib/tron.js`의 `decodeNodeMessage(result)`가 그 일을 합니다.

```js
const result = await tronWeb.trx.sendRawTransaction(signed);
if (result.result !== true) {
  console.log(result.code);                  // CONTRACT_VALIDATE_ERROR
  console.log(decodeNodeMessage(result));    // Contract validate error : account [T...] does not exist
}
```

**더 보기:** [Lesson 12 사건 3](lessons/12-error-detective/README.md#code) · [Lesson 04 원리 들여다보기](lessons/04-bandwidth-energy/README.md#why)

---

## 9. `REVERT opcode executed` <a id="t9"></a>

| | |
|---|---|
| **증상** | 리허설(`triggerConstantContract`)이나 컨트랙트 호출에서 예외 `REVERT opcode executed` |
| **원인** | 컨트랙트가 조건 위반으로 실행을 되돌렸다. TRC-20에서 가장 흔한 것은 **토큰 잔고 부족**, 그다음이 **allowance 부족**, 그리고 받는 주소 오류다 |
| **해결** | 보내기 전에 세 가지를 숫자로 확인한다: 토큰 잔고, 남은 허락(allowance), 받는 주소 |

```bash
npm run l10      # 리허설로 "될까, 얼마 들까"를 먼저 본다
npm run l09      # allowance 를 조회한다
```

중요한 점 두 가지입니다.

- **리허설에서 REVERT면 수수료 0입니다.** 실제로 보냈다면 실패해도 에너지 수수료는 나갑니다. 그래서 규칙 10이 "앱이 실패할 것 같다고 하면 보내지 않는다"입니다.
- 노드 원본 응답은 `{ result: { result: true, message: 'REVERT opcode executed' } }`처럼 `result: true` 안에 메시지가 들어 있습니다. tronweb이 이것을 예외로 바꿔 던집니다.

**더 보기:** [Lesson 10 코드로 확인하기](lessons/10-simulate/README.md#code) · [Lesson 12 사건 4](lessons/12-error-detective/README.md#code)

---

## 10. `Private key does not match address in transaction` <a id="t10"></a>

| | |
|---|---|
| **증상** | `tronWeb.trx.sign` 단계에서 예외가 난다. 노드까지 가지도 않는다 |
| **원인** | 서명하려는 키에서 유도한 주소가 봉투의 `raw_data.contract[0].parameter.value.owner_address`와 다르다. 즉 **남의 봉투에 내 도장**을 찍으려 한 것이다 |
| **해결** | 봉투를 만들 때 쓴 보내는 주소와, 서명에 쓰는 키의 인덱스를 맞춘다 |

가장 흔한 실수는 니모닉 인덱스가 섞이는 경우입니다. `walletFromMnemonic(mnemonic, 0)`으로 봉투를 만들고 `walletFromMnemonic(mnemonic, 1)`의 키로 서명하면 이 문구가 나옵니다.

```js
const me = walletFromMnemonic(mnemonic, 0);
const tx = await tronWeb.transactionBuilder.sendTrx(to, 1, me.address); // owner = index 0
const signed = await tronWeb.trx.sign(tx, me.privateKey);               // 서명도 index 0
```

내 컴퓨터가 먼저 걸러 주는 실패이므로 수수료는 0이고 자산도 움직이지 않습니다. 좋은 실패입니다.

**더 보기:** [Lesson 12 사건 5](lessons/12-error-detective/README.md#code) · [Lesson 05 코드로 확인하기](lessons/05-build-and-sign/README.md#code)

---

## 11. `Cannot transfer TRX to the same account` <a id="t11"></a>

| | |
|---|---|
| **증상** | `sendTrx` 빌드 단계에서 예외 `Cannot transfer TRX to the same account` |
| **원인** | 받는 주소(`to`)와 보내는 주소(`from`)가 같다. 트론은 자기 자신에게 보내는 TRX 전송을 거부한다 |
| **해결** | 받는 주소를 다른 주소로 바꾼다. 이 저장소의 기본값은 **같은 니모닉의 index 1 주소**다 |

```bash
TO=TSeJkUh4Qv67VNFwY8LaAxERygNdy6NQZK npm run l05
```

전송 레슨(05·06)이 기본 수신자를 index 1 주소로 두는 이유가 바로 이것입니다. 데모 니모닉의 index 1 주소는 `TSeJkUh4Qv67VNFwY8LaAxERygNdy6NQZK`입니다.

EVM 쪽(BTTC)은 자기 자신에게 보내는 것을 허용합니다(가스만 소모. 확인 필요). 체인마다 검증 규칙이 다르다는 좋은 예입니다.

**더 보기:** [Lesson 12 사건 2](lessons/12-error-detective/README.md#code) · [Lesson 02 코드로 확인하기](lessons/02-key-to-address/README.md#code)

---

## 12. 네트워크 없이 할 수 있는 레슨 <a id="t12"></a>

| | |
|---|---|
| **증상** | 인터넷이 없다. 또는 교실·사내망에서 외부 HTTPS가 막혀 조회 레슨이 모두 실패한다 |
| **원인** | 레슨 03 이후는 Nile 또는 Donau 노드에 조회한다 |
| **해결** | **레슨 01·02·08은 네트워크에 접속하지 않습니다.** `.env`도 필요 없습니다 |

```bash
npm run l01      # 12단어가 만들어지는 과정 (0.3초)
npm run l02      # 열쇠 → T주소 → 0x주소 (0.3초)
npm run l08      # 메시지 서명과 서명자 복원 (0.2초)
```

노트북 없이도 할 수 있는 것들:

- **브라우저 놀이터** — 파일 6개(허브 `index.html` + 놀이 도구 5개)입니다. `ticket-board.html`·`signing-popup-simulator.html`과 허브 [playground/index.html](playground/index.html)은 인터넷 없이 열립니다. `dice-to-words.html`·`address-xray.html`·`approve-decoder.html`은 CDN(ethers 6.17.0)에서 라이브러리를 받아야 하므로 인터넷이 필요하고, 없으면 버튼이 모두 비활성으로 나옵니다.
  - ⚠️ 허브 `index.html`의 "각 페이지는 … 인터넷 없이도 열립니다" 안내와 카드마다 붙은 「🔌 인터넷 없이 동작」 문구는 위 두 개(+허브)에만 맞습니다. 와이파이가 없는 교실에서는 이 문서와 [TEACHER_GUIDE.md](TEACHER_GUIDE.md)의 분류를 기준으로 하세요.
  - ⚠️ 허브 `index.html` 의 카드 목록에는 **일곱 번째 카드 "종합 퀴즈와 졸업"(`quiz.html`)** 이 남아 있는데 `playground/quiz.html` 파일은 없습니다. 그 카드의 "열기"를 누르면 404 입니다. 놀이 도구는 `dice-to-words`·`address-xray`·`ticket-board`·`signing-popup-simulator`·`approve-decoder` **다섯 개뿐**이니 그 카드는 건너뛰세요. 레슨 13 의 종합 퀴즈는 [lessons/13-audit-and-graduation/quiz.md](lessons/13-audit-and-graduation/quiz.md) 에 있습니다.
  - ⚠️ `dice-to-words.html` 과 `address-xray.html` 에는 허브로 돌아가는 링크가 없습니다. 브라우저 뒤로 가기를 쓰세요.
  - ⚠️ `ticket-board.html` 의 금액 계산은 "부족분 바이트만 과금"이라는 모델을 쓰는데, 부족분만 과금되는지 전체가 소각되는지는 **(확인 필요)** 입니다. 정산은 영수증의 `net_usage`/`net_fee` 로 확인하세요.
- **각 레슨의 `activity.md`** — 오프라인 활동과 "무장비 5분 버전", 인쇄용 워크시트가 들어 있습니다.
- **각 레슨의 `expected-output.txt`** — 실제 실행 출력이 그대로 저장되어 있어, 실행하지 않고도 출력을 읽고 해설할 수 있습니다.

---

## 13. Windows에서 환경변수를 주는 법 <a id="t13"></a>

| | |
|---|---|
| **증상** | `LEVEL=teen npm run l04`, `CASE=3 npm run l12`가 Windows에서 동작하지 않는다 |
| **원인** | `VAR=값 명령` 문법은 유닉스 계열 셸(bash·zsh)의 것이다. cmd와 PowerShell은 이 문법을 모른다 |
| **해결** | 셸에 맞는 문법을 쓴다 |

| 셸 | 쓰는 법 |
|---|---|
| macOS·Linux (bash·zsh) | `LEVEL=teen npm run l04` |
| PowerShell | `$env:LEVEL="teen"; npm run l04` |
| cmd | `set LEVEL=teen && npm run l04` |
| 어느 셸이든 | `.env` 파일에 `LEVEL=teen` 한 줄을 적는다 |

여러 개를 줄 때:

```powershell
# PowerShell
$env:CASE="3"; $env:LEVEL="kid"; npm run l12
```

```
:: cmd
set CASE=3 && set LEVEL=kid && npm run l12
```

PowerShell에서 `$env:`로 지정한 값은 **그 창이 열려 있는 동안 유지됩니다.** 다음 실행에 영향을 주니 끝나면 `Remove-Item Env:LEVEL`로 지우거나 창을 닫으세요.

> Windows 검증은 이 저장소에서 하지 않았습니다(검증 환경은 macOS·Node 23.11). 위 문법은 셸의 일반 사용법이고, `.env` 파일 방식이 어느 환경에서든 가장 안전합니다. **확인 필요.**

레슨마다 받는 환경변수는 그 레슨 README의 `💻 코드로 확인하기` 블록에 적혀 있습니다. 자주 쓰는 것: `MNEMONIC`, `LEVEL`(kid·teen·dev·adult), `SHOW_SECRETS`, `TO`, `ADDRESS`, `TXID`, `CASE`, `WORDLIST`.

---

## 14. 출력 숫자가 문서와 다를 때 <a id="t14"></a>

| | |
|---|---|
| **증상** | 블록 번호, 데모 주소 잔고, 에너지 가격, 타임스탬프가 README의 예시와 다르다 |
| **원인** | **장부는 계속 자랍니다.** 약 3초마다 새 블록이 붙고, 공개 데모 주소는 누구나 쓰고, 체인 파라미터도 거버넌스로 바뀝니다. 문서의 숫자는 2026-09-12의 관찰값입니다 |
| **해결** | 고장이 아닙니다. **바뀌는 값과 안 바뀌는 값**을 구분하는 것이 이 레슨의 일부입니다 |

| 바뀌어도 정상인 값 | 바뀌면 살펴봐야 하는 값 |
|---|---|
| 블록 번호, 블록 타임스탬프 | `1 TRX = 1,000,000 sun` |
| 데모 주소의 TRX·USDT 잔고 | 무료 대역폭 `freeNetLimit` 600 |
| 에너지 가격(이력: 420 → 210 → 100 sun) | 경로 `m/44'/195'/0'/0/0`에서 나오는 T주소 |
| 대역폭 가격(현재 1000 sun/byte) | 데모 니모닉의 주소(TUEZ… / TSeJ…) |
| 특정 전송의 energy·net_fee | `expiration` 기본 60초 |
| 최근 거래 목록, 이벤트 로그 | 함수 선택자 `transfer` = `a9059cbb`, `approve` = `095ea7b3` |
| Nile USDT 잔고·총발행량 | Nile chainId 3448148188, Donau chainId 1029 |

오른쪽 열이 달라졌다면 그때는 정말 살펴볼 일입니다. 대개는 경로·네트워크·주소를 잘못 본 것입니다.

숫자가 아니라 **구조**가 맞는지 보세요. 예를 들어 "에너지 × 100 sun = 소각될 TRX"라는 관계는 가격이 바뀌어도 계산 방식이 그대로입니다. 지금 값이 궁금하면 직접 확인하세요.

```bash
npm run l04      # 지금의 대역폭·에너지 가격과 한도
npm run l03      # 지금의 잔고와 블록 번호
npm test         # 13개 레슨 전체를 미리보기로 재검증
```

---

## 그래도 안 되면

1. **문구를 그대로 복사해 두세요.** 지우지 말고 캡처하세요. 문구가 곧 원인입니다.
2. **[Lesson 12의 단계별 단서 표](lessons/12-error-detective/README.md#code)**에서 그 문구를 찾아보세요. 9개 실패 유형이 "단서 → 원인 → 해결"로 정리되어 있습니다.
3. `npm run l12`를 실행해 보세요. 아홉 가지 실패를 **일부러** 일으켜 보여 줍니다. 자산은 움직이지 않습니다.
4. **"고쳐 준다"는 사람에게 12단어·개인키·선금을 주지 마세요.** 어떤 실패도 복구 구문으로 고쳐지지 않습니다(규칙 12). 실패 문구만으로 원인을 말할 수 있는 것이 진짜 도움입니다.
5. 혼자 끙끙대지 마세요(규칙 13). 저장소 이슈로 문구와 `node -v` 결과를 함께 올리면 됩니다. **12단어는 절대 붙여넣지 마세요.**
