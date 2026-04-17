import React from 'react';

// Curated MASQ-style icon set as inline SVGs.
// Single-source-of-truth for every nav + action button in the browser chrome.
// All icons use currentColor so CSS can re-tint them per-state.

const mk = (viewBox, path) => ({ color = 'currentColor', size = 16, ...rest }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox={viewBox}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...rest}
    >
        {path}
    </svg>
);

export const HomeIcon = mk('0 0 24 24', <>
    <path d="M3 12L12 3l9 9" />
    <path d="M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" />
</>);

export const BackIcon = mk('0 0 24 24', <>
    <path d="M15 18l-6-6 6-6" />
</>);

export const ForwardIcon = mk('0 0 24 24', <>
    <path d="M9 18l6-6-6-6" />
</>);

export const ReloadIcon = mk('0 0 24 24', <>
    <path d="M23 4v6h-6" />
    <path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10" />
    <path d="M20.49 15a9 9 0 01-14.85 3.36L1 14" />
</>);

export const StopIcon = mk('0 0 24 24', <>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
</>);

export const LockIcon = mk('0 0 24 24', <>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
</>);

export const StarIcon = mk('0 0 24 24', <>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
</>);

export const PowerIcon = mk('0 0 24 24', <>
    <path d="M18.36 6.64a9 9 0 11-12.73 0" />
    <line x1="12" y1="2" x2="12" y2="12" />
</>);

export const DownloadIcon = mk('0 0 24 24', <>
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
</>);

export const UploadIcon = mk('0 0 24 24', <>
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
</>);

export const WalletIcon = mk('0 0 24 24', <>
    <path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4" />
    <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
    <path d="M18 12a2 2 0 000 4h4v-4h-4z" />
</>);

export const GearIcon = mk('0 0 24 24', <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h0a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51h0a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v0a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
</>);

export const HopsIcon = mk('0 0 24 24', <>
    <circle cx="4" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="20" cy="12" r="2" />
    <path d="M6 12h4M14 12h4" />
</>);

export const GhostIcon = mk('0 0 24 24', <>
    <path d="M5 10a7 7 0 0114 0v10l-2.5-2L14 20l-2-2-2 2-2.5-2L5 20V10z" />
    <circle cx="9" cy="11" r="1" fill="currentColor" />
    <circle cx="15" cy="11" r="1" fill="currentColor" />
</>);

export const BookmarksIcon = mk('0 0 24 24', <>
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
</>);

export const MinimizeIcon = mk('0 0 24 24', <>
    <line x1="5" y1="12" x2="19" y2="12" />
</>);

export const MaximizeIcon = mk('0 0 24 24', <>
    <rect x="4" y="4" width="16" height="16" rx="1" />
</>);

export const RestoreIcon = mk('0 0 24 24', <>
    <rect x="7" y="7" width="13" height="13" rx="1" />
    <path d="M4 17V5a1 1 0 011-1h12" />
</>);

export const CloseIcon = mk('0 0 24 24', <>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
</>);

export const PlusIcon = mk('0 0 24 24', <>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
</>);

export const FolderIcon = mk('0 0 24 24', <>
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
</>);

export const AppStoreIcon = mk('0 0 24 24', <>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
</>);

export const SwapIcon = mk('0 0 24 24', <>
    <path d="M7 16V4l-4 4M7 4l4 4M17 8v12l4-4M17 20l-4-4" />
</>);

export const SearchIcon = mk('0 0 24 24', <>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
</>);

// Brand — PulseChainCloak shield (filled version)
export const BrandShield = ({ size = 32, ...rest }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        {...rest}
    >
        <defs>
            <linearGradient id="pcc-g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#3bc9ff" />
                <stop offset="1" stopColor="#1f6fff" />
            </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="15" fill="url(#pcc-g1)" />
        <path
            d="M16 6 L10 10 v6 c0 4 2.5 7 6 9 c3.5 -2 6 -5 6 -9 v-6 z"
            fill="#0a1628"
            opacity="0.35"
        />
        <path
            d="M11 16 L14 16 L15.5 13 L17 19 L18.5 16 L21 16"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
    </svg>
);
