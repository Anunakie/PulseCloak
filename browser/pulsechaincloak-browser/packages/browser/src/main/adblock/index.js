// PulseChainCloak Browser - Ad & Tracker Blocker
// Uses Electron's webRequest API to block known ad/tracker domains

import { ipcMain } from 'electron';
import { AD_DOMAINS, AD_URL_PATTERNS } from './blocklist';

const log = require('electron-log');

// Track blocked requests count per tab and total
let totalBlocked = 0;
const blockedPerTab = new Map();

// Build a Set for O(1) domain lookups
const blockedDomainSet = new Set(AD_DOMAINS);

/**
 * Check if a URL should be blocked
 * @param {string} url - The URL to check
 * @returns {boolean} - Whether the URL should be blocked
 */
function shouldBlockUrl(url) {
    try {
        const parsed = new URL(url);
        const hostname = parsed.hostname;

        // Check exact domain match and subdomain match
        for (const domain of blockedDomainSet) {
            if (hostname === domain || hostname.endsWith('.' + domain)) {
                return true;
            }
        }

        // Check URL path patterns
        const fullUrl = parsed.pathname + parsed.search;
        for (const pattern of AD_URL_PATTERNS) {
            if (fullUrl.includes(pattern)) {
                return true;
            }
        }
    } catch (e) {
        // Invalid URL, don't block
    }
    return false;
}

/**
 * Initialize ad blocking on a session
 * @param {Electron.Session} session - The Electron session to apply blocking to
 */
export function initAdBlock(session) {
    if (!session) {
        log.warn('ADBLOCK: No session provided, skipping initialization');
        return;
    }

    log.info('ADBLOCK: Initializing ad & tracker blocking');

    session.webRequest.onBeforeRequest((details, callback) => {
        const { url, webContentsId } = details;

        // Don't block chrome-extension or devtools URLs
        if (url.startsWith('chrome-extension://') ||
            url.startsWith('devtools://') ||
            url.startsWith('file://') ||
            url.startsWith('data:')) {
            callback({ cancel: false });
            return;
        }

        if (shouldBlockUrl(url)) {
            totalBlocked++;

            // Track per-tab blocking
            if (webContentsId) {
                const current = blockedPerTab.get(webContentsId) || 0;
                blockedPerTab.set(webContentsId, current + 1);
            }

            log.debug('ADBLOCK: Blocked ->', url.substring(0, 80));
            callback({ cancel: true });
            return;
        }

        callback({ cancel: false });
    });

    log.info('ADBLOCK: Ad & tracker blocking active with ' + blockedDomainSet.size + ' domains');
}

/**
 * Initialize IPC handlers for adblock stats
 */
export function initAdBlockHandlers() {
    ipcMain.handle('adblock:get-stats', async (event) => {
        return {
            totalBlocked,
            domainCount: blockedDomainSet.size,
        };
    });

    ipcMain.handle('adblock:get-tab-stats', async (event, tabId) => {
        return {
            blocked: blockedPerTab.get(tabId) || 0,
        };
    });

    ipcMain.handle('adblock:reset-stats', async (event) => {
        totalBlocked = 0;
        blockedPerTab.clear();
        return { success: true };
    });

    log.info('ADBLOCK: IPC handlers registered');
}

export function getBlockedCount() {
    return totalBlocked;
}

export function getTabBlockedCount(tabId) {
    return blockedPerTab.get(tabId) || 0;
}
