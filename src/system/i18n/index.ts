import { h, FunctionComponent, ComponentChildren, createContext } from 'preact';
import { useContext, useMemo } from 'preact/hooks';

import { useGameState } from '../../game/state';
import en from './locales/en';
import zh from './locales/zh';

export type Locale = 'en' | 'zh';

const dictionaries: Record<Locale, Record<string, string>> = {
  en,
  zh,
};

export const tForLocale = (
  locale: Locale,
  key: string,
  fallback?: string
): string => {
  return dictionaries[locale][key] ?? fallback ?? key;
};

export const translateLiteralForLocale = (
  locale: Locale,
  text: string
): string => {
  return tForLocale(locale, `literal.${text}`, text);
};

interface I18nContextValue {
  locale: Locale;
  t: (key: string, fallback?: string) => string;
  translateLiteral: (text: string) => string;
}

const defaultContextValue: I18nContextValue = {
  locale: 'en',
  t: (key, fallback) => fallback ?? key,
  translateLiteral: (text) => text,
};

const I18nContext = createContext<I18nContextValue>(defaultContextValue);

interface I18nProviderProps {
  children: ComponentChildren;
}

export const I18nProvider: FunctionComponent<I18nProviderProps> = ({
  children,
}: I18nProviderProps) => {
  const { flags } = useGameState();
  const locale = flags.language;

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      t: (key, fallback) => tForLocale(locale, key, fallback),
      translateLiteral: (text) => translateLiteralForLocale(locale, text),
    }),
    [locale]
  );

  return h(I18nContext.Provider, { value }, children);
};

export const useI18n = (): I18nContextValue => useContext(I18nContext);
