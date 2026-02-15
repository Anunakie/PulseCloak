import { getTabSession, getDefaultSession } from '../session';
import tabsManager from '../tabs';
import windowManager from '../window';
const { ElectronChromeExtensions } = require('@pulsechaincloak/electron-chrome-extensions');
const { installChromeWebStore } = require('electron-chrome-web-store');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

let electronChromeExtensions;

export const getExtensionFoldersAndManifests = (
    directoryPath,
    folders = [],
    manifests = []
) => {
    // Create the extensions directory if it doesn't exist
    if (!fs.existsSync(directoryPath)) {
        try {
            fs.mkdirSync(directoryPath, { recursive: true });
            console.log('Created extensions directory:', directoryPath);
        } catch (err) {
            console.error('Failed to create extensions directory:', err);
            return { folders, manifests };
        }
    }

    let files;
    try {
        files = fs.readdirSync(directoryPath);
    } catch (err) {
        console.error('Failed to read extensions directory:', err);
        return { folders, manifests };
    }

    for (const file of files) {
        const filePath = path.join(directoryPath, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            const manifestPath = path.join(filePath, 'manifest.json');
            if (fs.existsSync(manifestPath)) {
                const data = fs.readFileSync(manifestPath);
                const manifest = JSON.parse(data);
                manifests.push(manifest);
                console.log(data);
                folders.push(filePath);
            } else {
                getExtensionFoldersAndManifests(filePath, folders, manifests);
            }
        }
    }

    return { folders, manifests };
};

export const addTabToExtensions = async (tab) => {
    electronChromeExtensions.addTab(tab.view.webContents, tab.window);
};

export const selectTabInExtensions = async (tab) => {
    electronChromeExtensions.selectTab(tab.view.webContents);
};

export const initExtensions = async () => {
    const tabSession = await getTabSession();

    electronChromeExtensions = new ElectronChromeExtensions({
        session: tabSession,
        modulePath: path.join(__dirname, '../../../electron-chrome-extensions/'),
        async createTab(details, event) {
            // Optionally implemented for chrome.tabs.create support
            console.log('createTab');
            console.log(details);

            const extensionId = event?.event?.extension?.id;

            const tab = await tabsManager.loadInTab({
                url: details.url,
            });
            return [tab.view.webContents, tab.window];
        },
        async selectTab(tab, browserWindow) {
            // Optionally implemented for chrome.tabs.update support
            console.log('selectTab');
            console.log(tab);
            electronChromeExtensions.selectTab(tab);
        },
        async removeTab(tab, browserWindow) {
            // Optionally implemented for chrome.tabs.remove support
            console.log('removeTab');
            console.log(tab);
            tabsManager.removeTab(tab.id);
        },
        async createWindow(details, event) {
            // Optionally implemented for chrome.windows.create support
            console.log('createWindow');
            console.log(details);
            const window = windowManager.getWindowForExtensionPopup(details);
            electronChromeExtensions.addTab(window.webContents, window);
            return window;
        },
        removeWindow(window) {
            console.log('removeWindow');
            console.log(window);
            window.destroy();
        },
    });

    // Initialize Chrome Web Store support for installing extensions
    // This enables the "Add to PulseChainCloak" button on chromewebstore.google.com
    const extensionsPath = path.join(app.getPath('userData'), 'Extensions');
    console.log('[WebStore] Extensions path:', extensionsPath);

    try {
        await installChromeWebStore({
            session: tabSession,
            extensionsPath: extensionsPath,
            loadExtensions: true,
            allowUnpackedExtensions: false,
            autoUpdate: true,
        });
        console.log('[WebStore] Chrome Web Store support initialized successfully');
    } catch (err) {
        console.error('[WebStore] Failed to initialize Chrome Web Store support:', err);
    }
};
