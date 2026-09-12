# 설치와 준비

이 문서만 따라 하면 13개 레슨을 모두 실행할 수 있습니다. 대상별로 무엇부터 읽을지는 [START-HERE.md](START-HERE.md)에, 막혔을 때는 [TROUBLESHOOTING.md](TROUBLESHOOTING.md)에 있습니다.

> ⚠️ 진짜 자산이 있는 지갑의 12단어(니모닉)를 이 저장소에 절대 넣지 마세요. 연습용 12단어는 `npm run new-wallet`이 만들어 줍니다.

---

## 1. 필요한 것

| 항목 | 필요 버전 | 확인 |
|------|-----------|------|
| Node.js | 20 이상 (검증은 23.11) | `node -v` |
| npm | Node에 포함 | `npm -v` |
| 인터넷 | 레슨 3~13 (조회용) | 레슨 1, 2, 8은 없어도 됩니다 |

지갑 앱, 거래소 계정, 진짜 코인은 **필요하지 않습니다.**

Node 버전이 낮으면 [TROUBLESHOOTING 1번](TROUBLESHOOTING.md#t1)을 보세요.

---

## 2. 설치

```bash
git clone https://github.com/hajunho/tron-wallet-lessons
cd tron-wallet-lessons
npm install
```

설치되는 패키지는 tronweb 6.5.0, ethers 6.17.0, bip39 3.1.0, bip32 5.0.0-rc.0, tiny-secp256k1 2.2.4, dotenv입니다.

`tiny-secp256k1`에서 설치가 멈추면 [TROUBLESHOOTING 2번](TROUBLESHOOTING.md#t2)을 보세요.

### 바로 확인

```bash
npm run l01
```

`.env`도 인터넷도 없이 12단어가 만들어지는 과정이 출력됩니다. 여기까지 되면 설치는 끝났습니다.

---

## 3. `.env` 없이 되는 레슨

`.env`를 만들지 않아도 **01, 02, 03, 04, 05, 08, 09, 10, 11, 12, 13**은 공개된 데모 지갑으로 자동 실행됩니다. 실행하면 "데모 모드" 안내가 먼저 출력됩니다.

```bash
npm run l03        # 데모 지갑으로 Nile 잔고 조회
npm run l09        # 데모 지갑의 USDT 허락증 조회
```

예외는 두 개입니다.

- **레슨 06**은 실제 전송을 다루므로 `.env`의 `MNEMONIC`이 없으면 안내 후 종료합니다.
- **레슨 07**은 `TXID`가 없으면 최근 블록에서 트랜잭션을 하나 골라 씁니다.

수업에서 설치 시간을 줄이려면 여기까지만 해도 충분합니다.

---

## 4. 내 연습용 지갑 만들기

```bash
cp .env.example .env
npm run new-wallet
```

`new-wallet`이 12단어와 주소 두 개(보내는 쪽 index 0, 받는 쪽 index 1), 그리고 같은 키의 BTTC 주소를 출력합니다. 출력된 줄에서 `MNEMONIC=` 뒤 전체를 복사해 `.env`에 붙여넣으세요.

`.env`는 `.gitignore`에 있어서 커밋되지 않습니다.

### `.env` 항목

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `MNEMONIC` | (비어 있음) | 연습용 12단어. 진짜 지갑 것을 넣지 마세요 |
| `TRON_FULL_HOST` | `https://nile.trongrid.io` | Nile 테스트넷. 그대로 두세요 |
| `NILE_USDT_ADDRESS` | `TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf` | Nile 테스트 USDT 컨트랙트 |
| `BTTC_RPC_URL` | `https://pre-rpc.bt.io/` | BTTC Donau 테스트넷 |
| `SEND_TX` | `false` | `true`로 바꾸지 말고, 필요한 순간에만 명령 앞에 붙이세요 |

`SEND_TX`를 `.env`에 `true`로 박아 두면 이후 모든 실행이 전송 모드가 됩니다. 그렇게 하지 말고 필요할 때만 이렇게 쓰세요.

```bash
SEND_TX=true npm run l06
```

---

## 5. 테스트 코인 받기

둘 다 무료이고, 진짜 돈이 아닙니다.

| 체인 | 받는 곳 | 받는 것 | 쓰는 레슨 |
|------|---------|---------|-----------|
| Tron Nile | <https://nileex.io/join/getJoinPage> | 테스트 TRX | 06, 09 (전송·승인 실습) |
| BTTC Donau | <https://testfaucet.bt.io/#/> | 테스트 BTT | 11 (전송 실습, 선택) |

faucet에 넣을 주소는 `npm run new-wallet`이나 `npm run check`가 출력한 **T로 시작하는 주소**(Nile)와 **0x로 시작하는 주소**(Donau)입니다.

조회·시뮬레이션 레슨(03, 04, 05, 07, 09, 10, 12, 13)은 코인이 없어도 됩니다. faucet이 안 되면 [TROUBLESHOOTING 5번](TROUBLESHOOTING.md#t5)을 보세요.

---

## 6. 점검

```bash
npm run check
```

이렇게 나오면 준비가 끝났습니다.

```
✅ MNEMONIC: 12단어 (…)
   Tron 주소: T…
   BTTC 주소: 0x…
   SEND_TX: false (미리보기 모드)
✅ Nile 테스트넷 연결됨 (블록 …)
   TRX 잔고: … TRX
   탐색기: https://nile.tronscan.org/#/address/T…
✅ BTTC Donau 테스트넷 연결됨 (chainId 1029)
   BTT 잔고: … BTT
```

블록 번호와 잔고는 실행할 때마다 다릅니다. 장부가 계속 자라기 때문입니다.

`계정이 아직 활성화되지 않았습니다`가 보이면 faucet에서 TRX를 받으세요. 트론은 한 번도 TRX를 받지 않은 주소를 장부에 올리지 않습니다. 이 개념은 [레슨 4](lessons/04-bandwidth-energy/README.md)에서 배웁니다.

전체 레슨이 도는지 한 번에 확인하려면:

```bash
npm test
```

13개 레슨을 모두 미리보기 모드로 실행합니다. 2026-09-12 기준 13/13 통과했습니다. 아무것도 전송되지 않습니다.

---

## 7. 지갑 앱에 Nile 네트워크 추가 (선택)

레슨을 앱 화면과 함께 보고 싶을 때만 하세요. 코드 실습에는 필요하지 않습니다.

TronLink 같은 트론 지갑 앱은 설정에서 네트워크를 고를 수 있고, 보통 Nile 테스트넷이 목록에 들어 있습니다. 없으면 직접 추가할 때 아래 값을 씁니다. (앱 버전마다 화면과 입력 칸이 다릅니다. 확인 필요)

| 항목 | 값 |
|------|-----|
| 네트워크 이름 | Nile Testnet |
| Full Node / RPC | `https://nile.trongrid.io` |
| 탐색기 | `https://nile.tronscan.org` |

BTTC Donau를 메타마스크류 EVM 지갑에 추가할 때는 이렇게 씁니다.

| 항목 | 값 |
|------|-----|
| 네트워크 이름 | BitTorrent Chain Donau |
| RPC URL | `https://pre-rpc.bt.io/` |
| 체인 ID | `1029` |
| 통화 기호 | `BTT` |
| 탐색기 | `https://testnet.bttcscan.com` |

**앱에 넣을 12단어는 반드시 `npm run new-wallet`으로 만든 연습용이어야 합니다.** 진짜 지갑을 테스트넷에 연결하는 것이 아니라, 연습용 지갑을 앱에 새로 넣는 것입니다. 수업이 끝나면 [SAFETY.md](SAFETY.md)의 "지갑 봉인식" 절차대로 지우세요.

앱 화면에서 각 레슨 개념이 어디에 보이는지는 [docs/wallet-app-walkthrough.md](docs/wallet-app-walkthrough.md)에 있습니다.

---

## 8. 다음

- 대상별 학습 순서: [START-HERE.md](START-HERE.md)
- 가르치는 분: [TEACHER_GUIDE.md](TEACHER_GUIDE.md)
- 첫 레슨: [레슨 1 · 12개 단어로 만든 비밀 열쇠](lessons/01-secret-key/README.md)
- 안전 규칙 13개: [SAFETY.md](SAFETY.md)
