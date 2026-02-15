// PulseChainCloak Browser - IPFS Decentralized File Sharing
// Uses IPFS HTTP API (compatible with local node or Infura/Pinata)

import { ipcMain, dialog, BrowserWindow } from 'electron';

const fs = require('fs');
const path = require('path');
const Store = require('electron-store');
const log = require('electron-log');

// ===== STORE =====
let store;
function getStore() {
    if (!store) {
        store = new Store({ name: 'pulsechaincloak-ipfs' });
    }
    return store;
}

// ===== CONFIGURATION =====
const DEFAULT_API_URL = 'http://127.0.0.1:5001'; // Local IPFS node API
const DEFAULT_GATEWAY_URL = 'https://ipfs.io';
const FALLBACK_GATEWAYS = [
    'https://ipfs.io',
    'https://gateway.pinata.cloud',
    'https://cloudflare-ipfs.com',
    'https://dweb.link',
];

function getConfig() {
    const s = getStore();
    return {
        apiUrl: s.get('ipfs-api-url') || DEFAULT_API_URL,
        gatewayUrl: s.get('ipfs-gateway-url') || DEFAULT_GATEWAY_URL,
    };
}

function setConfig(config) {
    const s = getStore();
    if (config.apiUrl) s.set('ipfs-api-url', config.apiUrl);
    if (config.gatewayUrl) s.set('ipfs-gateway-url', config.gatewayUrl);
    return getConfig();
}

// ===== FILE STORAGE =====
function getUploadedFiles() {
    const s = getStore();
    return s.get('uploaded-files') || [];
}

function saveUploadedFile(fileInfo) {
    const s = getStore();
    let files = s.get('uploaded-files') || [];
    // Deduplicate by CID
    const exists = files.find((f) => f.cid === fileInfo.cid);
    if (!exists) {
        files.unshift(fileInfo); // newest first
        // Keep last 200 files
        if (files.length > 200) {
            files = files.slice(0, 200);
        }
        s.set('uploaded-files', files);
    }
    return files;
}

function removeUploadedFile(cid) {
    const s = getStore();
    let files = s.get('uploaded-files') || [];
    files = files.filter((f) => f.cid !== cid);
    s.set('uploaded-files', files);
    return files;
}

// ===== FILE TYPE DETECTION =====
function getFileType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const typeMap = {
        '.jpg': 'image', '.jpeg': 'image', '.png': 'image', '.gif': 'image',
        '.bmp': 'image', '.svg': 'image', '.webp': 'image', '.ico': 'image',
        '.mp4': 'video', '.webm': 'video', '.avi': 'video', '.mov': 'video',
        '.mkv': 'video', '.flv': 'video',
        '.mp3': 'audio', '.wav': 'audio', '.ogg': 'audio', '.flac': 'audio',
        '.aac': 'audio', '.wma': 'audio',
        '.pdf': 'document', '.doc': 'document', '.docx': 'document',
        '.xls': 'document', '.xlsx': 'document', '.ppt': 'document',
        '.pptx': 'document', '.odt': 'document', '.ods': 'document',
        '.txt': 'text', '.md': 'text', '.csv': 'text', '.json': 'text',
        '.xml': 'text', '.html': 'text', '.css': 'text', '.js': 'text',
        '.zip': 'archive', '.rar': 'archive', '.7z': 'archive',
        '.tar': 'archive', '.gz': 'archive', '.bz2': 'archive',
    };
    return typeMap[ext] || 'file';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ===== IPFS API OPERATIONS =====

/**
 * Check if IPFS API is available
 */
async function checkApiAvailable() {
    const config = getConfig();
    try {
        const fetch = (await import('node-fetch')).default;
        const resp = await fetch(config.apiUrl + '/api/v0/id', {
            method: 'POST',
            timeout: 5000,
        });
        if (resp.ok) {
            const data = await resp.json();
            return { available: true, peerId: data.ID };
        }
        return { available: false };
    } catch (e) {
        return { available: false, error: e.message };
    }
}

/**
 * Upload a file to IPFS via the HTTP API
 * @param {string} filePath - Path to the file
 * @returns {object} - { cid, name, size, type }
 */
async function uploadFile(filePath) {
    if (!filePath || !fs.existsSync(filePath)) {
        throw new Error('File not found: ' + filePath);
    }

    const config = getConfig();
    const fileName = path.basename(filePath);
    const fileStats = fs.statSync(filePath);
    const fileBuffer = fs.readFileSync(filePath);
    const fileType = getFileType(fileName);

    // Try local IPFS API first
    let cid = null;
    try {
        const fetch = (await import('node-fetch')).default;
        const FormData = (await import('form-data')).default;

        const form = new FormData();
        form.append('file', fileBuffer, {
            filename: fileName,
            contentType: 'application/octet-stream',
        });

        const resp = await fetch(config.apiUrl + '/api/v0/add?pin=true', {
            method: 'POST',
            body: form,
            headers: form.getHeaders(),
            timeout: 120000,
        });

        if (resp.ok) {
            const data = await resp.json();
            cid = data.Hash;
        }
    } catch (e) {
        log.warn('IPFS: Local API upload failed, trying alternative:', e.message);
    }

    // If local API failed, try using ipfs-http-client
    if (!cid) {
        try {
            const { create } = await import('ipfs-http-client');
            const client = create({ url: config.apiUrl });
            const result = await client.add(fileBuffer, { pin: true });
            cid = result.cid.toString();
        } catch (e) {
            log.warn('IPFS: ipfs-http-client upload failed:', e.message);
        }
    }

    if (!cid) {
        throw new Error(
            'Failed to upload to IPFS. Make sure a local IPFS node is running at ' +
            config.apiUrl + ' or configure a remote API endpoint.'
        );
    }

    const fileInfo = {
        cid,
        name: fileName,
        size: fileStats.size,
        sizeFormatted: formatFileSize(fileStats.size),
        type: fileType,
        uploadedAt: Date.now(),
        gatewayUrl: config.gatewayUrl + '/ipfs/' + cid,
    };

    saveUploadedFile(fileInfo);
    log.info('IPFS: File uploaded ->', fileName, 'CID:', cid);

    return fileInfo;
}

/**
 * Download a file from IPFS by CID
 * @param {string} cid - IPFS CID
 * @param {string} savePath - Optional save path
 * @returns {object} - { success, path, size }
 */
async function downloadFile(cid, savePath) {
    if (!cid || cid.trim().length === 0) {
        throw new Error('CID is required');
    }

    const config = getConfig();
    const cleanCid = cid.trim();

    // If no save path, ask user
    if (!savePath) {
        const result = await dialog.showSaveDialog({
            title: 'Save IPFS File',
            defaultPath: path.join(require('os').homedir(), 'Downloads', cleanCid),
            buttonLabel: 'Save',
        });
        if (result.canceled || !result.filePath) {
            return { success: false, canceled: true };
        }
        savePath = result.filePath;
    }

    // Try downloading from gateway
    const gateways = [config.gatewayUrl, ...FALLBACK_GATEWAYS];
    let downloaded = false;

    for (const gw of gateways) {
        try {
            const fetch = (await import('node-fetch')).default;
            const url = gw + '/ipfs/' + cleanCid;
            log.info('IPFS: Trying download from', url);

            const resp = await fetch(url, { timeout: 60000 });
            if (resp.ok) {
                const buffer = await resp.buffer();
                fs.writeFileSync(savePath, buffer);
                downloaded = true;

                log.info('IPFS: File downloaded ->', savePath);
                return {
                    success: true,
                    path: savePath,
                    size: buffer.length,
                    sizeFormatted: formatFileSize(buffer.length),
                    gateway: gw,
                };
            }
        } catch (e) {
            log.warn('IPFS: Download from', gw, 'failed:', e.message);
            continue;
        }
    }

    // Try local IPFS API cat
    if (!downloaded) {
        try {
            const fetch = (await import('node-fetch')).default;
            const resp = await fetch(
                config.apiUrl + '/api/v0/cat?arg=' + cleanCid,
                { method: 'POST', timeout: 60000 }
            );
            if (resp.ok) {
                const buffer = await resp.buffer();
                fs.writeFileSync(savePath, buffer);
                return {
                    success: true,
                    path: savePath,
                    size: buffer.length,
                    sizeFormatted: formatFileSize(buffer.length),
                    gateway: 'local',
                };
            }
        } catch (e) {
            log.warn('IPFS: Local API cat failed:', e.message);
        }
    }

    throw new Error('Failed to download file from IPFS. CID: ' + cleanCid);
}

/**
 * Get file info from IPFS
 * @param {string} cid - IPFS CID
 * @returns {object}
 */
async function getFileInfo(cid) {
    if (!cid) throw new Error('CID is required');

    const config = getConfig();
    const cleanCid = cid.trim();

    // Check local store first
    const files = getUploadedFiles();
    const local = files.find((f) => f.cid === cleanCid);
    if (local) return local;

    // Try to get info from IPFS API
    try {
        const fetch = (await import('node-fetch')).default;
        const resp = await fetch(
            config.apiUrl + '/api/v0/object/stat?arg=' + cleanCid,
            { method: 'POST', timeout: 10000 }
        );
        if (resp.ok) {
            const data = await resp.json();
            return {
                cid: cleanCid,
                size: data.CumulativeSize || 0,
                sizeFormatted: formatFileSize(data.CumulativeSize || 0),
                type: 'unknown',
                gatewayUrl: config.gatewayUrl + '/ipfs/' + cleanCid,
            };
        }
    } catch (e) {
        log.warn('IPFS: Failed to get file info:', e.message);
    }

    return {
        cid: cleanCid,
        size: 0,
        sizeFormatted: 'Unknown',
        type: 'unknown',
        gatewayUrl: config.gatewayUrl + '/ipfs/' + cleanCid,
    };
}

/**
 * Open file dialog for selecting files to upload
 * @returns {object} - { filePaths }
 */
async function openFileDialog() {
    const result = await dialog.showOpenDialog({
        title: 'Select Files to Upload to IPFS',
        properties: ['openFile', 'multiSelections'],
        buttonLabel: 'Upload to IPFS',
    });
    return {
        canceled: result.canceled,
        filePaths: result.filePaths || [],
    };
}

// ===== IPC HANDLERS =====
export function initIpfsHandlers() {
    ipcMain.handle('ipfs:upload-file', async (event, { filePath }) => {
        return await uploadFile(filePath);
    });

    ipcMain.handle('ipfs:upload-files', async (event, { filePaths }) => {
        const results = [];
        for (const fp of filePaths) {
            try {
                const result = await uploadFile(fp);
                results.push(result);
            } catch (e) {
                results.push({ error: e.message, filePath: fp });
            }
        }
        return results;
    });

    ipcMain.handle('ipfs:download-file', async (event, { cid, savePath }) => {
        return await downloadFile(cid, savePath);
    });

    ipcMain.handle('ipfs:get-files', async (event) => {
        return getUploadedFiles();
    });

    ipcMain.handle('ipfs:remove-file', async (event, { cid }) => {
        return removeUploadedFile(cid);
    });

    ipcMain.handle('ipfs:get-file-info', async (event, { cid }) => {
        return await getFileInfo(cid);
    });

    ipcMain.handle('ipfs:get-config', async (event) => {
        return getConfig();
    });

    ipcMain.handle('ipfs:set-config', async (event, config) => {
        return setConfig(config);
    });

    ipcMain.handle('ipfs:check-api', async (event) => {
        return await checkApiAvailable();
    });

    ipcMain.handle('ipfs:open-file-dialog', async (event) => {
        return await openFileDialog();
    });

    log.info('IPFS: IPC handlers registered');
}

export { uploadFile, downloadFile, getUploadedFiles, getFileInfo };
