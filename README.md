# django-core

Repositorio de ejemplo para proyectos Django con una estructura clara y configuraciones comunes listas para usar.

---

## 📝 Tabla de Contenidos

1. [Descripción](#descripción)
2. [Características](#características)
3. [Requisitos Previos](#requisitos-previos)
4. [Instalación y Configuración](#instalación-y-configuración)
5. [Tareas Comunes (Makefile)](#tareas-comunes-makefile)
6. [Estructura de Archivos](#estructura-de-archivos)

---

## 📖 Descripción

Este repositorio proporciona un **punto de partida** para cualquier proyecto Django, incluyendo:

- Configuración de entorno de desarrollo y producción.
- Integración con _pre-commit_ (Black, isort, Flake8).
- Makefile con tareas frecuentes (migraciones, servidor, linters, tests).
- Ejemplo de gestión de variables sensibles mediante archivos `.env`.

---

## ✨ Características

- **Django 5.2.4**
- **Frontend React + TypeScript + Vite**
- Entorno virtual y dependencias separadas:
  - `requirements.txt`: dependencias de producción.
  - `requirements-dev.txt`: herramientas de desarrollo (linters, formateadores).
- Pre-commit hooks para mantener la calidad del código.
- Archivos de configuración: `pyproject.toml`, `.editorconfig`.
- Makefile para simplificar flujos de trabajo.
- **Módulo de Envíos WhatsApp**: Creación de plantillas y envío de campañas masivas (ver [SHIPMENTS_README.md](SHIPMENTS_README.md))

---

## 📋 Requisitos Previos

- **Python 3.13.1**
- **Git**

---

## 🚀 Instalación y Configuración

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/loophack-ai/django-core.git
   cd django-core
2. **configurar el entorno virtual**
   ```bash
    python3 -m venv venv
    source venv/bin/activate

3. **Instala las dependencias**
   ```bash
    make setup

4. **configurar base de datos**
   ```bash
   make setup-db

5. **Configura variables de entorno**
Edita .env con tus credenciales

6. **Aplica migraciones**
   ```bash
    make migrate

7. **Inicia el servidor de desarrollo**
   ```bash
    make run

8. **lintea el código**
   ```bash
    make fmt

9. **precommit**
   ```bash
    make lint

# Estructura de Archivos
| Ruta                      | Descripción                                                    |
| ------------------------- | -------------------------------------------------------------- |
| `requirements.txt`        | Librerías necesarias en **producción**.                        |
| `requirements-dev.txt`    | Herramientas de **desarrollo** (linters, formateadores, etc.). |
| `.env`                    | Variables de entorno **sensibles** (no versionado).            |
| `.env.example`            | Plantilla de variables de entorno.                             |
| `.gitignore`              | Archivos y carpetas que **Git** ignora.                        |
| `.pre-commit-config.yaml` | Hooks de pre-commit configurados.                              |
| `pyproject.toml`          | Configuración para formateadores y linters.                    |
| `.editorconfig`           | Reglas de estilo del editor.                                   |
| `Makefile`                | Comandos para agilizar flujos de trabajo.                      |
| `core/`                   | Aplicación Django principal.                                   |
| `manage.py`               | Script de gestión de Django.                                   |
| `docker-compose.yml`      | Configuración de Docker.                                       |

---

## 🔌 API Endpoints - Autenticación y Perfil

### Rutas Canónicas (Recomendado)
Todas las rutas de autenticación y perfil están disponibles bajo el prefijo `/api/auth/`:

| Método | Endpoint                    | Descripción                              | Autenticación |
|--------|----------------------------|------------------------------------------|---------------|
| POST   | `/api/auth/register/`       | Registrar nuevo usuario                  | No            |
| POST   | `/api/auth/login/`          | Iniciar sesión                           | No            |
| GET    | `/api/auth/profile/`        | Obtener perfil del usuario autenticado   | Sí (JWT)      |
| PATCH  | `/api/auth/profile/`        | Actualizar perfil del usuario            | Sí (JWT)      |
| POST   | `/api/auth/change-password/`| Cambiar contraseña                       | Sí (JWT)      |

### Compatibilidad Temporal
**DEPRECATED**: Las rutas bajo `/api/users/*` siguen funcionando por compatibilidad, pero serán eliminadas en versiones futuras. Por favor, migra a `/api/auth/*`.

### Actualización de Perfil - Permisos
- **Usuario normal**: puede editar solo `name` y `email` de su propio perfil.
- **Usuario admin**: puede editar `name`, `email`, `role` e `is_active` de cualquier usuario.

**Nota importante**: Cuando un usuario cambia `role` o `is_active`, el backend responde con `force_logout: true`, lo que obliga al frontend a cerrar sesión y volver a autenticar al usuario por seguridad.

### Ejemplo de Request - Actualizar Perfil
```bash
PATCH /api/auth/profile/
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Nuevo Nombre",
  "email": "nuevo@email.com"
}
```

### Ejemplo de Response - Actualizar Perfil (admin cambia role)
```json
{
  "message": "Perfil actualizado. Por seguridad, debe volver a iniciar sesión.",
  "user": {
    "id": "...",
    "userId": "...",
    "name": "Nuevo Nombre",
    "email": "nuevo@email.com",
    "role": "viewer",
    "is_active": true
  },
  "success": true,
  "force_logout": true
}
```

---

## ❤️ Health Checks

Se exponen endpoints públicos para monitoreo básico del servicio:

| Método | Endpoint          | Propósito                                  | Respuesta esperada |
|--------|-------------------|--------------------------------------------|--------------------|
| GET    | `/health/`        | Compatibilidad (alias de readiness)        | `200` o `503`      |
| GET    | `/health/live`    | Liveness del proceso Django                | `200`              |
| GET    | `/health/ready`   | Readiness (proceso + conectividad MongoDB) | `200` o `503`      |

### Semántica
- `live`: solo confirma que el proceso está activo.
- `ready`: confirma que el proceso está activo y que Mongo responde a `ping`.
- Si Mongo falla, `ready` devuelve `503` con detalle en `checks.mongo.detail`.

### Formato de respuesta
```json
{
   "status": "ok",
   "service": "loophack-api",
   "timestamp": "2026-02-28T00:00:00+00:00",
   "checks": {
      "process": { "status": "ok" },
      "mongo": { "status": "ok", "detail": "ok" }
   }
}
```

---


## Clona Core en tu servicio

# 1. Clona tu repositorio derivado
git clone git@github.com:TU-ORG/REPO-DERIVADO.git 
cd REPO-DERIVADO

# 2. Añade el repo base como remoto “upstream”
git remote add upstream git@github.com:TU-ORG/REPO-BASE.git

# 3. Trae los cambios del base
git fetch upstream

# 4. Mézclalos en tu rama principal (main)
git checkout main
git merge upstream/main     # o git rebase upstream/main

# 5. Sube el resultado a GitHub
git push origin main