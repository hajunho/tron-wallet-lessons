// lib/wallet.js — 니모닉에서 트론/BTTC 키와 주소를 만드는 공용 함수
require('dotenv').config({ quiet: true });

const { TronWeb } = require('tronweb');
const { ethers } = require('ethers');

// BIP-39 표준 예제 니모닉 (엔트로피 0x00 × 16). 누구나 아는 공개 값이므로 조회/설명에만 쓴다.
const DEMO_MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

const TRON_COIN_TYPE = 195; // SLIP-44: TRON
const ETH_COIN_TYPE = 60;

function tronPath(index = 0) {
  return `m/44'/${TRON_COIN_TYPE}'/0'/0/${index}`;
}

/** 니모닉 + 인덱스로 트론 지갑 정보를 만든다. (TronWeb.fromMnemonic 과 동일한 경로) */
function walletFromMnemonic(mnemonic, index = 0) {
  const path = tronPath(index);
  const node = ethers.HDNodeWallet.fromPhrase(mnemonic.trim(), undefined, path);
  const privateKey = node.privateKey.slice(2); // tronweb은 0x 없는 hex를 받는다
  const address = TronWeb.address.fromPrivateKey(privateKey);
  const hexAddress = TronWeb.address.toHex(address); // '41' + 40hex
  return {
    path,
    privateKey, // 0x 없음
    publicKey: node.publicKey, // 압축 공개키 (0x02/03 + 64hex)
    address, // T...
    hexAddress, // 41...
    evmAddress: node.address, // 0x... (BTTC 등 EVM 체인에서 같은 키로 쓰는 주소)
  };
}

/** .env 의 MNEMONIC 을 읽는다. 없으면 안내 메시지와 함께 종료. */
function loadMnemonic() {
  const mnemonic = process.env.MNEMONIC?.trim();
  if (!mnemonic) {
    throw new Error(
      'MNEMONIC 이 없습니다. `cp .env.example .env` 후 `npm run new-wallet` 로 테스트넷 전용 니모닉을 만들어 넣으세요.',
    );
  }
  const words = mnemonic.split(/\s+/);
  if (![12, 15, 18, 21, 24].includes(words.length)) {
    throw new Error(`니모닉 단어 수가 이상합니다 (${words.length}개). 12 또는 24개여야 합니다.`);
  }
  return mnemonic;
}

/** 니모닉을 화면에 그대로 찍지 않기 위한 표시용 문자열 */
function describeMnemonic(mnemonic) {
  const words = mnemonic.trim().split(/\s+/);
  return `${words.length}단어 (${words[0]} … ${words[words.length - 1]})`;
}

module.exports = {
  DEMO_MNEMONIC,
  TRON_COIN_TYPE,
  ETH_COIN_TYPE,
  tronPath,
  walletFromMnemonic,
  loadMnemonic,
  describeMnemonic,
};
