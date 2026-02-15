// PulseChainCloak Browser - Token Payment Manager
// ERC-20 token payments for mesh network bandwidth services

import { ipcMain } from 'electron';

const { ethers } = require('ethers');
const Store = require('electron-store');
const log = require('electron-log');

// PulseChain configuration
const PULSECHAIN_RPC = 'https://rpc.pulsechain.com';
const PULSECHAIN_CHAIN_ID = 369;
const PULSECHAIN_NAME = 'PulseChain';
const PULSECHAIN_EXPLORER = 'https://otter.pulsechain.com';

// Default placeholder token address (update when real PulseChainCloak token is deployed)
const DEFAULT_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';

// Standard ERC-20 ABI
const ERC20_ABI = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address owner) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function transferFrom(address from, address to, uint256 amount) returns (bool)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

// Store keys
const STORE_KEY_TOKEN_ADDRESS = 'token.contractAddress';
const STORE_KEY_PAYMENT_RATE = 'token.paymentRate'; // tokens per MB
const STORE_KEY_PAYMENT_HISTORY = 'token.paymentHistory';
const STORE_KEY_AUTOPAY_ENABLED = 'token.autoPayEnabled';
const STORE_KEY_AUTOPAY_ALLOWANCE = 'token.autoPayAllowance';

let store;
let provider;
let tokenAddress;
let paymentRate; // tokens per MB of bandwidth
let autoPayEnabled = false;
let autoPayInterval = null;

function getStore() {
    if (!store) {
        store = new Store();
    }
    return store;
}

function getProvider() {
    if (!provider) {
        provider = new ethers.providers.JsonRpcProvider(PULSECHAIN_RPC, {
            name: PULSECHAIN_NAME,
            chainId: PULSECHAIN_CHAIN_ID,
        });
    }
    return provider;
}

function getTokenAddress() {
    if (!tokenAddress) {
        const s = getStore();
        tokenAddress = s.get(STORE_KEY_TOKEN_ADDRESS) || DEFAULT_TOKEN_ADDRESS;
    }
    return tokenAddress;
}

function getPaymentRate() {
    if (paymentRate === undefined) {
        const s = getStore();
        paymentRate = s.get(STORE_KEY_PAYMENT_RATE) || 0.1; // default 0.1 tokens per MB
    }
    return paymentRate;
}

/**
 * Get the current wallet from the wallet module
 * We access it through the store's encrypted wallet data
 * The wallet module must be unlocked first
 */
function getWalletSigner() {
    // Access the wallet module's current wallet through a shared reference
    // We'll use IPC to check wallet status and get the signer
    const s = getStore();
    const walletData = s.get('wallet-data');
    if (!walletData) {
        throw new Error('No wallet found. Create or import a wallet first.');
    }
    // The wallet must be unlocked - we check via the wallet module's exported state
    // For token operations, the wallet needs to be unlocked in the wallet panel first
    throw new Error('Wallet must be unlocked. Please unlock your wallet first.');
}

// Shared wallet reference - set by wallet module integration
let _walletRef = null;

export function setWalletRef(wallet) {
    _walletRef = wallet;
}

function getWallet() {
    if (!_walletRef) {
        throw new Error('Wallet is locked. Please unlock your wallet first.');
    }
    return _walletRef;
}

/**
 * Get token contract instance (read-only)
 */
function getTokenContract() {
    const addr = getTokenAddress();
    if (addr === DEFAULT_TOKEN_ADDRESS) {
        throw new Error('Token address not configured. Set a valid PulseChainCloak token address.');
    }
    const p = getProvider();
    return new ethers.Contract(addr, ERC20_ABI, p);
}

/**
 * Get token contract instance (with signer for write operations)
 */
function getTokenContractWithSigner() {
    const addr = getTokenAddress();
    if (addr === DEFAULT_TOKEN_ADDRESS) {
        throw new Error('Token address not configured. Set a valid PulseChainCloak token address.');
    }
    const wallet = getWallet();
    return new ethers.Contract(addr, ERC20_ABI, wallet);
}

/**
 * Get token info (name, symbol, decimals)
 */
async function getTokenInfo() {
    try {
        const addr = getTokenAddress();
        if (addr === DEFAULT_TOKEN_ADDRESS) {
            return {
                address: addr,
                name: 'PulseCloak Token',
                symbol: 'CLOAK',
                decimals: 18,
                configured: false,
            };
        }
        const contract = getTokenContract();
        const [name, symbol, decimals] = await Promise.all([
            contract.name().catch(() => 'Unknown Token'),
            contract.symbol().catch(() => 'UNKNOWN'),
            contract.decimals().catch(() => 18),
        ]);
        return {
            address: addr,
            name,
            symbol,
            decimals,
            configured: true,
        };
    } catch (err) {
        log.error('[Token] getTokenInfo error:', err.message);
        return {
            address: getTokenAddress(),
            name: 'PulseCloak Token',
            symbol: 'CLOAK',
            decimals: 18,
            configured: false,
            error: err.message,
        };
    }
}

/**
 * Get token balance for the current wallet
 */
async function getTokenBalance() {
    try {
        const wallet = getWallet();
        const addr = getTokenAddress();
        if (addr === DEFAULT_TOKEN_ADDRESS) {
            return { balance: '0', formatted: '0.0', symbol: 'CLOAK', configured: false };
        }
        const contract = getTokenContract();
        const [balance, symbol, decimals] = await Promise.all([
            contract.balanceOf(wallet.address),
            contract.symbol().catch(() => 'CLOAK'),
            contract.decimals().catch(() => 18),
        ]);
        const formatted = ethers.utils.formatUnits(balance, decimals);
        return {
            balance: balance.toString(),
            formatted,
            symbol,
            decimals,
            configured: true,
        };
    } catch (err) {
        log.error('[Token] getTokenBalance error:', err.message);
        return { balance: '0', formatted: '0.0', symbol: 'CLOAK', error: err.message };
    }
}

/**
 * Send tokens to another address
 * @param {string} to - Recipient address
 * @param {string} amount - Amount in token units (human readable)
 * @returns {object} - Transaction result
 */
async function sendTokens(to, amount) {
    if (!ethers.utils.isAddress(to)) {
        throw new Error('Invalid recipient address');
    }
    if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Invalid amount');
    }

    const contract = getTokenContractWithSigner();
    const decimals = await contract.decimals().catch(() => 18);
    const value = ethers.utils.parseUnits(amount, decimals);
    const symbol = await contract.symbol().catch(() => 'CLOAK');

    const tx = await contract.transfer(to, value);
    log.info('[Token] Transfer sent:', tx.hash);

    // Record in payment history
    addPaymentRecord({
        type: 'send',
        to,
        amount,
        symbol,
        txHash: tx.hash,
        timestamp: new Date().toISOString(),
        status: 'pending',
    });

    // Wait for confirmation in background
    tx.wait().then((receipt) => {
        updatePaymentStatus(tx.hash, receipt.status === 1 ? 'confirmed' : 'failed');
    }).catch(() => {
        updatePaymentStatus(tx.hash, 'failed');
    });

    return {
        hash: tx.hash,
        from: tx.from,
        to,
        amount,
        symbol,
        explorerUrl: PULSECHAIN_EXPLORER + '/tx/' + tx.hash,
    };
}

/**
 * Approve spending for automated payments
 * @param {string} spender - Spender address (e.g., mesh network contract)
 * @param {string} amount - Amount to approve in token units
 */
async function approveSpending(spender, amount) {
    if (!ethers.utils.isAddress(spender)) {
        throw new Error('Invalid spender address');
    }

    const contract = getTokenContractWithSigner();
    const decimals = await contract.decimals().catch(() => 18);
    const value = ethers.utils.parseUnits(amount, decimals);
    const symbol = await contract.symbol().catch(() => 'CLOAK');

    const tx = await contract.approve(spender, value);
    log.info('[Token] Approval sent:', tx.hash);

    addPaymentRecord({
        type: 'approve',
        spender,
        amount,
        symbol,
        txHash: tx.hash,
        timestamp: new Date().toISOString(),
        status: 'pending',
    });

    tx.wait().then((receipt) => {
        updatePaymentStatus(tx.hash, receipt.status === 1 ? 'confirmed' : 'failed');
    }).catch(() => {
        updatePaymentStatus(tx.hash, 'failed');
    });

    return {
        hash: tx.hash,
        spender,
        amount,
        symbol,
        explorerUrl: PULSECHAIN_EXPLORER + '/tx/' + tx.hash,
    };
}

/**
 * Estimate gas cost for a token transfer
 * @param {string} to - Recipient address
 * @param {string} amount - Amount in token units
 * @returns {object} - Gas estimation
 */
async function estimateGas(to, amount) {
    try {
        const wallet = getWallet();
        const addr = getTokenAddress();
        if (addr === DEFAULT_TOKEN_ADDRESS) {
            return { gasLimit: '0', gasCost: '0.0', gasCostFormatted: '0.0 PLS' };
        }

        const p = getProvider();
        const contract = new ethers.Contract(addr, ERC20_ABI, wallet);
        const decimals = await contract.decimals().catch(() => 18);
        const value = ethers.utils.parseUnits(amount || '1', decimals);
        const toAddr = ethers.utils.isAddress(to) ? to : wallet.address;

        const gasLimit = await contract.estimateGas.transfer(toAddr, value);
        const gasPrice = await p.getGasPrice();
        const gasCost = gasLimit.mul(gasPrice);
        const gasCostFormatted = ethers.utils.formatEther(gasCost);

        return {
            gasLimit: gasLimit.toString(),
            gasPrice: gasPrice.toString(),
            gasCost: gasCost.toString(),
            gasCostFormatted: gasCostFormatted + ' PLS',
        };
    } catch (err) {
        log.error('[Token] estimateGas error:', err.message);
        return { gasLimit: '0', gasCost: '0', gasCostFormatted: 'Unable to estimate', error: err.message };
    }
}

/**
 * Set token contract address
 * @param {string} address - New token contract address
 */
function setTokenAddress(address) {
    if (!ethers.utils.isAddress(address)) {
        throw new Error('Invalid token address');
    }
    tokenAddress = address;
    const s = getStore();
    s.set(STORE_KEY_TOKEN_ADDRESS, address);
    log.info('[Token] Token address set to:', address);
    return { address, success: true };
}

/**
 * Set payment rate (tokens per MB)
 * @param {number} rate - Tokens per MB
 */
function setPaymentRate(rate) {
    const r = parseFloat(rate);
    if (isNaN(r) || r < 0) {
        throw new Error('Invalid payment rate');
    }
    paymentRate = r;
    const s = getStore();
    s.set(STORE_KEY_PAYMENT_RATE, r);
    log.info('[Token] Payment rate set to:', r, 'tokens/MB');
    return { rate: r, success: true };
}

/**
 * Get payment history
 * @param {number} limit - Max entries to return
 * @returns {Array} - Payment records
 */
function getPaymentHistory(limit = 50) {
    const s = getStore();
    const history = s.get(STORE_KEY_PAYMENT_HISTORY) || [];
    return history.slice(0, limit);
}

/**
 * Add a payment record to history
 */
function addPaymentRecord(record) {
    const s = getStore();
    let history = s.get(STORE_KEY_PAYMENT_HISTORY) || [];
    history.unshift(record);
    // Keep max 200 records
    if (history.length > 200) {
        history = history.slice(0, 200);
    }
    s.set(STORE_KEY_PAYMENT_HISTORY, history);
}

/**
 * Update payment status by tx hash
 */
function updatePaymentStatus(txHash, status) {
    const s = getStore();
    let history = s.get(STORE_KEY_PAYMENT_HISTORY) || [];
    const idx = history.findIndex((r) => r.txHash === txHash);
    if (idx !== -1) {
        history[idx].status = status;
        s.set(STORE_KEY_PAYMENT_HISTORY, history);
    }
}

/**
 * Enable auto-pay for bandwidth
 * Periodically checks bandwidth usage and sends tokens to node operators
 */
function enableAutoPay() {
    autoPayEnabled = true;
    const s = getStore();
    s.set(STORE_KEY_AUTOPAY_ENABLED, true);
    log.info('[Token] Auto-pay enabled');

    // Start auto-pay check interval (every 60 seconds)
    if (autoPayInterval) clearInterval(autoPayInterval);
    autoPayInterval = setInterval(async () => {
        try {
            await processAutoPay();
        } catch (err) {
            log.error('[Token] Auto-pay error:', err.message);
        }
    }, 60000);

    return { enabled: true, rate: getPaymentRate() };
}

/**
 * Disable auto-pay
 */
function disableAutoPay() {
    autoPayEnabled = false;
    const s = getStore();
    s.set(STORE_KEY_AUTOPAY_ENABLED, false);
    if (autoPayInterval) {
        clearInterval(autoPayInterval);
        autoPayInterval = null;
    }
    log.info('[Token] Auto-pay disabled');
    return { enabled: false };
}

/**
 * Process auto-pay: check bandwidth consumed and pay node operators
 * This integrates with the bandwidth module
 */
async function processAutoPay() {
    if (!autoPayEnabled || !_walletRef) return;

    try {
        // Get bandwidth stats from store (set by bandwidth module)
        const s = getStore();
        const unpaidBytes = s.get('bandwidth.unpaidBytes') || 0;
        const unpaidMB = unpaidBytes / (1024 * 1024);

        if (unpaidMB < 1) return; // Don't pay for less than 1 MB

        const rate = getPaymentRate();
        const amountToPay = (unpaidMB * rate).toFixed(6);

        // Get the node operator address from bandwidth module
        const nodeOperator = s.get('bandwidth.lastNodeOperator');
        if (!nodeOperator || !ethers.utils.isAddress(nodeOperator)) return;

        log.info(`[Token] Auto-pay: ${amountToPay} tokens for ${unpaidMB.toFixed(2)} MB to ${nodeOperator}`);

        // Send payment
        const result = await sendTokens(nodeOperator, amountToPay);

        // Reset unpaid bytes
        s.set('bandwidth.unpaidBytes', 0);

        log.info('[Token] Auto-pay completed:', result.hash);
    } catch (err) {
        log.error('[Token] Auto-pay processing error:', err.message);
    }
}

/**
 * Get auto-pay status
 */
function getAutoPayStatus() {
    const s = getStore();
    return {
        enabled: autoPayEnabled,
        rate: getPaymentRate(),
        tokenAddress: getTokenAddress(),
        configured: getTokenAddress() !== DEFAULT_TOKEN_ADDRESS,
    };
}

/**
 * Initialize IPC handlers for token operations
 */
export function initTokenHandlers() {
    ipcMain.handle('token:get-balance', async () => {
        return await getTokenBalance();
    });

    ipcMain.handle('token:send', async (event, { to, amount }) => {
        return await sendTokens(to, amount);
    });

    ipcMain.handle('token:approve', async (event, { spender, amount }) => {
        return await approveSpending(spender, amount);
    });

    ipcMain.handle('token:get-history', async (event, { limit } = {}) => {
        return getPaymentHistory(limit);
    });

    ipcMain.handle('token:set-rate', async (event, { rate }) => {
        return setPaymentRate(rate);
    });

    ipcMain.handle('token:set-address', async (event, { address }) => {
        return setTokenAddress(address);
    });

    ipcMain.handle('token:get-info', async () => {
        return await getTokenInfo();
    });

    ipcMain.handle('token:enable-autopay', async () => {
        return enableAutoPay();
    });

    ipcMain.handle('token:disable-autopay', async () => {
        return disableAutoPay();
    });

    ipcMain.handle('token:get-autopay-status', async () => {
        return getAutoPayStatus();
    });

    ipcMain.handle('token:estimate-gas', async (event, { to, amount }) => {
        return await estimateGas(to, amount);
    });

    // Restore auto-pay state from previous session
    const s = getStore();
    const wasAutoPayEnabled = s.get(STORE_KEY_AUTOPAY_ENABLED);
    if (wasAutoPayEnabled) {
        autoPayEnabled = true;
        // Don't start interval until wallet is unlocked
        log.info('[Token] Auto-pay was enabled, will activate when wallet is unlocked');
    }

    log.info('[Token] IPC handlers registered');
}

export default {
    getTokenBalance,
    sendTokens,
    approveSpending,
    estimateGas,
    setTokenAddress,
    setPaymentRate,
    getPaymentHistory,
    enableAutoPay,
    disableAutoPay,
    getAutoPayStatus,
    getTokenInfo,
    setWalletRef,
};
