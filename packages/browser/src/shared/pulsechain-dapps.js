// PulseChain dApp Spaces catalog for PulseChainCloak Browser.
// Rendered in the left sidebar. Each category has a list of dApps.
// IMPORTANT: consumers must guard `.map()` calls with Array.isArray() —
// see App.js for defensive rendering.

export const PULSECHAIN_DAPPS = [
    {
        id: 'defi',
        name: 'DeFi',
        icon: '💱',
        dapps: [
            {
                id: 'pulsex',
                name: 'PulseX',
                description: 'Native DEX for swapping tokens on PulseChain.',
                url: 'https://app.pulsex.com',
                icon: '🔀',
            },
            {
                id: 'phiat',
                name: 'Phiat',
                description: 'Lending / borrowing protocol on PulseChain.',
                url: 'https://phiat.exchange',
                icon: '🏦',
            },
            {
                id: 'phamous',
                name: 'Phamous',
                description: 'Perpetual DEX on PulseChain.',
                url: 'https://phamous.io',
                icon: '📈',
            },
            {
                id: 'piteas',
                name: 'Piteas',
                description: 'Multi-DEX aggregator for best swap rates.',
                url: 'https://piteas.io',
                icon: '🧭',
            },
        ],
    },
    {
        id: 'bridge',
        name: 'Bridges',
        icon: '🌉',
        dapps: [
            {
                id: 'pulsebridge',
                name: 'PulseBridge',
                description: 'Bridge ETH ↔ PulseChain.',
                url: 'https://bridge.pulsechain.com',
                icon: '🌉',
            },
            {
                id: 'rubic',
                name: 'Rubic',
                description: 'Multi-chain bridging with PulseChain support.',
                url: 'https://rubic.exchange',
                icon: '🔗',
            },
        ],
    },
    {
        id: 'tokens',
        name: 'Tokens & Staking',
        icon: '💎',
        dapps: [
            {
                id: 'hex',
                name: 'HEX',
                description: 'HEX staking dApp on PulseChain.',
                url: 'https://go.hex.com',
                icon: '🔶',
            },
            {
                id: 'pulsechain',
                name: 'PulseChain Info',
                description: 'Official PulseChain portal.',
                url: 'https://pulsechain.com',
                icon: '💓',
            },
            {
                id: 'gopulse',
                name: 'GoPulse',
                description: 'Ecosystem map & token discovery.',
                url: 'https://gopulse.com',
                icon: '🗺',
            },
        ],
    },
    {
        id: 'explorers',
        name: 'Explorers',
        icon: '🔍',
        dapps: [
            {
                id: 'scan-mainnet',
                name: 'PulseScan (Mainnet)',
                description: 'PulseChain block explorer.',
                url: 'https://scan.pulsechain.com',
                icon: '🔎',
            },
            {
                id: 'scan-testnet',
                name: 'PulseScan Testnet v4',
                description: 'Testnet block explorer.',
                url: 'https://scan.v4.testnet.pulsechain.com',
                icon: '🧪',
            },
            {
                id: 'faucet',
                name: 'Testnet Faucet',
                description: 'Claim free tPLS for testing.',
                url: 'https://faucet.v4.testnet.pulsechain.com',
                icon: '💧',
            },
        ],
    },
    {
        id: 'privacy',
        name: 'Privacy & Tools',
        icon: '🛡',
        dapps: [
            {
                id: 'duckduckgo',
                name: 'DuckDuckGo',
                description: 'Privacy-focused search engine.',
                url: 'https://duckduckgo.com',
                icon: '🦆',
            },
            {
                id: 'pulsechaincloak',
                name: 'PulseChainCloak',
                description: 'Project homepage.',
                url: 'https://pulsechaincloak.io',
                icon: '🛡',
            },
        ],
    },
];

// Flat list of all dApps (for quick-launch / search).
export const ALL_DAPPS = PULSECHAIN_DAPPS.flatMap((cat) =>
    (Array.isArray(cat.dapps) ? cat.dapps : []).map((d) => ({
        ...d,
        category: cat.name,
    }))
);
