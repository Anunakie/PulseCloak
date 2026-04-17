import { session as electronSession } from 'electron';

const isDevelopment = process.env.NODE_ENV === 'development';

const sessions = new Map();

export const getTabSession = () => {
    if (sessions.has('tab')) return sessions.get('tab');
    const tabSession = electronSession.fromPartition('persist:pulsechaincloak');
    initSession(tabSession);
    sessions.set('tab', tabSession);
    return tabSession;
};

export const getDefaultSession = () => {
    return electronSession.defaultSession;
};

// Use a standard Chrome User-Agent so extension web-store pages, MetaMask,
// and similar don't prompt users to "switch to Chrome".
const PULSECLOAK_UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export const initSession = async (s) => {
    let session = s;
    if (!session) {
        session = electronSession.defaultSession;
    }

    try {
        session.setUserAgent(PULSECLOAK_UA);
    } catch (_) {
        // setUserAgent may not be available on all session types
    }

    // IMPORTANT: do NOT set a global CSP override. A buggy CSP ('*' or "'*'")
    // breaks Chrome extensions (including MetaMask/Rabby popups which load
    // inline scripts from chrome-extension://). Only strip frame-ancestors
    // on regular web http(s) requests so dApps can embed in our BrowserView.
    session.webRequest.onHeadersReceived((details, callback) => {
        const url = details.url || '';
        const headers = { ...details.responseHeaders };

        // For chrome-extension:// requests, leave headers untouched so the
        // extension's own CSP applies.
        if (url.startsWith('chrome-extension://')) {
            callback({ responseHeaders: headers });
            return;
        }

        // For normal web pages, strip X-Frame-Options/Content-Security-Policy
        // frame-ancestors so our BrowserView-in-BrowserView pattern works.
        delete headers['X-Frame-Options'];
        delete headers['x-frame-options'];

        callback({ responseHeaders: headers });
    });
};
