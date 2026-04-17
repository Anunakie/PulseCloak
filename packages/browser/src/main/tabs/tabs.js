import { BrowserView } from 'electron';
import events from '../events';
import { getTabSession } from '../session';

import windowManager from '../window';
import {
    addTabToExtensions,
    selectTabInExtensions,
} from '../chrome-extensions';
const log = require('electron-log');

// Height (px) of the browser chrome above the BrowserView.
// Header (36) + tab strip (36) + toolbar (52) + small gap = 128.
const TOP_OFFSET = 128;
// Width (px) of the left sidebar (dApp Spaces).
const LEFT_OFFSET = 64;

class Options {
    static BROWSER_TAB = {
        backgroundColor: '#0a0e1a',
        transparent: false,
        frame: false,
        hasShadow: false,
        minimizable: false,
        maximizable: false,
        closeable: false,
        webPreferences: {
            contextIsolation: true,
            sandbox: true,
            nodeIntegration: false,
            scrollBounce: true,
            navigateOnDragDrop: true,
            safeDialogs: true,
            devTools: true,
        },
    };
}

class Tab {
    constructor(options) {
        this.window = options.window;
        this.init();
    }

    load(url) {
        if (url) {
            log.debug('TAB: ', this.id, ' loading url ', url);
            if (!this.home) this.home = url;
            this.view.webContents.loadURL(url);
            events.postEvent('tab:tab-loaded', { tabId: this.id });
        }
    }

    goHome() {
        this.load(this.home || 'pulsechaincloak://newtab');
    }

    goBack() {
        if (this.view?.webContents?.canGoBack()) {
            this.view.webContents.goBack();
        }
    }

    goForward() {
        if (this.view?.webContents?.canGoForward()) {
            this.view.webContents.goForward();
        }
    }

    getNavState() {
        const wc = this.view?.webContents;
        if (!wc) {
            return { canGoBack: false, canGoForward: false, url: '', isLoading: false };
        }
        return {
            canGoBack: wc.canGoBack(),
            canGoForward: wc.canGoForward(),
            url: wc.getURL(),
            isLoading: wc.isLoading(),
        };
    }

    init() {
        const options = Options.BROWSER_TAB;
        options.webPreferences.session = getTabSession();
        this.view = new BrowserView(options);
        this.id = this.view.webContents.id;
        this.view.setBackgroundColor('#0a0e1a');

        this.view.webContents.on('did-start-loading', () => {
            events.postEvent('tab:did-start-loading', { tabId: this.id });
        });
        this.view.webContents.on('did-stop-loading', () => {
            events.postEvent('tab:did-stop-loading', { tabId: this.id });
        });
        this.view.webContents.on('found-in-page', (event, result) => {
            events.postEvent('tab:found-in-page', result);
            if (result.finalUpdate) {
                this.view.webContents.stopFindInPage('keepSelection');
            }
        });
        this.view.webContents.on('did-navigate', (event, url) => {
            this.url = url;
            events.postEvent('tab:did-navigate', {
                url,
                tabId: this.id,
                canGoBack: this.view.webContents.canGoBack(),
                canGoForward: this.view.webContents.canGoForward(),
            });
        });

        this.view.webContents.on('page-favicon-updated', (event, favicons) => {
            events.postEvent('tab:page-favicon-updated', {
                icons: favicons,
                tabId: this.id,
            });
        });

        this.view.webContents.on('page-title-updated', (event, title) => {
            this.title = title;
            events.postEvent('tab:page-title-updated', {
                title,
                tabId: this.id,
            });
        });

        this.view.webContents.on(
            'did-navigate-in-page',
            (event, url, isMainFrame) => {
                events.postEvent('tab:did-navigate-in-page', {
                    isMainFrame,
                    url,
                    tabId: this.id,
                    canGoBack: this.view.webContents.canGoBack(),
                    canGoForward: this.view.webContents.canGoForward(),
                });
                this.url = url;
            }
        );

        this.view.webContents.on(
            'did-fail-load',
            (event, errorCode, errorDescription, validatedURL) => {
                // Ignore aborted loads (user-initiated navigation cancels).
                if (errorCode === -3) return;
                events.postEvent('tab:did-fail-load', {
                    link: validatedURL,
                    errorCode,
                    errorDescription,
                    tabId: this.id,
                });
            }
        );

        this.view.webContents.on('render-process-gone', (event, details) => {
            log.error('Render process gone: ', details);
        });

        this.view.webContents.on('plugin-crashed', (event, name, version) => {
            log.error('Plugin crashed: ', name, version);
        });

        // Open links that request a new window as new tabs in our browser.
        this.view.webContents.setWindowOpenHandler((details) => {
            // chrome-extension:// popups are handled via createWindow()
            // in chrome-extensions/index.js — don't hijack those.
            if (details.url && details.url.startsWith('chrome-extension://')) {
                return { action: 'allow' };
            }
            events.postEvent('tab:open-new-tab', { url: details.url });
            return { action: 'deny' };
        });
    }

    async show() {
        if (this.isShowing) return;
        const window = await windowManager.getMainWindow();
        window.addBrowserView(this.view);
        const [windowWidth, windowHeight] = window.getContentSize();
        const width = Math.max(0, windowWidth - LEFT_OFFSET);
        const height = Math.max(0, windowHeight - TOP_OFFSET);
        this.resize(LEFT_OFFSET, TOP_OFFSET, width, height);
        this.isShowing = true;
    }

    async hide() {
        if (!this.isShowing) return;
        this.isShowing = false;
        const window = await windowManager.getMainWindow();
        if (!window || window.isDestroyed()) return;
        if (this.view !== null) {
            window.removeBrowserView(this.view);
        }
    }

    resize(x, y, width, height) {
        this.view.setBounds({ x, y, width, height });
        this.view.setAutoResize({ width: true, height: true });
    }

    refresh() {
        this.view?.webContents?.reload();
    }

    stop() {
        this.view?.webContents?.stop();
    }

    destroy() {
        try {
            this.view?.webContents?.close?.();
        } catch (e) {
            log.warn('Tab destroy failed', e);
        }
    }
}

class TabsManager {
    constructor() {
        this.init();
    }

    init() {
        this.tabList = new Map();
    }

    getCurrentTabs() {
        return this.tabList;
    }

    refreshTab(arg) {
        const tab = this.getTab(arg?.id);
        tab?.refresh();
    }

    goHomeTab(arg) {
        const tab = this.getTab(arg?.id);
        tab?.goHome();
    }

    goBackTab(arg) {
        const tab = this.getTab(arg?.id);
        tab?.goBack();
    }

    goForwardTab(arg) {
        const tab = this.getTab(arg?.id);
        tab?.goForward();
    }

    stopTab(arg) {
        const tab = this.getTab(arg?.id);
        tab?.stop();
    }

    getTabNavState(arg) {
        const tab = this.getTab(arg?.id);
        return tab ? tab.getNavState() : null;
    }

    resizeTab(arg) {
        const { id, x, y, width, height } = arg;
        const tab = this.getTab(id);
        tab?.resize(x, y, width, height);
    }

    getTab(tabId) {
        return this.tabList.get(tabId);
    }

    selectTab(tabId) {
        const tab = this.getTab(tabId);
        if (tab) {
            this.selected = tabId;
            this.showTab(tabId);
            selectTabInExtensions(tab);
            events.postEvent('tab:tab-selected', tabId);
        }
    }

    async createTab(options) {
        let tab = this.getTab(options.id);
        if (!tab) {
            options.window = await windowManager.getMainWindow();
            tab = new Tab(options);
            log.debug('TABSMANAGER: Creating Tab ', tab.id);
            this.tabList.set(tab.id, tab);
            addTabToExtensions(tab);
        }

        tab.view.webContents.on('destroyed', () => {
            log.debug('Tab Destroyed: ', tab.id);
            this.tabList.delete(tab.id);
            events.postEvent(
                'tabs:tabs-found',
                Array.from(this.tabList.keys())
            );
        });

        events.postEvent('tabs:tabs-found', Array.from(this.tabList.keys()));
        if (!options.extensionId) {
            this.selectTab(tab.id);
        }
        return tab;
    }

    async loadInTab(options) {
        let tab = this.getTab(options.id);
        if (!tab) {
            tab = await this.createTab(options);
        }
        log.debug('TABSMANAGER: Loading Tab ', tab.id);
        tab.extensionId = options.extensionId;
        tab.load(options.url);
        this.showTab(tab.id);
        return tab;
    }

    async openNewTab(options = {}) {
        const url = options.url || 'pulsechaincloak://newtab';
        return this.loadInTab({ url });
    }

    async showTab(tabId) {
        log.debug('TABSMANAGER: Showing Tab ', tabId);
        this.tabList.forEach((tab) => {
            if (tab.id !== tabId) {
                tab.hide();
            } else {
                tab.show();
            }
        });
    }

    async closeTab(tabId) {
        const tab = this.getTab(tabId);
        if (!tab) return;
        await tab.hide();
        tab.destroy();
        this.tabList.delete(tabId);

        // Auto-select another tab if any remain.
        const remaining = Array.from(this.tabList.keys());
        if (remaining.length > 0) {
            this.selectTab(remaining[remaining.length - 1]);
        }
        events.postEvent('tabs:tabs-found', remaining);
    }

    async removeTab(tabId) {
        return this.closeTab(tabId);
    }
}

export default new TabsManager();
