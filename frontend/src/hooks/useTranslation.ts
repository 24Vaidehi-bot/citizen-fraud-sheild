import { useLanguage } from '../context/LanguageContext';
import en from '../locales/en';
import hi from '../locales/hi';
import type { Locale } from '../locales/en';

const dictionaries: Record<'en' | 'hi', Locale> = { en, hi };

/**
 * Returns the full translation object for the currently selected language.
 * Usage: const t = useTranslation(); t.nav.home
 */
export function useTranslation(): Locale {
  const { language } = useLanguage();
  return dictionaries[language];
}
