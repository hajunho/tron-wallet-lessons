# 검증된 기술 사실 (2026-09-12, 실제 실행으로 확인)

이 문서의 내용만 사실로 사용한다. 여기 없는 API/숫자/URL은 지어내지 말고 "확인 필요"로 표시한다.

## 패키지
- tronweb 6.5.0 (CommonJS: `const { TronWeb, utils: tronUtils } = require('tronweb')`)
- ethers 6.15 (BTTC용), bip39 3.1, bip32 5.0.0-rc.0 + tiny-secp256k1 2.2 (레슨 1~2 설명용), dotenv 17
- Node 22 이상 권장 (검증은 23.11)

## 키와 주소
- `TronWeb.fromMnemonic(mnemonic)` → `{ mnemonic, privateKey('0x'+64hex), publicKey('0x04'+128hex, 비압축), address('T...') }`. 기본 경로는 `m/44'/195'/0'/0/0` (195 = TRON coin_type).
- ethers `HDNodeWallet.fromPhrase(mnemonic, undefined, "m/44'/195'/0'/0/0")`와 개인키가 정확히 일치함.
- `TronWeb.address.fromPrivateKey(pkHexWithout0x)` → T주소. `TronWeb.address.toHex(T주소)` → `41` + 40hex. `TronWeb.address.fromHex(hex)` → T주소. `TronWeb.isAddress(str)` → boolean.
- T주소 = base58check( 0x41 ‖ keccak256(공개키 64바이트)[-20:] ). 즉 `41`을 뺀 20바이트가 EVM `0x` 주소와 같다. 예: 데모 니모닉 → `TUEZSdKsoDHQMeZwihtdoBiN46zxhGWYdH` ↔ `0xC8599111F29c1e1E061265b4AF93eA1F274aD78A`.
- 같은 니모닉이라도 이더리움 경로(`m/44'/60'/...`) 키와는 다르다. 이더리움 경로 키를 트론 주소로 바꾸면 `TPrkFhZ8LH8Mruco8vXyA496TaeFBrbmeU` (0x9858EfFD232B4033E47d90003D41EC34EcaEda94).
- `TronWeb.createRandom()` → 새 지갑 `{ mnemonic, privateKey, publicKey, address }`.
- 데모 니모닉: `abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about` (엔트로피 0x00×16, 공개된 값). 이 주소는 Nile에 테스트 TRX 약 55,000개, 테스트 USDT 약 19,588개가 있어 조회·시뮬레이션 실습이 즉시 가능하다. **이 주소에서 전송하는 코드는 절대 넣지 않는다.**

## 실제 관찰: 공개 니모닉 주소의 "권한 탈취" (안전 레슨 소재)
- 데모 니모닉의 두 번째 주소(index 1, `TSeJkUh4Qv67VNFwY8LaAxERygNdy6NQZK`)는 Nile에서 활성화되어 있고 잔고가 있지만, `getAccount().owner_permission.keys[0].address`가 `41156f4463ce90ac11e1855ff99e4273806ad847cf`로 **계정 주소 자신(41b6e708…)이 아니다**. 즉 누군가 `updateAccountPermissions`로 owner/active 권한 키를 자기 키로 바꿔 두었다. 트론은 계정 권한(owner/active permission, threshold, weight)을 바꿀 수 있어서, 니모닉이 새어 나가면 공격자가 권한을 바꿔 원래 키로는 아무것도 못 하게 만들 수 있다. 이 사실은 "공개된/유출된 니모닉은 이미 남의 것"이라는 안전 레슨의 실제 사례로 쓸 수 있다(주소와 관찰 값 그대로 인용 가능).
- 정상 계정은 `owner_permission.keys[0].address === 계정 hex 주소`이다. 레슨에서 "내 계정 권한 키가 나인지 확인" 코드를 넣을 수 있다.

## Nile 테스트넷
- `new TronWeb({ fullHost: 'https://nile.trongrid.io' })`. API 키 없이 동작(속도 제한 있음). 필요 시 `tronWeb.setPrivateKey(pkHexWithout0x)`.
- chainId(EVM 호환 JSON-RPC 기준): `3448148188` (0xcd8690dc). 메인넷 chainId: 728126428 (0x2b6653dc). TIP-712 domain의 chainId로 사용.
- Faucet: https://nileex.io/join/getJoinPage (트위터 인증 또는 웹 폼). 탐색기: https://nile.tronscan.org (경로 패턴은 아래 "탐색기" 참조).
- 단위: 1 TRX = 1,000,000 sun. `TronWeb.fromSun(sun)` / `TronWeb.toSun(trx)`. BigNumber 또는 문자열 반환 가능 → `.toString()`.

## 조회 API (모두 동작 확인)
- `tronWeb.trx.getCurrentBlock()` → `{ blockID, block_header: { raw_data: { number, timestamp, ... } }, transactions: [...] }`
- `tronWeb.trx.getBlock(number)`
- `tronWeb.trx.getBalance(addr)` → sun(number)
- `tronWeb.trx.getAccount(addr)` → 활성화된 계정이면 `{ address, balance, create_time, owner_permission, active_permission, frozenV2, assetV2, ... }`, **활성화 안 된 계정이면 `{}`** (잔고 0). 이것이 "계정 활성화" 개념의 근거.
- `tronWeb.trx.getAccountResources(addr)` → `{ freeNetLimit: 600, freeNetUsed?, NetLimit, NetUsed?, EnergyLimit, EnergyUsed?, TotalNetLimit, TotalEnergyLimit, tronPowerLimit, ... }` (사용량이 0이면 필드가 생략됨 → `?? 0` 처리)
- `tronWeb.trx.getChainParameters()` → `[{key, value}]`. 확인된 값: `getTransactionFee` 1000 (sun/byte, 대역폭 가격), `getEnergyFee` 100 (sun/energy), `getCreateNewAccountFeeInSystemContract` 1,000,000 (새 계정 활성화 1 TRX), `getCreateAccountFee` 100,000, `getMemoFee` 1,000,000 (메모 1 TRX), `getTotalEnergyLimit` 180,000,000,000.
- `tronWeb.trx.getContract(addr)` → `{ name, abi: { entrys: [...] }, bytecode, origin_address, contract_address, ... }` (체인에서 ABI 읽기)

## 추가 확인된 읽기 API (2차 probe)
- 설치된 ethers는 **6.17.0** (package.json `^6`). bip39 3.1.0의 `bip39.wordlists.korean`(2048단어, 예: 가격, 가끔, 가난…)과 `bip39.wordlists.english` 사용 가능. 엔트로피 0x00×16 → 한국어 니모닉 `가격 가격 … 가격 가능`.
- `tronWeb.trx.getBandwidthPrices()` → 문자열 `"0:10,1606282800000:40,…,1626253800000:1000"` (타임스탬프:가격 이력, 현재 1000 sun/byte). `tronWeb.trx.getEnergyPrices()` → `"0:100,…,1726283400000:210,1754644200000:100"` (에너지 가격 이력: 420 → 210 → 100 sun, 현재 100). 이력 수업 소재로 사용 가능.
- `tronWeb.trx.getConfirmedCurrentBlock()` → 확정(solidified) 블록. 최신 블록보다 약간 뒤. "확정성" 설명에 사용.
- `tronWeb.trx.getTokenFromID(1005416)` → TRC-10 토큰 정보 `{ owner_address, name, abbr, total_supply, precision, ... }` (TRC-10은 컨트랙트 없는 네이티브 토큰; assetV2 잔고와 연결).
- `tronWeb.trx.getDelegatedResourceAccountIndexV2(addr)`, `getCanDelegatedMaxSize(addr, 'ENERGY')` → `{ max_size }`, `getAvailableUnfreezeCount(addr)` → `{ count: 32 }` 동작.
- `TronWeb.address.toChecksumAddress('41…')` → 대소문자 섞인 hex(41C8599111F29c1e…). 트론 지갑 UI에서는 거의 안 씀(T주소가 base58check로 이미 오타 검출).
- **데모 idx0(TUEZ…)도 owner/active 권한 키가 `41156f4463ce90ac11e1855ff99e4273806ad847cf`로 바뀌어 있음** (idx1과 같은 키 = 같은 공격자). 즉 데모 주소는 개인키가 있어도 실제 전송이 불가능(권한 없음). 조회·오프라인 서명·시뮬레이션에는 영향 없음. 안전 레슨의 결정적 사례.

## 3차 probe 확인
- `tronWeb.transactionBuilder.extendExpiration(tx, 600)` → **입력 tx의 raw_data를 제자리 수정**(expiration +600초)하고, 새 txID를 가진 **새 객체**를 반환. 입력 객체의 `txID` 문자열은 갱신되지 않아 raw_data와 불일치하게 됨(그 객체로 sign 하면 `Invalid transaction`). 규칙: 반환값만 사용하고, 원본을 보관하려면 미리 `JSON.parse(JSON.stringify(tx))`로 복사.
- 트랜잭션 크기: 단순 전송 `raw_data_hex`는 133 bytes, 서명 65 bytes. 실제 체인 receipt의 `net_fee 266000` = 266 bytes(protobuf 봉투 포함). 레슨에서는 "raw_data + 서명 + 봉투 ≈ 200~270 bytes, 정확한 값은 receipt의 net_usage/net_fee로 확인"이라고 설명.
- TronGrid v1 REST(Nile, API 키 없이 동작): `GET https://nile.trongrid.io/v1/accounts/{T주소}/transactions?limit=N&only_confirmed=true` → `{ data: [{ txID, ret, net_fee, net_usage, energy_fee, energy_usage_total, blockNumber, block_timestamp, raw_data, raw_data_hex, signature, internal_transactions }], success, meta }`. `…/transactions/trc20?limit=N` → `{ data: [{ transaction_id, token_info: { symbol, address, decimals, name }, block_timestamp, from, to, type: 'Transfer', value }] }`. `GET /v1/contracts/{T주소}/events?limit=N` → 이벤트 목록 `{ event_name, result, transaction_id, block_number, ... }`.
- 메시지 서명 프리픽스: `signMessageV2`는 `keccak256("\x19TRON Signed Message:\n" + 메시지바이트길이 + 메시지)`에 서명. ethers로 재현: `ethers.recoverAddress(ethers.keccak256(concat([toUtf8Bytes(prefix + msg.length), toUtf8Bytes(msg)])), sig)` → 0x주소 → `'41' + hex` → T주소가 서명자와 **일치(MATCH)**. 이더리움 프리픽스(`\x19Ethereum Signed Message:\n`)로 복원하면 **다른 주소**(TYnN1mkBeU44TWy3UZ71kDZ5USpRK4jAV1)가 나온다 → "같은 키, 다른 프리픽스 = 다른 서명" 수업 소재.
- `verifyTypedData`는 불일치 시 false를 돌려주지 않고 **예외 `Signature does not match`** 를 던진다(try/catch 필요). 잘못된 chainId, 다른 서명자 주소 모두 같은 예외.
- **TIP-712 = EIP-712 (MATCH)**: tronweb `signTypedData(domain, types, value)`의 해시는 T주소를 0x주소(41 제거)로 바꾼 뒤 `ethers.TypedDataEncoder.hash(domain, types, value)`로 계산한 값과 같다. `ethers.recoverAddress(hash, sig)` → 0x → T주소가 서명자와 일치.
- `require('tronweb').utils.message` = `{ TRON_MESSAGE_PREFIX, hashMessage, signMessage, verifyMessage }` (프리픽스 상수와 해시 함수 제공). `TronWeb.utils`는 undefined(정적 속성 아님) → 반드시 `const { utils } = require('tronweb')`.

## 4차 확인 (레슨 검수자들이 실제 실행으로 관찰, 2026-09-12) — 인용 가능
- `triggerSmartContract(..., { feeLimit: 2.637 }, ...)` 처럼 **feeLimit에 소수/TRX 단위를 넣으면 tronweb이 빌드 단계에서 예외 `Invalid feeLimit provided`** 를 던진다(노드까지 가지 않음). feeLimit은 sun 단위 정수여야 한다(2.637 TRX → 2637000).
- `tronWeb.contract(abi, addr)` 를 **주소 설정 없이(setAddress/setPrivateKey 없이)** `.call()` 하면 예외 `class java.security.InvalidParameterException : owner_address isn't set.` (노드가 돌려주는 전체 문자열).
- T주소의 **두 번째 글자는 58종이 아니라 25종**(9, A~Z에서 I·O 제외)만 나온다. 페이로드 첫 바이트가 0x41로 고정이라 base58 첫 자리가 제한되기 때문. 무작위 키 2만 개로 확인(2번째 글자가 'U'일 확률 ≈ 0.042 ≠ 1/58). 따라서 "앞 3글자를 맞추는 데 58² ≈ 3364번"은 틀리고, 약 25×58 ≈ 1450번이다.
- 니모닉 마지막 단어를 **단어표의 바로 다음 단어로** 바꾸면 대부분 엔트로피가 그대로이고 체크섬만 어긋나 거의 항상 `validateMnemonic` false다(2만 회 시뮬레이션에서 우연히 true인 비율 ≈ 1/256). "아무 단어로" 바꿨을 때가 약 1/16이다.
- 데모 니모닉 index 1 주소(TSeJkUh4Qv67VNFwY8LaAxERygNdy6NQZK)의 `EnergyLimit`은 39,528로 USDT transfer 소요(21,975)보다 크다. 즉 이 주소로는 "에너지 부족" 분기가 나오지 않는다.
- 무료 대역폭이 트랜잭션 바이트보다 적을 때 **부족분만 부분 과금되는지, 전체가 소각되는지는 확인되지 않았다**. 문서에서는 "부족하면 1000 sun/byte로 소각되며, 정확한 정산은 receipt의 net_usage/net_fee로 확인"이라고만 쓴다.
- receipt에서 **직접 관찰된 값은 `net_fee: 266000`** 이다(= 266 bytes × 1000 sun). 무료 대역폭을 쓴 경우 `net_usage`에 바이트가 적히는지는 확인 필요.
- `frozenV2` 첫 항목에 `type`이 없는 것을 대역폭(BANDWIDTH)으로 해석하는 것은 관례이며 **확인되지 않았다**.
- 에너지 **위임(delegate) 실행**은 검증하지 않았다. 조회 API(`getDelegatedResourceAccountIndexV2`, `getCanDelegatedMaxSize`)만 확인됨.
- `getTransaction`/`getTransactionInfo`에 **hex가 아닌 txid**를 주면 예외가 아니라 `{ Error: '... INVALID hex String' }` 객체가 온다. 스크립트는 `/^[0-9a-f]{64}$/i` 검사와 `result.Error` 검사를 해야 한다.

## 자원 모델 (공식 문서 + 체인 파라미터로 확인)
- Bandwidth(대역폭): 트랜잭션 바이트 수만큼 소모. 계정마다 **하루 600 무료**. 부족하면 1000 sun/byte로 TRX 소각. 단순 TRX 전송 1건 ≈ 266 bytes → 무료 대역폭 없으면 0.266 TRX.
- Energy(에너지): 스마트컨트랙트 실행에 소모. 무료 없음. 부족하면 100 sun/energy로 TRX 소각. USDT transfer ≈ 14,650~21,975 energy (수신자 잔고 유무에 따라 다름) → 약 1.5~2.2 TRX 소각.
- TRX 스테이킹(Stake 2.0, `freezeBalanceV2`)으로 대역폭 또는 에너지 획득. 스테이킹 = 잠금, 언스테이킹 후 14일 대기(확인 필요).
- 스마트컨트랙트 호출 시 `feeLimit`(sun)이 에너지 소각 상한. 예: 30,000,000 sun = 30 TRX.
- **nonce 없음.** 트랜잭션은 `ref_block_bytes`/`ref_block_hash`(최근 블록 참조)와 `expiration`(기본 생성 후 60초)으로 재생·중복을 막는다. 만료된 트랜잭션은 브로드캐스트 실패.

## 트랜잭션 빌드/서명/전송 (동작 확인)
- `tronWeb.transactionBuilder.sendTrx(toT, amountSun, fromT)` → 미서명 tx `{ visible, txID, raw_data: { contract: [{ parameter: { value: { to_address(hex41), owner_address(hex41), amount }, type_url }, type: 'TransferContract' }], ref_block_bytes, ref_block_hash, expiration, timestamp }, raw_data_hex }`
- `txID == sha256(raw_data_hex)` (ethers.sha256으로 확인 가능). 서명 전에 이미 해시가 정해진다.
- 메모: `tronWeb.transactionBuilder.addUpdateData(tx, 'text', 'utf8')` → 새 tx 객체(raw_data.data = hex, txID 바뀜). **서명 전에** 호출해야 함(서명 후 호출하면 "You can not extend the expiration of a signed transaction"). 메모 수수료 1 TRX.
- `tronWeb.trx.sign(tx, pkHexWithout0x)` → `signature: ['130hex']`. **입력 객체를 제자리 수정**하고 같은 객체를 반환.
- `tronWeb.trx.sendRawTransaction(signedTx)` → `{ result: true, txid, transaction }` (브로드캐스트). 실패 시 `{ code, message(hex) }`. 확인 필요: 실제 브로드캐스트는 이번 검증에서 실행하지 않음(미리보기만).
- 스마트컨트랙트 호출 빌드: `tronWeb.transactionBuilder.triggerSmartContract(contractT, 'transfer(address,uint256)', { feeLimit: 30_000_000, callValue: 0 }, [{ type: 'address', value: toT }, { type: 'uint256', value: amount }], fromT)` → `{ result: { result: true }, transaction: { txID, raw_data: { contract: [{ type: 'TriggerSmartContract', parameter: { value: { data: 'a9059cbb...', contract_address, owner_address } } }], fee_limit, ... } } }`
- 고수준: `const c = tronWeb.contract(abi, addr); await c.transfer(to, amount).send({ feeLimit })` (개인키 설정 필요). 확인 필요: 이번 검증은 `.call()`만 실행.

## TRC-20 (USDT on Nile)
- 주소 `TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf`, name "Tether USD", symbol "USDT", decimals 6, 컨트랙트 이름 "TetherToken", ABI 46개 항목.
- ABI는 ERC-20과 동일(JSON ABI 객체 배열 필요; ethers식 문자열 ABI는 tronweb.contract에 못 씀). `c.name().call()`, `c.balanceOf(addr).call()` (BigNumber/bigint → `.toString()`), `c.allowance(owner, spender).call()`.
- 함수 선택자: transfer `a9059cbb`, approve `095ea7b3` (EVM과 동일). ethers `Interface.encodeFunctionData`로 calldata를 만들면 트론 data와 같다(주소 인코딩만 20바이트 EVM 형식).
- Tether 컨트랙트의 transfer는 bool을 반환하지 않음 → constant_result가 32바이트 0. (원조 USDT와 같은 특성)

## 시뮬레이션 (동작 확인)
- `tronWeb.transactionBuilder.triggerConstantContract(contractT, 'transfer(address,uint256)', {}, params, fromT)` → 성공 시 `{ result: { result: true }, energy_used: 14650, constant_result: ['0000...'], transaction, logs }`.
- 잔고 초과 transfer → tronweb이 **예외 `Error: REVERT opcode executed`** 를 던짐. 노드 원본 응답은 `{ result: { result: true, message: 'REVERT opcode executed' }, energy_used: 1984 }`.
- `tronWeb.transactionBuilder.estimateEnergy(contractT, 'transfer(address,uint256)', {}, params, fromT)` → `{ result: { result: true }, energy_required: 21975 }`.
- 예상 소각 TRX = energy × 100 sun (에너지 스테이킹이 없을 때).

## 서명 (동작 확인)
- `tronWeb.trx.signMessageV2('Hello Tron', pk)` → `0x`+130hex. `tronWeb.trx.verifyMessageV2(msg, sig)` → 서명자 T주소.
- `tronWeb.trx.signTypedData(domain, types, value, pk)` → `0x`+130hex (TIP-712, EIP-712와 같은 구조). `tronWeb.trx.verifyTypedData(domain, types, value, sig, T주소)` → true/false. domain 예: `{ name, version: '1', chainId: 3448148188, verifyingContract: 'T주소' }`. types/value는 EIP-712와 동일 형식(주소 값은 T주소 사용 가능).
- `tronWeb.trx.multiSign` 존재(멀티시그, 확인 필요).

## Receipt / 이벤트 (동작 확인)
- `tronWeb.trx.getTransaction(txid)` → `{ ret: [{ contractRet: 'SUCCESS' | 'REVERT' | ... }], raw_data, signature, txID }`.
- `tronWeb.trx.getTransactionInfo(txid)` → 방금 들어간 tx는 `{}`(빈 객체)일 수 있음(솔리디티 전). 몇 블록 뒤: `{ id, fee(sun), blockNumber, blockTimeStamp, contractResult, contract_address?, receipt, log? }`.
  - 단순 TRX 전송 receipt: `{ net_fee: 266000 }` (fee = 266000 sun = 0.266 TRX). 무료 대역폭을 썼다면 `net_usage`가 나오고 net_fee 없음(확인 필요).
  - 스마트컨트랙트 receipt: `{ energy_fee: 509400, origin_energy_usage, energy_usage_total: 5115, net_fee: 539000, result: 'SUCCESS' }`, `fee = energy_fee + net_fee`.
  - `log[i] = { address: '40hex(41 없음)', topics: ['64hex' ...(0x 없음)], data: 'hex' }`. 컨트랙트 T주소 = `TronWeb.address.fromHex('41' + address)`.
  - Transfer 이벤트 토픽 = `TronWeb.sha3('Transfer(address,address,uint256)')` = `0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef` (EVM과 동일). indexed 주소는 topics[1], [2]의 뒤 40hex → `TronWeb.address.fromHex('41' + hex40)`.
- `tronWeb.event.getEventsByTransactionID(txid)` → `{ data: [{ block_number, block_timestamp, contract_address(T), event_name, result: { 0:..., from:..., to:..., value:... }, event_index }], success, meta }` (TronGrid 이벤트 API; ABI 없이 디코딩된 결과).

## BTTC (BitTorrent Chain) — EVM 호환, ethers v6 그대로
- Donau 테스트넷: RPC `https://pre-rpc.bt.io/`, chainId `1029`, 통화 BTT(18 decimals), 탐색기 `https://testnet.bttcscan.com` (`https://testscan.bt.io`에서 리다이렉트; 경로 `/tx/0x...`, `/address/0x...`, Etherscan과 동일 UI), faucet `https://testfaucet.bt.io/#/`. 공식 문서 https://doc.bt.io/docs/networks/network.
- 메인넷: RPC `https://rpc.bittorrentchain.io/`, chainId `199`.
- Legacy gas(EIP-1559 없음: maxFeePerGas null, baseFeePerGas undefined). Donau gasPrice = 9,000,000 gwei(9e15 wei) → 단순 전송 21000 gas ≈ **189 BTT** (테스트넷 수치; BTT는 개당 가격이 매우 낮아 수량이 커 보임). 메인넷 gasPrice ≈ 500,000 gwei → ≈ 10.5 BTT.
- `new ethers.JsonRpcProvider(url, undefined, { staticNetwork: true })`, `provider.getBalance`, `getFeeData().gasPrice`, `estimateGas`, `wallet.sendTransaction({ to, value, gasPrice })`(type 0). EIP-1559 필드를 넣으면 실패할 수 있음(확인 필요).
- 트론 키를 BTTC에서 쓰기: `new ethers.Wallet(tronPrivateKey)` → `wallet.address`가 T주소의 20바이트와 동일. TronLink 지갑도 BTTC 네트워크에서 같은 주소를 쓴다(확인 필요).
- 데모 니모닉의 이더리움 경로 주소(0x9858…)에 Donau BTT 약 166개 있음. 트론 경로 주소(0xC859…)는 0 BTT.

## 탐색기 URL 패턴
- Tronscan Nile (확인됨): `https://nile.tronscan.org/#/transaction/<txid>`, `https://nile.tronscan.org/#/address/<T주소>`. 컨트랙트/토큰 페이지: `/#/contract/<T주소>`, `/#/token20/<T주소>` (일반적 패턴, 확인 필요).
- BTTC Donau (확인됨): `https://testnet.bttcscan.com/tx/<0xhash>`, `/address/<0x주소>`, `/token/<0x주소>`
- Tron 공식 네트워크 문서: https://developers.tron.network/docs/networks (Nile HTTP API: https://nile.trongrid.io 또는 https://api.nileex.io, JSON-RPC: https://nile.trongrid.io/jsonrpc). 테스트넷 토큰 안내: https://developers.tron.network/docs/getting-testnet-tokens-on-tron

## 브로드캐스트 실패 형태 (잔고 0 새 지갑으로 확인, 자산 이동 없음)
- 활성화되지 않은(잔고 0, 한 번도 TRX를 받은 적 없는) 계정에서 전송 브로드캐스트: `sendRawTransaction` → `{ code: 'CONTRACT_VALIDATE_ERROR', message: 'Contract validate error : account [T...] does not exist', txid }` (message는 hex로 오며 `Buffer.from(message, 'hex').toString()`으로 디코딩). 이것이 트론 특유의 "계정 활성화" 에러.
- 다른 키로 서명 시도: `trx.sign` 단계에서 예외 `Private key does not match address in transaction` (노드까지 가지 않음).
- `alterTransaction(tx, { extension: 음수 })` → 예외 `Invalid extension provided` (만료 연장은 양수만).
- `tronWeb.trx.sendTransaction(to, sun, pk)`(고수준) 도 같은 `{ code: 'CONTRACT_VALIDATE_ERROR', message: '... does not exist' }` 반환(예외 아님).
- `contract.transfer(to, 1).send({ feeLimit })` 를 잔고 0 계정에서 → **문자열 예외** `Contract validate error : account [T...] does not exist` (e.message가 아니라 e 자체가 문자열일 수 있음 → `String(e)` 로 출력).
- 토큰 잔고 0 계정에서 `triggerConstantContract` transfer → 예외 `REVERT opcode executed`.
- **`sendTrx(to, amount, from)` 에서 to === from 이면 예외 `Cannot transfer TRX to the same account`** → 기본 수신자를 내 주소로 두면 안 됨. 같은 니모닉의 두 번째 주소(`m/44'/195'/0'/0/1`)를 기본 수신자로 사용한다.
- 잘못된 주소 → 예외 `Invalid recipient address provided`.
- `getTransactionInfo(모르는 id)` → `{}`. `getTransaction(모르는 id)` → 예외 `Transaction not found`.
- `verifyMessageV2(다른 메시지, sig)` → 예외 없이 **다른 주소**를 반환 (서명 검증은 "복원된 주소 == 기대 주소" 비교로 해야 함).
- `TronWeb.toSun(1.5)` → 1500000, `TronWeb.fromSun(266000)` → 0.266 (BigNumber → `String()`으로 출력).

## 안전 수칙 (저장소 전체 규칙)
- 기본은 미리보기. 실제 브로드캐스트는 `SEND_TX=true`를 명시했을 때만.
- `.env`의 `MNEMONIC`은 테스트넷 전용 새 니모닉을 만들어 쓰도록 안내(`npm run new-wallet` 같은 도구 제공).
- 데모 니모닉은 조회/시뮬레이션에만 사용. 전송 코드는 `.env` 니모닉만.
- 메인넷 URL을 코드에 기본값으로 두지 않는다.
