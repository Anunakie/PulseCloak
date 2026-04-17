module.exports = {
    packagerConfig: {
        name: 'PulseChainCloak Browser',
        executableName: 'PulseChainCloakBrowser',
        appBundleId: 'io.pulsechaincloak.browser',
        appCategoryType: 'public.app-category.utilities',
        asar: true,
        // icon path resolved at build time; placeholder if missing
        // icon: '../../assets/harvested/icon',
    },
    rebuildConfig: {},
    makers: [
        {
            name: '@electron-forge/maker-zip',
            platforms: ['win32', 'darwin', 'linux'],
        },
        {
            name: '@electron-forge/maker-squirrel',
            platforms: ['win32'],
            config: {
                name: 'PulseChainCloakBrowser',
                setupExe: 'PulseChainCloakBrowser-Setup.exe',
            },
        },
        {
            name: '@electron-forge/maker-deb',
            platforms: ['linux'],
            config: {
                options: {
                    name: 'pulsechaincloak-browser',
                    productName: 'PulseChainCloak Browser',
                },
            },
        },
        {
            name: '@electron-forge/maker-rpm',
            platforms: ['linux'],
            config: {},
        },
    ],
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
