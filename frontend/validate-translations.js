/**
 * Script para validar que todas las claves de traducción estén presentes en ambos idiomas
 * Uso: node validate-translations.js
 */

const fs = require('fs');
const path = require('path');

const LOCALES_PATH = path.join(__dirname, 'src', 'i18n', 'locales');
const LANGUAGES = ['en', 'es'];

/**
 * Extrae todas las claves de un objeto de forma recursiva
 */
function extractKeys(obj, prefix = '') {
  let keys = [];
  
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(extractKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

/**
 * Carga el archivo de traducción de un idioma
 */
function loadTranslation(lang) {
  const filePath = path.join(LOCALES_PATH, lang, 'translation.json');
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error loading ${lang} translations:`, error.message);
    return null;
  }
}

/**
 * Valida las traducciones
 */
function validateTranslations() {
  console.log('🔍 Validating translations...\n');
  
  const translations = {};
  const keys = {};
  
  // Cargar traducciones de todos los idiomas
  for (const lang of LANGUAGES) {
    translations[lang] = loadTranslation(lang);
    
    if (!translations[lang]) {
      console.error(`❌ Failed to load ${lang} translations\n`);
      return false;
    }
    
    keys[lang] = extractKeys(translations[lang]);
    console.log(`✅ Loaded ${lang}: ${keys[lang].length} keys`);
  }
  
  console.log('\n');
  
  // Comparar claves entre idiomas
  let hasErrors = false;
  
  for (let i = 0; i < LANGUAGES.length; i++) {
    for (let j = i + 1; j < LANGUAGES.length; j++) {
      const lang1 = LANGUAGES[i];
      const lang2 = LANGUAGES[j];
      
      const keys1 = new Set(keys[lang1]);
      const keys2 = new Set(keys[lang2]);
      
      // Claves que están en lang1 pero no en lang2
      const missingInLang2 = [...keys1].filter(key => !keys2.has(key));
      
      // Claves que están en lang2 pero no en lang1
      const missingInLang1 = [...keys2].filter(key => !keys1.has(key));
      
      if (missingInLang2.length > 0) {
        hasErrors = true;
        console.log(`❌ Missing in ${lang2}:`);
        missingInLang2.forEach(key => console.log(`   - ${key}`));
        console.log('\n');
      }
      
      if (missingInLang1.length > 0) {
        hasErrors = true;
        console.log(`❌ Missing in ${lang1}:`);
        missingInLang1.forEach(key => console.log(`   - ${key}`));
        console.log('\n');
      }
    }
  }
  
  if (!hasErrors) {
    console.log('✅ All translations are synchronized!\n');
    return true;
  } else {
    console.log('❌ Translation validation failed\n');
    return false;
  }
}

// Ejecutar validación
const success = validateTranslations();
process.exit(success ? 0 : 1);
