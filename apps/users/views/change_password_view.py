"""Change Password View
Esta vista maneja el cambio de contraseña del usuario autenticado.
"""

import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from core.shared.models.users.user import User
from ..serializers.change_password_serializer import ChangePasswordSerializer
from apps.users.permissions.authentication import CustomJWTAuthentication


logger = logging.getLogger(__name__)


class ChangePasswordView(APIView):
    """Vista para cambiar la contraseña del usuario autenticado."""
    
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def post(self, request):
        """Cambia la contraseña del usuario autenticado.
        
        Args:
            request (Request): La solicitud autenticada con los datos del cambio de contraseña.
            
        Returns:
            Response: Una respuesta con mensaje de éxito o errores de validación.
        """
        try:
            # Obtener el userId del usuario autenticado
            userId = None

            # Intentar obtener el userId de diferentes fuentes
            if hasattr(request, "auth_userId"):
                userId = request.auth_userId
            elif request.auth:
                if isinstance(request.auth, dict):
                    userId = request.auth.get("userId", None)
                else:
                    userId = getattr(request.auth, "payload", {}).get("userId", None)
            elif hasattr(request.user, "userId"):
                userId = request.user.userId

            if not userId:
                return Response(
                    {"error": "No se pudo identificar al usuario autenticado."},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # Buscar el usuario en la base de datos
            try:
                user = User.objects.get(userId=userId)
            except User.DoesNotExist:
                return Response(
                    {"error": "Usuario no encontrado."},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Validar los datos del cambio de contraseña
            serializer = ChangePasswordSerializer(data=request.data)
            
            if not serializer.is_valid():
                return Response(
                    {"errors": serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validar que la contraseña actual sea correcta
            if not user.check_password(serializer.validated_data['current_password']):
                return Response(
                    {"errors": {"current_password": ["La contraseña actual es incorrecta."]}},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Cambiar la contraseña
            user.set_password(serializer.validated_data['new_password'])
            user.save()

            return Response(
                {
                    "message": "Contraseña cambiada exitosamente.",
                    "success": True
                },
                status=status.HTTP_200_OK
            )

        except Exception:
            logger.exception("Error al cambiar contraseña")
            return Response(
                {
                    "error": "Error al cambiar la contraseña.",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def options(self, request, *args, **kwargs):
        """Maneja las solicitudes OPTIONS para CORS."""
        return Response(
            {
                "name": "Change Password",
                "description": "Endpoint para cambiar la contraseña del usuario autenticado",
                "renders": ["application/json"],
                "parses": ["application/json"],
                "actions": {
                    "POST": {
                        "current_password": {
                            "type": "string",
                            "required": True,
                            "read_only": False,
                            "label": "Contraseña actual"
                        },
                        "new_password": {
                            "type": "string",
                            "required": True,
                            "read_only": False,
                            "label": "Nueva contraseña"
                        },
                        "confirm_password": {
                            "type": "string",
                            "required": True,
                            "read_only": False,
                            "label": "Confirmar nueva contraseña"
                        }
                    }
                }
            },
            status=status.HTTP_200_OK
        )
