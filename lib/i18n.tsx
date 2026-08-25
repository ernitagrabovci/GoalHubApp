import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { usePersistedState } from '@/lib/storage';
import { translations, type Lang } from '@/lib/translations';

type I18nValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

/** Provides the current language + t(). Persists the choice across restarts. */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = usePersistedState<Lang>('settings:lang', 'en');

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      t: (key, params) => {
        const table = translations[lang];
        const en = translations.en;
        const raw = table[key] ?? en[key] ?? key;
        if (!params) return raw;
        return raw.replace(/\{(\w+)\}/g, (_, k: string) =>
          params[k] != null ? String(params[k]) : `{${k}}`
        );
      },
    }),
    [lang]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
