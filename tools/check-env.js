// tools/check-env.js — .env 와 네트워크 연결 상태를 점검한다.
const { loadMnemonic, walletFromMnemonic, describeMnemonic } = require('../lib/wallet');
const { NILE, createTronWeb, sunToTrx, isSendEnabled, explorerAddress } = require('../lib/tron');
const { DONAU, createBttcProvider } = require('../lib/bttc');
const { ethers } = require('ethers');

async function main() {
  let mnemonic;
  try {
    mnemonic = loadMnemonic();
    console.log('✅ MNEMONIC:', describeMnemonic(mnemonic));
  } catch (error) {
    console.log('❌', error.message);
    return;
  }
  const w = walletFromMnemonic(mnemonic, 0);
  console.log('   Tron 주소:', w.address);
  console.log('   BTTC 주소:', w.evmAddress);
  console.log('   SEND_TX:', isSendEnabled() ? 'true (실제 전송 모드!)' : 'false (미리보기 모드)');

  const tronWeb = createTronWeb();
  try {
    const block = await tronWeb.trx.getCurrentBlock();
    const balance = await tronWeb.trx.getBalance(w.address);
    const account = await tronWeb.trx.getAccount(w.address);
    console.log(`✅ ${NILE.name} 연결됨 (블록 ${block.block_header.raw_data.number})`);
    console.log('   TRX 잔고:', sunToTrx(balance), 'TRX', Object.keys(account).length ? '' : '← 계정이 아직 활성화되지 않았습니다. faucet 에서 TRX 를 받으세요: ' + NILE.faucet);
    console.log('   탐색기:', explorerAddress(w.address));
  } catch (error) {
    console.log('❌ Nile 연결 실패:', error.message);
  }

  try {
    const provider = createBttcProvider();
    const [network, balance] = await Promise.all([provider.getNetwork(), provider.getBalance(w.evmAddress)]);
    console.log(`✅ ${DONAU.name} 연결됨 (chainId ${network.chainId})`);
    console.log('   BTT 잔고:', ethers.formatEther(balance), 'BTT', balance === 0n ? '← faucet: ' + DONAU.faucet : '');
  } catch (error) {
    console.log('❌ BTTC 연결 실패:', error.message);
  }
}

main().catch((error) => {
  console.error('check-env 실패:', error.message);
  process.exitCode = 1;
});
