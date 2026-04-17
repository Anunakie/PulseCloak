// PulseChain network configuration for PulseChainCloak Browser
// Used for Web3 integration, wallet defaults, and UI display.

export const PULSECHAIN_NETWORKS = {
    mainnet: {
        id: 'pulsechain-mainnet',
        name: 'PulseChain Mainnet',
        chainId: 369,
        chainIdHex: '0x171',
        currency: { name: 'Pulse', symbol: 'PLS', decimals: 18 },
        rpcUrls: ['https://rpc.pulsechain.com'],
        explorerUrls: ['https://scan.pulsechain.com'],
        faucetUrl: null,
        color: '#7c3aed',
        isTestnet: false,
    },
    testnetV4: {
        id: 'pulsechain-testnet-v4',
        name: 'PulseChain Testnet v4',
        chainId: 943,
        chainIdHex: '0x3af',
        currency: { name: 'Test Pulse', symbol: 'tPLS', decimals: 18 },
        rpcUrls: ['https://rpc.v4.testnet.pulsechain.com'],
        explorerUrls: ['https://scan.v4.testnet.pulsechain.com'],
        faucetUrl: 'https://faucet.v4.testnet.pulsechain.com',
        color: '#00e5ff',
        isTestnet: true,
    },
};

// Placeholder reward token for PulseChainCloak ($CLOAK placeholder = Neon)
// Final token TBD. This address is used for stubbed reward/earnings UI only.
export const PLACEHOLDER_REWARD_TOKEN = {
    symbol: 'CLOAK',
    name: 'PulseChainCloak Test Token (Neon placeholder)',
    address: '0xF2Da3942616880E52e841E5C504B5A9Fba23FFF0',
    decimals: 18,
    network: 'pulsechain-mainnet',
    note: 'Placeholder only. Swap to final token once decided (e.g., $NEON).',
};

export const DEFAULT_NETWORK = PULSECHAIN_NETWORKS.testnetV4;

export function getNetworkByChainId(chainId) {
    const id = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;
    return Object.values(PULSECHAIN_NETWORKS).find((n) => n.chainId === id) || null;
}
