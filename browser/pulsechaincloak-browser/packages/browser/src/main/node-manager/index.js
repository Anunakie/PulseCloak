// PulseChainCloak Browser - Node Control Panel Manager
// Manages the PulseChainCloak node binary (start/stop/monitor/configure)
// Supports bundled binary, local discovery, and auto-download from GitHub

import { ipcMain, app } from 'electron';

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const Store = require('electron-store');
const log = require('electron-log');

// Node state
let store;
let nodeProcess = null;
let nodeStatus = 'stopped'; // 'stopped' | 'starting' | 'running' | 'error'
let nodeLogs = [];
const MAX_LOG_LINES = 500;
let downloadProgress = 0;
let isDownloading = false;

const STORE_KEY_NODE_CONFIG = 'node-config';
const STORE_KEY_NODE_BINARY = 'node-binary-path';

// GitHub release info for auto-download
const GITHUB_REPO = 'Anunakie/PulseCloak';
const RELEASE_TAG = 'v0.1.0-beta';
const NODE_RELEASE_ASSETS = {
    win32: 'PulseCloakNode-Windows-x64.zip',
    linux: 'PulseCloakNode-Linux.zip',
    darwin: 'PulseCloakNode-macOS.zip',
};

// Default node configuration
const DEFAULT_CONFIG = {
    neighborhoodMode: 'standard',
    blockchainServiceUrl: 'https://rpc.pulsechain.com',
    earningWallet: '',
    gasPrice: '1',
    dataDirectory: '',
    dnsServers: '1.1.1.1,1.0.0.1',
    logLevel: 'info',
    chainId: 369,
};

function getStore() {
    if (!store) {
        store = new Store();
    }
    return store;
}

/**
 * Get node configuration
 */
function getNodeConfig() {
    const s = getStore();
    const config = s.get(STORE_KEY_NODE_CONFIG);
    if (config && typeof config === 'object') {
        return { ...DEFAULT_CONFIG, ...config };
    }
    return { ...DEFAULT_CONFIG };
}

/**
 * Save node configuration
 */
function saveNodeConfig(config) {
    const s = getStore();
    const current = getNodeConfig();
    const updated = { ...current, ...config };
    s.set(STORE_KEY_NODE_CONFIG, updated);
    log.info('NODE-MANAGER: Config saved');
    return updated;
}

/**
 * Add a log entry
 */
function addLog(message, level = 'info') {
    const entry = {
        timestamp: new Date().toISOString(),
        message: message.toString().trim(),
        level,
    };
    nodeLogs.push(entry);
    if (nodeLogs.length > MAX_LOG_LINES) {
        nodeLogs = nodeLogs.slice(-MAX_LOG_LINES);
    }
}

/**
 * Get the user data directory for storing downloaded binaries
 */
function getNodeBinDir() {
    const dir = path.join(app.getPath('userData'), 'node-bin');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}

/**
 * Find the PulseChainCloak node binary
 * Search order: bundled resources > user data > saved path > system paths
 */
function findNodeBinary() {
    const isWin = process.platform === 'win32';
    const binName = isWin ? 'PulseCloakNode.exe' : 'PulseCloakNode';
    const binNameAlt = isWin ? 'pulsecloak_node.exe' : 'pulsecloak_node';

    const possiblePaths = [
        // 1. Bundled with browser in resources/bin (extraResource)
        path.join(process.resourcesPath || '', 'bin', binName),
        path.join(process.resourcesPath || '', 'bin', binNameAlt),

        // 2. Downloaded to user data directory
        path.join(getNodeBinDir(), binName),
        path.join(getNodeBinDir(), binNameAlt),

        // 3. Previously saved custom path
        getStore().get(STORE_KEY_NODE_BINARY) || '',

        // 4. Same directory as browser executable
        path.join(path.dirname(process.execPath), binName),
        path.join(path.dirname(process.execPath), binNameAlt),

        // 5. Built from source
        path.join(process.env.HOME || process.env.USERPROFILE || '/root',
            'PulseChainCloak', 'node', 'target', 'release', binName),
        path.join(process.env.HOME || process.env.USERPROFILE || '/root',
            'PulseChainCloak', 'node', 'target', 'release', binNameAlt),

        // 6. System paths
        isWin ? path.join(process.env.LOCALAPPDATA || '', 'PulseChainCloak', binName) : '/usr/local/bin/PulseCloakNode',
        isWin ? path.join(process.env.PROGRAMFILES || '', 'PulseChainCloak', binName) : '/usr/local/bin/pulsecloak_node',
        isWin ? '' : '/usr/bin/PulseCloakNode',
        isWin ? '' : '/usr/bin/pulsecloak_node',
    ].filter(p => p);

    for (const p of possiblePaths) {
        try {
            if (fs.existsSync(p)) {
                log.info('NODE-MANAGER: Found binary at ' + p);
                return p;
            }
        } catch (e) {
            // skip
        }
    }
    return null;
}

/**
 * Download a file following redirects
 */
function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const makeRequest = (requestUrl, redirectCount = 0) => {
            if (redirectCount > 5) {
                reject(new Error('Too many redirects'));
                return;
            }

            const protocol = requestUrl.startsWith('https') ? https : http;
            const req = protocol.get(requestUrl, {
                headers: { 'User-Agent': 'PulseChainCloakBrowser/1.0', 'Accept': 'application/octet-stream' }
            }, (res) => {
                // Handle redirects
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    makeRequest(res.headers.location, redirectCount + 1);
                    return;
                }

                if (res.statusCode !== 200) {
                    reject(new Error('Download failed with status ' + res.statusCode));
                    return;
                }

                const totalSize = parseInt(res.headers['content-length'] || '0', 10);
                let downloaded = 0;
                const file = fs.createWriteStream(destPath);

                res.on('data', (chunk) => {
                    downloaded += chunk.length;
                    if (totalSize > 0) {
                        downloadProgress = Math.round((downloaded / totalSize) * 100);
                    }
                });

                res.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(destPath);
                });
                file.on('error', (err) => {
                    fs.unlinkSync(destPath);
                    reject(err);
                });
            });

            req.on('error', reject);
            req.setTimeout(120000, () => {
                req.destroy();
                reject(new Error('Download timeout'));
            });
        };

        makeRequest(url);
    });
}

/**
 * Extract a ZIP file (cross-platform)
 */
async function extractZip(zipPath, destDir) {
    const isWin = process.platform === 'win32';

    if (isWin) {
        // Use PowerShell on Windows
        execSync(
            `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`,
            { timeout: 60000 }
        );
    } else {
        // Use unzip on Linux/macOS
        try {
            execSync(`unzip -o "${zipPath}" -d "${destDir}"`, { timeout: 60000 });
        } catch (e) {
            // Try with tar if unzip not available
            execSync(`python3 -c "import zipfile; zipfile.ZipFile('${zipPath}').extractall('${destDir}')"`,
                { timeout: 60000 });
        }
    }
}

/**
 * Download the node binary from GitHub releases
 */
async function downloadNodeBinary() {
    if (isDownloading) {
        return { status: 'downloading', progress: downloadProgress, message: 'Download already in progress' };
    }

    const platform = process.platform;
    const assetName = NODE_RELEASE_ASSETS[platform];

    if (!assetName) {
        return { status: 'error', message: 'No pre-built binary available for ' + platform };
    }

    isDownloading = true;
    downloadProgress = 0;
    addLog('Starting node binary download...', 'info');

    try {
        // Get release info from GitHub API
        const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/releases/tags/${RELEASE_TAG}`;
        addLog('Fetching release info from ' + apiUrl, 'info');

        const releaseData = await new Promise((resolve, reject) => {
            https.get(apiUrl, {
                headers: { 'User-Agent': 'PulseChainCloakBrowser/1.0', 'Accept': 'application/vnd.github.v3+json' }
            }, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error('Failed to parse release data'));
                    }
                });
            }).on('error', reject);
        });

        // Find the asset download URL
        const asset = releaseData.assets?.find(a => a.name === assetName);
        if (!asset) {
            throw new Error('Asset ' + assetName + ' not found in release ' + RELEASE_TAG);
        }

        const downloadUrl = asset.browser_download_url;
        addLog('Downloading from: ' + downloadUrl, 'info');

        // Download to temp location
        const binDir = getNodeBinDir();
        const zipPath = path.join(binDir, assetName);

        await downloadFile(downloadUrl, zipPath);
        addLog('Download complete, extracting...', 'info');

        // Extract
        await extractZip(zipPath, binDir);
        addLog('Extraction complete', 'info');

        // Clean up zip
        try { fs.unlinkSync(zipPath); } catch (e) { /* ignore */ }

        // Make binary executable on Unix
        if (platform !== 'win32') {
            const binName = 'PulseCloakNode';
            const binPath = path.join(binDir, binName);
            if (fs.existsSync(binPath)) {
                fs.chmodSync(binPath, 0o755);
            }
            // Also check for alternate name
            const altPath = path.join(binDir, 'pulsecloak_node');
            if (fs.existsSync(altPath)) {
                fs.chmodSync(altPath, 0o755);
            }
        }

        // Verify binary exists
        const foundBinary = findNodeBinary();
        if (foundBinary) {
            addLog('Node binary ready at: ' + foundBinary, 'info');
            getStore().set(STORE_KEY_NODE_BINARY, foundBinary);
            isDownloading = false;
            downloadProgress = 100;
            return { status: 'success', message: 'Node binary downloaded and ready', path: foundBinary };
        } else {
            throw new Error('Binary not found after extraction');
        }
    } catch (err) {
        isDownloading = false;
        downloadProgress = 0;
        addLog('Download failed: ' + err.message, 'error');
        log.error('NODE-MANAGER: Download failed ->', err.message);
        return { status: 'error', message: 'Download failed: ' + err.message };
    }
}

/**
 * Start the PulseChainCloak node
 */
async function startNode() {
    if (nodeProcess && nodeStatus === 'running') {
        return { status: 'running', message: 'Node is already running' };
    }

    let binaryPath = findNodeBinary();

    // Auto-download if not found
    if (!binaryPath) {
        addLog('Node binary not found locally. Attempting auto-download...', 'info');
        const dlResult = await downloadNodeBinary();
        if (dlResult.status === 'success') {
            binaryPath = dlResult.path;
        } else {
            nodeStatus = 'error';
            return {
                status: 'error',
                message: 'Node binary not found and download failed: ' + dlResult.message,
                canDownload: true,
            };
        }
    }

    const config = getNodeConfig();
    nodeStatus = 'starting';
    addLog('Starting PulseChainCloak node...', 'info');
    addLog('Binary: ' + binaryPath, 'info');

    // Build command arguments
    const args = [
        '--neighborhood-mode', config.neighborhoodMode,
        '--blockchain-service-url', config.blockchainServiceUrl,
        '--chain', 'mainnet',
        '--log-level', config.logLevel,
    ];

    if (config.earningWallet) {
        args.push('--earning-wallet', config.earningWallet);
    }

    if (config.dnsServers) {
        args.push('--dns-servers', config.dnsServers);
    }

    if (config.gasPrice) {
        args.push('--gas-price', config.gasPrice);
    }

    addLog('Args: ' + args.join(' '), 'info');

    try {
        nodeProcess = spawn(binaryPath, args, {
            stdio: ['pipe', 'pipe', 'pipe'],
            detached: false,
        });

        nodeProcess.stdout.on('data', (data) => {
            const lines = data.toString().split('\n').filter((l) => l.trim());
            lines.forEach((line) => addLog(line, 'info'));
        });

        nodeProcess.stderr.on('data', (data) => {
            const lines = data.toString().split('\n').filter((l) => l.trim());
            lines.forEach((line) => addLog(line, 'error'));
        });

        nodeProcess.on('error', (err) => {
            nodeStatus = 'error';
            addLog('Node process error: ' + err.message, 'error');
            log.error('NODE-MANAGER: Process error ->', err.message);
        });

        nodeProcess.on('exit', (code, signal) => {
            nodeStatus = 'stopped';
            addLog(
                'Node process exited with code ' + code + (signal ? ' signal ' + signal : ''),
                code === 0 ? 'info' : 'error'
            );
            nodeProcess = null;
            log.info('NODE-MANAGER: Process exited, code=' + code);
        });

        // Give it a moment to start
        await new Promise((resolve) => setTimeout(resolve, 1500));

        if (nodeProcess && !nodeProcess.killed) {
            nodeStatus = 'running';
            addLog('Node started successfully (PID: ' + nodeProcess.pid + ')', 'info');
            log.info('NODE-MANAGER: Node started, PID=' + nodeProcess.pid);
        }

        return { status: nodeStatus, message: 'Node started', pid: nodeProcess?.pid };
    } catch (err) {
        nodeStatus = 'error';
        addLog('Failed to start node: ' + err.message, 'error');
        log.error('NODE-MANAGER: Failed to start ->', err.message);
        return { status: 'error', message: err.message };
    }
}

/**
 * Stop the PulseChainCloak node
 */
async function stopNode() {
    if (!nodeProcess) {
        nodeStatus = 'stopped';
        return { status: 'stopped', message: 'Node is not running' };
    }

    addLog('Stopping PulseChainCloak node...', 'info');

    try {
        if (process.platform === 'win32') {
            nodeProcess.kill('SIGTERM');
        } else {
            nodeProcess.kill('SIGTERM');
        }

        // Wait for graceful shutdown (up to 5 seconds)
        await new Promise((resolve) => {
            const timeout = setTimeout(() => {
                if (nodeProcess && !nodeProcess.killed) {
                    nodeProcess.kill('SIGKILL');
                    addLog('Node force-killed (SIGKILL)', 'warn');
                }
                resolve();
            }, 5000);

            if (nodeProcess) {
                nodeProcess.on('exit', () => {
                    clearTimeout(timeout);
                    resolve();
                });
            } else {
                clearTimeout(timeout);
                resolve();
            }
        });

        nodeProcess = null;
        nodeStatus = 'stopped';
        addLog('Node stopped', 'info');
        log.info('NODE-MANAGER: Node stopped');

        return { status: 'stopped', message: 'Node stopped' };
    } catch (err) {
        addLog('Error stopping node: ' + err.message, 'error');
        log.error('NODE-MANAGER: Error stopping ->', err.message);
        return { status: 'error', message: err.message };
    }
}

/**
 * Get node status
 */
function getNodeStatus() {
    const binaryPath = findNodeBinary();
    return {
        status: nodeStatus,
        pid: nodeProcess?.pid || null,
        uptime: nodeProcess ? process.uptime() : 0,
        binaryFound: !!binaryPath,
        binaryPath: binaryPath || null,
        isDownloading: isDownloading,
        downloadProgress: downloadProgress,
    };
}

/**
 * Get node logs
 */
function getNodeLogs(limit = 100) {
    const count = Math.min(limit, nodeLogs.length);
    return nodeLogs.slice(-count);
}

/**
 * Clear node logs
 */
function clearNodeLogs() {
    nodeLogs = [];
    return { cleared: true };
}

/**
 * Set custom binary path
 */
function setNodeBinaryPath(binaryPath) {
    if (binaryPath && fs.existsSync(binaryPath)) {
        getStore().set(STORE_KEY_NODE_BINARY, binaryPath);
        addLog('Custom binary path set: ' + binaryPath, 'info');
        return { status: 'success', path: binaryPath };
    }
    return { status: 'error', message: 'File not found: ' + binaryPath };
}

/**
 * Initialize IPC handlers for node management
 */
export function initNodeManagerHandlers() {
    ipcMain.handle('node:start', async (event) => {
        return await startNode();
    });

    ipcMain.handle('node:stop', async (event) => {
        return await stopNode();
    });

    ipcMain.handle('node:get-status', async (event) => {
        return getNodeStatus();
    });

    ipcMain.handle('node:get-logs', async (event, { limit } = {}) => {
        return getNodeLogs(limit || 100);
    });

    ipcMain.handle('node:clear-logs', async (event) => {
        return clearNodeLogs();
    });

    ipcMain.handle('node:get-config', async (event) => {
        return getNodeConfig();
    });

    ipcMain.handle('node:save-config', async (event, config) => {
        return saveNodeConfig(config);
    });

    ipcMain.handle('node:download-binary', async (event) => {
        return await downloadNodeBinary();
    });

    ipcMain.handle('node:get-download-progress', async (event) => {
        return { isDownloading, progress: downloadProgress };
    });

    ipcMain.handle('node:set-binary-path', async (event, binaryPath) => {
        return setNodeBinaryPath(binaryPath);
    });

    log.info('NODE-MANAGER: IPC handlers registered');
}

export { startNode, stopNode, getNodeStatus, getNodeLogs, getNodeConfig, downloadNodeBinary };
