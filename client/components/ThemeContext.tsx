
import React, { createContext, useContext, useState, useEffect } from 'react';

// ── Theme Definitions ───────────────────────────────────────────────────────

export type ThemeId =
  | 'light'
  | 'dark'
  | 'programmer'
  | 'minimalist'
  | 'mint-marble'
  | 'midnight'
  | 'botanical'
  | 'neo-pop'
  | 'accessible';

export interface ThemeInfo {
  id: ThemeId;
  name: string;
  description: string;
  vibe: string;
  isDark: boolean;
  colors: {
    bg: string;
    surface: string;
    accent: string;
    accentSecondary: string;
    text: string;
  };
}

export const THEME_LIBRARY: ThemeInfo[] = [
  {
    id: 'light',
    name: 'Light',
    description: 'Clean slate with cyan-blue accents',
    vibe: 'Default',
    isDark: false,
    colors: { bg: '#f8fafc', surface: '#ffffff', accent: '#06b6d4', accentSecondary: '#3b82f6', text: '#0f172a' },
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Sleek dark with cyan-blue accents',
    vibe: 'Default',
    isDark: true,
    colors: { bg: '#020617', surface: '#0f172a', accent: '#06b6d4', accentSecondary: '#3b82f6', text: '#f1f5f9' },
  },
  {
    id: 'programmer',
    name: 'Programmer',
    description: 'GitHub-inspired dark with green accents',
    vibe: 'Hacker',
    isDark: true,
    colors: { bg: '#0d1117', surface: '#161b22', accent: '#39d353', accentSecondary: '#2ea043', text: '#e6edf3' },
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Warm stone tones, no distractions',
    vibe: 'Zen',
    isDark: false,
    colors: { bg: '#fafaf9', surface: '#ffffff', accent: '#78716c', accentSecondary: '#57534e', text: '#1c1917' },
  },
  {
    id: 'mint-marble',
    name: 'Mint & Marble',
    description: 'White slate with fresh mint green',
    vibe: 'Trustworthy',
    isDark: false,
    colors: { bg: '#f0fdf4', surface: '#ffffff', accent: '#34d399', accentSecondary: '#10b981', text: '#1e293b' },
  },
  {
    id: 'midnight',
    name: 'Midnight Ledger',
    description: 'Deep charcoal with Klein blue',
    vibe: 'Professional',
    isDark: true,
    colors: { bg: '#1a1a2e', surface: '#16213e', accent: '#2563eb', accentSecondary: '#1d4ed8', text: '#e0e7ff' },
  },
  {
    id: 'botanical',
    name: 'Botanical',
    description: 'Sage and sand with terracotta warmth',
    vibe: 'Calming',
    isDark: false,
    colors: { bg: '#faf7f2', surface: '#f5f0e8', accent: '#c2410c', accentSecondary: '#9a3412', text: '#3e3328' },
  },
  {
    id: 'neo-pop',
    name: 'Neo-Pop',
    description: 'Electric purple with apricot highlights',
    vibe: 'Energetic',
    isDark: true,
    colors: { bg: '#1a0a2e', surface: '#2d1b4e', accent: '#f97316', accentSecondary: '#a855f7', text: '#f0e6ff' },
  },
  {
    id: 'accessible',
    name: 'Accessible',
    description: 'High-contrast black and white with signal yellow',
    vibe: 'Functional',
    isDark: false,
    colors: { bg: '#ffffff', surface: '#ffffff', accent: '#eab308', accentSecondary: '#ca8a04', text: '#000000' },
  },
];

const VALID_THEME_IDS = new Set(THEME_LIBRARY.map(t => t.id));
const DEFAULT_LIGHT: ThemeId = 'light';
const DEFAULT_DARK: ThemeId = 'dark';

// ── Context ─────────────────────────────────────────────────────────────────

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (themeId: ThemeId) => void;
  toggleTheme: () => void;
  isDark: boolean;
  themeInfo: ThemeInfo;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
  isDark: true,
  themeInfo: THEME_LIBRARY[1],
});

export const useTheme = () => useContext(ThemeContext);

// ── Provider ────────────────────────────────────────────────────────────────

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const stored = localStorage.getItem('gringotts-theme');
    if (stored && VALID_THEME_IDS.has(stored as ThemeId)) return stored as ThemeId;
    return 'dark';
  });

  const themeInfo = THEME_LIBRARY.find(t => t.id === theme)!;
  const isDark = themeInfo.isDark;

  useEffect(() => {
    const root = document.documentElement;

    // Set data-theme attribute for CSS custom properties
    root.setAttribute('data-theme', theme);

    // Toggle Tailwind dark class based on theme's darkness
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    localStorage.setItem('gringotts-theme', theme);
  }, [theme, isDark]);

  const setTheme = (themeId: ThemeId) => {
    if (VALID_THEME_IDS.has(themeId)) {
      setThemeState(themeId);
    }
  };

  // Quick toggle: switches between the user's last-used light/dark default pair
  const toggleTheme = () => {
    if (isDark) {
      // Switch to the default light theme
      setThemeState(DEFAULT_LIGHT);
    } else {
      // Switch to the default dark theme
      setThemeState(DEFAULT_DARK);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark, themeInfo }}>
      {children}
    </ThemeContext.Provider>
  );
};
