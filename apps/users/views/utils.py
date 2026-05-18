"""User Authentication Utilities
Este Utils maneja la generación de tokens JWT para usuarios MongoDB.
Este código es parte de la aplicación de autenticación de usuarios en Django.
"""

from rest_framework_simplejwt.tokens import RefreshToken
import uuid


def generate_jwt_for_user(user):
    """Genera un JWT para el usuario dado.
    Args:
        user (User): El usuario para el cual se generará el JWT.
    Returns:
        dict: Un diccionario con los tokens JWT generados y los datos del usuario.
    """
    refresh = RefreshToken()

    refresh["userId"] = str(user.userId)
    refresh["name"] = user.name
    refresh["email"] = user.email
    refresh["organization"] = str(user.organization.id) if user.organization and hasattr(user.organization, "id") else None
    refresh["role"] = user.role
    

    refresh["token_type"] = "access"
    refresh["jti"] = str(uuid.uuid4())

    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "user": {
            "id": str(user.id),  # MongoDB ObjectId
            "userId": str(user.userId),  # UUID
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "organization": str(user.organization.id) if user.organization and hasattr(user.organization, "id") else None,
        },
    }
