import os
import logging
from .base import *
from dotenv import load_dotenv
from mongoengine import connect

logger = logging.getLogger(__name__)

# Cargar variables de entorno desde .env
load_dotenv()


# Configuración para la conexión a MongoDB
MONGO_DB = os.getenv("MONGO_DB", "loophack")
MONGO_USER = os.getenv("MONGO_USER", "")
MONGO_PASSWORD = os.getenv("MONGO_PASSWORD", "")
MONGO_HOST = os.getenv("MONGO_HOST", "localhost")

# Conexión a MongoDB utilizando Mongoengine con URI mongodb+srv
try:
    MONGO_URI = f"mongodb+srv://{MONGO_USER}:{MONGO_PASSWORD}@{MONGO_HOST}/{MONGO_DB}"
    connect(host=MONGO_URI, db=MONGO_DB)
    logger.info("Conexión a MongoDB establecida", extra={"mongo_host": MONGO_HOST, "mongo_db": MONGO_DB})
except Exception as e:
    logger.exception("Error al conectar con MongoDB", extra={"mongo_host": MONGO_HOST, "mongo_db": MONGO_DB})

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

LOGGING["handlers"]["console"]["formatter"] = "human"
LOGGING["root"]["level"] = "DEBUG"
LOGGING["loggers"]["django"]["level"] = "INFO"
LOGGING["loggers"]["apps"]["level"] = "DEBUG"
LOGGING["loggers"]["core"]["level"] = "DEBUG"

ALLOWED_HOSTS = ['98.89.219.67','api.loophack.ai','127.0.0.1', 'localhost',
    "ae81ce5ba8a0.ngrok-free.app"]
CSRF_TRUSTED_ORIGINS = ["https://api.loophack.ai", "http://localhost:3000", "http://127.0.0.1:3000",
    "https://ae81ce5ba8a0.ngrok-free.app"]
SECURE_SSL_REDIRECT = False  # Disabled for local development
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = "static/"

# WhatsApp Configuration from .env
# Las variables se cargan desde el archivo .env usando python-decouple
