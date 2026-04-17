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

const path = require('path');
const log = require('electron-log');

let appUpdater = new AppUpdater();

// Smart URL bar resolution.
// - URLs with scheme → use as-is
// - Bare domain-like strings (e.g. `example.com`) → prepend https://
// - Everything else → DuckDuckGo search
const SCHEME_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//;
const BARE_DOMAIN_RE = /^[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}(\/.*)?$/;
const LOCALHOST_RE = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/.*)?$/;

function resolveUserInputToUrl(input) {
    if (!input) return 'https://duckduckgo.com';
    const trimmed = String(input).trim();
    if (!trimmed) return 'https://duckduckgo.com';

    if (SCHEME_RE.test(trimmed)) return trimmed;
    if (LOCALHOST_RE.test(trimmed)) return `http://${trimmed}`;
    if (BARE_DOMAIN_RE.test(trimmed)) return `https://${trimmed}`;

    // Fallback: treat as search query.
    return `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`;
}

const initMain = async () => {
    ipcMain.handle('tab:select-tab', async (event, arg) => {
        tabsManager.selectTab(arg);
    });

    ipcMain.handle('tab:load-url', async (event, arg) => {
        const resolved = resolveUserInputToUrl(arg?.url);
        tabsManager.loadInTab({ ...arg, url: resolved });
    });

    ipcMain.handle('tab:refresh-tab', async (event, arg) => {
        tabsManager.refreshTab(arg);
    });

    ipcMain.handle('tab:gohome-tab', async (event, arg) => {
        tabsManager.goHomeTab(arg);
    });

    ipcMain.handle('tab:goback-tab', async (event, arg) => {
        tabsManager.goBackTab(arg);
    });

    ipcMain.handle('tab:goforward-tab', async (event, arg) => {
        tabsManager.goForwardTab(arg);
    });

    ipcMain.handle('tab:stop-tab', async (event, arg) => {
        tabsManager.stopTab(arg);
    });

    ipcMain.handle('tab:get-nav-state', async (event, arg) => {
        return tabsManager.getTabNavState(arg);
    });

    ipcMain.handle('tab:tab-size-changed', async (event, arg) => {
        tabsManager.resizeTab(arg);
    });

    ipcMain.handle('tab:open-new-tab', async (event, arg) => {
        // Coerce arg → plain string URL (the renderer may pass a string, an
        // object, or accidentally a non-serializable event). Never return the
        // raw Tab instance — it contains non-cloneable BrowserView refs which
        // crash the IPC layer with `An object could not be cloned`.
        let rawUrl = '';
        if (typeof arg === 'string') rawUrl = arg;
        else if (arg && typeof arg === 'object') rawUrl = String(arg.url || '');
        const url = rawUrl
            ? resolveUserInputToUrl(rawUrl)
            : 'https://duckduckgo.com';
        try {
            const tab = await tabsManager.openNewTab({ url });
            return { ok: true, id: tab?.id ?? null, url };
        } catch (err) {
            log.error('tab:open-new-tab failed', err);
            return { ok: false, error: String(err?.message || err) };
        }
    });

    ipcMain.handle('tab:close-tab', async (event, arg) => {
        return tabsManager.closeTab(arg?.id);
    });

    ipcMain.handle('tabs:get-current-tabs', async () => {
        const tabs = await tabsManager.getCurrentTabs();
        return Array.from(tabs.keys());
    });

    ipcMain.handle('extensions:get-extensions', async () => {
        const extensionsPath = path.join(__dirname, '../../../../extensions');
        return getExtensionFoldersAndManifests(extensionsPath);
    });

    ipcMain.handle('extensions:activate-extension', async (evt, arg) => {
        log.info('activate-extension', arg);
        const tabSession = await getTabSession();
        const result = await tabSession.loadExtension(arg.extensionPath);
        log.info('Extension loaded', result?.id);
        return result;
    });

    ipcMain.handle('close-app', () => {
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

    ipcMain.handle('window-controls:minimize-window', async (evt) => {
        const window = BrowserWindow.fromWebContents(evt.sender);
        window?.minimize();
    });

    ipcMain.handle('window-controls:maximize-window', async (evt) => {
        const window = BrowserWindow.fromWebContents(evt.sender);
        if (!window) return;
        if (window.isMaximized()) {
            window.unmaximize();
        } else {
            window.maximize();
        }
    });

    ipcMain.handle('window-controls:restore-window', async (evt) => {
        const window = BrowserWindow.fromWebContents(evt.sender);
        window?.restore();
    });

    ipcMain.handle('window-controls:close-window', async (evt) => {
        const window = BrowserWindow.fromWebContents(evt.sender);
        window?.close();
    });

    ipcMain.on('clear-cache', async () => {
        await session.defaultSession.clearCache();
    });

    ipcMain.on('notification', async (evt, arg) => {
        new Notification({ ...arg }).show();
    });

    ipcMain.on('updater:check-update', () => {
        appUpdater.checkForUpdates();
    });

    ipcMain.on('updater:download-update', () => {
        appUpdater.downloadUpdate();
    });

    ipcMain.handle('updater:get-current-version', () => {
        return app.getVersion();
    });
};

export default initMain;
