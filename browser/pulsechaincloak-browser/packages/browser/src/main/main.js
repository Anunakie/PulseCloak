const { app, BrowserWindow } = require('electron');
import initMain from './handlers';
import initStore from './store';
import { initSession } from './session';
import windowManager from './window';
import tabsManager from './tabs';
import { initExtensions } from './chrome-extensions';

const log = require('electron-log');

// Suppress non-critical crx-msg-remote errors from browser-action-list
// These occur when no tab is active (e.g., on startup or internal pages)
process.on('unhandledRejection', (reason) => {
    if (reason && reason.message && reason.message.includes('crx-msg-remote')) {
        // Silently ignore - this is expected when no tab is active
        return;
    }
    if (reason && reason.message && reason.message.includes('Unable to get active tab')) {
        return;
    }
    console.error('Unhandled rejection:', reason);
});



const isProduction = process.env.NODE_ENV === 'production';
const debugProd = process.env.DEBUG_PROD === 'true';

if (isProduction) {
    const sourceMapSupport = require('source-map-support');
    sourceMapSupport.install();

    if (!debugProd) {
        log.transports.file.level = 'error';
        log.transports.console.level = 'error';
    }
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

const start = async () => {
    // Spoof User-Agent on default session to appear as standard Chrome
    // This fixes Chrome Web Store and extension sites rejecting the browser
    const { session: electronSession } = require('electron');
    const defaultUA = electronSession.defaultSession.getUserAgent();
    const chromeUA = defaultUA
        .replace(/Electron\/[\S]+\s?/g, '')
        .replace(/PulseChainCloakBrowser\/[\S]+\s?/g, '')
        .replace(/pulsechaincloak-browser\/[\S]+\s?/g, '');
    electronSession.defaultSession.setUserAgent(chromeUA);

    initSession();
    launchApp();
};

const launchApp = async () => {
    // Create the browser window.
    const mainWindow = await windowManager.getMainWindow();

    // and load the index.html of the app.
    // eslint-disable-next-line no-undef
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    // Extension monitor window - created but kept hidden
    // const monitorWindow = await windowManager.getExtensionMonitorWindow();
    // monitorWindow.loadURL(EXTENSION_MONITOR_WEBPACK_ENTRY);

    initExtensions();

    // Create a default tab so extensions have an active tab to work with
    // This prevents "Unable to get active tab" errors from browser-action-list
    setTimeout(async () => {
        try {
            const tabsManager = (await import('./tabs')).default;
            const existingTabs = tabsManager.tabList;
            if (!existingTabs || existingTabs.size === 0) {
                await tabsManager.loadInTab({ url: 'about:blank' });
            }
        } catch (err) {
            console.log('Default tab creation skipped:', err.message);
        }
    }, 1000);

    // Browser starts with welcome page only - no auto-loading external sites
    // Users can navigate manually from the welcome page
};

app.whenReady()
    .then(start)
    .catch((error) => log.error(error));

app.on('will-finish-launching', () => {
    initMain();
    initStore();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        launchApp();
    }
});

// Log web-contents-created events but do NOT auto-open devtools
app.on('web-contents-created', async (event, webContents) => {
    const type = webContents.getType();
    const url = webContents.getURL();
    const title = webContents.getTitle();
    console.log(
        `'web-contents-created' event [type:${type}, url:${url}, title:${title}]`
    );
});
