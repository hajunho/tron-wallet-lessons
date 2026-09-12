# 용어 사전 (GLOSSARY)

이 저장소는 하나의 개념을 **비유 이름**과 **정식 용어** 두 겹으로 씁니다. 초등 이야기에서는 비유만 쓰고, 중고등 "원리 들여다보기"에서 비유를 정식 용어로 바꿔 달고, 개발자 섹션에서는 정식 용어만 씁니다. 이 표는 그 두 겹을 한 자리에 모은 것입니다.

읽는 방법
- **비유 이름**: 이야기 속 표현. 비유 사전은 `docs/story-bible.md` 3장이 원본이고, 이 표는 거기에 레슨 본문의 "비유 → 정식 용어" 표를 합친 것입니다.
- **초등 한 줄**: 4학년이 읽는 한 문장. "~해요"체.
- **정식 정의**: 중고등부터 개발자까지 쓰는 정의. 숫자·API·문구는 실제 실행으로 확인한 값만 적었고, 확인하지 못한 것은 **(확인 필요)** 로 표시했습니다.
- **첫 등장**: 그 용어를 처음 병기하는 레슨. 링크는 해당 레슨 README의 블록 앵커로 갑니다.

규칙 두 가지
1. 새 용어는 레슨당 1개만 `비유 이름(정식 용어)`로 병기합니다. 이미 나온 용어는 다시 병기하지 않습니다.
2. 비유는 어디서 틀리는지 함께 배웁니다. 비유가 깨지는 지점은 `docs/story-bible.md` 3장의 마지막 칸에 한 줄씩 정리되어 있습니다.

총 79개 항목, 가나다순(숫자 먼저).

| 비유 이름 | 초등 한 줄 | 정식 정의 (중고등~개발자) | 영어 | 첫 등장 |
|---|---|---|---|---|
| **12단어 주문** | 열쇠를 다시 깎을 수 있는 단어 12개예요. 나만 알아요. | BIP-39 니모닉(복구 구문). 엔트로피 128비트 + 체크섬 4비트 = 132비트 = 11비트 × 12단어. 시드 → 개인키로 이어지므로 **니모닉 = 지갑 그 자체**. | mnemonic / recovery phrase | [01](lessons/01-secret-key/README.md#why) |
| **3초마다 새 장** | 광장 장부에 3초마다 새 장이 한 장 붙어요. | 블록(약 3초 간격). `getCurrentBlock()`의 `block_header.raw_data.number`/`timestamp`로 확인. | block | [03](lessons/03-read-balance/README.md#why) |
| **광장의 장부** | 마을 모두의 사탕 개수가 적힌 커다란 장부예요. | 블록체인. 장부지기(노드)마다 한 권씩 갖고 서로 맞춰 본다. 잔고의 근거는 앱이 아니라 이것. | blockchain | [03](lessons/03-read-balance/README.md#story) |
| **그냥 종이에 도장** | 편지가 아닌 종이에도 도장을 찍을 수 있어요. 우표는 안 들어요. | 메시지 서명 `tronWeb.trx.signMessageV2(msg, pk)` → `0x`+130hex. 노드에 가지 않는 오프라인 연산이라 대역폭·에너지 0. | message signing | [08](lessons/08-sign-message/README.md#why) |
| **기계 입장권** | 자판기를 움직이려면 필요한 입장권이에요. 공짜가 없어요. | 에너지(Energy). 스마트컨트랙트 실행에 소모. 무료 몫 없음. 부족하면 100 sun/energy로 TRX 소각. `getAccountResources().EnergyLimit`. | Energy | [04](lessons/04-bandwidth-energy/README.md#why) |
| **기계 입장권 요금** | 기계 입장권을 사탕으로 대신 낸 값이에요. | 영수증의 `energy_fee`(sun)와 `energy_usage_total`. `fee = energy_fee + net_fee`. | energy fee | [07](lessons/07-receipt/README.md#why) |
| **나라 이름** | 편지에 어느 나라인지 꼭 써요. 글자까지 똑같이요. | 네트워크 식별자 chainId. Nile 3448148188(0xcd8690dc), BTTC Donau 1029. 틀리면 서명이 다른 나라에서 무효. | network / chain ID | [11](lessons/11-bttc-same-key/README.md#why) |
| **내 사탕 수 칸** | 사탕통 장부에 내 사탕이 몇 알인지 적힌 칸이에요. | `balanceOf(owner)` — TRC-20 컨트랙트의 조회 함수. BigNumber/bigint로 오므로 `.toString()` 후 decimals(USDT는 6)로 나눈다. | balanceOf | [03](lessons/03-read-balance/README.md#code) |
| **내 컴퓨터가 먼저 찍는 도장** | 우체통까지 가기도 전에 내 컴퓨터가 되돌려 준 편지예요. | 클라이언트 측 예외. tronweb/ethers가 노드에 보내기 전에 던진다(`Invalid recipient address provided`, `Cannot transfer TRX to the same account`, `Private key does not match address in transaction`). | client-side exception | [12](lessons/12-error-detective/README.md#why) |
| **다른 마을 길** | 같은 주문인데 길이 다르면 다른 열쇠가 나와요. | BIP-44 파생 경로. 트론 `m/44'/195'/0'/0/0`, EVM `m/44'/60'/0'/0/0`. 같은 니모닉이라도 경로가 다르면 개인키가 다르다. | derivation path | [01](lessons/01-secret-key/README.md#code) |
| **도장** | 봉투마다 다른 무늬로 찍는 나만의 도장이에요. | 서명(signature) 65바이트 = 130hex. `tronWeb.trx.sign(tx, pk)`는 **입력 객체를 제자리 수정**하고 같은 객체를 반환한다. | signature | [05](lessons/05-build-and-sign/README.md#why) |
| **도장 무늬로 주인 찾기** | 도장만 보고 누가 찍었는지 알아내요. | 서명에서 서명자 주소 복원 `verifyMessageV2(msg, sig)` → T주소. **틀려도 예외가 아니라 "다른 주소"를 돌려준다** → 검증은 "복원 주소 == 기대 주소" 비교로 해야 한다. | signature recovery | [08](lessons/08-sign-message/README.md#why) |
| **리허설** | 무대에 오르기 전에 미리 해보는 연습이에요. 공짜예요. | 시뮬레이션 `transactionBuilder.triggerConstantContract(...)` → `{ result, energy_used, constant_result, logs }`. 서명 없이 from 주소만으로 실행. | simulation / eth_call | [10](lessons/10-simulate/README.md#why) |
| **리허설에서 넘어짐** | 리허설에서 "사탕이 모자라요" 하고 멈춰요. | 컨트랙트 되돌림. tronweb은 예외 `REVERT opcode executed`를 던지고, 노드 원본 응답은 `{ result: { result: true, message: 'REVERT opcode executed' }, energy_used }`. | revert | [10](lessons/10-simulate/README.md#why) |
| **맡기기** | 사탕상자를 맡겨 두면 입장권이 매일 생겨요. | 스테이킹(Stake 2.0, `freezeBalanceV2`)으로 대역폭 또는 에너지 획득. `getAccount().frozenV2`, `getAccountResources().NetLimit/EnergyLimit`에 반영. | staking | [04](lessons/04-bandwidth-energy/README.md#why) |
| **맡긴 것 돌려받기** | 맡긴 사탕상자는 바로 못 찾아요. 기다려야 해요. | 언스테이킹(unfreeze). 대기 기간 14일 **(확인 필요)**. `getAvailableUnfreezeCount(addr)` → `{ count }`로 남은 횟수 확인. | unstaking | [04](lessons/04-bandwidth-energy/README.md#why) |
| **메모 쪽지** | 봉투에 쪽지를 한 장 넣으면 값이 더 들어요. | `transactionBuilder.addUpdateData(tx, 'text', 'utf8')` → `raw_data.data`(hex), txID 변경. **서명 전에** 호출. 메모 수수료 1 TRX(`getMemoFee` 1,000,000 sun). | memo | [05](lessons/05-build-and-sign/README.md#code) |
| **몇 알까지 칸** | 허락증에 "몇 알까지"라고 적는 칸이에요. | `allowance(owner, spender)` — 남아 있는 허락 수량. 0이면 허락 없음. 취소도 `approve(spender, 0)` 트랜잭션 1건이 필요하다. | allowance | [09](lessons/09-trc20-approve/README.md#why) |
| **반송 도장** | 되돌아온 편지에 왜 안 됐는지 적혀 있어요. | 에러 메시지. 형태가 셋: 클라이언트 예외(문자열일 수도), 노드 응답 `{ code, message(hex) }`, 컨트랙트 `REVERT`. hex 메시지는 `Buffer.from(message,'hex').toString()`으로 읽는다. | error message | [12](lessons/12-error-detective/README.md#why) |
| **받는 사람 칸** | 봉투에 누구에게 보내는지 쓰는 칸이에요. | `raw_data.contract[0].parameter.value.to_address` — hex 41 형식(`41` + 40hex). `TronWeb.address.fromHex()`로 T주소로 되돌려 읽는다. | to_address | [05](lessons/05-build-and-sign/README.md#why) |
| **발자국** | 자판기를 쓴 편지에만 남는 발자국이에요. | 이벤트 로그. 영수증의 `log[i] = { address(40hex, 41 없음), topics(64hex, 0x 없음), data }`. `event.getEventsByTransactionID(txid)`는 디코딩된 결과를 준다. | event log | [07](lessons/07-receipt/README.md#why) |
| **발자국 모양** | 발자국마다 모양이 정해져 있어요. | 이벤트 토픽(topic0) = 이벤트 시그니처의 keccak256. `TronWeb.sha3('Transfer(address,address,uint256)')` = `0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef` (EVM과 동일). | event topic | [07](lessons/07-receipt/README.md#code) |
| **보물상자** | 열쇠를 넣어 두는 내 상자예요. 사탕은 안 들어 있어요. | 지갑(wallet). 자산을 담는 그릇이 아니라 키를 보관하고 서명을 만드는 도구. 잔고는 체인에 적혀 있다. | wallet | [01](lessons/01-secret-key/README.md#story) |
| **보물상자 열쇠 구멍 주인** | 상자를 열 수 있는 사람이 아직 나인지 확인해요. | 계정 권한(owner/active permission, threshold, weight). `getAccount().owner_permission.keys[0].address`가 계정 hex 주소와 같아야 정상. 트론은 `updateAccountPermissions`로 이 키를 바꿀 수 있다. | account permission | [03](lessons/03-read-balance/README.md#why)(예고) · [13](lessons/13-audit-and-graduation/README.md#why) |
| **보물상자 점검** | 한 달에 한 번 상자를 살펴보는 일이에요. | 지갑 감사(audit). 읽기 전용 조회 모음: 잔고 → 계정 권한 → 자원·스테이킹 → allowance → 최근 거래 → 점검 항목 집계. `npm run audit`. | wallet audit | [13](lessons/13-audit-and-graduation/README.md#code) |
| **봉투** | 누구에게 사탕 몇 알을 보낼지 적는 편지예요. | 트랜잭션. `raw_data`(contract, ref_block_bytes, ref_block_hash, expiration, timestamp) + `raw_data_hex` + `signature[]`. | transaction | [05](lessons/05-build-and-sign/README.md#why) |
| **봉투 번호** | 봉투마다 번호가 있어요. 도장 찍기 전에 벌써 정해져요. | `txID` = `sha256(raw_data_hex)`. 서명 전에 확정되고, 내용이 한 바이트만 달라도 다른 txID가 된다. | transaction ID | [05](lessons/05-build-and-sign/README.md#why) |
| **봉투 자체** | 우체국이 보관한 편지 원본이에요. | `trx.getTransaction(txid)` → `{ ret: [{ contractRet }], raw_data, signature, txID }`. 모르는 id면 예외 `Transaction not found`. | raw transaction | [07](lessons/07-receipt/README.md#why) |
| **봉투 종류 도장** | 봉투가 어떤 종류인지 겉에 찍혀 있어요. | `raw_data.contract[0].type`. TRX 전송은 `TransferContract`, 컨트랙트 호출은 `TriggerSmartContract`. | contract type | [05](lessons/05-build-and-sign/README.md#code) |
| **사탕** | 사탕 100만 알이 사탕상자 한 개예요. | sun — TRX의 최소 단위. 1 TRX = 1,000,000 sun. `TronWeb.fromSun` / `TronWeb.toSun`(BigNumber 반환 → `String()`). | sun | [03](lessons/03-read-balance/README.md#story) |
| **사탕 1알 먼저** | 처음 보내는 곳에는 아주 조금만 먼저 보내요. | 소액 테스트 전송. 주소·네트워크 확인용. 금액이 작아도 수수료(대역폭)는 같으므로 "공짜 확인"은 아니다. | test transfer | [06](lessons/06-send-testnet/README.md#card) |
| **사탕 수 칸** | 봉투에 사탕 몇 알인지 쓰는 칸이에요. | `parameter.value.amount` — 단위는 sun(정수). 1 TRX를 보내려면 `1000000`을 쓴다. | amount | [05](lessons/05-build-and-sign/README.md#why) |
| **사탕상자** | 사탕 100만 알이 담긴 상자 한 개예요. | TRX — 트론의 기본 코인. 수수료(대역폭·에너지 소각)와 계정 활성화에 쓰인다. | TRX | [03](lessons/03-read-balance/README.md#story) |
| **사탕상자 태우기** | 입장권이 없으면 사탕상자를 태워서 대신해요. | TRX 소각(burn). 대역폭 1000 sun/byte(`getTransactionFee`), 에너지 100 sun/energy(`getEnergyFee`). 스테이킹한 자원이 있으면 소각 대신 자원을 쓴다. | fee burn | [04](lessons/04-bandwidth-energy/README.md#why) |
| **사탕통 번호** | 사탕통은 이름이 아니라 번호로 알아봐요. | 컨트랙트 주소. 이름·심볼은 누구나 똑같이 쓸 수 있어 가짜 토큰을 막지 못한다. Nile USDT = `TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf`. | contract address | [03](lessons/03-read-balance/README.md#why) |
| **사탕통 사용 설명서** | 자판기에 어떤 버튼이 있는지 적힌 종이예요. | ABI. `trx.getContract(addr).abi.entrys`로 체인에서 읽는다. `tronWeb.contract()`에는 **JSON ABI 배열**이 필요(ethers식 문자열 ABI 불가). | ABI | [03](lessons/03-read-balance/README.md#code) |
| **사탕통 이름표** | 사탕통에 붙은 이름표예요. 베낄 수 있어요. | 토큰 메타데이터 `name()` / `symbol()` / `decimals()`. Nile USDT는 "Tether USD" / "USDT" / 6. 이름표는 검증 수단이 아니다. | token metadata | [03](lessons/03-read-balance/README.md#why) |
| **사탕통 장부** | 사탕통은 광장 장부와 다른 장부에 적혀요. | TRC-20 컨트랙트. ABI는 ERC-20과 동일. TRX 잔고와 별개로 컨트랙트 내부 장부에 기록된다. | TRC-20 contract | [03](lessons/03-read-balance/README.md#why) |
| **사탕통에 붙는 명령 번호** | 자판기 버튼마다 번호가 붙어 있어요. | 함수 선택자(selector) = 시그니처 keccak256의 앞 4바이트. `transfer(address,uint256)` = `a9059cbb`, `approve(address,uint256)` = `095ea7b3` (EVM과 동일). calldata 맨 앞 8hex. | function selector | [09](lessons/09-trc20-approve/README.md#why) |
| **새 친구 우편함 만들기** | 처음 사탕을 받는 상자는 이름부터 올려야 해요. | 계정 활성화. 한 번도 TRX를 받은 적 없는 계정은 `getAccount` → `{}`이고 전송 시 노드가 `account [T...] does not exist`로 거부한다. 활성화 비용 1 TRX(`getCreateNewAccountFeeInSystemContract` 1,000,000 sun). | account activation | [04](lessons/04-bandwidth-energy/README.md#why) |
| **수도꼭지** | 연습 나라 사탕은 수도꼭지에서 공짜로 받아요. | faucet — 테스트넷 토큰 배포처. Nile: https://nileex.io/join/getJoinPage , BTTC Donau: https://testfaucet.bt.io/#/ . 테스트넷 자산은 실제 가치가 없다. | faucet | [06](lessons/06-send-testnet/README.md#hands) |
| **숨어 있는 옆 나라 번호** | 내 T 번호 안에 옆 나라 번호가 숨어 있어요. | EVM 주소. T주소 = base58check(`0x41` ‖ keccak256(공개키 64바이트)[-20:])이므로 `41`을 뺀 20바이트가 `0x` 주소와 같다. 예: `TUEZSdKsoDHQMeZwihtdoBiN46zxhGWYdH` ↔ `0xC8599111F29c1e1E061265b4AF93eA1F274aD78A`. | EVM address | [02](lessons/02-key-to-address/README.md#why) |
| **숫자 칸이 빈 허락증** | 숫자를 안 쓴 허락증은 통째로 꺼내 가도 된다는 뜻이에요. | 무제한 approve = `2^256 - 1`(64자리 `f`). 이 저장소는 `lib/guard.js`의 `assertCanSend`가 무제한(및 사실상 무제한) approve를 차단한다. | unlimited approval | [09](lessons/09-trc20-approve/README.md#why) |
| **어느 나라 종이인지** | 종이에도 어느 나라 것인지 적어요. | TIP-712 domain의 `chainId`. Nile은 3448148188. chainId가 틀리면 `verifyTypedData`가 예외 `Signature does not match`를 던진다. | domain chainId | [08](lessons/08-sign-message/README.md#why) |
| **연습 나라** | 연습 나라 사탕은 진짜 사탕이 아니에요. | 테스트넷. Tron Nile(`https://nile.trongrid.io`, chainId 3448148188), BTTC Donau(chainId 1029). 규칙은 메인넷과 같고 자산만 가치가 없다. | testnet | [01](lessons/01-secret-key/README.md#story) |
| **열쇠** | 도장을 찍을 수 있는 나만의 열쇠예요. | 개인키 32바이트. `TronWeb.fromMnemonic()`은 `0x`+64hex로 준다. tronweb 함수에 넣을 때는 `0x`를 떼고, ethers에는 `0x`를 붙여 쓴다. 화면에는 `lib/print.js`의 `mask`로만 출력. | private key | [01](lessons/01-secret-key/README.md#why) |
| **열쇠의 공개해도 되는 반쪽** | 열쇠의 반쪽은 남에게 보여 줘도 돼요. | 공개키(secp256k1). 비압축 65바이트 = `0x04` + 128hex. 앞의 `04`를 뗀 64바이트를 keccak256에 넣는다. | public key | [02](lessons/02-key-to-address/README.md#why) |
| **영수증** | 우체국이 주는 종이예요. 조금 뒤에 나와요. | receipt `trx.getTransactionInfo(txid)` → `{ id, fee, blockNumber, blockTimeStamp, contractResult, receipt, log? }`. 처리 전에는 **빈 객체 `{}`** 가 온다(모르는 txID도 `{}`). | receipt | [07](lessons/07-receipt/README.md#why) |
| **옆 나라** | 산 너머에 있는 다른 나라예요. 우편함 모양이 달라요. | BTTC(BitTorrent Chain) — EVM 호환 체인. Donau 테스트넷 RPC `https://pre-rpc.bt.io/`, chainId 1029, 통화 BTT(18 decimals). ethers v6를 그대로 쓴다. | BTTC | [11](lessons/11-bttc-same-key/README.md#story) |
| **옆 나라 리허설** | 옆 나라에도 리허설이 있어요. | `provider.estimateGas(tx)` → 필요한 gas. Donau 단순 전송은 21,000 gas. 잔고가 부족하면 `insufficient funds` 예외 **(확인 필요)**. | estimateGas | [10](lessons/10-simulate/README.md#code) |
| **오타 잡는 마지막 네 글자** | 번호를 한 글자만 잘못 써도 바로 걸려요. | base58check 체크섬 4바이트(sha256 두 번의 앞 4바이트). `TronWeb.isAddress(str)`가 false를 돌려준다. EVM의 EIP-55는 대소문자 체크섬이라 소문자만 쓰면 검출되지 않는다 **(확인 필요)**. | base58check checksum | [02](lessons/02-key-to-address/README.md#why) |
| **우체통 앞에서 멈추기** | 우체통 앞에 한 번 멈춰 서는 관문이 있어요. | `lib/guard.js`의 `assertCanSend({ mnemonic, host, approveAmount })`. 통과 조건: `SEND_TX=true` 명시, 데모 니모닉 아님, 메인넷 host 아님, 무제한 approve 아님. | send guard | [06](lessons/06-send-testnet/README.md#code) |
| **우체통에 넣기** | 우체통에 넣으면 다시 꺼낼 수 없어요. | 브로드캐스트 `trx.sendRawTransaction(signedTx)` → `{ result: true, txid, transaction }`, 실패 시 `{ code, message(hex) }`. 이 저장소는 직전에 `assertCanSend`를 반드시 통과해야 한다. | broadcast | [06](lessons/06-send-testnet/README.md#why) |
| **우편함 번호** | 친구 모두에게 알려 줘도 되는 내 번호예요. | 주소. `T`로 시작하는 34글자 base58check. hex 표기는 `41` + 40hex. `TronWeb.address.toHex` / `fromHex`로 왕복. | address | [02](lessons/02-key-to-address/README.md#why) |
| **우편함 번호 두 모양** | 같은 번호를 두 가지 모양으로 쓸 수 있어요. | 같은 20바이트의 두 표기: T주소(base58check)와 `0x` 주소(hex). 같은 키로 트론과 BTTC 두 체인의 계정을 쓴다. | address encoding | [11](lessons/11-bttc-same-key/README.md#why) |
| **우표 여러 장** | 옆 나라는 우표를 여러 장 붙여야 해요. | gas × gasPrice(legacy). Donau는 EIP-1559 없음(`maxFeePerGas` null). gasPrice 9,000,000 gwei → 21,000 gas 전송이 약 189 BTT(테스트넷 수치). | gas fee | [11](lessons/11-bttc-same-key/README.md#why) |
| **유효기간** | 봉투는 60초가 지나면 우체통이 안 받아요. | `raw_data.expiration` — 기본 `timestamp` + 60초. `transactionBuilder.extendExpiration(tx, 초)`는 입력의 raw_data를 제자리 수정하고 **새 객체를 반환**한다(반환값만 사용). | expiration | [05](lessons/05-build-and-sign/README.md#why) |
| **이건 편지가 아니에요 표시** | 종이 앞에 "이건 편지가 아니다"라고 써 둬요. | 메시지 서명 프리픽스 `\x19TRON Signed Message:\n`. 해시 = `keccak256(prefix + 메시지바이트길이 + 메시지)`. 같은 키라도 이더리움 프리픽스(`\x19Ethereum Signed Message:\n`)로 복원하면 다른 주소가 나온다. | signing prefix | [08](lessons/08-sign-message/README.md#why) |
| **입장권 몇 장 필요한지 세기** | 입장권이 몇 장 필요한지 미리 세어 봐요. | `transactionBuilder.estimateEnergy(contract, func, {}, params, from)` → `{ result, energy_required }`. 예상 소각 TRX = energy × 100 sun(에너지 스테이킹이 없을 때). | energy estimation | [04](lessons/04-bandwidth-energy/README.md#code) |
| **입장권 상한** | 입장권을 최대 몇 장까지 쓸지 미리 정해요. | `feeLimit`(sun) — 컨트랙트 호출 시 에너지 소각 상한. 예: 30,000,000 sun = 30 TRX. `raw_data.fee_limit`에 들어간다. | feeLimit | [09](lessons/09-trc20-approve/README.md#why) |
| **자판기** | 버튼을 누르면 정해진 대로 움직이는 기계예요. | 스마트컨트랙트. 한 번 배포되면 대부분 고칠 수 없다. 호출에는 에너지가 필요하고, 조회(`.call()`)에는 들지 않는다. | smart contract | [04](lessons/04-bandwidth-energy/README.md#why) |
| **장부에 이름이 없는 새 상자** | 장부에 아직 이름이 없는 새 상자예요. | 미활성화 계정. `getAccount` → `{}`. 전송 브로드캐스트 시 `Contract validate error : account [T...] does not exist`. TRX를 먼저 받으면 활성화된다. | inactive account | [12](lessons/12-error-detective/README.md#why) |
| **장부지기** | 장부를 적는 사람이 아주 많아요. | 노드. 부탁이 통하지 않고 규칙대로만 움직인다. 이 저장소가 묻는 상대는 `https://nile.trongrid.io`. | node | [03](lessons/03-read-balance/README.md#story) |
| **장부지기가 찍는 도장** | 우체국까지 갔다가 되돌아온 편지예요. | 노드·컨트랙트가 돌려준 실패 응답. `{ code: 'CONTRACT_VALIDATE_ERROR', message(hex) }` 또는 컨트랙트 `REVERT opcode executed`. 여기까지 갔다면 검증은 노드가 한 것. | node rejection | [12](lessons/12-error-detective/README.md#why) |
| **종이 입장권** | 매일 600장 공짜로 받는 입장권이에요. | 대역폭(Bandwidth). 트랜잭션 바이트 수만큼 소모, 계정마다 하루 600 무료(`freeNetLimit: 600`). 부족하면 1000 sun/byte로 TRX 소각. | Bandwidth | [04](lessons/04-bandwidth-energy/README.md#why) |
| **종이 입장권 요금** | 종이 입장권을 사탕으로 대신 낸 값이에요. | 영수증의 `net_usage`(무료·스테이킹으로 쓴 바이트)와 `net_fee`(TRX로 태운 값, sun). 단순 TRX 전송 실측 `net_fee: 266000` = 266 bytes = 0.266 TRX. | bandwidth fee | [07](lessons/07-receipt/README.md#why) |
| **주문 외우기** | 단어 12개를 오래오래 섞어 외워요. | 시드(seed) 64바이트. `bip39.mnemonicToSeedSync(mnemonic, passphrase)` = PBKDF2-HMAC-SHA512 2048회. 시드에서 경로를 따라 개인키가 나온다. | seed | [01](lessons/01-secret-key/README.md#why) |
| **주문 자물쇠 하나 더** | 주문에 자물쇠를 하나 더 걸 수 있어요. | BIP-39 passphrase(13번째 단어). 같은 12단어라도 passphrase가 다르면 완전히 다른 지갑이 된다. 잊으면 복구 불가. | passphrase | [01](lessons/01-secret-key/README.md#code) |
| **주사위 굴리기** | 아무도 못 맞히게 주사위를 여러 번 굴려요. | 엔트로피 128비트. `crypto.randomBytes(16)` 또는 주사위 눈 50개 이상. 가짓수 2^128 = 39자리 수. 무작위가 약하면 지갑 전체가 약해진다. | entropy | [01](lessons/01-secret-key/README.md#why) |
| **진짜 나라** | 진짜 나라 사탕은 진짜예요. 토리는 가지 않아요. | 메인넷. Tron chainId 728126428, BTTC chainId 199. 이 저장소는 메인넷 host를 기본값으로 두지 않고, `assertCanSend`가 메인넷 전송을 차단한다. | mainnet | [01](lessons/01-secret-key/README.md#story) |
| **최근 장부 참조** | 봉투에 요즘 장부 몇 장짜리인지 적어요. | `ref_block_bytes` / `ref_block_hash` — 최근 블록 참조. 트론은 **nonce가 없고** 이 참조 + `expiration`으로 재생·중복을 막는다. | block reference | [05](lessons/05-build-and-sign/README.md#why) |
| **최근 편지** | 최근에 오간 편지를 쭉 보고 넘겨요. | TronGrid REST: `GET /v1/accounts/{T주소}/transactions?limit=N&only_confirmed=true`, `.../transactions/trc20?limit=N`. 노드 RPC에는 없는 조회라 인덱서 API를 쓴다. | transaction history | [13](lessons/13-audit-and-graduation/README.md#code) |
| **칸이 나뉜 종이** | 칸마다 무엇인지 적혀 있어 읽을 수 있는 종이예요. | TIP-712 구조화 서명 `trx.signTypedData(domain, types, value, pk)`. 해시 계산이 EIP-712와 **동일**(T주소를 0x로 바꾸면 `ethers.TypedDataEncoder.hash`와 일치). 검증 실패 시 `verifyTypedData`는 예외를 던진다. | TIP-712 / EIP-712 | [08](lessons/08-sign-message/README.md#why) |
| **컨트랙트 없는 옛날 사탕통** | 자판기 없이 장부에 바로 적힌 옛날 사탕통도 있어요. | TRC-10 — 컨트랙트 없는 네이티브 토큰. `trx.getTokenFromID(1005416)` → `{ name, abbr, total_supply, precision, ... }`. 계정의 `assetV2` 잔고와 연결된다. | TRC-10 | [03](lessons/03-read-balance/README.md#code) |
| **특별한 기계** | 넣으면 값이 나오는데, 거꾸로는 못 돌리는 기계예요. | 해시 함수 keccak256. 주소 계산은 `keccak256(공개키 64바이트)`의 뒤 20바이트. 되돌릴 방법이 없어서 주소에서 열쇠를 구할 수 없다. | hash (keccak256) | [02](lessons/02-key-to-address/README.md#why) |
| **한국어 단어표** | 12단어는 정해진 단어표에서만 골라요. | BIP-39 wordlist 2048단어. `bip39.wordlists.english` / `bip39.wordlists.korean`. 같은 엔트로피 0x00×16은 영어 `abandon … about`, 한국어 `가격 … 가능`. 단어표가 다르면 단어가 달라도 시드는 같다. | wordlist | [01](lessons/01-secret-key/README.md#code) |
| **허락증** | "몇 알까지 꺼내 가도 돼요"라고 써 주는 종이예요. | `approve(spender, amount)` 트랜잭션. calldata 선택자 `095ea7b3`. 컨트랙트 장부에 allowance로 남고, 다 쓴 뒤에도 0으로 고치지 않으면 남아 있다. | approve | [09](lessons/09-trc20-approve/README.md#why) |
| **허락증 0으로 고치기** | 다 썼으면 허락증을 0으로 고쳐요. | `approve(spender, 0)`. 취소도 트랜잭션 1건(대역폭·에너지 소모). 점검할 때 남은 allowance를 확인해 0으로 만든다. | revoke approval | [09](lessons/09-trc20-approve/README.md#why) |
| **확정된 장** | 새 장이 붙어도 조금 뒤에야 확정돼요. | solidified 블록. `trx.getConfirmedCurrentBlock()`은 최신 블록보다 약간 뒤의 확정 블록을 준다. 영수증은 확정 전에는 `{}`일 수 있다. | solidified block | [03](lessons/03-read-balance/README.md#why) |

---

## 이 표에 없는 것

- **시세·가치·수익**: 이 저장소는 어떤 자산의 값도 다루지 않습니다. 사탕은 세는 것이지 값을 매기는 것이 아닙니다.
- **지갑 앱·거래소·에너지 대여 서비스 이름**: 앱 이름은 각 레슨의 [🏠 내 생활에서는] 블록에만 나옵니다.
- **메인넷 실행 방법**: `lib/guard.js`가 메인넷 host 전송을 차단합니다. 이 저장소는 연습 나라(테스트넷)에서만 움직입니다.

## 함께 보기

- [docs/story-bible.md](docs/story-bible.md) — 인물·말투·비유의 한계·예고와 회수
- [CURRICULUM_MAP.md](CURRICULUM_MAP.md) — 개념 8개 × 레슨 13개 × 대상 4개 매트릭스, 학습 흐름, 선수 지식
- [CHEATSHEET.md](CHEATSHEET.md) — 개발자용 API·상수·에러 문구 요약

검증 기준일: 2026-09-12 (Node 23.11, tronweb 6.5.0, ethers 6.17.0)
