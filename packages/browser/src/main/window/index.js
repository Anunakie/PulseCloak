import { screen, BrowserWindow, Menu, MenuItem } from 'electron';
import events, { Event } from '../events';
import { addGlobalShortcuts, clearGlobalShortcuts } from '../shortcuts';
import { getTabSession } from '../session';

const path = require('path');
const log = require('electron-log');
const isDevelopment = process.env.NODE_ENV === 'development';
const debugProd = process.env.DEBUG_PROD === 'true';

export class Window {
    static MAIN = 'MAIN';
    static EXTENSION_MONITOR = 'EXTENSION_MONITOR';
    static DEVTOOLS = 'DEVTOOLS';
    static EXTENSION_POPUP = 'EXTENSION_POPUP';
}

export class Options {
    static MAIN = {
        show: false,
        width: 1440,
        height: 900,
        minWidth: 1120,
        minHeight: 720,
        title: 'PulseChainCloak Browser',
        // Frameless — custom titlebar drawn in renderer.
        frame: false,
        transparent: false,
        backgroundColor: '#0a0e1a',
        titleBarStyle: 'hidden',
        // macOS: keep traffic lights inset nicely.
        trafficLightPosition: { x: 12, y: 12 },
        webPreferences: {
            // eslint-disable-next-line no-undef
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
            devTools: true,
        },
    };
    static EXTENSION_MONITOR = {
        show: false,
        title: 'Extension Monitor',
        frame: true,
        transparent: false,
        backgroundColor: '#0a0e1a',
        titleBarStyle: 'hidden',
        webPreferences: {
            // eslint-disable-next-line no-undef
            preload: EXTENSION_MONITOR_PRELOAD_WEBPACK_ENTRY,
            devTools: true,
        },
    };
    static DEVTOOLS = {};
    static EXTENSION_POPUP = {
        frame: false,
        transparent: false,
        resizable: false,
        movable: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        backgroundColor: '#0a0e1a',
        webPreferences: {
            contextIsolation: true,
            sandbox: true,
            nodeIntegration: false,
            devTools: true,
        },
    };
}

const windows = new Map();
class WindowManager {
    async getMainWindow() {
        if (!windows.has(Window.MAIN)) {
            const mainWindow = await this.createMainWindow();
            windows.set(Window.MAIN, mainWindow);
        }
        return windows.get(Window.MAIN);
    }

    async getExtensionMonitorWindow() {
        const monitorWindow = await this.getWindow(Window.EXTENSION_MONITOR);
        const theEvents = [...Event.EXTENSION];
        events.subscribe(monitorWindow.webContents, theEvents);
        return monitorWindow;
    }

    async getWindow(type) {
        if (!windows.has(Window[type])) {
            const options = Options[type];
            if (type === Window.DEVTOOLS || type === Window.EXTENSION_MONITOR) {
                options.parent = await this.getMainWindow();
            }
            const window = new BrowserWindow(options);
            windows.set(Window[type], window);
        }
        return windows.get(Window[type]);
    }

    /**
     * Create a small wallet-style popup window for a Chrome extension.
     * IMPORTANT: we do NOT call loadURL() here — the electron-chrome-extensions
     * library handles loading the extension popup URL. We just configure the
     * window to look like a normal wallet popup.
     */
    getWindowForExtensionPopup(details) {
        const options = { ...Options.EXTENSION_POPUP };
        options.webPreferences = { ...options.webPreferences };
        options.webPreferences.session = getTabSession();

        // Clamp to sane wallet popup sizes.
        const width = Math.min(Math.max(details.width || 360, 320), 480);
        const height = Math.min(Math.max(details.height || 600, 400), 760);
        options.width = width;
        options.height = height;

        // Position near top-right by default (under the extensions toolbar).
        const mainWin = windows.get(Window.MAIN);
        if (mainWin && !mainWin.isDestroyed()) {
            const bounds = mainWin.getBounds();
            options.x = bounds.x + bounds.width - width - 16;
            options.y = bounds.y + 132;
        }

        const window = new BrowserWindow(options);
        window.setMenuBarVisibility(false);

        // If the library provides a URL, load it; the library itself also
        // calls loadURL — tolerate that race with a simple guard.
        if (details.url && !window.__loadedPopup) {
            window.__loadedPopup = true;
            window.webContents.loadURL(details.url).catch((e) => {
                log.warn('Extension popup load failed', e);
            });
        }

        windows.set(window.id, window);
        return window;
    }

    async createMainWindow() {
        const options = Options.MAIN;

        if (isDevelopment) {
            const workAreaSize = screen.getPrimaryDisplay().workAreaSize;
            options.width = Math.floor(workAreaSize.width * (2 / 3));
            options.height = Math.floor(workAreaSize.height);
            options.x = 0;
            options.y = 0;
            options.webPreferences.devTools = true;
        } else if (debugProd) {
            options.webPreferences.devTools = true;
        }

        options.webPreferences.session = getTabSession();

        const mainWindow = new BrowserWindow(options);
        mainWindow.setMenuBarVisibility(false);

        const theEvents = [...Event.TAB, ...Event.UPDATER];
        events.subscribe(mainWindow.webContents, theEvents);

        mainWindow.on('focus', () => addGlobalShortcuts());
        mainWindow.on('blur', () => clearGlobalShortcuts());

        mainWindow.once('ready-to-show', () => {
            mainWindow.show();
            if (isDevelopment) {
                mainWindow.webContents.openDevTools({ mode: 'detach' });
            }
        });

        mainWindow.webContents.on('context-menu', (e, params) => {
            const ctxMenu = new Menu();
            if (params.isEditable) {
                ctxMenu.append(new MenuItem({ label: 'Cut', role: 'cut' }));
                ctxMenu.append(new MenuItem({ label: 'Copy', role: 'copy' }));
                ctxMenu.append(new MenuItem({ label: 'Paste', role: 'paste' }));
                ctxMenu.popup(mainWindow, params.x, params.y);
            }
        });

        mainWindow.on('close', () => {
            events.unsubscribeAll(mainWindow.webContents);
            mainWindow.webContents.send('shutdown-node');
            windows.delete(Window.MAIN);
        });

        // HID / device permission handlers (hardware wallets etc.)
        mainWindow.webContents.session.on(
            'select-hid-device',
            (event, details, callback) => {
                event.preventDefault();
                if (details.deviceList && details.deviceList.length > 0) {
                    callback(details.deviceList[0].deviceId);
                }
            }
        );

        mainWindow.webContents.session.setPermissionCheckHandler(
            (webContents, permission, requestingOrigin, details) => {
                if (
                    permission === 'hid' &&
                    details.securityOrigin?.startsWith('chrome-extension://')
                ) {
                    return true;
                }
                return false;
            }
        );

        mainWindow.webContents.session.setDevicePermissionHandler((details) => {
            // Ledger = vendorId 11415. Allow HID for extension origins.
            if (
                details.deviceType === 'hid' &&
                details.device?.vendorId === 11415 &&
                details.origin?.startsWith('chrome-extension://')
            ) {
                return true;
            }
            return false;
        });

        return mainWindow;
    }

    hasMainWindow() {
        return windows.has(Window.MAIN);
    }
}

export default new WindowManager();
