// lib/tron.js — Tron Nile 테스트넷 공용 설정과 도우미
require('dotenv').config({ quiet: true });

const { TronWeb } = require('tronweb');

const NILE = {
  name: 'Nile 테스트넷',
  fullHost: process.env.TRON_FULL_HOST || 'https://nile.trongrid.io',
  chainId: 3448148188, // 0xcd8690dc (TIP-712 domain 용)
  explorer: 'https://nile.tronscan.org',
  faucet: 'https://nileex.io/join/getJoinPage',
  usdt: process.env.NILE_USDT_ADDRESS || 'TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf',
};

const SUN_PER_TRX = 1_000_000;

/** TronWeb 인스턴스. privateKey(0x 없는 hex)를 주면 서명/전송 가능. */
function createTronWeb(privateKey) {
  const tronWeb = new TronWeb({ fullHost: NILE.fullHost });
  if (privateKey) tronWeb.setPrivateKey(privateKey);
  return tronWeb;
}

/** 실제 브로드캐스트는 SEND_TX=true 를 명시했을 때만 */
function isSendEnabled() {
  return process.env.SEND_TX === 'true';
}

function sunToTrx(sun) {
  return String(TronWeb.fromSun(String(sun)));
}

function trxToSun(trx) {
  return Number(TronWeb.toSun(String(trx)));
}

function explorerTx(txid) {
  return `${NILE.explorer}/#/transaction/${txid}`;
}

function explorerAddress(address) {
  return `${NILE.explorer}/#/address/${address}`;
}

/** 노드가 hex 로 돌려주는 message 를 사람이 읽게 바꾼다 */
function decodeNodeMessage(result) {
  if (!result || !result.message) return '';
  try {
    return Buffer.from(result.message, 'hex').toString('utf8');
  } catch {
    return String(result.message);
  }
}

/** 예외가 문자열/객체 어느 쪽으로 오든 메시지만 뽑는다 (tronweb 은 문자열을 throw 하기도 한다) */
function errorMessage(error) {
  if (typeof error === 'string') return error;
  return error?.shortMessage || error?.message || String(error);
}

// TRC-20 최소 ABI (tronweb.contract 은 JSON ABI 객체 배열이 필요하다)
const TRC20_ABI = [
  { name: 'name', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'transfer', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'value', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'transferFrom', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'value', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'Transfer', type: 'event', anonymous: false, inputs: [{ indexed: true, name: 'from', type: 'address' }, { indexed: true, name: 'to', type: 'address' }, { indexed: false, name: 'value', type: 'uint256' }] },
  { name: 'Approval', type: 'event', anonymous: false, inputs: [{ indexed: true, name: 'owner', type: 'address' }, { indexed: true, name: 'spender', type: 'address' }, { indexed: false, name: 'value', type: 'uint256' }] },
];

/** 토큰 최소 단위 → 사람이 읽는 수 (decimals 적용) */
function formatUnits(raw, decimals) {
  const s = BigInt(raw).toString().padStart(Number(decimals) + 1, '0');
  const int = s.slice(0, s.length - Number(decimals));
  const frac = s.slice(s.length - Number(decimals)).replace(/0+$/, '');
  return frac ? `${int}.${frac}` : int;
}

/** 사람이 읽는 수 → 토큰 최소 단위 (BigInt) */
function parseUnits(value, decimals) {
  const [int, frac = ''] = String(value).split('.');
  const d = Number(decimals);
  if (frac.length > d) throw new Error(`소수점 자리가 너무 깁니다 (최대 ${d}자리)`);
  return BigInt(int + frac.padEnd(d, '0'));
}

/** 로그 topics 의 주소(뒤 40 hex) → T 주소 */
function topicToAddress(topic) {
  const hex = topic.replace(/^0x/, '');
  return TronWeb.address.fromHex('41' + hex.slice(-40));
}

/** 로그 address(41 없는 40hex) → T 주소 */
function logAddressToBase58(address) {
  const hex = address.replace(/^0x/, '');
  return TronWeb.address.fromHex(hex.length === 40 ? '41' + hex : hex);
}

function section(title) {
  console.log(`\n=== ${title} ===`);
}

module.exports = {
  NILE,
  SUN_PER_TRX,
  TRC20_ABI,
  createTronWeb,
  isSendEnabled,
  sunToTrx,
  trxToSun,
  explorerTx,
  explorerAddress,
  decodeNodeMessage,
  errorMessage,
  formatUnits,
  parseUnits,
  topicToAddress,
  logAddressToBase58,
  section,
};
