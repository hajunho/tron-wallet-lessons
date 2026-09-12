# 여기서 시작하세요 — 나는 누구인가?

> **3줄 요약**
> 1. 이 저장소는 트론(TRON)과 옆 나라 BTTC로 지갑을 배우는 **13개 레슨**입니다. 레슨마다 초등·중고등·개발자·일반인용 블록이 따로 있습니다.
> 2. 읽는 사람이 누구냐에 따라 **읽을 블록과 순서가 다릅니다.** 아래 네 갈래에서 자기 갈래만 따라가면 됩니다.
> 3. 13개 레슨은 13개 안전 규칙과 1:1로 짝지어져 있습니다. 레슨을 끝내면 규칙 카드 13장이 남습니다.

> ⚠️ **연습 나라(테스트넷) 전용입니다.**
> 이 저장소의 모든 실습은 연습 나라(테스트넷 Nile, 그리고 BTTC Donau)에서만 합니다. 연습 나라 돈은 진짜 돈이 아닙니다.
> 모든 전송 코드는 기본이 **미리보기**입니다(`SEND_TX=false`). 실제 자산, 실제 지갑의 12단어(니모닉), 진짜 나라(메인넷) 주소를 이 저장소에 넣지 마세요.
> 이 저장소는 시세·수익·투자에 대해 어떤 말도 하지 않습니다.

---

## 🧒 나는 초등학생이에요 (또는 초등학생을 가르쳐요)

### 저학년(1~3학년) — 이야기와 놀이만

읽는 블록은 **이야기(`#story`)와 손으로(`#hands`)** 두 개뿐입니다. 코드는 보지 않습니다. 스크립트는 선생님·부모님이 화면에 띄워 보여 주기만 합니다.

| 순서 | 레슨 | 읽을 블록 |
|---|---|---|
| 1 | Lesson 01 · 12개 단어로 만든 비밀 열쇠 | [이야기](lessons/01-secret-key/README.md#story) · [손으로](lessons/01-secret-key/README.md#hands) |
| 2 | Lesson 02 · 열쇠에서 우편함 번호가 나와요 | [이야기](lessons/02-key-to-address/README.md#story) · [손으로](lessons/02-key-to-address/README.md#hands) |
| 3 | Lesson 06 · 진짜로 보내기(연습 나라에서) | [이야기](lessons/06-send-testnet/README.md#story) · [손으로](lessons/06-send-testnet/README.md#hands) |
| 4 | Lesson 08 · '나야'라고 증명하기 | [이야기](lessons/08-sign-message/README.md#story) · [손으로](lessons/08-sign-message/README.md#hands) |
| 5 | Lesson 13 · 내 지갑 점검과 졸업 | [이야기](lessons/13-audit-and-graduation/README.md#story) · [손으로](lessons/13-audit-and-graduation/README.md#hands) |

- **총 소요시간**: 40분 × 3차시 = **약 2시간**. 차시안은 [docs/paths/elementary.md](docs/paths/elementary.md)의 "저학년 3차시".
- **준비물**: 주사위, 색연필 8색, 상자 하나(우체통), 구슬이나 바둑돌 30개, 인쇄한 활동지. 컴퓨터는 없어도 됩니다.
- **여기서 막히면**: 이야기에 나오는 말이 어려우면 [docs/story-bible.md](docs/story-bible.md)의 "비유 사전"에서 비유 이름과 정식 용어를 같이 보세요. 활동이 준비물 때문에 어려우면 각 활동지의 **"무장비 5분 버전"** 만 하세요.

### 고학년(4~6학년) — 13개 다 하기

읽는 블록은 **이야기(`#story`) → 손으로(`#hands`) → 안전 카드(`#card`) → 확인(`#check`)** 네 개입니다. 원리와 코드는 건너뜁니다.

01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13 순서대로 합니다. 순서를 바꾸지 마세요. 레슨 02에서 비티가 한 예고는 레슨 11에서, 레슨 03에서 노드 아저씨가 한 예고는 레슨 13에서 풀립니다.

- 각 레슨 링크: [01](lessons/01-secret-key/README.md#story) · [02](lessons/02-key-to-address/README.md#story) · [03](lessons/03-read-balance/README.md#story) · [04](lessons/04-bandwidth-energy/README.md#story) · [05](lessons/05-build-and-sign/README.md#story) · [06](lessons/06-send-testnet/README.md#story) · [07](lessons/07-receipt/README.md#story) · [08](lessons/08-sign-message/README.md#story) · [09](lessons/09-trc20-approve/README.md#story) · [10](lessons/10-simulate/README.md#story) · [11](lessons/11-bttc-same-key/README.md#story) · [12](lessons/12-error-detective/README.md#story) · [13](lessons/13-audit-and-graduation/README.md#story)
- **총 소요시간**: 40분 × 13차시 = **약 9시간**. 차시안은 [docs/paths/elementary.md](docs/paths/elementary.md)의 "고학년 13차시".
- **준비물**: 레슨마다 다릅니다. 각 레슨의 `activity.md` 맨 위 "준비물"을 보세요. 컴퓨터 1대가 있으면 선생님이 `npm run l01`처럼 실행해 화면을 크게 띄워 줍니다. 없으면 각 레슨의 `expected-output.txt`를 인쇄해 나눠 주세요.
- **놀이터**(컴퓨터·태블릿이 있으면 브라우저로 열기): [playground/index.html](playground/index.html)에서 고릅니다. 파일 6개 = 허브 `index.html` + 놀이 도구 5개입니다. 허브와 `ticket-board.html`·`signing-popup-simulator.html`은 인터넷 없이 열리고, `dice-to-words.html`·`address-xray.html`·`approve-decoder.html`은 CDN(ethers 6.17.0) 때문에 인터넷이 필요합니다.
- **여기서 막히면**: 퀴즈가 안 풀리면 그 레슨 `README.md`의 `#story`를 다시 읽고, 답은 같은 폴더 `quiz.md`에 있습니다. 활동 시간이 부족하면 "무장비 5분 버전"으로 줄이세요.

---

## 🎒 나는 중학생·고등학생이에요

읽는 블록은 **손으로(`#hands`) → 원리(`#why`) → 안전 카드(`#card`) → 확인(`#check`)** 입니다. 이야기는 건너뛰어도 되지만, 비유 이름(사탕·입장권·봉투·도장)은 원리 블록에서 계속 쓰이니 처음 한 번은 읽어 두는 게 편합니다.

01 → 13 순서대로, 레슨당 1차시(50분)입니다.

| 레슨 | 읽을 블록 | 이 레슨의 실험 |
|---|---|---|
| [01 비밀 열쇠](lessons/01-secret-key/README.md#why) | [손으로](lessons/01-secret-key/README.md#hands) · [원리](lessons/01-secret-key/README.md#why) | `PASSPHRASE=토리 npm run l01` |
| [02 우편함 번호](lessons/02-key-to-address/README.md#why) | [손으로](lessons/02-key-to-address/README.md#hands) · [원리](lessons/02-key-to-address/README.md#why) | `SHOW_SECRETS=true npm run l02` |
| [03 장부 읽기](lessons/03-read-balance/README.md#why) | [손으로](lessons/03-read-balance/README.md#hands) · [원리](lessons/03-read-balance/README.md#why) | `ADDRESS=… npm run l03` |
| [04 입장권](lessons/04-bandwidth-energy/README.md#why) | [손으로](lessons/04-bandwidth-energy/README.md#hands) · [원리](lessons/04-bandwidth-energy/README.md#why) | `ADDRESS=… npm run l04` |
| [05 봉투와 도장](lessons/05-build-and-sign/README.md#why) | [손으로](lessons/05-build-and-sign/README.md#hands) · [원리](lessons/05-build-and-sign/README.md#why) | `MEMO="hi" npm run l05` |
| [06 보내기](lessons/06-send-testnet/README.md#why) | [손으로](lessons/06-send-testnet/README.md#hands) · [원리](lessons/06-send-testnet/README.md#why) | `AMOUNT_TRX=0.5 npm run l06` |
| [07 영수증](lessons/07-receipt/README.md#why) | [손으로](lessons/07-receipt/README.md#hands) · [원리](lessons/07-receipt/README.md#why) | `TXID=… npm run l07` |
| [08 메시지 서명](lessons/08-sign-message/README.md#why) | [손으로](lessons/08-sign-message/README.md#hands) · [원리](lessons/08-sign-message/README.md#why) | `MESSAGE="Hello Tron" npm run l08` |
| [09 허락증](lessons/09-trc20-approve/README.md#why) | [손으로](lessons/09-trc20-approve/README.md#hands) · [원리](lessons/09-trc20-approve/README.md#why) | `AMOUNT_USDT=0.5 npm run l09` |
| [10 리허설](lessons/10-simulate/README.md#why) | [손으로](lessons/10-simulate/README.md#hands) · [원리](lessons/10-simulate/README.md#why) | `AMOUNT_USDT=99999999 npm run l10` |
| [11 두 나라](lessons/11-bttc-same-key/README.md#why) | [손으로](lessons/11-bttc-same-key/README.md#hands) · [원리](lessons/11-bttc-same-key/README.md#why) | `AMOUNT_BTT=1 npm run l11` |
| [12 실패 탐정](lessons/12-error-detective/README.md#why) | [손으로](lessons/12-error-detective/README.md#hands) · [원리](lessons/12-error-detective/README.md#why) | `CASE=7 npm run l12` |
| [13 점검과 졸업](lessons/13-audit-and-graduation/README.md#why) | [손으로](lessons/13-audit-and-graduation/README.md#hands) · [원리](lessons/13-audit-and-graduation/README.md#why) | `npm run l13 -- TSeJ…` |

- **총 소요시간**: 50분 × 13차시 = **약 11시간**. 실험 기록지 양식과 차시안은 [docs/paths/secondary.md](docs/paths/secondary.md).
- **준비물**: Node 20 이상(검증은 23.11), 저장소 클론, `npm install`. 인터넷. 각자 실험 기록지 1장. 지갑 앱이나 실제 자산은 필요 없고, 만들지도 마세요.
- **오프라인으로도 되는 레슨**: 01, 02, 08은 네트워크 없이 실행됩니다. 나머지는 연습 나라(Nile 또는 Donau) 조회가 필요합니다.
- **여기서 막히면**: 먼저 `npm run check`로 환경을 확인하세요. 조회가 실패하면 대개 요청 제한(429)이니 **잠시 후 다시** 실행합니다. 내 출력이 이상한지 확인하려면 같은 폴더의 `expected-output.txt`(2026-09-12 실제 실행 결과)와 한 줄씩 비교하세요.

---

## 🎓 나는 대학생·개발자예요

읽는 블록은 **코드(`#code`) → 원리(`#why`)** 이고, 필요할 때 안전 카드(`#card`)를 봅니다. 이야기와 생활 블록은 건너뜁니다.

먼저 이렇게 한 번 돌려 보세요.

```bash
npm install
npm run check          # 환경 점검
npm test               # = verify-readonly, 읽기 전용 레슨 일괄 확인
npm run l01            # 레슨 1 (lesson01 도 같은 명령)
```

`.env` 없이도 **01, 02, 03, 04, 05, 08, 09, 10, 11, 12, 13** 은 공개된 데모 니모닉으로 자동 실행됩니다(데모 모드 안내가 출력됩니다). 예외 두 개: **06**은 `MNEMONIC`이 없으면 안내 후 종료하고, **07**은 `TXID`가 없으면 최근 블록에서 트랜잭션을 자동으로 골라 씁니다.

- 추천 순서: 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13. 05 이후에 06을 건너뛰고 07로 갈 수도 있지만, 07의 기본 입력이 06이 남긴 txid이므로 순서대로 하는 쪽이 매끄럽습니다.
- **총 소요시간**: 13개 스크립트 실행 시간 합계는 **27.2초**입니다(01 0.3s, 02 0.3s, 03 2.6s, 04 2.3s, 05 0.8s, 06 1.4s, 07 3.5s, 08 0.2s, 09 1.8s, 10 3.5s, 11 3.0s, 12 3.5s, 13 4.0s). README를 읽고 도전 26개까지 풀면 훨씬 오래 걸립니다(개인차가 커서 시간은 정하지 않습니다).
- **준비물**: Node 20 이상, `npm install`(tronweb 6.5.0, ethers 6.17.0, bip39 3.1.0, bip32 5.0.0-rc.0, tiny-secp256k1 2.2.4, dotenv). 연습 나라 TRX가 필요하면 Nile faucet <https://nileex.io/join/getJoinPage>, BTTC Donau는 <https://testfaucet.bt.io/#/>.
- 도전 26개 표, wallet-practice 대응표, 졸업 과제 3개는 [docs/paths/developer.md](docs/paths/developer.md).
- **여기서 막히면**: 조회 실패는 대부분 요청 제한(429)입니다 — 잠시 후 다시. 출력이 다르면 `expected-output.txt`와 비교하세요(첫 줄에 실행 명령과 날짜가 적혀 있습니다). 에러 문구 자체를 다루는 레슨이 따로 있습니다: [Lesson 12 실패 탐정](lessons/12-error-detective/README.md#code).
- **경고**: `lib/`, `tools/`, `package.json`, `lessons/`, `playground/`는 수정하지 않는 것이 이 저장소의 규칙입니다. 도전 과제는 스크립트를 **복사해서** 고치세요. **`SEND_TX=true`는 이 저장소의 모든 경로에서 쓰지 않습니다.** 모든 레슨은 미리보기(`SEND_TX=false`)로만 실행합니다. 실제 전송을 해 보고 싶다면 이 저장소를 복사한 본인 실습에서, 본인이 `npm run new-wallet`으로 만든 연습용 니모닉과 테스트넷(Nile·Donau)으로만 하세요.

---

## 🏠 나는 지갑을 쓰는 일반인이에요

읽는 블록은 **이야기(`#story`, 선택) → 내 생활(`#life`) → 안전 카드(`#card`)** 입니다. 코드와 원리는 건너뜁니다. 컴퓨터에 아무것도 설치하지 않아도 됩니다.

2시간 코스 순서: 01 → 02 → 03 → 04 → 06 → 07 → 08 → 09 → 10 → 12 → 13.

| 레슨 | 읽을 블록 | 무엇을 알게 되나 |
|---|---|---|
| 01 | [내 생활](lessons/01-secret-key/README.md#life) · [카드](lessons/01-secret-key/README.md#card) | 12단어를 묻는 곳은 전부 사기 |
| 02 | [내 생활](lessons/02-key-to-address/README.md#life) · [카드](lessons/02-key-to-address/README.md#card) | 주소는 알려 주고 열쇠는 숨기기 |
| 03 | [내 생활](lessons/03-read-balance/README.md#life) · [카드](lessons/03-read-balance/README.md#card) | 잔고는 탐색기에서, 토큰은 컨트랙트 주소로 |
| 04 | [내 생활](lessons/04-bandwidth-energy/README.md#life) · [카드](lessons/04-bandwidth-energy/README.md#card) | USDT만 있고 TRX가 0이면 못 보냄 |
| 06 | [내 생활](lessons/06-send-testnet/README.md#life) · [카드](lessons/06-send-testnet/README.md#card) | 보내면 되돌릴 수 없음, 소액 먼저 |
| 07 | [내 생활](lessons/07-receipt/README.md#life) · [카드](lessons/07-receipt/README.md#card) | "보냈다"는 말 대신 txID |
| 08 | [내 생활](lessons/08-sign-message/README.md#life) · [카드](lessons/08-sign-message/README.md#card) | 읽을 수 없는 서명 요청은 거절 |
| 09 | [내 생활](lessons/09-trc20-approve/README.md#life) · [카드](lessons/09-trc20-approve/README.md#card) | 허락은 필요한 만큼만, 다 쓰면 0으로 |
| 10 | [내 생활](lessons/10-simulate/README.md#life) · [카드](lessons/10-simulate/README.md#card) | "실패할 것 같다"면 보내지 않기 |
| 12 | [내 생활](lessons/12-error-detective/README.md#life) · [카드](lessons/12-error-detective/README.md#card) | "고쳐 준다"는 사람은 사기 |
| 13 | [내 생활](lessons/13-audit-and-graduation/README.md#life) · [카드](lessons/13-audit-and-graduation/README.md#card) | 한 달에 한 번 점검, 사고는 순서대로 |

- **총 소요시간**: **2시간**(읽기 70분 + 놀이터 실습 30분 + 내 지갑 점검 20분). 자세한 시간표는 [docs/paths/general.md](docs/paths/general.md).
- **준비물**: 인터넷이 되는 브라우저. 종이와 펜. (있으면) 내 지갑 앱 — 단, 이 코스에서는 **아무것도 보내지 않고 화면만 봅니다.**
- **실습 3개**(브라우저로 열기만 하면 됩니다): [서명 팝업 판별 놀이](playground/signing-popup-simulator.html) · [허락증 판독기](playground/approve-decoder.html) · [우편함 번호 엑스레이](playground/address-xray.html)
- **여기서 막히면**: 용어가 낯설면 그 레슨의 [이야기](lessons/01-secret-key/README.md#story) 블록을 먼저 읽으세요. 비유와 정식 용어를 짝지은 표는 [docs/story-bible.md](docs/story-bible.md)의 "비유 사전"에 있습니다. 지금 당장 판단이 필요한 상황이면 해당 레슨의 `#life` 안에 있는 "이런 요청이 오면 사기인가?" 표 3줄만 보세요.

---

## 13개 안전 규칙 (레슨 번호와 1:1)

1. 열쇠(12단어)는 나만 안다. 고객센터도 모른다. → [Lesson 01](lessons/01-secret-key/README.md#card)
2. 주소는 모두에게, 열쇠는 아무에게도. → [Lesson 02](lessons/02-key-to-address/README.md#card)
3. 잔고는 앱이 아니라 장부(탐색기)에서 확인하고, 토큰은 이름이 아니라 컨트랙트 주소로 알아본다. → [Lesson 03](lessons/03-read-balance/README.md#card)
4. USDT만 있고 TRX가 0이면 아무것도 못 보낸다. 연료(입장권)가 먼저다. → [Lesson 04](lessons/04-bandwidth-energy/README.md#card)
5. 도장을 찍기 전에 봉투(트랜잭션 내용)를 끝까지 읽는다. → [Lesson 05](lessons/05-build-and-sign/README.md#card)
6. 보내면 되돌릴 수 없다. 처음 보내는 곳은 소액 먼저. → [Lesson 06](lessons/06-send-testnet/README.md#card)
7. "보냈다"는 말 대신 txID로 영수증을 본다. → [Lesson 07](lessons/07-receipt/README.md#card)
8. 무엇에 도장 찍는지 읽지 못하면 찍지 않는다. → [Lesson 08](lessons/08-sign-message/README.md#card)
9. 허락(approve)은 필요한 만큼만, 다 쓰면 0으로. → [Lesson 09](lessons/09-trc20-approve/README.md#card)
10. 앱이 "실패할 것 같다"고 하면 보내지 않는다. → [Lesson 10](lessons/10-simulate/README.md#card)
11. 보내기 전에 나라(네트워크)를 상대와 글자까지 맞춘다. → [Lesson 11](lessons/11-bttc-same-key/README.md#card)
12. 실패는 단서다. "고쳐 준다"는 사람은 사기다. → [Lesson 12](lessons/12-error-detective/README.md#card)
13. 한 달에 한 번 점검, 사고가 나면 순서대로, 혼자 끙끙대지 않기. → [Lesson 13](lessons/13-audit-and-graduation/README.md#card)

---

## 이 저장소의 다른 문서

- [docs/story-bible.md](docs/story-bible.md) — 이야기 바이블: 인물 카드, 비유 사전, 예고·회수 표
- [docs/paths/elementary.md](docs/paths/elementary.md) — 초등 차시안(저학년 3차시 / 고학년 13차시)
- [docs/paths/secondary.md](docs/paths/secondary.md) — 중고등 13차시 + 실험 기록지 양식
- [docs/paths/developer.md](docs/paths/developer.md) — 개발자 경로 + 도전 26개 + wallet-practice 대응표
- [docs/paths/general.md](docs/paths/general.md) — 일반인 2시간 코스 + 지갑 앱 점검 체크리스트
- [playground/index.html](playground/index.html) — 놀이터 모음(파일 6개 = 허브 + 놀이 도구 5개. 세 개는 CDN 때문에 인터넷 필요)

이 교재의 뼈대는 원본 저장소 **soaryong/wallet-practice**(이더리움·Sui·Solana 12레슨, 개발자용)에서 왔습니다. 여기서는 대상을 초등학생·일반인까지 넓히고, 체인을 트론과 BTTC로 바꾸고, 안전 규칙 13개를 축으로 다시 짰습니다. 레슨별 대응 관계는 [docs/paths/developer.md](docs/paths/developer.md)의 대응표를 보세요.
