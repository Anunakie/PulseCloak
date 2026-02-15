class WebUI {
  windowId = -1
  activeTabId = -1
  /** @type {chrome.tabs.Tab[]} */
  tabList = []
  activeSpace = 'browse'

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

    const platformClass = `platform-${navigator.userAgentData.platform.toLowerCase()}`
    document.body.classList.add(platformClass)

    this.initTabs()
  }

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
      // Placeholder for profile/account panel
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

  onAddressUrlKeyPress(event) {
    if (event.code === 'Enter') {
      const url = this.$.addressUrl.value
      chrome.tabs.update({ url })
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
