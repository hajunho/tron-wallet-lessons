# 🎓 개발자 경로 — 실행 순서, 도전 26개, wallet-practice 대응표, 졸업 과제

대상: 대학생·개발자. 읽는 블록은 [💻 코드](../../lessons/01-secret-key/README.md#code)와 [🔍 원리](../../lessons/01-secret-key/README.md#why)입니다.

> ⚠️ **연습 나라(테스트넷) 전용.** 조회는 Nile(`https://nile.trongrid.io`), EVM 쪽은 BTTC Donau(`https://pre-rpc.bt.io/`, chainId 1029)만 씁니다. 메인넷 URL을 코드 기본값으로 두지 않습니다.
> 모든 전송 코드의 기본은 미리보기(`SEND_TX=false`)이고, 브로드캐스트 직전에 `lib/guard.js`의 `assertCanSend`를 호출합니다. **이 저장소의 작성자·검수자는 어떤 경우에도 `SEND_TX=true`로 실행하지 않습니다.**
> 실습용 니모닉은 공개된 데모 니모닉(`abandon … about`)뿐입니다. 자기 실제 지갑의 12단어를 넣지 마세요.
> 시세·수익·투자는 이 저장소의 주제가 아닙니다.

---

## 1. 환경

```bash
node -v                # 20 이상. 검증은 23.11
npm install
npm run check          # 환경 점검
npm test               # = verify-readonly, 읽기 전용 레슨 일괄 확인
```

설치되는 것: tronweb 6.5.0(CommonJS: `const { TronWeb, utils: tronUtils } = require('tronweb')`), ethers 6.17.0, bip39 3.1.0, bip32 5.0.0-rc.0 + tiny-secp256k1 2.2.4, dotenv.

Faucet이 필요하면 Nile <https://nileex.io/join/getJoinPage>, BTTC Donau <https://testfaucet.bt.io/#/>. 탐색기는 `https://nile.tronscan.org/#/address/<T주소>`, `https://nile.tronscan.org/#/transaction/<txid>`, `https://testnet.bttcscan.com/tx/<0xhash>`.

**수정하지 않는 것**: `lib/`, `tools/`, `package.json`, `.env.example`, `.gitignore`, `lessons/`, `playground/`. 도전 과제는 스크립트를 **복사해서** 고칩니다. 헬퍼가 없으면 복사한 스크립트 안에 지역 함수로 만듭니다.

---

## 2. 스크립트 실행 순서

```bash
npm run l01   # lesson01 도 같은 명령
npm run l02
npm run l03
npm run l04
npm run l05
npm run l06   # MNEMONIC 환경변수 필요
npm run l07
npm run l08
npm run l09
npm run l10
npm run l11
npm run l12
npm run l13   # npm run audit 도 같은 명령
```

기타 명령: `npm run check`(환경 점검), `npm run new-wallet`(연습용 새 니모닉 생성), `npm run audit`(= l13), `npm test`(= `verify-readonly`), `npm run expected`(expected-output 생성 도구).

| 레슨 | 슬러그 | 네트워크 | `.env` 없이? | 실행 시간 | 주요 환경변수 |
|---|---|---|---|---|---|
| 01 | [01-secret-key](../../lessons/01-secret-key/README.md#code) | 불필요 | 자동(데모) | 0.3s | `DICE`, `PASSPHRASE`, `SHOW_SECRETS`, `WORDLIST` |
| 02 | [02-key-to-address](../../lessons/02-key-to-address/README.md#code) | 불필요 | 자동(데모) | 0.3s | `MNEMONIC` |
| 03 | [03-read-balance](../../lessons/03-read-balance/README.md#code) | Nile | 자동(데모) | 2.6s | `ADDRESS`, `MNEMONIC` |
| 04 | [04-bandwidth-energy](../../lessons/04-bandwidth-energy/README.md#code) | Nile | 자동(데모) | 2.3s | `ADDRESS`, `MNEMONIC` |
| 05 | [05-build-and-sign](../../lessons/05-build-and-sign/README.md#code) | Nile | 자동(데모) | 0.8s | `TO`, `AMOUNT_TRX`, `MEMO`, `EXTEND`, `MNEMONIC` |
| 06 | [06-send-testnet](../../lessons/06-send-testnet/README.md#code) | Nile | **아니오 — `MNEMONIC` 필수** | 1.4s | `TO`, `AMOUNT_TRX` |
| 07 | [07-receipt](../../lessons/07-receipt/README.md#code) | Nile | 자동(TXID 없으면 최근 블록에서 자동 선택) | 3.5s | `TXID` |
| 08 | [08-sign-message](../../lessons/08-sign-message/README.md#code) | 불필요 | 자동(데모) | 0.2s | `MESSAGE`, `CHAIN_ID`, `MNEMONIC` |
| 09 | [09-trc20-approve](../../lessons/09-trc20-approve/README.md#code) | Nile | 자동(데모) | 1.8s | `AMOUNT_USDT`, `SPENDER`, `MNEMONIC` |
| 10 | [10-simulate](../../lessons/10-simulate/README.md#code) | Nile + Donau | 자동(데모) | 3.5s | `TO`, `AMOUNT_USDT`, `SKIP_BTTC`, `MNEMONIC` |
| 11 | [11-bttc-same-key](../../lessons/11-bttc-same-key/README.md#code) | Donau | 자동(데모) | 3.0s | `TO`, `AMOUNT_BTT`, `SEND_TX`, `MNEMONIC` |
| 12 | [12-error-detective](../../lessons/12-error-detective/README.md#code) | Nile + Donau | 자동(데모) | 3.5s | `CASE`(1~9), `MNEMONIC`, `SEND_TX`(사건 3의 관문) |
| 13 | [13-audit-and-graduation](../../lessons/13-audit-and-graduation/README.md#code) | Nile | 자동(데모) | 4.0s | `ADDRESS`(또는 `-- <T주소>`), `SPENDERS`, `MNEMONIC` |

13개 합계 **27.2초** (2026-09-12, `SEND_TX=false`로 전부 exit 0 확인). 여러 레슨은 `LEVEL=teen` 같은 해설 수준 옵션도 받습니다.

순서 의존성 두 곳:
- **05 → 06**: 06은 05에서 만든 봉투와 같은 형태를 브로드캐스트합니다.
- **06 → 07**: 07의 기본 입력은 06이 남긴 txid(`.last-tx.json`)입니다. 06을 건너뛰었다면 07은 최근 블록에서 트랜잭션을 자동으로 골라 씁니다.

---

## 3. 도전 26개 (13 레슨 × 2)

각 README `#code` 블록의 "도전"을 그대로 모았습니다. 원문은 해당 레슨 링크에서 확인하세요.

| 레슨 | 난이도 | 도전 |
|---|---|---|
| [01](../../lessons/01-secret-key/README.md#code) | 쉬움 | 주사위를 50번 굴려 `DICE="…"` 로 두 번 실행하고, 두 번 모두 `[5]` 의 T주소가 같은지 확인하세요. 그다음 눈 하나만 바꿔 다시 실행해 주소가 통째로 바뀌는지 보세요. |
| [01](../../lessons/01-secret-key/README.md#code) | 어려움 | 스크립트를 복사해 `ENTROPY_BYTES` 를 32로 바꿔 보세요. 체크섬은 `32 × 8 / 32 = 8` 비트, 전체 264비트 = 11비트 × 24가 되어야 합니다(스크립트의 공식에서 유도한 값이므로 직접 실행해 확인 필요). 24단어가 나오고 `validateMnemonic` 이 `true` 인지, `lib/wallet.js` 의 `loadMnemonic` 이 24단어를 받아 주는지 확인하세요. (표를 찍는 반복문과 `WORDS_PER_MNEMONIC` 도 함께 고쳐야 합니다.) |
| [02](../../lessons/02-key-to-address/README.md#code) | 쉬움 | [4]단계 표를 index 0~9로 늘리고, `TronWeb.address.toHex` 결과의 앞 두 글자가 모두 `41`인지 확인하는 줄을 추가하세요. |
| [02](../../lessons/02-key-to-address/README.md#code) | 어려움 | `TronWeb.isAddress`를 쓰지 않고 `ethers.decodeBase58`로 T주소를 25바이트로 되돌린 뒤, 앞 21바이트의 sha256(sha256()) 앞 4바이트가 뒤 4바이트와 같은지 비교하는 `myIsAddress` 함수를 만들고, [6]단계의 세 주소(원래·오타·닮은 주소)에서 `TronWeb.isAddress`와 같은 답이 나오는지 확인하세요. |
| [03](../../lessons/03-read-balance/README.md#code) | 쉬움 | `[3]`의 TRC-10 출력을 첫 번째 토큰 하나가 아니라 `assetV2` 전체를 표로 찍도록 바꿔 보세요. `getTokenFromID`는 토큰마다 한 번씩 호출됩니다(요청이 많으면 429가 날 수 있으니 `tryCall`로 감싸세요). |
| [03](../../lessons/03-read-balance/README.md#code) | 어려움 | 같은 니모닉의 index 0~4 주소 5개(Lesson 02)를 한 번에 조회해 `주소 / 활성화 / TRX / USDT / 권한 키 = 나?` 표를 출력하세요. 활성화되지 않은 주소의 USDT `balanceOf`가 0인지, 예외인지 실제로 확인하고 결과를 주석으로 남기세요. |
| [04](../../lessons/04-bandwidth-energy/README.md#code) | 쉬움 | `[3]`에서 `addUpdateData`로 메모 "hello"를 붙인 뒤(서명 전) `raw_data_hex` 바이트가 몇 늘어나는지 출력해 보세요. 메모 수수료 1 TRX(`getMemoFee`)도 함께 표시하세요. (레슨 5의 함수를 미리 씁니다.) |
| [04](../../lessons/04-bandwidth-energy/README.md#code) | 어려움 | `[4]`의 `energy_required`와 `[1]`의 남은 에너지, `[2]`의 가격을 조합해 "지금 이 계정이 USDT를 몇 번까지 소각 없이 보낼 수 있는지"를 계산해 출력하세요. 남은 에너지가 0인 주소(`ADDRESS=` 바꿔 실행)에서는 필요한 TRX를 sun과 TRX로 병기하세요. |
| [05](../../lessons/05-build-and-sign/README.md#code) | 쉬움 | `EXTEND=600 npm run l05`를 실행해 `[5]`의 "입력 객체의 txID"와 "입력 객체의 expiration" 두 줄을 읽고, 왜 하나는 "옛 값 그대로"이고 다른 하나는 "제자리에서 바뀜"인지 한 줄로 적어 보세요. |
| [05](../../lessons/05-build-and-sign/README.md#code) | 어려움 | `out/05-signed.json`을 읽어 (1) `txID === sha256(raw_data_hex)`인지, (2) `expiration`이 현재 시각보다 뒤인지, (3) `signature[0]`이 130 hex인지 검사하는 `verify-envelope.js`를 만들어 보세요. 세 가지가 모두 통과해야 "우체통에 넣을 수 있는 봉투"입니다. 더 나아가 서명에서 서명자 T주소를 복원해 `owner_address`와 비교해 보세요(방법은 [레슨 05 #code](../../lessons/05-build-and-sign/README.md#code)에서 검증된 대로 `ethers.recoverAddress('0x' + signed.txID, '0x' + signed.signature[0])`). |
| [06](../../lessons/06-send-testnet/README.md#code) | 쉬움 | `[1]` 에서 `freeNetLeft < 266` 일 때 경고가 나옵니다. 오늘 이미 무료 대역폭을 다 썼다면 어떤 줄이 바뀌는지 예측하고, `expected-output.txt` 와 비교해 보세요. |
| [06](../../lessons/06-send-testnet/README.md#code) | 어려움 | `.last-tx.json` 에 `expiration` 과 `ref_block_bytes` 도 함께 저장하도록 바꾸고, 레슨 7 스크립트가 "이 txid 는 어느 블록을 참조했는가"를 출력하게 이어 보세요. `lib/` 는 건드리지 말고 레슨 스크립트 안에서만 해결합니다. |
| [07](../../lessons/07-receipt/README.md#code) | 쉬움 | `TXID=`에 레슨 6에서 받은 txid 대신 아무 단순 TRX 전송의 txid를 넣어 3단계에서 `receipt.energy_*: 없음` 줄과 `net_fee` 또는 `net_usage`가 어떻게 나오는지 확인하세요. 무료 대역폭을 썼다면 `net_fee` 없이 `net_usage`가 나옵니다(확인 필요). |
| [07](../../lessons/07-receipt/README.md#code) | 어려움 | 5단계에서 `topics[0]`이 Transfer가 아닌 로그(예: 이번 실행의 `fe6f7f85…0d12`)를 만났을 때, `tronWeb.trx.getContract(주소)`로 체인의 ABI(`abi.entrys`)를 읽어 `event` 항목의 이름·인자 타입으로 서명 문자열을 조립하고 `TronWeb.sha3`로 해시해 `topics[0]`과 맞는 이벤트를 찾아 이름을 출력하도록 확장하세요. 6단계의 `event_name`과 같아야 합니다. |
| [08](../../lessons/08-sign-message/README.md#code) | 쉬움 | `MESSAGE`를 빈 문자열 `""`로 실행해 보세요. 바이트 길이 0이어도 서명이 만들어지는지, `[2]`의 "바꾼 메시지"가 무엇이 되는지 확인하세요. |
| [08](../../lessons/08-sign-message/README.md#code) | 어려움 | 스크립트의 Permit 서명 `typedSig`(0x + 130 hex)를 r(32바이트), s(32바이트), v(1바이트)로 직접 잘라 출력한 뒤, `ethers.recoverAddress(evmHash, { r, s, v })`로 다시 복원해 같은 주소가 나오는지 확인하세요. (ethers 6.17 에서 `{ r, s, v }` 객체 형식 동작 확인 — 서명자의 0x 주소가 나옵니다.) |
| [09](../../lessons/09-trc20-approve/README.md#code) | 쉬움 | `AMOUNT_USDT=0`으로 실행해 `[2]`의 워드 2와 `[5]`의 "이번 금액" 판정이 어떻게 나오는지 보세요. approve(0)은 취소 트랜잭션이지만 리허설 에너지는 0이 아닙니다. `[3]`의 `energy_used`가 3 USDT일 때와 같은지 다른지 확인하세요. |
| [09](../../lessons/09-trc20-approve/README.md#code) | 어려움 | 스크립트에 `[7]` 단계를 추가해, `tronWeb.trx.getContract(NILE.usdt).abi.entrys`에서 `Approval` 이벤트 항목을 찾아 `indexed` 필드 이름(owner, spender)과 non-indexed 필드(value)를 출력하세요. 레슨 7의 log 디코딩과 연결하면, 실제 approve 뒤 receipt의 `log[0].topics`에서 owner/spender를 읽을 수 있습니다(Approval 토픽 해시 값은 `TronWeb.sha3('Approval(address,address,uint256)')`로 직접 계산해 확인). |
| [10](../../lessons/10-simulate/README.md#code) | 쉬움 | `TO=<자기 주소>`로 실행해 점검표 1번이 ❌(자기 자신)로 바뀌는지 확인하세요. 리허설(2단계)은 성공할까요? 왜 점검표가 따로 필요한지 출력으로 답하세요. |
| [10](../../lessons/10-simulate/README.md#code) | 어려움 | 스크립트의 `[3]`을 고쳐 `approve(address,uint256)`을 잔고와 무관하게 리허설해 보세요(레슨 9의 허락증). `energy_used`가 `transfer`와 얼마나 다른지, `constant_result`가 0인지 확인하고 그 이유를 적으세요. (approve 반환값이 bool인지는 확인 필요) |
| [11](../../lessons/11-bttc-same-key/README.md#code) | 쉬움 | `TO` 에 T주소를 넣고 실행해 머리 부분의 `받는 사람` 줄이 `T주소 … → 0x 로 변환` 으로 바뀌는지 확인하세요. 스크립트의 `resolveTo` 가 `TronWeb.isAddress` 와 `ethers.isAddress` 를 어떤 순서로 검사하는지 읽어 보세요. |
| [11](../../lessons/11-bttc-same-key/README.md#code) | 어려움 | `[4]` 의 `txRequest` 에서 `chainId` 를 `1030` 으로 바꿔 서명한 뒤 `ethers.Transaction.from(signedRaw).chainId` 와 `hash` 가 어떻게 달라지는지 출력하세요(브로드캐스트는 하지 않습니다). "나라 이름이 서명 안에 들어간다"를 숫자로 확인하는 과제입니다. `lib/` 는 건드리지 않습니다. |
| [12](../../lessons/12-error-detective/README.md#code) | 쉬움 | 사건 6의 `ZERO_TXID`를 레슨 7에서 봤던 실제 txID(`dd46b445…c8bd8`)로 바꿔 `getTransactionInfo`가 `{}`가 아닌 영수증을 돌려주는지 확인하세요. `TXID` 환경변수를 새로 받도록 고쳐 보세요. |
| [12](../../lessons/12-error-detective/README.md#code) | 어려움 | 사건 3의 새 지갑을 재사용할 수 있게 고쳐, 활성화 뒤에 `CONTRACT_VALIDATE_ERROR`가 사라지는지 보세요. ① `SHOW_SECRETS=true CASE=3 npm run l12`로 새 지갑의 주소·개인키를 적어 둡니다(스크립트가 실행마다 `TronWeb.createRandom()`으로 새로 만들므로, 적어 두지 않으면 다음 실행에서 또 다른 주소가 생깁니다). ② Nile faucet(`https://nileex.io/join/getJoinPage`)으로 그 주소에 TRX를 받습니다. ③ `stranger` 자리를 `process.env.STRANGER_PK`가 있으면 그 키를 쓰도록 레슨 안의 지역 코드로 고칩니다(`lib/`는 건드리지 않습니다). ④ `STRANGER_PK=… CASE=3 SEND_TX=true npm run l12`로 다시 돌립니다(브로드캐스트 직전 `assertCanSend`는 그대로 둡니다). 단, **`SEND_TX=true`는 이 저장소의 모든 경로에서 쓰지 않습니다.** 모든 레슨은 미리보기(`SEND_TX=false`)로만 실행합니다. 실제 전송을 해 보고 싶다면 이 저장소를 복사한 본인 실습에서, 본인이 `npm run new-wallet`으로 만든 연습용 니모닉과 테스트넷(Nile·Donau)으로만 하세요. |
| [13](../../lessons/13-audit-and-graduation/README.md#code) | 쉬움 | `[4]`의 `SPENDERS`에 Lesson 09에서 approve했던 상대를 넣고, allowance가 0이 아니면 ⚠️ 문구에 "approve(0)을 보내려면 `npm run l09`"를 덧붙여 보세요. 그다음 여러 상대를 쉼표로 넣어 표로 출력하도록 바꿔 보세요. |
| [13](../../lessons/13-audit-and-graduation/README.md#code) | 어려움 | `checks` 배열을 JSON 파일(`out/13-audit-YYYY-MM-DD.json`)로 저장하고, 다음 달 실행 때 지난 파일과 비교해 "지난달 ✅였는데 이번 달 ⚠️로 바뀐 항목"만 따로 출력하세요. 권한 키가 바뀐 경우를 가장 크게 표시해야 합니다. |

**도전 중 "확인 필요"로 남아 있는 것** (문서에서 단정하지 않은 항목)

- 01 어려움: 스크립트 복사본에서 `ENTROPY_BYTES`(환경변수가 아니라 `lessons/01-secret-key/script.js`의 소스 상수 `const ENTROPY_BYTES = 16;`)를 32로 바꿨을 때의 체크섬 8비트·264비트 계산은 스크립트 공식에서 유도한 값이라 **직접 실행해 확인 필요**.
- 07 쉬움: 무료 대역폭을 썼을 때 `net_fee` 없이 `net_usage`가 나오는지 **확인 필요**.
- 10 어려움: `approve` 반환값이 bool인지 **확인 필요**.
- 12 어려움: faucet으로 TRX를 받은 뒤의 재실행은 `SEND_TX=true`가 필요합니다. **`SEND_TX=true`는 이 저장소의 모든 경로에서 쓰지 않습니다.** 모든 레슨은 미리보기(`SEND_TX=false`)로만 실행합니다. 실제 전송을 해 보고 싶다면 이 저장소를 복사한 본인 실습에서, 본인이 `npm run new-wallet`으로 만든 연습용 니모닉과 테스트넷(Nile·Donau)으로만 하세요.

---

## 4. wallet-practice 대응·차이표

원본 저장소는 **soaryong/wallet-practice** — 이더리움·Sui·Solana를 다루는 개발자용 12레슨입니다. 아래 대응은 각 레슨 README 머리의 "wallet-practice 대응" 표기를 그대로 옮긴 것입니다.

| 이 저장소 | 제목 | wallet-practice 대응 (README 표기) |
|---|---|---|
| 01 | 12개 단어로 만든 비밀 열쇠 | Lesson 1 |
| 02 | 열쇠에서 우편함 번호가 나와요 | Lesson 2 |
| 03 | 광장에 걸린 장부: 1 TRX는 사탕 100만 알 | Lesson 3 |
| 04 | 연료: 대역폭 입장권과 에너지 입장권 | 없음 — 트론 고유 개념. wallet-practice의 gas와 대비해서 읽으세요 |
| 05 | 편지 쓰고 도장 찍기(아직 안 보내요) | Lesson 4 전반부 |
| 06 | 진짜로 보내기(연습 나라에서) | Lesson 4 후반부 |
| 07 | 영수증과 발자국 | Lesson 10 |
| 08 | '나야'라고 증명하기(돈은 안 들어요) | Lesson 7 |
| 09 | 사탕통 장부와 허락증(TRC-20) | Lesson 8 |
| 10 | 리허설: 보내기 전에 미리 해보기 | Lesson 9 |
| 11 | 한 열쇠, 두 나라, 두 경로: BTTC에서도 열려요 | Lesson 6, 그리고 Lesson 4의 EVM 비교 |
| 12 | 실패 탐정: 왜 안 됐을까? | Lesson 11 |
| 13 | 내 지갑 점검과 졸업 | 없음 — 종합 |

**대응이 표기되지 않은 원본 레슨**: 위 표에 나오지 않는 wallet-practice 레슨 번호는 **5번과 12번**입니다. 이 두 레슨의 제목·내용과, 그것이 이 저장소의 어느 레슨에 해당하는지는 **(확인 필요)** — 원본 저장소를 직접 열어 확인해야 합니다.

**구성상의 차이**

| 항목 | wallet-practice (원본) | tron-wallet-lessons (이 저장소) |
|---|---|---|
| 체인 | 이더리움 · Sui · Solana | 트론(Nile) + BTTC(Donau, EVM 호환) |
| 레슨 수 | 12 | 13 |
| 대상 | 개발자 | 초등 저학년·고학년 / 중고등 / 대학·개발자 / 일반인 (한 README에 4개 블록) |
| 레슨 1개의 구성 | (확인 필요) | `README.md`(8블록 고정) + `script.js` + `activity.md` + `quiz.md` + `expected-output.txt` |
| 축 | 체인별 기능 순서 | 안전 규칙 13개와 1:1 |
| 오프라인 자료 | (확인 필요) | 레슨마다 오프라인 활동 1개 + 무장비 5분 버전 + 인쇄용 워크시트, 브라우저 놀이터 파일 6개(허브 `index.html` + 놀이 도구 5개. `dice-to-words.html`·`address-xray.html`·`approve-decoder.html`은 CDN ethers 6.17.0 필요) |
| 전송 기본값 | (확인 필요) | 미리보기(`SEND_TX=false`), 브로드캐스트 직전 `assertCanSend` |
| 언어 | (확인 필요) | 한국어(코드 주석 포함) |

**체인 모델 차이** — 각 레슨 `#code` 블록의 "트론 vs EVM 차이" 표에서 옮긴 행들입니다. 원본 표는 해당 레슨에서 보세요.

| 항목 | 트론 (Nile) | EVM (BTTC Donau 등) | 출처 |
|---|---|---|---|
| 파생 경로 | `m/44'/195'/0'/0/0` (coin_type 195) | `m/44'/60'/0'/0/0` (coin_type 60) | [01](../../lessons/01-secret-key/README.md#code) |
| 같은 12단어 | 경로가 달라 **다른 열쇠** | — | [01](../../lessons/01-secret-key/README.md#code) |
| 주소 표기 | T… (base58check, hex는 `41`+40hex) | 0x + 40hex | [08](../../lessons/08-sign-message/README.md#code) |
| 최소 단위 | sun (10^6 = 1 TRX) | wei (10^18 = 1 BTT/ETH) | [03](../../lessons/03-read-balance/README.md#code) |
| 잔고 조회 | `tronWeb.trx.getBalance(T주소)` → number | `provider.getBalance(0x주소)` → bigint | [03](../../lessons/03-read-balance/README.md#code) |
| "계정 없음" | `getAccount` → `{}` (활성화 개념 있음) | 잔고 0, nonce 0 (활성화 개념 없음) | [03](../../lessons/03-read-balance/README.md#code) |
| 수수료 단위 | 대역폭(byte) + 에너지 | gas | [04](../../lessons/04-bandwidth-energy/README.md#code) |
| 미리 확보 | TRX 스테이킹으로 자원 획득 | 없음(매번 gasPrice × gas) | [04](../../lessons/04-bandwidth-energy/README.md#code) |
| 상한 | `feeLimit`(sun 단위 정수) — 에너지 소각 상한 | `gasLimit` | [04](../../lessons/04-bandwidth-energy/README.md#code) |
| 중복·재생 방지 | `ref_block_bytes`/`ref_block_hash` + `expiration`(기본 60초). nonce 없음 | 계정별 `nonce` | [05](../../lessons/05-build-and-sign/README.md#code), [06](../../lessons/06-send-testnet/README.md#code) |
| 만료 | 있음(지나면 브로드캐스트 실패) | 없음(nonce가 소진될 때까지 유효) | [05](../../lessons/05-build-and-sign/README.md#code) |
| 브로드캐스트 응답 | `{ result: true, txid }` 또는 `{ code, message(hex) }` | `broadcastTransaction(raw)` → `TransactionResponse`, 실패는 예외 | [06](../../lessons/06-send-testnet/README.md#code), [11](../../lessons/11-bttc-same-key/README.md#code) |
| 취소·가속 | 없음. 만료 전엔 기다리고, 만료되면 새로 빌드 | 같은 nonce로 덮어쓰기 시도 가능(확인 필요) | [06](../../lessons/06-send-testnet/README.md#code) |
| 수수료 항목 | `net_fee`/`net_usage`(대역폭) + `energy_fee`/`energy_usage_total`(에너지), 합이 `fee`(sun) | `gasUsed × gasPrice`(wei) | [07](../../lessons/07-receipt/README.md#code) |
| 영수증 | `getTransactionInfo(txid)` 폴링(빈 `{}` 가능) | `response.wait(1, 30000)` → receipt 또는 null | [11](../../lessons/11-bttc-same-key/README.md#code) |
| 메시지 프리픽스 | `\x19TRON Signed Message:\n` | `\x19Ethereum Signed Message:\n` | [08](../../lessons/08-sign-message/README.md#code) |
| 구조화 서명 | TIP-712 (`signTypedData`) | EIP-712 — 해시 계산이 **동일** | [08](../../lessons/08-sign-message/README.md#code) |
| 검증 반환 | `verifyMessageV2` → 주소 / `verifyTypedData` → true 또는 **예외** | ethers는 모두 주소 반환 | [08](../../lessons/08-sign-message/README.md#code) |
| 토큰 선택자 | ERC-20과 동일 (`approve` = `095ea7b3`, `transfer` = `a9059cbb`) | 동일 | [09](../../lessons/09-trc20-approve/README.md#code) |
| calldata | `data`(0x 없는 hex) — ethers 인코딩과 바이트 단위로 같음 | `0x` + hex | [09](../../lessons/09-trc20-approve/README.md#code) |
| 리허설 | `triggerConstantContract` → `energy_used`, `estimateEnergy` → `energy_required` | `eth_call` / `estimateGas` | [09](../../lessons/09-trc20-approve/README.md#code), [10](../../lessons/10-simulate/README.md#code) |
| 잔고 부족 리허설 | `REVERT opcode executed` | `estimateGas` → `insufficient funds` 예외(확인 필요) | [11](../../lessons/11-bttc-same-key/README.md#code) |
| 자기 자신에게 전송 | 거부 (`Cannot transfer TRX to the same account`) | 허용(수수료만 나감) | [11](../../lessons/11-bttc-same-key/README.md#code) |
| 개인키 입력 형식 | `TronWeb.address.fromPrivateKey('64hex')` — 0x 없음 | `new ethers.Wallet('0x' + 64hex)` — 0x 필요 | [11](../../lessons/11-bttc-same-key/README.md#code) |
| 계정 권한 | owner/active permission, threshold, weight를 체인이 지원. **바꿀 수 있음** | EOA는 키 고정. 다중서명은 별도 컨트랙트 지갑 | [13](../../lessons/13-audit-and-graduation/README.md#code) |
| "열쇠가 샜다"의 흔적 | 권한 키 변경(`updateAccountPermissions`)이 장부에 남음 | 잔고 이동만 남음 | [13](../../lessons/13-audit-and-graduation/README.md#code) |
| 최근 거래 조회 | TronGrid REST `/v1/accounts/{addr}/transactions` | 노드 RPC에는 없음. 탐색기 API 사용(확인 필요) | [13](../../lessons/13-audit-and-graduation/README.md#code) |

트론에만 있어서 wallet-practice에 대응 레슨이 없는 개념: **자원 모델(대역폭·에너지)**과 **계정 활성화**는 [레슨 04 #why](../../lessons/04-bandwidth-energy/README.md#why)(정본 — `GLOSSARY.md`의 "새 친구 우편함 만들기"도 여기를 가리킵니다), **계정 권한 변경**은 [레슨 13](../../lessons/13-audit-and-graduation/README.md), **nonce 없는 재생 방지**는 [레슨 05](../../lessons/05-build-and-sign/README.md)에서 다룹니다. 레슨 03은 `getAccount()`가 빈 객체(`{}`)로 오는 것을 관찰하는 데까지만 다룹니다.

---

## 5. 졸업 과제 3개

세 과제 모두 **읽기 전용**입니다. 브로드캐스트 없음, `.env` 생성 없음, `lib/`·`tools/`·`package.json`·`lessons/`·`playground/` 수정 없음. 새 파일은 저장소 밖이나 본인 작업 폴더에 만드세요. 사실은 [CHEATSHEET.md](../../CHEATSHEET.md)에 정리된 검증 값(집필자에게 별도로 전달되는 검증 사실 목록을 옮긴 것으로, 그 원본 목록은 저장소에 없습니다)만 쓰고, 확인하지 못한 것은 출력에 `(확인 필요)`로 찍습니다.

### 과제 1 — 지갑 점검 CLI (`audit-cli.js`)

**무엇** — T주소 하나(또는 여러 개)를 인자로 받아 한 화면에 점검 결과를 출력합니다. 레슨 03·04·09·13을 합친 것입니다.

**출력에 반드시 들어갈 항목**

1. 활성화 여부 — `getAccount(addr)`가 `{}`면 미활성화. 활성화 비용은 1,000,000 sun(1 TRX)
2. TRX 잔고 — sun과 TRX 병기
3. USDT 잔고 — Nile USDT `TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf`, decimals 6
4. 자원 — `getAccountResources`의 `freeNetLimit`(600), `freeNetUsed`, `EnergyLimit`, `EnergyUsed`. 없는 필드는 `?? 0`
5. **권한 키가 나인가** — `owner_permission.keys[0].address === TronWeb.address.toHex(addr)`. 다르면 가장 크게 ⚠️
6. allowance — 인자로 받은 spender 목록에 대해 `allowance(owner, spender)`. 0이 아니면 ⚠️
7. 최근 거래 — TronGrid REST `/v1/accounts/{T주소}/transactions?limit=N&only_confirmed=true`

**통과 조건**

- 데모 idx0 `TUEZSdKsoDHQMeZwihtdoBiN46zxhGWYdH`과 idx1 `TSeJkUh4Qv67VNFwY8LaAxERygNdy6NQZK`에 대해 **권한 키 항목이 둘 다 ⚠️** 로 나온다(둘 다 `41156f4463ce90ac11e1855ff99e4273806ad847cf`로 바뀌어 있음).
- `npm run new-wallet`로 만든 새 주소에 대해 **미활성화**로 나오고, 예외로 죽지 않는다.
- 모든 네트워크 호출이 try/catch로 감싸여 있고, 429일 때 한국어로 "잠시 후 다시"를 안내한다.
- 결과를 `out/audit-<주소>-<날짜>.json`으로 저장한다(레슨 13 어려움 도전과 이어짐).
- 실행 시간 60초 이내, 폴링은 최대 30초.

### 과제 2 — 오프라인 봉투 검사기 (`verify-envelope.js`)

**무엇** — 서명된 트랜잭션 JSON(예: `out/05-signed.json`)을 받아 **네트워크 없이** 유효성을 검사합니다. 레슨 05·08·12를 합친 것입니다. 레슨 05 어려움 도전의 확장판입니다.

**검사 항목**

1. `txID === sha256(raw_data_hex)` — ethers `sha256`으로 계산
2. `expiration`이 현재 시각보다 뒤인가 (지났으면 브로드캐스트 실패)
3. `signature[0]`이 130 hex인가
4. `raw_data.contract[0].type`이 무엇인가(`TransferContract` / `TriggerSmartContract`)
5. `TriggerSmartContract`면 `data` 앞 4바이트 선택자를 이름으로 바꿔 출력(`a9059cbb` → transfer, `095ea7b3` → approve)
6. `owner_address`/`to_address`를 `TronWeb.address.fromHex`로 T주소로 되돌려 사람이 읽을 수 있게 출력
7. `owner_address === to_address`면 ⚠️ (`Cannot transfer TRX to the same account`가 될 봉투)
8. raw_data_hex 바이트 수와 예상 대역폭 비용(× 1000 sun/byte)

**통과 조건**

- 네 항목(1·2·3·7)이 모두 통과하면 "우체통에 넣을 수 있는 봉투", 하나라도 실패하면 **어느 항목이 왜 실패했는지** 한국어 한 줄로 출력한다.
- `expiration`을 과거로 고친 JSON을 넣으면 2번이 실패한다.
- `raw_data_hex`의 한 글자를 바꾼 JSON을 넣으면 1번이 실패한다.
- 서명자 T주소 복원을 붙인다. 방법은 [레슨 05 #code](../../lessons/05-build-and-sign/README.md#code)에서 검증됐다: `ethers.recoverAddress('0x' + signed.txID, '0x' + signed.signature[0])` → `0x` 주소 → `'41' + hex` → T주소가 `owner_address`와 일치.
- 네트워크 호출이 **하나도 없다**(레슨 01·02·08과 같은 오프라인 스크립트).

### 과제 3 — 서명 요청 설명기 (`explain-request.js`)

**무엇** — 지갑이 띄우는 서명 팝업의 내용을 사람 말로 바꿔 주고 위험 신호를 표시합니다. 레슨 09·10·12를 합친 것이고, 놀이터 [허락증 판독기](../../playground/approve-decoder.html)와 [서명 팝업 판별 놀이](../../playground/signing-popup-simulator.html)의 CLI 판입니다.

**입력** — 다음 셋 중 하나

- TRC-20 calldata hex (`095ea7b3…`, `a9059cbb…`)
- 미서명 트랜잭션 JSON
- 메시지 문자열 또는 TIP-712 domain/types/value

**출력**

1. 무슨 함수인가 — 선택자 4바이트 → 이름, 그리고 32바이트 워드별 인자 해독(주소는 T주소로 되돌려 출력)
2. 위험 신호 — 다음을 검사해 ⚠️와 규칙 번호를 붙인다
   - 금액 칸이 `ffff…`에 가까운 무제한 approve → 규칙 9
   - spender/수신자가 인자로 준 "아는 주소 목록"에 없음 → 규칙 6
   - 읽을 수 없는 calldata(선택자를 모름) → 규칙 8
   - 자기 자신에게 전송 → 규칙 12
3. 리허설 결과 — `triggerConstantContract`로 `energy_used`, `estimateEnergy`로 `energy_required`를 붙이고 예상 소각 TRX = energy × 100 sun을 계산. `REVERT opcode executed` 예외가 나면 "보내지 않는다"(규칙 10)로 결론
4. `feeLimit` 검사 — sun 정수인가. 소수/TRX 단위를 넣으면 빌드 단계에서 `Invalid feeLimit provided`가 나므로 그 전에 막는다
5. 마지막 한 줄 결론 — "도장을 찍어도 되는가 / 찍지 않는가"와 근거 규칙 번호

**통과 조건**

- 레슨 09 `[2]` 단계 출력의 approve calldata를 넣으면 함수 이름·spender T주소·금액이 놀이터 판독기 결과와 **일치**한다.
- 잔고를 넘는 transfer calldata를 넣으면 3번에서 `REVERT opcode executed`를 잡아 "보내지 않는다"로 끝난다.
- 선택자를 모르는 임의 hex를 넣으면 규칙 8로 ⚠️하고 리허설을 시도하지 않는다.
- 어떤 입력에도 브로드캐스트하지 않고, 개인키를 출력하지 않는다(가려야 하면 `lib/print.js`의 `mask`/`maskMnemonic` 방식을 따른다).

### 졸업 확인

세 과제를 끝냈으면 [Lesson 13 ✅ 확인](../../lessons/13-audit-and-graduation/README.md#check)의 문제를 풀고, 13장 규칙 카드를 한 파일로 모으세요. 그리고 과제를 만들면서 **확인하지 못한 항목**을 `(확인 필요)` 목록으로 남기세요 — 모르는 것을 모른다고 적어 두는 것이 이 저장소의 규칙 12(실패는 단서다)의 개발자 버전입니다.
