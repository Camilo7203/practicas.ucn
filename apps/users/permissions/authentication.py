"""Custom JWT Authentication for MongoDB Users
Este módulo define una clase personalizada de autenticación JWT para usuarios almacenados en MongoDB.
Esta clase extiende la autenticación JWT estándar de Django REST Framework
para manejar usuarios con un campo `userId` personalizado.
"""

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from core.shared.models.users.user import User


class CustomJWTAuthentication(JWTAuthentication):
    """Autenticación JWT personalizada para usuarios MongoDB"""
    
    def get_user(self, validated_token):
        """Obtiene el usuario basado en el token validado.
        Args:
            validated_token: El token JWT validado.
        Returns:
            User: La instancia del usuario correspondiente al token.
        Raises:
            AuthenticationFailed: Si el usuario no existe o no está activo.
        """
        try:
            user_id = validated_token.get('userId')
            if user_id is None:
                raise InvalidToken('Token no contiene userId')
            
            user = User.objects.get(userId=user_id)
            if not user.is_active:
                raise AuthenticationFailed('Usuario inactivo')

            return user
            
        except User.DoesNotExist:
            raise AuthenticationFailed('Usuario no encontrado')
        except Exception as e:
            raise AuthenticationFailed(f'Error en autenticación: {str(e)}')

    def authenticate(self, request):
        """
        Método personalizado para autenticar usando JWT con MongoDB.
        Args:
            request (Request): La solicitud HTTP que contiene el token JWT.
        Returns:
            tuple: Una tupla con el usuario autenticado y el token JWT validado.
        """
        header = self.get_header(request)
        if header is None:
            return None
        raw_token = self.get_raw_token(header)
        if raw_token is None:
            return None
        validated_token = self.get_validated_token(raw_token)
        user = self.get_user(validated_token)
        request.auth_userId = validated_token.get("userId")
        return (user, validated_token)