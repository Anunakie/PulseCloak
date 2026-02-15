import React, { useState } from 'react';
import styles from './main.module.css';

const Main = ({ onNavigate }) => {
    const [searchInput, setSearchInput] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchInput.trim()) return;

        let url = searchInput.trim();
        if (!url.includes('.') && !url.startsWith('http')) {
            url = 'https://duckduckgo.com/?q=' + encodeURIComponent(url);
        } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        if (onNavigate) {
            onNavigate(url);
        }
    };

    const handleQuickLink = (url) => {
        if (onNavigate) {
            onNavigate(url);
        }
    };

    return (
        <div className={styles.welcomeContainer}>
            <div className={styles.welcomeContent}>
                {/* Logo & Branding */}
                <div className={styles.branding}>
                    <div className={styles.logoIcon}>
                        <svg width="72" height="72" viewBox="0 0 100 100" fill="none">
                            <circle cx="50" cy="50" r="45" stroke="url(#grad1)" strokeWidth="3" fill="none" />
                            <circle cx="50" cy="50" r="30" stroke="url(#grad2)" strokeWidth="2" fill="none" opacity="0.6" />
                            <circle cx="50" cy="50" r="15" fill="url(#grad3)" opacity="0.8" />
                            <circle cx="50" cy="25" r="4" fill="#00d4ff" />
                            <circle cx="71" cy="62" r="4" fill="#a855f7" />
                            <circle cx="29" cy="62" r="4" fill="#06b6d4" />
                            <line x1="50" y1="25" x2="71" y2="62" stroke="rgba(0,212,255,0.3)" strokeWidth="1" />
                            <line x1="71" y1="62" x2="29" y2="62" stroke="rgba(168,85,247,0.3)" strokeWidth="1" />
                            <line x1="29" y1="62" x2="50" y2="25" stroke="rgba(6,182,212,0.3)" strokeWidth="1" />
                            <defs>
                                <linearGradient id="grad1" x1="0" y1="0" x2="100" y2="100">
                                    <stop offset="0%" stopColor="#00d4ff" />
                                    <stop offset="100%" stopColor="#a855f7" />
                                </linearGradient>
                                <linearGradient id="grad2" x1="100" y1="0" x2="0" y2="100">
                                    <stop offset="0%" stopColor="#06b6d4" />
                                    <stop offset="100%" stopColor="#8b5cf6" />
                                </linearGradient>
                                <radialGradient id="grad3" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.6" />
                                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.2" />
                                </radialGradient>
                            </defs>
                        </svg>
                    </div>
                    <h1 className={styles.title}>PulseChainCloak Browser</h1>
                    <p className={styles.subtitle}>Decentralized Web3 Browsing</p>
                </div>

                {/* Search Bar */}
                <form className={styles.searchForm} onSubmit={handleSearch}>
                    <div className={styles.searchContainer}>
                        <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                        </svg>
                        <input
                            type="text"
                            className={styles.searchInput}
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search the web or enter a URL..."
                            autoFocus
                        />
                    </div>
                </form>

                {/* Quick Links */}
                <div className={styles.quickLinks}>
                    <h3 className={styles.sectionTitle}>Quick Links</h3>
                    <div className={styles.linkGrid}>
                        <button className={styles.quickLink} onClick={() => handleQuickLink('https://pulsechain.com')}>
                            <div className={styles.linkIconWrap} style={{ background: 'rgba(168, 85, 247, 0.15)' }}>
                                <span role="img" aria-label="PulseChain">💜</span>
                            </div>
                            <span className={styles.linkLabel}>PulseChain</span>
                        </button>
                        <button className={styles.quickLink} onClick={() => handleQuickLink('https://pulsex.com')}>
                            <div className={styles.linkIconWrap} style={{ background: 'rgba(0, 212, 255, 0.15)' }}>
                                <span role="img" aria-label="PulseX">🔄</span>
                            </div>
                            <span className={styles.linkLabel}>PulseX</span>
                        </button>
                        <button className={styles.quickLink} onClick={() => handleQuickLink('https://hex.com')}>
                            <div className={styles.linkIconWrap} style={{ background: 'rgba(0, 212, 255, 0.15)' }}>
                                <span role="img" aria-label="HEX">💎</span>
                            </div>
                            <span className={styles.linkLabel}>HEX</span>
                        </button>
                        <button className={styles.quickLink} onClick={() => handleQuickLink('https://app.pulsex.com')}>
                            <div className={styles.linkIconWrap} style={{ background: 'rgba(168, 85, 247, 0.15)' }}>
                                <span role="img" aria-label="PulseX DEX">📊</span>
                            </div>
                            <span className={styles.linkLabel}>PulseX DEX</span>
                        </button>
                        <button className={styles.quickLink} onClick={() => handleQuickLink('https://beacon.pulsechain.com')}>
                            <div className={styles.linkIconWrap} style={{ background: 'rgba(6, 182, 212, 0.15)' }}>
                                <span role="img" aria-label="Explorer">🔍</span>
                            </div>
                            <span className={styles.linkLabel}>Explorer</span>
                        </button>
                        <button className={styles.quickLink} onClick={() => handleQuickLink('https://duckduckgo.com')}>
                            <div className={styles.linkIconWrap} style={{ background: 'rgba(255, 165, 0, 0.15)' }}>
                                <span role="img" aria-label="Search">🦆</span>
                            </div>
                            <span className={styles.linkLabel}>DuckDuckGo</span>
                        </button>
                    </div>
                </div>

                {/* Features */}
                <div className={styles.features}>
                    <div className={styles.feature}>
                        <span className={styles.featureIcon}>🛡️</span>
                        <span>Privacy First</span>
                    </div>
                    <div className={styles.feature}>
                        <span className={styles.featureIcon}>🌐</span>
                        <span>Mesh Network</span>
                    </div>
                    <div className={styles.feature}>
                        <span className={styles.featureIcon}>💰</span>
                        <span>Web3 Ready</span>
                    </div>
                    <div className={styles.feature}>
                        <span className={styles.featureIcon}>⚡</span>
                        <span>Lightning Fast</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Main;
