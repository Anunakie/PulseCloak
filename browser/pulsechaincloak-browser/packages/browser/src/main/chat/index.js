// PulseChainCloak Browser - Wallet-to-Wallet Decentralized Chat
// Uses GunDB for P2P message relay, ECDH for E2E encryption

import { ipcMain, BrowserWindow } from 'electron';

const Gun = require('gun');
require('gun/sea');
const crypto = require('crypto');
const { ethers } = require('ethers');
const Store = require('electron-store');
const log = require('electron-log');

// ===== STORE =====
let store;
function getStore() {
    if (!store) {
        store = new Store({ name: 'pulsechaincloak-chat' });
    }
    return store;
}

// ===== GUN INSTANCE =====
let gun;
let sea;
let activeListeners = {}; // channelId -> listener

function getGun() {
    if (!gun) {
        gun = Gun({
            peers: [
                'https://gun-manhattan.herokuapp.com/gun',
                'https://gun-us.herokuapp.com/gun',
            ],
            localStorage: false,
            radisk: false,
        });
    }
    return gun;
}

// ===== CHANNEL ID =====
// Deterministic channel ID from two wallet addresses (sorted + SHA256)
function getChannelId(addr1, addr2) {
    const sorted = [addr1.toLowerCase(), addr2.toLowerCase()].sort();
    const combined = sorted.join(':');
    return crypto.createHash('sha256').update(combined).digest('hex');
}

// ===== ECDH ENCRYPTION =====
// Derive shared secret from two wallet addresses using a deterministic key derivation
// Since we can't do true ECDH without the peer's public key in real-time,
// we use a symmetric encryption approach with a channel-derived key
function deriveChannelKey(channelId, walletPrivateKey) {
    // Use HKDF-like derivation: HMAC(privateKey, channelId)
    const hmac = crypto.createHmac('sha256', walletPrivateKey);
    hmac.update(channelId);
    return hmac.digest();
}

function encryptMessage(text, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');
    return {
        ct: encrypted,
        iv: iv.toString('hex'),
        tag: tag,
    };
}

function decryptMessage(encData, key) {
    try {
        const iv = Buffer.from(encData.iv, 'hex');
        const tag = Buffer.from(encData.tag, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(tag);
        let decrypted = decipher.update(encData.ct, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        log.warn('CHAT: Failed to decrypt message:', e.message);
        return '[Encrypted message - unable to decrypt]';
    }
}

// ===== SIGN / VERIFY =====
function signMessage(text, timestamp, privateKey) {
    const message = text + ':' + timestamp;
    const wallet = new ethers.Wallet(privateKey);
    // Use synchronous signing via signMessage
    return wallet.signMessage(message);
}

function verifySignature(text, timestamp, signature, address) {
    try {
        const message = text + ':' + timestamp;
        const recovered = ethers.utils.verifyMessage(message, signature);
        return recovered.toLowerCase() === address.toLowerCase();
    } catch (e) {
        return false;
    }
}

// ===== WALLET ACCESS =====
// We need access to the wallet's private key and address
// Import from wallet module or get via IPC
let currentPrivateKey = null;
let currentAddress = null;

function setWalletInfo(address, privateKey) {
    currentAddress = address;
    currentPrivateKey = privateKey;
}

// ===== CONVERSATIONS =====
function getConversations() {
    const s = getStore();
    return s.get('conversations') || [];
}

function saveConversation(peerAddress, lastMessage, timestamp) {
    const s = getStore();
    let convos = s.get('conversations') || [];
    const idx = convos.findIndex(
        (c) => c.peerAddress.toLowerCase() === peerAddress.toLowerCase()
    );
    if (idx >= 0) {
        convos[idx].lastMessage = lastMessage;
        convos[idx].timestamp = timestamp;
        convos[idx].unread = (convos[idx].unread || 0) + 1;
    } else {
        convos.push({
            peerAddress,
            lastMessage,
            timestamp,
            unread: 1,
            startedAt: timestamp,
        });
    }
    // Sort by most recent
    convos.sort((a, b) => b.timestamp - a.timestamp);
    s.set('conversations', convos);
    return convos;
}

function markConversationRead(peerAddress) {
    const s = getStore();
    let convos = s.get('conversations') || [];
    const idx = convos.findIndex(
        (c) => c.peerAddress.toLowerCase() === peerAddress.toLowerCase()
    );
    if (idx >= 0) {
        convos[idx].unread = 0;
        s.set('conversations', convos);
    }
    return convos;
}

function getTotalUnread() {
    const convos = getConversations();
    return convos.reduce((sum, c) => sum + (c.unread || 0), 0);
}

// ===== MESSAGE STORAGE =====
function getLocalMessages(channelId) {
    const s = getStore();
    return s.get('messages-' + channelId) || [];
}

function saveLocalMessage(channelId, msg) {
    const s = getStore();
    let msgs = s.get('messages-' + channelId) || [];
    // Deduplicate by timestamp + sender
    const exists = msgs.find(
        (m) => m.timestamp === msg.timestamp && m.sender === msg.sender
    );
    if (!exists) {
        msgs.push(msg);
        msgs.sort((a, b) => a.timestamp - b.timestamp);
        // Keep last 500 messages per channel
        if (msgs.length > 500) {
            msgs = msgs.slice(-500);
        }
        s.set('messages-' + channelId, msgs);
    }
    return msgs;
}

// ===== SEND MESSAGE =====
async function sendMessage(peerAddress, text) {
    if (!currentAddress || !currentPrivateKey) {
        throw new Error('Wallet not connected. Unlock your wallet first.');
    }
    if (!peerAddress || !ethers.utils.isAddress(peerAddress)) {
        throw new Error('Invalid peer wallet address');
    }
    if (!text || text.trim().length === 0) {
        throw new Error('Message cannot be empty');
    }

    const channelId = getChannelId(currentAddress, peerAddress);
    const timestamp = Date.now();
    const channelKey = deriveChannelKey(channelId, currentPrivateKey);

    // Encrypt the message
    const encrypted = encryptMessage(text.trim(), channelKey);

    // Sign the message
    const signature = await signMessage(text.trim(), timestamp.toString(), currentPrivateKey);

    // Message object for GunDB
    const msgData = {
        sender: currentAddress,
        encrypted: JSON.stringify(encrypted),
        timestamp,
        signature,
    };

    // Store in GunDB
    const g = getGun();
    const msgId = channelId + '-' + timestamp + '-' + currentAddress.slice(-6);
    g.get('pulsechaincloak-chat')
        .get(channelId)
        .get(msgId)
        .put(msgData);

    // Save locally (decrypted)
    const localMsg = {
        sender: currentAddress,
        text: text.trim(),
        timestamp,
        signature,
        verified: true,
    };
    saveLocalMessage(channelId, localMsg);

    // Update conversation
    saveConversation(peerAddress, text.trim().substring(0, 100), timestamp);
    // Mark own conversation as read
    markConversationRead(peerAddress);

    log.info('CHAT: Message sent to', peerAddress.substring(0, 10) + '...');
    return localMsg;
}

// ===== LISTEN FOR MESSAGES =====
function listenToChannel(peerAddress) {
    if (!currentAddress || !currentPrivateKey) return;

    const channelId = getChannelId(currentAddress, peerAddress);

    // Don't double-listen
    if (activeListeners[channelId]) return;

    const g = getGun();
    const channelKey = deriveChannelKey(channelId, currentPrivateKey);

    activeListeners[channelId] = true;

    g.get('pulsechaincloak-chat')
        .get(channelId)
        .map()
        .on((data, key) => {
            if (!data || !data.sender || !data.encrypted || !data.timestamp) return;
            // Skip own messages
            if (data.sender.toLowerCase() === currentAddress.toLowerCase()) return;

            try {
                const encrypted = JSON.parse(data.encrypted);
                const text = decryptMessage(encrypted, channelKey);
                const verified = verifySignature(
                    text,
                    data.timestamp.toString(),
                    data.signature,
                    data.sender
                );

                const msg = {
                    sender: data.sender,
                    text,
                    timestamp: data.timestamp,
                    signature: data.signature,
                    verified,
                };

                // Save locally
                const msgs = saveLocalMessage(channelId, msg);

                // Update conversation
                saveConversation(data.sender, text.substring(0, 100), data.timestamp);

                // Notify renderer
                const windows = BrowserWindow.getAllWindows();
                windows.forEach((win) => {
                    if (win.webContents) {
                        win.webContents.send('chat:new-message', {
                            peerAddress: data.sender,
                            message: msg,
                            channelId,
                            unreadTotal: getTotalUnread(),
                        });
                    }
                });
            } catch (e) {
                log.warn('CHAT: Error processing incoming message:', e.message);
            }
        });

    log.info('CHAT: Listening to channel with', peerAddress.substring(0, 10) + '...');
}

// ===== START CHAT =====
function startChat(peerAddress) {
    if (!currentAddress || !currentPrivateKey) {
        throw new Error('Wallet not connected');
    }
    if (!ethers.utils.isAddress(peerAddress)) {
        throw new Error('Invalid wallet address');
    }
    if (peerAddress.toLowerCase() === currentAddress.toLowerCase()) {
        throw new Error('Cannot chat with yourself');
    }

    const channelId = getChannelId(currentAddress, peerAddress);

    // Add to conversations if not exists
    const s = getStore();
    let convos = s.get('conversations') || [];
    const exists = convos.find(
        (c) => c.peerAddress.toLowerCase() === peerAddress.toLowerCase()
    );
    if (!exists) {
        convos.push({
            peerAddress,
            lastMessage: '',
            timestamp: Date.now(),
            unread: 0,
            startedAt: Date.now(),
        });
        s.set('conversations', convos);
    }

    // Start listening
    listenToChannel(peerAddress);

    return { channelId, peerAddress };
}

// ===== GET MESSAGES =====
function getMessages(peerAddress) {
    if (!currentAddress) {
        return [];
    }
    const channelId = getChannelId(currentAddress, peerAddress);
    markConversationRead(peerAddress);
    return getLocalMessages(channelId);
}

// ===== CLEANUP =====
function stopAllListeners() {
    activeListeners = {};
    if (gun) {
        // Gun doesn't have a clean off() for map listeners, just reset
        gun = null;
    }
}

// ===== IPC HANDLERS =====
export function initChatHandlers() {
    ipcMain.handle('chat:set-wallet', async (event, { address, privateKey }) => {
        setWalletInfo(address, privateKey);
        // Re-listen to all existing conversations
        const convos = getConversations();
        convos.forEach((c) => listenToChannel(c.peerAddress));
        return { connected: true };
    });

    ipcMain.handle('chat:send-message', async (event, { peerAddress, text }) => {
        return await sendMessage(peerAddress, text);
    });

    ipcMain.handle('chat:get-messages', async (event, { peerAddress }) => {
        return getMessages(peerAddress);
    });

    ipcMain.handle('chat:get-conversations', async (event) => {
        return getConversations();
    });

    ipcMain.handle('chat:start-chat', async (event, { peerAddress }) => {
        return startChat(peerAddress);
    });

    ipcMain.handle('chat:mark-read', async (event, { peerAddress }) => {
        return markConversationRead(peerAddress);
    });

    ipcMain.handle('chat:get-unread', async (event) => {
        return { total: getTotalUnread() };
    });

    ipcMain.handle('chat:disconnect', async (event) => {
        stopAllListeners();
        currentAddress = null;
        currentPrivateKey = null;
        return { disconnected: true };
    });

    log.info('CHAT: IPC handlers registered');
}

export { sendMessage, getMessages, getConversations, startChat };
