import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import { getStorageKey, StorageKey } from './lib/storageKeys';

const LANGUAGE_KEY = getStorageKey(StorageKey.LANGUAGE);

// Detect browser language
const getBrowserLanguage = (): string => {
  const supportedLanguages = ['en', 'fr', 'es'];
  
  // First, check if user has previously selected a language
  try {
    const savedLanguage = localStorage.getItem(LANGUAGE_KEY);
    if (savedLanguage && supportedLanguages.includes(savedLanguage)) {
      return savedLanguage;
    }
  } catch (error) {
    // localStorage might not be available
  }
  
  // If no saved language, try to get user's preferred languages (ordered by preference)
  const userLanguages = navigator.languages || [
    navigator.language || (navigator as any).userLanguage || 'en'
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

const detectedLanguage = getBrowserLanguage();

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    es: { translation: es },
  },
  lng: detectedLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

// Save language to localStorage whenever it changes
i18n.on('languageChanged', (lng: string) => {
  try {
    localStorage.setItem(LANGUAGE_KEY, lng);
  } catch (error) {
    console.warn('Failed to save language preference:', error);
  }
});

export default i18n;

