"""Permisos personalizados para la aplicación de autenticación de usuarios.
Este módulo define permisos personalizados que pueden ser utilizados en las vistas de la aplicación.
Estos permisos se pueden aplicar a las vistas para controlar el acceso basado en la presencia de una API key.
"""

from rest_framework import permissions
import os
import secrets


class HasAPIKey(permissions.BasePermission):
    """
    Permiso personalizado que verifica la presencia de una API key válida
    en las cabeceras HTTP de la solicitud.
    """

    def has_permission(self, request, view):
        """Verifica si la solicitud tiene una API key válida.
        Args:
            request (Request): La solicitud que contiene las cabeceras HTTP.
            view (View): La vista a la que se está accediendo.
        Returns:
            bool: True si la API key es válida, False en caso contrario.
        """
        api_key = os.getenv("API_KEY")

        provided_key = request.headers.get("X-API-KEY")

        if not api_key or not provided_key:
            return False

        return secrets.compare_digest(provided_key, api_key)
