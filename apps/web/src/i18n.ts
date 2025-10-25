import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getItem, setItem } from './lib/indexedDB';
import { getStorageKey, StorageKey } from './lib/storageKeys';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';

const LANGUAGE_KEY = getStorageKey(StorageKey.LANGUAGE);

// Get browser language synchronously (fallback)
const getBrowserLanguageSync = (): string => {
  const supportedLanguages = ['en', 'fr', 'es'];

  // Try to get user's preferred languages (ordered by preference)
  const userLanguages = navigator.languages || [
    navigator.language || (navigator as any).userLanguage || 'en',
  ];

  // Check each preferred language
  for (const lang of userLanguages) {
    // Extract the main language code (e.g., 'fr-FR' -> 'fr')
    const langCode = lang.toLowerCase().split(/[_-]/)[0];

    // Return the first supported language found
    if (supportedLanguages.includes(langCode)) {
      return langCode;
    }
  }

  // Default to English if no supported language found
  return 'en';
};

// Detect saved language asynchronously
const getSavedLanguage = async (): Promise<string | null> => {
  const supportedLanguages = ['en', 'fr', 'es'];

  try {
    const savedLanguage = await getItem(LANGUAGE_KEY);
    if (savedLanguage && supportedLanguages.includes(savedLanguage)) {
      return savedLanguage;
    }
  } catch (error) {
    // IndexedDB might not be available
  }

  return null;
};

// Initialize i18n synchronously with browser language first
const initialLanguage = getBrowserLanguageSync();

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    es: { translation: es },
  },
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

// Update language if a saved preference is found
getSavedLanguage().then((savedLanguage) => {
  if (savedLanguage && savedLanguage !== initialLanguage) {
    i18n.changeLanguage(savedLanguage);
  }
});

// Save language to IndexedDB whenever it changes
i18n.on('languageChanged', (lng: string) => {
  setItem(LANGUAGE_KEY, lng).catch((error) => {
    console.warn('Failed to save language preference:', error);
  });
});

export default i18n;
