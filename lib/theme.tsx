import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { themes, type ThemeColors, type ThemeMode } from '@/constants/theme';
import { usePersistedState } from '@/lib/storage';

type ThemeValue = {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  colors: ThemeColors;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeValue | null>(null);

/** Provides the active palette + a persisted dark/light toggle. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = usePersistedState<ThemeMode>('theme:mode', 'dark');
  const colors = themes[theme];
  const isDark = theme === 'dark';

  const value = useMemo<ThemeValue>(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
      colors,
      isDark,
    }),
    [theme, colors, isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}

/**
 * Builds a screen's StyleSheet from the active palette.
 * `factory` must be a stable module-level function so the memo holds across renders.
 */
export function useThemedStyles<T>(factory: (colors: ThemeColors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [colors, factory]);
}
