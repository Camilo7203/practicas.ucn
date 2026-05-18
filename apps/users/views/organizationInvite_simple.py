"""Unified Organization Invitation System
Sistema unificado de invitaciones de organización que requiere solo x-api-key.
Elimina duplicidades y simplifica el flujo de invitaciones.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from ..permissions.authentication import CustomJWTAuthentication
from ..permissions.permissions import HasAPIKey
from core.shared.models.users.invitation import Invitation
from core.shared.models.users.user import User
import uuid
from datetime import datetime


class OrganizationInviteView(APIView):
    """Vista para crear y obtener invitaciones de organización."""
    
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Crea una nueva invitación para unirse a la organización."""
        
        if request.user.role != 'admin':
            return Response(
                {"error": "Solo los administradores pueden crear invitaciones"},
                status=status.HTTP_403_FORBIDDEN
            )

        email = request.data.get('email')
        role = request.data.get('role', 'member')
        code = request.data.get('code')
        
        # Validar rol
        if role not in ['admin', 'member', 'viewer']:
            return Response(
                {"error": "El rol debe ser 'admin', 'member' o 'viewer'"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generar código si no se proporciona
        if not code:
            timestamp = int(datetime.now().timestamp())
            random_str = str(uuid.uuid4()).replace('-', '')[:12]
            code = f"{timestamp}-{random_str}"

        try:
            # Generar código si no se proporciona
            if not code:
                code = Invitation.generate_invitation_code()

            # Crear nueva invitación
            invitation = Invitation.create_invitation(
                role=role,
                organization=request.user.organization,
                invited_by=request.user,
                email=email
            )

            # Obtener base URL del frontend
            base_url = request.build_absolute_uri('/').rstrip('/').replace('/api', '')
            if 'https://api-app.loophack.ai/api' in base_url:
                base_url = 'http://localhost:3000'
            
            return Response(
                {
                    "message": "Invitación creada exitosamente",
                    "invitation": {
                        "code": invitation.code,
                        "email": invitation.email,
                        "role": invitation.role,
                        "invite_link": invitation.get_invite_link(base_url),
                        "expires_at": invitation.expires_at.isoformat() if invitation.expires_at else None,
                        "organization": invitation.organization.name
                    }
                },
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response(
                {"error": f"Error al crear la invitación: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def get(self, request):
        """Obtiene todas las invitaciones pendientes de la organización."""
        
        if request.user.role != 'admin':
            return Response(
                {"error": "Solo los administradores pueden ver las invitaciones"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            # Obtener invitaciones pendientes de la organización del usuario
            invitations = Invitation.objects(
                organization=request.user.organization,
                is_used=False
            ).order_by('-created_at')
            
            invitations_data = []
            for invitation in invitations:
                invitations_data.append({
                    "code": invitation.code,
                    "email": invitation.email,
                    "role": invitation.role,
                    "expires_at": invitation.expires_at.isoformat() if invitation.expires_at else None,
                    "is_expired": invitation.is_expired(),
                    "is_valid": invitation.is_valid(),
                    "created_at": invitation.created_at.isoformat() if invitation.created_at else None
                })
            
            return Response(
                {"invitations": invitations_data},
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"error": f"Error al obtener invitaciones: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class InviteDetailView(APIView):
    """Vista para obtener detalles de una invitación usando solo x-api-key."""
    
    permission_classes = [HasAPIKey]
    
    def get(self, request, code):
        """Obtiene los detalles de una invitación por código.
        
        Solo requiere x-api-key en headers.
        """
        
        try:
            # Buscar la invitación por código
            invitation = Invitation.objects(code=code).first()
            
            if not invitation:
                return Response(
                    {"error": "La invitación no existe"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Verificar si la invitación ha expirado
            if invitation.is_expired():
                return Response(
                    {"error": "La invitación ha expirado"},
                    status=status.HTTP_410_GONE
                )
            
            # Preparar los datos de respuesta
            response_data = {
                "code": invitation.code,
                "organization": {
                    "id": str(invitation.organization.pk),
                    "name": invitation.organization.name,
                    "logo": getattr(invitation.organization, 'logo', None)
                },
                "inviter": {
                    "name": invitation.invited_by.name,
                    "email": invitation.invited_by.email
                },
                "role": invitation.role,
                "email": invitation.email,  # Puede ser None
                "expires_at": invitation.expires_at.isoformat() if invitation.expires_at else None,
                "is_expired": invitation.is_expired(),
                "is_valid": invitation.is_valid(),
                "is_used": invitation.is_used
            }
            
            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": f"Error al obtener la invitación: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AcceptInviteView(APIView):
    """Vista para aceptar una invitación usando solo x-api-key."""
    
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [HasAPIKey]

    def post(self, request, code):
        """Acepta una invitación y crea/actualiza al usuario en la organización.
        
        Solo requiere x-api-key en headers y datos del usuario en el body.
        
        Body:
        {
            "name": "Nombre Usuario",
            "email": "usuario@email.com",
            "password": "password123"
        }
        """
        
        try:
            # Buscar la invitación
            invitation = Invitation.objects(code=code).first()
            
            if not invitation:
                return Response(
                    {"error": "La invitación no existe"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Verificar si la invitación es válida
            if not invitation.is_valid():
                if invitation.is_expired():
                    return Response(
                        {"error": "La invitación ha expirado"},
                        status=status.HTTP_410_GONE
                    )
                elif invitation.is_used:
                    return Response(
                        {"error": "La invitación ya ha sido utilizada"},
                        status=status.HTTP_409_CONFLICT
                    )
            
            is_authenticated_user = bool(
                request.user and getattr(request.user, 'is_authenticated', False)
            )

            if is_authenticated_user:
                user = request.user

                if invitation.email and user.email.lower() != invitation.email.lower():
                    return Response(
                        {"error": "Esta invitación fue emitida para otro correo"},
                        status=status.HTTP_403_FORBIDDEN
                    )

                if user.organization and user.organization.pk != invitation.organization.pk:
                    return Response(
                        {"error": "Este usuario ya pertenece a otra organización"},
                        status=status.HTTP_409_CONFLICT
                    )

                user.organization = invitation.organization
                user.role = invitation.role
                user.save()
            else:
                # Obtener datos del usuario del body para usuarios no autenticados
                name = request.data.get('name')
                email = request.data.get('email')
                password = request.data.get('password')

                if not all([name, email, password]):
                    return Response(
                        {"error": "Nombre, email y password son requeridos"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if invitation.email and invitation.email.lower() != str(email).lower():
                    return Response(
                        {"error": "El correo no coincide con la invitación"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Verificar si ya existe un usuario con este email
                existing_user = User.objects(email=email).first()

                if existing_user:
                    return Response(
                        {"error": "Ya existe una cuenta con este correo. Inicia sesión para aceptar la invitación."},
                        status=status.HTTP_409_CONFLICT
                    )

                # Crear nuevo usuario
                user = User(
                    userId=str(uuid.uuid4()),
                    name=name,
                    email=email,
                    organization=invitation.organization,
                    role=invitation.role,
                    is_active=True
                )
                user.set_password(password)
                user.save()
            
            # Marcar invitación como usada
            invitation.use_invitation()
            
            return Response(
                {
                    "message": "Invitación aceptada exitosamente",
                    "user": {
                        "id": str(user.pk),
                        "name": user.name,
                        "email": user.email,
                        "role": user.role
                    },
                    "organization": {
                        "id": str(invitation.organization.pk),
                        "name": invitation.organization.name,
                    }
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"error": f"Error al aceptar la invitación: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DeleteInviteView(APIView):
    """Vista para eliminar/cancelar una invitación."""
    
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request, code):
        """Elimina una invitación pendiente."""
        
        if request.user.role != 'admin':
            return Response(
                {"error": "Solo los administradores pueden eliminar invitaciones"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            # Buscar la invitación
            invitation = Invitation.objects(
                code=code,
                organization=request.user.organization
            ).first()
            
            if not invitation:
                return Response(
                    {"error": "La invitación no existe"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Eliminar la invitación
            invitation.delete()
            
            return Response(
                {"message": "Invitación eliminada exitosamente"},
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"error": f"Error al eliminar la invitación: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
