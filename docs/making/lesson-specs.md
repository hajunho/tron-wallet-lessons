# 13개 레슨 명세 (집필자용)

공통: `style-guide.md`의 규약과 `tron-facts.md`의 사실만 사용. 각 레슨은 `lessons/NN-slug/` 5개 파일을 만든다. 아래 "스크립트" 항목의 단계는 **최소 요구**이며 출력 문구는 자유롭되 값은 실제 실행 결과여야 한다.

---
## 01 · `01-secret-key` · 12개 단어로 만든 비밀 열쇠 ★저학년 포함
규칙 1. wallet-practice 대응: Lesson 1.
핵심: 아무도 못 맞히는 무작위(엔트로피 128비트) → 사람이 적을 수 있는 12단어(니모닉, 마지막 단어에 체크섬 4비트) → 시드(64바이트, PBKDF2 2048회) → 열쇠. 12단어는 비밀번호가 아니라 지갑 그 자체. 재설정도 고객센터도 없다.
스크립트 (네트워크 불필요, 환경변수: WORDLIST=korean|english 기본 korean, DICE="1,4,6,…"(주사위 눈 최소 50개, 있으면 엔트로피로 사용) , PASSPHRASE, SHOW_SECRETS):
 1. 엔트로피 16바이트 만들기(crypto.randomBytes 또는 DICE에서 sha256으로 유도) → hex, 비트 수 128, "가짓수 2^128 ≈ 3.4×10^38" 출력
 2. sha256 → 앞 4비트 체크섬 → 132비트 → 11비트씩 12조각 → 단어 인덱스와 단어(표로) — bip39.entropyToMnemonic(entropy, bip39.wordlists[WORDLIST])와 결과 일치 확인
 3. validateMnemonic: 원본 true / 마지막 단어 바꾼 것 false / 단어 순서 바꾼 것 결과 출력
 4. mnemonicToSeedSync(mnemonic, PASSPHRASE) → 시드 hex(마스킹), PASSPHRASE 유무에 따라 시드가 달라짐 보여주기
 5. TronWeb.fromMnemonic(영어 니모닉일 때) 또는 lib.walletFromMnemonic → T주소만 출력(열쇠는 마스킹). 한국어 니모닉도 같은 방식으로 주소가 나옴을 보여줌(walletFromMnemonic은 ethers HDNodeWallet.fromPhrase를 쓰므로 한국어 단어표는 ethers.Mnemonic/wordlists 문제로 실패할 수 있음 → 이 경우 bip39.mnemonicToSeedSync 시드로 bip32(BIP32Factory(tiny-secp256k1)).fromSeed(seed).derivePath("m/44'/195'/0'/0/0").privateKey → TronWeb.address.fromPrivateKey 로 주소를 만든다. **두 방식이 영어 니모닉에서 같은 주소를 내는지 스크립트 안에서 확인**)
 6. 데모 니모닉(abandon×11 about)이 엔트로피 0x00에서 나온다는 것과 "공개된 니모닉의 주소는 이미 남의 것"(tron-facts의 권한 탈취 관찰) 한 줄 안내
초등 이야기: 토리가 열쇠를 자꾸 잃어버려서 노드 아저씨가 주사위 12번으로 "12단어 주문"을 만들어 줌. 주문을 아는 사람은 열쇠를 똑같이 깎을 수 있어서 아저씨도 주문을 안 물어봄.
활동: 주사위 12번 + 한국어 단어표(bip39 korean 2048단어 중 첫 100단어를 activity.md에 표로 수록; 주사위 눈 합으로 단어 고르기) 주문 카드 만들기 → "주문 보여 주면 보물 뺏기기" 놀이. 무장비 5분: "아무 숫자나 말해 보기 → 앞사람 따라 하기가 쉽다 → 주사위 소리".
중고등 실험: 동전 1→10→128개 가짓수 계산; 12번째 단어 바꿔 검증 실패 확인; PASSPHRASE 바꿔 시드 변화.
일반인: 앱 첫 설치 "복구 구문 적어 두세요"가 이것. 예/아니오 표: 고객센터 채팅이 12단어 요구→사기 / 에어드랍 페이지 복구구문 입력→사기 / 첫 백업 화면이 보여줌→정상(그때 한 번).

## 02 · `02-key-to-address` · 열쇠에서 우편함 번호가 나와요 ★
규칙 2. 대응: Lesson 2.
핵심: 열쇠(개인키 32바이트) → 공개키(secp256k1) → keccak256 뒤 20바이트 → 0x41 붙이고 base58check → T로 시작하는 34글자 주소. 방향은 한쪽뿐. 같은 12단어에서 경로 인덱스만 바꾸면 주소가 여러 개. T주소 안에는 0x주소가 숨어 있다(비티의 예고).
스크립트 (네트워크 불필요, 환경변수: MNEMONIC(없으면 데모), SHOW_SECRETS):
 1. 경로 m/44'/195'/0'/0/0 로 개인키(마스킹)·압축/비압축 공개키
 2. keccak256(비압축 공개키 64바이트) → 뒤 20바이트 → '41'+hex → sha256 두 번 앞 4바이트 체크섬 → ethers.encodeBase58 로 T주소 **수동 생성** → TronWeb.address.fromPrivateKey 결과와 일치 확인
 3. T ↔ 41hex ↔ 0x 변환(TronWeb.address.toHex/fromHex), evmAddress와 동일 확인, "비티의 나라(BTTC) 주소가 숨어 있다" 예고
 4. index 0~4 주소 5개 표 (같은 니모닉, 다른 우편함)
 5. 이더리움 경로(60')로 만든 주소는 다르다 (TPrkFhZ8… vs TUEZ…)
 6. 오타 감지: T주소 한 글자 바꾸면 TronWeb.isAddress false (base58check 체크섬), 앞4·뒤4만 같은 "닮은 주소" 경고
초등: 열쇠를 특별한 기계(해시)에 넣으면 우편함 번호가 나오지만, 번호로 열쇠는 못 만든다. 우편함 번호는 친구 모두에게 알려 줘도 됨.
활동: "색깔 믹서" — 글자→색 8칸 그림으로 해시 흉내(같은 입력 같은 색, 한 글자만 바꿔도 전부 바뀜). 무장비: 이름을 숫자로 바꾸는 규칙 놀이.
일반인: 앱마다 "받기" 화면 주소가 T로 시작. 주소 복사 후 앞4·뒤4만 확인하는 습관의 위험(주소 오염 사기) → 전체 비교 또는 QR.

## 03 · `03-read-balance` · 광장에 걸린 장부: 1 TRX는 사탕 100만 알
규칙 3. 대응: Lesson 3.
핵심: 잔고는 지갑 앱이 아니라 체인(장부)에 있다. 누구나 주소만 알면 볼 수 있다. TRX는 sun 단위(10^6), USDT(TRC-20)는 컨트랙트가 관리하는 별도 장부(decimals 6). 토큰은 이름이 아니라 컨트랙트 주소로 식별.
스크립트 (Nile 읽기, 환경변수: ADDRESS(없으면 MNEMONIC index0, 없으면 데모 주소)):
 1. getCurrentBlock / getConfirmedCurrentBlock 번호와 차이("3초마다 새 장", 확정 블록은 조금 뒤)
 2. getBalance → sun과 TRX 병기
 3. getAccount → 활성화 여부(빈 객체면 미활성화), create_time, frozenV2(스테이킹), assetV2(TRC-10, getTokenFromID로 이름 조회 1개)
 4. USDT: contract(TRC20_ABI, NILE.usdt) name/symbol/decimals/totalSupply/balanceOf → formatUnits; getContract 로 체인의 컨트랙트 이름(TetherToken) 확인
 5. "가짜 토큰" 경고: 같은 이름 USDT라도 주소가 다르면 다른 토큰. 탐색기 링크(주소/토큰)
 6. 계정 권한 키가 나인지(owner_permission.keys[0].address === 내 hex) 간단 확인 — 데모 주소는 다르게 나옴을 정직하게 출력(레슨 13 예고)
초등: 광장 장부에 모두의 사탕 개수가 적혀 있어서 토리 것도 누구나 볼 수 있음. 사탕상자 1개 = 사탕 100만 알.
활동: 사탕 세기(단위 변환) 카드, 장부 보기 놀이(교사가 칠판 장부에 이름과 사탕 수). 무장비: 학급 칠판 장부.
일반인: 탐색기(nile.tronscan.org)에서 내 주소 검색해 앱 잔고와 대조. 예/아니오: "앱이 잔고를 못 불러와요" 전화 요구→사기.

## 04 · `04-bandwidth-energy` · 연료: 대역폭 입장권과 에너지 입장권
규칙 4. 대응: 없음(트론 고유). wallet-practice의 gas 개념과 대비.
핵심: 트론은 gas 대신 자원. 대역폭(바이트, 하루 600 무료), 에너지(컨트랙트 실행, 무료 없음). 부족하면 TRX 소각(1000 sun/byte, 100 sun/energy). TRX 스테이킹으로 자원 획득. 새 계정에 처음 보내면 활성화 1 TRX. 메모 1 TRX. USDT만 있고 TRX 0이면 전송 불가.
스크립트 (Nile 읽기, ADDRESS/MNEMONIC/데모):
 1. getAccountResources → 무료 대역폭 600 중 사용량, 스테이킹 대역폭/에너지 한도와 사용량 (필드 없으면 0)
 2. getChainParameters 중 가격 6개 + getBandwidthPrices/getEnergyPrices 이력에서 현재값과 마지막 변경 시각(사람이 읽는 날짜)
 3. sendTrx 로컬 빌드(브로드캐스트 없음)로 raw_data_hex 바이트 + 서명 65 + 봉투 ≈ 예상 크기 → 무료 대역폭 없을 때 소각 TRX 계산; "실제는 receipt net_usage로 확인" 명시
 4. estimateEnergy(USDT transfer 1) → energy_required → × 100 sun = 소각 TRX (스테이킹 없을 때). 수신자가 USDT 잔고 없는 주소면 더 큼(수치는 실행 결과)
 5. "TRX 0 + USDT 100" 시나리오 계산표: 무엇이 가능/불가능한지
 6. 활성화 비용: 처음 받는 주소로 보낼 때 1 TRX 추가 (getCreateNewAccountFeeInSystemContract)
초등: 편지를 보내려면 종이 입장권(매일 600장 공짜)이, 자판기(컨트랙트)를 쓰려면 기계 입장권이 필요. 사탕상자를 맡겨 두면(스테이킹) 입장권이 매일 생김.
활동: 입장권 계산 놀이(봉투 크기별 종이 입장권 수). 무장비: 학급 "하루 600장 입장권" 역할극.
일반인: "USDT는 있는데 전송이 안 돼요"의 정체. TronLink의 대역폭/에너지 게이지 읽기. 에너지 대여 광고의 위험(확인 필요 표시).

## 05 · `05-build-and-sign` · 편지 쓰고 도장 찍기(아직 안 보내요)
규칙 5. 대응: Lesson 4 전반부.
핵심: 트랜잭션 = 봉투(누구에게, 얼마, 언제까지 유효, 최근 장부 참조). nonce 대신 ref_block + expiration(60초). txID는 봉투 내용의 sha256이라 도장 전에 정해진다. 서명은 오프라인에서 가능. 서명은 원본 객체를 바꾼다.
스크립트 (Nile 읽기만(ref_block), 환경변수: MNEMONIC(없으면 데모), TO(없으면 index1 주소), AMOUNT_TRX 기본 1, MEMO, EXTEND 초):
 1. sendTrx 빌드 → raw_data 필드 하나씩 해설(contract.type TransferContract, owner/to hex, amount sun, ref_block_bytes/hash, timestamp, expiration(60초 뒤))
 2. txID === sha256(raw_data_hex) 확인(ethers.sha256)
 3. MEMO 있으면 addUpdateData(서명 전!) → data hex, txID 바뀜, 메모 수수료 1 TRX 경고
 4. EXTEND 있으면 extendExpiration → 반환 객체만 사용(원본 복사 후 비교)
 5. trx.sign → signature[0] (130hex), 입력 객체가 바뀌었음을 보여줌, 서명 전 스냅샷과 비교
 6. out/05-signed.json 저장. "이 파일을 우체통에 넣는 것이 레슨 6". 브로드캐스트 없음 명시. 데모 니모닉이면 "데모 주소는 권한이 바뀌어 있어 실제 전송은 어차피 거부됨" 안내
초등: 토리가 편지(봉투)에 받는 사람·사탕 수·유효기간을 쓰고 도장(서명)을 찍음. 아직 우체통에 안 넣음. 도장 전에 봉투를 끝까지 읽기.
활동: 봉투 양식 워크시트(받는 사람, 사탕, 유효기간, 도장칸). 무장비: 말로 봉투 읽기 검사.
일반인: 앱의 "확인" 화면이 봉투. 받는 주소·금액·네트워크·수수료를 읽고 나서 확인.

## 06 · `06-send-testnet` · 진짜로 보내기(연습 나라에서) ★
규칙 6. 대응: Lesson 4 후반부.
핵심: 브로드캐스트하면 되돌릴 수 없다. 처음 보내는 곳은 소액 먼저. 연습 나라(Nile)에서만.
스크립트 (Nile 쓰기 가능, MNEMONIC 필수(없으면 안내 후 exit 1), TO 기본 index1, AMOUNT_TRX 기본 1, SEND_TX):
 1. 내 계정 활성화·잔고·무료 대역폭 확인(getAccount/getBalance/getAccountResources) → 부족하면 faucet 안내 후 종료
 2. 수신자 활성화 여부 → 미활성화면 "1 TRX 활성화비 추가" 경고
 3. 빌드 → 서명 → 미리보기 표(레슨 5 요약)
 4. `assertCanSend({ mnemonic, what: 'TRX 전송' })` → SEND_TX=false면 여기서 GuardError를 잡아 "미리보기 종료" 출력(exit 0)
 5. sendRawTransaction → result true면 txid, 탐색기 링크, `.last-tx.json`(txid, 시각) 저장; result 없으면 code + decodeNodeMessage
 6. 최대 30초 getTransactionInfo 폴링 → receipt/fee 요약 (레슨 7 예고)
 작성자는 SEND_TX=true 로 절대 실행하지 말 것. 데모 니모닉으로 SEND_TX=false 실행해 4단계까지의 출력을 expected-output.txt 에 남긴다.
초등: 우체통에 넣으면 장부지기들이 3초 뒤 장부에 적고, 지우개는 없다. 처음 보내는 친구에겐 사탕 1알 먼저.
활동: "되돌릴 수 없는 편지" 역할극. 무장비: 말로 한 약속은 못 무르기 게임.
일반인: 거래소 출금 화면(주소·네트워크 TRON(TRC20)·수수료)과 연결. 소액 테스트 전송 습관. 예/아니오: "잘못 보냈으니 되돌려 주겠다"는 연락→사기.

## 07 · `07-receipt` · 영수증과 발자국
규칙 7. 대응: Lesson 10.
핵심: "보냈다"는 말이 아니라 txID로 영수증(getTransactionInfo)을 본다. receipt에 수수료(대역폭/에너지), 결과(SUCCESS/REVERT), 발자국(이벤트 로그)이 남는다. 확정 블록.
스크립트 (Nile 읽기, TXID(없으면 .last-tx.json, 없으면 최근 40~100블록에서 log 있는 TriggerSmartContract tx 자동 선택)):
 1. getTransaction → ret[0].contractRet, contract type, 서명 수
 2. getTransactionInfo(빈 객체면 "아직 처리 중, 잠시 후") → blockNumber, blockTimeStamp(사람 시각), fee(sun→TRX), receipt 각 필드 해설(net_usage vs net_fee, energy_usage_total vs energy_fee, result)
 3. 확정 여부: blockNumber <= getConfirmedCurrentBlock 번호
 4. log 디코딩: topics[0]을 TronWeb.sha3('Transfer(address,address,uint256)')와 비교, from/to는 topicToAddress, value는 BigInt(data) → decimals 는 알 수 없으므로 raw 표시(USDT면 6 적용)
 5. tronWeb.event.getEventsByTransactionID 로 TronGrid가 디코딩한 event_name/result 와 대조
 6. 탐색기 링크
초등: 우체국 영수증에 도착 시각·요금·"성공"이 찍히고, 자판기를 썼으면 발자국(이벤트)도 남음.
활동: 영수증 읽기 워크시트(빈칸: 블록, 요금, 결과). 무장비: 영수증 소리 내어 읽기.
일반인: "보냈어요" 캡처 대신 txID 요구하기. 탐색기에서 SUCCESS 확인. 예/아니오: 캡처만 보내고 입금 재촉→의심.

## 08 · `08-sign-message` · '나야'라고 증명하기(돈은 안 들어요) ★
규칙 8. 대응: Lesson 7.
핵심: 서명은 트랜잭션이 아니어도 된다(가스 0). 메시지 서명(프리픽스 \x19TRON Signed Message:\n)과 구조화 서명(TIP-712 = EIP-712). 서명만으로 권한이 넘어갈 수 있으니 무엇에 서명하는지 읽는다.
스크립트 (네트워크 불필요, MESSAGE 기본 "나는 토리예요", CHAIN_ID 기본 3448148188):
 1. signMessageV2 → 서명, verifyMessageV2 → 주소 == 내 주소 확인; 메시지 한 글자 바꿔 검증하면 **다른 주소**가 나옴(예외 아님) → "복원 주소 == 기대 주소" 비교가 검증
 2. 프리픽스 직접 계산(utils.message.TRON_MESSAGE_PREFIX 또는 문자열) + ethers.keccak256/recoverAddress → 같은 주소; 이더리움 프리픽스로는 다른 주소
 3. signTypedData(domain{name,version,chainId,verifyingContract:T주소}, types Permit{owner,spender,value,deadline}, value) → 서명 → verifyTypedData true; chainId 바꾸면 예외 'Signature does not match'(catch)
 4. 0x주소로 바꿔 ethers.TypedDataEncoder.hash 와 동일함 확인 (TIP-712 == EIP-712)
 5. "이 서명이 하는 일" 표: Permit은 spender에게 value만큼 허락(레슨 9 예고). 읽어야 할 필드: spender, value, deadline, verifyingContract, chainId
초등: 도장은 편지에도, 그냥 종이에도 찍을 수 있어요. "나야"라고 증명할 때 찍지만, 뭐라고 써 있는지 모르는 종이엔 안 찍어요.
활동: 도장 검증 놀이(도장 무늬와 이름 짝 맞추기). 무장비: "빈 종이에 사인해 줄래?" 역할극.
일반인: 앱의 "서명 요청" 팝업. 읽을 수 없는 hex만 있는 요청 거절. 예/아니오 표 3행.

## 09 · `09-trc20-approve` · 사탕통 장부와 허락증(TRC-20)
규칙 9. 대응: Lesson 8.
핵심: TRC-20 = ERC-20과 같은 ABI. approve(spender, amount)는 "내 대신 amount까지 꺼내 가도 됨" 허락증. allowance로 확인. 무제한 허락 위험. 다 쓰면 0으로.
스크립트 (Nile 읽기 기본, MNEMONIC/데모, SPENDER 기본 index1 주소, AMOUNT_USDT 기본 3, SEND_TX):
 1. USDT balanceOf, allowance(owner, SPENDER) 조회
 2. ethers.Interface 로 approve calldata 생성·디코딩(selector 095ea7b3, spender, amount) — "붙여넣은 hex 읽는 법"
 3. triggerConstantContract(approve) 리허설 → energy_used
 4. triggerSmartContract 미서명 빌드(feeLimit 30 TRX) → fee_limit, data 확인
 5. guard: 무제한 금액(2^256-1)으로 assertCanSend 호출하면 차단됨을 보여줌(SEND_TX 상태와 무관하게 메시지 출력)
 6. SEND_TX=true + 내 니모닉일 때만: approve(AMOUNT) 전송 → 폴링 → allowance 재조회 → approve(0) 전송(취소). 작성자는 실행 금지.
초등: 사탕통 장부(자판기)에 "내 친구가 사탕 3알까지 꺼내 가도 돼요" 허락증. 무제한 허락증은 통째로 뺏길 수 있음.
활동: 허락증 놀이(금액 적힌 허락증 vs 빈 허락증). 무장비: 말로 "몇 개까지" 허락하기.
일반인: DEX/브릿지 "승인" 팝업의 정체. Tronscan 승인 관리(확인 필요) 또는 allowance 0 만들기. 예/아니오 3행.

## 10 · `10-simulate` · 리허설: 보내기 전에 미리 해보기
규칙 10. 대응: Lesson 9.
핵심: triggerConstantContract/estimateEnergy로 결과·비용을 미리 본다. 실패할 트랜잭션도 보내면 수수료가 나간다. feeLimit 계산. 보내기 전 점검표 7항목.
스크립트 (Nile 읽기, MNEMONIC/데모, TO 기본 index1, AMOUNT_USDT 기본 1):
 1. 소액 transfer 리허설 → result, energy_used, constant_result(0이면 "이 컨트랙트는 bool을 안 돌려줌")
 2. 잔고 초과 transfer → 예외 'REVERT opcode executed' 잡기 + fetch /wallet/triggerconstantcontract 로 원본 message 보여주기
 3. estimateEnergy → energy_required → feeLimit = energy × 100 sun × 1.2 배 계산(sun/TRX)
 4. 점검표 7항목 ✅/❌: 주소 형식, 수신자 활성화, TRX 잔고, USDT 잔고 ≥ 금액, 대역폭/에너지 또는 소각 가능 TRX, 네트워크(Nile), feeLimit 설정
 5. (선택) BTTC estimateGas 와 비교 한 줄(레슨 11 예고)
초등: 연극 전 리허설. 리허설에서 넘어지면 무대(장부)에 안 올라가요.
활동: "될까/안 될까" 카드 판단 놀이. 무장비: 상황 읽고 손들기.
일반인: 앱의 "이 거래는 실패할 수 있습니다" 경고 의미. 실패해도 수수료가 나가는 이유.

## 11 · `11-bttc-same-key` · 한 열쇠, 두 나라, 두 경로: BTTC에서도 열려요
규칙 11. 대응: Lesson 6(+Lesson 4 EVM).
핵심: BTTC는 EVM 호환(chainId 1029 Donau). 트론 키의 0x주소 = T주소 20바이트. 하지만 규칙이 다르다: nonce 있음, gas·gasPrice(legacy), BTT 18자리, 수수료 수치 큼. 네트워크를 글자까지 맞추기.
스크립트 (Donau 읽기 기본, MNEMONIC/데모, TO 기본 index1 evm, AMOUNT_BTT 기본 0.001, SEND_TX):
 1. 트론 경로 키 → ethers.Wallet → address == evmAddress == T주소 20바이트 (비티 회수)
 2. 이더리움 경로(60') 주소도 표시: "지갑 앱마다 어느 경로를 쓰는지 다를 수 있음"
 3. provider.getNetwork chainId 1029, getBalance(formatEther), getTransactionCount(nonce!), getFeeData().gasPrice, estimateGas(21000) → 비용 BTT 계산(실행값 인용)
 4. 트랜잭션 조립: { to, value, gasLimit, gasPrice, nonce, chainId: 1029, type: 0 } → wallet.signTransaction → keccak256 = tx hash (오프라인)
 5. assertCanSend(host = DONAU.rpcUrl) → SEND_TX=true 면 provider.broadcastTransaction → wait → 탐색기 링크 (작성자 실행 금지)
 6. 비교표 트론 vs BTTC: 주소 표기, 순서 보장(ref_block/expiration vs nonce), 수수료(자원 vs gas), 단위(sun vs wei), 탐색기
초등: 비티가 사는 옆 나라도 같은 열쇠로 열리지만 우편함 번호 모양(0x)과 우표 규칙이 달라요. 편지 봉투에 나라 이름을 꼭 써요.
활동: "나라 맞추기" 카드(TRON/BTTC/다른 나라 주소 모양). 무장비: 나라 이름 외치기.
일반인: 거래소 출금 시 네트워크 선택(TRON(TRC20) vs BTTC vs ERC20)을 잘못 고르면 잃을 수 있음. 예/아니오 3행.

## 12 · `12-error-detective` · 실패 탐정: 왜 안 됐을까?
규칙 12. 대응: Lesson 11.
핵심: 실패 메시지는 단서. 트론 특유: 계정 미활성화, 자기에게 전송 불가, REVERT, 만료, 권한 불일치. "고쳐 준다"는 사람은 사기.
스크립트 (Nile 읽기 + 잔고 0 새 지갑에서의 브로드캐스트만(자산 없음, 안전), 데모/MNEMONIC 불필요, CASE=번호로 하나만 실행 가능):
 사건 1 잘못된 주소: isAddress false, sendTrx 예외 'Invalid recipient address provided'
 사건 2 자기 자신에게: 예외 'Cannot transfer TRX to the same account'
 사건 3 미활성화 계정에서 보내기: TronWeb.createRandom 새 키 → 빌드·서명·sendRawTransaction → { code: 'CONTRACT_VALIDATE_ERROR', message(hex→문자) '... does not exist' } (실제 노드 응답, 자산 없음)
 사건 4 토큰 잔고 초과: triggerConstantContract → 'REVERT opcode executed'
 사건 5 다른 키로 서명: trx.sign 예외 'Private key does not match address in transaction'
 사건 6 없는 txID: getTransactionInfo {} vs getTransaction 예외 'Transaction not found'
 사건 7 만료: expiration 60초 설명 + extendExpiration 사용법 (실제 만료 브로드캐스트는 하지 않음, 설명만)
 사건 8 BTTC 잔고 부족: Donau estimateGas({from: 0 BTT 주소, value: 1 BTT}) 예외 메시지(실행값 인용)
 사건 9 권한 불일치: 데모 주소 owner_permission 키 ≠ 자기 주소 → "니모닉이 새면 권한이 바뀔 수 있다"
 각 사건: 증상 → 단서(메시지) → 원인 → 해결. 에러 사전 표를 README와 error-dictionary(활동지 대신 activity.md에 포함)에.
초등: 탐정 토리가 반송된 편지의 도장(이유)을 읽고 원인을 찾아요. 여우 씨가 "내가 고쳐 줄게, 열쇠 줘"라고 하면 안 돼요.
활동: 사건 카드 9장 짝 맞추기. 무장비: 증상 읽고 원인 손들기.
일반인: 오류 문구 캡처해서 "고쳐 준다"는 사람에게 열쇠 주지 않기. 예/아니오 3행.

## 13 · `13-audit-and-graduation` · 내 지갑 점검과 졸업 ★
규칙 13. 대응: 없음(종합).
핵심: 한 달에 한 번 점검(권한, 잔고, 허락증, 최근 거래). 사고 시 순서(새 지갑 만들기 → 자산 옮기기 → 허락 취소 → 신고). 졸업.
스크립트 (Nile 읽기, 인자/ADDRESS/MNEMONIC/데모, SPENDERS="T1,T2" 선택):
 1. 기본 정보: 잔고, 활성화, create_time
 2. 권한 점검: owner/active permission 키가 나인지, threshold, 키 수 — 데모 주소는 "⚠️ 다른 키가 권한을 가짐"이 실제로 나옴
 3. 자원·스테이킹: getAccountResources, frozenV2, getAvailableUnfreezeCount
 4. 토큰: USDT 잔고, SPENDERS 별 allowance(무제한이면 ⚠️)
 5. 최근 거래: TronGrid REST /v1/accounts/{addr}/transactions?limit=5 와 /transactions/trc20?limit=5 → 표(시각, 종류, 상대, 금액, 수수료)
 6. 점검 결과 요약(✅/⚠️ 개수) + 사고 대응 순서 5단계 + 졸업 체크리스트(13규칙) 출력
초등: 한 달에 한 번 보물상자 점검. 문제가 생기면 어른(노드 아저씨/부모님)에게 순서대로.
활동: 점검표·졸업장(activity.md에 인쇄용). 무장비: 13규칙 외우기 노래/구호.
일반인: 월 1회 점검 루틴, 사고 대응 순서, 신고처(확인 필요: 경찰청 사이버수사 등 일반 안내만).
