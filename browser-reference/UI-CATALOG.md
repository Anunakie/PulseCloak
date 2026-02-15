# PulseChainCloak Browser — UI Catalog
## Based on MASQ Browser v0.10.4 Screenshots (38 images)

---

## 1. ONBOARDING FLOW

### 1a. Welcome / Password Setup (172318, 172353)
- Dark themed welcome screen
- "Welcome to MASQ" heading
- Password creation form (password + confirm)
- "GET STARTED" button (cyan/blue gradient)
- MASQ logo centered

### 1b. Wallet Setup (172411, 172435)
- Step-by-step wallet configuration
- Options to create new or import existing wallet
- Seed phrase display/backup
- Chain selection

### 1c. Setup Complete (172453, 172525)
- Confirmation screen
- Transition to main browser

---

## 2. MAIN BROWSER INTERFACE

### 2a. Spaces Desktop (172732)
- Full-screen dark background with subtle blue wave/aurora effect
- **Top bar**: Token balances (green circle icon + value, blue circle icon + value) | Window controls (minimize, maximize, close)
- **Toolbar row**: Star (bookmark) | Power | Hop | Zoom | Spaces | Settings | Lock (red badge) | dVPN (ghost icon) | Bookmarks | Settings gear
- **Bottom dock**: App icons in circular containers (dApp shortcuts)
  - Pre-loaded: Timpi, QuickSwap(?), Ethereum icon, Folder, Aave(?), Orange icon, Blue icon
  - "+" button to add more
- **Left sidebar**: Token price display ($N/A), "BUY MASQ" red button, "N/A people swapped MASQ in last 24hrs", "Active dVPN users in last 24hrs" counter, "SHARE" button

### 2b. New Tab Page (174405)
- Clean dark background
- Large "+" icon centered
- "New Tab" heading
- "Type a URL or search term in the address bar above to get started"
- Address bar shows "Search Presearch or type a URL"

### 2c. Tab Bar & Spaces (174442, top-left details)
- **Spaces tabs** at top-left: WORK (blue briefcase icon), FINANCE (purple dollar icon), PLAY (gray gamepad icon)
- Each space has its own color accent on the tab bar underline
- "+" button to add new space
- Standard browser nav: Home | Back | Forward | Refresh | Address bar with lock icon

---

## 3. GUIDED TOUR (11 Steps)

### Tour popups appear as dark cards with cyan border/glow:
1. **Spaces Dock** (1/11) — "Your Spaces Dock is where you can add your favorite dApps and websites"
2. **Open New Tab** (2/11) — "Click the + icon to open a new tab"
3. **Return to Spaces Desktop** (3/11) — "Click the home icon to return"
4. **Switch Spaces** (4/11) — "Switch between Work, Finance, Play spaces"
5. **Lock the App** (5/11) — "Click Lock icon for ultimate privacy, unlock with password" (173004)
6. **Access Settings** (6/11) — "Click COG icon for settings" (173016)
7. **Access Bookmarks** (7/11) — "Manage bookmarks, import from other browsers" (173036)
8. **Access Web3 Wallets** (8/11) — "Head to settings to load wallets into MASQ" (173048)
9. **Access MASQ dVPN** (9/11) — "Hop icon controls dVPN connection and privacy level" (173059)
10. **Control MASQ Connection** (10/11) — "Power button turns MASQ ON/OFF, choose consume/serve/both" (173112)
11. **Quick Actions** (11/11) — "Access Premium, dApp store, add dock items from right side" (173125)

---

## 4. ADVANCED SETTINGS

### 4a. Settings Layout
- Full-page settings view
- Left sidebar: MASQ logo + "MASQ" text, Settings gear icon
- **3 tabs**: BROWSER SETTINGS | GENERAL SETTINGS | MASQ LOGS
- Top-right: "BUY MASQ TOKENS" link (blue with token icon)

### 4b. Browser Settings Tab (173245)

#### Privacy and Security Section:
| Setting | Description | Control |
|---------|-------------|--------|
| Block Ads & Trackers | Block all ads within browser | Toggle ON/OFF (default ON) |
| History Destructor | Choose history items to store | Counter (default 3) with up/down |
| Clear your Cache | Clear cached data, images, files | CLEAR button |
| Clear your History | Clear last x pages back/forward | CLEAR button |
| Clear your Cookies | Clear cookies across all sites | CLEAR button |
| Browser ID Switcher | Hide browser info from websites | Toggle ON/OFF (default ON) |

#### Default Search Engine Section:
| Setting | Description | Control |
|---------|-------------|--------|
| Default Search Engine | Private & decentralized web3 search | Dropdown (Presearch selected) |

#### Enable/Disable Browser Wallets Section (173258):
| Wallet | Description | Control |
|--------|-------------|--------|
| MetaMask | Popular Ethereum/Polygon wallet with swaps | Toggle (OFF) |
| Phantom | Crypto wallet for DeFi & NFTs | Toggle (ON) |
| Frame | Privacy-focused Ethereum wallet | Toggle (OFF) |
| Rabby (experimental) | Game-changing wallet for ETH & EVM chains | Toggle (OFF) |

#### Extensions Section:
| Extension | Description | Control |
|-----------|-------------|--------|
| Bitwarden | Open source password manager with E2E | Toggle (OFF) |

### 4c. MASQ Logs Tab (173415)
- "Node Log Output" heading
- "COPY NODE LOG" button (top-right, cyan)
- Large empty text area for log display

### 4d. General Settings Tab
- Not fully captured but referenced in tab bar

---

## 5. BOOKMARKS PANEL (173515)
- Slide-out panel from right side
- "MY BOOKMARKS" heading
- Import button (clipboard icon)
- Close (X) button
- Empty state: Large bookmark icon, "No bookmarks yet!", "Browse some sites and hit the star button to save them here."

---

## 6. dVPN SETUP WIZARD (173650)
- Modal/overlay panel
- "SETUP MASQ DVPN" subtitle
- "WELCOME TO MASQ" heading
- Animated concentric circles with MASQ icon center
- "Welcome to the worlds best Decentralized Mesh VPN"
- "LET'S GET STARTED"
- "Be protected as you browse by the worlds first multi-hop mesh dVPN."
- "All powered by cryptocurrency!"
- "GET STARTED" button (cyan gradient)
- Feather/checkmark icon bottom-right

---

## 7. DAEMON ERROR STATE (173630)
- Modal dialog over main browser
- Warning triangle icon
- "Daemon is not running!"
- "It seems like something went wrong starting the Daemon. Please consult the documentation here and try to reinstall and restart this application."
- "OK, GOT IT!" button (cyan)

---

## 8. dAPP STORE (173801)
- Modal/overlay with dark background
- "DAPP STORE" heading
- Search bar: "Search for a dApp..."
- **Categories sidebar**:
  - DISCOVER
  - DEFI
  - ART & COLLECTABLES
  - GAMES
  - EXCHANGES
  - SOCIAL
  - UTILITIES
  - OTHER
- **Featured dApp banner**: "MASQ AI" with "FEATURED DAPP" badge, description, GET button
- **Right banner**: "Borderless Internet Browsing. Web3 Anonymity for all." powered by Polygon
- **App grid**:
  - MASQ AI — AI assistant from MASQ Knowledge Base (GET)
  - Timpi — World's first un-manipulated search engine (REMOVE = installed)
  - Superbridge — Native bridging for rollups (GET)
  - QuickSwap — Decentralized exchange (GET)
  - Venice — Private and Uncensored AI (GET)
  - Send App — Join the Send revolution (GET)

---

## 9. DOCK ADD OPTIONS (174348)
- Popup from "+" button on dock
- Two options:
  - 🔗 "Add from URL"
  - 🌐 "Add from Web3 Store"

---

## 10. WALLET INTEGRATION (173610)
- Phantom wallet extension opens in full tab
- Standard Phantom onboarding: "Create a new wallet" / "Import an existing wallet"
- Chrome extension URL visible in address bar

---

## 11. WEB BROWSING EXAMPLES
- **Timpi search engine** (174010) — Privacy-focused search, loaded via dApp store
- **Uniswap token page** (174045) — MASQ token on Base chain, $0.0135, swap interface
- **ENS Domains** (173846) — ens.domains loaded normally
- **Filebase/IPFS** (173909) — Filebase IPFS platform
- **Handshake** (173933) — Decentralized naming system
- **X/Twitter** (174200) — With Windows Firewall dialog showing MASQ network access request

---

## 12. WINDOWS FIREWALL DIALOG (174200)
- Windows Defender Firewall alert
- Name: MASQ
- Publisher: MASQ Network
- Path: C:\program files\masq\masq.exe
- Options: Private networks (checked), Public networks (unchecked)
- "Allow access" / "Cancel" buttons

---

## 13. DESIGN SYSTEM NOTES

### Color Palette:
- **Background**: Very dark navy/black (#0a0e1a approx)
- **Primary accent**: Cyan/electric blue (#00d4ff approx)
- **Secondary accent**: Deep blue (#1a3a5c approx)
- **Warning/Alert**: Orange/amber
- **Error**: Red
- **Success**: Green
- **Text primary**: White
- **Text secondary**: Gray/muted blue
- **Gradient buttons**: Cyan-to-blue horizontal gradient

### Typography:
- Clean sans-serif font throughout
- Bold headings, regular body text
- All-caps for section labels ("BROWSER SETTINGS", "DAPP STORE")

### UI Patterns:
- Dark theme throughout (no light mode visible)
- Rounded corners on cards, buttons, inputs
- Subtle glow/border effects on active elements
- Toggle switches with OFF/ON labels
- Modal overlays with semi-transparent dark backdrop
- Slide-out panels from right side
- Icon-heavy toolbar with tooltip-style tour popups
- Bottom dock similar to macOS dock concept

### Layout:
- Frameless window (custom title bar)
- Tab bar at top with space indicators
- Navigation bar below tabs
- Toolbar row with icon buttons
- Content area fills remaining space
- Left sidebar for token/network stats (collapsible?)
- Bottom dock for app shortcuts

---

## 14. FEATURES TO REPLICATE FOR PULSECHAINCLOAK

### Must-Have (Phase 1):
- [ ] Dark-themed Electron browser shell
- [ ] Tab management with Spaces (Work, Finance, Play + custom)
- [ ] Address bar with search integration
- [ ] New tab page
- [ ] Bookmarks panel
- [ ] Basic settings page

### Should-Have (Phase 2):
- [ ] Ad & tracker blocking (toggle)
- [ ] History destructor
- [ ] Cache/cookie/history clearing
- [ ] Browser ID switcher
- [ ] Wallet extension support (MetaMask, Phantom, Rabby, Frame)
- [ ] Bitwarden extension support
- [ ] App lock with password

### Nice-to-Have (Phase 3):
- [ ] Spaces desktop with dock
- [ ] dApp Store
- [ ] dVPN setup wizard & controls
- [ ] Token price display
- [ ] Node log viewer
- [ ] Guided tour
- [ ] Dock add from URL / Web3 Store

### PulseChain-Specific (Phase 4):
- [ ] PLS/tPLS balance display (replace MASQ token)
- [ ] PulseChain dApp defaults (PulseX, bridges, etc.)
- [ ] PulseChain RPC integration
- [ ] $CLOAK token placeholder
- [ ] Telegram sidebar integration
- [ ] PulseChain domain resolution

