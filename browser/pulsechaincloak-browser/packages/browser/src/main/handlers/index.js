import {
    app,
    session,
    ipcMain,
    nativeTheme,
    Notification,
    BrowserWindow,
} from 'electron';

import AppUpdater from '../updater';
import { getTabSession } from '../session';
import tabsManager from '../tabs';
import { getExtensionFoldersAndManifests } from '../chrome-extensions';
import { initAdBlockHandlers } from '../adblock';
import { initHistoryHandlers, addToHistory } from '../history';
import { initWalletHandlers } from '../wallet';
import { initNodeManagerHandlers } from '../node-manager';
import { initMeshProxyHandlers } from '../mesh-proxy';
import { initSpacesHandlers } from '../spaces';
import { initChatHandlers } from '../chat';
import { initIpfsHandlers } from '../ipfs';
import { initTokenHandlers } from '../token';
import { initBandwidthHandlers } from '../bandwidth';

const path = require('path');

let appUpdater = new AppUpdater();

/**
 * Determine if a string is a search query rather than a URL
 * @param {string} input - User input from URL bar
 * @returns {boolean}
 */
function isSearchQuery(input) {
    // If it has a protocol, it's a URL
    if (input.startsWith('http://') || input.startsWith('https://')) {
        return false;
    }
    // If it has no dots or spaces, likely a search
    if (!input.includes('.')) {
        return true;
    }
    // If it has spaces, it's a search query
    if (input.includes(' ')) {
        return true;
    }
    // If it looks like a domain (e.g., "example.com"), it's a URL
    return false;
}

const initMain = async () => {
    // Initialize adblock and history IPC handlers
    initAdBlockHandlers();
    initHistoryHandlers();
    initWalletHandlers();
    initNodeManagerHandlers();
    initMeshProxyHandlers();
    initSpacesHandlers();
    initChatHandlers();
    initIpfsHandlers();
    initTokenHandlers();
    initBandwidthHandlers();

    ipcMain.handle('tab:select-tab', async (event, arg) => {
        tabsManager.selectTab(arg);
    });

    ipcMain.handle('tab:load-url', async (event, arg) => {
        let url = arg.url;

        // Check if this is a search query -> redirect to DuckDuckGo
        if (isSearchQuery(url)) {
            url = 'https://duckduckgo.com/?q=' + encodeURIComponent(url);
        } else {
            const protocol = 'https://';
            const unsafeProtocol = 'http://';

            if (url.startsWith(unsafeProtocol)) {
                url = url.split(unsafeProtocol)[1];
            }

            if (!url.startsWith(protocol)) {
                url = protocol.concat(url);
            }
        }

        arg.url = url;

        tabsManager.loadInTab(arg);
    });

    ipcMain.handle('tab:refresh-tab', async (event, arg) => {
        tabsManager.refreshTab(arg);
    });

    ipcMain.handle('tab:gohome-tab', async (event, arg) => {
        tabsManager.goHomeTab(arg);
    });

    ipcMain.handle('tab:tab-size-changed', async (event, arg) => {
        tabsManager.resizeTab(arg);
    });

    ipcMain.handle('tabs:get-current-tabs', async (evt, arg) => {
        const tabIds = [];
        const tabs = await tabsManager.getCurrentTabs();
        tabs.forEach((tab) => tabIds.push(tab.id));
        return tabIds;
    });

    ipcMain.handle('tab:new-tab', async (event, arg) => {
        const tab = await tabsManager.createTab({});
        return tab.id;
    });

    ipcMain.handle('extensions:get-extensions', async (evt, arg) => {
        const extensionsPath = path.join(__dirname, '../../../../extensions');
        const extensions = getExtensionFoldersAndManifests(extensionsPath);
        return extensions;
    });

    ipcMain.handle('extensions:activate-extension', async (evt, arg) => {
        console.log('activate-extension', arg);
        const tabSession = await getTabSession();
        const result = await tabSession.loadExtension(arg.extensionPath);
        console.log('Extension loaded', result);
        return;
    });


    // ===== BROWSERVIEW HIDE/SHOW FOR PANEL OVERLAYS =====
    ipcMain.handle('tab:hide-active', async (event) => {
        const tabs = tabsManager.getCurrentTabs();
        tabs.forEach((tab) => {
            tab.hide();
        });
    });

    ipcMain.handle('tab:close-tab', async (event, arg) => {
        const tabId = arg.id;
        const tabsList = tabsManager.getCurrentTabs();
        // Don't close if it's the last tab - create a new one first
        if (tabsList.size <= 1) {
            await tabsManager.loadInTab({});
        }
        await tabsManager.removeTab(tabId);
        // Select another tab
        const remaining = tabsManager.getCurrentTabs();
        if (remaining.size > 0) {
            const nextId = remaining.keys().next().value;
            tabsManager.selectTab(nextId);
        }
        return true;
    });

    ipcMain.handle('tab:show-active', async (event) => {
        const selected = tabsManager.selected;
        if (selected) {
            tabsManager.showTab(selected);
        }
    });

    ipcMain.handle('close-app', (evt, arg) => {
        app.quit();
    });

    ipcMain.handle('dark-mode:toggle', () => {
        if (nativeTheme.shouldUseDarkColors) {
            nativeTheme.themeSource = 'light';
        } else {
            nativeTheme.themeSource = 'dark';
        }
        return nativeTheme.shouldUseDarkColors;
    });

    ipcMain.handle('dark-mode:system', () => {
        nativeTheme.themeSource = 'system';
    });

    ipcMain.handle('window-controls:minimize-window', async (evt, arg) => {
        const webContents = evt.sender;
        const window = BrowserWindow.fromWebContents(webContents);
        window.minimize();
    });

    ipcMain.handle('window-controls:maximize-window', async (evt, arg) => {
        const webContents = evt.sender;
        const window = BrowserWindow.fromWebContents(webContents);
        window.maximize();
    });

    ipcMain.handle('window-controls:restore-window', async (evt, arg) => {
        const webContents = evt.sender;
        const window = BrowserWindow.fromWebContents(webContents);
        window.restore();
    });

    ipcMain.handle('window-controls:close-window', async (evt, arg) => {
        const webContents = evt.sender;
        const window = BrowserWindow.fromWebContents(webContents);
        console.log('Window', window);
        window.close();
    });

    ipcMain.on('clear-cache', async (evt, arg) => {
        await session.defaultSession.clearCache();
    });

    ipcMain.on('notification', async (evt, arg) => {
        new Notification({ ...arg }).show();
    });

    ipcMain.on('updater:check-update', (event) => {
        appUpdater.checkForUpdates();
    });

    ipcMain.on('updater:download-update', (event) => {
        appUpdater.downloadUpdate();
    });

    ipcMain.handle('updater:get-current-version', (event) => {
        return app.getVersion();
    });
};

export default initMain;
