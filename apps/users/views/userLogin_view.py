"""User Login View
Esta vista maneja el inicio de sesión de usuarios, validando credenciales y generando tokens JWT.
"""

import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from core.shared.models.users.user import User
from ..serializers.user import LoginSerializer
from .utils import generate_jwt_for_user


logger = logging.getLogger(__name__)


class UserLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """Maneja el inicio de sesión de usuarios.
        Args:
            request (Request): La solicitud que contiene las credenciales del usuario.
        Returns:
            Response: Una respuesta con los tokens JWT o errores de autenticación.
        """
        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():
            try:
                email = serializer.validated_data["email"]
                password = serializer.validated_data["password"]
                user = User.objects.get(email=email)
                logger.info("Usuario encontrado para login", extra={"user_id": str(user.id), "email": user.email})

                if user.check_password(password):
                    logger.info("Autenticación exitosa", extra={"user_id": str(user.id)})
                    tokens = generate_jwt_for_user(user)
                    return Response(tokens, status=status.HTTP_200_OK)
                else:
                    logger.warning("Contraseña incorrecta en login", extra={"user_id": str(user.id), "email": user.email})
                    return Response(
                        {"error": "Credenciales incorrectas"},
                        status=status.HTTP_401_UNAUTHORIZED,
                    )

            except User.DoesNotExist:
                logger.warning(
                    "Usuario no encontrado en login",
                    extra={"email": serializer.validated_data["email"]},
                )
                return Response(
                    {"error": "Usuario no encontrado"}, 
                    status=status.HTTP_404_NOT_FOUND
                )

            except Exception as e:
                logger.exception("Error inesperado en login")
                return Response(
                    {"error": "Error interno del servidor"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        logger.warning("Errores de validación en login", extra={"errors": serializer.errors})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)