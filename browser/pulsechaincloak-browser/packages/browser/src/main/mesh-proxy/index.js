import { session, ipcMain } from 'electron';
import { getStore, setStore } from '../store';
const net = require('net');
const log = require('electron-log');

/**
 * MeshProxy Manager
 * Routes browser traffic through the local PulseChainCloak node proxy.
 * Supports SOCKS5 and HTTP proxy modes.
 */

let meshEnabled = false;
let proxyPort = getStore('meshProxy.port') || 8080;
let proxyType = getStore('meshProxy.type') || 'socks5'; // 'socks5' or 'http'
let connectionStatus = 'disconnected'; // disconnected | connecting | connected | error
let lastError = null;
let healthCheckInterval = null;

/**
 * Check if the mesh node proxy is listening on the configured port
 */
const checkNodeRunning = (port) => {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(2000);
        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });
        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        socket.on('error', () => {
            socket.destroy();
            resolve(false);
        });
        socket.connect(port, '127.0.0.1');
    });
};

/**
 * Apply proxy settings to all Electron sessions
 */
const applyProxy = async (enable) => {
    const sessions = [
        session.defaultSession,
    ];

    // Also try the tab partition session
    try {
        const tabSession = session.fromPartition('persist:tabs6');
        if (tabSession) sessions.push(tabSession);
    } catch (e) {
        // ignore
    }

    for (const s of sessions) {
        if (enable) {
            let proxyRules;
            if (proxyType === 'socks5') {
                proxyRules = `socks5://127.0.0.1:${proxyPort}`;
            } else {
                proxyRules = `http://127.0.0.1:${proxyPort}`;
            }
            await s.setProxy({
                proxyRules,
                proxyBypassRules: '<local>,localhost,127.0.0.1',
            });
            log.info(`[MeshProxy] Proxy enabled: ${proxyRules}`);
        } else {
            await s.setProxy({ mode: 'direct' });
            log.info('[MeshProxy] Proxy disabled, using direct connection');
        }
    }
};

/**
 * Start health check polling when mesh is enabled
 */
const startHealthCheck = () => {
    stopHealthCheck();
    healthCheckInterval = setInterval(async () => {
        if (!meshEnabled) return;
        const running = await checkNodeRunning(proxyPort);
        if (running) {
            if (connectionStatus !== 'connected') {
                connectionStatus = 'connected';
                lastError = null;
                log.info('[MeshProxy] Node connection healthy');
            }
        } else {
            if (connectionStatus === 'connected') {
                connectionStatus = 'error';
                lastError = 'Node proxy not responding';
                log.warn('[MeshProxy] Node connection lost, falling back to direct');
                // Fallback to direct connection
                await applyProxy(false);
            }
        }
    }, 5000);
};

const stopHealthCheck = () => {
    if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
        healthCheckInterval = null;
    }
};

/**
 * Enable mesh proxy routing
 */
const enableMesh = async () => {
    try {
        connectionStatus = 'connecting';
        lastError = null;

        // Check if node is running
        const nodeRunning = await checkNodeRunning(proxyPort);
        if (!nodeRunning) {
            connectionStatus = 'error';
            lastError = `No proxy found on port ${proxyPort}. Is the PulseChainCloak node running?`;
            return {
                success: false,
                status: connectionStatus,
                error: lastError,
            };
        }

        // Apply proxy settings
        await applyProxy(true);
        meshEnabled = true;
        connectionStatus = 'connected';
        setStore('meshProxy.enabled', true);

        // Start health monitoring
        startHealthCheck();

        return {
            success: true,
            status: connectionStatus,
            port: proxyPort,
            type: proxyType,
        };
    } catch (err) {
        connectionStatus = 'error';
        lastError = err.message;
        log.error('[MeshProxy] Enable failed:', err);
        return {
            success: false,
            status: connectionStatus,
            error: lastError,
        };
    }
};

/**
 * Disable mesh proxy routing (fall back to direct)
 */
const disableMesh = async () => {
    try {
        await applyProxy(false);
        meshEnabled = false;
        connectionStatus = 'disconnected';
        lastError = null;
        setStore('meshProxy.enabled', false);
        stopHealthCheck();

        return {
            success: true,
            status: connectionStatus,
        };
    } catch (err) {
        log.error('[MeshProxy] Disable failed:', err);
        return {
            success: false,
            status: 'error',
            error: err.message,
        };
    }
};

/**
 * Get current mesh proxy status
 */
const getMeshStatus = async () => {
    const nodeRunning = await checkNodeRunning(proxyPort);
    return {
        enabled: meshEnabled,
        status: connectionStatus,
        port: proxyPort,
        type: proxyType,
        nodeDetected: nodeRunning,
        error: lastError,
        mode: meshEnabled ? 'mesh' : 'direct',
    };
};

/**
 * Set proxy port
 */
const setProxyPort = async (port) => {
    const p = parseInt(port, 10);
    if (isNaN(p) || p < 1 || p > 65535) {
        return { success: false, error: 'Invalid port number' };
    }
    proxyPort = p;
    setStore('meshProxy.port', p);

    // If mesh is enabled, re-apply with new port
    if (meshEnabled) {
        await applyProxy(false);
        return await enableMesh();
    }

    return { success: true, port: proxyPort };
};

/**
 * Set proxy type (socks5 or http)
 */
const setProxyType = async (type) => {
    if (type !== 'socks5' && type !== 'http') {
        return { success: false, error: 'Invalid proxy type. Use socks5 or http.' };
    }
    proxyType = type;
    setStore('meshProxy.type', type);

    // If mesh is enabled, re-apply with new type
    if (meshEnabled) {
        await applyProxy(false);
        return await enableMesh();
    }

    return { success: true, type: proxyType };
};

/**
 * Initialize IPC handlers for mesh proxy
 */
export const initMeshProxyHandlers = () => {
    ipcMain.handle('mesh:enable', async () => {
        return await enableMesh();
    });

    ipcMain.handle('mesh:disable', async () => {
        return await disableMesh();
    });

    ipcMain.handle('mesh:get-status', async () => {
        return await getMeshStatus();
    });

    ipcMain.handle('mesh:set-port', async (event, { port }) => {
        return await setProxyPort(port);
    });

    ipcMain.handle('mesh:set-type', async (event, { type }) => {
        return await setProxyType(type);
    });

    // Auto-enable if it was enabled in previous session
    const wasEnabled = getStore('meshProxy.enabled');
    if (wasEnabled) {
        setTimeout(async () => {
            log.info('[MeshProxy] Auto-enabling mesh proxy from previous session');
            await enableMesh();
        }, 3000);
    }
};

export default {
    enableMesh,
    disableMesh,
    getMeshStatus,
    setProxyPort,
    setProxyType,
};
