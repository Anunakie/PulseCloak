import React, { useEffect, useState, useCallback, useRef } from 'react';
import '../theme.css';
import styles from './app.module.css';
import Tab from './Tab/Tab';
import { PULSECHAIN_DAPPS } from '../../../shared/pulsechain-dapps';
import { DEFAULT_NETWORK } from '../../../shared/pulsechain-config';

// ---- Defensive array helper ------------------------------------------------
// Prevents the `spaces.map is not a function` class of crashes that plagued
// earlier rebuilds. ALWAYS use this to iterate over data that comes from
// external sources (IPC, storage, config).
const safeMap = (arr, fn) => (Array.isArray(arr) ? arr.map(fn) : []);

function Titlebar({ onMinimize, onMaximize, onClose }) {
    return (
        <div className={styles.titlebar}>
            <div className={styles.titlebarDrag}>
                <div className={styles.brand}>
                    <span className={styles.brandDot} />
                    <span className={styles.brandName}>PulseChainCloak</span>
                    <span className={styles.brandNetwork}>
                        · {DEFAULT_NETWORK.name}
                    </span>
                </div>
            </div>
            <div className={styles.windowControls}>
                <button
                    className={styles.winBtn}
                    title="Minimize"
                    onClick={onMinimize}
                >
                    ─
                </button>
                <button
                    className={styles.winBtn}
                    title="Maximize"
                    onClick={onMaximize}
                >
                    ▢
                </button>
                <button
                    className={`${styles.winBtn} ${styles.winBtnClose}`}
                    title="Close"
                    onClick={onClose}
                >
                    ✕
                </button>
            </div>
        </div>
    );
}

function TabStrip({ tabs, selectedId, titles, onSelect, onClose, onNewTab }) {
    return (
        <div className={styles.tabstrip}>
            {safeMap(tabs, (id) => {
                const title = titles[id] || `Tab ${id}`;
                const isActive = id === selectedId;
                return (
                    <div
                        key={id}
                        className={`${styles.tab} ${
                            isActive ? styles.tabActive : ''
                        }`}
                        onClick={() => onSelect(id)}
                        title={title}
                    >
                        <span className={styles.tabTitle}>
                            {title.length > 24
                                ? title.slice(0, 24) + '…'
                                : title}
                        </span>
                        <button
                            className={styles.tabClose}
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose(id);
                            }}
                            title="Close tab"
                        >
                            ✕
                        </button>
                    </div>
                );
            })}
            <button
                className={styles.newTabBtn}
                onClick={onNewTab}
                title="New tab (Ctrl+T)"
            >
                +
            </button>
        </div>
    );
}

function Toolbar({
    url,
    setUrl,
    canGoBack,
    canGoForward,
    isLoading,
    onBack,
    onForward,
    onReload,
    onStop,
    onHome,
    onSubmit,
    onToggleSettings,
}) {
    return (
        <div className={styles.toolbar}>
            <div className={styles.navBtns}>
                <button
                    className={styles.navBtn}
                    onClick={onBack}
                    disabled={!canGoBack}
                    title="Back"
                >
                    ◀
                </button>
                <button
                    className={styles.navBtn}
                    onClick={onForward}
                    disabled={!canGoForward}
                    title="Forward"
                >
                    ▶
                </button>
                <button
                    className={styles.navBtn}
                    onClick={isLoading ? onStop : onReload}
                    title={isLoading ? 'Stop' : 'Reload'}
                >
                    {isLoading ? '✕' : '↻'}
                </button>
                <button
                    className={styles.navBtn}
                    onClick={onHome}
                    title="Home"
                >
                    🏠
                </button>
            </div>

            <form className={styles.urlForm} onSubmit={onSubmit}>
                <div className={styles.urlBar}>
                    <span className={styles.urlBarLock} title="Secured">
                        🛡
                    </span>
                    <input
                        type="text"
                        className={styles.urlInput}
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Search the private web or enter an address"
                        spellCheck={false}
                    />
                </div>
            </form>

            <div className={styles.toolbarActions}>
                <div className={styles.browserActions}>
                    <browser-action-list></browser-action-list>
                </div>
                <button
                    className={styles.navBtn}
                    onClick={onToggleSettings}
                    title="Settings"
                >
                    ⚙
                </button>
            </div>
        </div>
    );
}

function Sidebar({ onLaunchDapp }) {
    return (
        <div className={styles.sidebar}>
            <div className={styles.sidebarHeader} title="dApp Spaces">
                <span className={styles.sidebarLogo}>⚡</span>
            </div>
            <div className={styles.sidebarContent}>
                {safeMap(PULSECHAIN_DAPPS, (cat) => (
                    <div key={cat.id} className={styles.spaceCategory}>
                        <div
                            className={styles.spaceCatIcon}
                            title={cat.name}
                        >
                            {cat.icon}
                        </div>
                        {safeMap(cat.dapps, (d) => (
                            <button
                                key={d.id}
                                className={styles.spaceBtn}
                                title={`${d.name} — ${d.description}`}
                                onClick={() => onLaunchDapp(d)}
                            >
                                <span className={styles.spaceIcon}>
                                    {d.icon}
                                </span>
                            </button>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

function SettingsPanel({ open, onClose }) {
    if (!open) return null;
    return (
        <div className={styles.settingsOverlay} onClick={onClose}>
            <div
                className={styles.settingsPanel}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.settingsHeader}>
                    <h3>Settings</h3>
                    <button className={styles.navBtn} onClick={onClose}>
                        ✕
                    </button>
                </div>
                <div className={styles.settingsBody}>
                    <div className={styles.settingsRow}>
                        <label>Theme</label>
                        <span>Cyberpunk Dark (default)</span>
                    </div>
                    <div className={styles.settingsRow}>
                        <label>Default search</label>
                        <span>DuckDuckGo</span>
                    </div>
                    <div className={styles.settingsRow}>
                        <label>Default network</label>
                        <span>
                            {DEFAULT_NETWORK.name} (chain {DEFAULT_NETWORK.chainId})
                        </span>
                    </div>
                    <div className={styles.settingsRow}>
                        <label>Privacy</label>
                        <span>
                            Ad/tracker blocking · Fingerprint resistance · No
                            telemetry
                        </span>
                    </div>
                    <div className={styles.settingsRow}>
                        <label>Version</label>
                        <span>2.0.0 (v12 source rebuild)</span>
                    </div>
                    <p className={styles.settingsFoot}>
                        More settings coming soon. PulseChainCloak is an active
                        privacy project — contribute at
                        <a href="https://github.com/Anunakie/PulseCloak">
                            {' '}
                            github.com/Anunakie/PulseCloak
                        </a>
                        .
                    </p>
                </div>
            </div>
        </div>
    );
}

function App() {
    // Core state — defaulted to arrays/objects so .map is never called on
    // undefined. This is the v1.0.0 crash fix applied by design.
    const [tabs, setTabs] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [url, setUrl] = useState('');
    const [titles, setTitles] = useState({});
    const [navState, setNavState] = useState({
        canGoBack: false,
        canGoForward: false,
        isLoading: false,
    });
    const [settingsOpen, setSettingsOpen] = useState(false);
    const pollTimer = useRef(null);

    const api = window.electronApi || {};
    const controls = window.windowControls || {};

    // Refresh nav state for the selected tab from the main process.
    const refreshNavState = useCallback(async () => {
        if (!selectedId || !api.getTabNavState) return;
        try {
            const state = await api.getTabNavState({ id: selectedId });
            if (state) setNavState(state);
        } catch (e) {
            /* ignore */
        }
    }, [selectedId, api]);

    // Initial load + periodic nav-state refresh (covers back/forward updates
    // that don't fire did-navigate, e.g. hash changes).
    useEffect(() => {
        const loadInitial = async () => {
            try {
                const current = await api.getCurrentTabs?.();
                if (Array.isArray(current)) setTabs(current);
            } catch (e) {
                /* ignore */
            }
        };
        loadInitial();
        pollTimer.current = setInterval(refreshNavState, 1500);
        return () => clearInterval(pollTimer.current);
    }, [api, refreshNavState]);

    // Subscribe to main-process events.
    useEffect(() => {
        if (!api.onTabsFound) return;
        api.onTabsFound((_evt, value) => {
            setTabs(Array.isArray(value) ? value : []);
        });
        api.onTabSelected?.((_evt, value) => setSelectedId(value));
        api.onDidNavigate?.((_evt, value) => {
            if (!value) return;
            if (value.tabId === selectedId) {
                setUrl(value.url || '');
                setNavState((s) => ({
                    ...s,
                    canGoBack: !!value.canGoBack,
                    canGoForward: !!value.canGoForward,
                }));
            }
        });
        api.onDidNavigateInPage?.((_evt, value) => {
            if (!value) return;
            if (value.tabId === selectedId) {
                setUrl(value.url || '');
            }
        });
        api.onTabTitleUpdated?.((_evt, value) => {
            if (!value) return;
            setTitles((prev) => ({ ...prev, [value.tabId]: value.title }));
        });
        api.onTabStartLoading?.((_evt, value) => {
            if (value?.tabId === selectedId) {
                setNavState((s) => ({ ...s, isLoading: true }));
            }
        });
        api.onTabStopLoading?.((_evt, value) => {
            if (value?.tabId === selectedId) {
                setNavState((s) => ({ ...s, isLoading: false }));
                refreshNavState();
            }
        });
    }, [api, selectedId, refreshNavState]);

    // Handlers ---------------------------------------------------------------
    const handleSelectTab = (id) => api.selectTab?.(id);
    const handleCloseTab = (id) => api.closeTab?.({ id });
    const handleNewTab = () =>
        api.openNewTab?.({ url: 'https://duckduckgo.com' });

    const handleBack = () => api.goBackTab?.({ id: selectedId });
    const handleForward = () => api.goForwardTab?.({ id: selectedId });
    const handleReload = () => api.refreshTab?.({ id: selectedId });
    const handleStop = () => api.stopTab?.({ id: selectedId });
    const handleHome = () => api.goHomeTab?.({ id: selectedId });

    const handleUrlSubmit = (e) => {
        e.preventDefault();
        if (!url) return;
        if (selectedId) {
            api.loadUrl?.({ id: selectedId, url });
        } else {
            api.openNewTab?.({ url });
        }
    };

    const handleLaunchDapp = (d) => {
        if (!d?.url) return;
        api.openNewTab?.({ url: d.url });
    };

    const handleMinimize = () => controls.minimize?.();
    const handleMaximize = () => controls.maximize?.();
    const handleClose = () => controls.close?.();

    return (
        <div className={styles.app}>
            <Titlebar
                onMinimize={handleMinimize}
                onMaximize={handleMaximize}
                onClose={handleClose}
            />
            <TabStrip
                tabs={tabs}
                selectedId={selectedId}
                titles={titles}
                onSelect={handleSelectTab}
                onClose={handleCloseTab}
                onNewTab={handleNewTab}
            />
            <Toolbar
                url={url}
                setUrl={setUrl}
                canGoBack={navState.canGoBack}
                canGoForward={navState.canGoForward}
                isLoading={navState.isLoading}
                onBack={handleBack}
                onForward={handleForward}
                onReload={handleReload}
                onStop={handleStop}
                onHome={handleHome}
                onSubmit={handleUrlSubmit}
                onToggleSettings={() => setSettingsOpen((s) => !s)}
            />
            <div className={styles.body}>
                <Sidebar onLaunchDapp={handleLaunchDapp} />
                <div className={styles.tabContainer}>
                    {/* Tabs live in BrowserViews in the main process; the
                        React Tab components here provide per-tab layout hooks. */}
                    {safeMap(tabs, (id) => (
                        <Tab
                            key={id}
                            id={id}
                            selected={id === selectedId}
                        />
                    ))}
                    {tabs.length === 0 && (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyLogo}>⚡🛡</div>
                            <h1>PulseChainCloak Browser</h1>
                            <p>
                                Private, decentralized Web3 browsing on
                                PulseChain.
                            </p>
                            <button
                                className={styles.primaryBtn}
                                onClick={handleNewTab}
                            >
                                Open new tab
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <SettingsPanel
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
            />
        </div>
    );
}

export default App;
