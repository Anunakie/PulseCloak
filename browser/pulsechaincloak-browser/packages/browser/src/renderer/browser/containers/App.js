import React, { useEffect, useState, useCallback, useRef } from 'react';

import WindowControls from '../../components/WindowControls';
import TitleBar from '../../components/TitleBar';
import Main from './Main';

import styles from './app.module.css';

const App = () => {
    const [tabs, setTabs] = useState([]);
    const [selectedTab, setSelectedTab] = useState(null);
    const [currentUrl, setCurrentUrl] = useState('');
    const [inputUrl, setInputUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [pageTitle, setPageTitle] = useState('New Tab');
    const [tabTitles, setTabTitles] = useState({});
    const [tabFavicons, setTabFavicons] = useState({});
    const [showWelcome, setShowWelcome] = useState(true);

    // Adblock state
    const [blockedCount, setBlockedCount] = useState(0);
    const [showAdblockInfo, setShowAdblockInfo] = useState(false);
    const adblockInfoRef = useRef(null);

    // History state
    const [showHistory, setShowHistory] = useState(false);
    const [historyEntries, setHistoryEntries] = useState([]);
    const [historyLimit, setHistoryLimit] = useState(10);
    const [showSettings, setShowSettings] = useState(false);
    const [limitInput, setLimitInput] = useState('10');
    const historyRef = useRef(null);

    // ===== WALLET STATE =====
    const [showWallet, setShowWallet] = useState(false);
    const walletRef = useRef(null);
    const [walletAddress, setWalletAddress] = useState(null);
    const [walletLocked, setWalletLocked] = useState(true);
    const [hasWallet, setHasWallet] = useState(false);
    const [plsBalance, setPlsBalance] = useState('0.0');
    const [walletTokens, setWalletTokens] = useState([]);
    const [walletTokenBalances, setWalletTokenBalances] = useState({});
    const [walletView, setWalletView] = useState('main'); // main | create | import | send | addToken
    const [walletPassword, setWalletPassword] = useState('');
    const [walletSeedPhrase, setWalletSeedPhrase] = useState('');
    const [walletImportInput, setWalletImportInput] = useState('');
    const [walletSendTo, setWalletSendTo] = useState('');
    const [walletSendAmount, setWalletSendAmount] = useState('');
    const [walletSendToken, setWalletSendToken] = useState('PLS');
    const [walletNewTokenAddr, setWalletNewTokenAddr] = useState('');
    const [walletMsg, setWalletMsg] = useState('');
    const [walletMsgType, setWalletMsgType] = useState('info'); // info | success | error
    const [walletLoading, setWalletLoading] = useState(false);
    const [walletMnemonic, setWalletMnemonic] = useState('');

    // ===== NODE STATE =====
    const [showNodePanel, setShowNodePanel] = useState(false);
    const nodeRef = useRef(null);
    const [nodeStatus, setNodeStatus] = useState('stopped');
    const [nodeLogs, setNodeLogs] = useState([]);
    const [nodeConfig, setNodeConfig] = useState({
        neighborhoodMode: 'standard',
        blockchainServiceUrl: 'https://rpc.pulsechain.com',
        earningWallet: '',
        gasPrice: '1',
        dnsServers: '1.1.1.1,1.0.0.1',
        logLevel: 'info',
    });
    const [nodeView, setNodeView] = useState('status'); // status | config | logs
    const [nodeBinaryFound, setNodeBinaryFound] = useState(false);
    const [nodeLoading, setNodeLoading] = useState(false);
    const [nodeDownloading, setNodeDownloading] = useState(false);
    const [nodeDownloadProgress, setNodeDownloadProgress] = useState(0);
    const [nodeBinaryPath, setNodeBinaryPath] = useState(null);
    const nodeLogEndRef = useRef(null);
    // ===== MESH PROXY STATE =====
    const [showMeshPanel, setShowMeshPanel] = useState(false);
    const meshRef = useRef(null);
    const [meshEnabled, setMeshEnabled] = useState(false);
    const [meshStatus, setMeshStatus] = useState({ enabled: false, proxyType: 'socks5', proxyPort: 1080, nodeRunning: false, connectionStatus: 'direct' });
    const [meshPort, setMeshPort] = useState('1080');
    const [meshProxyType, setMeshProxyType] = useState('socks5');
    const [meshLoading, setMeshLoading] = useState(false);

    // ===== SPACES STATE =====
    const [showSpaces, setShowSpaces] = useState(false);
    const spacesRef = useRef(null);
    const [spaces, setSpaces] = useState([]);
    const [activeSpaceId, setActiveSpaceId] = useState(null);
    const [spacesView, setSpacesView] = useState('list');
    const [newSpaceName, setNewSpaceName] = useState('');
    const [newSpaceColor, setNewSpaceColor] = useState('#14b8a6');
    const [newDappName, setNewDappName] = useState('');
    const [newDappUrl, setNewDappUrl] = useState('');
    const [showAddDapp, setShowAddDapp] = useState(false);
    // ===== CHAT STATE =====
    const [showChat, setShowChat] = useState(false);
    const [chatView, setChatView] = useState('conversations');
    const [chatConversations, setChatConversations] = useState([]);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatActivePeer, setChatActivePeer] = useState('');
    const [chatInput, setChatInput] = useState('');
    const [chatNewAddress, setChatNewAddress] = useState('');
    const [chatUnread, setChatUnread] = useState(0);
    const [chatLoading, setChatLoading] = useState(false);
    const [chatMsg, setChatMsg] = useState('');
    const chatRef = useRef(null);
    const chatMessagesEndRef = useRef(null);

    // ===== IPFS STATE =====
    const [showIpfs, setShowIpfs] = useState(false);
    const [ipfsView, setIpfsView] = useState('files');
    const [ipfsFiles, setIpfsFiles] = useState([]);
    const [ipfsDownloadCid, setIpfsDownloadCid] = useState('');
    const [ipfsApiStatus, setIpfsApiStatus] = useState(false);
    const [ipfsConfig, setIpfsConfig] = useState({ apiUrl: '', gatewayUrl: '' });
    const [ipfsLoading, setIpfsLoading] = useState(false);
    const [ipfsMsg, setIpfsMsg] = useState('');
    const [ipfsMsgType, setIpfsMsgType] = useState('info');
    const ipfsRef = useRef(null);

    // ===== TOKEN PAYMENT STATE =====
    const [showToken, setShowToken] = useState(false);
    const tokenRef = useRef(null);
    const [tokenView, setTokenView] = useState('main'); // main | send | history | settings
    const [tokenBalance, setTokenBalance] = useState({ formatted: '0.0', symbol: 'CLOAK' });
    const [tokenInfo, setTokenInfo] = useState({ name: 'PulseCloak Token', symbol: 'CLOAK', decimals: 18, configured: false, address: '' });
    const [tokenSendTo, setTokenSendTo] = useState('');
    const [tokenSendAmount, setTokenSendAmount] = useState('');
    const [tokenPaymentHistory, setTokenPaymentHistory] = useState([]);
    const [tokenPaymentRate, setTokenPaymentRate] = useState('0.1');
    const [tokenAutoPayEnabled, setTokenAutoPayEnabled] = useState(false);
    const [tokenAddressInput, setTokenAddressInput] = useState('');
    const [tokenGasEstimate, setTokenGasEstimate] = useState('');
    const [tokenLoading, setTokenLoading] = useState(false);
    const [tokenMsg, setTokenMsg] = useState('');
    const [tokenMsgType, setTokenMsgType] = useState('info');

    // ===== BANDWIDTH SHARING STATE =====
    const [showBandwidth, setShowBandwidth] = useState(false);
    const bandwidthRef = useRef(null);
    const [bwStats, setBwStats] = useState(null);
    const [bwRewards, setBwRewards] = useState({ pending: 0, claimed: 0, totalEarned: 0, rate: 0.05 });
    const [bwHistory, setBwHistory] = useState([]);
    const [bwSharingEnabled, setBwSharingEnabled] = useState(false);
    const [bwLoading, setBwLoading] = useState(false);
    const [bwMsg, setBwMsg] = useState('');
    const [bwMsgType, setBwMsgType] = useState('info');


    // Fetch current tabs on mount
    const getCurrentTabs = useCallback(async () => {
        try {
            const currentTabs = await window.electronApi.getCurrentTabs();
            if (currentTabs && currentTabs.length > 0) {
                setTabs(currentTabs);
            }
        } catch (err) {
            console.error('Failed to get current tabs:', err);
        }
    }, []);

    useEffect(() => {
        setTimeout(() => getCurrentTabs(), 500);
    }, [getCurrentTabs]);

    // ===== HIDE/SHOW BROWSERVIEW WHEN PANELS OPEN =====
    const anyPanelOpen = showWelcome || showAdblockInfo || showHistory || showWallet || showNodePanel || showMeshPanel || showSpaces || showChat || showIpfs || showToken || showBandwidth || showSettings;

    useEffect(() => {
        if (anyPanelOpen) {
            try { window.electronApi.hideActiveTab(); } catch(e) {}
        } else {
            try { window.electronApi.showActiveTab(); } catch(e) {}
        }
    }, [anyPanelOpen]);


    // Poll adblock stats every 3 seconds
    useEffect(() => {
        const fetchAdblockStats = async () => {
            try {
                if (window.adblockApi) {
                    const stats = await window.adblockApi.getStats();
                    setBlockedCount(stats.totalBlocked || 0);
                }
            } catch (err) {
                console.error('Failed to get adblock stats:', err);
            }
        };
        fetchAdblockStats();
        const interval = setInterval(fetchAdblockStats, 3000);
    
    // ===== RENDER: Mesh Panel Content =====
    const renderMeshContent = () => {
        return (
            <div className={styles.meshPanel}>
                <div className={styles.meshToggleRow}>
                    <span className={styles.meshToggleLabel}>{meshEnabled ? 'Mesh Routing' : 'Direct Connection'}</span>
                    <button
                        className={`${styles.meshToggleBtn} ${meshEnabled ? styles.meshToggleOn : styles.meshToggleOff}`}
                        onClick={handleToggleMesh}
                        disabled={meshLoading}
                    >
                        <span className={styles.meshToggleKnob} />
                    </button>
                </div>

                <div className={styles.meshStatusRow}>
                    <span className={styles.meshStatusDot} style={{ backgroundColor: meshStatusColor() }} />
                    <span className={styles.meshStatusLabel}>{meshStatusText()}</span>
                </div>

                {meshEnabled && !meshStatus.nodeRunning && (
                    <div className={styles.meshWarning}>
                        Mesh node is not running. Start the node from the Node Control Panel or traffic will fall back to direct.
                    </div>
                )}

                <div className={styles.meshConfigSection}>
                    <label className={styles.meshConfigLabel}>Proxy Type
                        <select
                            className={styles.meshConfigInput}
                            value={meshProxyType}
                            onChange={(e) => { setMeshProxyType(e.target.value); handleSetMeshType(e.target.value); }}
                        >
                            <option value="socks5">SOCKS5</option>
                            <option value="http">HTTP</option>
                        </select>
                    </label>
                    <label className={styles.meshConfigLabel}>Proxy Port
                        <div className={styles.meshPortRow}>
                            <input
                                type="number"
                                className={styles.meshConfigInput}
                                value={meshPort}
                                onChange={(e) => setMeshPort(e.target.value)}
                                min="1"
                                max="65535"
                            />
                            <button className={styles.meshPortSaveBtn} onClick={handleSetMeshPort}>Set</button>
                        </div>
                    </label>
                </div>

                <div className={styles.meshInfoRow}>
                    <span className={styles.meshInfoLabel}>Connection</span>
                    <span className={styles.meshInfoValue}>{meshStatus.connectionStatus === 'mesh' ? 'Mesh Network' : 'Direct'}</span>
                </div>
            </div>
        );
    };

    // ===== RENDER: Spaces Panel Content =====
    const renderSpacesContent = () => {
        if (spacesView === 'create') {
            return (
                <div className={styles.spacesCreate}>
                    <h4 className={styles.spacesSubtitle}>Create New Space</h4>
                    <input
                        type="text"
                        className={styles.spacesInput}
                        placeholder="Space name"
                        value={newSpaceName}
                        onChange={(e) => setNewSpaceName(e.target.value)}
                    />
                    <div className={styles.spacesColorPicker}>
                        {spaceColors.map((c) => (
                            <button
                                key={c}
                                className={`${styles.spacesColorBtn} ${newSpaceColor === c ? styles.spacesColorSelected : ''}`}
                                style={{ backgroundColor: c }}
                                onClick={() => setNewSpaceColor(c)}
                            />
                        ))}
                    </div>
                    <div className={styles.spacesCreateActions}>
                        <button className={styles.spacesBtnPrimary} onClick={handleCreateSpace}>Create</button>
                        <button className={styles.spacesBtnSecondary} onClick={() => setSpacesView('list')}>Cancel</button>
                    </div>
                </div>
            );
        }

        if (spacesView === 'detail' && activeSpaceId) {
            const space = getActiveSpace();
            if (!space) {
                setSpacesView('list');
                return null;
            }
            return (
                <div className={styles.spacesDetail}>
                    <div className={styles.spacesDetailHeader}>
                        <button className={styles.spacesBackBtn} onClick={() => { setSpacesView('list'); setShowAddDapp(false); }}>&larr;</button>
                        <div className={styles.spacesDetailDot} style={{ backgroundColor: space.color }} />
                        <span className={styles.spacesDetailName}>{space.name}</span>
                        <button className={styles.spacesDeleteBtn} onClick={() => handleDeleteSpace(space.id)} title="Delete space">&times;</button>
                    </div>
                    <div className={styles.spacesDappGrid}>
                        {(space.dapps || []).map((dapp, i) => (
                            <div key={i} className={styles.spacesDappTile} onClick={() => handleOpenDapp(dapp.url)}>
                                <div className={styles.spacesDappIcon} style={{ backgroundColor: space.color + '33' }}>
                                    {dapp.icon ? (
                                        <img src={dapp.icon} width="24" height="24" alt="" onError={(e) => { e.target.style.display = 'none'; }} />
                                    ) : (
                                        <span className={styles.spacesDappLetter} style={{ color: space.color }}>{dapp.name.charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                                <span className={styles.spacesDappName}>{dapp.name}</span>
                                <button
                                    className={styles.spacesDappRemove}
                                    onClick={(e) => { e.stopPropagation(); handleRemoveDapp(space.id, dapp.url); }}
                                    title="Remove dApp"
                                >&times;</button>
                            </div>
                        ))}
                        <div className={`${styles.spacesDappTile} ${styles.spacesDappAdd}`} onClick={() => setShowAddDapp(!showAddDapp)}>
                            <div className={styles.spacesDappIcon}>
                                <span className={styles.spacesDappPlus}>+</span>
                            </div>
                            <span className={styles.spacesDappName}>Add dApp</span>
                        </div>
                    </div>
                    {showAddDapp && (
                        <div className={styles.spacesAddDappForm}>
                            <input
                                type="text"
                                className={styles.spacesInput}
                                placeholder="dApp name"
                                value={newDappName}
                                onChange={(e) => setNewDappName(e.target.value)}
                            />
                            <input
                                type="text"
                                className={styles.spacesInput}
                                placeholder="URL (e.g. https://app.pulsex.com)"
                                value={newDappUrl}
                                onChange={(e) => setNewDappUrl(e.target.value)}
                            />
                            <button className={styles.spacesBtnPrimary} onClick={handleAddDapp}>Add</button>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className={styles.spacesList}>
                <div className={styles.spacesGrid}>
                    {spaces.map((space) => (
                        <div
                            key={space.id}
                            className={styles.spacesCard}
                            onClick={() => handleSelectSpace(space)}
                            style={{ borderColor: space.color }}
                        >
                            <div className={styles.spacesCardDot} style={{ backgroundColor: space.color }} />
                            <span className={styles.spacesCardName}>{space.name}</span>
                            <span className={styles.spacesCardCount}>{(space.dapps || []).length} dApps</span>
                        </div>
                    ))}
                </div>
                <button className={styles.spacesBtnPrimary} onClick={() => setSpacesView('create')}>+ New Space</button>
            </div>
        );
    };

    return () => clearInterval(interval);
    }, []);

    // Load history limit on mount
    useEffect(() => {
        const loadHistoryLimit = async () => {
            try {
                if (window.historyApi) {
                    const limit = await window.historyApi.getLimit();
                    setHistoryLimit(limit);
                    setLimitInput(String(limit));
                }
            } catch (err) {
                console.error('Failed to get history limit:', err);
            }
        };
        loadHistoryLimit();
    }, []);

    // ===== WALLET: Check wallet status on mount =====
    useEffect(() => {
        const checkWallet = async () => {
            try {
                if (window.walletApi) {
                    const info = await window.walletApi.getWalletAddress();
                    setHasWallet(info.hasWallet);
                    setWalletLocked(info.isLocked);
                    setWalletAddress(info.address);
                }
            } catch (err) {
                console.error('Failed to check wallet:', err);
            }
        };
        checkWallet();
    }, []);

    // ===== NODE: Check node status on mount =====
    useEffect(() => {
        const checkNode = async () => {
            try {
                if (window.nodeApi) {
                    const status = await window.nodeApi.getNodeStatus();
                    setNodeStatus(status.status);
                    setNodeBinaryFound(status.binaryFound);
                    setNodeBinaryPath(status.binaryPath || null);
                    setNodeDownloading(status.isDownloading || false);
                    setNodeDownloadProgress(status.downloadProgress || 0);
                    const config = await window.nodeApi.getNodeConfig();
                    setNodeConfig(config);
                }
            } catch (err) {
                console.error('Failed to check node:', err);
            }
        };
        checkNode();
    }, []);

    // ===== NODE: Poll status and logs when panel is open =====
    useEffect(() => {
        if (!showNodePanel) return;
        const poll = async () => {
            try {
                if (window.nodeApi) {
                    const status = await window.nodeApi.getNodeStatus();
                    setNodeStatus(status.status);
                    setNodeBinaryFound(status.binaryFound);
                    setNodeBinaryPath(status.binaryPath || null);
                    setNodeDownloading(status.isDownloading || false);
                    setNodeDownloadProgress(status.downloadProgress || 0);
                    if (nodeView === 'logs') {
                        const logs = await window.nodeApi.getNodeLogs(200);
                        setNodeLogs(logs || []);
                    }
                }
            } catch (err) {
                console.error('Node poll error:', err);
            }
        };
        poll();
        const interval = setInterval(poll, 2000);
        return () => clearInterval(interval);
    }, [showNodePanel, nodeView]);

    // Auto-scroll node logs
    useEffect(() => {
        if (nodeLogEndRef.current) {
            nodeLogEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [nodeLogs]);


    // ===== MESH: Check mesh status on mount =====
    useEffect(() => {
        const checkMesh = async () => {
            try {
                if (window.meshApi) {
                    const status = await window.meshApi.getMeshStatus();
                    setMeshStatus(status);
                    setMeshEnabled(status.enabled);
                    setMeshPort(String(status.proxyPort));
                    setMeshProxyType(status.proxyType);
                }
            } catch (err) {
                console.error('Failed to check mesh status:', err);
            }
        };
        checkMesh();
    }, []);

    // ===== MESH: Poll status when panel is open =====
    useEffect(() => {
        if (!showMeshPanel) return;
        const poll = async () => {
            try {
                if (window.meshApi) {
                    const status = await window.meshApi.getMeshStatus();
                    setMeshStatus(status);
                    setMeshEnabled(status.enabled);
                }
            } catch (err) {
                console.error('Mesh poll error:', err);
            }
        };
        poll();
        const interval = setInterval(poll, 3000);
        return () => clearInterval(interval);
    }, [showMeshPanel]);


    // ===== CHAT: Initialize and listen for messages =====
    useEffect(() => {
        if (window.chatApi) {
            if (walletAddress && !walletLocked) {
                window.chatApi.setWallet(walletAddress, '').catch(() => {});
            }
            window.chatApi.onNewMessage((event, data) => {
                if (showChat && chatActivePeer === data.sender) {
                    setChatMessages((prev) => [...prev, data]);
                }
                refreshChatConversations();
                refreshChatUnread();
            });
        }
    }, [walletAddress, walletLocked]);

    useEffect(() => {
        if (showChat && chatActivePeer) {
            refreshChatMessages(chatActivePeer);
        }
    }, [showChat, chatActivePeer]);

    useEffect(() => {
        if (chatMessagesEndRef.current) {
            chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages]);

    // ===== IPFS: Load files on mount =====
    useEffect(() => {
        if (window.ipfsApi) {
            refreshIpfsFiles();
            refreshIpfsConfig();
            checkIpfsApi();
        }
    }, []);

    // ===== SPACES: Load spaces on mount =====
    useEffect(() => {
        const loadSpaces = async () => {
            try {
                if (window.spacesApi) {
                    const s = await window.spacesApi.getSpaces();
                    setSpaces(s || []);
                }
            } catch (err) {
                console.error('Failed to load spaces:', err);
            }
        };
        loadSpaces();
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (adblockInfoRef.current && !adblockInfoRef.current.contains(event.target)) {
                setShowAdblockInfo(false);
            }
            if (historyRef.current && !historyRef.current.contains(event.target)) {
                setShowHistory(false);
                setShowSettings(false);
            }
            if (walletRef.current && !walletRef.current.contains(event.target)) {
                setShowWallet(false);
            }
            if (nodeRef.current && !nodeRef.current.contains(event.target)) {
                setShowNodePanel(false);
            }
            if (meshRef.current && !meshRef.current.contains(event.target)) {
                setShowMeshPanel(false);
            }
            if (spacesRef.current && !spacesRef.current.contains(event.target)) {
                setShowSpaces(false);
                setSpacesView('list');
                setShowAddDapp(false);
            }
            if (chatRef.current && !chatRef.current.contains(event.target)) {
                setShowChat(false);
            }
            if (ipfsRef.current && !ipfsRef.current.contains(event.target)) {
                setShowIpfs(false);
            }
            if (tokenRef.current && !tokenRef.current.contains(event.target)) {
                setShowToken(false);
            }
            if (bandwidthRef.current && !bandwidthRef.current.contains(event.target)) {
                setShowBandwidth(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Set up IPC event listeners
    useEffect(() => {
        const handleTabsFound = (_event, value) => {
            setTabs(value || []);
        };
        const handleTabSelected = (_event, value) => {
            setSelectedTab(value);
            setShowWelcome(false);
            try { window.electronApi.showActiveTab(); } catch(e) {}
        };
        const handleDidNavigate = (_event, value) => {
            if (value && value.url) {
                setCurrentUrl(value.url);
                setInputUrl(value.url);
                setIsLoading(false);
                setShowWelcome(false);
            }
        };
        const handleDidNavigateInPage = (_event, value) => {
            if (value && value.url && value.isMainFrame) {
                setCurrentUrl(value.url);
                setInputUrl(value.url);
            }
        };
        const handleDidStartLoading = () => setIsLoading(true);
        const handleDidStopLoading = () => setIsLoading(false);
        const handlePageTitleUpdated = (_event, value) => {
            if (value && value.title && value.tabId) {
                setTabTitles((prev) => ({ ...prev, [value.tabId]: value.title }));
                if (value.tabId === selectedTab) {
                    setPageTitle(value.title);
                }
            }
        };
        const handlePageFaviconUpdated = (_event, value) => {
            if (value && value.icons && value.icons.length > 0 && value.tabId) {
                setTabFavicons((prev) => ({ ...prev, [value.tabId]: value.icons[0] }));
            }
        };

        window.electronApi.onTabsFound(handleTabsFound);
        window.electronApi.onTabSelected(handleTabSelected);
        window.electronApi.onDidNavigate(handleDidNavigate);
        window.electronApi.onDidNavigateInPage(handleDidNavigateInPage);
        window.electronApi.onDidStartLoading(handleDidStartLoading);
        window.electronApi.onDidStopLoading(handleDidStopLoading);
        window.electronApi.onPageTitleUpdated(handlePageTitleUpdated);
        window.electronApi.onPageFaviconUpdated(handlePageFaviconUpdated);
    }, [selectedTab]);

    // ===== NAVIGATION HANDLERS =====
    const handleUrlSubmit = (e) => {
        e.preventDefault();
        if (!inputUrl.trim()) return;
        setShowWelcome(false);
        try { window.electronApi.showActiveTab(); } catch(e2) {}
        let url = inputUrl.trim();
        if (!url.includes('.') && !url.startsWith('http')) {
            url = 'https://duckduckgo.com/?q=' + encodeURIComponent(url);
        } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        setIsLoading(true);
        if (selectedTab) {
            window.electronApi.loadUrl({ url, id: selectedTab });
        } else {
            window.electronApi.loadUrl({ url });
        }
    };

    const handleRefresh = () => {
        if (selectedTab) {
            setIsLoading(true);
            window.electronApi.refreshTab({ id: selectedTab });
        }
    };

    const handleHome = () => {
        setShowWelcome(true);
        try { window.electronApi.hideActiveTab(); } catch(e) {}
    };

    const handleSelectTab = (id) => {
        setShowWelcome(false);
        try { window.electronApi.showActiveTab(); } catch(e) {}
        window.electronApi.selectTab(id);
    };

    const handleNewTab = async () => {
        setShowWelcome(false);
        try {
            await window.electronApi.newTab();
        } catch (err) {
            console.error('Failed to create new tab:', err);
        }
    };

    const handleCloseTab = async (e, id) => {
        e.stopPropagation(); // Don't select the tab when clicking close
        try {
            await window.electronApi.closeTab({ id });
            // Refresh tab list
            const currentTabs = await window.electronApi.getCurrentTabs();
            if (currentTabs) setTabs(currentTabs);
        } catch (err) {
            console.error('Failed to close tab:', err);
        }
    };


    const handleQuickLink = (url) => {
        setShowWelcome(false);
        try { window.electronApi.showActiveTab(); } catch(e) {}
        setInputUrl(url);
        setIsLoading(true);
        if (selectedTab) {
            window.electronApi.loadUrl({ url, id: selectedTab });
        } else {
            window.electronApi.loadUrl({ url });
        }
    };

    const getTabDisplayName = (id) => {
        if (tabTitles[id]) {
            const title = tabTitles[id];
            return title.length > 20 ? title.substring(0, 20) + '...' : title;
        }
        return 'Tab ' + id;
    };

    // ===== HISTORY HANDLERS =====
    const loadHistory = async () => {
        try {
            if (window.historyApi) {
                const entries = await window.historyApi.getHistory();
                setHistoryEntries(entries || []);
            }
        } catch (err) {
            console.error('Failed to load history:', err);
        }
    };

    const toggleHistory = () => {
        if (!showHistory) loadHistory();
        setShowHistory(!showHistory);
        setShowSettings(false);
    };

    const handleHistoryClick = (url) => {
        setShowHistory(false);
        setInputUrl(url);
        setIsLoading(true);
        if (selectedTab) {
            window.electronApi.loadUrl({ url, id: selectedTab });
        } else {
            window.electronApi.loadUrl({ url });
        }
    };

    const handleDeleteHistoryEntry = async (index, e) => {
        e.stopPropagation();
        try {
            if (window.historyApi) {
                const entries = await window.historyApi.deleteEntry(index);
                setHistoryEntries(entries || []);
            }
        } catch (err) {
            console.error('Failed to delete history entry:', err);
        }
    };

    const handleClearHistory = async () => {
        try {
            if (window.historyApi) {
                await window.historyApi.clearHistory();
                setHistoryEntries([]);
            }
        } catch (err) {
            console.error('Failed to clear history:', err);
        }
    };

    const handleSaveLimit = async () => {
        const newLimit = parseInt(limitInput, 10);
        if (isNaN(newLimit) || newLimit < 1) {
            setLimitInput(String(historyLimit));
            return;
        }
        try {
            if (window.historyApi) {
                const result = await window.historyApi.setLimit(newLimit);
                setHistoryLimit(result.limit);
                setLimitInput(String(result.limit));
                setHistoryEntries(result.history || []);
            }
        } catch (err) {
            console.error('Failed to set history limit:', err);
        }
    };

    const formatTimestamp = (ts) => {
        try {
            const d = new Date(ts);
            const now = new Date();
            const diffMs = now - d;
            const diffMins = Math.floor(diffMs / 60000);
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return diffMins + 'm ago';
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return diffHours + 'h ago';
            const diffDays = Math.floor(diffHours / 24);
            return diffDays + 'd ago';
        } catch (e) {
            return '';
        }
    };

    // ===== WALLET HANDLERS =====
    const showWalletMsg = (msg, type = 'info') => {
        setWalletMsg(msg);
        setWalletMsgType(type);
        if (type !== 'error') {
            setTimeout(() => setWalletMsg(''), 4000);
        }
    };

    const refreshWalletInfo = async () => {
        try {
            const info = await window.walletApi.getWalletAddress();
            setHasWallet(info.hasWallet);
            setWalletLocked(info.isLocked);
            setWalletAddress(info.address);
            if (!info.isLocked && info.address) {
                const bal = await window.walletApi.getBalance();
                setPlsBalance(parseFloat(bal.formatted).toFixed(4));
                const tokens = await window.walletApi.getTokenList();
                setWalletTokens(tokens || []);
                // Fetch token balances
                const balances = {};
                for (const t of (tokens || [])) {
                    try {
                        const tb = await window.walletApi.getTokenBalance(t.address);
                        balances[t.address] = tb.formatted;
                    } catch (e) {
                        balances[t.address] = 'Error';
                    }
                }
                setWalletTokenBalances(balances);
            }
        } catch (err) {
            console.error('Wallet refresh error:', err);
        }
    };

    const toggleWallet = () => {
        if (!showWallet) {
            refreshWalletInfo();
            setWalletView('main');
            setWalletMsg('');
            setWalletMnemonic('');
        }
        setShowWallet(!showWallet);
    };

    const handleCreateWallet = async () => {
        if (!walletPassword || walletPassword.length < 6) {
            showWalletMsg('Password must be at least 6 characters', 'error');
            return;
        }
        setWalletLoading(true);
        try {
            const result = await window.walletApi.createWallet(walletPassword);
            setWalletMnemonic(result.mnemonic);
            setWalletAddress(result.address);
            setHasWallet(true);
            setWalletLocked(false);
            setWalletView('showMnemonic');
            showWalletMsg('Wallet created! Save your seed phrase!', 'success');
            setWalletPassword('');
        } catch (err) {
            showWalletMsg(err.message || 'Failed to create wallet', 'error');
        }
        setWalletLoading(false);
    };

    const handleImportWallet = async () => {
        if (!walletPassword || walletPassword.length < 6) {
            showWalletMsg('Password must be at least 6 characters', 'error');
            return;
        }
        if (!walletImportInput.trim()) {
            showWalletMsg('Enter seed phrase or private key', 'error');
            return;
        }
        setWalletLoading(true);
        try {
            const result = await window.walletApi.importWallet(walletImportInput.trim(), walletPassword);
            setWalletAddress(result.address);
            setHasWallet(true);
            setWalletLocked(false);
            setWalletView('main');
            showWalletMsg('Wallet imported successfully!', 'success');
            setWalletPassword('');
            setWalletImportInput('');
            refreshWalletInfo();
        } catch (err) {
            showWalletMsg(err.message || 'Failed to import wallet', 'error');
        }
        setWalletLoading(false);
    };

    const handleUnlockWallet = async () => {
        if (!walletPassword) {
            showWalletMsg('Enter your password', 'error');
            return;
        }
        setWalletLoading(true);
        try {
            const result = await window.walletApi.unlockWallet(walletPassword);
            setWalletAddress(result.address);
            setWalletLocked(false);
            setWalletView('main');
            showWalletMsg('Wallet unlocked', 'success');
            setWalletPassword('');
            refreshWalletInfo();
        } catch (err) {
            showWalletMsg(err.message || 'Invalid password', 'error');
        }
        setWalletLoading(false);
    };

    const handleLockWallet = async () => {
        try {
            await window.walletApi.lockWallet();
            setWalletLocked(true);
            setWalletAddress(null);
            setPlsBalance('0.0');
            setWalletTokenBalances({});
            setWalletView('main');
            showWalletMsg('Wallet locked', 'info');
        } catch (err) {
            showWalletMsg(err.message || 'Failed to lock', 'error');
        }
    };

    const handleSendPls = async () => {
        if (!walletSendTo || !walletSendAmount) {
            showWalletMsg('Enter recipient and amount', 'error');
            return;
        }
        setWalletLoading(true);
        try {
            let result;
            if (walletSendToken === 'PLS') {
                result = await window.walletApi.sendTransaction(walletSendTo, walletSendAmount);
            } else {
                result = await window.walletApi.sendToken(walletSendToken, walletSendTo, walletSendAmount);
            }
            showWalletMsg('TX sent! Hash: ' + result.hash.substring(0, 16) + '...', 'success');
            setWalletSendTo('');
            setWalletSendAmount('');
            setWalletView('main');
            setTimeout(() => refreshWalletInfo(), 3000);
        } catch (err) {
            showWalletMsg(err.message || 'Transaction failed', 'error');
        }
        setWalletLoading(false);
    };

    const handleAddToken = async () => {
        if (!walletNewTokenAddr.trim()) {
            showWalletMsg('Enter token contract address', 'error');
            return;
        }
        setWalletLoading(true);
        try {
            const result = await window.walletApi.addToken(walletNewTokenAddr.trim());
            showWalletMsg('Token added: ' + result.symbol, 'success');
            setWalletNewTokenAddr('');
            setWalletView('main');
            refreshWalletInfo();
        } catch (err) {
            showWalletMsg(err.message || 'Failed to add token', 'error');
        }
        setWalletLoading(false);
    };

    const copyAddress = () => {
        if (walletAddress) {
            navigator.clipboard.writeText(walletAddress).then(() => {
                showWalletMsg('Address copied!', 'success');
            });
        }
    };

    const truncateAddr = (addr) => {
        if (!addr) return '';
        return addr.substring(0, 6) + '...' + addr.substring(addr.length - 4);
    };

    // ===== NODE HANDLERS =====
    const toggleNodePanel = () => {
        if (!showNodePanel) {
            setNodeView('status');
        }
        setShowNodePanel(!showNodePanel);
    };

    const handleStartNode = async () => {
        setNodeLoading(true);
        try {
            const result = await window.nodeApi.startNode();
            setNodeStatus(result.status);
        } catch (err) {
            console.error('Failed to start node:', err);
        }
        setNodeLoading(false);
    };

    const handleStopNode = async () => {
        setNodeLoading(true);
        try {
            const result = await window.nodeApi.stopNode();
            setNodeStatus(result.status);
        } catch (err) {
            console.error('Failed to stop node:', err);
        }
        setNodeLoading(false);
    };

    const handleSaveNodeConfig = async () => {
        try {
            const result = await window.nodeApi.configureNode(nodeConfig);
            setNodeConfig(result);
        } catch (err) {
            console.error('Failed to save node config:', err);
        }
    };

    const handleClearNodeLogs = async () => {
        try {
            await window.nodeApi.clearNodeLogs();
            setNodeLogs([]);
        } catch (err) {
            console.error('Failed to clear logs:', err);
        }
    };

    const handleDownloadNode = async () => {
        setNodeDownloading(true);
        setNodeDownloadProgress(0);
        try {
            const result = await window.nodeApi.downloadBinary();
            if (result.status === 'success') {
                setNodeBinaryFound(true);
                setNodeBinaryPath(result.path);
            }
        } catch (err) {
            console.error('Failed to download node binary:', err);
        }
        setNodeDownloading(false);
    };

    const nodeStatusColor = () => {
        switch (nodeStatus) {
            case 'running': return '#4ade80';
            case 'starting': return '#facc15';
            case 'error': return '#f87171';
            default: return '#6b7280';
        }
    };


    // ===== MESH HANDLERS =====
    const toggleMeshPanel = () => {
        setShowMeshPanel(!showMeshPanel);
    };

    const handleEnableMesh = async () => {
        setMeshLoading(true);
        try {
            const result = await window.meshApi.enableMesh();
            setMeshStatus(result);
            setMeshEnabled(result.enabled);
        } catch (err) {
            console.error('Failed to enable mesh:', err);
        }
        setMeshLoading(false);
    };

    const handleDisableMesh = async () => {
        setMeshLoading(true);
        try {
            const result = await window.meshApi.disableMesh();
            setMeshStatus(result);
            setMeshEnabled(result.enabled);
        } catch (err) {
            console.error('Failed to disable mesh:', err);
        }
        setMeshLoading(false);
    };

    const handleToggleMesh = () => {
        if (meshEnabled) {
            handleDisableMesh();
        } else {
            handleEnableMesh();
        }
    };

    const handleSetMeshPort = async () => {
        const port = parseInt(meshPort, 10);
        if (isNaN(port) || port < 1 || port > 65535) return;
        try {
            const result = await window.meshApi.setProxyPort(port);
            setMeshStatus(result);
            setMeshPort(String(result.proxyPort));
        } catch (err) {
            console.error('Failed to set mesh port:', err);
        }
    };

    const handleSetMeshType = async (type) => {
        try {
            const result = await window.meshApi.setProxyType(type);
            setMeshStatus(result);
            setMeshProxyType(result.proxyType);
        } catch (err) {
            console.error('Failed to set mesh type:', err);
        }
    };

    const meshStatusColor = () => {
        if (meshEnabled && meshStatus.nodeRunning) return '#4ade80';
        if (meshEnabled && !meshStatus.nodeRunning) return '#facc15';
        return '#6b7280';
    };

    const meshStatusText = () => {
        if (meshEnabled && meshStatus.nodeRunning) return 'Mesh Active';
        if (meshEnabled && !meshStatus.nodeRunning) return 'Node Offline';
        return 'Direct';
    };

    // ===== SPACES HANDLERS =====
    const refreshSpaces = async () => {
        try {
            if (window.spacesApi) {
                const s = await window.spacesApi.getSpaces();
                setSpaces(s || []);
            }
        } catch (err) {
            console.error('Failed to refresh spaces:', err);
        }
    };

    const toggleSpaces = () => {
        if (!showSpaces) {
            refreshSpaces();
            setSpacesView('list');
            setShowAddDapp(false);
        }
        setShowSpaces(!showSpaces);
    };

    const handleCreateSpace = async () => {
        if (!newSpaceName.trim()) return;
        try {
            await window.spacesApi.createSpace(newSpaceName.trim(), newSpaceColor, '');
            setNewSpaceName('');
            setNewSpaceColor('#14b8a6');
            setSpacesView('list');
            refreshSpaces();
        } catch (err) {
            console.error('Failed to create space:', err);
        }
    };

    const handleDeleteSpace = async (id) => {
        try {
            await window.spacesApi.deleteSpace(id);
            if (activeSpaceId === id) {
                setActiveSpaceId(null);
                setSpacesView('list');
            }
            refreshSpaces();
        } catch (err) {
            console.error('Failed to delete space:', err);
        }
    };

    const handleSelectSpace = (space) => {
        setActiveSpaceId(space.id);
        setSpacesView('detail');
    };

    const handleAddDapp = async () => {
        if (!newDappName.trim() || !newDappUrl.trim() || !activeSpaceId) return;
        let url = newDappUrl.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        try {
            await window.spacesApi.addDapp(activeSpaceId, newDappName.trim(), url, '');
            setNewDappName('');
            setNewDappUrl('');
            setShowAddDapp(false);
            refreshSpaces();
        } catch (err) {
            console.error('Failed to add dApp:', err);
        }
    };

    const handleRemoveDapp = async (spaceId, url) => {
        try {
            await window.spacesApi.removeDapp(spaceId, url);
            refreshSpaces();
        } catch (err) {
            console.error('Failed to remove dApp:', err);
        }
    };

    const handleOpenDapp = (url) => {
        setShowSpaces(false);
        setInputUrl(url);
        setIsLoading(true);
        if (selectedTab) {
            window.electronApi.loadUrl({ url, id: selectedTab });
        } else {
            window.electronApi.loadUrl({ url });
        }
    };


    // ===== CHAT HANDLERS =====
    const refreshChatConversations = async () => {
        try {
            if (window.chatApi) {
                const convos = await window.chatApi.getConversations();
                setChatConversations(convos || []);
            }
        } catch (err) {
            console.error('Failed to refresh conversations:', err);
        }
    };

    const refreshChatMessages = async (peerAddress) => {
        try {
            if (window.chatApi) {
                const msgs = await window.chatApi.getMessages(peerAddress);
                setChatMessages(msgs || []);
                await window.chatApi.markRead(peerAddress);
                refreshChatUnread();
            }
        } catch (err) {
            console.error('Failed to refresh messages:', err);
        }
    };

    const refreshChatUnread = async () => {
        try {
            if (window.chatApi) {
                const count = await window.chatApi.getUnread();
                setChatUnread(count || 0);
            }
        } catch (err) {
            setChatUnread(0);
        }
    };

    const toggleChat = () => {
        if (!showChat) {
            refreshChatConversations();
            refreshChatUnread();
            setChatView('conversations');
        }
        setShowChat(!showChat);
    };

    const handleStartChat = async () => {
        const addr = chatNewAddress.trim();
        if (!addr || !addr.startsWith('0x') || addr.length !== 42) {
            setChatMsg('Enter a valid wallet address (0x...)');
            return;
        }
        try {
            setChatLoading(true);
            await window.chatApi.startChat(addr);
            setChatActivePeer(addr);
            setChatNewAddress('');
            setChatView('chat');
            refreshChatMessages(addr);
            refreshChatConversations();
        } catch (err) {
            setChatMsg(err.message || 'Failed to start chat');
        } finally {
            setChatLoading(false);
        }
    };

    const handleSendChatMessage = async () => {
        const text = chatInput.trim();
        if (!text || !chatActivePeer) return;
        try {
            await window.chatApi.sendMessage(chatActivePeer, text);
            setChatInput('');
            refreshChatMessages(chatActivePeer);
        } catch (err) {
            setChatMsg(err.message || 'Failed to send message');
        }
    };

    const handleSelectConversation = (peerAddress) => {
        setChatActivePeer(peerAddress);
        setChatView('chat');
        refreshChatMessages(peerAddress);
    };

    const truncateChatAddr = (addr) => {
        if (!addr) return '';
        return addr.substring(0, 8) + '...' + addr.substring(addr.length - 6);
    };

    const formatChatTime = (ts) => {
        if (!ts) return '';
        const d = new Date(ts);
        const now = new Date();
        if (d.toDateString() === now.toDateString()) {
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // ===== IPFS HANDLERS =====
    const showIpfsNotice = (msg, type = 'info') => {
        setIpfsMsg(msg);
        setIpfsMsgType(type);
        setTimeout(() => setIpfsMsg(''), 4000);
    };

    const refreshIpfsFiles = async () => {
        try {
            if (window.ipfsApi) {
                const files = await window.ipfsApi.getFiles();
                setIpfsFiles(files || []);
            }
        } catch (err) {
            console.error('Failed to refresh IPFS files:', err);
        }
    };

    const refreshIpfsConfig = async () => {
        try {
            if (window.ipfsApi) {
                const cfg = await window.ipfsApi.getConfig();
                setIpfsConfig(cfg || { apiUrl: '', gatewayUrl: '' });
            }
        } catch (err) {
            console.error('Failed to get IPFS config:', err);
        }
    };

    const checkIpfsApi = async () => {
        try {
            if (window.ipfsApi) {
                const result = await window.ipfsApi.checkApi();
                setIpfsApiStatus(result.available);
            }
        } catch (err) {
            setIpfsApiStatus(false);
        }
    };

    const toggleIpfs = () => {
        if (!showIpfs) {
            refreshIpfsFiles();
            refreshIpfsConfig();
            checkIpfsApi();
            setIpfsView('files');
        }
        setShowIpfs(!showIpfs);
    };

    const handleIpfsUpload = async () => {
        try {
            setIpfsLoading(true);
            const result = await window.ipfsApi.openFileDialog();
            if (result.canceled || !result.filePaths.length) {
                setIpfsLoading(false);
                return;
            }
            const uploaded = await window.ipfsApi.uploadFiles(result.filePaths);
            const success = uploaded.filter((f) => !f.error);
            const failed = uploaded.filter((f) => f.error);
            if (success.length > 0) showIpfsNotice(success.length + ' file(s) uploaded!', 'success');
            if (failed.length > 0) showIpfsNotice(failed.length + ' file(s) failed: ' + failed[0].error, 'error');
            refreshIpfsFiles();
        } catch (err) {
            showIpfsNotice(err.message || 'Upload failed', 'error');
        } finally {
            setIpfsLoading(false);
        }
    };

    const handleIpfsDownload = async () => {
        const cid = ipfsDownloadCid.trim();
        if (!cid) { showIpfsNotice('Enter a CID to download', 'error'); return; }
        try {
            setIpfsLoading(true);
            const result = await window.ipfsApi.downloadFile(cid);
            if (result.success) showIpfsNotice('Downloaded: ' + result.sizeFormatted, 'success');
            setIpfsDownloadCid('');
        } catch (err) {
            showIpfsNotice(err.message || 'Download failed', 'error');
        } finally {
            setIpfsLoading(false);
        }
    };

    const handleIpfsCopyLink = (file) => {
        const url = file.gatewayUrl || (ipfsConfig.gatewayUrl + '/ipfs/' + file.cid);
        navigator.clipboard.writeText(url).then(() => showIpfsNotice('Gateway URL copied!', 'success'));
    };

    const handleIpfsCopyCid = (cid) => {
        navigator.clipboard.writeText(cid).then(() => showIpfsNotice('CID copied!', 'success'));
    };

    const handleIpfsOpenFile = (file) => {
        const url = file.gatewayUrl || (ipfsConfig.gatewayUrl + '/ipfs/' + file.cid);
        setShowIpfs(false);
        setInputUrl(url);
        setIsLoading(true);
        if (selectedTab) {
            window.electronApi.loadUrl({ url, id: selectedTab });
        } else {
            window.electronApi.loadUrl({ url });
        }
    };

    const handleIpfsRemoveFile = async (cid) => {
        try {
            await window.ipfsApi.removeFile(cid);
            refreshIpfsFiles();
        } catch (err) {
            console.error('Failed to remove file:', err);
        }
    };

    const handleIpfsSaveConfig = async () => {
        try {
            await window.ipfsApi.setConfig(ipfsConfig);
            showIpfsNotice('Configuration saved!', 'success');
            checkIpfsApi();
        } catch (err) {
            showIpfsNotice('Failed to save config', 'error');
        }
    };

    const getFileTypeIcon = (type) => {
        const icons = { image: 'IMG', video: 'VID', audio: 'AUD', document: 'DOC', text: 'TXT', archive: 'ZIP' };
        return icons[type] || 'FILE';
    };

    const truncateCid = (cid) => {
        if (!cid) return '';
        if (cid.length <= 16) return cid;
        return cid.substring(0, 8) + '...' + cid.substring(cid.length - 6);
    };

    const getActiveSpace = () => spaces.find((s) => s.id === activeSpaceId);

    const spaceColors = ['#14b8a6', '#a855f7', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];

    const hasActivePage = tabs.length > 0 && selectedTab;

    // ===== TOKEN PAYMENT HANDLERS =====
    const showTokenNotice = (msg, type = 'info') => {
        setTokenMsg(msg);
        setTokenMsgType(type);
        setTimeout(() => setTokenMsg(''), 4000);
    };

    const refreshTokenBalance = async () => {
        try {
            if (window.tokenApi) {
                const bal = await window.tokenApi.getTokenBalance();
                setTokenBalance(bal || { formatted: '0.0', symbol: 'CLOAK' });
            }
        } catch (err) {
            console.error('Failed to get token balance:', err);
        }
    };

    const refreshTokenInfo = async () => {
        try {
            if (window.tokenApi) {
                const info = await window.tokenApi.getTokenInfo();
                setTokenInfo(info || { name: 'PulseCloak Token', symbol: 'CLOAK', decimals: 18, configured: false });
                setTokenAddressInput(info.address || '');
            }
        } catch (err) {
            console.error('Failed to get token info:', err);
        }
    };

    const refreshTokenHistory = async () => {
        try {
            if (window.tokenApi) {
                const history = await window.tokenApi.getPaymentHistory(50);
                setTokenPaymentHistory(history || []);
            }
        } catch (err) {
            console.error('Failed to get payment history:', err);
        }
    };

    const refreshAutoPayStatus = async () => {
        try {
            if (window.tokenApi) {
                const status = await window.tokenApi.getAutoPayStatus();
                setTokenAutoPayEnabled(status.enabled || false);
                setTokenPaymentRate(String(status.rate || '0.1'));
            }
        } catch (err) {
            console.error('Failed to get auto-pay status:', err);
        }
    };

    const toggleToken = () => {
        if (!showToken) {
            refreshTokenBalance();
            refreshTokenInfo();
            refreshAutoPayStatus();
            setTokenView('main');
        }
        setShowToken(!showToken);
    };

    const handleSendTokens = async () => {
        const to = tokenSendTo.trim();
        const amount = tokenSendAmount.trim();
        if (!to || !to.startsWith('0x') || to.length !== 42) {
            showTokenNotice('Enter a valid address (0x...)', 'error');
            return;
        }
        if (!amount || parseFloat(amount) <= 0) {
            showTokenNotice('Enter a valid amount', 'error');
            return;
        }
        try {
            setTokenLoading(true);
            const result = await window.tokenApi.sendTokens(to, amount);
            showTokenNotice('Sent ' + amount + ' ' + tokenBalance.symbol + '! TX: ' + result.hash.substring(0, 10) + '...', 'success');
            setTokenSendTo('');
            setTokenSendAmount('');
            refreshTokenBalance();
            refreshTokenHistory();
        } catch (err) {
            showTokenNotice(err.message || 'Transfer failed', 'error');
        } finally {
            setTokenLoading(false);
        }
    };

    const handleSetTokenAddress = async () => {
        const addr = tokenAddressInput.trim();
        if (!addr || !addr.startsWith('0x') || addr.length !== 42) {
            showTokenNotice('Enter a valid contract address', 'error');
            return;
        }
        try {
            await window.tokenApi.setTokenAddress(addr);
            showTokenNotice('Token address updated!', 'success');
            refreshTokenInfo();
            refreshTokenBalance();
        } catch (err) {
            showTokenNotice(err.message || 'Failed to set address', 'error');
        }
    };

    const handleSetPaymentRate = async () => {
        const rate = parseFloat(tokenPaymentRate);
        if (isNaN(rate) || rate < 0) {
            showTokenNotice('Enter a valid rate', 'error');
            return;
        }
        try {
            await window.tokenApi.setPaymentRate(rate);
            showTokenNotice('Payment rate updated!', 'success');
        } catch (err) {
            showTokenNotice(err.message || 'Failed to set rate', 'error');
        }
    };

    const handleToggleAutoPay = async () => {
        try {
            setTokenLoading(true);
            if (tokenAutoPayEnabled) {
                await window.tokenApi.disableAutoPay();
                setTokenAutoPayEnabled(false);
                showTokenNotice('Auto-pay disabled', 'info');
            } else {
                await window.tokenApi.enableAutoPay();
                setTokenAutoPayEnabled(true);
                showTokenNotice('Auto-pay enabled!', 'success');
            }
        } catch (err) {
            showTokenNotice(err.message || 'Failed to toggle auto-pay', 'error');
        } finally {
            setTokenLoading(false);
        }
    };

    const handleEstimateGas = async () => {
        try {
            const est = await window.tokenApi.estimateGas(tokenSendTo || '0x0000000000000000000000000000000000000001', tokenSendAmount || '1');
            setTokenGasEstimate(est.gasCostFormatted || 'Unable to estimate');
        } catch (err) {
            setTokenGasEstimate('Unable to estimate');
        }
    };

    const formatTokenTime = (ts) => {
        if (!ts) return '';
        const d = new Date(ts);
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const truncateTokenAddr = (addr) => {
        if (!addr) return '';
        return addr.substring(0, 8) + '...' + addr.substring(addr.length - 6);
    };

    // ===== BANDWIDTH SHARING HANDLERS =====
    const showBwNotice = (msg, type = 'info') => {
        setBwMsg(msg);
        setBwMsgType(type);
        setTimeout(() => setBwMsg(''), 4000);
    };

    const refreshBwStats = async () => {
        try {
            if (window.bandwidthApi) {
                const stats = await window.bandwidthApi.getStats();
                setBwStats(stats);
                setBwSharingEnabled(stats.sharing || false);
            }
        } catch (err) {
            console.error('Failed to get bandwidth stats:', err);
        }
    };

    const refreshBwRewards = async () => {
        try {
            if (window.bandwidthApi) {
                const rewards = await window.bandwidthApi.getRewards();
                setBwRewards(rewards || { pending: 0, claimed: 0, totalEarned: 0, rate: 0.05 });
            }
        } catch (err) {
            console.error('Failed to get bandwidth rewards:', err);
        }
    };

    const refreshBwHistory = async () => {
        try {
            if (window.bandwidthApi) {
                const history = await window.bandwidthApi.getHistory(7);
                setBwHistory(history || []);
            }
        } catch (err) {
            console.error('Failed to get bandwidth history:', err);
        }
    };

    const toggleBandwidth = () => {
        if (!showBandwidth) {
            refreshBwStats();
            refreshBwRewards();
            refreshBwHistory();
        }
        setShowBandwidth(!showBandwidth);
    };

    const handleToggleSharing = async () => {
        try {
            setBwLoading(true);
            if (bwSharingEnabled) {
                await window.bandwidthApi.disableSharing();
                setBwSharingEnabled(false);
                showBwNotice('Bandwidth sharing stopped', 'info');
            } else {
                await window.bandwidthApi.enableSharing();
                setBwSharingEnabled(true);
                showBwNotice('Bandwidth sharing started!', 'success');
            }
            refreshBwStats();
        } catch (err) {
            showBwNotice(err.message || 'Failed to toggle sharing', 'error');
        } finally {
            setBwLoading(false);
        }
    };

    const handleClaimRewards = async () => {
        try {
            setBwLoading(true);
            const result = await window.bandwidthApi.claimRewards();
            if (result.success) {
                showBwNotice('Claimed ' + result.claimed + ' tokens!', 'success');
                refreshBwRewards();
            } else {
                showBwNotice(result.message || 'No rewards to claim', 'info');
            }
        } catch (err) {
            showBwNotice(err.message || 'Failed to claim rewards', 'error');
        } finally {
            setBwLoading(false);
        }
    };

    // Auto-refresh bandwidth stats when panel is open
    useEffect(() => {
        let interval;
        if (showBandwidth && bwSharingEnabled) {
            interval = setInterval(() => {
                refreshBwStats();
                refreshBwRewards();
            }, 5000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [showBandwidth, bwSharingEnabled]);

    // Auto-refresh token balance when panel is open
    useEffect(() => {
        let interval;
        if (showToken) {
            interval = setInterval(() => {
                refreshTokenBalance();
            }, 15000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [showToken]);

        // ===== RENDER: Chat Panel Content =====
    const renderChatContent = () => {
        if (!walletAddress || walletLocked) {
            return (
                <div className={styles.chatEmpty}>
                    <p>Unlock your wallet to use chat</p>
                </div>
            );
        }

        if (chatView === 'newChat') {
            return (
                <div className={styles.chatNewChat}>
                    <h4 className={styles.chatSubtitle}>New Conversation</h4>
                    <input
                        type="text"
                        className={styles.chatAddrInput}
                        placeholder="Enter wallet address (0x...)"
                        value={chatNewAddress}
                        onChange={(e) => setChatNewAddress(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleStartChat()}
                    />
                    {chatMsg && <div className={styles.chatMsgBar}>{chatMsg}</div>}
                    <div className={styles.chatNewActions}>
                        <button className={styles.chatBtnPrimary} onClick={handleStartChat} disabled={chatLoading}>
                            {chatLoading ? 'Starting...' : 'Start Chat'}
                        </button>
                        <button className={styles.chatBtnSecondary} onClick={() => setChatView('conversations')}>Back</button>
                    </div>
                </div>
            );
        }

        if (chatView === 'chat' && chatActivePeer) {
            return (
                <div className={styles.chatConvoView}>
                    <div className={styles.chatConvoHeader}>
                        <button className={styles.chatBackBtn} onClick={() => { setChatView('conversations'); setChatActivePeer(''); }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                        </button>
                        <span className={styles.chatPeerAddr} title={chatActivePeer}>{truncateChatAddr(chatActivePeer)}</span>
                    </div>
                    <div className={styles.chatMessageList}>
                        {chatMessages.length === 0 ? (
                            <div className={styles.chatEmptyMessages}>No messages yet. Say hello!</div>
                        ) : (
                            chatMessages.map((msg, idx) => (
                                <div key={idx} className={`${styles.chatBubbleRow} ${msg.sender === walletAddress ? styles.chatBubbleSent : styles.chatBubbleReceived}`}>
                                    <div className={styles.chatBubble}>
                                        <div className={styles.chatBubbleText}>{msg.text}</div>
                                        <div className={styles.chatBubbleTime}>{formatChatTime(msg.timestamp)}</div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={chatMessagesEndRef} />
                    </div>
                    <div className={styles.chatInputRow}>
                        <input
                            type="text"
                            className={styles.chatMsgInput}
                            placeholder="Type a message..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                        />
                        <button className={styles.chatSendBtn} onClick={handleSendChatMessage} title="Send">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                        </button>
                    </div>
                </div>
            );
        }

        // Conversations list (default)
        return (
            <div className={styles.chatConvoList}>
                <div className={styles.chatListHeader}>
                    <span>Conversations</span>
                    <button className={styles.chatNewBtn} onClick={() => setChatView('newChat')} title="New Chat">+</button>
                </div>
                {chatConversations.length === 0 ? (
                    <div className={styles.chatEmpty}>
                        <p>No conversations yet</p>
                        <button className={styles.chatBtnPrimary} onClick={() => setChatView('newChat')}>Start a Chat</button>
                    </div>
                ) : (
                    chatConversations.map((convo, idx) => (
                        <div key={idx} className={styles.chatConvoItem} onClick={() => handleSelectConversation(convo.peerAddress)}>
                            <div className={styles.chatConvoAvatar}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="#14b8a6"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                            </div>
                            <div className={styles.chatConvoInfo}>
                                <div className={styles.chatConvoAddr}>{truncateChatAddr(convo.peerAddress)}</div>
                                <div className={styles.chatConvoPreview}>{convo.lastMessage || 'No messages'}</div>
                            </div>
                            <div className={styles.chatConvoMeta}>
                                <div className={styles.chatConvoTime}>{formatChatTime(convo.lastTimestamp)}</div>
                                {convo.unread > 0 && <div className={styles.chatUnreadBadge}>{convo.unread}</div>}
                            </div>
                        </div>
                    ))
                )}
            </div>
        );
    };

    // ===== RENDER: IPFS Panel Content =====
    const renderIpfsContent = () => {
        if (ipfsView === 'download') {
            return (
                <div className={styles.ipfsDownloadView}>
                    <h4 className={styles.ipfsSubtitle}>Download from IPFS</h4>
                    <input
                        type="text"
                        className={styles.ipfsCidInput}
                        placeholder="Enter IPFS CID (Qm... or bafy...)"
                        value={ipfsDownloadCid}
                        onChange={(e) => setIpfsDownloadCid(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleIpfsDownload()}
                    />
                    <div className={styles.ipfsActions}>
                        <button className={styles.ipfsBtnPrimary} onClick={handleIpfsDownload} disabled={ipfsLoading}>
                            {ipfsLoading ? 'Downloading...' : 'Download'}
                        </button>
                        <button className={styles.ipfsBtnSecondary} onClick={() => setIpfsView('files')}>Back</button>
                    </div>
                </div>
            );
        }

        if (ipfsView === 'config') {
            return (
                <div className={styles.ipfsConfigView}>
                    <h4 className={styles.ipfsSubtitle}>IPFS Configuration</h4>
                    <label className={styles.ipfsLabel}>API URL (local node)</label>
                    <input
                        type="text"
                        className={styles.ipfsConfigInput}
                        placeholder="http://127.0.0.1:5001"
                        value={ipfsConfig.apiUrl}
                        onChange={(e) => setIpfsConfig({ ...ipfsConfig, apiUrl: e.target.value })}
                    />
                    <label className={styles.ipfsLabel}>Gateway URL</label>
                    <input
                        type="text"
                        className={styles.ipfsConfigInput}
                        placeholder="https://ipfs.io"
                        value={ipfsConfig.gatewayUrl}
                        onChange={(e) => setIpfsConfig({ ...ipfsConfig, gatewayUrl: e.target.value })}
                    />
                    <div className={styles.ipfsApiStatusRow}>
                        <span className={styles.ipfsApiDot} style={{ backgroundColor: ipfsApiStatus ? '#4ade80' : '#ef4444' }} />
                        <span>{ipfsApiStatus ? 'IPFS node connected' : 'IPFS node not detected'}</span>
                    </div>
                    <div className={styles.ipfsActions}>
                        <button className={styles.ipfsBtnPrimary} onClick={handleIpfsSaveConfig}>Save Config</button>
                        <button className={styles.ipfsBtnSecondary} onClick={() => { setIpfsView('files'); checkIpfsApi(); }}>Back</button>
                    </div>
                </div>
            );
        }

        // Files list (default)
        return (
            <div className={styles.ipfsFilesView}>
                <div className={styles.ipfsToolbar}>
                    <button className={styles.ipfsBtnPrimary} onClick={handleIpfsUpload} disabled={ipfsLoading}>
                        {ipfsLoading ? 'Uploading...' : 'Upload File'}
                    </button>
                    <button className={styles.ipfsBtnSecondary} onClick={() => setIpfsView('download')}>Download CID</button>
                    <button className={styles.ipfsConfigBtn} onClick={() => setIpfsView('config')} title="Settings">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58z"/></svg>
                    </button>
                </div>
                <div className={styles.ipfsApiStatusRow}>
                    <span className={styles.ipfsApiDot} style={{ backgroundColor: ipfsApiStatus ? '#4ade80' : '#ef4444' }} />
                    <span style={{ fontSize: '11px', color: '#888' }}>{ipfsApiStatus ? 'Node connected' : 'No local node'}</span>
                </div>
                <div className={styles.ipfsFileList}>
                    {ipfsFiles.length === 0 ? (
                        <div className={styles.ipfsEmpty}>No files uploaded yet</div>
                    ) : (
                        ipfsFiles.map((file, idx) => (
                            <div key={idx} className={styles.ipfsFileItem}>
                                <div className={styles.ipfsFileIcon}>{getFileTypeIcon(file.type)}</div>
                                <div className={styles.ipfsFileInfo}>
                                    <div className={styles.ipfsFileName}>{file.name}</div>
                                    <div className={styles.ipfsFileMeta}>
                                        <span className={styles.ipfsFileCid} onClick={() => handleIpfsCopyCid(file.cid)} title={file.cid}>{truncateCid(file.cid)}</span>
                                        <span className={styles.ipfsFileSize}>{file.sizeFormatted}</span>
                                    </div>
                                </div>
                                <div className={styles.ipfsFileActions}>
                                    <button className={styles.ipfsSmallBtn} onClick={() => handleIpfsOpenFile(file)} title="Open in browser">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
                                    </button>
                                    <button className={styles.ipfsSmallBtn} onClick={() => handleIpfsCopyLink(file)} title="Copy gateway URL">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                                    </button>
                                    <button className={styles.ipfsSmallBtn + ' ' + styles.ipfsDeleteBtn} onClick={() => handleIpfsRemoveFile(file.cid)} title="Remove">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    // ===== RENDER: Wallet Panel Content =====
    const renderWalletContent = () => {
        // No wallet exists
        if (!hasWallet) {
            if (walletView === 'create') {
                return (
                    <div className={styles.walletForm}>
                        <h4 className={styles.walletSubtitle}>Create New Wallet</h4>
                        <input type="password" className={styles.walletInput} placeholder="Set password (min 6 chars)" value={walletPassword} onChange={(e) => setWalletPassword(e.target.value)} />
                        <button className={styles.walletBtnPrimary} onClick={handleCreateWallet} disabled={walletLoading}>{walletLoading ? 'Creating...' : 'Create Wallet'}</button>
                        <button className={styles.walletBtnSecondary} onClick={() => setWalletView('main')}>Back</button>
                    </div>
                );
            }
            if (walletView === 'import') {
                return (
                    <div className={styles.walletForm}>
                        <h4 className={styles.walletSubtitle}>Import Wallet</h4>
                        <textarea className={styles.walletTextarea} placeholder="Seed phrase or private key" value={walletImportInput} onChange={(e) => setWalletImportInput(e.target.value)} rows={3} />
                        <input type="password" className={styles.walletInput} placeholder="Set password (min 6 chars)" value={walletPassword} onChange={(e) => setWalletPassword(e.target.value)} />
                        <button className={styles.walletBtnPrimary} onClick={handleImportWallet} disabled={walletLoading}>{walletLoading ? 'Importing...' : 'Import Wallet'}</button>
                        <button className={styles.walletBtnSecondary} onClick={() => setWalletView('main')}>Back</button>
                    </div>
                );
            }
            return (
                <div className={styles.walletForm}>
                    <p className={styles.walletEmptyText}>No wallet found. Create or import one.</p>
                    <button className={styles.walletBtnPrimary} onClick={() => setWalletView('create')}>Create New Wallet</button>
                    <button className={styles.walletBtnSecondary} onClick={() => setWalletView('import')}>Import Wallet</button>
                </div>
            );
        }

        // Wallet locked
        if (walletLocked) {
            return (
                <div className={styles.walletForm}>
                    <div className={styles.walletLockIcon}>&#128274;</div>
                    <p className={styles.walletEmptyText}>Wallet is locked</p>
                    <input type="password" className={styles.walletInput} placeholder="Enter password" value={walletPassword} onChange={(e) => setWalletPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleUnlockWallet()} />
                    <button className={styles.walletBtnPrimary} onClick={handleUnlockWallet} disabled={walletLoading}>{walletLoading ? 'Unlocking...' : 'Unlock'}</button>
                </div>
            );
        }

        // Show mnemonic after creation
        if (walletView === 'showMnemonic') {
            return (
                <div className={styles.walletForm}>
                    <h4 className={styles.walletSubtitle}>&#9888; Save Your Seed Phrase!</h4>
                    <div className={styles.mnemonicBox}>{walletMnemonic}</div>
                    <p className={styles.walletWarning}>Write this down and store it safely. You will need it to recover your wallet. Never share it!</p>
                    <button className={styles.walletBtnPrimary} onClick={() => { setWalletView('main'); setWalletMnemonic(''); refreshWalletInfo(); }}>I've Saved It</button>
                </div>
            );
        }

        // Send view
        if (walletView === 'send') {
            return (
                <div className={styles.walletForm}>
                    <h4 className={styles.walletSubtitle}>Send</h4>
                    <select className={styles.walletInput} value={walletSendToken} onChange={(e) => setWalletSendToken(e.target.value)}>
                        <option value="PLS">PLS</option>
                        {walletTokens.map((t) => (<option key={t.address} value={t.address}>{t.symbol}</option>))}
                    </select>
                    <input type="text" className={styles.walletInput} placeholder="Recipient address (0x...)" value={walletSendTo} onChange={(e) => setWalletSendTo(e.target.value)} />
                    <input type="text" className={styles.walletInput} placeholder="Amount" value={walletSendAmount} onChange={(e) => setWalletSendAmount(e.target.value)} />
                    <button className={styles.walletBtnPrimary} onClick={handleSendPls} disabled={walletLoading}>{walletLoading ? 'Sending...' : 'Send'}</button>
                    <button className={styles.walletBtnSecondary} onClick={() => setWalletView('main')}>Cancel</button>
                </div>
            );
        }

        // Add token view
        if (walletView === 'addToken') {
            return (
                <div className={styles.walletForm}>
                    <h4 className={styles.walletSubtitle}>Add Token</h4>
                    <input type="text" className={styles.walletInput} placeholder="Token contract address (0x...)" value={walletNewTokenAddr} onChange={(e) => setWalletNewTokenAddr(e.target.value)} />
                    <button className={styles.walletBtnPrimary} onClick={handleAddToken} disabled={walletLoading}>{walletLoading ? 'Adding...' : 'Add Token'}</button>
                    <button className={styles.walletBtnSecondary} onClick={() => setWalletView('main')}>Cancel</button>
                </div>
            );
        }

        // Main wallet view (unlocked)
        return (
            <div className={styles.walletMain}>
                <div className={styles.walletAddrRow} onClick={copyAddress} title="Click to copy">
                    <span className={styles.walletAddrText}>{truncateAddr(walletAddress)}</span>
                    <span className={styles.walletCopyIcon}>&#128203;</span>
                </div>
                <div className={styles.walletBalanceBox}>
                    <span className={styles.walletBalanceAmount}>{plsBalance}</span>
                    <span className={styles.walletBalanceSymbol}>PLS</span>
                </div>
                <div className={styles.walletActions}>
                    <button className={styles.walletActionBtn} onClick={() => setWalletView('send')}>Send</button>
                    <button className={styles.walletActionBtn} onClick={() => refreshWalletInfo()}>Refresh</button>
                    <button className={styles.walletActionBtn} onClick={handleLockWallet}>Lock</button>
                </div>
                {walletTokens.length > 0 && (
                    <div className={styles.walletTokenList}>
                        <div className={styles.walletTokenHeader}>Tokens</div>
                        {walletTokens.map((t) => (
                            <div key={t.address} className={styles.walletTokenRow}>
                                <span className={styles.walletTokenSymbol}>{t.symbol}</span>
                                <span className={styles.walletTokenBal}>{walletTokenBalances[t.address] !== undefined ? parseFloat(walletTokenBalances[t.address]).toFixed(4) : '...'}</span>
                            </div>
                        ))}
                    </div>
                )}
                <button className={styles.walletBtnSecondary} onClick={() => setWalletView('addToken')}>+ Add Token</button>
            </div>
        );
    };

    // ===== RENDER: Node Panel Content =====
    const renderNodeContent = () => {
        return (
            <div className={styles.nodePanel}>
                <div className={styles.nodeTabBar}>
                    <button className={`${styles.nodeTabBtn} ${nodeView === 'status' ? styles.nodeTabActive : ''}`} onClick={() => setNodeView('status')}>Status</button>
                    <button className={`${styles.nodeTabBtn} ${nodeView === 'config' ? styles.nodeTabActive : ''}`} onClick={() => setNodeView('config')}>Config</button>
                    <button className={`${styles.nodeTabBtn} ${nodeView === 'logs' ? styles.nodeTabActive : ''}`} onClick={() => setNodeView('logs')}>Logs</button>
                </div>

                {nodeView === 'status' && (
                    <div className={styles.nodeStatusView}>
                        <div className={styles.nodeStatusRow}>
                            <span className={styles.nodeStatusDot} style={{ backgroundColor: nodeStatusColor() }} />
                            <span className={styles.nodeStatusText}>{nodeStatus.charAt(0).toUpperCase() + nodeStatus.slice(1)}</span>
                        </div>
                        <div className={styles.nodeInfoRow}>
                            <span className={styles.nodeInfoLabel}>Binary</span>
                            <span className={styles.nodeInfoValue} style={{ color: nodeBinaryFound ? '#4ade80' : '#f87171' }}>
                                {nodeBinaryFound ? '✓ Found' : '✗ Not Found'}
                            </span>
                        </div>
                        {nodeBinaryPath && (
                            <div className={styles.nodeInfoRow}>
                                <span className={styles.nodeInfoLabel}>Path</span>
                                <span className={styles.nodeInfoValue} style={{ fontSize: '10px', wordBreak: 'break-all', opacity: 0.7 }}>{nodeBinaryPath}</span>
                            </div>
                        )}

                        {/* Download progress bar */}
                        {nodeDownloading && (
                            <div style={{ margin: '8px 0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px', color: '#06b6d4' }}>
                                    <span>Downloading node binary...</span>
                                    <span>{nodeDownloadProgress}%</span>
                                </div>
                                <div style={{ width: '100%', height: '6px', backgroundColor: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: nodeDownloadProgress + '%', height: '100%', backgroundColor: '#06b6d4', borderRadius: '3px', transition: 'width 0.3s ease' }} />
                                </div>
                            </div>
                        )}

                        <div className={styles.nodeActions}>
                            {nodeStatus === 'running' ? (
                                <button className={styles.nodeBtnDanger} onClick={handleStopNode} disabled={nodeLoading}>
                                    {nodeLoading ? 'Stopping...' : '⏹ Stop Node'}
                                </button>
                            ) : (
                                <button className={styles.nodeBtnPrimary} onClick={handleStartNode} disabled={nodeLoading || nodeDownloading}>
                                    {nodeLoading ? 'Starting...' : '▶ Start Node'}
                                </button>
                            )}
                        </div>

                        {!nodeBinaryFound && !nodeDownloading && nodeStatus !== 'running' && (
                            <div style={{ marginTop: '8px', padding: '10px', backgroundColor: 'rgba(6,182,212,0.08)', borderRadius: '8px', border: '1px solid rgba(6,182,212,0.2)' }}>
                                <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 8px 0' }}>
                                    Node binary not found. Download it automatically from GitHub or click Start to auto-download.
                                </p>
                                <button
                                    className={styles.nodeBtnPrimary}
                                    onClick={handleDownloadNode}
                                    style={{ width: '100%', fontSize: '12px' }}
                                >
                                    ⬇ Download Node Binary
                                </button>
                            </div>
                        )}

                        {nodeBinaryFound && nodeStatus === 'stopped' && (
                            <p style={{ fontSize: '11px', color: '#4ade80', margin: '8px 0 0', textAlign: 'center' }}>
                                ✓ Node binary ready. Click Start to launch the mesh node.
                            </p>
                        )}
                    </div>
                )}

                {nodeView === 'config' && (
                    <div className={styles.nodeConfigView}>
                        <label className={styles.nodeConfigLabel}>Neighborhood Mode
                            <select className={styles.nodeConfigInput} value={nodeConfig.neighborhoodMode} onChange={(e) => setNodeConfig({ ...nodeConfig, neighborhoodMode: e.target.value })}>
                                <option value="standard">Standard</option>
                                <option value="zero-hop">Zero Hop</option>
                                <option value="originate-only">Originate Only</option>
                                <option value="consume-only">Consume Only</option>
                            </select>
                        </label>
                        <label className={styles.nodeConfigLabel}>Blockchain Service URL
                            <input type="text" className={styles.nodeConfigInput} value={nodeConfig.blockchainServiceUrl} onChange={(e) => setNodeConfig({ ...nodeConfig, blockchainServiceUrl: e.target.value })} />
                        </label>
                        <label className={styles.nodeConfigLabel}>Earning Wallet
                            <input type="text" className={styles.nodeConfigInput} placeholder="0x..." value={nodeConfig.earningWallet} onChange={(e) => setNodeConfig({ ...nodeConfig, earningWallet: e.target.value })} />
                        </label>
                        <label className={styles.nodeConfigLabel}>Gas Price (gwei)
                            <input type="text" className={styles.nodeConfigInput} value={nodeConfig.gasPrice} onChange={(e) => setNodeConfig({ ...nodeConfig, gasPrice: e.target.value })} />
                        </label>
                        <label className={styles.nodeConfigLabel}>DNS Servers
                            <input type="text" className={styles.nodeConfigInput} value={nodeConfig.dnsServers} onChange={(e) => setNodeConfig({ ...nodeConfig, dnsServers: e.target.value })} />
                        </label>
                        <label className={styles.nodeConfigLabel}>Log Level
                            <select className={styles.nodeConfigInput} value={nodeConfig.logLevel} onChange={(e) => setNodeConfig({ ...nodeConfig, logLevel: e.target.value })}>
                                <option value="error">Error</option>
                                <option value="warn">Warn</option>
                                <option value="info">Info</option>
                                <option value="debug">Debug</option>
                                <option value="trace">Trace</option>
                            </select>
                        </label>
                        <button className={styles.nodeBtnPrimary} onClick={handleSaveNodeConfig}>Save Configuration</button>
                    </div>
                )}

                {nodeView === 'logs' && (
                    <div className={styles.nodeLogsView}>
                        <div className={styles.nodeLogsHeader}>
                            <span>Live Logs ({nodeLogs.length})</span>
                            <button className={styles.smallBtn} onClick={handleClearNodeLogs}>Clear</button>
                        </div>
                        <div className={styles.nodeLogsScroll}>
                            {nodeLogs.length === 0 ? (
                                <div className={styles.nodeLogsEmpty}>No logs yet. Start the node to see output.</div>
                            ) : (
                                nodeLogs.map((entry, i) => (
                                    <div key={i} className={`${styles.nodeLogLine} ${entry.level === 'error' ? styles.nodeLogError : entry.level === 'warn' ? styles.nodeLogWarn : ''}`}>
                                        <span className={styles.nodeLogTime}>{entry.timestamp ? entry.timestamp.substring(11, 19) : ''}</span>
                                        <span className={styles.nodeLogMsg}>{entry.message}</span>
                                    </div>
                                ))
                            )}
                            <div ref={nodeLogEndRef} />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // ===== RENDER: Token Panel Content =====
    const renderTokenContent = () => {
        if (tokenView === 'send') {
            return (
                <div className={styles.tokenSendView}>
                    <button className={styles.tokenBackBtn} onClick={() => setTokenView('main')}>← Back</button>
                    <h4 className={styles.tokenSubTitle}>Send Tokens</h4>
                    <div className={styles.tokenFormGroup}>
                        <label>Recipient Address</label>
                        <input
                            type="text"
                            className={styles.tokenInput}
                            placeholder="0x..."
                            value={tokenSendTo}
                            onChange={(e) => setTokenSendTo(e.target.value)}
                        />
                    </div>
                    <div className={styles.tokenFormGroup}>
                        <label>Amount ({tokenBalance.symbol || 'CLOAK'})</label>
                        <input
                            type="text"
                            className={styles.tokenInput}
                            placeholder="0.0"
                            value={tokenSendAmount}
                            onChange={(e) => setTokenSendAmount(e.target.value)}
                        />
                    </div>
                    <button className={styles.tokenEstimateBtn} onClick={handleEstimateGas}>Estimate Gas</button>
                    {tokenGasEstimate && <div className={styles.tokenGasDisplay}>Gas: {tokenGasEstimate}</div>}
                    <button
                        className={styles.tokenSendBtn}
                        onClick={handleSendTokens}
                        disabled={tokenLoading}
                    >{tokenLoading ? 'Sending...' : 'Send Tokens'}</button>
                </div>
            );
        }
        if (tokenView === 'history') {
            return (
                <div className={styles.tokenHistoryView}>
                    <button className={styles.tokenBackBtn} onClick={() => setTokenView('main')}>← Back</button>
                    <h4 className={styles.tokenSubTitle}>Payment History</h4>
                    <div className={styles.tokenHistoryList}>
                        {tokenPaymentHistory.length === 0 && <div className={styles.tokenEmpty}>No payment history yet</div>}
                        {tokenPaymentHistory.map((p, i) => (
                            <div key={i} className={styles.tokenHistoryItem}>
                                <div className={styles.tokenHistoryRow}>
                                    <span className={`${styles.tokenHistoryType} ${p.type === 'send' ? styles.tokenTypeSend : styles.tokenTypeApprove}`}>
                                        {p.type === 'send' ? '↑ SEND' : '✓ APPROVE'}
                                    </span>
                                    <span className={styles.tokenHistoryAmount}>{p.amount} {p.symbol}</span>
                                </div>
                                <div className={styles.tokenHistoryRow}>
                                    <span className={styles.tokenHistoryAddr}>{truncateTokenAddr(p.to || p.spender)}</span>
                                    <span className={`${styles.tokenHistoryStatus} ${styles['tokenStatus' + (p.status || 'pending')]}`}>{p.status || 'pending'}</span>
                                </div>
                                <div className={styles.tokenHistoryTime}>{formatTokenTime(p.timestamp)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        if (tokenView === 'settings') {
            return (
                <div className={styles.tokenSettingsView}>
                    <button className={styles.tokenBackBtn} onClick={() => setTokenView('main')}>← Back</button>
                    <h4 className={styles.tokenSubTitle}>Token Settings</h4>
                    <div className={styles.tokenFormGroup}>
                        <label>Token Contract Address</label>
                        <input
                            type="text"
                            className={styles.tokenInput}
                            placeholder="0x..."
                            value={tokenAddressInput}
                            onChange={(e) => setTokenAddressInput(e.target.value)}
                        />
                        <button className={styles.tokenSmallBtn} onClick={handleSetTokenAddress}>Update Address</button>
                    </div>
                    <div className={styles.tokenFormGroup}>
                        <label>Payment Rate (tokens per MB)</label>
                        <input
                            type="text"
                            className={styles.tokenInput}
                            placeholder="0.1"
                            value={tokenPaymentRate}
                            onChange={(e) => setTokenPaymentRate(e.target.value)}
                        />
                        <button className={styles.tokenSmallBtn} onClick={handleSetPaymentRate}>Set Rate</button>
                    </div>
                    <div className={styles.tokenAutoPaySection}>
                        <div className={styles.tokenAutoPayRow}>
                            <span>Auto-Pay for Bandwidth</span>
                            <button
                                className={`${styles.tokenToggle} ${tokenAutoPayEnabled ? styles.tokenToggleOn : ''}`}
                                onClick={handleToggleAutoPay}
                                disabled={tokenLoading}
                            >
                                <span className={styles.tokenToggleSlider}></span>
                            </button>
                        </div>
                        <div className={styles.tokenAutoPayInfo}>
                            {tokenAutoPayEnabled ? 'Active — paying ' + tokenPaymentRate + ' tokens/MB' : 'Disabled'}
                        </div>
                    </div>
                </div>
            );
        }
        // Main view
        return (
            <div className={styles.tokenMainView}>
                <div className={styles.tokenBalanceCard}>
                    <div className={styles.tokenBalanceLabel}>Token Balance</div>
                    <div className={styles.tokenBalanceValue}>{parseFloat(tokenBalance.formatted || 0).toFixed(4)}</div>
                    <div className={styles.tokenBalanceSymbol}>{tokenBalance.symbol || 'CLOAK'}</div>
                    {!tokenInfo.configured && <div className={styles.tokenNotConfigured}>Token not configured</div>}
                </div>
                <div className={styles.tokenActions}>
                    <button className={styles.tokenActionBtn} onClick={() => { setTokenView('send'); handleEstimateGas(); }}>💸 Send</button>
                    <button className={styles.tokenActionBtn} onClick={() => { setTokenView('history'); refreshTokenHistory(); }}>📋 History</button>
                    <button className={styles.tokenActionBtn} onClick={() => setTokenView('settings')}>⚙️ Settings</button>
                </div>
                <div className={styles.tokenInfoRow}>
                    <span className={styles.tokenInfoLabel}>Token:</span>
                    <span className={styles.tokenInfoValue}>{tokenInfo.name || 'PulseCloak Token'}</span>
                </div>
                <div className={styles.tokenInfoRow}>
                    <span className={styles.tokenInfoLabel}>Contract:</span>
                    <span className={styles.tokenInfoValue} title={tokenInfo.address}>{truncateTokenAddr(tokenInfo.address)}</span>
                </div>
                <div className={styles.tokenInfoRow}>
                    <span className={styles.tokenInfoLabel}>Auto-Pay:</span>
                    <span className={`${styles.tokenInfoValue} ${tokenAutoPayEnabled ? styles.tokenAutoPayActive : ''}`}>
                        {tokenAutoPayEnabled ? 'Active (' + tokenPaymentRate + ' tokens/MB)' : 'Disabled'}
                    </span>
                </div>
            </div>
        );
    };

    // ===== RENDER: Bandwidth Panel Content =====
    const renderBandwidthContent = () => {
        const stats = bwStats || { sharing: false, session: { uploadedFormatted: '0 B', downloadedFormatted: '0 B', netFormatted: '0 B', durationFormatted: '0s' }, allTime: { uploadedFormatted: '0 B', downloadedFormatted: '0 B', netFormatted: '0 B', totalSessions: 0 }, speeds: { uploadFormatted: '0 B/s', downloadFormatted: '0 B/s' }, isContributor: false };
        const maxBw = Math.max(...bwHistory.map(d => Math.max(d.uploaded || 0, d.downloaded || 0)), 1);

        return (
            <div className={styles.bwMainView}>
                {/* Sharing Toggle */}
                <div className={styles.bwSharingCard}>
                    <div className={styles.bwSharingRow}>
                        <div>
                            <div className={styles.bwSharingLabel}>Bandwidth Sharing</div>
                            <div className={styles.bwSharingStatus}>{bwSharingEnabled ? 'Active' : 'Inactive'}</div>
                        </div>
                        <button
                            className={`${styles.bwToggle} ${bwSharingEnabled ? styles.bwToggleOn : ''}`}
                            onClick={handleToggleSharing}
                            disabled={bwLoading}
                        >
                            <span className={styles.bwToggleSlider}></span>
                        </button>
                    </div>
                    {bwSharingEnabled && (
                        <div className={styles.bwSessionTimer}>Session: {stats.session.durationFormatted}</div>
                    )}
                </div>

                {/* Speed Meters */}
                {bwSharingEnabled && (
                    <div className={styles.bwSpeedRow}>
                        <div className={styles.bwSpeedCard}>
                            <div className={styles.bwSpeedLabel}>↑ Upload</div>
                            <div className={styles.bwSpeedValue}>{stats.speeds.uploadFormatted}</div>
                        </div>
                        <div className={styles.bwSpeedCard}>
                            <div className={styles.bwSpeedLabel}>↓ Download</div>
                            <div className={styles.bwSpeedValue}>{stats.speeds.downloadFormatted}</div>
                        </div>
                    </div>
                )}

                {/* Bandwidth Bars */}
                <div className={styles.bwStatsCard}>
                    <div className={styles.bwStatsTitle}>Total Bandwidth</div>
                    <div className={styles.bwBarGroup}>
                        <div className={styles.bwBarLabel}>
                            <span>↑ Shared</span>
                            <span>{stats.allTime.uploadedFormatted}</span>
                        </div>
                        <div className={styles.bwBarTrack}>
                            <div className={styles.bwBarFillUp} style={{ width: stats.allTime.totalBytesUploaded > 0 ? Math.min(100, (stats.allTime.totalBytesUploaded / (stats.allTime.totalBytesUploaded + stats.allTime.totalBytesDownloaded + 1)) * 100) + '%' : '0%' }}></div>
                        </div>
                    </div>
                    <div className={styles.bwBarGroup}>
                        <div className={styles.bwBarLabel}>
                            <span>↓ Consumed</span>
                            <span>{stats.allTime.downloadedFormatted}</span>
                        </div>
                        <div className={styles.bwBarTrack}>
                            <div className={styles.bwBarFillDown} style={{ width: stats.allTime.totalBytesDownloaded > 0 ? Math.min(100, (stats.allTime.totalBytesDownloaded / (stats.allTime.totalBytesUploaded + stats.allTime.totalBytesDownloaded + 1)) * 100) + '%' : '0%' }}></div>
                        </div>
                    </div>
                    <div className={`${styles.bwNetContribution} ${stats.isContributor ? styles.bwNetPositive : styles.bwNetNegative}`}>
                        Net: {stats.allTime.netFormatted} {stats.isContributor ? '(Contributor ✓)' : '(Consumer)'}
                    </div>
                </div>

                {/* Rewards */}
                <div className={styles.bwRewardsCard}>
                    <div className={styles.bwRewardsTitle}>Rewards</div>
                    <div className={styles.bwRewardsRow}>
                        <div className={styles.bwRewardItem}>
                            <div className={styles.bwRewardValue}>{bwRewards.pending.toFixed(4)}</div>
                            <div className={styles.bwRewardLabel}>Pending</div>
                        </div>
                        <div className={styles.bwRewardItem}>
                            <div className={styles.bwRewardValue}>{bwRewards.claimed.toFixed(4)}</div>
                            <div className={styles.bwRewardLabel}>Claimed</div>
                        </div>
                        <div className={styles.bwRewardItem}>
                            <div className={styles.bwRewardValue}>{bwRewards.totalEarned.toFixed(4)}</div>
                            <div className={styles.bwRewardLabel}>Total</div>
                        </div>
                    </div>
                    <div className={styles.bwRewardRate}>Rate: {bwRewards.rateFormatted || bwRewards.rate + ' tokens/MB'}</div>
                    <button
                        className={styles.bwClaimBtn}
                        onClick={handleClaimRewards}
                        disabled={bwLoading || bwRewards.pending <= 0}
                    >{bwLoading ? 'Claiming...' : 'Claim Rewards'}</button>
                </div>

                {/* Daily Chart */}
                {bwHistory.length > 0 && (
                    <div className={styles.bwChartCard}>
                        <div className={styles.bwChartTitle}>Last 7 Days</div>
                        <div className={styles.bwChart}>
                            {bwHistory.map((day, i) => (
                                <div key={i} className={styles.bwChartDay}>
                                    <div className={styles.bwChartBars}>
                                        <div className={styles.bwChartBarUp} style={{ height: Math.max(2, (day.uploaded / maxBw) * 60) + 'px' }} title={'↑ ' + day.uploadedFormatted}></div>
                                        <div className={styles.bwChartBarDown} style={{ height: Math.max(2, (day.downloaded / maxBw) * 60) + 'px' }} title={'↓ ' + day.downloadedFormatted}></div>
                                    </div>
                                    <div className={styles.bwChartLabel}>{day.dayName}</div>
                                </div>
                            ))}
                        </div>
                        <div className={styles.bwChartLegend}>
                            <span className={styles.bwLegendUp}>↑ Upload</span>
                            <span className={styles.bwLegendDown}>↓ Download</span>
                        </div>
                    </div>
                )}

                {/* Session Info */}
                <div className={styles.bwInfoRow}>
                    <span>Total Sessions:</span>
                    <span>{stats.allTime.totalSessions}</span>
                </div>
                <div className={styles.bwInfoRow}>
                    <span>Total Time:</span>
                    <span>{stats.allTime.totalSessionTimeFormatted}</span>
                </div>
            </div>
        );
    };

    return (
        <div className={styles.app}>
            {/* Title Bar */}
            <TitleBar />
            <WindowControls />

            {/* Tab Bar */}
            <div className={styles.tabBar}>
                <div className={styles.tabList}>
                    {tabs.map((id) => (
                        <div
                            key={id}
                            className={`${styles.tab} ${id === selectedTab ? styles.tabActive : ''}`}
                            onClick={() => handleSelectTab(id)}
                        >
                            {tabFavicons[id] && (
                                <img
                                    src={tabFavicons[id]}
                                    className={styles.tabFavicon}
                                    alt=""
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            )}
                            <span className={styles.tabTitle}>{getTabDisplayName(id)}</span>
                            <button
                                className={styles.tabCloseBtn}
                                onClick={(e) => handleCloseTab(e, id)}
                                title="Close tab"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
                <button className={styles.newTabBtn} onClick={handleNewTab} title="New Tab">
                    +
                </button>
            </div>

            {/* Navigation Bar */}
            <div className={styles.navbar}>
                <div className={styles.navButtons}>
                    <button className={styles.navBtn} onClick={handleRefresh} title="Refresh">
                        {isLoading ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                        )}
                    </button>
                    <button className={`${styles.navBtn} ${showWelcome ? styles.homeBtnActive : ""}`} onClick={handleHome} title="Home">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                    </button>
                </div>

                {/* URL Bar */}
                <form className={styles.urlForm} onSubmit={handleUrlSubmit}>
                    <div className={`${styles.urlBarContainer} ${meshEnabled ? styles.urlBarMeshActive : ""}`}>
                        {currentUrl.startsWith('https://') && (
                            <svg className={styles.lockIcon} width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                        )}
                        <input
                            type="text"
                            className={styles.urlInput}
                            value={inputUrl}
                            onChange={(e) => setInputUrl(e.target.value)}
                            placeholder="Search with DuckDuckGo or enter URL..."
                            onFocus={(e) => e.target.select()}
                        />
                        {isLoading && <div className={styles.loadingIndicator} />}
                    </div>
                </form>

                {/* Privacy Tools */}
                <div className={styles.privacyTools}>
                    {/* Spaces Button */}
                    <div className={styles.spacesContainer} ref={spacesRef}>
                        <button
                            className={styles.navBtn + ' ' + styles.spacesBtn}
                            onClick={toggleSpaces}
                            title="dApp Spaces"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>
                        </button>
                        {showSpaces && (
                            <div className={styles.dropdown + ' ' + styles.spacesDropdown}>
                                <div className={styles.dropdownHeader + ' ' + styles.spacesHeader}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#14b8a6"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>
                                    <span>dApp Spaces</span>
                                </div>
                                <div className={styles.dropdownBody}>
                                    {renderSpacesContent()}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mesh Network Button */}
                    <div className={styles.meshContainer} ref={meshRef}>
                        <button
                            className={`${styles.navBtn} ${styles.meshBtn} ${meshEnabled ? styles.meshBtnActive : ''}`}
                            onClick={toggleMeshPanel}
                            title={meshEnabled ? 'Mesh Network Active' : 'Mesh Network (Direct)'}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                            <span className={styles.meshStatusIndicator} style={{ backgroundColor: meshStatusColor() }} />
                        </button>
                        {showMeshPanel && (
                            <div className={styles.dropdown + ' ' + styles.meshDropdown}>
                                <div className={styles.dropdownHeader + ' ' + styles.meshHeader}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#4ade80"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                                    <span>Mesh Network</span>
                                </div>
                                <div className={styles.dropdownBody}>
                                    {renderMeshContent()}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Chat Button */}
                    <div className={styles.chatContainer} ref={chatRef}>
                        <button
                            className={`${styles.navBtn} ${styles.chatBtn}`}
                            onClick={toggleChat}
                            title="Wallet-to-Wallet Chat"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
                            {chatUnread > 0 && <span className={styles.chatUnreadBadgeNav}>{chatUnread > 9 ? '9+' : chatUnread}</span>}
                        </button>
                        {showChat && (
                            <div className={styles.dropdown + ' ' + styles.chatDropdown}>
                                <div className={styles.dropdownHeader + ' ' + styles.chatHeader}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#14b8a6"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
                                    <span>Chat</span>
                                </div>
                                <div className={styles.dropdownBody}>
                                    {renderChatContent()}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* IPFS Button */}
                    <div className={styles.ipfsContainer} ref={ipfsRef}>
                        <button
                            className={`${styles.navBtn} ${styles.ipfsBtn}`}
                            onClick={toggleIpfs}
                            title="IPFS File Sharing"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>
                        </button>
                        {showIpfs && (
                            <div className={styles.dropdown + ' ' + styles.ipfsDropdown}>
                                <div className={styles.dropdownHeader + ' ' + styles.ipfsHeader}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#14b8a6"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>
                                    <span>IPFS Files</span>
                                </div>
                                <div className={styles.dropdownBody}>
                                    {ipfsMsg && <div className={styles.ipfsMsgBar + ' ' + styles['ipfsMsg' + ipfsMsgType.charAt(0).toUpperCase() + ipfsMsgType.slice(1)]}>{ipfsMsg}</div>}
                                    {renderIpfsContent()}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Token Payment Button */}
                    <div className={styles.tokenContainer} ref={tokenRef}>
                        <button
                            className={`${styles.navBtn} ${styles.tokenBtn}`}
                            onClick={toggleToken}
                            title="Token Payments"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.94s4.18 1.36 4.18 3.85c0 1.89-1.44 2.98-3.12 3.19z"/></svg>
                        </button>
                        {showToken && (
                            <div className={styles.dropdown + ' ' + styles.tokenDropdown}>
                                <div className={styles.dropdownHeader + ' ' + styles.tokenHeader}>
                                    <span>💰 Token Payments</span>
                                </div>
                                <div className={styles.dropdownBody}>
                                    {tokenMsg && <div className={`${styles.tokenNotice} ${styles['tokenNotice' + tokenMsgType.charAt(0).toUpperCase() + tokenMsgType.slice(1)]}`}>{tokenMsg}</div>}
                                    {renderTokenContent()}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bandwidth Sharing Button */}
                    <div className={styles.bandwidthContainer} ref={bandwidthRef}>
                        <button
                            className={`${styles.navBtn} ${styles.bandwidthBtn} ${bwSharingEnabled ? styles.bandwidthBtnActive : ''}`}
                            onClick={toggleBandwidth}
                            title="Bandwidth Sharing"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>
                            {bwSharingEnabled && <span className={styles.bandwidthActiveDot} />}
                        </button>
                        {showBandwidth && (
                            <div className={styles.dropdown + ' ' + styles.bandwidthDropdown}>
                                <div className={styles.dropdownHeader + ' ' + styles.bandwidthHeader}>
                                    <span>📡 Bandwidth Sharing</span>
                                </div>
                                <div className={styles.dropdownBody}>
                                    {bwMsg && <div className={`${styles.bwNotice} ${styles['bwNotice' + bwMsgType.charAt(0).toUpperCase() + bwMsgType.slice(1)]}`}>{bwMsg}</div>}
                                    {renderBandwidthContent()}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Wallet Button */}
                    <div className={styles.walletContainer} ref={walletRef}>
                        <button
                            className={styles.navBtn + ' ' + styles.walletBtn}
                            onClick={toggleWallet}
                            title="PulseChain Wallet"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
                            {!walletLocked && walletAddress && (
                                <span className={styles.walletActiveDot} />
                            )}
                        </button>
                        {showWallet && (
                            <div className={styles.dropdown + ' ' + styles.walletDropdown}>
                                <div className={styles.dropdownHeader + ' ' + styles.walletHeader}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#a855f7"><path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
                                    <span>PulseChain Wallet</span>
                                </div>
                                {walletMsg && (
                                    <div className={`${styles.walletMsgBar} ${walletMsgType === 'error' ? styles.walletMsgError : walletMsgType === 'success' ? styles.walletMsgSuccess : ''}`}>{walletMsg}</div>
                                )}
                                <div className={styles.dropdownBody}>
                                    {renderWalletContent()}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Node Control Button */}
                    <div className={styles.nodeContainer} ref={nodeRef}>
                        <button
                            className={styles.navBtn + ' ' + styles.nodeBtn}
                            onClick={toggleNodePanel}
                            title="Node Control Panel"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
                            <span className={styles.nodeStatusIndicator} style={{ backgroundColor: nodeStatusColor() }} />
                        </button>
                        {showNodePanel && (
                            <div className={styles.dropdown + ' ' + styles.nodeDropdown}>
                                <div className={styles.dropdownHeader + ' ' + styles.nodeHeader}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#06b6d4"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
                                    <span>Node Control Panel</span>
                                </div>
                                <div className={styles.dropdownBody}>
                                    {renderNodeContent()}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Shield / Adblock Button */}
                    <div className={styles.shieldContainer} ref={adblockInfoRef}>
                        <button
                            className={styles.navBtn + ' ' + styles.shieldBtn}
                            onClick={() => setShowAdblockInfo(!showAdblockInfo)}
                            title={blockedCount + ' ads/trackers blocked'}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
                            {blockedCount > 0 && (
                                <span className={styles.shieldBadge}>{blockedCount > 999 ? '999+' : blockedCount}</span>
                            )}
                        </button>
                        {showAdblockInfo && (
                            <div className={styles.dropdown}>
                                <div className={styles.dropdownHeader}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#4ade80"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
                                    <span>Ad & Tracker Shield</span>
                                </div>
                                <div className={styles.dropdownBody}>
                                    <div className={styles.statRow}>
                                        <span className={styles.statLabel}>Blocked</span>
                                        <span className={styles.statValue}>{blockedCount}</span>
                                    </div>
                                    <div className={styles.statRow}>
                                        <span className={styles.statLabel}>Status</span>
                                        <span className={styles.statActive}>Active</span>
                                    </div>
                                    <p className={styles.dropdownNote}>Blocking ads, trackers, and fingerprinting scripts to protect your privacy.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* History Button */}
                    <div className={styles.historyContainer} ref={historyRef}>
                        <button
                            className={styles.navBtn + ' ' + styles.historyBtn}
                            onClick={toggleHistory}
                            title="History"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
                        </button>
                        {showHistory && (
                            <div className={styles.dropdown + ' ' + styles.historyDropdown}>
                                <div className={styles.dropdownHeader}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#00d4ff"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
                                    <span>History</span>
                                    <div className={styles.headerActions}>
                                        <button className={styles.smallBtn} onClick={() => setShowSettings(!showSettings)} title="Settings">&#9881;</button>
                                        <button className={styles.smallBtn + ' ' + styles.dangerBtn} onClick={handleClearHistory} title="Clear all history">&#128465;</button>
                                    </div>
                                </div>
                                {showSettings && (
                                    <div className={styles.settingsPanel}>
                                        <label className={styles.settingsLabel}>
                                            Max history entries:
                                            <div className={styles.settingsInputRow}>
                                                <input type="number" min="1" max="1000" className={styles.settingsInput} value={limitInput} onChange={(e) => setLimitInput(e.target.value)} />
                                                <button className={styles.saveBtn} onClick={handleSaveLimit}>Save</button>
                                            </div>
                                        </label>
                                        <p className={styles.settingsNote}>Currently keeping {historyLimit} entries. Older entries are auto-deleted.</p>
                                    </div>
                                )}
                                <div className={styles.historyList}>
                                    {historyEntries.length === 0 ? (
                                        <div className={styles.emptyHistory}>No history yet</div>
                                    ) : (
                                        historyEntries.map((entry, index) => (
                                            <div key={index} className={styles.historyEntry} onClick={() => handleHistoryClick(entry.url)}>
                                                <div className={styles.historyEntryIcon}>
                                                    {entry.favicon ? (
                                                        <img src={entry.favicon} width="14" height="14" alt="" onError={(e) => { e.target.style.display = 'none'; }} />
                                                    ) : (
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#606070"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                                                    )}
                                                </div>
                                                <div className={styles.historyEntryContent}>
                                                    <div className={styles.historyEntryTitle}>{entry.title || entry.url}</div>
                                                    <div className={styles.historyEntryUrl}>{entry.url.length > 50 ? entry.url.substring(0, 50) + '...' : entry.url}</div>
                                                </div>
                                                <div className={styles.historyEntryMeta}>
                                                    <span className={styles.historyTime}>{formatTimestamp(entry.timestamp)}</span>
                                                    <button className={styles.deleteEntryBtn} onClick={(e) => handleDeleteHistoryEntry(index, e)} title="Delete entry">&times;</button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className={styles.contentArea}>
                {(showWelcome || !hasActivePage) && <Main onNavigate={handleQuickLink} />}
            </div>
        </div>
    );
};

export default App;
