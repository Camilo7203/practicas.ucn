/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores principales - solo para elementos específicos
        primary: "#1a0a2e",         // púrpura muy oscuro - solo para texto importante
        secondary: "#340349",       // púrpura intenso - solo para headers
        accent: "#b430cc",          // fucsia - solo para botones primarios
        highlight: "#da6aee",       // lavanda - solo para hover states

        // Sistema de blancos y grises - PREDOMINANTES
        background: "#ffffff",      // blanco puro para fondos principales
        backgroundAlt: "#fdfdfd",   // blanco casi imperceptible para variación
        surface: "#ffffff",         // blanco puro para tarjetas
        surfaceHover: "#fafafa",    // gris muy claro para hover en tarjetas

        // Bordes y divisores
        border: "#f1f1f3",         // gris muy claro para bordes suaves
        borderAccent: "#e5e7eb",   // gris claro para bordes más definidos
        muted: "#f8f9fa",          // gris muy suave para secciones discretas

        // Texto - jerarquía clara
        textPrimary: "#1a1a1a",    // casi negro para texto principal
        textSecondary: "#6b7280",  // gris medio para texto secundario
        textMuted: "#9ca3af",      // gris claro para texto auxiliar
        textAccent: "#b430cc",     // morado solo para enlaces/resaltados

        // Estados - colores suaves
        success: "#f0fdf4",        // verde muy claro
        successBorder: "#16a34a",  // verde para bordes
        warning: "#fffbeb",        // amarillo muy claro
        warningBorder: "#d97706",  // naranja para bordes
        error: "#fef2f2",          // rojo muy claro
        errorBorder: "#dc2626",    // rojo para bordes

        // Elementos específicos que pueden usar color
        buttonPrimary: "#b430cc",     // morado para botones principales
        buttonSecondary: "#f8f9fa",   // gris muy claro para botones secundarios
        linkColor: "#b430cc",         // morado para enlaces
        focus: "#b430cc",             // morado para estados de focus
      },
      
      // Sombras más elegantes
      boxShadow: {
        'elegant': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'elegant-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
