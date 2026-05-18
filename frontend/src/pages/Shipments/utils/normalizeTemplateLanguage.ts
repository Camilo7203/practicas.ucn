export function normalizeTemplateLanguage(language: string): string {
  const normalized = (language || '').trim();
  const languageMap: Record<string, string> = {
    es: 'es_ES',
    en: 'en_US',
    pt: 'pt_BR',
  };

  if (languageMap[normalized]) {
    return languageMap[normalized];
  }

  return normalized || 'es_ES';
}
