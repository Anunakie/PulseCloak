// PulseChainCloak Browser - Bandwidth Sharing & Rewards Manager
// Tracks bandwidth contributed to mesh network and calculates rewards

import { ipcMain } from 'electron';

const Store = require('electron-store');
const log = require('electron-log');

// Store keys
const STORE_KEY_SHARING_ENABLED = 'bandwidth.sharingEnabled';
const STORE_KEY_STATS = 'bandwidth.stats';
const STORE_KEY_DAILY_HISTORY = 'bandwidth.dailyHistory';
const STORE_KEY_REWARD_RATE = 'bandwidth.rewardRate'; // tokens per MB shared
const STORE_KEY_PENDING_REWARDS = 'bandwidth.pendingRewards';
const STORE_KEY_CLAIMED_REWARDS = 'bandwidth.claimedRewards';
const STORE_KEY_UNPAID_BYTES = 'bandwidth.unpaidBytes';

let store;
let sharingEnabled = false;
let sessionStartTime = null;
let monitorInterval = null;

// Session stats (reset each session)
let sessionStats = {
    bytesUploaded: 0,
    bytesDownloaded: 0,
    startTime: null,
};

function getStore() {
    if (!store) {
        store = new Store();
    }
    return store;
}

/**
 * Get all-time stats from store
 */
function getAllTimeStats() {
    const s = getStore();
    return s.get(STORE_KEY_STATS) || {
        totalBytesUploaded: 0,
        totalBytesDownloaded: 0,
        totalSessions: 0,
        totalSessionTime: 0, // seconds
        firstStarted: null,
    };
}

/**
 * Save all-time stats to store
 */
function saveAllTimeStats(stats) {
    const s = getStore();
    s.set(STORE_KEY_STATS, stats);
}

/**
 * Get reward rate (tokens per MB shared)
 */
function getRewardRate() {
    const s = getStore();
    return s.get(STORE_KEY_REWARD_RATE) || 0.05; // default 0.05 tokens per MB
}

/**
 * Set reward rate
 */
function setRewardRate(rate) {
    const r = parseFloat(rate);
    if (isNaN(r) || r < 0) {
        throw new Error('Invalid reward rate');
    }
    const s = getStore();
    s.set(STORE_KEY_REWARD_RATE, r);
    log.info('[Bandwidth] Reward rate set to:', r, 'tokens/MB');
    return { rate: r, success: true };
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
    const idx = Math.min(i, sizes.length - 1);
    return parseFloat((bytes / Math.pow(k, idx)).toFixed(2)) + ' ' + sizes[idx];
}

/**
 * Format duration in seconds to human readable
 */
function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const parts = [];
    if (h > 0) parts.push(h + 'h');
    if (m > 0) parts.push(m + 'm');
    if (s > 0 || parts.length === 0) parts.push(s + 's');
    return parts.join(' ');
}

/**
 * Get today's date key for daily tracking
 */
function getTodayKey() {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Update daily history with current bandwidth data
 */
function updateDailyHistory(uploaded, downloaded) {
    const s = getStore();
    let history = s.get(STORE_KEY_DAILY_HISTORY) || {};
    const today = getTodayKey();

    if (!history[today]) {
        history[today] = { uploaded: 0, downloaded: 0 };
    }
    history[today].uploaded += uploaded;
    history[today].downloaded += downloaded;

    // Keep only last 30 days
    const keys = Object.keys(history).sort();
    if (keys.length > 30) {
        const toRemove = keys.slice(0, keys.length - 30);
        toRemove.forEach((k) => delete history[k]);
    }

    s.set(STORE_KEY_DAILY_HISTORY, history);
}

/**
 * Get daily history for charts
 * @param {number} days - Number of days to return
 */
function getDailyHistory(days = 7) {
    const s = getStore();
    const history = s.get(STORE_KEY_DAILY_HISTORY) || {};
    const result = [];

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const key = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const entry = history[key] || { uploaded: 0, downloaded: 0 };
        result.push({
            date: key,
            dayName,
            uploaded: entry.uploaded,
            downloaded: entry.downloaded,
            uploadedFormatted: formatBytes(entry.uploaded),
            downloadedFormatted: formatBytes(entry.downloaded),
        });
    }

    return result;
}

/**
 * Simulate bandwidth monitoring
 * In production, this would hook into the mesh proxy to track real traffic
 */
function simulateBandwidthUpdate() {
    if (!sharingEnabled) return;

    // Simulate some bandwidth activity when sharing is enabled
    // In production, this would read from actual network counters
    const uploadChunk = Math.floor(Math.random() * 50000) + 5000; // 5-55 KB
    const downloadChunk = Math.floor(Math.random() * 30000) + 2000; // 2-32 KB

    sessionStats.bytesUploaded += uploadChunk;
    sessionStats.bytesDownloaded += downloadChunk;

    // Update all-time stats
    const allTime = getAllTimeStats();
    allTime.totalBytesUploaded += uploadChunk;
    allTime.totalBytesDownloaded += downloadChunk;
    saveAllTimeStats(allTime);

    // Update daily history
    updateDailyHistory(uploadChunk, downloadChunk);

    // Update pending rewards
    const uploadedMB = uploadChunk / (1024 * 1024);
    const rate = getRewardRate();
    const earned = uploadedMB * rate;
    const s = getStore();
    const pending = s.get(STORE_KEY_PENDING_REWARDS) || 0;
    s.set(STORE_KEY_PENDING_REWARDS, pending + earned);

    // Track unpaid bytes for auto-pay integration
    const unpaid = s.get(STORE_KEY_UNPAID_BYTES) || 0;
    s.set(STORE_KEY_UNPAID_BYTES, unpaid + downloadChunk);
}

/**
 * Enable bandwidth sharing
 */
function enableSharing() {
    if (sharingEnabled) return { enabled: true, message: 'Already sharing' };

    sharingEnabled = true;
    sessionStartTime = Date.now();
    sessionStats = {
        bytesUploaded: 0,
        bytesDownloaded: 0,
        startTime: new Date().toISOString(),
    };

    const s = getStore();
    s.set(STORE_KEY_SHARING_ENABLED, true);

    // Update session count
    const allTime = getAllTimeStats();
    allTime.totalSessions += 1;
    if (!allTime.firstStarted) {
        allTime.firstStarted = new Date().toISOString();
    }
    saveAllTimeStats(allTime);

    // Start monitoring interval (every 5 seconds)
    if (monitorInterval) clearInterval(monitorInterval);
    monitorInterval = setInterval(() => {
        simulateBandwidthUpdate();
    }, 5000);

    log.info('[Bandwidth] Sharing enabled');
    return { enabled: true, message: 'Bandwidth sharing started' };
}

/**
 * Disable bandwidth sharing
 */
function disableSharing() {
    if (!sharingEnabled) return { enabled: false, message: 'Already stopped' };

    sharingEnabled = false;

    // Update total session time
    if (sessionStartTime) {
        const sessionDuration = (Date.now() - sessionStartTime) / 1000;
        const allTime = getAllTimeStats();
        allTime.totalSessionTime += sessionDuration;
        saveAllTimeStats(allTime);
    }

    sessionStartTime = null;

    const s = getStore();
    s.set(STORE_KEY_SHARING_ENABLED, false);

    if (monitorInterval) {
        clearInterval(monitorInterval);
        monitorInterval = null;
    }

    log.info('[Bandwidth] Sharing disabled');
    return { enabled: false, message: 'Bandwidth sharing stopped' };
}

/**
 * Get sharing status
 */
function getSharingStatus() {
    return {
        enabled: sharingEnabled,
        sessionDuration: sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 1000) : 0,
        sessionDurationFormatted: sessionStartTime ? formatDuration(Math.floor((Date.now() - sessionStartTime) / 1000)) : '0s',
    };
}

/**
 * Get comprehensive bandwidth stats
 */
function getStats() {
    const allTime = getAllTimeStats();
    const sessionDuration = sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 1000) : 0;
    const netContribution = (allTime.totalBytesUploaded || 0) - (allTime.totalBytesDownloaded || 0);
    const sessionNet = sessionStats.bytesUploaded - sessionStats.bytesDownloaded;

    // Calculate speeds (bytes per second over last interval)
    const uploadSpeed = sharingEnabled ? Math.floor(Math.random() * 50000) + 5000 : 0;
    const downloadSpeed = sharingEnabled ? Math.floor(Math.random() * 30000) + 2000 : 0;

    return {
        sharing: sharingEnabled,
        session: {
            bytesUploaded: sessionStats.bytesUploaded,
            bytesDownloaded: sessionStats.bytesDownloaded,
            netContribution: sessionNet,
            uploadedFormatted: formatBytes(sessionStats.bytesUploaded),
            downloadedFormatted: formatBytes(sessionStats.bytesDownloaded),
            netFormatted: formatBytes(sessionNet),
            duration: sessionDuration,
            durationFormatted: formatDuration(sessionDuration),
            startTime: sessionStats.startTime,
        },
        allTime: {
            totalBytesUploaded: allTime.totalBytesUploaded || 0,
            totalBytesDownloaded: allTime.totalBytesDownloaded || 0,
            netContribution,
            uploadedFormatted: formatBytes(allTime.totalBytesUploaded || 0),
            downloadedFormatted: formatBytes(allTime.totalBytesDownloaded || 0),
            netFormatted: formatBytes(netContribution),
            totalSessions: allTime.totalSessions || 0,
            totalSessionTime: allTime.totalSessionTime || 0,
            totalSessionTimeFormatted: formatDuration(allTime.totalSessionTime || 0),
            firstStarted: allTime.firstStarted,
        },
        speeds: {
            upload: uploadSpeed,
            download: downloadSpeed,
            uploadFormatted: formatBytes(uploadSpeed) + '/s',
            downloadFormatted: formatBytes(downloadSpeed) + '/s',
        },
        isContributor: netContribution > 0,
    };
}

/**
 * Get rewards information
 */
function getRewards() {
    const s = getStore();
    const pending = s.get(STORE_KEY_PENDING_REWARDS) || 0;
    const claimed = s.get(STORE_KEY_CLAIMED_REWARDS) || 0;
    const rate = getRewardRate();
    const allTime = getAllTimeStats();
    const totalSharedMB = (allTime.totalBytesUploaded || 0) / (1024 * 1024);
    const totalEarned = totalSharedMB * rate;

    return {
        pending: parseFloat(pending.toFixed(6)),
        claimed: parseFloat(claimed.toFixed(6)),
        totalEarned: parseFloat(totalEarned.toFixed(6)),
        rate,
        rateFormatted: rate + ' tokens/MB',
        totalSharedMB: parseFloat(totalSharedMB.toFixed(2)),
    };
}

/**
 * Claim pending rewards
 * In production, this would trigger a smart contract call
 * For now, it moves pending to claimed
 */
function claimRewards() {
    const s = getStore();
    const pending = s.get(STORE_KEY_PENDING_REWARDS) || 0;

    if (pending <= 0) {
        return { success: false, message: 'No pending rewards to claim' };
    }

    const claimed = s.get(STORE_KEY_CLAIMED_REWARDS) || 0;
    s.set(STORE_KEY_CLAIMED_REWARDS, claimed + pending);
    s.set(STORE_KEY_PENDING_REWARDS, 0);

    log.info('[Bandwidth] Rewards claimed:', pending);
    return {
        success: true,
        claimed: parseFloat(pending.toFixed(6)),
        totalClaimed: parseFloat((claimed + pending).toFixed(6)),
        message: `Claimed ${pending.toFixed(6)} tokens`,
    };
}

/**
 * Get bandwidth history (daily breakdown)
 * @param {number} days - Number of days
 */
function getHistory(days = 7) {
    return getDailyHistory(days);
}

/**
 * Initialize IPC handlers for bandwidth operations
 */
export function initBandwidthHandlers() {
    ipcMain.handle('bandwidth:get-stats', async () => {
        return getStats();
    });

    ipcMain.handle('bandwidth:enable-sharing', async () => {
        return enableSharing();
    });

    ipcMain.handle('bandwidth:disable-sharing', async () => {
        return disableSharing();
    });

    ipcMain.handle('bandwidth:get-sharing-status', async () => {
        return getSharingStatus();
    });

    ipcMain.handle('bandwidth:get-rewards', async () => {
        return getRewards();
    });

    ipcMain.handle('bandwidth:claim-rewards', async () => {
        return claimRewards();
    });

    ipcMain.handle('bandwidth:get-history', async (event, { days } = {}) => {
        return getHistory(days || 7);
    });

    ipcMain.handle('bandwidth:set-reward-rate', async (event, { rate }) => {
        return setRewardRate(rate);
    });

    // Restore sharing state from previous session
    const s = getStore();
    const wasSharing = s.get(STORE_KEY_SHARING_ENABLED);
    if (wasSharing) {
        log.info('[Bandwidth] Restoring sharing state from previous session');
        enableSharing();
    }

    log.info('[Bandwidth] IPC handlers registered');
}

export default {
    enableSharing,
    disableSharing,
    getStats,
    getRewards,
    claimRewards,
    getHistory,
    getSharingStatus,
    setRewardRate,
};
