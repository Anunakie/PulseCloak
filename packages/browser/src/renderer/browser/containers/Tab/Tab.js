import React, { useRef, useEffect } from 'react';
import styles from './tab.module.css';

/**
 * Tab is an invisible placeholder div matched to the BrowserView in the main
 * process. The actual web page content is rendered by the BrowserView (outside
 * React). We only use this component to notify the main process where the
 * BrowserView should be positioned and resized.
 */
function Tab({ id, selected }) {
    const ref = useRef(null);

    useEffect(() => {
        if (!selected || !ref.current) return;

        const notifySize = () => {
            const el = ref.current;
            if (!el || !id) return;
            const rect = el.getBoundingClientRect();
            const x = Math.round(rect.left);
            const y = Math.round(rect.top);
            const width = Math.round(rect.width);
            const height = Math.round(rect.height);
            if (width > 0 && height > 0) {
                window.electronApi?.onTabSizeChanged?.({
                    id,
                    x,
                    y,
                    width,
                    height,
                });
            }
        };

        notifySize();

        const ro = new ResizeObserver(() => notifySize());
        ro.observe(ref.current);
        window.addEventListener('resize', notifySize);

        return () => {
            ro.disconnect();
            window.removeEventListener('resize', notifySize);
        };
    }, [id, selected]);

    return (
        <div
            ref={ref}
            className={selected ? styles.webviewSelected : styles.webview}
            data-tab-id={id}
        />
    );
}

export default Tab;
