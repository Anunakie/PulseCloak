import { injectBrowserAction } from 'electron-chrome-extensions/browser-action'

const { contextBridge, ipcRenderer } = require('electron')

// Inject <browser-action-list> element into WebUI
if (location.protocol === 'chrome-extension:' && location.pathname === '/webui.html') {
  injectBrowserAction()

  // Expose PulseCloak APIs to the WebUI renderer
  contextBridge.exposeInMainWorld('pulseCloak', {
    // Ad Blocker API
    adblocker: {
      getState: function() { return ipcRenderer.invoke('adblocker:getState') },
      toggle: function(enabled) { return ipcRenderer.invoke('adblocker:toggle', enabled) },
      resetCount: function() { return ipcRenderer.invoke('adblocker:resetCount') },
      onUpdate: function(callback) {
        var handler = function(_event, data) { callback(data) }
        ipcRenderer.on('adblocker:update', handler)
        return function() { ipcRenderer.removeListener('adblocker:update', handler) }
      },
    },

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
