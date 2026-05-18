"""Organization Management Views
Vistas para manejar organizaciones - obtener y actualizar.
Solo usuarios autenticados pueden acceder a estas vistas.
"""

import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from mongoengine.errors import DoesNotExist, ValidationError as MongoValidationError
from core.shared.models.users.organization import Organization
from core.shared.models.users.user import User
from ..permissions.authentication import CustomJWTAuthentication
from ..serializers.organization_serializers import OrganizationSerializer


logger = logging.getLogger(__name__)


def _serialize_member(member):
    try:
        organization = getattr(member, 'organization', None)
    except Exception:
        organization = None

    created_at = getattr(member, 'created_at', None)
    updated_at = getattr(member, 'updated_at', None)

    try:
        organization_id = str(organization.id) if organization and hasattr(organization, 'id') else None
    except Exception:
        organization_id = None

    try:
        organization_name = getattr(organization, 'name', None) if organization else None
    except Exception:
        organization_name = None

    created_at_value = created_at.isoformat() if created_at and hasattr(created_at, 'isoformat') else (str(created_at) if created_at else None)
    updated_at_value = updated_at.isoformat() if updated_at and hasattr(updated_at, 'isoformat') else (str(updated_at) if updated_at else None)

    return {
        "id": str(getattr(member, 'id', '')),
        "userId": getattr(member, 'userId', None),
        "name": getattr(member, 'name', ''),
        "email": getattr(member, 'email', ''),
        "organization_id": organization_id,
        "organization_name": organization_name,
        "role": getattr(member, 'role', 'member'),
        "is_active": getattr(member, 'is_active', True),
        "created_at": created_at_value,
        "updated_at": updated_at_value,
    }


class OrganizationDetailView(APIView):
    """Vista para obtener y actualizar una organización específica."""
    
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, organization_id=None):
        """Obtiene los detalles de una organización.
        
        Si no se proporciona organization_id, retorna la organización del usuario autenticado.
        Si se proporciona organization_id, verifica que el usuario pertenezca a esa organización.
        """
        try:
            if organization_id:
                # Verificar que el usuario pertenezca a la organización solicitada
                organization = Organization.objects.get(id=organization_id)
                if request.user.organization.id != organization.id:
                    return Response(
                        {"error": "No tienes permisos para acceder a esta organización"},
                        status=status.HTTP_403_FORBIDDEN
                    )
            else:
                # Obtener la organización del usuario autenticado
                if not request.user.organization:
                    return Response(
                        {"error": "El usuario no pertenece a ninguna organización"},
                        status=status.HTTP_404_NOT_FOUND
                    )
                organization = request.user.organization

            # Serializar y retornar los datos de la organización
            serializer = OrganizationSerializer(organization)
            return Response(
                {
                    "message": "Organización obtenida exitosamente",
                    "organization": serializer.data,
                    "role": request.user.role
                },
                status=status.HTTP_200_OK
            )

        except DoesNotExist:
            return Response(
                {"error": "Organización no encontrada"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Error al obtener organización: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def put(self, request, organization_id=None):
        """Actualiza una organización existente.
        
        Solo usuarios con role='admin' pueden actualizar organizaciones.
        
        Body:
        {
            "name": "Nombre Actualizado",
            "description": "Nueva descripción",
            "logo": "nueva_url_logo",
            "segments": ["segmento1", "segmento2"],
            "plan": "premium"
        }
        """
        # Verificar permisos de administrador
        if request.user.role != 'admin':
            return Response(
                {"error": "Solo los administradores pueden actualizar organizaciones"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            if organization_id:
                # Verificar que el usuario pertenezca a la organización solicitada
                organization = Organization.objects.get(id=organization_id)
                if request.user.organization.id != organization.id:
                    return Response(
                        {"error": "No tienes permisos para actualizar esta organización"},
                        status=status.HTTP_403_FORBIDDEN
                    )
            else:
                # Actualizar la organización del usuario autenticado
                if not request.user.organization:
                    return Response(
                        {"error": "El usuario no pertenece a ninguna organización"},
                        status=status.HTTP_404_NOT_FOUND
                    )
                organization = request.user.organization

            # Validar y actualizar los datos
            serializer = OrganizationSerializer(
                organization,
                data=request.data,
                partial=True  # Permitir actualizaciones parciales
            )

            if serializer.is_valid():
                updated_organization = serializer.save()
                
                return Response(
                    {
                        "message": "Organización actualizada exitosamente",
                        "organization": OrganizationSerializer(updated_organization).data,
                        "role": request.user.role
                    },
                    status=status.HTTP_200_OK
                )

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except DoesNotExist:
            return Response(
                {"error": "Organización no encontrada"},
                status=status.HTTP_404_NOT_FOUND
            )
        except MongoValidationError as e:
            return Response(
                {"error": f"Error de validación: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": f"Error al actualizar organización: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class OrganizationListView(APIView):
    """Vista para listar organizaciones (solo admins del sistema)."""
    
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Lista todas las organizaciones.
        
        Solo usuarios con role='admin' pueden listar todas las organizaciones.
        Otros usuarios solo ven su propia organización.
        """
        try:
            if request.user.role == 'admin':
                # Los admins pueden ver todas las organizaciones
                organizations = list(Organization.objects())
                serializer = OrganizationSerializer(organizations, many=True)
                
                return Response(
                    {
                        "message": "Organizaciones obtenidas exitosamente",
                        "count": len(organizations),
                        "organizations": serializer.data
                    },
                    status=status.HTTP_200_OK
                )
            else:
                # Usuarios regulares solo ven su organización
                if not request.user.organization:
                    return Response(
                        {"error": "El usuario no pertenece a ninguna organización"},
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                serializer = OrganizationSerializer(request.user.organization)
                return Response(
                    {
                        "message": "Organización obtenida exitosamente", 
                        "organizations": [serializer.data]
                    },
                    status=status.HTTP_200_OK
                )

        except Exception as e:
            return Response(
                {"error": f"Error al obtener organizaciones: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class OrganizationMembersView(APIView):
    """Vista para listar miembros de la organización del usuario autenticado."""

    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        logger.info(
            "Solicitud de miembros de organización",
            extra={"user_id": str(request.user.id), "user_name": request.user.name},
        )
        try:
            if not request.user.organization:
                return Response(
                    {"error": "El usuario no pertenece a ninguna organización"},
                    status=status.HTTP_404_NOT_FOUND
                )
            logger.info(
                "Organización del usuario autenticado",
                extra={
                    "organization_id": str(request.user.organization.id),
                    "organization_name": request.user.organization.name,
                },
            )
            users = list(
                User.objects(organization=request.user.organization).order_by('-created_at')
            )
            members = [_serialize_member(member) for member in users]

            return Response(
                {
                    "message": "Miembros obtenidos exitosamente",
                    "count": len(members),
                    "members": members
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"error": f"Error al obtener miembros: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class OrganizationMemberDetailView(APIView):
    """Vista para actualizar rol o remover miembros de la organización."""

    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, user_id):
        if request.user.role != 'admin':
            return Response(
                {"error": "Solo los administradores pueden cambiar roles"},
                status=status.HTTP_403_FORBIDDEN
            )

        new_role = request.data.get('role')
        if new_role not in ['admin', 'member', 'viewer']:
            return Response(
                {"error": "El rol debe ser 'admin', 'member' o 'viewer'"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            target_user = User.objects.get(id=user_id)

            if not request.user.organization or not target_user.organization:
                return Response(
                    {"error": "No se encontró la organización del usuario"},
                    status=status.HTTP_404_NOT_FOUND
                )

            if target_user.organization.id != request.user.organization.id:
                return Response(
                    {"error": "No puedes modificar usuarios de otra organización"},
                    status=status.HTTP_403_FORBIDDEN
                )

            if str(target_user.id) == str(request.user.id) and new_role != 'admin':
                admins_count = User.objects(
                    organization=request.user.organization,
                    role='admin'
                ).count()
                if admins_count <= 1:
                    return Response(
                        {"error": "Debe existir al menos un administrador en la organización"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            target_user.role = new_role
            target_user.save()

            return Response(
                {
                    "message": "Rol actualizado exitosamente",
                    "member": _serialize_member(target_user)
                },
                status=status.HTTP_200_OK
            )

        except DoesNotExist:
            return Response(
                {"error": "Usuario no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Error al actualizar rol: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def delete(self, request, user_id):
        if request.user.role != 'admin':
            return Response(
                {"error": "Solo los administradores pueden remover miembros"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            target_user = User.objects.get(id=user_id)

            if not request.user.organization or not target_user.organization:
                return Response(
                    {"error": "No se encontró la organización del usuario"},
                    status=status.HTTP_404_NOT_FOUND
                )

            if target_user.organization.id != request.user.organization.id:
                return Response(
                    {"error": "No puedes remover usuarios de otra organización"},
                    status=status.HTTP_403_FORBIDDEN
                )

            if str(target_user.id) == str(request.user.id):
                return Response(
                    {"error": "No puedes removerte a ti mismo de la organización"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if target_user.role == 'admin':
                admins_count = User.objects(
                    organization=request.user.organization,
                    role='admin'
                ).count()
                if admins_count <= 1:
                    return Response(
                        {"error": "No puedes remover al último administrador"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            target_user.organization = None
            target_user.role = 'member'
            target_user.save()

            return Response(
                {"message": "Miembro removido exitosamente"},
                status=status.HTTP_200_OK
            )

        except DoesNotExist:
            return Response(
                {"error": "Usuario no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Error al remover miembro: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
