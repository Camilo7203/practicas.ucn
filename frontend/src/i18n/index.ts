import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importar las traducciones
import translationEN from './locales/en/translation.json';
import translationES from './locales/es/translation.json';

const resources = {
    en: {
        translation: translationEN
    },
    es: {
        translation: translationES
    }
};

// Obtener idioma guardado en localStorage o usar español por defecto
const savedLanguage = localStorage.getItem('loophack_language') || 'es';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'es',
        lng: savedLanguage,
        debug: false,
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'loophack_language'
        }
    });

// Guardar cambios de idioma en localStorage
i18n.on('languageChanged', (lng) => {
    localStorage.setItem('loophack_language', lng);
});

export default i18n;