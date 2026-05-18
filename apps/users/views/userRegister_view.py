"""User Registration View
Esta vista maneja el registro de nuevos usuarios, validando los datos y creando el usuario si son correctos.
"""

import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from core.shared.models.users.user import User
from ..serializers.user import UserSerializer
from .utils import generate_jwt_for_user
from ..permissions.permissions import HasAPIKey
import uuid


logger = logging.getLogger(__name__)


class UserRegisterView(APIView):
    permission_classes = [HasAPIKey]

    def post(self, request):
        """Maneja el registro de nuevos usuarios.
        Args:
            request (Request): La solicitud que contiene los datos del nuevo usuario.
        Returns:
            Response: Una respuesta con el usuario creado o errores de validación.
        """
        serializer = UserSerializer(data=request.data)

        if serializer.is_valid():
            try:
                # Verificar si ya existe un usuario con el mismo email
                if User.objects.filter(email=serializer.validated_data["email"]).first():
                    return Response(
                        {"error": "El correo electrónico ya está registrado"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Crear el usuario usando el serializer
                user = serializer.save()

                logger.info(
                    "Usuario registrado exitosamente",
                    extra={"user_id": str(user.id), "userId": user.userId, "email": user.email},
                )
                
                # Generar tokens JWT
                tokens = generate_jwt_for_user(user)
                return Response(tokens, status=status.HTTP_201_CREATED)

            except Exception:
                logger.exception("Error en registro de usuario")
                return Response(
                    {"error": "Error al registrar"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        logger.warning("Errores de validación en registro", extra={"errors": serializer.errors})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)