"""User Profile View
Esta vista maneja la obtención y actualización del perfil del usuario autenticado.
"""

import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from core.shared.models.users.user import User
from ..serializers.user import UserSerializer
from ..serializers.update_profile_serializer import UpdateProfileSerializer
from rest_framework.permissions import IsAuthenticated
from apps.users.permissions.authentication import CustomJWTAuthentication


logger = logging.getLogger(__name__)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def _get_user_id(self, request):
        """Extrae el userId del request autenticado.
        
        Args:
            request (Request): La solicitud autenticada.
            
        Returns:
            str: El userId del usuario autenticado o None.
        """
        userId = None

        # Intentar obtener el userId de diferentes fuentes
        if hasattr(request, "auth_userId"):
            userId = request.auth_userId

        if userId is None and request.auth:
            if isinstance(request.auth, dict):
                userId = request.auth.get("userId", None)
            else:
                userId = getattr(request.auth, "payload", {}).get("userId", None)

        if userId is None and hasattr(request.user, "userId"):
            userId = request.user.userId

        return userId

    def get(self, request):
        """Obtiene el perfil del usuario autenticado.
        Args:
            request (Request): La solicitud autenticada.
        Returns:
            Response: Una respuesta con los datos del usuario o errores.
        """
        try:
            userId = self._get_user_id(request)

            if not userId:
                return Response(
                    {"error": "No se pudo identificar al usuario desde el token"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            user = User.objects.get(userId=userId)
            serializer = UserSerializer(user)
            return Response({"user": serializer.data}, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response(
                {"error": "Usuario no encontrado"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception:
            logger.exception("Error en obtención de perfil")
            return Response(
                {"error": "Error al obtener el perfil"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def patch(self, request):
        """Actualiza el perfil del usuario autenticado.
        
        Args:
            request (Request): La solicitud autenticada con los datos a actualizar.
            
        Returns:
            Response: Una respuesta con los datos actualizados o errores.
        """
        try:
            userId = self._get_user_id(request)

            if not userId:
                return Response(
                    {"error": "No se pudo identificar al usuario desde el token"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            # Obtener el usuario autenticado
            request_user = User.objects.get(userId=userId)
            
            # El usuario objetivo es el mismo (self-update)
            target_user = request_user

            # Detectar si se están modificando campos sensibles
            sensitive_fields_changed = (
                'role' in request.data or 'is_active' in request.data
            )

            # Validar y actualizar
            serializer = UpdateProfileSerializer(
                target_user,
                data=request.data,
                partial=True,
                context={
                    'request_user': request_user,
                    'user': target_user
                }
            )

            if not serializer.is_valid():
                return Response(
                    {"errors": serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )

            updated_user = serializer.save()

            # Preparar respuesta con flag de logout forzado si cambió role o is_active
            response_data = {
                "message": "Perfil actualizado exitosamente.",
                "user": serializer.data,
                "success": True
            }

            if sensitive_fields_changed:
                response_data["force_logout"] = True
                response_data["message"] = "Perfil actualizado. Por seguridad, debe volver a iniciar sesión."

            return Response(response_data, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response(
                {"error": "Usuario no encontrado"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception:
            logger.exception("Error al actualizar perfil")
            return Response(
                {"error": "Error al actualizar el perfil"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )