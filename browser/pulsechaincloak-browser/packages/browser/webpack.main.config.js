const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
    /**
     * This is the main entry point for your application, it's the first file
     * that runs in the main process.
     */
    entry: './src/main/main.js',
    // Put your normal webpack config below here
    module: {
        rules: require('./webpack.rules'),
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {
                    // Copy the electron-chrome-web-store preload script to webpack output
                    from: require.resolve('electron-chrome-web-store/preload'),
                    to: 'chrome-web-store.preload.js',
                },
                {
                    // Copy the electron-chrome-extensions preload script to webpack output
                    from: require.resolve('electron-chrome-extensions/preload'),
                    to: 'chrome-extension-api.preload.js',
                },
            ],
        }),
    ],
};
