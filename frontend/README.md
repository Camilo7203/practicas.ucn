# LoopHack Frontend

Un frontend moderno construido con React, TypeScript, Vite y Tailwind CSS.

## 🚀 Características

- ⚡ **Vite** - Herramientas de build ultrarrápidas
- ⚛️ **React 18** - Framework de UI moderno
- 🔷 **TypeScript** - Tipado estático para JavaScript
- 🎨 **Tailwind CSS** - Framework CSS utility-first
- 🎯 **ESLint & Prettier** - Linting y formateo de código
- 📱 **Responsive Design** - Diseño adaptativo para todos los dispositivos
- 🔒 **Autenticación JWT** - Sistema de autenticación seguro
- 🌐 **i18n** - Soporte para internacionalización
- 📊 **Chakra UI** - Componentes de UI accesibles

## 📁 Estructura del Proyecto

```
src/
├── assets/          # Recursos estáticos (imágenes, iconos, etc.)
├── components/      # Componentes reutilizables
│   ├── ui/         # Componentes de UI básicos
│   └── ...
├── config/          # Configuraciones de la aplicación
├── contexts/        # Contextos de React
├── hooks/           # Hooks personalizados
├── i18n/           # Archivos de internacionalización
├── lib/            # Librerías y utilidades compartidas
├── pages/          # Páginas/Vistas de la aplicación
├── services/       # Servicios de API y lógica de negocio
├── themes/         # Temas y estilos
├── types/          # Definiciones de tipos TypeScript
├── utils/          # Funciones utilitarias
└── main.tsx        # Punto de entrada de la aplicación
```

## 🛠️ Instalación y Configuración

### Prerrequisitos

- Node.js 18+ 
- npm o yarn

### Instalación

1. **Clona el repositorio**
   ```bash
   git clone <repository-url>
   cd loophack.app/frontend
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno**
   ```bash
   cp .env.example .env
   ```
   Edita el archivo `.env` con tus configuraciones.

4. **Inicia el servidor de desarrollo**
   ```bash
   npm run dev
   ```

La aplicación estará disponible en `http://localhost:3000`

## 📜 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Construye la aplicación para producción |
| `npm run preview` | Vista previa de la build de producción |
| `npm run lint` | Ejecuta ESLint para encontrar problemas |
| `npm run lint:fix` | Ejecuta ESLint y corrige problemas automáticamente |
| `npm run type-check` | Verifica los tipos de TypeScript |
| `npm run format` | Formatea el código con Prettier |
| `npm run format:check` | Verifica el formato del código |
| `npm run clean` | Limpia la carpeta dist |
| `npm run analyze` | Analiza el bundle de la aplicación |

## 🏗️ Build y Deployment

### Desarrollo

```bash
npm run dev
```

### Producción

```bash
npm run build
npm run preview
```

### Docker (si está configurado)

```bash
docker build -t loophack-frontend .
docker run -p 3000:3000 loophack-frontend
```

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```bash
# API Configuration
VITE_API_URL=https://api-app.loophack.ai/api

# App Configuration  
VITE_APP_NAME=LoopHack
VITE_APP_VERSION=1.0.0
```

### Tailwind CSS

La configuración de Tailwind está en `tailwind.config.js`. Los colores del tema se definen allí:

```javascript
colors: {
  'primary': '#1a0a2e',
  'secondary': '#340349',
  'accent': '#da6aeeff',
  // ...
}
```

### Path Mapping

Los alias de importación están configurados en `tsconfig.app.json`:

```json
"paths": {
  "@/*": ["./src/*"],
  "@/components/*": ["./src/components/*"],
  "@/pages/*": ["./src/pages/*"]
  // ...
}
```

## 📋 Estándares de Código

### TypeScript

- Usa tipos explícitos siempre que sea posible
- Prefiere interfaces sobre types para objetos
- Usa enum para constantes relacionadas

### React

- Usa hooks funcionales sobre componentes de clase
- Prefiere composición sobre herencia
- Mantén los componentes pequeños y enfocados

### Styling

- Usa Tailwind CSS para estilos
- Mantén clases organizadas y legibles
- Usa variables CSS para valores reutilizables

### Naming Conventions

- **Archivos**: PascalCase para componentes, camelCase para utilidades
- **Funciones**: camelCase
- **Constantes**: SCREAMING_SNAKE_CASE
- **Interfaces**: PascalCase con 'I' prefix opcional

## 🧪 Testing

```bash
# Ejecutar tests (cuando estén configurados)
npm run test

# Ejecutar tests en modo watch
npm run test:watch

# Generar reporte de cobertura
npm run test:coverage
```

## 📚 Tecnologías Utilizadas

- **React 18** - Library para UI
- **TypeScript 5** - Superset tipado de JavaScript
- **Vite 7** - Build tool y dev server
- **Tailwind CSS 3** - Framework CSS utility-first
- **Chakra UI 3** - Componentes de UI
- **React Router DOM 7** - Enrutamiento
- **React i18next** - Internacionalización
- **Lucide React** - Iconos
- **ESLint 9** - Linter de JavaScript/TypeScript
- **Prettier 3** - Formateador de código

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación
2. Busca en los issues existentes
3. Crea un nuevo issue con detalles del problema

## 📈 Roadmap

- [ ] Implementar tests unitarios
- [ ] Añadir tests de integración
- [ ] Mejorar accesibilidad
- [ ] Optimizar rendimiento
- [ ] Añadir más temas
- [ ] Implementar PWA features

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
