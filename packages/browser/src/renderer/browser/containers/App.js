import React, { useEffect, useState, useCallback, useRef } from 'react';
import '../theme.css';
import styles from './app.module.css';
import Tab from './Tab/Tab';
import { PULSECHAIN_DAPPS } from '../../../shared/pulsechain-dapps';
import { DEFAULT_NETWORK } from '../../../shared/pulsechain-config';
import {
    HomeIcon,
    BackIcon,
    ForwardIcon,
    ReloadIcon,
    StopIcon,
    LockIcon,
    StarIcon,
    PowerIcon,
    DownloadIcon,
    UploadIcon,
    WalletIcon,
    GearIcon,
    HopsIcon,
    GhostIcon,
    BookmarksIcon,
    MinimizeIcon,
    MaximizeIcon,
    RestoreIcon,
    CloseIcon,
    PlusIcon,
    FolderIcon,
    AppStoreIcon,
    SwapIcon,
    SearchIcon,
    BrandShield,
} from '../../components/Icons/Icons';

// ---- Defensive array helper ------------------------------------------------
const safeMap = (arr, fn) => (Array.isArray(arr) ? arr.map(fn) : []);

// ---- Default workspaces (MASQ-style) ---------------------------------------
const DEFAULT_WORKSPACES = [
    { id: 'work', label: 'Work', color: 'accent' },
    { id: 'finance', label: 'Finance', color: 'mute' },
];

// ---- Default dock dApps ----------------------------------------------------
const DEFAULT_DOCK_ITEMS = (() => {
    const all = [];
    (PULSECHAIN_DAPPS || []).forEach((cat) =>
        (cat.dapps || []).forEach((d) => all.push(d))
    );
    return all.slice(0, 6);
})();

// ==========================================================================
// Titlebar  — workspaces + balances + window controls
// ==========================================================================
function Titlebar({
    workspaces,
    activeWorkspace,
    onSelectWorkspace,
    onAddWorkspace,
    isMaximized,
    onMinimize,
    onMaximize,
    onClose,
}) {
    return (
        <div className={styles.titlebar}>
            <div className={styles.workspaces}>
                {safeMap(workspaces, (w) => (
                    <div
                        key={w.id}
                        className={`${styles.workspace} ${
                            w.id === activeWorkspace ? styles.workspaceActive : ''
                        }`}
                        onClick={() => onSelectWorkspace(w.id)}
                        title={`Switch to ${w.label}`}
                    >
                        <span
                            className={`${styles.workspaceDot} ${
                                w.color === 'mute' ? styles.workspaceDotAlt : ''
                            }`}
                        />
                        {w.label}
                    </div>
                ))}
                <button
                    className={styles.workspaceAdd}
                    onClick={onAddWorkspace}
                    title="New workspace"
                >
                    <PlusIcon size={14} />
                </button>
            </div>

            <div className={styles.titleRight}>
                <div className={styles.balances}>
                    <div
                        className={styles.balancePill}
                        title="Primary wallet balance"
                    >
                        <span className={styles.balanceDot} />
                        0.00
                    </div>
                    <div
                        className={styles.balancePill}
                        title="Secondary token balance"
                    >
                        <span
                            className={`${styles.balanceDot} ${styles.balanceDotAlt}`}
                        />
                        0.000
                    </div>
                </div>
                <div className={styles.windowControls}>
                    <button
                        className={styles.winBtn}
                        onClick={onMinimize}
                        title="Minimize"
                    >
                        <MinimizeIcon size={14} />
                    </button>
                    <button
                        className={styles.winBtn}
                        onClick={onMaximize}
                        title={isMaximized ? 'Restore' : 'Maximize'}
                    >
                        {isMaximized ? (
                            <RestoreIcon size={14} />
                        ) : (
                            <MaximizeIcon size={14} />
                        )}
                    </button>
                    <button
                        className={`${styles.winBtn} ${styles.winBtnClose}`}
                        onClick={onClose}
                        title="Close"
                    >
                        <CloseIcon size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ==========================================================================
// Toolbar  — home + nav + url + action strip
// ==========================================================================
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
    actions,
    hopCount,
    onOpenSettings,
}) {
    return (
        <div className={styles.toolbar}>
            <button
                className={`${styles.navBtn} ${styles.navBtnHome}`}
                onClick={onHome}
                title="Home"
            >
                <HomeIcon size={16} />
            </button>
            <div className={styles.navBtns}>
                <button
                    className={styles.navBtn}
                    onClick={onBack}
                    disabled={!canGoBack}
                    title="Back"
                >
                    <BackIcon size={16} />
                </button>
                <button
                    className={styles.navBtn}
                    onClick={onForward}
                    disabled={!canGoForward}
                    title="Forward"
                >
                    <ForwardIcon size={16} />
                </button>
                <button
                    className={styles.navBtn}
                    onClick={isLoading ? onStop : onReload}
                    title={isLoading ? 'Stop' : 'Reload'}
                >
                    {isLoading ? (
                        <StopIcon size={16} />
                    ) : (
                        <ReloadIcon size={16} />
                    )}
                </button>
            </div>

            <form className={styles.urlForm} onSubmit={onSubmit}>
                <div className={styles.urlBar}>
                    <span className={styles.urlBarLock} title="Secured">
                        <LockIcon size={14} />
                    </span>
                    <input
                        type="text"
                        className={styles.urlInput}
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Search Presearch or type a URL"
                        spellCheck={false}
                    />
                    <button
                        type="button"
                        className={styles.navBtn}
                        title="Bookmark this page"
                        style={{ width: 28, height: 28 }}
                    >
                        <StarIcon size={14} />
                    </button>
                </div>
            </form>

            <div className={styles.toolbarActions}>
                <div className={styles.actionBtnWrap}>
                    <button
                        className={`${styles.navBtn} ${
                            actions.masqOn ? styles.navBtnActive : ''
                        }`}
                        onClick={() => actions.toggle('masqOn')}
                        title={
                            actions.masqOn
                                ? 'PulseCloak network: ON'
                                : 'PulseCloak network: OFF'
                        }
                    >
                        <PowerIcon size={16} />
                    </button>
                    {actions.masqOn && <span className={styles.actionBadgeDot} />}
                </div>
                <button
                    className={styles.navBtn}
                    onClick={() => actions.toggle('consuming')}
                    title="Consume bandwidth"
                >
                    <DownloadIcon size={16} />
                </button>
                <button
                    className={styles.navBtn}
                    onClick={() => actions.toggle('serving')}
                    title="Serve bandwidth (earn)"
                >
                    <UploadIcon size={16} />
                </button>
                <button
                    className={styles.navBtn}
                    onClick={() => actions.toggle('wallet')}
                    title="Wallet"
                >
                    <WalletIcon size={16} />
                </button>
                <button
                    className={styles.navBtn}
                    onClick={() => actions.toggle('masqPanel')}
                    title="PulseCloak"
                >
                    <GearIcon size={16} />
                </button>
                <div className={styles.actionBtnWrap}>
                    <button
                        className={styles.navBtn}
                        onClick={() => actions.cycleHops()}
                        title={`dVPN hops: ${hopCount}`}
                    >
                        <HopsIcon size={16} />
                    </button>
                    <span className={styles.actionBadge}>{hopCount}</span>
                </div>
                <button
                    className={`${styles.navBtn} ${
                        actions.ghost ? styles.navBtnActive : ''
                    }`}
                    onClick={() => actions.toggle('ghost')}
                    title="Privacy / Ghost mode"
                >
                    <GhostIcon size={16} />
                </button>
                <button
                    className={styles.navBtn}
                    onClick={() => actions.toggle('bookmarks')}
                    title="Bookmarks"
                >
                    <BookmarksIcon size={16} />
                </button>
                <div className={styles.browserActions}>
                    <browser-action-list></browser-action-list>
                </div>
                <button
                    className={styles.navBtn}
                    onClick={onOpenSettings}
                    title="Settings"
                >
                    <GearIcon size={16} />
                </button>
            </div>
        </div>
    );
}

// ==========================================================================
// Sidebar  — minimal: brand + settings
// ==========================================================================
function Sidebar({ onOpenSettings, settingsOpen }) {
    return (
        <div className={styles.sidebar}>
            <div className={styles.sidebarLogo} title="PulseChainCloak">
                <BrandShield size={36} />
                <span className={styles.sidebarLogoLabel}>CLOAK</span>
            </div>
            <div className={styles.sidebarDivider} />
            <div className={styles.sidebarSpacer} />
            <button
                className={`${styles.sidebarBtn} ${
                    settingsOpen ? styles.sidebarBtnActive : ''
                }`}
                onClick={onOpenSettings}
                title="Settings"
            >
                <GearIcon size={18} />
            </button>
        </div>
    );
}

// ==========================================================================
// Bottom dock  — favorite dApps + quick actions
// ==========================================================================
function BottomDock({ items, onLaunch, onOpenAppStore, onAddDapp }) {
    return (
        <div className={styles.dock}>
            <div className={styles.dockGroup}>
                {safeMap(items, (d) => (
                    <button
                        key={d.id}
                        className={styles.dockBtn}
                        onClick={() => onLaunch(d)}
                        title={`${d.name} — ${d.description || ''}`}
                    >
                        {d.favicon ? (
                            <img
                                src={d.favicon}
                                alt={d.name}
                                className={styles.dockBtnImg}
                            />
                        ) : (
                            <span style={{ fontSize: 18 }}>
                                {typeof d.icon === 'string' ? d.icon : '●'}
                            </span>
                        )}
                    </button>
                ))}
            </div>
            <div className={styles.dockDivider} />
            <div className={styles.dockGroup}>
                <button
                    className={styles.dockBtn}
                    title="Bookmarks folder"
                    onClick={() => onOpenAppStore('bookmarks')}
                >
                    <FolderIcon size={18} />
                </button>
                <button
                    className={styles.dockBtn}
                    title="dApp Store"
                    onClick={() => onOpenAppStore('store')}
                >
                    <AppStoreIcon size={18} />
                </button>
                <button
                    className={`${styles.dockBtn} ${styles.dockBtnCircle}`}
                    title="Quick swap"
                    onClick={() => onOpenAppStore('swap')}
                >
                    <SwapIcon size={16} />
                </button>
                <button
                    className={`${styles.dockBtn} ${styles.dockBtnBlue}`}
                    title="PulseCloak Hub"
                    onClick={() => onOpenAppStore('hub')}
                >
                    <BrandShield size={22} />
                </button>
                <button
                    className={styles.dockBtn}
                    title="Add to dock"
                    onClick={onAddDapp}
                >
                    <PlusIcon size={16} />
                </button>
            </div>
        </div>
    );
}

// ==========================================================================
// Home / new-tab page
// ==========================================================================
function HomePage({ onSearch }) {
    const [q, setQ] = useState('');
    return (
        <div className={styles.home}>
            <div className={styles.homeStars} />
            <div className={styles.homeBrand}>
                <BrandShield size={84} />
                <h1 className={styles.homeTitle}>PulseChainCloak</h1>
                <p className={styles.homeSubtitle}>
                    Privacy that pulses. Decentralized mesh VPN, native Web3
                    browser, and earning layer built for PulseChain.
                </p>
            </div>

            <form
                className={styles.homeSearch}
                onSubmit={(e) => {
                    e.preventDefault();
                    if (q.trim()) onSearch(q.trim());
                }}
            >
                <div className={styles.homeSearchBar}>
                    <SearchIcon size={16} color="var(--pcc-text-dim)" />
                    <input
                        className={styles.homeSearchInput}
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search Presearch or enter a dApp URL…"
                        spellCheck={false}
                    />
                </div>
            </form>

            <div className={styles.homeStatCards}>
                <div className={styles.homeStatCard}>
                    <span className={styles.homeStatLabel}>$CLOAK price</span>
                    <span className={styles.homeStatValue}>$N/A</span>
                    <span className={styles.homeStatFoot}>
                        Placeholder token — final symbol TBD
                    </span>
                    <button
                        className={styles.homeStatAction}
                        onClick={() => onSearch('https://pulsex.com')}
                    >
                        Swap
                    </button>
                </div>
                <div className={styles.homeStatCard}>
                    <span className={styles.homeStatLabel}>
                        Active dVPN nodes · last 24h
                    </span>
                    <span className={styles.homeStatValue}>—</span>
                    <span className={styles.homeStatFoot}>
                        Network: {DEFAULT_NETWORK.name} (chain{' '}
                        {DEFAULT_NETWORK.chainId})
                    </span>
                </div>
            </div>
        </div>
    );
}

// ==========================================================================
// Settings  — MASQ-style sections
// ==========================================================================
function Toggle({ on, onChange }) {
    return (
        <div
            className={`${styles.toggle} ${on ? styles.toggleOn : ''}`}
            onClick={() => onChange(!on)}
            role="switch"
            aria-checked={on}
        >
            <div className={styles.toggleKnob} />
        </div>
    );
}

function SettingsPanel({ open, onClose, settings, setSettings }) {
    const [tab, setTab] = useState('browser');
    if (!open) return null;

    const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }));

    return (
        <div className={styles.settingsOverlay} onClick={onClose}>
            <div
                className={styles.settingsPanel}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.settingsHeader}>
                    <h3>
                        <GearIcon size={18} />
                        Advanced Settings
                    </h3>
                    <button className={styles.navBtn} onClick={onClose}>
                        <CloseIcon size={14} />
                    </button>
                </div>
                <div className={styles.settingsTabs}>
                    <button
                        className={`${styles.settingsTab} ${
                            tab === 'browser' ? styles.settingsTabActive : ''
                        }`}
                        onClick={() => setTab('browser')}
                    >
                        Browser Settings
                    </button>
                    <button
                        className={`${styles.settingsTab} ${
                            tab === 'general' ? styles.settingsTabActive : ''
                        }`}
                        onClick={() => setTab('general')}
                    >
                        General Settings
                    </button>
                    <button
                        className={`${styles.settingsTab} ${
                            tab === 'logs' ? styles.settingsTabActive : ''
                        }`}
                        onClick={() => setTab('logs')}
                    >
                        PulseCloak Logs
                    </button>
                    <span className={styles.settingsTabSpacer} />
                    <button className={styles.settingsTabBuy}>
                        Buy $CLOAK
                    </button>
                </div>
                <div className={styles.settingsBody}>
                    {tab === 'browser' && (
                        <>
                            <div className={styles.settingsSection}>
                                <div className={styles.settingsSectionTitle}>
                                    Privacy and Security
                                </div>
                                <div className={styles.settingsRow}>
                                    <div>
                                        <div className={styles.settingsRowLabel}>
                                            Block Ads &amp; Trackers
                                        </div>
                                        <span className={styles.settingsRowSub}>
                                            Recommended — on by default
                                        </span>
                                    </div>
                                    <Toggle
                                        on={settings.blockAds}
                                        onChange={(v) => set('blockAds', v)}
                                    />
                                </div>
                                <div className={styles.settingsRow}>
                                    <div>
                                        <div className={styles.settingsRowLabel}>
                                            History Destructor
                                        </div>
                                        <span className={styles.settingsRowSub}>
                                            Number of items to retain
                                        </span>
                                    </div>
                                    <input
                                        type="number"
                                        min={0}
                                        max={10000}
                                        className={styles.settingsNumber}
                                        value={settings.historyLimit}
                                        onChange={(e) =>
                                            set(
                                                'historyLimit',
                                                Number(e.target.value) || 0
                                            )
                                        }
                                    />
                                </div>
                                <div className={styles.settingsRow}>
                                    <div className={styles.settingsRowLabel}>
                                        Clear your Cache
                                    </div>
                                    <button className={styles.settingsClearBtn}>
                                        Clear
                                    </button>
                                </div>
                                <div className={styles.settingsRow}>
                                    <div className={styles.settingsRowLabel}>
                                        Clear your History
                                    </div>
                                    <button className={styles.settingsClearBtn}>
                                        Clear
                                    </button>
                                </div>
                                <div className={styles.settingsRow}>
                                    <div className={styles.settingsRowLabel}>
                                        Clear your Cookies
                                    </div>
                                    <button className={styles.settingsClearBtn}>
                                        Clear
                                    </button>
                                </div>
                                <div className={styles.settingsRow}>
                                    <div>
                                        <div className={styles.settingsRowLabel}>
                                            Browser ID Switcher
                                        </div>
                                        <span className={styles.settingsRowSub}>
                                            Rotate fingerprint periodically
                                        </span>
                                    </div>
                                    <Toggle
                                        on={settings.idSwitcher}
                                        onChange={(v) => set('idSwitcher', v)}
                                    />
                                </div>
                            </div>

                            <div className={styles.settingsSection}>
                                <div className={styles.settingsSectionTitle}>
                                    Default Search Engine
                                </div>
                                <div className={styles.settingsRow}>
                                    <div className={styles.settingsRowLabel}>
                                        Search provider
                                    </div>
                                    <select
                                        className={styles.settingsSelect}
                                        value={settings.search}
                                        onChange={(e) =>
                                            set('search', e.target.value)
                                        }
                                    >
                                        <option value="presearch">
                                            Presearch
                                        </option>
                                        <option value="duckduckgo">
                                            DuckDuckGo
                                        </option>
                                        <option value="google">Google</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.settingsSection}>
                                <div className={styles.settingsSectionTitle}>
                                    Enable / Disable Browser Wallets
                                </div>
                                {[
                                    ['MetaMask', 'metamask'],
                                    ['Phantom', 'phantom'],
                                    ['Frame', 'frame'],
                                    ['Rabby', 'rabby'],
                                ].map(([name, key]) => (
                                    <div
                                        key={key}
                                        className={styles.settingsRow}
                                    >
                                        <div className={styles.settingsRowLabel}>
                                            {name}
                                        </div>
                                        <Toggle
                                            on={settings.wallets[key]}
                                            onChange={(v) =>
                                                setSettings((s) => ({
                                                    ...s,
                                                    wallets: {
                                                        ...s.wallets,
                                                        [key]: v,
                                                    },
                                                }))
                                            }
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className={styles.settingsSection}>
                                <div className={styles.settingsSectionTitle}>
                                    Extensions
                                </div>
                                <div className={styles.settingsRow}>
                                    <div className={styles.settingsRowLabel}>
                                        Bitwarden
                                    </div>
                                    <Toggle
                                        on={settings.bitwarden}
                                        onChange={(v) => set('bitwarden', v)}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                    {tab === 'general' && (
                        <div className={styles.settingsSection}>
                            <div className={styles.settingsSectionTitle}>
                                PulseChain Network
                            </div>
                            <div className={styles.settingsRow}>
                                <div className={styles.settingsRowLabel}>
                                    Default network
                                </div>
                                <span className={styles.settingsRowSub}>
                                    {DEFAULT_NETWORK.name} · chain{' '}
                                    {DEFAULT_NETWORK.chainId}
                                </span>
                            </div>
                            <div className={styles.settingsRow}>
                                <div className={styles.settingsRowLabel}>
                                    RPC URL
                                </div>
                                <span className={styles.settingsRowSub}>
                                    {(DEFAULT_NETWORK.rpcUrls || [])[0]}
                                </span>
                            </div>
                            <div className={styles.settingsRow}>
                                <div className={styles.settingsRowLabel}>
                                    Version
                                </div>
                                <span className={styles.settingsRowSub}>
                                    2.1.0 · v13 MASQ-style UI
                                </span>
                            </div>
                        </div>
                    )}
                    {tab === 'logs' && (
                        <div className={styles.settingsSection}>
                            <div className={styles.settingsSectionTitle}>
                                PulseCloak Logs
                            </div>
                            <pre
                                style={{
                                    whiteSpace: 'pre-wrap',
                                    color: 'var(--pcc-text-dim)',
                                    fontSize: 11,
                                    margin: 0,
                                }}
                            >
{`[pcc] boot: ok
[pcc] session: persist:pulsechaincloak
[pcc] extensions: loaded — see DevTools → Console for live logs
[pcc] dVPN: placeholder (test-token rewards)
[pcc] network: ${DEFAULT_NETWORK.name} (chain ${DEFAULT_NETWORK.chainId})`}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ==========================================================================
// App root
// ==========================================================================
function App() {
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
    const [isMaximized, setIsMaximized] = useState(false);
    const [workspaces, setWorkspaces] = useState(DEFAULT_WORKSPACES);
    const [activeWorkspace, setActiveWorkspace] = useState('work');

    const [toolbarState, setToolbarState] = useState({
        masqOn: true,
        consuming: false,
        serving: false,
        wallet: false,
        masqPanel: false,
        ghost: false,
        bookmarks: false,
    });
    const [hopCount, setHopCount] = useState(3);

    const [settings, setSettings] = useState({
        blockAds: true,
        historyLimit: 500,
        idSwitcher: true,
        search: 'duckduckgo',
        wallets: {
            metamask: true,
            phantom: true,
            frame: true,
            rabby: true,
        },
        bitwarden: false,
    });

    const pollTimer = useRef(null);

    const api = window.electronApi || {};
    const controls = window.windowControls || {};

    // ---- Main-process sync ------------------------------------------------
    const refreshNavState = useCallback(async () => {
        if (!selectedId || !api.getTabNavState) return;
        try {
            const state = await api.getTabNavState({ id: selectedId });
            if (state) setNavState(state);
        } catch (e) {
            /* ignore */
        }
    }, [selectedId, api]);

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
            if (value.tabId === selectedId) setUrl(value.url || '');
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

    // ---- Handlers ---------------------------------------------------------
    const handleSelectTab = (id) => api.selectTab?.(id);
    const handleCloseTab = (id) => api.closeTab?.({ id });
    const handleNewTab = () =>
        api.openNewTab?.({ url: 'pulsechaincloak://newtab' });

    const handleBack = () => api.goBackTab?.({ id: selectedId });
    const handleForward = () => api.goForwardTab?.({ id: selectedId });
    const handleReload = () => api.refreshTab?.({ id: selectedId });
    const handleStop = () => api.stopTab?.({ id: selectedId });
    const handleHome = () => api.goHomeTab?.({ id: selectedId });

    const handleUrlSubmit = (e) => {
        e.preventDefault();
        const v = String(url || '').trim();
        if (!v) return;
        if (selectedId) {
            api.loadUrl?.({ id: selectedId, url: v });
        } else {
            api.openNewTab?.({ url: v });
        }
    };

    // CRITICAL: pass only primitive string URL to avoid IPC cloning errors
    const openDapp = (dapp) => {
        const target = String(dapp?.url || '');
        if (!target) return;
        api.openNewTab?.({ url: target });
    };

    const handleHomeSearch = (q) => {
        const v = String(q || '').trim();
        if (!v) return;
        api.openNewTab?.({ url: v });
    };

    const handleMinimize = () => controls.minimize?.();
    const handleMaximize = () => {
        controls.maximize?.();
        setIsMaximized((s) => !s);
    };
    const handleClose = () => controls.close?.();

    const toolbarActions = {
        ...toolbarState,
        toggle: (k) =>
            setToolbarState((s) => ({ ...s, [k]: !s[k] })),
        cycleHops: () =>
            setHopCount((n) => {
                const seq = [0, 1, 3, 5];
                return seq[(seq.indexOf(n) + 1) % seq.length];
            }),
    };

    return (
        <div className={styles.app}>
            <Titlebar
                workspaces={workspaces}
                activeWorkspace={activeWorkspace}
                onSelectWorkspace={setActiveWorkspace}
                onAddWorkspace={() =>
                    setWorkspaces((w) => [
                        ...w,
                        {
                            id: `ws${w.length + 1}`,
                            label: `Space ${w.length + 1}`,
                            color: 'mute',
                        },
                    ])
                }
                isMaximized={isMaximized}
                onMinimize={handleMinimize}
                onMaximize={handleMaximize}
                onClose={handleClose}
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
                actions={toolbarActions}
                hopCount={hopCount}
                onOpenSettings={() => setSettingsOpen(true)}
            />
            <div className={styles.body}>
                <Sidebar
                    onOpenSettings={() => setSettingsOpen((s) => !s)}
                    settingsOpen={settingsOpen}
                />
                <div className={styles.content}>
                    {safeMap(tabs, (id) => (
                        <Tab key={id} id={id} selected={id === selectedId} />
                    ))}
                    {tabs.length === 0 && (
                        <HomePage onSearch={handleHomeSearch} />
                    )}
                    <BottomDock
                        items={DEFAULT_DOCK_ITEMS}
                        onLaunch={openDapp}
                        onOpenAppStore={(_kind) => handleNewTab()}
                        onAddDapp={handleNewTab}
                    />
                </div>
            </div>
            <SettingsPanel
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                settings={settings}
                setSettings={setSettings}
            />
        </div>
    );
}

export default App;
