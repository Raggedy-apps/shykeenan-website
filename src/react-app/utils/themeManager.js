// Minimal theme manager to satisfy build in this repo
const STORAGE_KEY = 'site-theme';
export const FALLBACK_THEME = 'neon';

export function createThemeManager({ storageKey = STORAGE_KEY, defaultTheme = FALLBACK_THEME } = {}) {
  function getStored() {
    try {
      return localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  }
  function store(theme) {
    try {
      localStorage.setItem(storageKey, theme);
    } catch {}
  }
  function apply(theme) {
    const t = theme || defaultTheme;
    document.documentElement.setAttribute('data-theme', t);
  }
  return {
    getTheme() {
      return getStored() || defaultTheme;
    },
    setTheme(theme) {
      store(theme);
      apply(theme);
    },
    init() {
      apply(getStored());
    },
  };
}

export const siteThemeManager = createThemeManager();
