// PulseChainCloak Browser - Built-in PulseChain Web3 Wallet
// Supports PulseChain (Chain ID 369, RPC: https://rpc.pulsechain.com)

import { ipcMain } from 'electron';

const { ethers } = require('ethers');
const Store = require('electron-store');
const crypto = require('crypto');
const log = require('electron-log');

// PulseChain configuration
const PULSECHAIN_RPC = 'https://rpc.pulsechain.com';
const PULSECHAIN_CHAIN_ID = 369;
const PULSECHAIN_NAME = 'PulseChain';
const PULSECHAIN_SYMBOL = 'PLS';
const PULSECHAIN_EXPLORER = 'https://otter.pulsechain.com';

// ERC-20 ABI (minimal for balanceOf, transfer, symbol, decimals, name)
const ERC20_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function name() view returns (string)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
];

// Encryption helpers
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const ITERATIONS = 100000;

function deriveKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512');
}

function encrypt(text, password) {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = deriveKey(password, salt);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    return {
        encrypted,
        iv: iv.toString('hex'),
        salt: salt.toString('hex'),
        tag: tag.toString('hex'),
    };
}

function decrypt(encryptedData, password) {
    const salt = Buffer.from(encryptedData.salt, 'hex');
    const key = deriveKey(password, salt);
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const tag = Buffer.from(encryptedData.tag, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// Wallet state
let store;
let provider;
let currentWallet = null; // ethers.Wallet instance (unlocked)
let isLocked = true;

const STORE_KEY_WALLET = 'wallet-data';
const STORE_KEY_TOKENS = 'wallet-tokens';

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

/**
 * Create a new wallet with BIP39 mnemonic
 * @param {string} password - Password to encrypt the wallet
 * @returns {object} - { address, mnemonic }
 */
async function createWallet(password) {
    if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters');
    }

    // Generate random mnemonic (BIP39) and derive HD wallet
    const wallet = ethers.Wallet.createRandom();
    const mnemonic = wallet.mnemonic.phrase;
    const privateKey = wallet.privateKey;
    const address = wallet.address;

    // Encrypt and store wallet data
    const walletData = JSON.stringify({
        mnemonic,
        privateKey,
        address,
        createdAt: new Date().toISOString(),
    });

    const encryptedData = encrypt(walletData, password);
    const s = getStore();
    s.set(STORE_KEY_WALLET, encryptedData);

    // Set current wallet as unlocked
    const p = getProvider();
    currentWallet = new ethers.Wallet(privateKey, p);
    isLocked = false;

    log.info('WALLET: New wallet created ->', address);
    return { address, mnemonic };
}

/**
 * Import wallet from seed phrase or private key
 * @param {string} input - Mnemonic phrase or private key
 * @param {string} password - Password to encrypt the wallet
 * @returns {object} - { address }
 */
async function importWallet(input, password) {
    if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters');
    }

    let wallet;
    let mnemonic = '';
    const trimmed = input.trim();

    // Detect if input is a mnemonic or private key
    if (trimmed.split(/\s+/).length >= 12) {
        // Mnemonic phrase
        wallet = ethers.Wallet.fromMnemonic(trimmed);
        mnemonic = trimmed;
    } else {
        // Private key
        let pk = trimmed;
        if (!pk.startsWith('0x')) {
            pk = '0x' + pk;
        }
        wallet = new ethers.Wallet(pk);
    }

    const privateKey = wallet.privateKey;
    const address = wallet.address;

    // Encrypt and store
    const walletData = JSON.stringify({
        mnemonic,
        privateKey,
        address,
        importedAt: new Date().toISOString(),
    });

    const encryptedData = encrypt(walletData, password);
    const s = getStore();
    s.set(STORE_KEY_WALLET, encryptedData);

    // Set current wallet as unlocked
    const p = getProvider();
    currentWallet = new ethers.Wallet(privateKey, p);
    isLocked = false;

    log.info('WALLET: Wallet imported ->', address);
    return { address };
}

/**
 * Unlock wallet with password
 * @param {string} password
 * @returns {object} - { address }
 */
async function unlockWallet(password) {
    const s = getStore();
    const encryptedData = s.get(STORE_KEY_WALLET);

    if (!encryptedData) {
        throw new Error('No wallet found. Create or import a wallet first.');
    }

    try {
        const decrypted = decrypt(encryptedData, password);
        const walletData = JSON.parse(decrypted);

        const p = getProvider();
        currentWallet = new ethers.Wallet(walletData.privateKey, p);
        isLocked = false;

        log.info('WALLET: Unlocked ->', walletData.address);
        return { address: walletData.address };
    } catch (e) {
        log.error('WALLET: Failed to unlock ->', e.message);
        throw new Error('Invalid password');
    }
}

/**
 * Lock wallet
 */
function lockWallet() {
    currentWallet = null;
    isLocked = true;
    log.info('WALLET: Locked');
    return { locked: true };
}

/**
 * Get wallet address
 * @returns {object} - { address, isLocked, hasWallet }
 */
function getWalletAddress() {
    const s = getStore();
    const hasWallet = !!s.get(STORE_KEY_WALLET);

    if (!hasWallet) {
        return { address: null, isLocked: true, hasWallet: false };
    }

    if (isLocked || !currentWallet) {
        return { address: null, isLocked: true, hasWallet: true };
    }

    return { address: currentWallet.address, isLocked: false, hasWallet: true };
}

/**
 * Get PLS balance
 * @returns {object} - { balance, formatted }
 */
async function getBalance() {
    if (isLocked || !currentWallet) {
        throw new Error('Wallet is locked');
    }

    const p = getProvider();
    const balance = await p.getBalance(currentWallet.address);
    const formatted = ethers.utils.formatEther(balance);

    return {
        balance: balance.toString(),
        formatted,
        symbol: PULSECHAIN_SYMBOL,
    };
}

/**
 * Send PLS transaction
 * @param {string} to - Recipient address
 * @param {string} amount - Amount in PLS (ether units)
 * @returns {object} - { hash, from, to, amount }
 */
async function sendTransaction(to, amount) {
    if (isLocked || !currentWallet) {
        throw new Error('Wallet is locked');
    }

    if (!ethers.utils.isAddress(to)) {
        throw new Error('Invalid recipient address');
    }

    const value = ethers.utils.parseEther(amount);

    const tx = await currentWallet.sendTransaction({
        to,
        value,
        chainId: PULSECHAIN_CHAIN_ID,
    });

    log.info('WALLET: TX sent ->', tx.hash);

    return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        amount,
        explorerUrl: PULSECHAIN_EXPLORER + '/tx/' + tx.hash,
    };
}

/**
 * Get ERC-20 token balance
 * @param {string} tokenAddress - Token contract address
 * @returns {object} - { balance, formatted, symbol, name, decimals }
 */
async function getTokenBalance(tokenAddress) {
    if (isLocked || !currentWallet) {
        throw new Error('Wallet is locked');
    }

    if (!ethers.utils.isAddress(tokenAddress)) {
        throw new Error('Invalid token address');
    }

    const p = getProvider();
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, p);

    const [balance, symbol, decimals, name] = await Promise.all([
        contract.balanceOf(currentWallet.address),
        contract.symbol().catch(() => 'UNKNOWN'),
        contract.decimals().catch(() => 18),
        contract.name().catch(() => 'Unknown Token'),
    ]);

    const formatted = ethers.utils.formatUnits(balance, decimals);

    return {
        balance: balance.toString(),
        formatted,
        symbol,
        name,
        decimals,
        address: tokenAddress,
    };
}

/**
 * Send ERC-20 token
 * @param {string} tokenAddress - Token contract address
 * @param {string} to - Recipient address
 * @param {string} amount - Amount in token units
 * @returns {object} - { hash }
 */
async function sendToken(tokenAddress, to, amount) {
    if (isLocked || !currentWallet) {
        throw new Error('Wallet is locked');
    }

    if (!ethers.utils.isAddress(tokenAddress) || !ethers.utils.isAddress(to)) {
        throw new Error('Invalid address');
    }

    const p = getProvider();
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, currentWallet);
    const decimals = await contract.decimals().catch(() => 18);
    const value = ethers.utils.parseUnits(amount, decimals);

    const tx = await contract.transfer(to, value);
    log.info('WALLET: Token TX sent ->', tx.hash);

    return {
        hash: tx.hash,
        explorerUrl: PULSECHAIN_EXPLORER + '/tx/' + tx.hash,
    };
}

/**
 * Add a token to the tracked list
 * @param {string} tokenAddress - Token contract address
 * @returns {object} - token info
 */
async function addToken(tokenAddress) {
    if (!ethers.utils.isAddress(tokenAddress)) {
        throw new Error('Invalid token address');
    }

    const p = getProvider();
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, p);

    const [symbol, decimals, name] = await Promise.all([
        contract.symbol().catch(() => 'UNKNOWN'),
        contract.decimals().catch(() => 18),
        contract.name().catch(() => 'Unknown Token'),
    ]);

    const s = getStore();
    let tokens = s.get(STORE_KEY_TOKENS) || [];

    // Don't add duplicates
    const exists = tokens.find(
        (t) => t.address.toLowerCase() === tokenAddress.toLowerCase()
    );
    if (!exists) {
        tokens.push({
            address: tokenAddress,
            symbol,
            decimals,
            name,
            addedAt: new Date().toISOString(),
        });
        s.set(STORE_KEY_TOKENS, tokens);
        log.info('WALLET: Token added ->', symbol, tokenAddress);
    }

    return { address: tokenAddress, symbol, decimals, name };
}

/**
 * Get list of tracked tokens
 * @returns {Array}
 */
function getTokenList() {
    const s = getStore();
    return s.get(STORE_KEY_TOKENS) || [];
}

/**
 * Remove a token from the tracked list
 * @param {string} tokenAddress
 */
function removeToken(tokenAddress) {
    const s = getStore();
    let tokens = s.get(STORE_KEY_TOKENS) || [];
    tokens = tokens.filter(
        (t) => t.address.toLowerCase() !== tokenAddress.toLowerCase()
    );
    s.set(STORE_KEY_TOKENS, tokens);
    return tokens;
}

/**
 * Initialize IPC handlers for wallet operations
 */
export function initWalletHandlers() {
    ipcMain.handle('wallet:create', async (event, { password }) => {
        return await createWallet(password);
    });

    ipcMain.handle('wallet:import', async (event, { input, password }) => {
        return await importWallet(input, password);
    });

    ipcMain.handle('wallet:unlock', async (event, { password }) => {
        return await unlockWallet(password);
    });

    ipcMain.handle('wallet:lock', async (event) => {
        return lockWallet();
    });

    ipcMain.handle('wallet:get-address', async (event) => {
        return getWalletAddress();
    });

    ipcMain.handle('wallet:get-balance', async (event) => {
        return await getBalance();
    });

    ipcMain.handle('wallet:send-transaction', async (event, { to, amount }) => {
        return await sendTransaction(to, amount);
    });

    ipcMain.handle('wallet:get-token-balance', async (event, { tokenAddress }) => {
        return await getTokenBalance(tokenAddress);
    });

    ipcMain.handle('wallet:send-token', async (event, { tokenAddress, to, amount }) => {
        return await sendToken(tokenAddress, to, amount);
    });

    ipcMain.handle('wallet:add-token', async (event, { tokenAddress }) => {
        return await addToken(tokenAddress);
    });

    ipcMain.handle('wallet:get-token-list', async (event) => {
        return getTokenList();
    });

    ipcMain.handle('wallet:remove-token', async (event, { tokenAddress }) => {
        return removeToken(tokenAddress);
    });

    log.info('WALLET: IPC handlers registered');
}

export { createWallet, importWallet, unlockWallet, lockWallet, getBalance };
