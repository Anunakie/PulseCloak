const { app, BrowserWindow } = require('electron');
import path from 'path';
import fs from 'fs';
import initMain from './handlers';
import initStore from './store';
import { initSession, getTabSession } from './session';
import windowManager from './window';
import tabsManager from './tabs';
import {
    initExtensions,
    getExtensionFoldersAndManifests,
} from './chrome-extensions';

const log = require('electron-log');

const isProduction = process.env.NODE_ENV === 'production';
const debugProd = process.env.DEBUG_PROD === 'true';

if (isProduction) {
    try {
        const sourceMapSupport = require('source-map-support');
        sourceMapSupport.install();
    } catch (_) {
        /* optional */
    }
    if (!debugProd) {
        log.transports.file.level = 'error';
        log.transports.console.level = 'error';
    }
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
try {
    if (require('electron-squirrel-startup')) {
        app.quit();
    }
} catch (_) {
    /* not installed or non-Windows */
}

// Relax chromium args to allow extensions to work reliably.
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');

function resolveExtensionsDir() {
    // Dev: packages/browser/.webpack/main → ../../../../extensions
    // Prod: resources/app.asar/.webpack/main → ../../../../extensions
    const candidates = [
        path.join(__dirname, '../../../../extensions'),
        path.join(__dirname, '../../../../../extensions'),
        path.join(process.resourcesPath || '', 'extensions'),
    ];
    for (const c of candidates) {
        try {
            if (c && fs.existsSync(c)) return c;
        } catch (_) {
            /* skip */
        }
    }
    return candidates[0];
}

async function autoLoadExtensions() {
    const extensionsDir = resolveExtensionsDir();
    log.info('Loading extensions from', extensionsDir);
    if (!fs.existsSync(extensionsDir)) {
        log.warn('Extensions directory not found, skipping.');
        return;
    }
    const { folders } = getExtensionFoldersAndManifests(extensionsDir);
    const tabSession = getTabSession();
    for (const folder of folders) {
        try {
            // eslint-disable-next-line no-await-in-loop
            const ext = await tabSession.loadExtension(folder, {
                allowFileAccess: true,
            });
            log.info(`Loaded extension: ${ext.name} (${ext.id}) from ${folder}`);
        } catch (err) {
            log.error(`Failed to load extension from ${folder}:`, err?.message || err);
        }
    }
}

const launchApp = async () => {
    const mainWindow = await windowManager.getMainWindow();

    // eslint-disable-next-line no-undef
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    // Extension monitor is dev-only; launch but don't force-show.
    if (!isProduction || debugProd) {
        const monitorWindow = await windowManager.getExtensionMonitorWindow();
        // eslint-disable-next-line no-undef
        monitorWindow.loadURL(EXTENSION_MONITOR_WEBPACK_ENTRY);
        monitorWindow.once('ready-to-show', () => {
            // only show in dev/debug
            if (debugProd) {
                monitorWindow.show();
                monitorWindow.webContents.openDevTools();
            }
        });
    }

    await initExtensions();
    await autoLoadExtensions();

    // Open a single new-tab landing page once the renderer is ready.
    mainWindow.webContents.once('did-finish-load', () => {
        setTimeout(() => {
            tabsManager
                .loadInTab({ url: 'https://duckduckgo.com' })
                .catch((e) => log.error('Failed to open initial tab', e));
        }, 500);
    });
};

const start = async () => {
    initSession();
    await launchApp();
};

app.whenReady()
    .then(start)
    .catch((error) => log.error(error));

app.on('will-finish-launching', () => {
    initMain();
    initStore();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        launchApp();
    }
});

// Useful debug info for extension web-contents.
app.on('web-contents-created', (event, webContents) => {
    try {
        const type = webContents.getType();
        const url = webContents.getURL();
        log.debug(`web-contents-created [type:${type}, url:${url}]`);
    } catch (_) {
        /* ignore */
    }
});
