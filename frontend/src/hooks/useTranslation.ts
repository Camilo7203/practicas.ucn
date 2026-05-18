import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useCallback } from 'react';

/**
 * Custom hook para usar traducciones en la aplicación
 * Extiende useTranslation de react-i18next con funcionalidades adicionales
 */
export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();

  /**
   * Cambia el idioma de la aplicación
   * @param lng - Código del idioma ('es' | 'en')
   */
  const changeLanguage = useCallback((lng: string) => {
    i18n.changeLanguage(lng);
  }, [i18n]);

  /**
   * Obtiene el idioma actual
   */
  const currentLanguage = i18n.language;

  /**
   * Verifica si el idioma actual es español
   */
  const isSpanish = currentLanguage === 'es';

  /**
   * Verifica si el idioma actual es inglés
   */
  const isEnglish = currentLanguage === 'en';

  /**
   * Alterna entre español e inglés
   */
  const toggleLanguage = useCallback(() => {
    const newLang = currentLanguage === 'es' ? 'en' : 'es';
    changeLanguage(newLang);
  }, [currentLanguage, changeLanguage]);

  return {
    t,
    i18n,
    changeLanguage,
    currentLanguage,
    isSpanish,
    isEnglish,
    toggleLanguage
  };
};

export default useTranslation;
