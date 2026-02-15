class WebUI {
  windowId = -1
  activeTabId = -1
  /** @type {chrome.tabs.Tab[]} */
  tabList = []
  activeSpace = 'browse'
  walletOpen = false

  constructor() {
    const $ = document.querySelector.bind(document)

    this.$ = {
      tabList: $('#tabstrip .tab-list'),
      tabTemplate: $('#tabtemplate'),
      createTabButton: $('#createtab'),
      goBackButton: $('#goback'),
      goForwardButton: $('#goforward'),
      reloadButton: $('#reload'),
      addressUrl: $('#addressurl'),

      browserActions: $('#actions'),

      minimizeButton: $('#minimize'),
      maximizeButton: $('#maximize'),
      closeButton: $('#close'),

      // Sidebar elements
      sidebarSpaces: document.querySelectorAll('.space-icon'),
      addSpaceButton: $('#addSpace'),
      settingsButton: $('#settingsBtn'),
      profileButton: $('#profileBtn'),


      // Wallet sidebar
      walletToggleBtn: $('#walletToggleBtn'),
      walletSidebar: $('#walletSidebar'),
      walletCloseBtn: $('#walletCloseBtn'),
      walletNetwork: $('#walletNetwork'),

      // Wallet - not connected
      walletNotConnected: $('#walletNotConnected'),
      walletPassword: $('#walletPassword'),
      walletLoadBtn: $('#walletLoadBtn'),
      walletCreateBtn: $('#walletCreateBtn'),
      walletImportBtn: $('#walletImportBtn'),
      walletImportPanel: $('#walletImportPanel'),
      walletImportInput: $('#walletImportInput'),
      walletImportConfirmBtn: $('#walletImportConfirmBtn'),
      walletImportCancelBtn: $('#walletImportCancelBtn'),

      // Wallet - connected
      walletConnected: $('#walletConnected'),
      walletAddress: $('#walletAddress'),
      walletCopyAddr: $('#walletCopyAddr'),
      walletBalanceAmount: $('#walletBalanceAmount'),
      walletBalanceCurrency: $('#walletBalanceCurrency'),
      walletCloakBalance: $('#walletCloakBalance'),
      walletRefreshBtn: $('#walletRefreshBtn'),
      walletSendTo: $('#walletSendTo'),
      walletSendAmount: $('#walletSendAmount'),
      walletSendBtn: $('#walletSendBtn'),
      walletSavePassword: $('#walletSavePassword'),
      walletSaveBtn: $('#walletSaveBtn'),
      walletDisconnectBtn: $('#walletDisconnectBtn'),

      // Wallet - mnemonic display
      walletMnemonicPanel: $('#walletMnemonicPanel'),
      walletMnemonicDisplay: $('#walletMnemonicDisplay'),
      walletMnemonicDoneBtn: $('#walletMnemonicDoneBtn'),

      // Wallet - status
      walletStatus: $('#walletStatus'),
    }

    // Tab controls
    this.$.createTabButton.addEventListener('click', () => chrome.tabs.create())
    this.$.goBackButton.addEventListener('click', () => chrome.tabs.goBack())
    this.$.goForwardButton.addEventListener('click', () => chrome.tabs.goForward())
    this.$.reloadButton.addEventListener('click', () => chrome.tabs.reload())
    this.$.addressUrl.addEventListener('keypress', this.onAddressUrlKeyPress.bind(this))
    this.$.addressUrl.addEventListener('focus', this.onAddressUrlFocus.bind(this))

    // Window controls
    this.$.minimizeButton.addEventListener('click', () =>
      chrome.windows.get(chrome.windows.WINDOW_ID_CURRENT, (win) => {
        chrome.windows.update(win.id, { state: win.state === 'minimized' ? 'normal' : 'minimized' })
      }),
    )
    this.$.maximizeButton.addEventListener('click', () =>
      chrome.windows.get(chrome.windows.WINDOW_ID_CURRENT, (win) => {
        chrome.windows.update(win.id, { state: win.state === 'maximized' ? 'normal' : 'maximized' })
      }),
    )
    this.$.closeButton.addEventListener('click', () => chrome.windows.remove())

    // Sidebar controls
    this.initSidebar()


    // Wallet
    this.initWallet()

    const platformClass = `platform-${navigator.userAgentData.platform.toLowerCase()}`
    document.body.classList.add(platformClass)

    this.initTabs()
  }

  // ===== SIDEBAR =====

  initSidebar() {
    // Space switching
    this.$.sidebarSpaces.forEach((spaceEl) => {
      spaceEl.addEventListener('click', () => {
        this.setActiveSpace(spaceEl.dataset.space)
      })
    })

    // Add space button
    this.$.addSpaceButton.addEventListener('click', () => {
      this.addNewSpace()
    })

    // Settings button
    this.$.settingsButton.addEventListener('click', () => {
      chrome.tabs.create({ url: 'chrome://settings' })
    })

    // Profile button
    this.$.profileButton.addEventListener('click', () => {
      console.log('Profile clicked')
    })
  }

  setActiveSpace(spaceName) {
    this.activeSpace = spaceName
    document.querySelectorAll('.space-icon').forEach((el) => {
      if (el.dataset.space === spaceName) {
        el.classList.add('active')
      } else {
        el.classList.remove('active')
      }
    })
  }

  addNewSpace() {
    const spaceEmojis = ['\uD83D\uDCBB', '\uD83C\uDFAE', '\uD83D\uDCDA', '\uD83C\uDFA8', '\uD83D\uDE80', '\uD83C\uDF10']
    const spacesContainer = document.querySelector('.sidebar-spaces')
    const addBtn = document.querySelector('#addSpace')
    const existingSpaces = spacesContainer.querySelectorAll('.space-icon').length
    const emoji = spaceEmojis[existingSpaces % spaceEmojis.length]
    const spaceName = `space-${existingSpaces + 1}`

    const newSpace = document.createElement('div')
    newSpace.className = 'space-icon'
    newSpace.dataset.space = spaceName
    newSpace.title = `Space ${existingSpaces + 1}`
    newSpace.textContent = emoji
    newSpace.addEventListener('click', () => {
      this.setActiveSpace(spaceName)
    })

    spacesContainer.insertBefore(newSpace, addBtn)
  }

  // ===== WALLET =====

  initWallet() {
    // Toggle wallet sidebar
    this.$.walletToggleBtn.addEventListener('click', () => {
      this.toggleWallet()
    })

    this.$.walletCloseBtn.addEventListener('click', () => {
      this.toggleWallet(false)
    })

    // Network selector
    this.$.walletNetwork.addEventListener('change', () => {
      this.switchWalletNetwork()
    })

    // Create wallet
    this.$.walletCreateBtn.addEventListener('click', () => {
      this.createWallet()
    })

    // Import wallet - show panel
    this.$.walletImportBtn.addEventListener('click', () => {
      this.$.walletImportPanel.classList.remove('hidden')
    })

    this.$.walletImportCancelBtn.addEventListener('click', () => {
      this.$.walletImportPanel.classList.add('hidden')
      this.$.walletImportInput.value = ''
    })

    this.$.walletImportConfirmBtn.addEventListener('click', () => {
      this.importWallet()
    })

    // Load saved wallet
    this.$.walletLoadBtn.addEventListener('click', () => {
      this.loadWallet()
    })

    // Allow Enter key on password field
    this.$.walletPassword.addEventListener('keypress', (e) => {
      if (e.code === 'Enter') this.loadWallet()
    })

    // Copy address
    this.$.walletCopyAddr.addEventListener('click', () => {
      this.copyWalletAddress()
    })

    // Refresh balance
    this.$.walletRefreshBtn.addEventListener('click', () => {
      this.refreshBalance()
    })

    // Send
    this.$.walletSendBtn.addEventListener('click', () => {
      this.sendTransaction()
    })

    // Save wallet
    this.$.walletSaveBtn.addEventListener('click', () => {
      this.saveWallet()
    })

    // Disconnect
    this.$.walletDisconnectBtn.addEventListener('click', () => {
      this.disconnectWallet()
    })

    // Mnemonic done
    this.$.walletMnemonicDoneBtn.addEventListener('click', () => {
      this.$.walletMnemonicPanel.classList.add('hidden')
      this.$.walletMnemonicDisplay.textContent = ''
    })

    // Check initial wallet state
    this.checkWalletState()
  }

  toggleWallet(forceState) {
    const isOpen = typeof forceState === 'boolean' ? forceState : !this.walletOpen
    this.walletOpen = isOpen

    if (isOpen) {
      this.$.walletSidebar.classList.add('open')
      this.$.walletToggleBtn.classList.add('active')
    } else {
      this.$.walletSidebar.classList.remove('open')
      this.$.walletToggleBtn.classList.remove('active')
    }

    // Notify main process to adjust tab bounds
    if (window.pulseCloak && window.pulseCloak.sidebar) {
      window.pulseCloak.sidebar.walletToggle(isOpen)
    }
  }

  async checkWalletState() {
    if (!window.pulseCloak || !window.pulseCloak.wallet) {
      console.warn('[WebUI] pulseCloak.wallet API not available')
      return
    }

    try {
      const state = await window.pulseCloak.wallet.getState()
      this.updateWalletUI(state)
    } catch (e) {
      console.error('[WebUI] Failed to get wallet state:', e)
    }
  }

  updateWalletUI(state) {
    if (!state) return

    if (state.connected) {
      this.$.walletNotConnected.classList.add('hidden')
      this.$.walletConnected.classList.remove('hidden')
      this.$.walletAddress.textContent = state.address
      this.$.walletBalanceCurrency.textContent = state.currency
      this.refreshBalance()
    } else {
      this.$.walletNotConnected.classList.remove('hidden')
      this.$.walletConnected.classList.add('hidden')
    }

    // Update network selector
    this.$.walletNetwork.value = state.network || 'testnet'
  }

  async switchWalletNetwork() {
    if (!window.pulseCloak?.wallet) return
    try {
      const network = this.$.walletNetwork.value
      const state = await window.pulseCloak.wallet.switchNetwork(network)
      this.updateWalletUI(state)
      this.showWalletStatus(`Switched to ${state.networkName}`, 'info')
    } catch (e) {
      this.showWalletStatus('Failed to switch network', 'error')
    }
  }

  async createWallet() {
    if (!window.pulseCloak?.wallet) return
    try {
      this.showWalletStatus('Creating wallet...', 'info')
      const result = await window.pulseCloak.wallet.create()
      if (result.error) {
        this.showWalletStatus(result.error, 'error')
        return
      }

      // Show mnemonic
      this.$.walletMnemonicPanel.classList.remove('hidden')
      this.$.walletMnemonicDisplay.textContent = result.mnemonic

      // Update UI to connected state
      const state = await window.pulseCloak.wallet.getState()
      this.updateWalletUI(state)
      this.showWalletStatus('Wallet created! Save your mnemonic!', 'success')
    } catch (e) {
      this.showWalletStatus('Failed to create wallet', 'error')
    }
  }

  async importWallet() {
    if (!window.pulseCloak?.wallet) return
    const input = this.$.walletImportInput.value.trim()
    if (!input) {
      this.showWalletStatus('Please enter a mnemonic or private key', 'error')
      return
    }

    try {
      this.showWalletStatus('Importing wallet...', 'info')
      let result

      // Detect if it's a private key (hex string) or mnemonic (words)
      if (input.startsWith('0x') || /^[0-9a-fA-F]{64}$/.test(input)) {
        result = await window.pulseCloak.wallet.importPrivateKey(input)
      } else {
        result = await window.pulseCloak.wallet.importMnemonic(input)
      }

      if (result.error) {
        this.showWalletStatus(result.error, 'error')
        return
      }

      this.$.walletImportPanel.classList.add('hidden')
      this.$.walletImportInput.value = ''

      const state = await window.pulseCloak.wallet.getState()
      this.updateWalletUI(state)
      this.showWalletStatus('Wallet imported successfully!', 'success')
    } catch (e) {
      this.showWalletStatus('Failed to import wallet', 'error')
    }
  }

  async loadWallet() {
    if (!window.pulseCloak?.wallet) return
    const password = this.$.walletPassword.value
    if (!password) {
      this.showWalletStatus('Please enter your password', 'error')
      return
    }

    try {
      this.showWalletStatus('Unlocking wallet...', 'info')
      const result = await window.pulseCloak.wallet.load(password)
      if (result.error) {
        this.showWalletStatus(result.error, 'error')
        return
      }

      this.$.walletPassword.value = ''
      const state = await window.pulseCloak.wallet.getState()
      this.updateWalletUI(state)
      this.showWalletStatus('Wallet unlocked!', 'success')
    } catch (e) {
      this.showWalletStatus('Failed to unlock wallet', 'error')
    }
  }

  async refreshBalance() {
    if (!window.pulseCloak?.wallet) return
    try {
      const [balance, cloakBalance] = await Promise.all([
        window.pulseCloak.wallet.getBalance(),
        window.pulseCloak.wallet.getCloakBalance(),
      ])

      if (balance.error) {
        this.$.walletBalanceAmount.textContent = 'Error'
        console.error('[Wallet] Balance error:', balance.error)
      } else {
        // Format to 4 decimal places
        const formatted = parseFloat(balance.balance).toFixed(4)
        this.$.walletBalanceAmount.textContent = formatted
        this.$.walletBalanceCurrency.textContent = balance.currency
      }

      if (cloakBalance && !cloakBalance.error) {
        this.$.walletCloakBalance.textContent = parseFloat(cloakBalance.balance).toFixed(2)
      }
    } catch (e) {
      console.error('[Wallet] Refresh error:', e)
    }
  }

  async sendTransaction() {
    if (!window.pulseCloak?.wallet) return
    const to = this.$.walletSendTo.value.trim()
    const amount = this.$.walletSendAmount.value.trim()

    if (!to || !amount) {
      this.showWalletStatus('Please fill in recipient and amount', 'error')
      return
    }

    if (!to.startsWith('0x') || to.length !== 42) {
      this.showWalletStatus('Invalid recipient address', 'error')
      return
    }

    try {
      this.showWalletStatus('Sending transaction...', 'info')
      const result = await window.pulseCloak.wallet.send(to, amount)
      if (result.error) {
        this.showWalletStatus(result.error, 'error')
        return
      }

      this.$.walletSendTo.value = ''
      this.$.walletSendAmount.value = ''
      this.showWalletStatus(`Sent! TX: ${result.hash.substring(0, 16)}...`, 'success')

      // Refresh balance after a delay
      setTimeout(() => this.refreshBalance(), 3000)
    } catch (e) {
      this.showWalletStatus('Transaction failed', 'error')
    }
  }

  async saveWallet() {
    if (!window.pulseCloak?.wallet) return
    const password = this.$.walletSavePassword.value
    if (!password) {
      this.showWalletStatus('Please enter a password to encrypt', 'error')
      return
    }
    if (password.length < 4) {
      this.showWalletStatus('Password too short (min 4 chars)', 'error')
      return
    }

    try {
      const result = await window.pulseCloak.wallet.save(password)
      if (result.error) {
        this.showWalletStatus(result.error, 'error')
        return
      }
      this.$.walletSavePassword.value = ''
      this.showWalletStatus('Wallet saved & encrypted!', 'success')
    } catch (e) {
      this.showWalletStatus('Failed to save wallet', 'error')
    }
  }

  async disconnectWallet() {
    if (!window.pulseCloak?.wallet) return
    try {
      const state = await window.pulseCloak.wallet.disconnect()
      this.updateWalletUI(state)
      this.$.walletBalanceAmount.textContent = '0.0000'
      this.showWalletStatus('Wallet disconnected', 'info')
    } catch (e) {
      this.showWalletStatus('Failed to disconnect', 'error')
    }
  }

  copyWalletAddress() {
    const addr = this.$.walletAddress.textContent
    if (addr && addr !== '0x...') {
      navigator.clipboard.writeText(addr).then(() => {
        this.$.walletCopyAddr.textContent = '\u2713'
        setTimeout(() => {
          this.$.walletCopyAddr.textContent = '\uD83D\uDCCB'
        }, 1500)
      }).catch(() => {
        // Fallback
        const ta = document.createElement('textarea')
        ta.value = addr
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        this.$.walletCopyAddr.textContent = '\u2713'
        setTimeout(() => {
          this.$.walletCopyAddr.textContent = '\uD83D\uDCCB'
        }, 1500)
      })
    }
  }

  showWalletStatus(message, type) {
    const el = this.$.walletStatus
    el.textContent = message
    el.className = `wallet-status ${type}`
    el.classList.remove('hidden')

    // Auto-hide after 5 seconds
    clearTimeout(this._statusTimeout)
    this._statusTimeout = setTimeout(() => {
      el.classList.add('hidden')
    }, 5000)
  }

  // ===== TABS =====

  async initTabs() {
    const tabs = await new Promise((resolve) => chrome.tabs.query({ windowId: -2 }, resolve))
    this.tabList = [...tabs]
    this.renderTabs()

    const activeTab = this.tabList.find((tab) => tab.active)
    if (activeTab) {
      this.setActiveTab(activeTab)
    }

    // Wait to setup tabs and windowId prior to listening for updates.
    this.setupBrowserListeners()
  }

  setupBrowserListeners() {
    if (!chrome.tabs.onCreated) {
      throw new Error(`chrome global not setup. Did the extension preload not get run?`)
    }

    const findTab = (tabId) => {
      const existingTab = this.tabList.find((tab) => tab.id === tabId)
      return existingTab
    }

    const findOrCreateTab = (tabId) => {
      const existingTab = findTab(tabId)
      if (existingTab) return existingTab

      const newTab = { id: tabId }
      this.tabList.push(newTab)
      return newTab
    }

    chrome.tabs.onCreated.addListener((tab) => {
      if (tab.windowId !== this.windowId) return
      const newTab = findOrCreateTab(tab.id)
      Object.assign(newTab, tab)
      this.renderTabs()
    })

    chrome.tabs.onActivated.addListener((activeInfo) => {
      if (activeInfo.windowId !== this.windowId) return

      this.setActiveTab(activeInfo)
    })

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, details) => {
      const tab = findTab(tabId)
      if (!tab) return
      Object.assign(tab, details)
      this.renderTabs()
      if (tabId === this.activeTabId) this.renderToolbar(tab)
    })

    chrome.tabs.onRemoved.addListener((tabId) => {
      const tabIndex = this.tabList.findIndex((tab) => tab.id === tabId)
      if (tabIndex > -1) {
        this.tabList.splice(tabIndex, 1)
        this.$.tabList.querySelector(`[data-tab-id="${tabId}"]`).remove()
      }
    })
  }

  setActiveTab(activeTab) {
    this.activeTabId = activeTab.id || activeTab.tabId
    this.windowId = activeTab.windowId

    for (const tab of this.tabList) {
      if (tab.id === this.activeTabId) {
        tab.active = true
        this.renderTab(tab)
        this.renderToolbar(tab)
      } else {
        if (tab.active) {
          tab.active = false
          this.renderTab(tab)
        }
      }
    }
  }

  resolveNavigationUrl(input) {
    const trimmed = (input || '').trim()
    if (!trimmed) return null

    // Already a full URL with protocol
    if (/^https?:\/\//i.test(trimmed)) return trimmed

    // chrome://, chrome-extension://, file://, etc.
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(trimmed)) return trimmed

    // localhost with optional port
    if (/^localhost(:\d+)?(\/.*)?$/i.test(trimmed)) return 'http://' + trimmed

    // IP address (v4) with optional port
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?(\/.*)?$/.test(trimmed)) return 'http://' + trimmed

    // Looks like a domain: contains a dot, no spaces, valid domain chars
    if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(trimmed) && !trimmed.includes(' ')) {
      return 'https://' + trimmed
    }

    // Otherwise treat as a search query
    return 'https://www.google.com/search?q=' + encodeURIComponent(trimmed)
  }

  onAddressUrlKeyPress(event) {
    if (event.code === 'Enter') {
      const url = this.resolveNavigationUrl(this.$.addressUrl.value)
      if (url) chrome.tabs.update({ url })
    }
  }

  onAddressUrlFocus() {
    this.$.addressUrl.select()
  }

  createTabNode(tab) {
    const tabElem = this.$.tabTemplate.content.cloneNode(true).firstElementChild
    tabElem.dataset.tabId = tab.id

    tabElem.addEventListener('click', () => {
      chrome.tabs.update(tab.id, { active: true })
    })
    tabElem.querySelector('.close').addEventListener('click', (e) => {
      e.stopPropagation()
      chrome.tabs.remove(tab.id)
    })
    const faviconElem = tabElem.querySelector('.favicon')
    faviconElem?.addEventListener('load', () => {
      faviconElem.classList.toggle('loaded', true)
    })
    faviconElem?.addEventListener('error', () => {
      faviconElem.classList.toggle('loaded', false)
    })

    this.$.tabList.appendChild(tabElem)
    return tabElem
  }

  renderTab(tab) {
    let tabElem = this.$.tabList.querySelector(`[data-tab-id="${tab.id}"]`)
    if (!tabElem) tabElem = this.createTabNode(tab)

    if (tab.active) {
      tabElem.dataset.active = ''
    } else {
      delete tabElem.dataset.active
    }

    const favicon = tabElem.querySelector('.favicon')
    if (tab.favIconUrl) {
      favicon.src = tab.favIconUrl
    } else {
      delete favicon.src
    }

    tabElem.querySelector('.title').textContent = tab.title
    tabElem.querySelector('.audio').disabled = !tab.audible
  }

  renderTabs() {
    this.tabList.forEach((tab) => {
      this.renderTab(tab)
    })
  }

  renderToolbar(tab) {
    this.$.addressUrl.value = tab.url || ''
    // Update lock icon based on HTTPS
    const lockIcon = document.querySelector('.lock-icon')
    if (lockIcon) {
      if (tab.url && tab.url.startsWith('https://')) {
        lockIcon.textContent = '\uD83D\uDD12'
        lockIcon.style.color = '#22c55e'
      } else {
        lockIcon.textContent = '\uD83D\uDD13'
        lockIcon.style.color = 'var(--text-secondary)'
      }
    }
  }
}

window.webui = new WebUI()
