"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_LANG,
  LANG_COOKIE,
  translate,
  type Lang,
  type TKey,
  type TParams,
} from "./dictionaries";

type I18nContextValue = {
  lang: Lang;
  t: (key: TKey, params?: TParams) => string;
  setLang: (lang: Lang) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  lang: initialLang,
  children,
}: {
  lang: Lang;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [lang, setLangState] = useState<Lang>(initialLang);

  // Keep in sync when the server re-renders with a new cookie value.
  useEffect(() => {
    setLangState(initialLang);
  }, [initialLang]);

  const setLang = useCallback(
    (next: Lang) => {
      setLangState(next); // update client components immediately
      document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      router.refresh(); // re-render server components with the new locale
    },
    [router],
  );

  const t = useCallback(
    (key: TKey, params?: TParams) => translate(lang, key, params),
    [lang],
  );

  return (
    <I18nContext.Provider value={{ lang, t, setLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Safe fallback if used outside the provider.
    return {
      lang: DEFAULT_LANG,
      t: (key, params) => translate(DEFAULT_LANG, key, params),
      setLang: () => {},
    };
  }
  return ctx;
}
