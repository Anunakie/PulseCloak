const { contextBridge, ipcRenderer } = require('electron');

import { injectBrowserAction } from '../../../../electron-chrome-extensions/dist/browser-action';
injectBrowserAction();

contextBridge.exposeInMainWorld('darkMode', {
    toggle: () => ipcRenderer.invoke('dark-mode:toggle'),
    system: () => ipcRenderer.invoke('dark-mode:system'),
});

contextBridge.exposeInMainWorld('windowControls', {
    minimize: () => ipcRenderer.invoke('window-controls:minimize-window'),
    maximize: () => ipcRenderer.invoke('window-controls:maximize-window'),
    restore: () => ipcRenderer.invoke('window-controls:restore-window'),
    close: () => ipcRenderer.invoke('window-controls:close-window'),
});

contextBridge.exposeInMainWorld('electronApi', {
    // Tab management
    loadUrl: (arg) => ipcRenderer.invoke('tab:load-url', arg),
    refreshTab: (arg) => ipcRenderer.invoke('tab:refresh-tab', arg),
    goHomeTab: (arg) => ipcRenderer.invoke('tab:gohome-tab', arg),
    goBackTab: (arg) => ipcRenderer.invoke('tab:goback-tab', arg),
    goForwardTab: (arg) => ipcRenderer.invoke('tab:goforward-tab', arg),
    stopTab: (arg) => ipcRenderer.invoke('tab:stop-tab', arg),
    getTabNavState: (arg) => ipcRenderer.invoke('tab:get-nav-state', arg),
    openNewTab: (arg) => ipcRenderer.invoke('tab:open-new-tab', arg),
    closeTab: (arg) => ipcRenderer.invoke('tab:close-tab', arg),
    selectTab: (arg) => ipcRenderer.invoke('tab:select-tab', arg),
    onTabSizeChanged: (arg) => ipcRenderer.invoke('tab:tab-size-changed', arg),
    getCurrentTabs: () => ipcRenderer.invoke('tabs:get-current-tabs'),

    // Event listeners
    onDidNavigate: (callback) => ipcRenderer.on('tab:did-navigate', callback),
    onDidNavigateInPage: (callback) =>
        ipcRenderer.on('tab:did-navigate-in-page', callback),
    onTabsFound: (callback) => ipcRenderer.on('tabs:tabs-found', callback),
    onTabSelected: (callback) => ipcRenderer.on('tab:tab-selected', callback),
    onTabTitleUpdated: (callback) =>
        ipcRenderer.on('tab:page-title-updated', callback),
    onTabFaviconUpdated: (callback) =>
        ipcRenderer.on('tab:page-favicon-updated', callback),
    onTabStartLoading: (callback) =>
        ipcRenderer.on('tab:did-start-loading', callback),
    onTabStopLoading: (callback) =>
        ipcRenderer.on('tab:did-stop-loading', callback),
});
