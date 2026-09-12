# 변경 기록 (CHANGELOG)

이 저장소의 눈에 보이는 변경만 적습니다. 날짜는 검증을 실제로 끝낸 날입니다.
버전은 `package.json` 의 `version` 과 맞춥니다.

---

## 0.1.0 — 2026-09-12 (초기 공개)

트론(TRON)과 BTTC로 암호화폐 지갑을 배우는 13개 레슨의 첫 공개판입니다.
하나의 저장소 안에서 초등학생 · 중고등학생 · 대학생·개발자 · 일반인 네 눈높이가 같은 주제를 각자의 블록으로 읽습니다.
원본 아이디어는 `soaryong/wallet-practice`(이더리움·Sui·Solana 12레슨, 개발자용)이고, 이 저장소는 트론·BTTC로 옮기면서 비개발자용 블록과 안전 교육을 더한 것입니다.

### 포함된 것

**레슨 13개** — 각 폴더에 `README.md`(7블록), `script.js`, `activity.md`, `quiz.md`, `expected-output.txt`.
레슨 제목은 13개 안전 규칙과 1:1로 대응합니다.

| 레슨 | 제목 | 규칙 |
|---|---|---|
| [01](lessons/01-secret-key/README.md) | 12개 단어로 만든 비밀 열쇠 | 열쇠(12단어)는 나만 안다. 고객센터도 모른다. |
| [02](lessons/02-key-to-address/README.md) | 열쇠에서 우편함 번호가 나와요 | 주소는 모두에게, 열쇠는 아무에게도. |
| [03](lessons/03-read-balance/README.md) | 광장에 걸린 장부: 1 TRX는 사탕 100만 알 | 잔고는 앱이 아니라 장부(탐색기)에서 확인하고, 토큰은 이름이 아니라 컨트랙트 주소로 알아본다. |
| [04](lessons/04-bandwidth-energy/README.md) | 연료: 대역폭 입장권과 에너지 입장권 | USDT만 있고 TRX가 0이면 아무것도 못 보낸다. 연료(입장권)가 먼저다. |
| [05](lessons/05-build-and-sign/README.md) | 편지 쓰고 도장 찍기(아직 안 보내요) | 도장을 찍기 전에 봉투(트랜잭션 내용)를 끝까지 읽는다. |
| [06](lessons/06-send-testnet/README.md) | 진짜로 보내기(연습 나라에서) | 보내면 되돌릴 수 없다. 처음 보내는 곳은 소액 먼저. |
| [07](lessons/07-receipt/README.md) | 영수증과 발자국 | "보냈다"는 말 대신 txID로 영수증을 본다. |
| [08](lessons/08-sign-message/README.md) | '나야'라고 증명하기(돈은 안 들어요) | 무엇에 도장 찍는지 읽지 못하면 찍지 않는다. |
| [09](lessons/09-trc20-approve/README.md) | 사탕통 장부와 허락증(TRC-20) | 허락(approve)은 필요한 만큼만, 다 쓰면 0으로. |
| [10](lessons/10-simulate/README.md) | 리허설: 보내기 전에 미리 해보기 | 앱이 "실패할 것 같다"고 하면 보내지 않는다. |
| [11](lessons/11-bttc-same-key/README.md) | 한 열쇠, 두 나라, 두 경로: BTTC에서도 열려요 | 보내기 전에 나라(네트워크)를 상대와 글자까지 맞춘다. |
| [12](lessons/12-error-detective/README.md) | 실패 탐정: 왜 안 됐을까? | 실패는 단서다. "고쳐 준다"는 사람은 사기다. |
| [13](lessons/13-audit-and-graduation/README.md) | 내 지갑 점검과 졸업 | 한 달에 한 번 점검, 사고가 나면 순서대로, 혼자 끙끙대지 않기. |

**놀이터 파일 6개** — 허브 `index.html` + 놀이 도구 5개. 설치 없이 브라우저에서 엽니다. 허브와 `ticket-board.html`·`signing-popup-simulator.html`은 인터넷 없이 열리고, `dice-to-words.html`·`address-xray.html`·`approve-decoder.html`은 ethers 6.17.0을 CDN에서 불러오므로 인터넷이 필요합니다.

- [`playground/index.html`](playground/index.html) — 놀이터 목록
- [`playground/dice-to-words.html`](playground/dice-to-words.html) — 주사위에서 12단어, 그리고 T주소까지
- [`playground/address-xray.html`](playground/address-xray.html) — T주소 ↔ `41`hex ↔ `0x` 변환·검사·닮은 주소 찾기
- [`playground/ticket-board.html`](playground/ticket-board.html) — 입장권 계산판(대역폭·에너지)
- [`playground/signing-popup-simulator.html`](playground/signing-popup-simulator.html) — 서명 팝업 판별 놀이
- [`playground/approve-decoder.html`](playground/approve-decoder.html) — approve / transfer / transferFrom calldata 해독

**문서**

- [`README.md`](README.md) — 저장소 소개와 전체 지도
- [`START-HERE.md`](START-HERE.md) — 대상별(초등·중고등·개발자·일반인) 출발점 안내
- [`SAFETY.md`](SAFETY.md) — 인쇄해서 쓰는 안전 문서 모음
- [`GLOSSARY.md`](GLOSSARY.md) — 비유와 정식 용어 대조 사전
- [`FAQ.md`](FAQ.md) — 자주 묻는 질문
- [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) — 증상 → 원인 → 해결
- [`docs/story-bible.md`](docs/story-bible.md) — 초등 이야기용 세계관·인물·비유 사전·예고 회수표
- [`docs/slides-outline.md`](docs/slides-outline.md) — 발표용 50장 슬라이드 대본(gamma.app 텍스트 붙여넣기용)
- [`docs/wallet-app-walkthrough.md`](docs/wallet-app-walkthrough.md) — 일반인용 지갑 앱 화면 따라 읽기, 거래소 출금 화면 읽는 법
- [`LICENSE`](LICENSE) — MIT
- [`CHANGELOG.md`](CHANGELOG.md) — 이 문서

**도구**

- `npm run check` — 환경 점검
- `npm run new-wallet` — 테스트넷용 새 니모닉 만들기
- `npm run audit` — 레슨 13(지갑 점검)과 같은 실행
- `npm test` (= `npm run verify-readonly`) — 13개 스크립트를 데모 니모닉·미리보기 모드로 전부 실행
- `npm run expected` — 각 레슨의 `expected-output.txt` 다시 생성
- 레슨 실행: `npm run l01` … `npm run l13` (`npm run lesson01` … `npm run lesson13` 도 같음)

### 검증 환경

- Node **23.11** (`package.json` 의 `engines` 는 `>=20`, 문서 권장은 22 이상)
- tronweb **6.5.0**
- ethers **6.17.0**
- bip39 **3.1.0**
- 네트워크: 트론 Nile 테스트넷(`https://nile.trongrid.io`), BTTC Donau 테스트넷(`https://pre-rpc.bt.io/`)
- 실행 조건: 환경변수 `MNEMONIC` 에 공개 데모 니모닉, `SEND_TX=false`. `.env` 파일은 만들지 않았습니다.

### 검증 결과 (2026-09-12)

13개 스크립트 전부 `SEND_TX=false` 로 exit 0. 실행 시간은 아래와 같습니다.

| 레슨 | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 | 11 | 12 | 13 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 초 | 0.3 | 0.3 | 2.6 | 2.3 | 0.8 | 1.4 | 3.5 | 0.2 | 1.8 | 3.5 | 3.0 | 3.5 | 4.0 |

- 네트워크가 없어도 되는 레슨: **01, 02, 08**. 나머지는 Nile 또는 Donau 조회가 필요합니다.
- `.env` 없이 데모 니모닉으로 자동 실행되는 레슨: 01, 02, 03, 04, 05, 08, 09, 10, 11, 12, 13.
  - 레슨 **06** 은 `MNEMONIC` 이 없으면 안내 후 종료합니다(전송 주체가 필요).
  - 레슨 **07** 은 `TXID` 가 없으면 최근 블록에서 하나를 자동으로 골라 읽습니다.
- 실제 브로드캐스트(`SEND_TX=true`)는 검증에서 **한 번도 실행하지 않았습니다.** 전송 경로는 미리보기까지만 확인했습니다.

### 알려진 한계

- 실제 브로드캐스트 결과(`sendRawTransaction` 성공 응답), 고수준 `contract.transfer(...).send(...)`, 멀티시그(`multiSign`), 스테이킹 후 자원 증가량은 검증하지 않았습니다. 관련 서술에는 "(확인 필요)"가 붙어 있습니다.
- 지갑 앱과 거래소 화면 설명은 특정 앱·버전·거래소를 단정하지 않는 일반적 기준입니다.
- 트론 언스테이킹 대기 기간(14일)은 문서 기반이며 이 저장소에서 실측하지 않았습니다(확인 필요).

---

## 테스트넷이라서 바뀔 수 있는 값

아래 값은 **오늘 맞았더라도 내일 달라질 수 있습니다.** 문서에 숫자로 적혀 있으니, 달라지면 해당 레슨의 출력 예시와 설명을 함께 고쳐야 합니다.

| 바뀔 수 있는 값 | 2026-09-12 확인값 | 나오는 곳 |
|---|---|---|
| BTTC Donau `gasPrice` | 9,000,000 gwei (단순 전송 21,000 gas ≈ 189 BTT) | 레슨 11 |
| 트론 에너지 가격 (`getEnergyFee`) | 100 sun/energy (이력 420 → 210 → 100) | 레슨 04, 10 |
| 트론 대역폭 가격 (`getTransactionFee`) | 1,000 sun/byte | 레슨 04, 05, 07 |
| Nile faucet 주소 | `https://nileex.io/join/getJoinPage` | 레슨 03, 06 |
| BTTC Donau faucet 주소 | `https://testfaucet.bt.io/#/` | 레슨 11 |
| 데모 주소 잔고 (Nile) | TRX 약 55,000, USDT 약 19,588 | 레슨 03, 04, 09, 10, 13 |
| 데모 주소 잔고 (Donau, 이더리움 경로) | BTT 약 166 | 레슨 11 |
| Nile USDT 컨트랙트 주소 | `TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf` | 레슨 03, 09, 10 |
| 데모 계정의 권한 키 | `41156f4463ce90ac11e1855ff99e4273806ad847cf` (원래 주인이 아님) | 레슨 01, 12, 13 |
| 탐색기 주소·URL 패턴 | `https://nile.tronscan.org/#/…`, `https://testnet.bttcscan.com/…` | 레슨 03, 07, 11 |
| Nile chainId / Donau chainId | 3448148188 / 1029 | 레슨 08, 11 |

### 값이 달라졌을 때 할 일

1. **전부 다시 돌려서 깨진 곳을 찾습니다.**

   ```bash
   npm test
   ```

   13개 레슨이 데모 니모닉·`SEND_TX=false` 로 실행되고, 통과/실패가 한 줄씩 찍힙니다. 실패한 레슨만 인자로 넘겨 다시 돌릴 수도 있습니다.

2. **출력 예시를 다시 만듭니다.**

   ```bash
   npm run expected
   ```

   각 레슨의 `expected-output.txt` 가 실제 출력으로 갱신됩니다. `git diff` 로 어떤 숫자가 달라졌는지 확인하세요.

3. **달라진 숫자를 문서에서 고칩니다.** `expected-output.txt` 의 변경분을 보고, 같은 숫자를 인용한 곳(해당 레슨 `README.md` 의 출력 해설, 위 표, `docs/slides-outline.md`)을 함께 수정합니다.

4. **faucet이나 탐색기 주소가 죽었으면** 링크만 고치지 말고, 그 값을 인용한 모든 레슨에서 함께 바꿉니다. 새 주소를 확인하지 못했다면 단정하지 말고 "(확인 필요)"를 붙입니다.

5. **데모 주소 잔고가 0이 되었으면** 조회·시뮬레이션 레슨의 출력이 달라집니다(레슨 10의 리허설은 `REVERT opcode executed` 로 바뀔 수 있습니다). 이때는 출력 예시를 갱신하고, 설명에 "잔고 상황에 따라 달라진다"는 한 줄을 남깁니다. **데모 주소에 자산을 보내려 하지 마세요.** 그 계정은 권한이 바뀌어 있어 원래 키로 아무것도 할 수 없습니다.

주 1회 월요일에 재검증 워크플로가 `npm test` 와 같은 검증을 자동으로 돌립니다. 실패 알림이 오면 위 순서를 따르세요. 워크플로 파일은 [`docs/ci/reverify.yml`](docs/ci/reverify.yml) 에 있고, 아직 `.github/workflows/` 로 옮겨지지 않았습니다. 켜는 방법은 [`docs/ci/README.md`](docs/ci/README.md) 를 보세요.
