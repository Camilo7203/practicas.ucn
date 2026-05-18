"""
Importa y expone los patrones de URL para la aplicación users
"""

from .urls import urlpatterns

# Esta línea es esencial para que Django encuentre los patrones
__all__ = ["urlpatterns"]
