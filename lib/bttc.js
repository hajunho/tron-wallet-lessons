// lib/bttc.js — BTTC(BitTorrent Chain) Donau 테스트넷 공용 설정 (EVM 호환, ethers v6 사용)
require('dotenv').config({ quiet: true });

const { ethers } = require('ethers');

const DONAU = {
  name: 'BTTC Donau 테스트넷',
  rpcUrl: process.env.BTTC_RPC_URL || 'https://pre-rpc.bt.io/',
  chainId: 1029,
  symbol: 'BTT',
  explorer: 'https://testnet.bttcscan.com',
  faucet: 'https://testfaucet.bt.io/#/',
};

const BTTC_MAINNET = {
  name: 'BTTC 메인넷',
  rpcUrl: 'https://rpc.bittorrentchain.io/',
  chainId: 199,
  symbol: 'BTT',
  explorer: 'https://bttcscan.com',
};

function createBttcProvider() {
  return new ethers.JsonRpcProvider(DONAU.rpcUrl, undefined, { staticNetwork: true });
}

function explorerTx(hash) {
  return `${DONAU.explorer}/tx/${hash}`;
}

function explorerAddress(address) {
  return `${DONAU.explorer}/address/${address}`;
}

module.exports = { DONAU, BTTC_MAINNET, createBttcProvider, explorerTx, explorerAddress };
