const { ipcMain } = require('electron')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const { app } = require('electron')

// PulseChain network configurations
const NETWORKS = {
  testnet: {
    name: 'PulseChain Testnet v4',
    chainId: 943,
    rpc: 'https://rpc.v4.testnet.pulsechain.com',
    currency: 'tPLS',
    explorer: 'https://scan.v4.testnet.pulsechain.com',
  },
  mainnet: {
    name: 'PulseChain Mainnet',
    chainId: 369,
    rpc: 'https://rpc.pulsechain.com',
    currency: 'PLS',
    explorer: 'https://scan.pulsechain.com',
  },
}

// Placeholder $CLOAK token address (zero address for now)
const CLOAK_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000'
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function transfer(address to, uint256 amount) returns (bool)',
]

// Simple AES-256-GCM encryption for wallet storage
function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256')
}

function encrypt(text, password) {
  const salt = crypto.randomBytes(16)
  const key = deriveKey(password, salt)
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag()
  return {
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    encrypted,
    tag: tag.toString('hex'),
  }
}

function decrypt(data, password) {
  const salt = Buffer.from(data.salt, 'hex')
  const key = deriveKey(password, salt)
  const iv = Buffer.from(data.iv, 'hex')
  const tag = Buffer.from(data.tag, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  let decrypted = decipher.update(data.encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

class Wallet {
  constructor() {
    this.ethers = null
    this.wallet = null
    this.provider = null
    this.network = 'testnet'
    this.walletFilePath = path.join(app.getPath('userData'), 'wallet.enc')
  }

  async init() {
    // Dynamic import ethers (ESM module)
    try {
      this.ethers = require('ethers')
    } catch (e) {
      console.error('[Wallet] Failed to load ethers:', e.message)
      // Try dynamic import as fallback
      try {
        this.ethers = await import('ethers')
      } catch (e2) {
        console.error('[Wallet] Failed to dynamic import ethers:', e2.message)
      }
    }

    this.setupProvider()
    this.setupIPC()
    console.log(`[Wallet] Initialized on ${NETWORKS[this.network].name}`)
  }

  setupProvider() {
    if (!this.ethers) return
    const net = NETWORKS[this.network]
    try {
      this.provider = new this.ethers.JsonRpcProvider(net.rpc, {
        name: net.name,
        chainId: net.chainId,
      })
    } catch (e) {
      console.error('[Wallet] Provider setup error:', e.message)
    }
  }

  switchNetwork(networkKey) {
    if (!NETWORKS[networkKey]) return false
    this.network = networkKey
    this.setupProvider()
    // Reconnect wallet to new provider
    if (this.wallet && this.provider) {
      this.wallet = this.wallet.connect(this.provider)
    }
    console.log(`[Wallet] Switched to ${NETWORKS[networkKey].name}`)
    return true
  }

  async createWallet() {
    if (!this.ethers) return { error: 'ethers not loaded' }
    try {
      const randomWallet = this.ethers.Wallet.createRandom()
      this.wallet = randomWallet.connect(this.provider)
      return {
        address: this.wallet.address,
        mnemonic: randomWallet.mnemonic.phrase,
      }
    } catch (e) {
      return { error: e.message }
    }
  }

  async importFromMnemonic(mnemonic) {
    if (!this.ethers) return { error: 'ethers not loaded' }
    try {
      const wallet = this.ethers.Wallet.fromPhrase(mnemonic.trim())
      this.wallet = wallet.connect(this.provider)
      return { address: this.wallet.address }
    } catch (e) {
      return { error: e.message }
    }
  }

  async importFromPrivateKey(privateKey) {
    if (!this.ethers) return { error: 'ethers not loaded' }
    try {
      let pk = privateKey.trim()
      if (!pk.startsWith('0x')) pk = '0x' + pk
      const wallet = new this.ethers.Wallet(pk)
      this.wallet = wallet.connect(this.provider)
      return { address: this.wallet.address }
    } catch (e) {
      return { error: e.message }
    }
  }

  async getBalance() {
    if (!this.wallet || !this.provider) return { error: 'No wallet connected' }
    try {
      const balance = await this.provider.getBalance(this.wallet.address)
      const net = NETWORKS[this.network]
      return {
        balance: this.ethers.formatEther(balance),
        currency: net.currency,
        address: this.wallet.address,
        network: net.name,
      }
    } catch (e) {
      return { error: e.message }
    }
  }

  async getCloakBalance() {
    if (!this.wallet || !this.provider) return { error: 'No wallet connected' }
    // Placeholder - $CLOAK token not deployed yet
    if (CLOAK_TOKEN_ADDRESS === '0x0000000000000000000000000000000000000000') {
      return {
        balance: '0.0',
        symbol: '$CLOAK',
        note: 'Token not yet deployed',
      }
    }
    try {
      const contract = new this.ethers.Contract(CLOAK_TOKEN_ADDRESS, ERC20_ABI, this.provider)
      const balance = await contract.balanceOf(this.wallet.address)
      const decimals = await contract.decimals()
      return {
        balance: this.ethers.formatUnits(balance, decimals),
        symbol: '$CLOAK',
      }
    } catch (e) {
      return { error: e.message }
    }
  }

  async sendTransaction(toAddress, amountEther) {
    if (!this.wallet) return { error: 'No wallet connected' }
    if (!this.ethers) return { error: 'ethers not loaded' }
    try {
      const tx = await this.wallet.sendTransaction({
        to: toAddress,
        value: this.ethers.parseEther(amountEther.toString()),
      })
      return {
        hash: tx.hash,
        explorer: `${NETWORKS[this.network].explorer}/tx/${tx.hash}`,
      }
    } catch (e) {
      return { error: e.message }
    }
  }

  async saveWallet(password) {
    if (!this.wallet) return { error: 'No wallet to save' }
    try {
      const data = {
        privateKey: this.wallet.privateKey,
        address: this.wallet.address,
      }
      const encrypted = encrypt(JSON.stringify(data), password)
      fs.writeFileSync(this.walletFilePath, JSON.stringify(encrypted), 'utf-8')
      return { success: true }
    } catch (e) {
      return { error: e.message }
    }
  }

  async loadWallet(password) {
    if (!this.ethers) return { error: 'ethers not loaded' }
    try {
      if (!fs.existsSync(this.walletFilePath)) {
        return { error: 'No saved wallet found' }
      }
      const encData = JSON.parse(fs.readFileSync(this.walletFilePath, 'utf-8'))
      const decrypted = decrypt(encData, password)
      const data = JSON.parse(decrypted)
      const wallet = new this.ethers.Wallet(data.privateKey)
      this.wallet = wallet.connect(this.provider)
      return { address: this.wallet.address }
    } catch (e) {
      return { error: 'Wrong password or corrupted wallet file' }
    }
  }

  getState() {
    const net = NETWORKS[this.network]
    return {
      connected: !!this.wallet,
      address: this.wallet?.address || null,
      network: this.network,
      networkName: net.name,
      currency: net.currency,
      hasSavedWallet: fs.existsSync(this.walletFilePath),
    }
  }

  setupIPC() {
    ipcMain.handle('wallet:getState', () => this.getState())
    ipcMain.handle('wallet:getNetworks', () => NETWORKS)

    ipcMain.handle('wallet:create', async () => {
      return await this.createWallet()
    })

    ipcMain.handle('wallet:importMnemonic', async (event, mnemonic) => {
      return await this.importFromMnemonic(mnemonic)
    })

    ipcMain.handle('wallet:importPrivateKey', async (event, privateKey) => {
      return await this.importFromPrivateKey(privateKey)
    })

    ipcMain.handle('wallet:getBalance', async () => {
      return await this.getBalance()
    })

    ipcMain.handle('wallet:getCloakBalance', async () => {
      return await this.getCloakBalance()
    })

    ipcMain.handle('wallet:send', async (event, toAddress, amount) => {
      return await this.sendTransaction(toAddress, amount)
    })

    ipcMain.handle('wallet:switchNetwork', (event, networkKey) => {
      this.switchNetwork(networkKey)
      return this.getState()
    })

    ipcMain.handle('wallet:save', async (event, password) => {
      return await this.saveWallet(password)
    })

    ipcMain.handle('wallet:load', async (event, password) => {
      return await this.loadWallet(password)
    })

    ipcMain.handle('wallet:disconnect', () => {
      this.wallet = null
      return this.getState()
    })
  }
}

module.exports = { Wallet }
