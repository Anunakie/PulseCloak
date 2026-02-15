import { ipcMain } from 'electron';
import { getStore, setStore } from '../store';
const log = require('electron-log');

/**
 * Spaces Manager
 * Manages organized workspaces ("Spaces") for dApps.
 * Each space has a name, color, icon, and list of pinned dApp URLs.
 */

const DEFAULT_SPACES = [
    {
        id: 'defi',
        name: 'DeFi',
        color: '#14b8a6', // teal
        icon: 'defi',
        pinned: [
            { name: 'PulseX', url: 'https://pulsex.com', icon: '🔄' },
            { name: 'PulseChain', url: 'https://pulsechain.com', icon: '💜' },
            { name: '9inch', url: 'https://9inch.io', icon: '📊' },
            { name: 'PulseRate', url: 'https://pulserate.io', icon: '📈' },
            { name: 'Liquid Loans', url: 'https://liquidloans.io', icon: '💰' },
            { name: 'HEX', url: 'https://hex.com', icon: '⬡' },
        ],
    },
    {
        id: 'nfts',
        name: 'NFTs',
        color: '#a855f7', // purple
        icon: 'nft',
        pinned: [
            { name: 'PulseChain NFTs', url: 'https://nft.pulsechain.com', icon: '🎨' },
            { name: 'Nftscan', url: 'https://pulsechain.nftscan.com', icon: '🔍' },
            { name: 'HEX Toys', url: 'https://hextoys.io', icon: '🧸' },
        ],
    },
    {
        id: 'tools',
        name: 'Tools',
        color: '#3b82f6', // blue
        icon: 'tools',
        pinned: [
            { name: 'PulseScan', url: 'https://scan.pulsechain.com', icon: '🔎' },
            { name: 'PulseChain Bridge', url: 'https://bridge.pulsechain.com', icon: '🌉' },
            { name: 'DEXscreener', url: 'https://dexscreener.com/pulsechain', icon: '📉' },
            { name: 'GoPulse', url: 'https://gopulse.com', icon: '🚀' },
            { name: 'Beacon', url: 'https://beacon.pulsechain.com', icon: '📡' },
        ],
    },
];

/**
 * Load spaces from store, or initialize with defaults
 */
const loadSpaces = () => {
    let spaces = getStore('spaces.list');
    if (!spaces || !Array.isArray(spaces) || spaces.length === 0) {
        spaces = DEFAULT_SPACES;
        setStore('spaces.list', spaces);
    }
    return spaces;
};

/**
 * Save spaces to store
 */
const saveSpaces = (spaces) => {
    setStore('spaces.list', spaces);
};

/**
 * Get active space ID
 */
const getActiveSpaceId = () => {
    return getStore('spaces.active') || null;
};

/**
 * Set active space ID
 */
const setActiveSpaceId = (id) => {
    setStore('spaces.active', id);
};

/**
 * Generate a unique ID
 */
const generateId = () => {
    return 'space_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
};

/**
 * Get all spaces
 */
const getSpaces = () => {
    return {
        spaces: loadSpaces(),
        activeSpaceId: getActiveSpaceId(),
    };
};

/**
 * Create a new space
 */
const createSpace = ({ name, color, icon }) => {
    if (!name || !name.trim()) {
        return { success: false, error: 'Space name is required' };
    }
    const spaces = loadSpaces();
    const newSpace = {
        id: generateId(),
        name: name.trim(),
        color: color || '#6366f1',
        icon: icon || 'custom',
        pinned: [],
    };
    spaces.push(newSpace);
    saveSpaces(spaces);
    log.info(`[Spaces] Created space: ${newSpace.name} (${newSpace.id})`);
    return { success: true, space: newSpace };
};

/**
 * Delete a space
 */
const deleteSpace = (id) => {
    let spaces = loadSpaces();
    const idx = spaces.findIndex((s) => s.id === id);
    if (idx === -1) {
        return { success: false, error: 'Space not found' };
    }
    const removed = spaces.splice(idx, 1);
    saveSpaces(spaces);
    // If active space was deleted, clear it
    if (getActiveSpaceId() === id) {
        setActiveSpaceId(null);
    }
    log.info(`[Spaces] Deleted space: ${removed[0].name}`);
    return { success: true };
};

/**
 * Rename a space
 */
const renameSpace = (id, name) => {
    if (!name || !name.trim()) {
        return { success: false, error: 'Name is required' };
    }
    const spaces = loadSpaces();
    const space = spaces.find((s) => s.id === id);
    if (!space) {
        return { success: false, error: 'Space not found' };
    }
    space.name = name.trim();
    saveSpaces(spaces);
    log.info(`[Spaces] Renamed space ${id} to: ${space.name}`);
    return { success: true, space };
};

/**
 * Update space color
 */
const updateSpaceColor = (id, color) => {
    const spaces = loadSpaces();
    const space = spaces.find((s) => s.id === id);
    if (!space) {
        return { success: false, error: 'Space not found' };
    }
    space.color = color;
    saveSpaces(spaces);
    return { success: true, space };
};

/**
 * Switch active space
 */
const switchSpace = (id) => {
    const spaces = loadSpaces();
    if (id !== null) {
        const space = spaces.find((s) => s.id === id);
        if (!space) {
            return { success: false, error: 'Space not found' };
        }
    }
    setActiveSpaceId(id);
    log.info(`[Spaces] Switched to space: ${id}`);
    return { success: true, activeSpaceId: id };
};

/**
 * Add a dApp to a space
 */
const addDapp = (spaceId, { name, url, icon }) => {
    if (!url || !url.trim()) {
        return { success: false, error: 'URL is required' };
    }
    const spaces = loadSpaces();
    const space = spaces.find((s) => s.id === spaceId);
    if (!space) {
        return { success: false, error: 'Space not found' };
    }
    // Check for duplicate URL
    if (space.pinned.some((d) => d.url === url.trim())) {
        return { success: false, error: 'dApp already exists in this space' };
    }
    space.pinned.push({
        name: (name || url).trim(),
        url: url.trim(),
        icon: icon || '🌐',
    });
    saveSpaces(spaces);
    log.info(`[Spaces] Added dApp to ${space.name}: ${url}`);
    return { success: true, space };
};

/**
 * Remove a dApp from a space
 */
const removeDapp = (spaceId, url) => {
    const spaces = loadSpaces();
    const space = spaces.find((s) => s.id === spaceId);
    if (!space) {
        return { success: false, error: 'Space not found' };
    }
    const idx = space.pinned.findIndex((d) => d.url === url);
    if (idx === -1) {
        return { success: false, error: 'dApp not found in space' };
    }
    space.pinned.splice(idx, 1);
    saveSpaces(spaces);
    log.info(`[Spaces] Removed dApp from ${space.name}: ${url}`);
    return { success: true, space };
};

/**
 * Initialize IPC handlers for spaces
 */
export const initSpacesHandlers = () => {
    ipcMain.handle('spaces:get', async () => {
        return getSpaces();
    });

    ipcMain.handle('spaces:create', async (event, { name, color, icon }) => {
        return createSpace({ name, color, icon });
    });

    ipcMain.handle('spaces:delete', async (event, { id }) => {
        return deleteSpace(id);
    });

    ipcMain.handle('spaces:rename', async (event, { id, name }) => {
        return renameSpace(id, name);
    });

    ipcMain.handle('spaces:update-color', async (event, { id, color }) => {
        return updateSpaceColor(id, color);
    });

    ipcMain.handle('spaces:switch', async (event, { id }) => {
        return switchSpace(id);
    });

    ipcMain.handle('spaces:add-dapp', async (event, { spaceId, name, url, icon }) => {
        return addDapp(spaceId, { name, url, icon });
    });

    ipcMain.handle('spaces:remove-dapp', async (event, { spaceId, url }) => {
        return removeDapp(spaceId, url);
    });

    // Initialize default spaces if needed
    loadSpaces();
    log.info('[Spaces] Spaces manager initialized');
};

export default {
    getSpaces,
    createSpace,
    deleteSpace,
    renameSpace,
    switchSpace,
    addDapp,
    removeDapp,
};
