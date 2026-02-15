const path = require('path');
const fs = require('fs');

const makers = [
    {
        name: '@electron-forge/maker-squirrel',
        config: {
            name: 'PulseChainCloakBrowser',
            setupExe: 'PulseChainCloakBrowser-Setup.exe',
            setupIcon: './src/main/icons/icon.ico',
            createDesktopShortcut: true,
            createStartMenuShortcut: true,
            shortcutName: 'PulseChainCloak Browser',
        },
    },
    {
        name: '@electron-forge/maker-zip',
        platforms: ['darwin', 'win32', 'linux'],
    },
    {
        name: '@electron-forge/maker-deb',
        config: {
            options: {
                name: 'pulsechaincloak-browser',
                productName: 'PulseChainCloak Browser',
                genericName: 'Web Browser',
                description: 'Privacy-focused browser for PulseChain mesh network',
                categories: ['Network', 'WebBrowser'],
                icon: './src/main/icons/icon.png',
                bin: 'PulseChainCloakBrowser',
            }
        },
    },
];

// Only add DMG maker on macOS
if (process.platform === 'darwin') {
    try {
        require.resolve('@electron-forge/maker-dmg');
        makers.push({
            name: '@electron-forge/maker-dmg',
            config: {
                name: 'PulseChainCloakBrowser',
                format: 'ULFO',
            },
        });
    } catch (e) {
        // maker-dmg not installed, skip
    }
}

// Build extraResource list - include bin directory if it has files
const extraResource = [];
const binDir = path.join(__dirname, 'bin');
if (fs.existsSync(binDir)) {
    const binFiles = fs.readdirSync(binDir).filter(f => !f.startsWith('.'));
    if (binFiles.length > 0) {
        extraResource.push('./bin');
    }
}

module.exports = {
    packagerConfig: {
        name: 'PulseChainCloak Browser',
        executableName: 'PulseChainCloakBrowser',
        appBundleId: 'com.pulsechaincloak.browser',
        icon: './src/main/icons/icon',
        appCopyright: 'Copyright (C) 2024 PulseChainCloak Community',
        extraResource: extraResource,
    },
    rebuildConfig: {},
    makers: makers,
    plugins: [
        {
            name: '@electron-forge/plugin-webpack',
            config: {
                mainConfig: './webpack.main.config.js',
                renderer: {
                    config: './webpack.renderer.config.js',
                    entryPoints: [
                        {
                            html: './src/renderer/browser/index.html',
                            js: './src/renderer/browser/index.js',
                            name: 'main_window',
                            preload: {
                                js: './src/renderer/browser/preload.js',
                            },
                        },
                        {
                            html: './src/renderer/extension-monitor/index.html',
                            js: './src/renderer/extension-monitor/index.js',
                            name: 'extension_monitor',
                            preload: {
                                js: './src/renderer/extension-monitor/preload.js',
                            },
                        },
                    ],
                },
            },
        },
    ],
};
