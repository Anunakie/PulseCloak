// PulseChainCloak Browser - Auto-Deleting History Manager
// Tracks visited URLs with timestamps, auto-deletes older entries

import { ipcMain } from 'electron';

const Store = require('electron-store');
const log = require('electron-log');

const DEFAULT_HISTORY_LIMIT = 10;
const STORE_KEY_HISTORY = 'browser-history';
const STORE_KEY_LIMIT = 'history-limit';

let store;

function getStore() {
    if (!store) {
        store = new Store();
    }
    return store;
}

/**
 * Get the current history limit
 * @returns {number}
 */
function getHistoryLimit() {
    const s = getStore();
    const limit = s.get(STORE_KEY_LIMIT);
    if (typeof limit === 'number' && limit > 0) {
        return limit;
    }
    return DEFAULT_HISTORY_LIMIT;
}

/**
 * Set the history limit
 * @param {number} limit
 */
function setHistoryLimit(limit) {
    const s = getStore();
    const val = Math.max(1, Math.floor(limit));
    s.set(STORE_KEY_LIMIT, val);
    // Enforce the new limit immediately
    enforceLimit();
    return val;
}

/**
 * Get all history entries
 * @returns {Array<{url: string, title: string, timestamp: string, favicon: string}>}
 */
function getHistory() {
    const s = getStore();
    const history = s.get(STORE_KEY_HISTORY);
    if (Array.isArray(history)) {
        return history;
    }
    return [];
}

/**
 * Add a URL to history
 * @param {string} url
 * @param {string} title
 * @param {string} favicon
 */
function addToHistory(url, title, favicon) {
    if (!url) return;

    // Skip internal/blank URLs
    if (url.startsWith('about:') ||
        url.startsWith('chrome-extension://') ||
        url.startsWith('devtools://') ||
        url.startsWith('file://') ||
        url === 'about:blank') {
        return;
    }

    const s = getStore();
    let history = getHistory();

    // Don't add duplicate of the most recent entry
    if (history.length > 0 && history[0].url === url) {
        // Update title/favicon if changed
        if (title && title !== history[0].title) {
            history[0].title = title;
        }
        if (favicon && favicon !== history[0].favicon) {
            history[0].favicon = favicon;
        }
        s.set(STORE_KEY_HISTORY, history);
        return;
    }

    const entry = {
        url: url,
        title: title || url,
        favicon: favicon || '',
        timestamp: new Date().toISOString(),
    };

    // Add to beginning (most recent first)
    history.unshift(entry);

    // Enforce limit - keep only the last N items
    const limit = getHistoryLimit();
    if (history.length > limit) {
        history = history.slice(0, limit);
    }

    s.set(STORE_KEY_HISTORY, history);
    log.debug('HISTORY: Added entry ->', url.substring(0, 60), '(' + history.length + '/' + limit + ')');
}

/**
 * Enforce the history limit (trim excess entries)
 */
function enforceLimit() {
    const s = getStore();
    let history = getHistory();
    const limit = getHistoryLimit();

    if (history.length > limit) {
        history = history.slice(0, limit);
        s.set(STORE_KEY_HISTORY, history);
        log.debug('HISTORY: Trimmed to', limit, 'entries');
    }
}

/**
 * Clear all history
 */
function clearHistory() {
    const s = getStore();
    s.set(STORE_KEY_HISTORY, []);
    log.info('HISTORY: Cleared all history');
}

/**
 * Delete a specific history entry by index
 * @param {number} index
 */
function deleteHistoryEntry(index) {
    const s = getStore();
    let history = getHistory();
    if (index >= 0 && index < history.length) {
        history.splice(index, 1);
        s.set(STORE_KEY_HISTORY, history);
    }
}

/**
 * Initialize IPC handlers for history management
 */
export function initHistoryHandlers() {
    ipcMain.handle('history:get', async (event) => {
        return getHistory();
    });

    ipcMain.handle('history:add', async (event, { url, title, favicon }) => {
        addToHistory(url, title, favicon);
        return getHistory();
    });

    ipcMain.handle('history:clear', async (event) => {
        clearHistory();
        return { success: true };
    });

    ipcMain.handle('history:delete-entry', async (event, index) => {
        deleteHistoryEntry(index);
        return getHistory();
    });

    ipcMain.handle('history:get-limit', async (event) => {
        return getHistoryLimit();
    });

    ipcMain.handle('history:set-limit', async (event, limit) => {
        const newLimit = setHistoryLimit(limit);
        return { limit: newLimit, history: getHistory() };
    });

    log.info('HISTORY: IPC handlers registered');
}

export { addToHistory, getHistory, clearHistory, getHistoryLimit, setHistoryLimit };
