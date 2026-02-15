const { session, ipcMain, app } = require('electron')
const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')

// Filter list URLs
const FILTER_LISTS = [
  { name: 'easylist', url: 'https://easylist.to/easylist/easylist.txt' },
  { name: 'easyprivacy', url: 'https://easylist.to/easylist/easyprivacy.txt' },
  { name: 'peter-lowe', url: 'https://pgl.yoyo.org/adservers/serverlist.php?hostformat=adblockplus&showintro=0' },
]

// Update interval: 24 hours
const UPDATE_INTERVAL_MS = 24 * 60 * 60 * 1000

class AdBlocker {
  constructor() {
    this.enabled = true
    this.blockedCount = 0
    this.blockedDomains = new Set()
    this.blockedUrlPatterns = []
    this.whitelistPatterns = []
    this.thirdPartyBlockDomains = new Set()
    this.listeners = new Set()
    this.dataDir = path.join(app.getPath('userData'), 'adblocker')
    this._requestHandler = null
  }

  async init() {
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true })
    }

    // Load or download filter lists
    await this.loadFilterLists()

    // Setup request interception
    this.setupRequestInterception()

    // Setup IPC handlers
    this.setupIPC()

    // Schedule periodic updates
    this.scheduleUpdates()

    console.log(`[AdBlocker] Initialized with ${this.blockedDomains.size} blocked domains, ${this.blockedUrlPatterns.length} URL patterns`)
  }

  async loadFilterLists() {
    for (const list of FILTER_LISTS) {
      try {
        const filePath = path.join(this.dataDir, `${list.name}.txt`)
        let content = null

        // Check if we have a cached copy and if it's fresh
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath)
          const age = Date.now() - stats.mtimeMs
          if (age < UPDATE_INTERVAL_MS) {
            content = fs.readFileSync(filePath, 'utf-8')
            console.log(`[AdBlocker] Loaded cached ${list.name} (${Math.round(age / 3600000)}h old)`)
          }
        }

        // Download if no cache or stale
        if (!content) {
          console.log(`[AdBlocker] Downloading ${list.name}...`)
          content = await this.downloadList(list.url)
          if (content) {
            fs.writeFileSync(filePath, content, 'utf-8')
            console.log(`[AdBlocker] Saved ${list.name} (${Math.round(content.length / 1024)}KB)`)
          }
        }

        if (content) {
          this.parseFilterList(content)
        }
      } catch (err) {
        console.error(`[AdBlocker] Error loading ${list.name}:`, err.message)
      }
    }
  }

  downloadList(url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http
      const request = client.get(url, { timeout: 30000 }, (res) => {
        // Follow redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return this.downloadList(res.headers.location).then(resolve).catch(reject)
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`))
        }
        const chunks = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
        res.on('error', reject)
      })
      request.on('error', reject)
      request.on('timeout', () => {
        request.destroy()
        reject(new Error('Timeout'))
      })
    })
  }

  parseFilterList(content) {
    const lines = content.split('\n')
    for (const rawLine of lines) {
      const line = rawLine.trim()

      // Skip comments, empty lines, and header
      if (!line || line.startsWith('!') || line.startsWith('[')) continue

      // Skip element hiding rules (##, #@#, #?#)
      if (line.includes('##') || line.includes('#@#') || line.includes('#?#')) continue

      // Skip advanced modifiers we can't handle well
      if (line.includes('$csp=') || line.includes('$redirect=') || line.includes('$replace=')) continue

      // Whitelist rules (@@)
      if (line.startsWith('@@')) {
        const pattern = this.parseRule(line.substring(2))
        if (pattern) this.whitelistPatterns.push(pattern)
        continue
      }

      // Domain-only rules: ||domain.com^
      const domainMatch = line.match(/^\|\|([a-z0-9][a-z0-9\-\.]*[a-z0-9])\^?(\$.*)?$/i)
      if (domainMatch) {
        const domain = domainMatch[1].toLowerCase()
        // Check for third-party modifier
        const opts = domainMatch[2] || ''
        if (!opts.includes('~third-party') && !opts.includes('domain=')) {
          this.blockedDomains.add(domain)
        }
        continue
      }

      // URL pattern rules
      const pattern = this.parseRule(line)
      if (pattern) {
        this.blockedUrlPatterns.push(pattern)
      }
    }
  }

  parseRule(rule) {
    // Extract options after $
    let options = {}
    const dollarIdx = rule.lastIndexOf('$')
    let pattern = rule
    if (dollarIdx > 0) {
      const optStr = rule.substring(dollarIdx + 1)
      pattern = rule.substring(0, dollarIdx)
      // Parse simple options
      for (const opt of optStr.split(',')) {
        if (opt === 'third-party') options.thirdParty = true
        else if (opt === '~third-party') options.firstParty = true
        else if (opt === 'script') options.types = ['script']
        else if (opt === 'image') options.types = ['image']
        else if (opt === 'stylesheet') options.types = ['stylesheet']
        else if (opt === 'xmlhttprequest') options.types = ['xmlhttprequest']
        else if (opt === 'subdocument') options.types = ['sub_frame']
      }
    }

    if (!pattern || pattern.length < 3) return null

    // Convert adblock pattern to regex
    try {
      let regex = pattern
        .replace(/[.+?{}()\[\]\\]/g, '\\$&')  // Escape regex special chars (except * and |)
        .replace(/\*/g, '.*')                    // * -> .*
        .replace(/\^/g, '([^\\w\\d\\-\\.%]|$)') // ^ -> separator
        .replace(/^\|\|/, '^https?://([a-z0-9-]+\\.)*') // || -> domain anchor
        .replace(/^\|/, '^')                     // | at start -> string start
        .replace(/\|$/, '$')                     // | at end -> string end

      const re = new RegExp(regex, 'i')
      return { regex: re, options }
    } catch (e) {
      return null
    }
  }

  shouldBlock(url, resourceType, pageUrl) {
    if (!this.enabled) return false
    if (!url) return false

    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname.toLowerCase()

      // Never block the browser's own UI or extensions
      if (urlObj.protocol === 'chrome-extension:' || urlObj.protocol === 'chrome:') return false
      if (urlObj.protocol === 'file:' || urlObj.protocol === 'data:' || urlObj.protocol === 'blob:') return false

      // Check whitelist first
      for (const wp of this.whitelistPatterns) {
        if (wp.regex.test(url)) return false
      }

      // Check domain blocklist
      if (this.isDomainBlocked(hostname)) return true

      // Check URL patterns (limit to first 5000 for performance)
      const patternsToCheck = this.blockedUrlPatterns.slice(0, 5000)
      for (const p of patternsToCheck) {
        if (p.regex.test(url)) {
          // Check type filter
          if (p.options.types && !p.options.types.includes(resourceType)) continue
          return true
        }
      }

      return false
    } catch (e) {
      return false
    }
  }

  isDomainBlocked(hostname) {
    // Check exact match and parent domains
    const parts = hostname.split('.')
    for (let i = 0; i < parts.length - 1; i++) {
      const domain = parts.slice(i).join('.')
      if (this.blockedDomains.has(domain)) return true
    }
    return false
  }

  setupRequestInterception() {
    const ses = session.defaultSession

    this._requestHandler = (details, callback) => {
      if (this.shouldBlock(details.url, details.resourceType, details.referrer)) {
        this.blockedCount++
        this.notifyListeners()
        callback({ cancel: true })
      } else {
        callback({})
      }
    }

    ses.webRequest.onBeforeRequest(this._requestHandler)

    // Block third-party cookies
    ses.webRequest.onBeforeSendHeaders((details, callback) => {
      if (!this.enabled) return callback({})

      const requestHeaders = { ...details.requestHeaders }

      try {
        // Remove tracking headers
        if (details.referrer && details.url) {
          const reqHost = new URL(details.url).hostname
          const refHost = new URL(details.referrer).hostname
          // If third-party request, strip cookies and referer for known trackers
          if (reqHost !== refHost && this.isDomainBlocked(reqHost)) {
            delete requestHeaders['Cookie']
            delete requestHeaders['Referer']
          }
        }
      } catch (e) {
        // ignore URL parse errors
      }

      callback({ requestHeaders })
    })

    console.log('[AdBlocker] Request interception active')
  }

  setupIPC() {
    ipcMain.handle('adblocker:getState', () => {
      return {
        enabled: this.enabled,
        blockedCount: this.blockedCount,
      }
    })

    ipcMain.handle('adblocker:toggle', (event, enabled) => {
      this.enabled = typeof enabled === 'boolean' ? enabled : !this.enabled
      console.log(`[AdBlocker] ${this.enabled ? 'Enabled' : 'Disabled'}`)
      return {
        enabled: this.enabled,
        blockedCount: this.blockedCount,
      }
    })

    ipcMain.handle('adblocker:resetCount', () => {
      this.blockedCount = 0
      this.notifyListeners()
      return { enabled: this.enabled, blockedCount: 0 }
    })
  }

  // Register a webContents to receive block count updates
  addListener(webContents) {
    this.listeners.add(webContents)
    webContents.on('destroyed', () => {
      this.listeners.delete(webContents)
    })
  }

  notifyListeners() {
    // Throttle notifications to every 500ms
    if (this._notifyTimeout) return
    this._notifyTimeout = setTimeout(() => {
      this._notifyTimeout = null
      for (const wc of this.listeners) {
        if (!wc.isDestroyed()) {
          wc.send('adblocker:update', {
            enabled: this.enabled,
            blockedCount: this.blockedCount,
          })
        }
      }
    }, 500)
  }

  scheduleUpdates() {
    setInterval(() => {
      console.log('[AdBlocker] Refreshing filter lists...')
      this.loadFilterLists().catch((err) => {
        console.error('[AdBlocker] Update failed:', err.message)
      })
    }, UPDATE_INTERVAL_MS)
  }
}

module.exports = { AdBlocker }
