# 치트시트 (개발자용)

돌아가기: [README.md](README.md) · [개발자 경로](docs/paths/developer.md) · 레슨 코드 블록 바로가기 — [01](lessons/01-secret-key/README.md#code) · [02](lessons/02-key-to-address/README.md#code) · [03](lessons/03-read-balance/README.md#code) · [04](lessons/04-bandwidth-energy/README.md#code) · [05](lessons/05-build-and-sign/README.md#code) · [06](lessons/06-send-testnet/README.md#code) · [07](lessons/07-receipt/README.md#code) · [08](lessons/08-sign-message/README.md#code) · [09](lessons/09-trc20-approve/README.md#code) · [10](lessons/10-simulate/README.md#code) · [11](lessons/11-bttc-same-key/README.md#code) · [12](lessons/12-error-detective/README.md#code) · [13](lessons/13-audit-and-graduation/README.md#code)

검증 일자 **2026-09-12** · 검증 환경 **Node 23.11** (`engines.node >= 20`, 22 이상 권장) · **tronweb 6.5.0** · **ethers 6.17.0** · bip39 3.1.0 · bip32 5.0.0-rc.0 + tiny-secp256k1 2.2.4 · dotenv 17

여기 적힌 값·출력 키·에러 문구는 전부 Nile / Donau 테스트넷에서 실제 실행으로 확인한 것입니다. 확인하지 못한 것은 맨 아래 **"(확인 필요)"** 표에 따로 모았습니다. 실제 브로드캐스트는 이 저장소의 검증 과정에서 한 번도 하지 않았습니다(`SEND_TX=false`).

```js
// CommonJS. TronWeb.utils 는 정적 속성이 아니므로 구조분해로 받아야 한다.
const { TronWeb, utils: tronUtils } = require('tronweb');
const { ethers } = require('ethers');
```

---

## 1. 상수

### Tron Nile 테스트넷

| 항목 | 값 |
|---|---|
| fullHost | `https://nile.trongrid.io` (API 키 없이 동작, 속도 제한 있음) · 대안 `https://api.nileex.io` |
| JSON-RPC | `https://nile.trongrid.io/jsonrpc` |
| chainId | **3448148188** (`0xcd8690dc`) — TIP-712 domain에 쓰는 값 |
| 탐색기 | `https://nile.tronscan.org/#/transaction/<txid>` · `/#/address/<T주소>` |
| faucet | `https://nileex.io/join/getJoinPage` |
| USDT (TRC-20) | `TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf` — name "Tether USD", symbol "USDT", **decimals 6**, 컨트랙트 이름 "TetherToken", ABI 46개 항목 |
| 메인넷 chainId | 728126428 (`0x2b6653dc`) — 참고용. 이 저장소는 메인넷 host를 기본값으로 두지 않는다 |

### BTTC Donau 테스트넷

| 항목 | 값 |
|---|---|
| RPC | `https://pre-rpc.bt.io/` |
| chainId | **1029** |
| 통화 | BTT, 18 decimals |
| 탐색기 | `https://testnet.bttcscan.com/tx/<0xhash>` · `/address/<0x주소>` (Etherscan 동일 UI) |
| faucet | `https://testfaucet.bt.io/#/` |
| 가스 | **legacy only** — EIP-1559 없음(`maxFeePerGas` null, `baseFeePerGas` undefined). gasPrice 9,000,000 gwei(9e15 wei) → 21,000 gas 단순 전송 ≈ **189 BTT** |
| 메인넷 | chainId 199, gasPrice ≈ 500,000 gwei → ≈ 10.5 BTT. **URL은 적지 않습니다** — `lib/guard.js`가 `api.trongrid.io`·`rpc.bittorrentchain.io` host 전송을 차단합니다 |
| 공식 문서 | https://doc.bt.io/docs/networks/network |

### 단위와 요금 (`getChainParameters()` 실측)

| 항목 | 값 | 체인 파라미터 키 |
|---|---|---|
| 1 TRX | **1,000,000 sun** | — |
| 대역폭 가격 | **1000 sun / byte** | `getTransactionFee` |
| 무료 대역폭 | **계정당 하루 600 bytes** | `getAccountResources().freeNetLimit` |
| 에너지 가격 | **100 sun / energy** | `getEnergyFee` |
| 계정 활성화 | **1,000,000 sun = 1 TRX** | `getCreateNewAccountFeeInSystemContract` |
| (구) 계정 생성 | 100,000 sun | `getCreateAccountFee` |
| 메모 수수료 | **1,000,000 sun = 1 TRX** | `getMemoFee` |
| 전체 에너지 상한 | 180,000,000,000 | `getTotalEnergyLimit` |
| 가격 이력 | `getBandwidthPrices()` → `"0:10,…,1626253800000:1000"` · `getEnergyPrices()` → `"0:100,…,1726283400000:210,1754644200000:100"` (420 → 210 → 100) | — |

실측 소모량

| 동작 | 값 |
|---|---|
| 단순 TRX 전송 | `raw_data_hex` 133 bytes, 서명 65 bytes, 체인 receipt `net_fee: 266000` = **266 bytes = 0.266 TRX** (protobuf 봉투 포함) |
| USDT `transfer` | 리허설(`triggerConstantContract`) `energy_used` **14,650** / `estimateEnergy` `energy_required` **21,975**(수신자가 USDT 보유) · **37,063**(수신자 USDT 0). 같은 수신자에 대해 두 API가 다른 값을 냄 → `feeLimit`은 큰 쪽으로. 100 sun/energy 기준 약 1.5 ~ 3.7 TRX 소각 |
| `feeLimit` 예 | 30,000,000 sun = 30 TRX (에너지 소각 상한) |

### 파생 경로 · 선택자 · 토픽

| 항목 | 값 |
|---|---|
| 트론 기본 경로 | `m/44'/195'/0'/0/0` (coin_type **195**) |
| EVM 기본 경로 | `m/44'/60'/0'/0/0` (coin_type **60**) |
| T주소 정의 | `base58check(0x41 ‖ keccak256(pubkey64)[-20:])` — `41`을 뺀 20바이트 = EVM `0x` 주소 |
| `transfer(address,uint256)` | selector **`a9059cbb`** (EVM과 동일) |
| `approve(address,uint256)` | selector **`095ea7b3`** (EVM과 동일) |
| `transferFrom(address,address,uint256)` | selector `23b872dd` — keccak256 계산값이며 **이번 검증의 확인 목록 밖(확인 필요)**. `playground/approve-decoder.html` 이 이 선택자를 판별 대상에 넣어 두었습니다 |
| `Transfer` 이벤트 토픽 | `TronWeb.sha3('Transfer(address,address,uint256)')` = **`0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef`** (EVM과 동일) |
| 메시지 서명 프리픽스 | `\x19TRON Signed Message:\n` (`tronUtils.message.TRON_MESSAGE_PREFIX`) |
| 무제한 approve | `2n**256n - 1n` (64자리 `f`) — `lib/guard.js`가 차단 |

### 데모 값 (공개된 값, 그대로 인용 가능)

| 항목 | 값 |
|---|---|
| 데모 니모닉 | `abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about` (엔트로피 `0x00`×16) |
| 한국어 같은 엔트로피 | `가격 가격 … 가격 가능` (`bip39.wordlists.korean`, 2048단어) |
| 트론 경로 idx0 | `TUEZSdKsoDHQMeZwihtdoBiN46zxhGWYdH` ↔ `0xC8599111F29c1e1E061265b4AF93eA1F274aD78A` |
| 트론 경로 idx1 (기본 수신자) | `TSeJkUh4Qv67VNFwY8LaAxERygNdy6NQZK` |
| EVM 경로(60') 키를 트론 주소로 | `TPrkFhZ8LH8Mruco8vXyA496TaeFBrbmeU` ↔ `0x9858EfFD232B4033E47d90003D41EC34EcaEda94` (Donau BTT 약 166) |
| Nile 잔고 (idx0) | 테스트 TRX 약 55,000, 테스트 USDT 약 19,588 → 조회·시뮬레이션 즉시 가능 |
| ⚠️ 권한 | **idx0·idx1 모두** `owner/active_permission.keys[0].address` 가 `41156f4463ce90ac11e1855ff99e4273806ad847cf` 로 바뀌어 있음(같은 공격자). 개인키가 있어도 실제 전송 불가. 조회·오프라인 서명·시뮬레이션에는 영향 없음 |

---

## 2. 검증된 API

출력 키는 실제 응답에서 확인한 것만 적었습니다. "레슨"은 그 API를 실제로 호출하는 레슨 번호입니다.

### 키 · 주소 · 단위 (정적, 오프라인)

| 함수 | 입력 | 출력 / 출력 키 | 레슨 |
|---|---|---|---|
| `TronWeb.fromMnemonic(m)` | 니모닉 | `{ mnemonic, privateKey('0x'+64hex), publicKey('0x04'+128hex, 비압축), address('T…') }`, 경로 `m/44'/195'/0'/0/0` | 01, 02 |
| `TronWeb.createRandom()` | — | 같은 4개 키 | 04, 12 |
| `TronWeb.address.fromPrivateKey(pk)` | **`0x` 없는** 64hex | T주소 | 01, 02, 11 |
| `TronWeb.address.toHex(T)` | T주소 | `41` + 40hex | 02, 03, 07, 08, 09, 11, 13 |
| `TronWeb.address.fromHex(hex)` | `41`+40hex (또는 40hex) | T주소 | 02, 05, 06, 07, 08, 09, 13 |
| `TronWeb.isAddress(s)` | 문자열 | boolean (base58 디코딩 + `sha256(sha256(payload))[:4]` 비교) | 02~06, 09~13 |
| `TronWeb.fromSun(sun)` / `TronWeb.toSun(trx)` | sun / TRX | BigNumber 또는 문자열 → `String()` / `.toString()` 필요. `fromSun(266000)` → `0.266`, `toSun(1.5)` → `1500000` | `lib/tron.js` |
| `TronWeb.sha3(s)` | 문자열 | `0x` + 64hex (keccak256) | 07 |
| `tronUtils.message` | — | `{ TRON_MESSAGE_PREFIX, hashMessage, signMessage, verifyMessage }` | 08 |
| `bip39.entropyToMnemonic` / `mnemonicToSeedSync(m, pass)` / `validateMnemonic` / `wordlists.english·korean` | 엔트로피 / 니모닉 | 니모닉 / 시드 64바이트(PBKDF2-HMAC-SHA512 2048회) / boolean / 2048단어 배열 | 01 |
| `ethers.HDNodeWallet.fromPhrase(m, undefined, path)` | 니모닉 + 경로 | 트론 경로를 주면 `TronWeb.fromMnemonic`과 **개인키가 정확히 일치** | 02, 11 |
| `ethers.SigningKey(pk).publicKey` | `0x`+64hex | `0x04`+128hex | 02 |
| `ethers.keccak256` / `ethers.getAddress` / `ethers.concat` / `ethers.toUtf8Bytes` | — | 표준 | 02, 08, 09, 11 |
| `ethers.Interface(abi).encodeFunctionData(f, args)` | ABI + 인자 | `0x` + calldata. **트론 `data`와 바이트 단위로 같음**(주소는 20바이트 EVM 형식) | 09 |
| `ethers.id(s)` | 문자열 | `0x`+64hex keccak256 (토픽 계산) | 09 |

### 조회 (Nile)

| 함수 | 입력 | 출력 키 | 레슨 |
|---|---|---|---|
| `trx.getCurrentBlock()` | — | `{ blockID, block_header.raw_data.{ number, timestamp }, transactions[] }` | 03, 07 |
| `trx.getConfirmedCurrentBlock()` | — | 같은 형태. 최신 블록보다 약간 뒤(solidified) | 03, 07 |
| `trx.getBlock(n)` | 블록 번호 | 위와 같음 | 07 |
| `trx.getBalance(T)` | T주소 | **sun (number)** | 03, 06, 10, 13 |
| `trx.getAccount(T)` | T주소 | 활성 계정: `{ address, balance, create_time, owner_permission, active_permission, frozenV2, assetV2, … }` / **미활성 계정: `{}`** | 03, 04, 06, 10, 12, 13 |
| `trx.getAccountResources(T)` | T주소 | `{ freeNetLimit: 600, freeNetUsed?, NetLimit, NetUsed?, EnergyLimit, EnergyUsed?, TotalNetLimit, TotalEnergyLimit, tronPowerLimit, … }` — **사용량 0이면 필드가 생략됨 → `?? 0` 처리 필수** | 04, 06, 10, 13 |
| `trx.getChainParameters()` | — | `[{ key, value }]` (키 목록은 위 상수표) | 04, 09, 10 |
| `trx.getContract(T)` | 컨트랙트 T주소 | `{ name, abi: { entrys: [...] }, bytecode, origin_address, contract_address, … }` | 03 |
| `trx.getBandwidthPrices()` / `getEnergyPrices()` | — | `"타임스탬프:가격,…"` 문자열 | 04 |
| `trx.getTokenFromID(1005416)` | TRC-10 id | `{ owner_address, name, abbr, total_supply, precision, … }` | 03 |
| `trx.getAvailableUnfreezeCount(T)` | T주소 | `{ count: 32 }` | 13 |
| `tronWeb.contract(abi, addr)` → `.name().call()` / `.balanceOf(a).call()` / `.allowance(o, s).call()` | **JSON ABI 배열** (ethers식 문자열 ABI는 불가) | BigNumber / bigint → `.toString()` | 03, 09, 10, 12, 13 |
| `tronWeb.setAddress(T)` | T주소 | `.call()`에도 "묻는 사람" 주소가 필요해서 먼저 세팅 | 03, 10, 12, 13 |

TronGrid v1 REST (Nile, API 키 없이 동작)

| 엔드포인트 | 출력 키 | 레슨 |
|---|---|---|
| `GET /v1/accounts/{T}/transactions?limit=N&only_confirmed=true` | `{ data: [{ txID, ret, net_fee, net_usage, energy_fee, energy_usage_total, blockNumber, block_timestamp, raw_data, raw_data_hex, signature, internal_transactions }], success, meta }` | 13 |
| `GET /v1/accounts/{T}/transactions/trc20?limit=N` | `{ data: [{ transaction_id, token_info: { symbol, address, decimals, name }, block_timestamp, from, to, type: 'Transfer', value }] }` | 13 |
| `GET /v1/contracts/{T}/events?limit=N` | `{ event_name, result, transaction_id, block_number, … }` | (미사용) |
| `POST /wallet/triggerconstantcontract` | 노드 원본 응답 확인용 (tronweb이 예외로 감싸기 전의 `result.message`) | 10 |

### 빌드 · 서명 · 전송

| 함수 | 입력 | 출력 키 / 주의 | 레슨 |
|---|---|---|---|
| `transactionBuilder.sendTrx(toT, sun, fromT)` | 받는 T주소, 정수 sun, 보내는 T주소 | 미서명 tx `{ visible, txID, raw_data: { contract: [{ parameter.value.{ to_address(41hex), owner_address(41hex), amount }, type_url }, type: 'TransferContract' }], ref_block_bytes, ref_block_hash, expiration, timestamp }, raw_data_hex }` | 04, 05, 06, 12 |
| `txID` | — | **`sha256(raw_data_hex)`. 서명 전에 이미 확정** | 05 |
| `transactionBuilder.addUpdateData(tx, 'text', 'utf8')` | 미서명 tx | 새 tx (`raw_data.data` = hex, txID 변경). **서명 전에만** 가능. 메모 수수료 1 TRX | 05 |
| `transactionBuilder.extendExpiration(tx, sec)` | tx, 양수 초 | ⚠️ **입력의 `raw_data`를 제자리 수정하고, 새 txID를 가진 새 객체를 반환.** 입력 객체의 `txID` 문자열은 갱신되지 않아 raw_data와 불일치 → 그 객체로 sign 하면 `Invalid transaction`. **반환값만 사용**하고 원본을 보관할 땐 미리 `JSON.parse(JSON.stringify(tx))` | 05, 12 |
| `trx.sign(tx, pk)` | tx, `0x` 없는 pk | `signature: ['130hex']`. ⚠️ **입력 객체를 제자리 수정**하고 같은 객체를 반환 | 05, 06, 09, 12 |
| `trx.sendRawTransaction(signedTx)` | 서명된 tx | 성공 `{ result: true, txid, transaction }` / 실패 `{ code, message(hex) }` — **예외가 아니라 반환값** | 06, 09, 12 |
| `transactionBuilder.triggerSmartContract(cT, 'transfer(address,uint256)', { feeLimit, callValue }, params, fromT)` | params는 `[{ type, value }]` | `{ result: { result: true }, transaction: { txID, raw_data: { contract: [{ type: 'TriggerSmartContract', parameter.value.{ data('a9059cbb…'), contract_address, owner_address } }], fee_limit, … } } }` | 09 |
| `transactionBuilder.triggerConstantContract(cT, func, {}, params, fromT)` | 서명 불필요 | 성공 `{ result: { result: true }, energy_used: 14650, constant_result: ['0000…'], transaction, logs }` | 09, 10, 12 |
| `transactionBuilder.estimateEnergy(cT, func, {}, params, fromT)` | 서명 불필요 | `{ result: { result: true }, energy_required: 21975 }` | 04, 10 |
| `lib/guard.js` `assertCanSend({ mnemonic, host, approveAmount, what })` | — | 브로드캐스트 **직전 필수 호출**. 통과 조건: `SEND_TX=true` · 데모 니모닉 아님 · 메인넷 host 아님 · 무제한 approve 아님 | 06, 09 |

### 서명 (오프라인, 수수료 0)

| 함수 | 입력 | 출력 / 주의 | 레슨 |
|---|---|---|---|
| `trx.signMessageV2(msg, pk)` | 문자열, pk | `0x` + 130hex. 해시 = `keccak256("\x19TRON Signed Message:\n" + 메시지바이트길이 + 메시지)` | 08 |
| `trx.verifyMessageV2(msg, sig)` | 메시지, 서명 | **서명자 T주소**. ⚠️ 메시지가 틀려도 예외 없이 **다른 주소**를 돌려준다 → 검증은 "복원 주소 == 기대 주소" 비교로 | 08 |
| `trx.signTypedData(domain, types, value, pk)` | domain 예 `{ name, version: '1', chainId: 3448148188, verifyingContract: 'T주소' }` | `0x` + 130hex. **TIP-712 = EIP-712**: T주소를 `0x`로 바꾸면 `ethers.TypedDataEncoder.hash`와 값이 같다 | 08 |
| `trx.verifyTypedData(domain, types, value, sig, T)` | — | true. ⚠️ **불일치 시 false가 아니라 예외 `Signature does not match`** (잘못된 chainId, 다른 서명자 모두) → try/catch 필수 | 08 |
| `ethers.recoverAddress(hash, sig)` | 해시, 서명 | `0x` 주소 → `'41' + hex` → T주소가 서명자와 **일치(MATCH)**. 이더리움 프리픽스로 복원하면 다른 주소(`TYnN1mkBeU44TWy3UZ71kDZ5USpRK4jAV1`) | 08 |
| `trx.multiSign` | — | 존재함 **(확인 필요)** | — |

### 영수증 · 이벤트

| 함수 | 입력 | 출력 키 | 레슨 |
|---|---|---|---|
| `trx.getTransaction(txid)` | txID | `{ ret: [{ contractRet: 'SUCCESS' \| 'REVERT' \| … }], raw_data, signature, txID }`. 모르는 id → **예외 `Transaction not found`** | 07, 12 |
| `trx.getTransactionInfo(txid)` | txID | `{ id, fee(sun), blockNumber, blockTimeStamp, contractResult, contract_address?, receipt, log? }`. **처리 전 또는 모르는 id → `{}`** | 06, 07, 09, 12 |
| ↳ 단순 전송 receipt | — | `{ net_fee: 266000 }` (fee = 266000 sun = 0.266 TRX) | 07 |
| ↳ 컨트랙트 receipt | — | `{ energy_fee: 509400, origin_energy_usage, energy_usage_total: 5115, net_fee: 539000, result: 'SUCCESS' }`, `fee = energy_fee + net_fee` | 07 |
| ↳ `log[i]` | — | `{ address: '40hex(41 없음)', topics: ['64hex'…(0x 없음)], data: 'hex' }`. 컨트랙트 T주소 = `TronWeb.address.fromHex('41' + address)`. indexed 주소는 `topics[1]`·`[2]`의 뒤 40hex | 07 |
| `event.getEventsByTransactionID(txid)` | txID | `{ data: [{ block_number, block_timestamp, contract_address(T), event_name, result: { 0:…, from, to, value }, event_index }], success, meta }` — ABI 없이 디코딩됨 | 07 |

### BTTC (ethers v6 그대로)

| 함수 | 입력 | 출력 / 주의 | 레슨 |
|---|---|---|---|
| `new ethers.JsonRpcProvider(url, undefined, { staticNetwork: true })` | Donau RPC | provider | 10, 11, 12 |
| `provider.getBalance(0x)` | 0x주소 | bigint (wei) | 11, 12 |
| `provider.getBlockNumber()` / `getNetwork()` / `getTransactionCount(0x)` | — | number / `{ chainId }` / **nonce** | 10, 11, 12 |
| `provider.getFeeData()` | — | `{ gasPrice, maxFeePerGas: null }` — legacy만 | 10, 11, 12 |
| `provider.estimateGas(tx)` | tx | bigint. 단순 전송 21,000 | 10, 11, 12 |
| `new ethers.Wallet('0x' + pk)` | **`0x` 붙인** pk | `wallet.address` = T주소의 20바이트와 동일 | 11 |
| `ethers.Transaction.from(...)` / `provider.broadcastTransaction(raw)` | — | `TransactionResponse`(`.hash`), 실패는 **예외** | 11 |
| `ethers.parseEther` / `formatEther` / `formatUnits` / `isAddress` | — | 표준 | 10, 11, 12 |

---

## 3. 에러 문구 (원문 그대로)

| 문구 (원문) | 형태 | 어디서 | 원인 | 해결 |
|---|---|---|---|---|
| `Invalid recipient address provided` | 예외 | tronweb, 빌드 | T주소 오타 | 복사·붙여넣기, 앞뒤 4글자 대조 |
| `Cannot transfer TRX to the same account` | 예외 | tronweb, 빌드 | `to === from` | 기본 수신자를 같은 니모닉의 index 1 주소(`m/44'/195'/0'/0/1`)로 |
| `Private key does not match address in transaction` | 예외 | tronweb, 서명 | `owner_address` ≠ 키의 주소 | 선택된 계정이 보내는 주소인지 확인. 노드까지 가지 않는다 |
| `Invalid transaction` | 예외 | tronweb, 서명 | `extendExpiration` 후 **입력 객체**로 서명 (txID ≠ raw_data) | 반환값만 사용 |
| `Invalid extension provided` | 예외 | tronweb | `alterTransaction(tx, { extension: 음수 })` | 만료 연장은 양수만 |
| `You can not extend the expiration of a signed transaction` | 예외 | tronweb | 서명 후 `addUpdateData`/만료 연장 | 서명 전에 호출 |
| `Contract validate error : account [T...] does not exist` | `{ code: 'CONTRACT_VALIDATE_ERROR', message(hex), txid }` **반환값** | 노드, 브로드캐스트 | 미활성화 계정에서 전송 | 그 주소로 TRX를 먼저 받아 활성화. `message`는 `Buffer.from(message,'hex').toString()`로 디코딩 |
| `Contract validate error : account [T...] does not exist` | **문자열 예외** (`e.message`가 아니라 `e` 자체가 문자열일 수 있음 → `String(e)`) | `contract.transfer(...).send({ feeLimit })` | 위와 같음 | 위와 같음 |
| `REVERT opcode executed` | 예외 (노드 원본은 `{ result: { result: true, message: 'REVERT opcode executed' }, energy_used: 1984 }`) | 컨트랙트, 리허설·실행 | 잔고·allowance 등 조건 위반 | 리허설 후 잔고·허락·주소 재확인 |
| `Transaction not found` | 예외 | `getTransaction(모르는 id)` | 없는 txID | `getTransactionInfo`는 같은 상황에서 `{}`를 돌려준다 |
| `Signature does not match` | 예외 | `verifyTypedData` | chainId 불일치 또는 다른 서명자 | try/catch로 감싸고 false로 환산 |
| `insufficient funds` (`INSUFFICIENT_FUNDS`) | ethers `Error { shortMessage, code, info }` | ethers / BTTC 노드 | BTT 잔고 < gas + 금액 | BTT를 먼저 받는다. chainId 1029 확인 |
| `owner_permission.keys[0].address ≠ 계정 hex 주소` | 에러 아님 — **조회 값** | `getAccount()` | 니모닉 유출로 권한이 바뀜 | 그 계정 포기, 새 니모닉. 정상 계정은 `keys[0].address === 계정 hex 주소` |
| `getTransactionInfo → {}` | 빈 객체 | 노드, 조회 | 아직 미처리(솔리디티 전) 또는 없는 txID | 몇 블록 기다렸다 재조회. 계속 없으면 가짜 |
| (만료) `expiration` 경과 | **(확인 필요)** — 정확한 노드 응답 문구 미확인 | 노드, 브로드캐스트 | 60초 유효기간 초과 | 새로 빌드하거나 **서명 전** `extendExpiration` |

에러 처리 규약 (`lib/tron.js`)

```js
// tronweb 은 Error 대신 문자열을 throw 하기도 한다.
function errorMessage(error) {
  if (typeof error === 'string') return error;
  return error?.shortMessage || error?.message || String(error);
}
// 노드가 hex 로 주는 message 디코딩
function decodeNodeMessage(result) {
  return result?.message ? Buffer.from(result.message, 'hex').toString('utf8') : '';
}
```

---

## 4. 트론 vs EVM

| 항목 | 트론 (Nile, tronweb 6.5.0) | EVM (BTTC Donau, ethers 6.17.0) |
|---|---|---|
| 최소 단위 | sun, 10^6 = 1 TRX | wei, 10^18 = 1 BTT |
| 주소 표기 | `41` + 20바이트 → base58check, `T`로 시작 34글자 | `0x` + 20바이트 hex, 42글자 |
| 오타 검출 | base58check 4바이트 체크섬 → `isAddress` false | EIP-55 대소문자 체크섬 (소문자만 쓰면 검출 안 됨 **(확인 필요)**) |
| 파생 경로 | `m/44'/195'/0'/0/0` | `m/44'/60'/0'/0/0` — 같은 니모닉이라도 개인키가 다르다 |
| 개인키 입력 형식 | `0x` **없는** 64hex | `0x` **붙인** 64hex |
| 재사용 방지 | **nonce 없음.** `ref_block_bytes`/`ref_block_hash` + `expiration`(기본 60초) | 계정별 `nonce` |
| 트랜잭션 ID | `sha256(raw_data_hex)` — **서명 전 확정** | 서명 포함 RLP의 keccak256 **(확인 필요)** |
| 수수료 모델 | 대역폭(byte) + 에너지. 스테이킹으로 미리 확보, 부족분은 TRX 소각 | gas × gasPrice, 매번 지불 |
| 무료 몫 | 대역폭 하루 600 bytes/계정 | 없음 |
| 상한 필드 | `feeLimit`(sun) — 에너지 소각 상한. 단순 TRX 전송에는 없음 | `gasLimit` |
| 계정 활성화 | 있음. `getAccount` → `{}`, 전송 시 `does not exist`. 활성화 1 TRX | 없음 **(확인 필요)** |
| 계정 권한 | owner/active permission, threshold, weight를 **체인이 지원하고 바꿀 수 있음**(`updateAccountPermissions`) | EOA는 키 = 계정, 권한 변경 없음 **(확인 필요)** |
| 자기 자신에게 전송 | 빌드 단계에서 예외 | 허용(가스만 소모) **(확인 필요)** |
| 메모 | `raw_data.data`, 수수료 1 TRX | 별도 필드 없음, data에 넣음 **(확인 필요)** |
| 조회 API | `triggerConstantContract` / `estimateEnergy` | `eth_call`(`provider.call`) / `estimateGas` |
| 영수증 | `getTransactionInfo(txid)` — 처리 전 `{}` | `getTransactionReceipt(hash)` — 처리 전 `null` |
| 결과 표기 | `ret[0].contractRet`, `receipt.result` (`SUCCESS`/`REVERT`) | `status` 1/0 |
| 로그 형식 | `address` 40hex(41 없음), `topics` 64hex(0x 없음) | `address`/`topics` 모두 `0x` 붙음 |
| 토큰 표준 | TRC-20 (ABI·선택자가 ERC-20과 **동일**). TRC-10은 컨트랙트 없는 네이티브 토큰 | ERC-20 |
| 구조화 서명 | TIP-712 — 해시 계산이 EIP-712와 **동일** | EIP-712 |
| 메시지 프리픽스 | `\x19TRON Signed Message:\n` | `\x19Ethereum Signed Message:\n` |
| 검증 반환 | `verifyMessageV2` → 주소 / `verifyTypedData` → true 또는 **예외** | `recoverAddress`·`verifyMessage`·`verifyTypedData` → 주소 |
| 확정성 | `getConfirmedCurrentBlock()` (solidified) | 컨펌 수 / `finalized` 태그 **(확인 필요)** |
| 실패 응답 형태 | 예외(문자열일 수도) 또는 `{ code, message(hex) }` **반환값** | `Error { shortMessage, code, info }` |
| 거래 내역 조회 | TronGrid REST `/v1/accounts/{addr}/transactions` | 노드 RPC에 없음. 탐색기·인덱서 API **(확인 필요)** |
| 수수료 모델(EIP-1559) | 해당 없음 | Donau는 **legacy만**. `maxFeePerGas` null |

---

## 5. 실행

```bash
npm run check                 # 환경 점검
npm run new-wallet            # 연습용 니모닉 생성 (.env 에 넣을 값)
npm run l01 … npm run l13     # 레슨 실행 (lesson01 … lesson13 도 동일)
npm run audit                 # = l13
npm test                      # = npm run verify-readonly, 읽기 전용 일괄 실행
npm run expected              # expected-output.txt 재생성
```

- `.env` 없이 데모 니모닉으로 자동 실행: **01, 02, 03, 04, 05, 08, 09, 10, 11, 12, 13**
- `MNEMONIC` 필수: **06** (없으면 안내 후 `exit 1`)
- `TXID` 없으면 최근 블록에서 자동 선택: **07**
- 네트워크 불필요(완전 오프라인): **01, 02, 08**
- 13개 스크립트 전부 `SEND_TX=false`로 `exit 0` 확인 (2026-09-12). 실행 시간: 01 0.3s · 02 0.3s · 03 2.6s · 04 2.3s · 05 0.8s · 06 1.4s · 07 3.5s · 08 0.2s · 09 1.8s · 10 3.5s · 11 3.0s · 12 3.5s · 13 4.0s

주요 환경변수

| 변수 | 쓰는 곳 | 기본 동작 |
|---|---|---|
| `MNEMONIC` | 전 레슨 | 없으면 데모 니모닉 자동 대체 (06 제외) |
| `SEND_TX` | `lib/guard.js` | 기본 `false` = 미리보기. `true`가 아니면 브로드캐스트하지 않음 |
| `TRON_FULL_HOST` / `BTTC_RPC_URL` | `lib/tron.js` / `lib/bttc.js` | Nile / Donau |
| `NILE_USDT_ADDRESS` | `lib/tron.js` | `TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf` |
| `SHOW_SECRETS` | 01, 02 | 기본 마스킹(`lib/print.js`의 `mask`/`maskMnemonic`) |
| `TO` / `AMOUNT_TRX` / `AMOUNT_USDT` / `AMOUNT_BTT` | 05, 06, 09, 11 | `TO` 기본값은 같은 니모닉의 index 1 주소 |
| `TXID` | 07, 12 | 없으면 최근 블록에서 자동 선택 |
| `SPENDER` / `SPENDERS` | 09, 13 | allowance 조회 대상 |
| `DICE` / `PASSPHRASE` / `WORDLIST` | 01 | 주사위 눈, BIP-39 passphrase, 단어표(english/korean) |
| `MESSAGE` / `CHAIN_ID` | 08 | 서명할 메시지, TIP-712 domain chainId |
| `CASE` / `LEVEL` / `EXTEND` / `MEMO` / `ADDRESS` / `SKIP_BTTC` / `COUNTDOWN` | 05, 10, 12, 13 | 실험용 |

---

## 6. "(확인 필요)" 항목

이번 검증에서 **확인하지 못한** 것들입니다. 문서·코드에서 단정하지 말고 이 표를 근거로 "(확인 필요)"를 붙이세요.

| 항목 | 왜 확인하지 못했나 | 확인하려면 |
|---|---|---|
| 실제 브로드캐스트 성공 응답 | `SEND_TX=true`를 한 번도 실행하지 않음 (저장소 규칙) | **이 저장소에서는 확인하지 않습니다.** 확인하려면 저장소를 복사한 본인 실습에서, 본인이 `npm run new-wallet`으로 만든 연습용 니모닉 + Nile faucet TRX로만 |
| `sendRawTransaction` 성공 시 `{ result: true, txid, transaction }` 전체 형태 | 위와 같음 | 위와 같음 |
| 무료 대역폭을 쓴 경우 receipt에 `net_usage`가 나오고 `net_fee`가 없는지 | 실제 전송 안 함 | 무료 대역폭이 남은 계정으로 전송 후 `getTransactionInfo` |
| `contract.transfer(to, amt).send({ feeLimit })` 고수준 전송 | `.call()`만 실행 | 위와 같음 |
| 만료(`expiration` 경과) 브로드캐스트의 정확한 노드 응답 문구 | 만료된 봉투를 실제로 넣지 않음 | 60초 지난 서명 tx를 브로드캐스트 |
| 언스테이킹 대기 기간 14일 | 체인 파라미터로 직접 읽지 않음 | `getChainParameters()`에서 관련 키 확인 또는 공식 문서 |
| `trx.multiSign` 동작 | 호출하지 않음 | 멀티시그 계정 구성 후 시험 |
| BTTC에서 EIP-1559 필드를 넣으면 실패하는지 | 시도하지 않음 | `maxFeePerGas`를 넣은 tx로 시험 |
| TronLink가 BTTC 네트워크에서 같은 주소를 쓰는지 | 지갑 앱을 검증에 쓰지 않음 | 지갑 앱에서 네트워크 전환 후 주소 대조 |
| EVM에서 자기 자신에게 전송 허용 / 새 계정 활성화 없음 / EOA 권한 변경 없음 | 트론 쪽만 실측 | Donau에서 각각 실행 |
| EVM txID = 서명 포함 RLP의 keccak256 | 계산으로 대조하지 않음 | `ethers.Transaction.from(...).hash`와 직접 계산 비교 |
| `getBlock('finalized')` (EVM 확정 블록 태그) | 호출하지 않음 | Donau에서 호출 |
| EIP-55 소문자 주소의 체크섬 미검출 | 시도하지 않음 | `ethers.getAddress(소문자)` 동작 확인 |
| EVM 거래 내역 조회용 탐색기·인덱서 API | 사용하지 않음 | bttcscan API 문서 확인 |
| Tronscan 컨트랙트·토큰 페이지 경로 `/#/contract/<T>`, `/#/token20/<T>` | 일반적 패턴으로 추정 | 브라우저에서 실제 접속 |
| `ethers`의 revert 에러 코드(`CALL_EXCEPTION` 등) | Donau에서 revert를 일으키지 않음 | 실패하는 컨트랙트 호출로 시험 |
| `getDelegatedResourceAccountIndexV2`, `getCanDelegatedMaxSize` 의 실제 위임 시나리오 | 응답 형태만 확인, 위임은 안 함 | `delegateResource` 후 재조회 |
| `soaryong/wallet-practice` 레슨 5·12의 대응 관계와 원본 레슨 제목 | 원본 저장소를 열지 않음 | 원본 저장소 확인 ([CURRICULUM_MAP.md](CURRICULUM_MAP.md) (c) 참조) |
| 무료 대역폭이 부족할 때 **부족분만 과금**되는지, 전체가 소각되는지 | 실제 전송 안 함 | 무료 대역폭이 남은 계정으로 전송 후 receipt의 `net_usage`·`net_fee` 대조 |
| `frozenV2`의 `type` 없는 첫 항목 = BANDWIDTH 해석 | 응답 형태만 확인(관례로 해석) | 대역폭·에너지를 구분해 스테이킹한 계정으로 `frozenV2` 대조 |

---

함께 보기: [GLOSSARY.md](GLOSSARY.md) (용어) · [CURRICULUM_MAP.md](CURRICULUM_MAP.md) (순서와 깊이) · [docs/story-bible.md](docs/story-bible.md) (초등 이야기) · [TROUBLESHOOTING.md](TROUBLESHOOTING.md) (증상 → 원인 → 해결)
