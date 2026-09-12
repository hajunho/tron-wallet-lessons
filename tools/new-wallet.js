// tools/new-wallet.js — 테스트넷 전용 새 지갑(니모닉)을 만든다. 실제 자산에는 절대 쓰지 말 것.
const { TronWeb } = require('tronweb');
const { walletFromMnemonic } = require('../lib/wallet');
const { NILE } = require('../lib/tron');
const { DONAU } = require('../lib/bttc');

const { mnemonic } = TronWeb.createRandom();
const w0 = walletFromMnemonic(mnemonic.phrase, 0);
const w1 = walletFromMnemonic(mnemonic.phrase, 1);

console.log('새 테스트넷 지갑을 만들었습니다. 아래 니모닉을 .env 의 MNEMONIC= 뒤에 붙여 넣으세요.\n');
console.log('MNEMONIC=' + mnemonic.phrase);
console.log('\n첫 번째 주소 (index 0, 보내는 쪽):', w0.address);
console.log('두 번째 주소 (index 1, 받는 쪽 연습용):', w1.address);
console.log('BTTC/EVM 주소 (같은 키):', w0.evmAddress);
console.log('\n테스트 TRX 받기 (Nile faucet):', NILE.faucet);
console.log('테스트 BTT 받기 (Donau faucet):', DONAU.faucet);
console.log('\n⚠️  이 니모닉은 연습용입니다. 진짜 돈이 있는 지갑의 니모닉을 .env 에 넣지 마세요.');
