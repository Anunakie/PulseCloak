import React from 'react';
import styles from './titlebar.module.css';

const TitleBar = () => {
    return (
        <div className={styles.titlebar}>
            <div className={styles.logo}>
                <span className={styles.logoIcon}>🌐</span>
                <span className={styles.logoText}>PulseChainCloak</span>
            </div>
        </div>
    );
};

export default TitleBar;
