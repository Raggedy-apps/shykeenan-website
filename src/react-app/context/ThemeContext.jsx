import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { siteThemeManager } from '../utils/themeManager.js';

const ThemeContext = createContext({
  theme: '',
  isNeon: false,
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
  manager: siteThemeManager,
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(siteThemeManager.getTheme());

  useEffect(() => {
    siteThemeManager.init();
    setTheme(siteThemeManager.getTheme());
    const unsubscribe = siteThemeManager.subscribe((nextTheme) => {
      setTheme(nextTheme);
    });
    return () => unsubscribe();
  }, []);

  const value = useMemo(() => {
    const setThemeAndPersist = (nextTheme) => {
      siteThemeManager.setTheme(nextTheme);
    };
    const toggle = () => {
      siteThemeManager.toggleTheme();
    };
    return {
      theme,
      isNeon: theme === 'neon',
      isDark: theme === 'dark',
      setTheme: setThemeAndPersist,
      toggleTheme: toggle,
      manager: siteThemeManager,
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
