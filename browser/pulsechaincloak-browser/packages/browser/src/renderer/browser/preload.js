const { contextBridge, ipcRenderer } = require('electron');

import { injectBrowserAction } from 'electron-chrome-extensions/browser-action';
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
    loadUrl: (arg) => ipcRenderer.invoke('tab:load-url', arg),
    refreshTab: (arg) => ipcRenderer.invoke('tab:refresh-tab', arg),
    goHomeTab: (arg) => ipcRenderer.invoke('tab:gohome-tab', arg),
    newTab: () => ipcRenderer.invoke('tab:new-tab'),
        closeTab: (arg) => ipcRenderer.invoke('tab:close-tab', arg),
    onDidNavigate: (callback) => ipcRenderer.on('tab:did-navigate', callback),
    onDidNavigateInPage: (callback) =>
        ipcRenderer.on('tab:did-navigate-in-page', callback),
    onDidStartLoading: (callback) =>
        ipcRenderer.on('tab:did-start-loading', callback),
    onDidStopLoading: (callback) =>
        ipcRenderer.on('tab:did-stop-loading', callback),
    onPageTitleUpdated: (callback) =>
        ipcRenderer.on('tab:page-title-updated', callback),
    onPageFaviconUpdated: (callback) =>
        ipcRenderer.on('tab:page-favicon-updated', callback),
    onTabsFound: (callback) => ipcRenderer.on('tabs:tabs-found', callback),
    getCurrentTabs: () => ipcRenderer.invoke('tabs:get-current-tabs'),
    selectTab: (arg) => ipcRenderer.invoke('tab:select-tab', arg),
    onTabSelected: (callback) => ipcRenderer.on('tab:tab-selected', callback),
    onTabSizeChanged: (arg) => ipcRenderer.invoke('tab:tab-size-changed', arg),
    hideActiveTab: () => ipcRenderer.invoke('tab:hide-active'),
    showActiveTab: () => ipcRenderer.invoke('tab:show-active'),
});

// Ad & Tracker Blocking API
contextBridge.exposeInMainWorld('adblockApi', {
    getStats: () => ipcRenderer.invoke('adblock:get-stats'),
    getTabStats: (tabId) => ipcRenderer.invoke('adblock:get-tab-stats', tabId),
    resetStats: () => ipcRenderer.invoke('adblock:reset-stats'),
});

// History Management API
contextBridge.exposeInMainWorld('historyApi', {
    getHistory: () => ipcRenderer.invoke('history:get'),
    addToHistory: (entry) => ipcRenderer.invoke('history:add', entry),
    clearHistory: () => ipcRenderer.invoke('history:clear'),
    deleteEntry: (index) => ipcRenderer.invoke('history:delete-entry', index),
    getLimit: () => ipcRenderer.invoke('history:get-limit'),
    setLimit: (limit) => ipcRenderer.invoke('history:set-limit', limit),
});

// PulseChain Web3 Wallet API
contextBridge.exposeInMainWorld('walletApi', {
    createWallet: (password) => ipcRenderer.invoke('wallet:create', { password }),
    importWallet: (input, password) => ipcRenderer.invoke('wallet:import', { input, password }),
    unlockWallet: (password) => ipcRenderer.invoke('wallet:unlock', { password }),
    lockWallet: () => ipcRenderer.invoke('wallet:lock'),
    getWalletAddress: () => ipcRenderer.invoke('wallet:get-address'),
    getBalance: () => ipcRenderer.invoke('wallet:get-balance'),
    sendTransaction: (to, amount) => ipcRenderer.invoke('wallet:send-transaction', { to, amount }),
    getTokenBalance: (tokenAddress) => ipcRenderer.invoke('wallet:get-token-balance', { tokenAddress }),
    sendToken: (tokenAddress, to, amount) => ipcRenderer.invoke('wallet:send-token', { tokenAddress, to, amount }),
    addToken: (tokenAddress) => ipcRenderer.invoke('wallet:add-token', { tokenAddress }),
    getTokenList: () => ipcRenderer.invoke('wallet:get-token-list'),
    removeToken: (tokenAddress) => ipcRenderer.invoke('wallet:remove-token', { tokenAddress }),
});

// Node Control Panel API
contextBridge.exposeInMainWorld('nodeApi', {
    startNode: () => ipcRenderer.invoke('node:start'),
    stopNode: () => ipcRenderer.invoke('node:stop'),
    getNodeStatus: () => ipcRenderer.invoke('node:get-status'),
    getNodeLogs: (limit) => ipcRenderer.invoke('node:get-logs', { limit }),
    clearNodeLogs: () => ipcRenderer.invoke('node:clear-logs'),
    getNodeConfig: () => ipcRenderer.invoke('node:get-config'),
    configureNode: (config) => ipcRenderer.invoke('node:save-config', config),
    downloadBinary: () => ipcRenderer.invoke('node:download-binary'),
    getDownloadProgress: () => ipcRenderer.invoke('node:get-download-progress'),
    setBinaryPath: (path) => ipcRenderer.invoke('node:set-binary-path', path),
});

// Mesh Proxy API
contextBridge.exposeInMainWorld('meshApi', {
    enableMesh: () => ipcRenderer.invoke('mesh:enable'),
    disableMesh: () => ipcRenderer.invoke('mesh:disable'),
    getMeshStatus: () => ipcRenderer.invoke('mesh:get-status'),
    setProxyPort: (port) => ipcRenderer.invoke('mesh:set-port', { port }),
    setProxyType: (type) => ipcRenderer.invoke('mesh:set-type', { type }),
});

// dApp Spaces API
contextBridge.exposeInMainWorld('spacesApi', {
    getSpaces: () => ipcRenderer.invoke('spaces:get'),
    createSpace: (name, color, icon) => ipcRenderer.invoke('spaces:create', { name, color, icon }),
    deleteSpace: (id) => ipcRenderer.invoke('spaces:delete', { id }),
    renameSpace: (id, name) => ipcRenderer.invoke('spaces:rename', { id, name }),
    updateSpaceColor: (id, color) => ipcRenderer.invoke('spaces:update-color', { id, color }),
    switchSpace: (id) => ipcRenderer.invoke('spaces:switch', { id }),
    addDapp: (spaceId, name, url, icon) => ipcRenderer.invoke('spaces:add-dapp', { spaceId, name, url, icon }),
    removeDapp: (spaceId, url) => ipcRenderer.invoke('spaces:remove-dapp', { spaceId, url }),
    getActiveSpace: () => ipcRenderer.invoke('spaces:get'),
});

// Wallet-to-Wallet Decentralized Chat API
contextBridge.exposeInMainWorld('chatApi', {
    setWallet: (address, privateKey) => ipcRenderer.invoke('chat:set-wallet', { address, privateKey }),
    sendMessage: (peerAddress, text) => ipcRenderer.invoke('chat:send-message', { peerAddress, text }),
    getMessages: (peerAddress) => ipcRenderer.invoke('chat:get-messages', { peerAddress }),
    getConversations: () => ipcRenderer.invoke('chat:get-conversations'),
    startChat: (peerAddress) => ipcRenderer.invoke('chat:start-chat', { peerAddress }),
    markRead: (peerAddress) => ipcRenderer.invoke('chat:mark-read', { peerAddress }),
    getUnread: () => ipcRenderer.invoke('chat:get-unread'),
    disconnect: () => ipcRenderer.invoke('chat:disconnect'),
    onNewMessage: (callback) => ipcRenderer.on('chat:new-message', callback),
});

// IPFS Decentralized File Sharing API
contextBridge.exposeInMainWorld('ipfsApi', {
    uploadFile: (filePath) => ipcRenderer.invoke('ipfs:upload-file', { filePath }),
    uploadFiles: (filePaths) => ipcRenderer.invoke('ipfs:upload-files', { filePaths }),
    downloadFile: (cid, savePath) => ipcRenderer.invoke('ipfs:download-file', { cid, savePath }),
    getFiles: () => ipcRenderer.invoke('ipfs:get-files'),
    removeFile: (cid) => ipcRenderer.invoke('ipfs:remove-file', { cid }),
    getFileInfo: (cid) => ipcRenderer.invoke('ipfs:get-file-info', { cid }),
    getConfig: () => ipcRenderer.invoke('ipfs:get-config'),
    setConfig: (config) => ipcRenderer.invoke('ipfs:set-config', config),
    checkApi: () => ipcRenderer.invoke('ipfs:check-api'),
    openFileDialog: () => ipcRenderer.invoke('ipfs:open-file-dialog'),
});

// PulseCloak Token Payment API
contextBridge.exposeInMainWorld('tokenApi', {
    getTokenBalance: () => ipcRenderer.invoke('token:get-balance'),
    sendTokens: (to, amount) => ipcRenderer.invoke('token:send', { to, amount }),
    approveSpending: (spender, amount) => ipcRenderer.invoke('token:approve', { spender, amount }),
    getPaymentHistory: (limit) => ipcRenderer.invoke('token:get-history', { limit }),
    setPaymentRate: (rate) => ipcRenderer.invoke('token:set-rate', { rate }),
    setTokenAddress: (address) => ipcRenderer.invoke('token:set-address', { address }),
    getTokenInfo: () => ipcRenderer.invoke('token:get-info'),
    enableAutoPay: () => ipcRenderer.invoke('token:enable-autopay'),
    disableAutoPay: () => ipcRenderer.invoke('token:disable-autopay'),
    getAutoPayStatus: () => ipcRenderer.invoke('token:get-autopay-status'),
    estimateGas: (to, amount) => ipcRenderer.invoke('token:estimate-gas', { to, amount }),
});

// Bandwidth Sharing & Rewards API
contextBridge.exposeInMainWorld('bandwidthApi', {
    getStats: () => ipcRenderer.invoke('bandwidth:get-stats'),
    enableSharing: () => ipcRenderer.invoke('bandwidth:enable-sharing'),
    disableSharing: () => ipcRenderer.invoke('bandwidth:disable-sharing'),
    getSharingStatus: () => ipcRenderer.invoke('bandwidth:get-sharing-status'),
    getRewards: () => ipcRenderer.invoke('bandwidth:get-rewards'),
    claimRewards: () => ipcRenderer.invoke('bandwidth:claim-rewards'),
    getHistory: (days) => ipcRenderer.invoke('bandwidth:get-history', { days }),
    setRewardRate: (rate) => ipcRenderer.invoke('bandwidth:set-reward-rate', { rate }),
});
