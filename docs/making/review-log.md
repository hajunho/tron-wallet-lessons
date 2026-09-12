# 레슨 검수 기록 (2026-09-12)

13개 레슨을 집필한 뒤 레슨마다 별도의 검수자가 파일 5개를 모두 읽고 스크립트를 직접 실행해 "반박하는 자세로" 검사한 결과입니다. 레슨 01~10에서 87건, 레슨 11~13에서 42건이 나왔고 모두 수정했습니다. 아래는 01~10의 원문 지적이고, 11~13은 [making-of.md](making-of.md#검수)에 요약되어 있습니다.

검수자들이 문서를 검사하다가 **새로 발견해 실행으로 확인한 사실**은 [verified-facts.md](verified-facts.md) 의 "4차 확인" 절에 정리되어 있습니다.

---

## 01-secret-key 검수 지적 8건 (high 0)

### 1. [medium] lessons/01-secret-key/script.js
**위치**: [5] 시드 → 경로 → 열쇠 → T주소 (170~201행) + README 🔍 실험 2 (84행)
**문제**: PASSPHRASE 가 영어 경로에는 적용되지 않는다. viaBip32 는 mnemonicToSeedSync(englishMnemonic, '') 로, TronWeb.fromMnemonic/walletFromMnemonic 도 passphrase 없이 계산하는데 한국어 경로(viaBip32Korean)만 passphrase 를 쓴다. 실제 실행 확인: 같은 DICE 로 `WORDLIST=english` 와 `WORDLIST=english PASSPHRASE=토리` 를 돌리면 [4] 시드는 달라지지만 [5]의 '이번에 만든 english 12단어의 T주소' 가 둘 다 TAsiQi7pBVyZYJ9d7bPQinf8RqqdoK7Hrw 로 같다. README 실험 2 는 '[5] 단계의 T주소를 … 비교하세요. 시드와 주소가 모두 달라집니다' 라고 하므로 영어 단어표에서는 README 가 틀린 결과를 약속한다. 또 '영어 12단어와 한국어 12단어의 주소가 같은가' 비교가 passphrase 유무가 다른 두 시드를 비교하고 있다.
**수정**: 3방식 교차검증은 passphrase 없이 하되 라벨을 '(PASSPHRASE 없이)' 로 붙이고, 최종 주소는 WORDLIST 와 무관하게 [4]에서 만든 seed(passphrase 적용)로 addressFromSeed(seed) 를 찍어 '이번에 만든 … T주소 (PASSPHRASE 적용)' 로 출력한다. 영어/한국어 주소 비교도 같은 passphrase 로 만든 시드끼리 비교하도록 viaBip32 계산에 passphrase 를 넣는다. README 84행에 '어느 단어표든 [5] 마지막 줄의 T주소가 바뀐다' 로 고치고 expected-output.txt 재생성.

### 2. [medium] lessons/01-secret-key/README.md
**위치**: 🔍 실험 1 (76행), ✅ 확인하기 중고등 (267행), script.js 138행 warn 문구
**문제**: '마지막 단어를 단어표 다음 단어로 바꿈' 에 대해 '16번에 1번꼴로 우연히 true' 라고 쓰였으나, 인덱스 +1 은 마지막 단어의 하위 4비트(체크섬)만 바꾸는 경우가 대부분이라 엔트로피가 그대로이고 체크섬은 반드시 불일치한다. 하위 4비트가 1111 일 때만 올림이 엔트로피 비트로 번져 1/16 이 된다. 2만 회 시뮬레이션 결과 true 비율은 약 1/260 이다(무작위 다른 단어로 바꾸면 1/16.6, 1·2번 단어 교환은 1/15.7 로 그쪽 서술은 맞음). 스크립트 138행 warn '(확률 1/16)' 도 같은 오류.
**수정**: README 76행·267행을 '아무 단어로 바꾸면 약 1/16, 스크립트처럼 바로 다음 단어로 바꾸면 하위 4비트만 바뀌어 거의 항상 false(약 1/256)' 로 고치거나, 스크립트 135행을 단어표에서 무작위 다른 단어로 바꾸도록 수정해 1/16 서술이 그대로 맞게 만든다. 138행 warn 확률 문구도 맞춘다.

### 3. [low] lessons/01-secret-key/README.md
**위치**: 8블록 분량 비율 전체
**문제**: 글자 수 기준 💻 코드 8,903자(46%) / 🧒 이야기 941자(5%) / ✋ 손으로 3,244자(17%) / 🔍 원리 2,654자(14%) / 🏠 생활 10% / 카드·확인 9%. 가이드 비율(초등15/손20/원리15/코드30/생활10/카드·확인10)에서 코드 블록이 30%→46% 로 크게 초과하고 이야기가 15%→5% 로 부족하다. 8블록 제목·앵커·순서와 13규칙 문장은 글자까지 일치함.
**수정**: 코드 블록에서 [2]·[5] 의 인용 코드 스니펫 중 하나를 제거하고 '함정'·'도전(어려움)' 을 각 2~3줄로 줄인다. 이야기 블록은 문장 수 제한이 있으므로 손으로 블록(진행 요약)을 조금 늘려 비율을 맞춘다.

### 4. [low] lessons/01-secret-key/README.md
**위치**: 🧒 이야기로 시작 (8~19행)
**문제**: 동화가 14문장(18행에 3문장)으로 8~12문장 규칙을 넘는다. 또 이야기 바이블 5절 예고 표의 문장은 "주문을 아는 사람은 열쇠를 똑같이 깎을 수 있어." 인데 README 16행은 "이 주문을 알면 열쇠를 똑같이 깎을 수 있어." 로 달라, 레슨 13 회수 시 문장 대조가 어긋난다. 캐릭터 설정(아저씨가 주문을 묻지 않음, 여우 씨 없음, 공포·시세 표현 없음)은 바이블과 일치.
**수정**: 9~10행을 한 문장으로 합치고 18행을 두 문장으로 줄여 12문장 이내로 맞춘다. 16행을 바이블 예고 문장 그대로 "주문을 아는 사람은 열쇠를 똑같이 깎을 수 있어." 로 교체한다.

### 5. [low] lessons/01-secret-key/README.md
**위치**: 💻 함정 1개 (225행), [5] 출력 (183행), quiz.md 개2 정답 (111행)
**문제**: tron-facts.md 에 없는 사실 두 가지가 '(확인 필요)' 없이 쓰였다: (1) `'가격'.length 가 5` (bip39 한국어 단어표 NFKD), (2) 에러 문구 `invalid mnemonic word at index 0`. 검수자가 node 로 직접 실행해 둘 다 참임을 확인했고(원문 에러는 'invalid mnemonic word at index 0 (argument="mnemonic", …, version=6.17.0)' 이며 스크립트가 '(' 앞까지만 잘라 출력), 실제 실행 출력에서 복사한 것이라 규칙 7 은 지켰으나 규칙 1(사실 출처) 기준으로는 미등재.
**수정**: tron-facts.md 에 '한국어 단어표는 NFKD 저장(가격.length=5), TronWeb.fromMnemonic/ethers fromPhrase 는 한국어 니모닉을 invalid mnemonic word at index 0 으로 거부' 를 추가하거나, README 225행 문장 끝에 '(실행으로 확인)' 을 붙인다.

### 6. [low] lessons/01-secret-key/expected-output.txt
**위치**: 1행 헤더 + README 💻 실행 (99행, 107행)
**문제**: expected-output.txt 는 tools 가 WORDLIST=english 로 실행한 결과(4행 '단어표: english')인데 헤더는 '$ npm run l01' 이고, README 99행은 기본값이 korean 이라고 한다. 학습자가 README 대로 `npm run l01` 을 치면 한국어 단어와 '단어표: korean' 이 나와 README 출력 예시와 첫 줄부터 다르다. README 107행은 이 차이를 언급하지 않는다. (출력 24줄 자체는 expected-output.txt 와 문자 단위 일치 확인함.)
**수정**: README 107행에 '아래 예시는 `WORDLIST=english npm run l01` 결과(expected-output.txt 는 영어 단어표로 생성됨). 기본 실행은 한국어 단어가 나온다' 한 문장을 추가한다. tools 는 수정 금지이므로 헤더는 그대로 둔다.

### 7. [low] lessons/01-secret-key/README.md
**위치**: [2/6] 출력 블록 (131~133행)
**문제**: 코드 블록 안의 '  ...' 줄은 실제 출력에 없는 줄이다(expected-output.txt 21~29행의 3~11번 마스킹 행을 생략한 자리). 규칙 7 '출력 예시는 그 출력에서 복사' 에 어긋나는 편집.
**수정**: '  ...' 줄을 지우고 실제 3~11행(전부 **** 마스킹)을 그대로 넣거나, 코드 블록 바깥에 '(3~11행은 모두 **** 로 마스킹되어 생략)' 이라고 적는다.

### 8. [low] lessons/01-secret-key/quiz.md
**위치**: 중2 (42행) + 정답 (103행) + activity.md 워크시트 D (120행)
**문제**: '몇 자리 수인지 npm run l01 출력에서 찾아 적으세요' 라고 하지만 스크립트는 자릿수를 출력하지 않는다(가짓수 줄에 39자리 숫자와 3.4×10^38 만 있음). 학생이 39자리를 손으로 세어야 하며 '출력에서 찾는다' 는 문항 취지와 어긋난다. 나머지 퀴즈 정답(초1~5, 개1 true, 개2 경고 문구, 개3 1·2·12행, 개4 경고 문구·15.5비트, 개5 경로 차이)은 실제 출력·실행으로 대조해 모두 맞음.
**수정**: script.js 92행 가짓수 출력에 `(${combos.toString().length}자리)` 를 덧붙여 '… ≈ 3.4×10^38 (39자리)' 로 찍고 expected-output.txt·README 116행을 재생성한다. 또는 문항을 '몇 자리인지 세어 보세요' 로 바꾼다.

---

## 02-key-to-address 검수 지적 11건 (high 0)

### 1. [medium] lessons/02-key-to-address/README.md
**위치**: 🔍 원리 들여다보기 › 왜 한 방향일까? (56행)
**문제**: "keccak256 해시는 32바이트 입력을 32바이트로 뒤섞는데"라고 썼으나 실제 입력은 비압축 공개키의 x,y 64바이트다. 같은 문서의 [2/6] 출력 인용("keccak256 입력(공개키 64바이트)")과 스크립트 출력이 이를 직접 반박한다.
**수정**: "keccak256 해시는 공개키 64바이트(x, y)를 32바이트로 뒤섞는데"로 수정.

### 2. [medium] lessons/02-key-to-address/script.js
**위치**: [6] 계산 안내(220행) + README 83·204행, activity.md 139행, quiz.md 중5·개5 정답
**문제**: "앞 3글자 평균 58×58=3,364번", "앞4·뒤4 = 58^7 ≈ 2.2×10^12"는 tron-facts에 없는 수치이며 실제로도 틀리다. 페이로드 첫 바이트가 0x41로 고정이라 T주소의 두 번째 글자는 58종이 아니라 25종(9, A~Z 중 I·O 제외)뿐이다(무작위 열쇠 2만 개로 확인: 2번째 글자 종류 25, P(2번째='U')≈0.042 ≠ 1/58≈0.017). 따라서 앞 3글자 평균은 약 25×58≈1,450번(631번 결과와 부합), 앞4·뒤4는 약 25×58^6≈9.5×10^11번이다. (확인 필요) 표시도 없이 정확한 등식("58 × 58 = 3,364")으로 제시되고 퀴즈 정답까지 이 값에 의존한다.
**수정**: 모든 곳을 "T 다음 글자는 25종만 나오므로 앞 3글자는 약 25×58≈1,450번, 앞4·뒤4는 약 25×58^6≈10^12번"으로 고치거나, 최소한 "많아야 58^2 / 58^7 (확인 필요)"로 상한 표현으로 바꾸고 quiz 중5·개5 정답과 activity 139행 '따져 보기'를 함께 수정. 개5의 "한 글자당 58배"는 3→4번째 글자에는 맞으므로 유지 가능.

### 3. [medium] lessons/02-key-to-address/README.md
**위치**: 전체 분량 비율
**문제**: 총 265줄 중 💻 코드 135줄(51%, 목표 30%), ✋ 손으로 17줄(6%, 목표 20%), 🧒 이야기 19줄(7%, 목표 15%), 🏠 생활 16줄(6%, 목표 10%). 코드 블록이 목표의 1.7배, 손으로 블록이 목표의 0.3배로 크게 어긋난다.
**수정**: 코드 블록의 [4]/[5] 전체 출력 인용을 핵심 줄만 남기고 줄이고, 손으로 블록에 activity.md의 ①~⑥ 진행 요약과 워크시트 A 규칙(자음 번호표·색 번호표 한 줄씩)을 옮겨 20% 수준으로 늘린다.

### 4. [low] lessons/02-key-to-address/README.md
**위치**: 🧒 이야기로 시작 (8~19행)
**문제**: 스타일 가이드는 8~12문장인데 약 18문장이다. "그때 로봇 강아지 비티가 번호를 보고 꼬리를 흔들었어요."(30자)처럼 20자 내외를 넘는 문장도 있다.
**수정**: 9·11·14·15행의 두 문장짜리 줄을 한 문장으로 합치고, 비티 등장 문장을 "비티가 번호를 보고 꼬리를 흔들었어요."로 줄여 12문장 이내로.

### 5. [low] lessons/02-key-to-address/script.js
**위치**: main() 니모닉 처리 (70~80행) / 에러 안내
**문제**: MNEMONIC="foo bar baz"로 실행하면 "lesson02 실패: invalid mnemonic length"(영어 ethers 메시지)만 나오고 한국어 안내가 없다(가이드 F: 에러 시 한국어 안내).
**수정**: walletFromMnemonic 호출 전에 단어 수를 검사해 "MNEMONIC 은 12 또는 24 단어여야 합니다. npm run new-wallet 로 연습용 니모닉을 만드세요"를 print.warn 후 exit 1, 또는 catch에서 'invalid mnemonic' 계열 메시지를 한국어로 바꿔 출력.

### 6. [low] lessons/02-key-to-address/activity.md
**위치**: 1. 오프라인 활동 › 진행 ① 규칙 익히기 (20~24행) vs 워크시트 A 순서 (80~84행)
**문제**: 진행 ①은 "3. 8로 나눈 나머지→색 → 4. 섞기" 순서인데 워크시트 A와 보기(토리/토미)는 "섞기 → 8로 나눈 나머지" 순서다. ① 순서대로 하면 섞은 뒤 8 이상 숫자가 생겨 색 번호표에 대응할 수 없다.
**수정**: 진행 ①의 3·4번을 워크시트 A와 같이 "3. 섞기 4. 각 칸을 8로 나눈 나머지→색" 순서로 통일.

### 7. [low] lessons/02-key-to-address/README.md
**위치**: 🔍 실험 1: 출력에서 한 줄 찾기 (68행)
**문제**: "이 줄 바로 위 6줄이 '손으로 만든' 과정"이라 했으나 ✅ 줄 바로 위는 TronWeb.address.fromPrivateKey 줄이고, 손 계산은 그 위 6줄(총 7줄 중 앞 6줄)이다.
**수정**: "이 줄 위 7줄 중 앞 6줄이 손으로 만든 과정이고, 7번째 줄이 TronWeb 결과입니다"로 수정.

### 8. [low] lessons/02-key-to-address/README.md
**위치**: 💻 트론 vs EVM 표 '표기' 행(212행), [3/6] 해설(161행), 함정(219행), script.js 146행 dev 해설
**문제**: "EIP-55 대소문자 체크섬"이라는 명칭이 tron-facts.md에 없다(facts에는 toChecksumAddress가 "대소문자 섞인 hex"를 준다는 관찰만 있음). '오타 검출' 행만 (확인 필요)가 붙어 있고 나머지 4곳은 표시가 없다.
**수정**: 첫 등장(161행)에 "EIP-55(확인 필요)"를 붙이거나 "ethers.getAddress 가 만드는 대소문자 체크섬 표기"로 완화.

### 9. [low] lessons/02-key-to-address/README.md
**위치**: 🔍 실험 2: 환경변수 바꿔 보기 (73~74행)
**문제**: "SHOW_SECRETS=true npm run l02 (데모 니모닉은 공개 값이라 괜찮다)"라고 안내하지만 lib/wallet이 dotenv를 읽으므로 .env에 MNEMONIC이 있으면 학습자의 연습용 니모닉·개인키가 전부 화면에 찍힌다.
**수정**: 주석을 "(.env 에 내 니모닉이 있으면 내 열쇠가 그대로 보이니 화면 공유·녹화 중에는 쓰지 않는다)"로 보강.

### 10. [low] lessons/02-key-to-address/quiz.md
**위치**: 💻 개발자 개3 (55~59행)
**문제**: 코드 예시가 DEMO_MNEMONIC을 import하지 않고 사용한다(`const { walletFromMnemonic } = require('./lib/wallet')`). 그대로 실행하면 ReferenceError.
**수정**: `const { walletFromMnemonic, DEMO_MNEMONIC } = require('./lib/wallet');`로 수정.

### 11. [low] lessons/02-key-to-address/script.js
**위치**: print.explain 호출 (95, 120, 143, 165, 182, 222행)
**문제**: 가이드는 explain을 "핵심 단계 3~5곳만"으로 제한하는데 6단계 모두에 있다.
**수정**: [1] 또는 [4]의 explain을 제거해 5곳 이내로.

---

## 03-read-balance 검수 지적 8건 (high 1)

### 1. [high] lessons/03-read-balance/README.md
**위치**: 💻 코드로 확인하기 > 함정 1개 (line 214) 및 quiz.md 개발자 4번 해설 (line 92)
**문제**: 에러 문구 `owner_address isn't set` 이 tron-facts.md 에 없고 '(확인 필요)' 표시도 없다. 같은 문단의 '(확인 필요)' 는 setAddress 에만 붙어 있어 에러 문구는 검증 표시 없이 사실처럼 제시된다. 검수 중 직접 실행해 보니 실제 예외 문자열은 `class java.security.InvalidParameterException : owner_address isn't set.` 로, 부분 문자열로는 맞지만 문서 규칙(사실 문서에 없는 에러 문구는 쓰지 않거나 확인 필요 표시)을 어겼다.
**수정**: README 214줄과 quiz.md 92줄에서 에러 문구를 실제 전체 문자열 `class java.security.InvalidParameterException : owner_address isn't set.` 로 바꾸고 바로 뒤에 '(확인 필요: 사실 문서에 없음, 이 레슨 실행으로 관찰)' 를 붙인다. 또는 오케스트레이터가 tron-facts.md 에 'tronweb.contract().call() 을 주소 등록 없이 호출하면 예외 `class java.security.InvalidParameterException : owner_address isn't set.`, `tronWeb.setAddress(T주소)` 로 해결' 항목을 추가하면 표시를 뗄 수 있다.

### 2. [medium] lessons/03-read-balance/README.md
**위치**: 💻 [3/6] 해설 (line 165), script.js 주석 (line 129~131), quiz.md 개발자 5번 해설 (line 93)
**문제**: 'frozenV2 항목에 type 이 없으면 대역폭(BANDWIDTH)' 이라는 해석이 tron-facts.md 에 없고 '(확인 필요)' 표시도 없다. 사실 문서는 frozenV2 필드의 존재만 기록한다. 실제 응답은 `[{amount:17949000000},{type:'ENERGY',...},{type:'TRON_POWER'}]` 로 첫 항목에 type 이 생략되어 있을 뿐, 그것이 BANDWIDTH 라는 근거는 문서에 없다(스크립트가 그렇게 출력하므로 출력 자체는 실행값과 일치).
**수정**: README 165줄·quiz 93줄 해설에 '(확인 필요: type 이 생략된 첫 항목을 대역폭으로 해석함)' 을 붙이고, script.js 129줄 주석에도 같은 표시를 넣는다. 출력 문자열 자체는 유지해도 된다(expected-output 과 일치).

### 3. [medium] lessons/03-read-balance/README.md
**위치**: 전체 분량 비율
**문제**: 262줄 중 🧒 19줄(7%), ✋ 23줄(9%), 🔍 50줄(19%), 💻 123줄(47%), 🏠 20줄(8%), 🛡️+✅ 22줄(8%). 가이드 목표(15/20/15/30/10/10)에서 💻 가 17%p 초과, 🧒 와 ✋ 가 각각 8%p·11%p 부족하다. 코드 블록이 세 개(주소 결정 함수 16줄, 6단계 출력 인용, TRC-20 호출 코드)라 개발자 블록이 절반을 차지한다.
**수정**: 💻 의 '주소 결정 순서' 코드 블록(113~129줄)을 삭제하고 두 줄 산문으로 대체하거나, 출력 인용을 [1][2][3][6] 핵심 줄만 남긴다. ✋ 에는 activity.md 워크시트 1번 표(사탕 세기 카드)를 요약 표로 옮겨 넣고, 🧒 는 유지하되 손으로 블록을 늘려 비율을 맞춘다.

### 4. [low] lessons/03-read-balance/README.md
**위치**: 🧒 이야기로 시작 (line 8~19)
**문제**: 12줄이지만 따옴표 대화까지 문장 단위로 세면 약 21문장으로 가이드의 '8~12문장' 을 넘는다(예: 15줄은 3문장, 16줄은 3문장, 18줄은 3문장). 문장 길이(20자 내외)와 '~해요'체, 병기 1개(광장 장부(블록체인)), 캐릭터 설정은 바이블과 일치한다.
**수정**: 12줄 '여우 씨는 슬그머니 물러가요.' 와 17줄을 합치고, 15~16줄의 대사를 한 문장씩으로 줄여(예: '"이거 진짜 사탕이야, 이름이 똑같잖아!"' / '"번호가 달라. 이름은 누구나 붙일 수 있어."' 를 각각 한 문장으로) 총 12문장 안으로 맞춘다.

### 5. [low] lessons/03-read-balance/README.md
**위치**: 🔍 실험 2 (line 86)
**문제**: 인용된 출력 `getAccount 결과가 빈 객체 {} 입니다 → 아직 활성화되지 않은 계정입니다` 는 expected-output.txt 에 없다(데모 주소는 활성화됨). 검수 중 무작위 새 주소로 실행해 실제로 같은 문구가 나오는 것은 확인했으므로 지어낸 출력은 아니지만, 규칙 B(README 출력 예시는 expected-output.txt 에서 복사)와 어긋나고 원문 끝 '(TRX 를 한 번도 받은 적 없음).' 이 잘려 있다.
**수정**: 인용을 스크립트 원문 전체 `⚠️  getAccount 결과가 빈 객체 {} 입니다 → 아직 활성화되지 않은 계정입니다 (TRX 를 한 번도 받은 적 없음).` 로 바꾸고 '(미활성화 주소로 실행했을 때의 출력, expected-output.txt 에는 없음)' 을 덧붙인다.

### 6. [low] lessons/03-read-balance/script.js
**위치**: [5] 가짜 토큰 경고 (line 194) 및 README 🏠 (line 226)
**문제**: 'Nile 의 USDT 는 TXYZ… 하나뿐입니다' 는 과장이다. 누구나 Nile 에 USDT 라는 이름의 컨트랙트를 배포할 수 있다는 것이 바로 이 레슨의 요지이며, tron-facts.md 는 '이 강의에서 쓰는 Nile USDT 주소' 만 기록한다.
**수정**: '이 강의가 쓰는 Nile 의 USDT 는 TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf 입니다. 이름이 같은 다른 컨트랙트는 다른 토큰입니다.' 로 바꾼다(script.js 194줄, README 226줄).

### 7. [low] lessons/03-read-balance/README.md
**위치**: 💻 [5/6] 가짜 토큰 경고, [6/6] 계정 권한 (line 190~199)
**문제**: 소제목은 [5/6] 을 포함하지만 [5] 단계의 출력 인용도 해설도 없어 '단계별 [1/N] 출력 해설' 요구를 [5] 만 빠뜨렸다. 또 script.js 는 print.explain 을 6곳 모두에 넣어 가이드의 '핵심 단계 3~5곳만' 을 넘는다.
**수정**: README 에 [5] 의 두 줄(`바꿀 수 없는 것: 컨트랙트 주소…`, `⚠️  같은 이름 "USDT" 라도…`)을 expected-output.txt 에서 복사해 인용하고 한 줄 해설을 붙인다. script.js 는 [5] 의 print.explain 을 제거해 5곳으로 줄이고 expected-output.txt 를 다시 생성한다.

### 8. [low] lessons/03-read-balance/README.md
**위치**: 💻 트론 vs EVM 차이 표 (line 209)
**문제**: '계정 권한 변경: EVM 없음(EOA 키 고정)' 은 tron-facts.md 에 없는 EVM 쪽 주장이며 확인 표시가 없다(같은 표의 getBlock('finalized') 행은 표시가 있다).
**수정**: 해당 셀을 '없음(EOA 키 고정) (확인 필요)' 로 바꾸거나 행을 삭제한다.

---

## 04-bandwidth-energy 검수 지적 12건 (high 1)

### 1. [high] lessons/04-bandwidth-energy/README.md
**위치**: 🔍 원리 들여다보기 › 실험 2: 환경변수 바꿔 보기 (78행)
**문제**: "`ADDRESS=TSeJkUh4Qv67VNFwY8LaAxERygNdy6NQZK npm run l04` 로 실행하면 [4]의 '에너지 잔량과 비교' 줄이 '스테이킹 에너지로 충분'에서 '부족분은 TRX 소각'으로 바뀐다"고 단정했지만, 실제로 실행하면 TSeJ 주소는 EnergyLimit 39,528 (> 21,975)이라 여전히 '스테이킹 에너지로 충분'이 나온다. 실행하지 않고 상상해서 쓴 실험 결과(절대 규칙 7 위반)이며 학생이 따라 하면 책과 화면이 다르다.
**수정**: 실험 2를 실제 관찰값으로 고친다. 예: "`[1]`의 EnergyLimit 이 1,323,767 → 39,528 로 바뀌는지, `[4]`의 비교 줄이 39,528 ≥ 21,975 라서 여전히 '충분'인지 확인하고, 39,528 ÷ 21,975 로 소각 없이 몇 번 보낼 수 있는지(1번) 계산해 보세요" 로 바꾸거나, '부족분은 TRX 소각' 분기를 보고 싶다면 그 분기가 실제로 나오는 조건(에너지 0 이면서 USDT 를 가진 주소)을 확인해 그 주소로 바꾼다. 어느 쪽이든 실행 결과를 붙여 넣은 뒤 다시 실행해 대조한다.

### 2. [medium] lessons/04-bandwidth-energy/quiz.md
**위치**: 💻 개발자 5번 문제·정답 (62행, 114행) + README 60행 + script.js 166행
**문제**: "receipt 의 net_usage 는 266 이었습니다"(quiz 62행), "receipt 의 net_usage 는 266B"(script.js 166행 dev 해설, expected-output 40행에도 그대로 출력), "실제 체인 영수증에는 … 266 bytes 로 기록됩니다"(README 60행)는 관찰 사실처럼 쓰였지만 tron-facts.md 가 실제로 관찰한 것은 `net_fee: 266000`(sun) 뿐이고, `net_usage` 필드는 "무료 대역폭을 썼다면 net_usage 가 나오고 net_fee 없음(확인 필요)" 로 미확인 상태다. 266 bytes 는 net_fee ÷ 1000 으로 역산한 값이다.
**수정**: 세 곳 모두 "receipt 의 net_fee 266,000 sun(= 266 bytes × 1000 sun) 으로 관찰됨. 무료 대역폭을 썼을 때는 net_usage 에 바이트가 적힌다(확인 필요)" 처럼 관찰값(net_fee)과 미확인값(net_usage)을 구분해 쓴다. script.js 를 고치면 expected-output.txt 를 tools/make-expected-outputs.js 04 로 재생성하고 README 인용도 갱신한다.

### 3. [medium] lessons/04-bandwidth-energy/quiz.md
**위치**: 🔍 중고등 1번 정답 (103행)
**문제**: 정답 해설이 "세 번째는 남은 68 bytes 로 부족하므로 **부족분을** TRX 로 소각" 이라고 하여 '모자란 198 bytes 만 소각' 으로 읽히는데, tron-facts.md 에는 부분 소각 여부가 없고("부족하면 1000 sun/byte 로 소각" 뿐), 같은 레슨의 README 60행·activity.md 24행·script.js 167행은 세 번째 전송에 266 × 1000 = 0.266 TRX 전액이 소각된다고 설명한다. 레슨 안에서 답이 둘로 갈리고, '부족분만' 은 검증되지 않은 주장이다.
**수정**: README·activity 와 같은 방식으로 통일한다: "무료 600 중 532 를 써서 68 만 남았고, 266 을 감당하지 못하므로 그 전송은 266 × 1000 sun = 0.266 TRX 를 소각한다(실제 정산은 receipt 로 확인). 남은 68 로 부분 상쇄되는지는 (확인 필요)" 로 고친다.

### 4. [medium] lessons/04-bandwidth-energy/README.md
**위치**: 🏠 내 생활에서는 › 사기 판단표 1행 (232행) + quiz.md 일반인 3번 (78행, 119행)
**문제**: "에너지는 누구도 남의 12단어 없이 넣을 수 있습니다"(README) / "에너지는 12단어 없이도 누구나 남에게 보낼 수 있고"(quiz) 는 '에너지 위임(delegate)' 기능을 사실로 전제하지만 tron-facts.md 에는 위임 실행 API 가 없고 조회 API(getDelegatedResourceAccountIndexV2, getCanDelegatedMaxSize)만 있다. (확인 필요) 표시도 없다. 또 "누구도 … 있습니다" 는 비문(누구나).
**수정**: 근거가 필요 없는 형태로 바꾼다: "에너지를 넣어 주는 일에 12단어는 전혀 필요 없습니다. 12단어를 묻는 순간 사기입니다" 처럼 '12단어가 필요한 작업이 아니다' 에만 집중하고, 위임이 가능하다는 서술을 남기려면 "(확인 필요)" 를 붙인다. quiz 정답도 같은 문장으로 맞춘다.

### 5. [medium] lessons/04-bandwidth-energy/README.md
**위치**: 🧒 이야기로 시작 (8~20행)
**문제**: 동화가 약 20문장으로 스타일 가이드·바이블의 8~12문장 상한을 크게 넘고, "사탕은 편지 안에 들어가는 거고, 우체통을 쓰려면 종이 입장권(대역폭)이 있어야 해."(38자), "토리의 사탕통엔 사탕이 가득한데, 사탕상자가 0이라 자판기가 조용히 서 있었어요."(39자) 등 20자 내외 기준을 두 배 가까이 넘는 문장이 여럿이다. 또 노드 아저씨가 "입장권 한 장 주렴", "편지 한 통에 몇 장씩 쓰지" 라고 말해 바로 아래 ✋ 블록의 '편지 한 통 = 266장' 과 어긋난다.
**수정**: 12문장 이내로 줄이고 긴 문장을 둘로 쪼갠다. 예: "사탕은 편지 속에 들어가요. 우체통을 쓰려면 종이 입장권(대역폭)이 필요해요." '한 장'·'몇 장' 은 "편지 한 통에 입장권이 꽤 많이 들어" 또는 바이블 허용 숫자만 써서 "600장이면 편지 두 통쯤이야" 로 바꿔 266 과 모순되지 않게 한다.

### 6. [medium] lessons/04-bandwidth-energy/README.md
**위치**: 전체 분량 비율
**문제**: 글자 수 기준 🧒 7.7% / ✋ 11% / 🔍 18% / 💻 42% / 🏠 11% / 🛡️+✅ 10% (행 수 기준 💻 138행 = 52%). 목표 15/20/15/30/10/10 에 비해 코드 블록이 1.4배, 손으로 블록은 절반, 이야기 블록은 절반이다.
**수정**: 💻 에서 [1]~[6] 출력 인용 중 README 에 꼭 필요하지 않은 줄(예: [2] 가격표 6줄 중 3줄, 함수 인용 parsePriceHistory 블록)을 줄이고 expected-output.txt 링크로 대신한다. ✋ 에는 activity.md 워크시트 A 의 봉투 카드 표(8행)를 요약 표로 옮기고 발문에 예시 답 힌트를 한 줄씩 붙여 20% 근처로 늘린다.

### 7. [low] lessons/04-bandwidth-energy/README.md
**위치**: 🏠 내 생활에서는 › 사기 판단표 2행 (233행)
**문제**: 앱 문구를 따옴표로 "TRX 잔고가 부족하여 수수료를 낼 수 없습니다" 라고 인용했지만 tron-facts.md 에 없는 문구다(실제 지갑 앱 문구인지 확인되지 않음).
**수정**: 따옴표를 빼고 "앱이 수수료(TRX) 부족을 안내함" 처럼 일반 서술로 바꾸거나 "(확인 필요)" 를 붙인다.

### 8. [low] lessons/04-bandwidth-energy/README.md
**위치**: ✋ 손으로 해보기 › 준비물 (30행)
**문제**: README 는 "봉투 그림 카드 6장" 이라 하고 activity.md 17행·워크시트 A 는 "봉투 카드 8장" 이다. 워크시트 B 도 6순서까지만 있어 세 문서가 6/8/6 으로 어긋난다.
**수정**: activity.md 워크시트 A 의 8장에 맞춰 README 를 8장으로 고치거나, 카드 7·8(중복 카드)을 지워 6장으로 통일하고 워크시트 B 행 수와 맞춘다.

### 9. [low] lessons/04-bandwidth-energy/script.js
**위치**: [2] 대역폭 가격 이력 (130행) → README 131행, expected-output 25행
**문제**: `${h.length}번 변경` 은 이력 항목 수를 그대로 출력한다. 실제 문자열은 `0:10,1606282800000:40,1612778400000:140,1625815200000:100,1626253800000:1000` 으로 초기값(0:10) 포함 5항목 = 변경 4번인데 "5번 변경" 으로 찍힌다.
**수정**: `${h.length - 1}번 변경(초기값 ${h[0].price} 포함 ${h.length}항목)` 처럼 초기값과 변경 횟수를 구분해 출력하고 expected-output.txt·README 인용을 재생성한다.

### 10. [low] lessons/04-bandwidth-energy/script.js
**위치**: print.explain 사용 횟수 (94, 138, 163, 206, 225, 247행)
**문제**: 스타일 가이드 script.js 규약은 explain 을 "핵심 단계 3~5곳만" 이라 했는데 6단계 모두(6곳)에 붙어 있다.
**수정**: [2] 가격표나 [6] 활성화 중 하나의 explain 을 지워 5곳 이내로 맞춘 뒤 expected-output.txt 를 재생성한다.

### 11. [low] lessons/04-bandwidth-energy/script.js
**위치**: adult 해설 (142행, 210행)
**문제**: [2] adult 해설이 USDT 수수료를 "약 1.5~2.2 TRX" 로, [4] adult 해설이 "TRX 1~2개" 로 안내하는데, 같은 스크립트의 [4] 출력은 새 주소 전송 시 3.7063 TRX 를 보여 준다. 학생이 화면과 해설을 대조하면 범위가 맞지 않는다.
**수정**: "약 1.5~2.2 TRX(받는 사람이 이미 USDT 를 가진 경우), 처음 받는 주소면 더 큼 — [4] 출력 참고" 처럼 조건을 붙인다.

### 12. [low] lessons/04-bandwidth-energy/script.js
**위치**: 데모 모드 안내 (65행)
**문제**: 니모닉 표시에 lib/print.js 의 `maskMnemonic` 대신 lib/wallet.js 의 `describeMnemonic` 을 쓴다. 데모 니모닉(공개 값)에만 쓰여 유출 위험은 없지만, 절대 규칙 5("니모닉은 print.js 의 mask/maskMnemonic 으로만 출력")와 어긋나 다른 레슨이 복사할 때 습관이 된다.
**수정**: `print.maskMnemonic(DEMO_MNEMONIC)` 으로 바꾸고 expected-output.txt 5행과 README 를 재생성한다.

---

## 05-build-and-sign 검수 지적 9건 (high 0)

### 1. [medium] lessons/05-build-and-sign/README.md
**위치**: 전체 분량 비율 (8블록)
**문제**: 실측(282줄) 기준 💻 코드 블록이 154줄·6,611자로 전체의 55%를 차지한다(가이드 30%). 반면 🧒 이야기 6.7%(줄)/3.5%(글자) vs 15%, ✋ 손으로 6.7%/7.4% vs 20%, 🏠 내 생활 5%/7.9% vs 10%, 🛡️+✅ 8.5% vs 10%로 모두 미달. 코드 블록이 다른 블록 전부를 합친 것보다 크다.
**수정**: 코드 블록을 90~100줄 수준으로 줄인다: [1/7]·[5/7]의 JS 인용 중 출력 블록과 중복되는 것 제거, 트론 vs EVM 표를 4행으로 축소, [7/7] 설명 단축. ✋ 손으로 블록은 activity.md 의 '중고등 확장'과 '실제 봉투와 견주어 보기' 표를 요약해 옮겨 20% 근처로 늘린다.

### 2. [medium] lessons/05-build-and-sign/README.md
**위치**: 💻 코드로 확인하기 › 트론 vs EVM 차이 박스 (230행 '서명 대상', 233행 '만료')
**문제**: EVM 열의 '서명 전 RLP의 keccak256'(서명 대상)과 '없음(nonce가 소진될 때까지 유효)'(만료)은 tron-facts.md 에 없는 주장인데 '(확인 필요)' 표시가 없다. 같은 표의 229행·234행에는 표시를 붙여 놓아 일관성도 없다.
**수정**: 두 셀 끝에 '(확인 필요)'를 붙이거나, tron-facts 에 있는 BTTC 사실('nonce 있음', 'wallet.signTransaction → keccak256 = tx hash')만으로 문장을 다시 쓴다. 예: 만료 → '없음, nonce 로 순서 관리(확인 필요)'.

### 3. [medium] lessons/05-build-and-sign/quiz.md
**위치**: 정답과 해설 › 중3
**문제**: '3통째부터는 부족한 바이트만큼 1000 sun/byte로 TRX가 소각됩니다'는 무료 대역폭이 모자랄 때 부족분만 부분 과금된다는 주장인데 tron-facts.md 에는 '부족하면 1000 sun/byte로 TRX 소각'까지만 있고 부분 차감 여부는 없다(실제 트론은 무료 대역폭이 트랜잭션 전체 바이트에 못 미치면 전체를 소각하는 것으로 알려져 있어 틀릴 가능성이 있음). README 70행 '하루에 2통까지 공짜' 계산도 같은 전제에 기댄다.
**수정**: 해설을 '무료 대역폭이 모자라면 1000 sun/byte 로 TRX 가 소각됩니다(부족분만 차감되는지, 전체가 차감되는지는 확인 필요). 정확한 값은 receipt 의 net_usage/net_fee 로 확인'으로 고치고, README 70행에도 같은 '(확인 필요)'를 붙인다.

### 4. [low] lessons/05-build-and-sign/README.md
**위치**: 🧒 이야기로 시작
**문제**: 줄 수는 12줄이지만 문장 수는 17개(예: '유효기간은 60초예요. 지나면 우체통이 안 받아요.', '도장은 이 봉투에만 맞아요. 다른 봉투에는 안 맞아요.', '아직 우체통엔 안 넣어요. 그건 다음 이야기예요.')로 바이블 기준 8~12문장을 넘는다. 한자어·영어·공포·시세 표현은 없고 병기는 '도장(서명)' 1개로 규칙에 맞음.
**수정**: '다른 봉투에는 안 맞아요', '그건 다음 이야기예요', '여우 씨는 슬그머니 물러가요' 등을 삭제하거나 앞 문장과 합쳐 12문장 이내로 줄인다.

### 5. [low] lessons/05-build-and-sign/script.js
**위치**: [2] sendTrx 빌드 catch 블록 (76~80행)
**문제**: 빌드 실패가 네트워크 원인이 아닐 때도 '빌드는 최근 블록(ref_block)을 노드에서 읽어야 하므로 네트워크가 필요합니다'를 무조건 출력한다. 실행 확인: TO=내 주소로 실행하면 '봉투를 만들지 못했습니다: Cannot transfer TRX to the same account' 다음에 네트워크 안내가 붙어 원인을 오도한다(exit 1 자체는 정상).
**수정**: catch 에서 errorMessage(error)가 'Cannot transfer TRX to the same account' 이면 'TO 가 보내는 주소와 같습니다. 다른 주소(기본: index 1)를 쓰세요'를, 네트워크 패턴에 걸릴 때만 노드 연결 안내를 출력하도록 분기한다.

### 6. [low] lessons/05-build-and-sign/activity.md
**위치**: 3. 인쇄용 워크시트 › 트론 마을 봉투 (56행, 59행)
**문제**: 우편함 번호 칸이 'T' + 밑줄 32개 = 33글자인데, 같은 파일 14행과 tron-facts 는 T주소를 34글자로 안내한다. 학생이 실제 데모 주소를 베껴 쓰면 한 칸이 모자란다.
**수정**: 두 줄의 밑줄을 33개로 늘린다(T 포함 34칸).

### 7. [low] lessons/05-build-and-sign/README.md
**위치**: 💻 코드로 확인하기 › [4/7] 메모는 서명 전에만 (170행)
**문제**: 인용된 에러 문구 `You can not extend the expiration of a signed transaction` 은 실제 tronweb 메시지(검수 실행으로 확인)와 달리 끝의 마침표가 빠져 있다. quiz.md 개3 정답에는 마침표가 있어 README 와 퀴즈가 서로 다르다.
**수정**: README 170행 문구를 `You can not extend the expiration of a signed transaction.` 로 맞춘다.

### 8. [low] lessons/05-build-and-sign/README.md
**위치**: 🔍 원리 들여다보기 › 실험 1 (67~69행) 및 quiz.md 중3 해설
**문제**: 중고등 대상 블록에 'protobuf 봉투'라는 용어가 설명 없이 나오고, 차이 68바이트가 곧 protobuf 포장이라고 단정한다. tron-facts 는 '266 bytes(protobuf 봉투 포함)'와 '≈ 200~270 bytes, 정확한 값은 receipt 로 확인'까지만 검증했다.
**수정**: 'protobuf(노드끼리 주고받는 포장 형식)'로 한 번 풀어 쓰고, 68바이트는 '포장 등으로 추정, 정확한 크기는 receipt 의 net_usage 로 확인'으로 완화한다.

### 9. [low] lessons/05-build-and-sign/README.md
**위치**: 💻 코드로 확인하기 › 도전(어려움) (243행)
**문제**: 'ethers recoverAddress 를 txID 해시와 이 서명에 그대로 적용할 수 있는지는 확인 필요'로 남겨 두었는데, 검수에서 실제 실행해 보니 ethers.recoverAddress('0x'+signed.txID, '0x'+signed.signature[0]) 가 0xC8599111F29c1e1E061265b4AF93eA1F274aD78A 를 돌려주어 보내는 주소(TUEZ…)의 EVM 주소와 정확히 일치했다. 문제는 아니지만 이미 검증된 사실을 미확인으로 두고 있다.
**수정**: '확인 필요'를 지우고 '서명은 txID 32바이트에 대한 것이라 ethers.recoverAddress("0x"+txID, "0x"+signature[0]) → 0x주소 → "41"+hex → T주소로 서명자를 복원할 수 있다(검증됨)'로 바꾸고, 이 사실을 tron-facts 에 추가하도록 상위에 보고한다.

---

## 06-send-testnet 검수 지적 8건 (high 1)

### 1. [high] lessons/06-send-testnet/README.md
**위치**: 💻 코드로 확인하기 > 트론 vs EVM 차이 표 (184~190행)
**문제**: EVM 열의 두 주장이 tron-facts.md 에 없고 '(확인 필요)' 표시도 없음. (1) 187행 '브로드캐스트 응답: tx hash 문자열, 실패는 예외' — ethers v6 의 sendTransaction/broadcastTransaction 은 hash 문자열이 아니라 TransactionResponse 객체를 돌려주므로 사실과도 어긋날 가능성이 큼. (2) 190행 '`broadcastTransaction` 뒤 `wait()` 로 receipt' — broadcastTransaction/wait 은 tron-facts.md 에 없음(lesson-specs 의 레슨 11 계획에만 등장). 같은 표 188행은 '(확인 필요)' 를 붙였는데 이 두 칸만 빠짐.
**수정**: 187행을 'ethers: `sendTransaction`/`broadcastTransaction` → TransactionResponse 객체(`.hash`), 실패는 예외 (확인 필요)' 로, 190행을 '`wait()` 로 receipt (확인 필요, 레슨 11)' 로 고치거나 tron-facts 에 있는 `wallet.sendTransaction({ to, value, gasPrice })` 만 인용한다.

### 2. [medium] lessons/06-send-testnet/README.md
**위치**: 전체 분량 비율
**문제**: 글자 수 기준 비율이 초등 6% / 손으로 10% / 원리 13% / 코드 49% / 생활 12% / 카드·확인 9% (줄 수 기준 코드 146/263줄 = 55%). 스타일 가이드 목표(15/20/15/30/10/10)에서 코드가 약 1.6배 과다, 초등·손으로가 절반 수준으로 크게 어긋남.
**수정**: 코드 블록에서 '단계별 출력 해설' 의 [5][6] 코드 인용과 'SEND_TX=true 일 때의 전체 흐름' 가상 블록(192~211행)을 줄이고, 손으로 해보기에 activity.md 의 역할·진행 6단계 요약(표)과 워크시트 (가)(나) 미리보기를 옮겨 넣어 비율을 맞춘다.

### 3. [medium] lessons/06-send-testnet/README.md
**위치**: 🧒 이야기로 시작 (8~20행)
**문제**: 이야기 바이블·스타일 가이드는 '8~12문장' 인데 본문(8~20행)은 마침표·물음표·느낌표 기준 22개, 대화 포함 약 18~20문장으로 상한을 크게 넘음(13개 행 대부분이 2문장). '톡.'·'어? 사탕 수를 잘못 썼어요!' 등 짧은 문장이 누적됨.
**수정**: 10~11행을 한 문장으로 합치고("넣으면 3초 뒤 장부지기들이 새 장에 적어."), 13행 '톡.' 을 14행에 붙이고, 17행('토리는 한참 장부를 봤어요.')·19행을 삭제해 12문장 이내로 줄인다. 핵심 한 문장·물어보기는 유지.

### 4. [low] lessons/06-send-testnet/script.js
**위치**: [1] 내 계정 확인 — 미활성화/잔고 부족 분기 (118~128행)
**문제**: '❌ 계정이 비어 있습니다' 와 '❌ 잔고가 부족합니다' 분기는 faucet 안내 후 `return` 만 하고 `process.exitCode` 를 설정하지 않아 실패인데 exit 0 으로 끝남. 같은 스크립트의 다른 ❌ 분기(주소 오류, 조회 실패, 노드 거부)는 모두 exit 1 이라 일관성이 없고, quiz 개발자 문제와 README 가 '실패는 exit 1' 로 설명하는 것과 어긋남.
**수정**: 두 분기의 `return;` 앞에 `process.exitCode = 1;` 을 추가한다.

### 5. [low] lessons/06-send-testnet/expected-output.txt
**위치**: 1행 실행 명령
**문제**: 첫 줄이 `$ npm run l06` 이지만 실제 재현에는 `.env` 없이 `MNEMONIC="abandon … about" SEND_TX=false COUNTDOWN=0 node lessons/06-send-testnet/script.js` 가 필요함(`.env` 없이 `npm run l06` 만 치면 exit 1 로 끝남 — 실제 확인). 스타일 가이드 '첫 줄에 실행 명령' 의 취지(재현 가능)에 어긋남.
**수정**: 1행을 `$ MNEMONIC="abandon abandon … about" SEND_TX=false COUNTDOWN=0 node lessons/06-send-testnet/script.js   # 데모 니모닉, 2026-09-12 실행 (exit 0)` 으로 바꾼다.

### 6. [low] lessons/06-send-testnet/README.md
**위치**: 💻 코드로 확인하기 > [4]·[6] 코드 인용 (154~160행, 174~180행)
**문제**: 스타일 가이드는 '코드 블록은 실제 스크립트 일부를 인용' 인데 두 블록은 script.js 와 다르게 편집됨: [4] 블록은 GuardError 처리 본문을 주석으로 대체, [6] 블록은 try/catch 와 '아직 장부에 안 적혔어요' 출력을 삭제. 독자가 script.js 와 대조하면 일치하지 않음.
**수정**: script.js 의 해당 줄을 그대로 붙여 넣거나, 블록 위에 '(요약 발췌)' 라고 명시한다.

### 7. [low] lessons/06-send-testnet/README.md
**위치**: 💻 코드로 확인하기 > [3] 해설 143행
**문제**: '`ref_block_bytes`/`ref_block_hash`/`txID` 는 실행할 때마다 달라집니다 … 나머지 줄은 같아야 합니다' 라고 했지만 인용된 블록의 `유효기간` 줄에 포함된 expiration 시각(2026-09-12T07:29:57.000Z)도 실행마다 달라짐(재실행 결과 07:45:48 로 확인). 독자가 '같아야 하는 줄' 로 오해할 수 있음.
**수정**: 'ref_block_bytes/ref_block_hash/txID 와 expiration 시각은 실행할 때마다 달라집니다. 60초·133 bytes·65 bytes 는 같아야 합니다.' 로 고친다.

### 8. [low] lessons/06-send-testnet/script.js
**위치**: print.explain 호출 수 (전체)
**문제**: 스타일 가이드 '각 단계 끝에 print.explain 한 줄(핵심 단계 3~5곳만)' 인데 6곳([1][2][3][4-guard][5][6])에 호출함.
**수정**: [2] 수신자 확인 또는 [5] 브로드캐스트의 explain 하나를 제거해 5곳 이내로 맞춘다.

---

## 07-receipt 검수 지적 11건 (high 1)

### 1. [high] lessons/07-receipt/script.js
**위치**: pickTxId (30~34행) / [2] getTransaction (117~126행) / [3] getTransactionInfo (151~161행)
**문제**: TXID 에 hex 가 아닌 글자가 섞이면(예: TXID=zz, 또는 복사하다 끝에 'ZZ' 가 붙은 64+2글자) Nile 노드는 예외 대신 `{ Error: '... INVALID hex String' }` 객체를 돌려준다. 스크립트는 tx.Error / info.Error / tx.txID 부재를 검사하지 않아 그대로 진행하며 실제 실행 결과: 'ret[0].contractRet: (없음)', 'blockNumber: undefined', 'blockTimeStamp: undefined ms → Invalid Date (KST)', '✅ fee = net_fee + energy_fee = 0 + 0 = 0 sun', '⚠️ 아직 미확정: 영수증 블록 undefined', 마지막에 '✅ 규칙 7 …' 까지 찍고 exit 0 으로 끝난다. F 항목 '에러 시 한국어 안내' 위반이고, README 함정 절의 '스크립트는 먼저 getTransaction으로 존재를 확인한 뒤 영수증을 읽습니다' 와도 어긋난다. (63글자 hex 나 전부 0 인 64hex 는 'Transaction not found' 로 exit 1 정상 처리됨을 확인.)
**수정**: pickTxId 에서 TXID 를 정규화한 뒤 `/^[0-9a-f]{64}$/i` 가 아니면 `throw new Error('TXID 는 64자리 16진수여야 합니다 (받은 값: …). 탐색기에서 다시 복사하세요.')` 를 던지고, 2·3단계에서 `if (tx?.Error || !tx?.txID) throw new Error(\`노드가 거부했습니다: ${tx.Error}\`)`, `if (info?.Error) …` 를 추가한다. README 실험 2 에 '글자가 섞인 번호 → 형식 오류로 종료' 한 줄을 추가하고 expected 는 재생성 불필요.

### 2. [medium] lessons/07-receipt/README.md
**위치**: 전체 분량 비율 (8블록)
**문제**: 273줄 중 💻 코드 145줄(53%), ✋ 손으로 28줄(10%), 🧒 19줄(7%), 🏠 20줄(7%), 🛡️+✅ 24줄(9%). 가이드 비율(15/20/15/30/10/10) 대비 코드가 약 1.8배, 손으로·생활이 절반 수준으로 크게 어긋난다. 집필자도 보고에서 인정.
**수정**: [3/7]·[5/7]·[6/7] 인용 블록을 핵심 줄만 남기고 나머지는 'expected-output.txt 참고'로 돌리고, 두 번째 js 발췌([5/7])는 삭제하거나 3줄로 줄인다. ✋ 블록에 워크시트 1·3·4번 표 요약과 놀이터(탐색기에서 같은 값 찾기) 절차를, 🏠 블록에 탐색기 화면에서 보는 칸 이름 표(블록·시각·수수료·결과·토큰 전송)를 보강해 코드 ≤40%, 손으로 ≥15% 로 맞춘다.

### 3. [medium] lessons/07-receipt/README.md
**위치**: 💻 코드로 확인하기 › 트론 vs EVM 차이 표 (212~219행)
**문제**: EVM 열의 `getTransactionReceipt(hash)` — 처리 전엔 `null`, `gasUsed × gasPrice`(wei), `status` 1/0, '컨펌 수 / finalized 태그' 는 tron-facts.md 에 없는 API·값이며 '(확인 필요)' 표시도 없다(tron-facts 의 BTTC 절은 getBalance/getFeeData/estimateGas/sendTransaction 만 확인).
**수정**: EVM 열 각 셀 끝에 '(확인 필요)' 를 붙이거나, 표 아래에 'EVM 열은 ethers v6 일반 지식이며 이 저장소에서 실행 검증하지 않음(확인 필요)' 각주 한 줄을 추가한다. 또는 레슨 11 스크립트에서 `provider.getTransactionReceipt` 를 실제로 호출한 뒤 tron-facts 에 올리고 인용한다.

### 4. [medium] lessons/07-receipt/README.md
**위치**: 🧒 이야기로 시작 (12~13행)
**문제**: '아저씨가 장부에서 우체국 영수증(receipt)을 찾아 줘요' — 이야기 바이블 6절은 "장부지기가 도와줬어요" 류 묘사를 금지하고(장부지기는 규칙대로만 움직임), 바이블 4절 07 씨앗은 '토리는 봉투 번호(txID)로 우체국 영수증을 찾아봐요' 로 토리가 직접 찾는다. 또 '64글자 봉투 번호' 의 64는 바이블 6절 '이야기에 나오는 숫자는 3초·600장·100만 알·60초·1개뿐' 규칙에 없는 새 숫자다.
**수정**: 12~13행을 '토리가 친구에게 긴 봉투 번호를 받아 와요. / 광장 장부에서 그 번호로 영수증(receipt)을 직접 찾아요.' 로 바꾸고, 아저씨는 규칙만 알려 주는 역할(11·18행)로 남긴다.

### 5. [low] lessons/07-receipt/script.js
**위치**: 268행 print.ok('규칙 7: …')
**문제**: 'txID 로 영수증을 본다' 로 띄어쓰기가 들어가 13규칙 원문 '"보냈다"는 말 대신 txID로 영수증을 본다.' 와 글자가 다르다(97행 제목 줄은 정확). expected-output.txt 마지막 ✅ 줄에도 그대로 남아 있다.
**수정**: 268행을 `print.ok('규칙 7: "보냈다"는 말 대신 txID로 영수증을 본다.')` 로 고치고 expected-output.txt 해당 줄도 함께 수정한다.

### 6. [low] lessons/07-receipt/script.js
**위치**: 머리 주석 6행 / main 시작부 (96~99행)
**문제**: 스타일 가이드 script.js 규약은 읽기 전용 레슨(07 포함)에 'MNEMONIC 없으면 데모 니모닉으로 자동 대체하고 데모 모드 안내를 출력' 을 요구하는데, 이 스크립트는 MNEMONIC 을 전혀 읽지 않고 안내도 없다. 기능상 문제는 없으나 규약과 다르고, 다른 레슨과 출력 형식이 어긋난다.
**수정**: main 시작에 `console.log('니모닉: 이 레슨은 쓰지 않습니다 (읽기 전용 · 데모 모드와 동일)')` 한 줄을 넣거나, 규약대로 `process.env.MNEMONIC ?? DEMO_MNEMONIC` 을 읽어 '데모 모드' 안내를 출력한다. expected-output.txt 재생성 시 README 인용 값도 갱신.

### 7. [low] lessons/07-receipt/README.md
**위치**: ✋ 손으로 해보기 표 42행 '사탕통 0.3개' / activity.md 무장비 5분 버전 '사탕통 0.3개'
**문제**: 비유 사전에서 '사탕통(장부)' 은 TRC-20 컨트랙트를 가리키는 비유이지 USDT 의 단위가 아니다. '사탕통 0.3개' 는 컨트랙트 0.3개로 읽혀 비유가 뒤섞인다.
**수정**: README 42행과 activity.md 무장비 문단·진행 ④ 를 '사탕통 장부의 사탕 0.3개(USDT)' 또는 'USDT 0.3개' 로 바꾼다.

### 8. [low] lessons/07-receipt/README.md
**위치**: 💻 [6/7] 출력 인용 (193~202행)
**문제**: 인용 블록이 event[0] 다음에 event[1] 을 통째로 건너뛰고 event[2] 를 붙였는데 블록 안에는 생략 표시가 없어 '실제 출력 그대로' 처럼 보인다(생략 사실은 204행 산문에만 있음). 같은 이유로 [1/7] js 발췌 108행도 스크립트 60~62행을 한 줄로 합친 의역이다.
**수정**: 블록 안에 `  … (event[1] 은 log[1] 과 같은 Transfer, expected-output.txt 참고)` 한 줄을 넣거나 event[1] 을 그대로 포함한다. [1/7] 발췌는 스크립트 56~62행을 그대로 옮긴다.

### 9. [low] lessons/07-receipt/README.md
**위치**: 🏠 내 생활에서는 (232, 234, 248행)
**문제**: '거래 내역 화면', '탐색기에서 보기' 버튼 등 TronLink UI 묘사가 tron-facts 에 없고 (확인 필요) 표시도 없다. 명세가 요구하는 항목이라 서술 자체는 필요하지만 문구가 단정적이다.
**수정**: 232행 첫 문장 끝에 '(메뉴 이름은 앱·버전마다 다를 수 있음, 확인 필요)' 를 붙이고, 248행은 '탐색기에서 보기 같은 버튼' 처럼 완화한다.

### 10. [low] lessons/07-receipt/script.js
**위치**: [6] 이벤트 API 대조 (254~258행)
**문제**: 단순 TRX 전송(실행 확인: TXID=2ecb194e…547c, 로그 0개)에서도 `✅ 로그 0개 = 이벤트 0개 — 내가 직접 읽은 발자국과 TronGrid 가 ABI 로 풀어 준 결과가 같은 봉투를 가리킵니다` 가 찍혀 발자국이 없는데 '발자국이 같다' 는 어색한 문장이 된다. README 도전(쉬움)이 바로 이 경로를 안내한다.
**수정**: `if (logs.length === 0 && list.length === 0) print.info('이벤트', '없음 — 발자국이 없으니 이벤트도 없는 것이 정상입니다'); else if (list.length === logs.length) …` 로 분기한다.

### 11. [low] lessons/07-receipt/README.md
**위치**: 🧒 이야기로 시작 (14, 16, 19행)
**문제**: '영수증엔 몇 번째 장, 시각, 우표 요금, 그리고 "성공"이 찍혀 있어요.'(약 33자), '누가 누구에게 몇 알을 옮겼는지 발자국에 다 있어요.'(27자), '토리는 이제 "보냈어" 하면 번호부터 달라고 하기로 해요.'(30자) 가 '한 문장 20자 내외' 를 넘는다.
**수정**: 14행을 '영수증엔 몇 번째 장과 시각이 있어요. 우표 요금과 "성공"도 찍혀 있어요.' 처럼 둘로 나누고 16·19행도 20자 안팎으로 자른다(총 문장 수 12개 유지 위해 9~10행을 하나로 합침).

---

## 08-sign-message 검수 지적 7건 (high 0)

### 1. [medium] lessons/08-sign-message/README.md
**위치**: ## ✅ 확인하기 — 💻 개발자 미리보기 (250행)
**문제**: README 의 개발자 미리보기 문제("CHAIN_ID=1029 npm run l08 을 실행하면 [4]의 '같은 domain' 줄과 'chainId 바꿈' 줄의 출력은?")가 quiz.md 에 없다. 스타일 가이드는 확인 블록을 "quiz.md 중 대상별 1문제씩 미리보기"로 규정하고 README 도 "정답은 quiz.md"라고 안내하지만, quiz.md 개발자 3번은 코드 스니펫형 다른 문제라 학습자가 정답(실행 확인: true / 예외 Signature does not match — 스크립트가 wrongDomain 을 3448148188 로 바꿔 검증)을 찾을 수 없다.
**수정**: README 250행을 quiz.md 개발자 3번(try/catch 코드 예측) 문장으로 교체하거나, quiz.md 개발자 문제에 이 CHAIN_ID=1029 문제와 정답("verifyTypedData(같은 domain): true", "verifyTypedData(chainId 바꿈) → 예외: Signature does not match", 이유: 스크립트가 CHAIN_ID 가 3448148188 이 아니면 wrongDomain 의 chainId 를 3448148188 로 둠)을 추가한다.

### 2. [low] lessons/08-sign-message/README.md
**위치**: ## 🧒 이야기로 시작 (8~18행)
**문제**: 동화가 약 20문장으로 스타일 가이드·이야기 바이블의 "8~12문장" 상한을 크게 넘는다(13개 레슨 중 최다). 내용·캐릭터·병기(도장(메시지 서명) 1개)·공포/시세 없음은 모두 적합.
**수정**: 9행(편지 쓰려다 멈춤)과 12행(우표·입장권) 중 하나, 17행(여우 씨 물러감)과 18행(노드 아저씨 대사)을 각각 한 문장으로 합쳐 12문장 안팎으로 줄인다. 핵심 한 문장은 그대로 유지.

### 3. [low] lessons/08-sign-message/README.md
**위치**: ## 🔍 원리 들여다보기 — 실험 2 (69행)
**문제**: 학습자에게 `CHAIN_ID=728126428`(메인넷 chainId)로 Permit 서명을 만들어 보라고 유도한다. 브로드캐스트는 없고 URL 도 아니므로 절대 규칙 위반은 아니지만, .env 에 자기 니모닉을 넣은 학습자가 메인넷 domain 의 Permit 서명을 손에 쥐게 하는 습관은 "메인넷은 코드에 두지 않는다"는 저장소 정신과 어긋난다. 같은 실험을 ✅ 확인 블록은 1029(Donau)로 한다.
**수정**: 실험 2 의 예시를 `CHAIN_ID=1029 npm run l08`(옆 나라 BTTC Donau chainId, tron-facts 에 있음)로 바꾸고, 메인넷 chainId 언급은 삭제한다.

### 4. [low] lessons/08-sign-message/quiz.md
**위치**: ### 💻 개발자 정답 2번 (99행)
**문제**: "한글 7글자는 UTF-8로 19바이트"는 부정확하다. 메시지 "나는 토리예요"는 한글 6글자(각 3바이트=18) + 공백 1바이트 = 19바이트이며 글자 수 7에는 공백이 포함된다. README 73행은 "글자 7개"로 맞게 썼다.
**수정**: "한글 6글자(3바이트씩 18) + 공백 1바이트 = 19바이트"로 고친다.

### 5. [low] lessons/08-sign-message/script.js
**위치**: [2] print.explain dev (85행) / README 124행
**문제**: "ecrecover 는 어떤 (digest, sig) 쌍에도 주소를 돌려준다", "어떤 서명이든 통과합니다"는 과장이다. 실제 확인: `ethers.recoverAddress(hash, '0x00'×65)` 는 예외 `r must be 0 < r < CURVE.n` 을 던진다. 형식이 올바른(유효 범위의 r·s·v) 서명이면 어느 메시지에도 주소가 나온다는 뜻으로 좁혀야 정확하다.
**수정**: script.js 85행을 "형식이 올바른 서명이면 어떤 digest 에도 주소를 돌려준다. 반드시 expected 와 === 비교."로, README 124행을 "형식만 맞는 서명이면 모두 통과합니다"로 고친 뒤 expected-output.txt 를 tools/make-expected-outputs.js 08 로 재생성한다.

### 6. [low] lessons/08-sign-message/script.js
**위치**: [3] print.explain kid (102행)
**문제**: 초등용 해설(LEVEL=kid)에 "둔갑"이라는 어려운 한자어가 병기 없이 나온다.
**수정**: "종이가 편지로 둔갑하지 못해요" → "종이가 편지인 척할 수 없어요"로 바꾼다(expected-output 은 dev 레벨이라 재생성 불필요).

### 7. [low] lessons/08-sign-message/README.md
**위치**: ### 도전 — 어려움 (216행) / 트론 vs EVM 표 검증 반환 (206행)
**문제**: "(확인 필요)"로 남긴 두 항목을 이번 검수에서 실제로 확인했다: `ethers.recoverAddress(evmHash, { r, s, v })` 는 동작하며 0xC8599111…(서명자)를 돌려주고, ethers `verifyTypedData(evmDomain, types, evmValue, typedSig)` 도 같은 0x 주소를 돌려준다. 표기 자체는 규칙대로라 오류는 아니지만 불필요한 미확인 표시가 남아 있다.
**수정**: 216행의 괄호 단서를 "(ethers 6.17 에서 { r, s, v } 객체 형식 동작 확인)"으로, 206행의 "(확인 필요)"를 "(확인됨)"으로 바꾼다. 또는 tron-facts.md 갱신은 검수자 권한 밖이므로 집필자에게 위 실행 결과를 전달한다.

---

## 09-trc20-approve 검수 지적 5건 (high 0)

### 1. [medium] lessons/09-trc20-approve/README.md
**위치**: 전체 분량 비율 (💻 코드 87~247행 / ✋ 손으로 26~41행 / 🧒 이야기 6~25행)
**문제**: 글자 수 기준 비율이 이야기 5% / 손으로 9% / 원리 16% / 코드 51% / 생활 11% / 카드·확인 8% (줄 수 기준 코드 160/285 = 56%)로, 스타일 가이드의 15/20/15/30/10/10 에서 코드가 약 2배, 손으로가 절반 이하로 크게 어긋남. 8블록 제목·앵커·순서·규칙 문장은 정확함.
**수정**: 💻 블록을 줄이고(예: [1/6]·[2/6]·[4/6] 의 js 발췌를 2~3줄로 압축, 출력 인용은 핵심 줄만, '트론 vs EVM' 표를 4행으로) ✋ 블록에 activity.md 의 진행 6단계 요약과 워크시트 1(허락증 카드) 미니 표를 옮겨 넣어 손으로 블록을 3~4배로 늘릴 것. 목표: 코드 ≤ 35%, 손으로 ≥ 15%.

### 2. [medium] lessons/09-trc20-approve/README.md
**위치**: 🧒 이야기로 시작 (8~20행)
**문제**: 13줄이지만 문장 수는 약 20개(7·8·9·10·13행이 각 2~3문장)로 스타일 가이드·이야기 바이블의 '8~12문장' 규정을 초과. 병기(허락증(approve)) 1개, 공포·시세 표현 없음, 캐릭터 설정은 바이블과 일치하므로 길이만 문제.
**수정**: '그때 여우 씨가 다가왔어요.'와 '여우 씨는 슬그머니 물러갔어요.'를 앞뒤 대사에 합치고, 10행을 '토리는 고개를 저었어요. "3알이면 3알이라고 적어요."'로, 13행을 '노드 아저씨가 말했어요. "허락증은 0이라고 다시 써야 끝나."'로 줄여 12문장 이내로 맞출 것.

### 3. [low] lessons/09-trc20-approve/README.md
**위치**: [1/6] 해설 115행, script.js 172행·334행 dev explain
**문제**: '잔고보다 큰 값도 저장은 됩니다(잔고 검사는 transferFrom 때)'와 'approve 는 덮어쓰기'는 tron-facts.md 에 없는 사실이며 '(확인 필요)' 표시도 없음. 검수자가 Nile 에서 triggerConstantContract 로 직접 확인한 결과 둘 다 참(잔고 10배 approve → result true, energy_used 22688; 기존 allowance 5000000 인 쌍에서 approve(5) → result true, energy_used 7688)이므로 내용 오류는 아니나 절대 규칙 1 위반.
**수정**: README 115행 끝에 '(리허설 triggerConstantContract 로 확인)' 또는 '(확인 필요)'를 붙이고, script.js 172·334행 dev 문구도 같은 표시를 넣을 것. 상위 담당자는 tron-facts.md 에 '잔고 초과 approve 리허설 성공(22688 energy), 0 아닌 allowance 위에 approve 덮어쓰기 성공(7688 energy)'을 추가하면 됨.

### 4. [low] lessons/09-trc20-approve/script.js
**위치**: 149행 print.info('니모닉', describeMnemonic(mnemonic))
**문제**: 니모닉 표시를 lib/wallet 의 describeMnemonic 으로 하고 있음. 스타일 가이드 절대 규칙 5는 '개인키·니모닉은 lib/print.js 의 mask/maskMnemonic 으로만 출력'이라고 규정. 노출 정보량(첫·끝 단어)은 maskMnemonic 과 비슷해 실질 위험은 없음.
**수정**: print.info('니모닉', print.maskMnemonic(mnemonic)) 으로 바꾸고, expected-output.txt 8행과 README 의 인용(해당 줄은 README 에 없음)을 재생성한 출력으로 갱신할 것.

### 5. [low] lessons/09-trc20-approve/script.js
**위치**: print.explain 호출 (169·196·235·258·281·298행)
**문제**: 기본(미리보기) 경로에서 print.explain 이 6곳에 나옴. script.js 규약은 '핵심 단계 3~5곳만'.
**수정**: [4] 봉투 만들기(258행) 또는 [2] (196행)의 explain 을 제거해 5곳 이하로 맞추고 expected-output.txt 를 재생성할 것.

---

## 10-simulate 검수 지적 8건 (high 2)

### 1. [high] lessons/10-simulate/README.md
**위치**: 💻 코드로 확인하기 › [4/6] estimateEnergy → feeLimit (179행) 및 quiz.md 개발자 4번 해설(98행)
**문제**: README 179행: "TRX 단위 숫자(2.637)를 그대로 넣으면 사실상 0이라 '에너지 부족'으로 실패합니다"를 사실처럼 단정했고 (확인 필요) 표시가 없다. 검수 실행으로 확인한 결과 tronweb 6.5.0 은 `triggerSmartContract(..., { feeLimit: 2.637 }, ...)` 를 빌드 단계에서 예외 `Invalid feeLimit provided` 로 거부한다(노드에 가지도 않고, '에너지 부족' 실패가 아니다). quiz 98행은 같은 잘못된 메커니즘("사실상 0 sun 상한이라 에너지를 하나도 태울 수 없어 실패")을 정답으로 적고 뒤에만 (확인 필요)를 붙였다. tron-facts.md 에 없는 주장을 두 파일에서 사실처럼 서술.
**수정**: README 179행을 "feeLimit 은 sun 단위 정수입니다. TRX 단위 소수(2.637)를 넣으면 tronweb 이 빌드 단계에서 `Invalid feeLimit provided` 예외를 던집니다(검수 실행에서 확인, 노드까지 가지 않음). 올바른 값은 2637000 입니다." 로 교체. quiz 98행 해설도 동일하게 "tronweb 이 `Invalid feeLimit provided` 예외로 거부한다. 올바른 값 `2637000`(sun)" 으로 고치고 '에너지 부족' 서술 삭제.

### 2. [high] lessons/10-simulate/script.js
**위치**: [5] 점검표 2번 수신자 활성화 (209행) / README 206행·[5/6] / activity.md 워크시트 2 카드 10(60행)·워크시트 3 2번(71행)
**문제**: "미활성화 — TRC-20 은 보낼 수 있지만 에너지가 더 듭니다"(script 209행, activity 60·71행)는 tron-facts.md 에 없는 주장이며 (확인 필요) 표시가 없다. facts 는 에너지 차이(14,650~21,975)를 '수신자 USDT 잔고 유무'로 설명하지 활성화 여부로 설명하지 않는다. 또한 내부 모순: 스크립트는 미활성화 수신자를 ❌로 찍고 "❌ 가 있으면 보내지 않습니다"라고 하는데, activity 카드 10 정답은 같은 상황을 '될까'로 둔다. 학습자가 스크립트와 활동지에서 반대 답을 배운다.
**수정**: script 209행 detail 을 "getAccount(to) = {} (미활성화 — 처음 받는 주소. TRC-20 전송 가능 여부와 추가 에너지는 확인 필요)" 로 바꾸거나, 사실 문서의 표현대로 "수신자 USDT 잔고가 0이면 에너지가 더 들 수 있음(14,650~21,975)"으로 고친다. activity 카드 10 정답을 점검표와 일치시켜 '안 될까(2번 수신자 활성화 ❌ → 먼저 소액 TRX 로 활성화 후 다시 점검)' 로 바꾸거나, 카드 자체를 삭제하고 다른 상황(예: 유효기간 지난 봉투)으로 교체. 워크시트 3 2번 설명의 '(아니어도 사탕통은 보낼 수 있음)' 삭제.

### 3. [medium] lessons/10-simulate/README.md
**위치**: 전체 분량 비율
**문제**: 274줄 중 💻 코드 블록이 150줄(87~236행, 약 55%)로 목표 30%의 거의 두 배. ✋ 손으로 16줄(약 6%, 목표 20%), 🧒 이야기 19줄(약 7%, 목표 15%), 🏠 생활 14줄(5%, 목표 10%). 초등·손으로 블록이 얇고 개발자 블록이 과도하게 두껍다.
**수정**: 코드 블록에서 [3/6]의 fetch 코드(141~146행)와 [5/6]의 Promise.all 코드(183~190행)를 삭제하고 출력 인용만 남겨 약 40줄 줄인다. ✋ 손으로에 activity.md 의 진행 5단계 요약(규칙 설명→카드 판정→왜?→점검표→정리)과 무장비 5개 상황 목록을 옮겨 20줄 안팎 보강. 🏠 생활에 TronLink 화면에서 '예상 수수료/최대 수수료' 칸이 보이는 자리 설명 한 단락 추가.

### 4. [medium] lessons/10-simulate/quiz.md
**위치**: 🧒 초등 5번 (23~24행) 및 해설 85행
**문제**: 문제가 "사탕통(USDT) 100알, 사탕상자(TRX) 0개예요. 리허설 결과는? → ② 입장권이 없어서 안 돼요"라고 하는데, 이 레슨의 핵심 가르침(script 246행, README 206행: "리허설은 컨트랙트 실행만 검증한다. 자원·feeLimit·네트워크는 별도 조회")과 정면으로 모순된다. triggerConstantContract 는 TRX/에너지 잔고를 보지 않으므로 리허설 결과는 '성공'이고, 못 보내는 이유는 점검표(3·5번)에서 잡힌다. 정답 ②가 레슨 논리상 틀린 답이다.
**수정**: 문제를 "리허설 기계는 '성공'이라고 했어요. 그래도 보낼 수 있을까요?" 로 바꾸고 보기 ②를 "안 돼요. 입장권(에너지)도 태울 사탕상자도 없어요 — 점검표에서 잡아요" 로 수정. 해설에 "리허설 기계는 입장권을 안 봐요. 그래서 점검표를 따로 짚어요(발문 3, 점검표 5번)" 한 문장 추가.

### 5. [medium] lessons/10-simulate/README.md
**위치**: 🧒 이야기로 시작 (8~19행)
**문제**: (1) 문장 수가 약 25개("~요." 16개 + 대사 문장)로 바이블 기준 8~12문장을 크게 초과. (2) 18행 "그리고 주소, 사탕통, 사탕상자, 입장권, 나라 이름을 손가락으로 하나씩 짚었어요."는 45자 이상(기준 20자 내외). (3) 바이블 '새 숫자 만들지 않음' 위반: 12행 "사탕 2만 상자"는 사실 문서에 없는 지어낸 수치(11행 14,650은 facts 에 있으므로 허용). (4) 비유 단위 혼용: 사탕=sun, 사탕상자=TRX 인데 '사탕통(USDT) 편지'에 "사탕 1알"·"사탕 2만 상자"를 적어 USDT 수량을 sun/TRX 단위로 표현.
**수정**: 8~19행을 10~12문장으로 압축(예: 8·9행 유지, 10~13행을 '편지를 리허설 기계에 넣었어요. 휘리릭, 성공이에요. 장난으로 사탕통에 있는 것보다 많이 적어 봤어요. 기계가 쿵 멈췄어요. "모자라요."'로 축약, 16·17행 합치기). 18행을 두 문장으로 분리. "사탕 2만 상자"를 "사탕통에 있는 것보다 많이"로, "사탕 1알"을 "사탕통 1알"로 바꿔 숫자와 단위 혼용 제거.

### 6. [low] lessons/10-simulate/README.md
**위치**: 💻 [3/6] (142~146행, 159행) 및 script.js rawSimulate (51~61행)
**문제**: `tronUtils.abi.encodeParams`, `/wallet/triggerconstantcontract` 요청 본문 필드(`owner_address`, `contract_address`, `function_selector`, `parameter`, `visible: true`)는 tron-facts.md 에 없는 API 인데 (확인 필요) 표시가 없다. 검수 실행으로 encodeParams 가 주소를 `41` 없는 20바이트(…b6e708a3…)로 인코딩함과 요청이 동작함(energy_used 1,984)은 확인했으므로 사실은 맞지만, 규칙상 표시 또는 사실 문서 추가가 필요하다.
**수정**: README 159행 끝에 "(tronweb 6.5.0 에서 실행 확인; 요청 본문 필드는 노드 HTTP API 규격, 확인 필요)" 를 붙이거나, 상위 검수자가 tron-facts.md 에 'utils.abi.encodeParams(types, values) → 0x hex, 주소는 20바이트' 와 '/wallet/triggerconstantcontract POST 본문 {owner_address, contract_address, function_selector, parameter, visible}' 항목을 추가.

### 7. [low] lessons/10-simulate/script.js
**위치**: 머리 주석(1~9행) 및 print.explain 호출 수
**문제**: script 규약은 첫 줄 아래 3~6줄 설명인데 8줄(2~9행). print.explain 은 '핵심 단계 3~5곳만'인데 6곳(95, 127, 161, 191, 243, 268행) 모두 호출.
**수정**: 2~9행을 6줄로 압축(3)·4)·5) 항목을 한 줄로 합치고 환경변수 줄 하나로). [6] BTTC 선택 단계(268~273행)의 print.explain 을 삭제해 5곳으로 줄인다.

### 8. [low] lessons/10-simulate/quiz.md
**위치**: 💻 개발자 1번 해설 (95행)
**문제**: "실제 출력: `{"result":true} 14650 0000000000000000…`" 이라고 했으나 문제 코드는 `console.log(sim.result, sim.energy_used, sim.constant_result[0])` 이므로 Node 는 객체를 `{ result: true }` 로, 문자열은 따옴표 붙여 `'0000…'` 로 찍는다. JSON 형식 `{"result":true}` 는 스크립트의 print.json 출력이지 이 코드의 출력이 아니다(출력 예측 문제인데 출력 형식이 다름).
**수정**: 해설을 "실제 출력: `{ result: true } 14650 '0000000000000000000000000000000000000000000000000000000000000000'`" 로 바꾸거나, 문제 코드를 `console.log(print.json(sim.result, 0), sim.energy_used, sim.constant_result[0])` 로 바꿔 스크립트 출력(expected-output.txt 17~19행)과 맞춘다.

---
