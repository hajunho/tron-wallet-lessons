# 트론 지갑 레슨 (tron-wallet-lessons)

12개 단어에서 시작해 트론(TRON)과 BTTC 테스트넷에서 실제로 조회하고, 봉투를 만들고, 도장을 찍고, 보내고, 영수증을 확인하는 것까지 배우는 한국어 학습 저장소입니다.

**초등학생, 중·고등학생, 대학생·개발자, 일반인** 네 대상이 같은 13개 레슨을 각자의 깊이로 읽습니다. 한 레슨 안에 이야기, 손으로 하는 활동, 원리, 코드, 생활 속 의미, 안전 카드가 층으로 쌓여 있어서 자기 블록까지만 읽어도 완결됩니다.

> ⚠️ **연습 나라(테스트넷) 전용입니다.** 모든 레슨은 Tron Nile과 BTTC Donau 테스트넷만 사용합니다. 진짜 자산이 있는 지갑의 12단어(니모닉)를 이 저장소에 절대 넣지 마세요. 기본 설정은 미리보기(`SEND_TX=false`)이고, `lib/guard.js`가 메인넷·데모 니모닉·무제한 승인을 코드 수준에서 막습니다.

---

## 5분 안에 시작하기

```bash
git clone https://github.com/hajunho/tron-wallet-lessons
cd tron-wallet-lessons
npm install
npm run l01        # .env 없이 바로 됩니다 (네트워크도 필요 없음)
```

레슨 1, 2, 8은 네트워크와 `.env` 없이 바로 돌아갑니다. 조회 레슨도 `.env`가 없으면 공개된 데모 지갑으로 자동 실행됩니다.

```bash
npm run l03        # 데모 지갑으로 Nile 테스트넷 잔고 조회
```

내 연습용 지갑으로 해 보려면:

```bash
cp .env.example .env
npm run new-wallet          # 연습용 12단어를 새로 만들어 줍니다 → .env 의 MNEMONIC= 에 붙여넣기
npm run check               # .env, Nile, BTTC 연결 상태 점검
```

테스트 코인은 무료입니다. TRX는 [Nile faucet](https://nileex.io/join/getJoinPage), BTT는 [Donau faucet](https://testfaucet.bt.io/#/)에서 받습니다. 설치부터 faucet, 지갑 앱 연결까지 한 문서로 따라가려면 [SETUP.md](SETUP.md)를, 막혔을 때는 [TROUBLESHOOTING.md](TROUBLESHOOTING.md)를 보세요.

**처음 오셨다면 [START-HERE.md](START-HERE.md)에서 자기 갈래를 고르세요.**

---

## 13개 레슨

각 레슨은 안전 규칙 하나와 짝을 이룹니다. 규칙 13개를 다 익히면 졸업입니다.

| # | 레슨 | 안전 규칙 | 명령 | 네트워크 | 실행 |
|---|------|-----------|------|:--------:|-----:|
| 01 | [12개 단어로 만든 비밀 열쇠](lessons/01-secret-key/README.md) | 열쇠(12단어)는 나만 안다. 고객센터도 모른다. | `npm run l01` | 불필요 | 0.3초 |
| 02 | [열쇠에서 우편함 번호가 나와요](lessons/02-key-to-address/README.md) | 주소는 모두에게, 열쇠는 아무에게도. | `npm run l02` | 불필요 | 0.3초 |
| 03 | [광장에 걸린 장부: 1 TRX는 사탕 100만 알](lessons/03-read-balance/README.md) | 잔고는 앱이 아니라 장부(탐색기)에서 확인하고, 토큰은 이름이 아니라 컨트랙트 주소로 알아본다. | `npm run l03` | Nile | 2.6초 |
| 04 | [연료: 대역폭 입장권과 에너지 입장권](lessons/04-bandwidth-energy/README.md) | USDT만 있고 TRX가 0이면 아무것도 못 보낸다. 연료(입장권)가 먼저다. | `npm run l04` | Nile | 2.3초 |
| 05 | [편지 쓰고 도장 찍기(아직 안 보내요)](lessons/05-build-and-sign/README.md) | 도장을 찍기 전에 봉투(트랜잭션 내용)를 끝까지 읽는다. | `npm run l05` | Nile | 0.8초 |
| 06 | [진짜로 보내기(연습 나라에서)](lessons/06-send-testnet/README.md) | 보내면 되돌릴 수 없다. 처음 보내는 곳은 소액 먼저. | `npm run l06` | Nile | 1.4초 |
| 07 | [영수증과 발자국](lessons/07-receipt/README.md) | "보냈다"는 말 대신 txID로 영수증을 본다. | `npm run l07` | Nile | 3.5초 |
| 08 | ['나야'라고 증명하기(돈은 안 들어요)](lessons/08-sign-message/README.md) | 무엇에 도장 찍는지 읽지 못하면 찍지 않는다. | `npm run l08` | 불필요 | 0.2초 |
| 09 | [사탕통 장부와 허락증(TRC-20)](lessons/09-trc20-approve/README.md) | 허락(approve)은 필요한 만큼만, 다 쓰면 0으로. | `npm run l09` | Nile | 1.8초 |
| 10 | [리허설: 보내기 전에 미리 해보기](lessons/10-simulate/README.md) | 앱이 "실패할 것 같다"고 하면 보내지 않는다. | `npm run l10` | Nile | 3.5초 |
| 11 | [한 열쇠, 두 나라, 두 경로: BTTC에서도 열려요](lessons/11-bttc-same-key/README.md) | 보내기 전에 나라(네트워크)를 상대와 글자까지 맞춘다. | `npm run l11` | Donau | 3.0초 |
| 12 | [실패 탐정: 왜 안 됐을까?](lessons/12-error-detective/README.md) | 실패는 단서다. "고쳐 준다"는 사람은 사기다. | `npm run l12` | Nile·Donau | 3.5초 |
| 13 | [내 지갑 점검과 졸업](lessons/13-audit-and-graduation/README.md) | 한 달에 한 번 점검, 사고가 나면 순서대로, 혼자 끙끙대지 않기. | `npm run l13` | Nile | 4.0초 |

실행 시간은 2026-09-12 측정값입니다. 레슨 6만 `.env`의 MNEMONIC이 필요하고, 나머지는 없으면 데모 지갑으로 돕니다. 모든 레슨은 기본이 미리보기라서 실행해도 아무것도 전송되지 않습니다.

### 레슨의 흐름

열쇠를 만들고(1~2) → 장부를 읽고(3) → 연료를 이해하고(4) → 봉투를 만들어 도장을 찍고(5) → 보내고(6) → 영수증으로 확인하고(7) → 봉투가 아닌 서명과 허락을 배우고(8~9) → 보내기 전 리허설을 하고(10) → 같은 열쇠로 옆 나라를 열고(11) → 실패를 읽고(12) → 내 지갑을 점검하고 졸업합니다(13).

연료(4)를 보내기(6) 앞에 둔 이유는, 첫 전송에서 활성화 수수료와 대역폭 소모가 바로 나타나기 때문입니다. 예측하고(4) 실행하고(6) 영수증으로 검산하는(7) 순서가 됩니다.

---

## 한 레슨에는 무엇이 있나

레슨 폴더마다 파일 5개가 있습니다.

| 파일 | 내용 |
|------|------|
| `README.md` | 7개 블록: 🧒 이야기 · ✋ 손으로 · 🔍 원리 · 💻 코드 · 🏠 내 생활 · 🛡️ 안전 카드 · ✅ 확인 |
| `script.js` | 실행할 수 있는 Node.js 스크립트 (`npm run lNN`) |
| `activity.md` | 오프라인 활동, 기기 없이 하는 5분 버전, 인쇄용 워크시트 |
| `quiz.md` | 대상별 문제 5개와 정답·해설 |
| `expected-output.txt` | 스크립트의 실제 실행 출력 (문서의 예시는 모두 여기서 복사한 것) |

README의 블록마다 앵커가 있어서 자기 대상 블록으로 바로 갈 수 있습니다. 예를 들어 초등학생은 [이야기 블록](lessons/01-secret-key/README.md#story)부터, 개발자는 [코드 블록](lessons/01-secret-key/README.md#code)부터 읽습니다.

---

## 브라우저 놀이터

설치 없이 HTML 파일을 열기만 하면 됩니다. [playground/index.html](playground/index.html)에서 시작하세요.

놀이터 파일은 6개이고, 그중 허브(`index.html`)를 뺀 놀이 도구가 5개입니다. `ticket-board.html`과 `signing-popup-simulator.html`, 그리고 허브 `index.html`은 인터넷 없이 열립니다. `dice-to-words.html`·`address-xray.html`·`approve-decoder.html`은 ethers 6.17.0을 CDN에서 불러오므로 인터넷이 필요합니다. (허브 카드에 붙어 있는 「인터넷 없이 동작」 문구와 안내 문장은 이 세 개에는 해당하지 않습니다.)

| 놀이터 | 하는 일 | 관련 레슨 | 인터넷 |
|--------|---------|-----------|--------|
| [주사위로 12단어 만들기](playground/dice-to-words.html) | 주사위를 굴려 엔트로피 → 체크섬 → 12단어 → 주소까지 단계별로 | 01, 02 | 필요 (CDN ethers) |
| [주소 엑스레이](playground/address-xray.html) | T주소 ↔ 0x주소 변환, 닮은 주소 찾기 게임 | 02, 11, 13 | 필요 (CDN ethers) |
| [입장권 계산기](playground/ticket-board.html) | 대역폭·에너지·활성화 수수료가 얼마인지 계산 | 04, 10 | 불필요 |
| [서명 팝업 판별 게임](playground/signing-popup-simulator.html) | 정상 서명 요청과 피싱 5종을 구별 | 08, 09 | 불필요 |
| [승인 해독기](playground/approve-decoder.html) | approve 붙여넣으면 누구에게 얼마를 허락하는지 판독 | 09, 10 | 필요 (CDN ethers) |

---

## 대상별 학습 경로

| 대상 | 경로 | 소요 |
|------|------|------|
| 🧒 초등 저학년 | [docs/paths/elementary.md](docs/paths/elementary.md) — 규칙 3개만, 코드 없이 이야기와 활동 | 3차시 |
| 🧒 초등 고학년 | [docs/paths/elementary.md](docs/paths/elementary.md) — 13차시, 교사가 스크립트 시연 | 13차시 |
| 🎒 중·고등학생 | [docs/paths/secondary.md](docs/paths/secondary.md) — 활동 + 원리 + 스크립트 실험 | 13차시 |
| 🎓 대학생·개발자 | [docs/paths/developer.md](docs/paths/developer.md) — 스크립트 전체와 도전 과제. API·상수·에러 표는 [CHEATSHEET.md](CHEATSHEET.md) | 1일 |
| 🏠 일반인 | [docs/paths/general.md](docs/paths/general.md) — 이야기와 생활, 안전 카드 중심 | 2시간 |

가르치는 분은 [TEACHER_GUIDE.md](TEACHER_GUIDE.md)에 차시안, 발문, 준비물, 곤란한 질문 대응이 있습니다. 강의 슬라이드가 필요하면 [docs/slides-outline.md](docs/slides-outline.md)의 50장 아웃라인을 쓰세요.

---

## 저장소 구조

```
tron-wallet-lessons/
├── README.md                 이 파일
├── START-HERE.md             "나는 누구인가?" 4갈래 진입
├── SETUP.md                  설치, .env, faucet, 지갑 앱 연결
├── SAFETY.md                 13대 안전 규칙, 서약서, 사고 대응
├── TEACHER_GUIDE.md          차시안, 발문, 평가 루브릭
├── GLOSSARY.md               용어 사전 (비유 ↔ 정식 용어)
├── CURRICULUM_MAP.md         개념 × 레슨 × 대상 매트릭스
├── CHEATSHEET.md             개발자용 API·상수·에러 표
├── FAQ.md                    자주 묻는 질문
├── TROUBLESHOOTING.md        증상 → 원인 → 해결
├── CHANGELOG.md              제작 기록과 검증 이력
├── LICENSE                   MIT
├── .env.example              .env 서식 (복사해서 쓰세요)
├── .gitignore                .env, package-lock.json, out/ 제외
├── out/                      서명 결과·점검 JSON (.gitignore 대상)
├── lessons/NN-slug/          레슨 13개 (파일 5개씩)
├── playground/               브라우저 놀이터 HTML 6개 (놀이 도구 5개 + 허브 index.html)
├── lib/                      공용 모듈
│   ├── wallet.js             니모닉 → 키 → T주소 / 0x주소
│   ├── tron.js               Nile 설정, 단위 변환, TRC-20 ABI, 로그 디코딩
│   ├── bttc.js               BTTC Donau·메인넷 설정
│   ├── guard.js              전송 전 관문 (메인넷·데모키·무제한 승인 차단)
│   ├── print.js              단계 출력, 비밀값 마스킹, 대상별 해설
│   └── index.js              lib 모듈 모아서 다시 내보내기
├── tools/
│   ├── new-wallet.js         연습용 니모닉 생성
│   ├── check-env.js          환경·연결 점검
│   ├── verify-readonly.js    13개 레슨 전체 미리보기 실행 (npm test)
│   └── make-expected-outputs.js  expected-output.txt 재생성
└── docs/
    ├── story-bible.md        세계관·캐릭터·비유 사전
    ├── paths/                대상별 학습 경로 4개
    ├── slides-outline.md     감마용 50장 슬라이드 아웃라인
    ├── wallet-app-walkthrough.md  지갑 앱 화면 읽는 법
    ├── ci/                   주 1회 자동 재검증 워크플로 (켜는 방법은 ci/README.md)
    └── making/               제작 기록 (검증 사실, 집필 규약, 검수 기록) — 배우는 데는 불필요
```

---

## 안전 원칙 다섯 가지

1. **연습 나라에서만.** Nile과 Donau 테스트넷만 씁니다. 메인넷 주소는 `lib/guard.js`가 막습니다.
2. **기본은 미리보기.** 전송은 `SEND_TX=true`를 직접 붙였을 때만 일어납니다.
3. **12단어는 코드·로그·저장소에 남기지 않습니다.** `.env`는 `.gitignore`에 있고, 출력은 기본 마스킹입니다.
4. **데모 지갑은 조회용입니다.** 공개된 니모닉이라 전송에는 쓸 수 없고, 실제로 그 주소의 권한은 이미 다른 사람 손에 있습니다(레슨 13에서 직접 확인합니다).
5. **시세와 투자 이야기는 다루지 않습니다.** 이 저장소는 지갑이 어떻게 동작하는지, 어떻게 잃지 않는지만 가르칩니다.

자세한 내용과 인쇄용 규칙 카드는 [SAFETY.md](SAFETY.md)에 있습니다.

---

## 검증

문서에 적힌 출력과 숫자는 모두 실제 실행 결과입니다. 직접 확인할 수 있습니다.

```bash
npm test                    # 13개 레슨 전체를 미리보기 모드로 실행
npm run expected            # expected-output.txt 재생성
```

2026-09-12 기준 13/13 통과했습니다. 테스트넷 숫자(가스 가격, 데모 주소 잔고, 블록 번호)는 시간이 지나면 달라집니다. 값이 문서와 다르면 장부가 자란 것이지 고장이 아닙니다. 매주 월요일 GitHub Actions가 다시 검증합니다.

검증 환경: Node 23.11, tronweb 6.5.0, ethers 6.17.0, bip39 3.1.0.

문서의 모든 수치와 출력이 어디서 나왔는지는 [docs/making/verified-facts.md](docs/making/verified-facts.md)에 있습니다. 검증되지 않은 것은 본문에서 `(확인 필요)`로 표시했습니다. 만든 과정과 남은 일, 다른 체인으로 옮기는 방법은 [docs/making/making-of.md](docs/making/making-of.md)에 적었습니다.

---

## 원본 저장소와의 관계

이 저장소는 [soaryong/wallet-practice](https://github.com/soaryong/wallet-practice)의 12개 레슨(이더리움, Sui, Solana / 개발자용)을 출발점으로 삼아, 트론·BTTC로 옮기고 네 대상을 위한 층을 쌓은 것입니다. 대응표는 [CURRICULUM_MAP.md](CURRICULUM_MAP.md)에 있고, 각 레슨 README 상단에도 표시되어 있습니다.

트론에는 원본에 없던 개념이 있습니다. 대역폭과 에너지(gas 대신)와 계정 활성화 수수료는 [레슨 04 #why](lessons/04-bandwidth-energy/README.md#why), nonce 없는 트랜잭션(참조 블록과 60초 만료)은 [레슨 05](lessons/05-build-and-sign/README.md), 그 에러를 읽는 법은 [레슨 12](lessons/12-error-detective/README.md), 계정 권한(owner/active)은 [레슨 13](lessons/13-audit-and-graduation/README.md)이 다룹니다.

---

## 라이선스

MIT. [LICENSE](LICENSE) 참조.
