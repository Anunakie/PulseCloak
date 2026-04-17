# PulseChainCloak Browser

**PulseChainCloak Browser** is a professional, privacy-focused desktop browser built natively for the PulseChain ecosystem. It features a dark cyberpunk UI, bundled Web3 wallets, organized dApp Spaces, decentralized mesh VPN integration, and full Chrome-extension compatibility.

> Forked from [MASQ-Project/electron-browser-shell](https://github.com/MASQ-Project/electron-browser-shell), which is based on [samuelmaddock/electron-browser-shell](https://github.com/samuelmaddock/electron-browser-shell). Rebranded and extended for the PulseChain privacy ecosystem.

## ✨ Features

- 🎨 **Cyberpunk Dark UI** — frameless window, cyan/purple accents, glassmorphism
- 🔀 **Tabbed browsing** with back/forward/reload/home navigation and smart URL bar (with search fallback)
- 🦊 **Bundled Web3 Wallets** — Rabby, MetaMask, Phantom, Frame, Bitwarden
- 🚀 **dApp Spaces** — one-click launch of PulseX, NexionPulse, PulseBridge, HEX, PhiatDAO, and more
- 🛡 **Privacy-first defaults** — ad/tracker blocking, fingerprint resistance, no telemetry
- ⚡ **PulseChain Native** — Mainnet (369) and Testnet v4 (943) preconfigured, tPLS faucet integration
- 🌐 **Mesh VPN ready** — hooks for integration with PulseChainCloak Node (Rust)
- 🧩 **Full Chrome Extension Support** via `@pulsechaincloak/electron-chrome-extensions`

## 📦 Architecture

| Package | Description | NPM Name |
| --- | --- | --- |
| [`packages/browser`](./packages/browser) | Main Electron application (React + webpack + electron-forge) | `pulsechaincloak-browser-app` |
| [`packages/electron-chrome-extensions`](./packages/electron-chrome-extensions) | Chrome extension API support for Electron | `@pulsechaincloak/electron-chrome-extensions` |
| [`packages/electron-chrome-context-menu`](./packages/electron-chrome-context-menu) | Chrome-style context menus for Electron | `@pulsechaincloak/electron-chrome-context-menu` |

## 🚀 Quick Start

```bash
# Install dependencies
yarn install

# Start in dev mode
yarn start

# Build Windows x64 portable + installer
yarn make:win
```

## ⛓ PulseChain Configuration

| Network | Chain ID | RPC | Explorer | Faucet |
| --- | --- | --- | --- | --- |
| PulseChain Mainnet | `369` | https://rpc.pulsechain.com | https://scan.pulsechain.com | — |
| PulseChain Testnet v4 | `943` | https://rpc.v4.testnet.pulsechain.com | https://scan.v4.testnet.pulsechain.com | https://faucet.v4.testnet.pulsechain.com |

**Placeholder reward token (`$CLOAK`):** Neon token at `0xF2Da3942616880E52e841E5C504B5A9Fba23FFF0` on PulseChain. Final token TBD.

## 📄 License

GPL-3.0 — see [LICENSE](./LICENSE). Retains attribution to the original `electron-browser-shell` authors and the MASQ-Project fork base.
