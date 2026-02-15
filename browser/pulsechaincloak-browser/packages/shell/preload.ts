import { injectBrowserAction } from 'electron-chrome-extensions/browser-action'

const { contextBridge, ipcRenderer } = require('electron')

// Expose navigation API for ALL chrome-extension:// pages (including new-tab.html)
if (location.protocol === 'chrome-extension:') {
  contextBridge.exposeInMainWorld('pulseCloakNav', {
    navigate: function(url) { return ipcRenderer.invoke('navigate:url', url) },
  })
}

// Inject <browser-action-list> element into WebUI
if (location.protocol === 'chrome-extension:' && location.pathname === '/webui.html') {
  injectBrowserAction()

  // Expose PulseCloak APIs to the WebUI renderer
  contextBridge.exposeInMainWorld('pulseCloak', {
    // Wallet API
    wallet: {
      getState: function() { return ipcRenderer.invoke('wallet:getState') },
      getNetworks: function() { return ipcRenderer.invoke('wallet:getNetworks') },
      create: function() { return ipcRenderer.invoke('wallet:create') },
      importMnemonic: function(mnemonic) { return ipcRenderer.invoke('wallet:importMnemonic', mnemonic) },
      importPrivateKey: function(pk) { return ipcRenderer.invoke('wallet:importPrivateKey', pk) },
      getBalance: function() { return ipcRenderer.invoke('wallet:getBalance') },
      getCloakBalance: function() { return ipcRenderer.invoke('wallet:getCloakBalance') },
      send: function(to, amount) { return ipcRenderer.invoke('wallet:send', to, amount) },
      switchNetwork: function(network) { return ipcRenderer.invoke('wallet:switchNetwork', network) },
      save: function(password) { return ipcRenderer.invoke('wallet:save', password) },
      load: function(password) { return ipcRenderer.invoke('wallet:load', password) },
      disconnect: function() { return ipcRenderer.invoke('wallet:disconnect') },
    },

    // Sidebar IPC
    sidebar: {
      walletToggle: function(isOpen) { ipcRenderer.send('sidebar:walletToggle', isOpen) },
    },
  })
}
