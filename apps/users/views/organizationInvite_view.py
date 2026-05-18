"""Organization Invitation Views
Vistas para manejar el sistema de invitaciones de organización.
Solo admins pueden crear invitaciones, pero cualquiera puede aceptar con código válido.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from ..permissions.authentication import CustomJWTAuthentication
from core.shared.models.users.invitation import Invitation
from core.shared.models.users.user import User
from datetime import datetime, timedelta


class OrganizationInviteView(APIView):
    """Vista para crear y obtener invitaciones de organización."""
    
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Crea una nueva invitación para unirse a la organización.
        
        Solo usuarios con role='admin' pueden crear invitaciones.
        
        Body:
        {
            "email": "usuario@email.com" (opcional si se proporciona código),
            "role": "admin|user",
            "code": "codigo-opcional" (si se proporciona, email es opcional)
        }
        
        Si se proporciona un código personalizado, se puede omitir el email.
        El email se puede agregar luego cuando alguien use el link.
        
        Returns:
        {
            "message": "Invitación creada exitosamente",
            "invitation": {
                "code": "1234567890-abcdef123456",
                "email": "usuario@email.com" (puede ser null),
                "role": "user",
                "invite_link": "http://localhost:3000/invite/1234567890-abcdef123456",
                "expires_at": "2025-08-20T12:00:00Z"
            }
        }
        """
        if request.user.role != 'admin':
            return Response(
                {"error": "Solo los administradores pueden crear invitaciones"},
                status=status.HTTP_403_FORBIDDEN
            )

        email = request.data.get('email')
        role = request.data.get('role', 'user')
        code = request.data.get('code')  # Código opcional del frontend
        
        # Si no se proporciona código, el email es obligatorio
        if not code and not email:
            return Response(
                {"error": "Se requiere email o código personalizado"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar email si se proporciona
        if email and '@' not in email:
            return Response(
                {"error": "Email inválido"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar rol
        if role not in ['admin', 'user']:
            return Response(
                {"error": "El rol debe ser 'admin' o 'user'"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Solo verificar usuario existente si se proporciona email
        if email:
            existing_user = User.objects(email=email).first()
            if existing_user:
                return Response(
                    {"error": "Ya existe un usuario con este email"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Verificar si ya existe una invitación pendiente para este email
            existing_invitation = Invitation.objects(
                email=email,
                organization=request.user.organization,
                is_used=False
            ).first()
            
            if existing_invitation and existing_invitation.is_valid():
                return Response(
                    {"error": "Ya existe una invitación pendiente para este email"},
                    status=status.HTTP_409_CONFLICT
                )

        try:
            # Usar el código proporcionado o generar uno nuevo
            if code:
                # Verificar que el código no esté en uso
                if Invitation.objects(code=code).first():
                    return Response(
                        {"error": "El código de invitación ya está en uso"},
                        status=status.HTTP_409_CONFLICT
                    )
                invitation = Invitation(
                    code=code,
                    email=email,  # Puede ser None
                    role=role,
                    organization=request.user.organization,
                    invited_by=request.user,
                    expires_at=datetime.utcnow() + timedelta(days=7)
                )
                invitation.save()
            else:
                invitation = Invitation.create_invitation(
                    role=role,
                    organization=request.user.organization,
                    invited_by=request.user,
                    email=email
                )

            # Obtener base URL del frontend
            base_url = request.build_absolute_uri('/').rstrip('/').replace('/api', '')
            if 'https://api-app.loophack.ai/api' in base_url:
                base_url = 'http://localhost:3000'  # Frontend URL
            
            return Response(
                {
                    "message": "Invitación creada exitosamente",
                    "invitation": {
                        "code": invitation.code,
                        "email": invitation.email,  # Puede ser None
                        "role": invitation.role,
                        "invite_link": invitation.get_invite_link(base_url),
                        "expires_at": invitation.expires_at.isoformat() if hasattr(invitation.expires_at, 'isoformat') else str(invitation.expires_at),
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
        """Obtiene todas las invitaciones pendientes de la organización del usuario.
        
        Solo admins pueden ver las invitaciones.
        
        Returns:
        {
            "invitations": [
                {
                    "id": "invitation_id",
                    "code": "1234567890-abcdef123456",
                    "email": "usuario@email.com",
                    "role": "user",
                    "expires_at": "2025-08-20T12:00:00Z",
                    "created_at": "2025-08-13T12:00:00Z",
                    "invited_by": "Admin User"
                }
            ]
        }
        """
        if request.user.role != 'admin':
            return Response(
                {"error": "Solo los administradores pueden ver las invitaciones"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            invitations = Invitation.objects(
                organization=request.user.organization,
                is_used=False
            ).order_by('-created_at')
            
            invitation_list = []
            for invitation in invitations:
                invitation_data = {
                    "id": str(invitation.pk),
                    "code": invitation.code,
                    "email": invitation.email,
                    "role": invitation.role,
                    "expires_at": invitation.expires_at.isoformat(),
                    "created_at": invitation.created_at.isoformat(),
                    "invited_by": invitation.invited_by.name,
                    "is_expired": invitation.is_expired(),
                    "is_valid": invitation.is_valid()
                }
                invitation_list.append(invitation_data)
            
            return Response(
                {"invitations": invitation_list},
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"error": f"Error al obtener invitaciones: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class InviteDetailView(APIView):
    """Vista para obtener detalles de una invitación específica."""
    
    def get(self, request, code):
        """Obtiene los detalles de una invitación por código.
        
        Esta vista es pública - no requiere autenticación.
        
        Path Parameters:
            code: Código de la invitación
            
        Returns:
        {
            "organization": {
                "name": "Mi Organización",
                "logo": "https://example.com/logo.png"
            },
            "inviter": {
                "name": "Admin User",
                "email": "admin@example.com"
            },
            "role": "user",
            "expires_at": "2025-08-20T12:00:00Z",
            "is_expired": false,
            "is_valid": true
        }
        """
        try:
            invitation = Invitation.objects(code=code).first()
            
            if not invitation:
                return Response(
                    {"error": "La invitación no existe"},
                    status=status.HTTP_404_NOT_FOUND
                )

            if invitation.is_used:
                return Response(
                    {"error": "Esta invitación ya ha sido utilizada"},
                    status=status.HTTP_410_GONE
                )

            if invitation.is_expired():
                return Response(
                    {"error": "Esta invitación ha expirado"},
                    status=status.HTTP_410_GONE
                )

            return Response(
                {
                    "organization": {
                        "name": invitation.organization.name,
                        "logo": getattr(invitation.organization, 'logo', None)
                    },
                    "inviter": {
                        "name": invitation.invited_by.name,
                        "email": invitation.invited_by.email
                    },
                    "role": invitation.role,
                    "expires_at": invitation.expires_at.isoformat(),
                    "is_expired": invitation.is_expired(),
                    "is_valid": invitation.is_valid()
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"error": f"Error al obtener la invitación: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AcceptInviteView(APIView):
    """Vista para aceptar una invitación."""
    
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, code):
        """Acepta una invitación y agrega al usuario a la organización.
        
        Path Parameters:
            code: Código de la invitación
            
        Returns:
        {
            "message": "Invitación aceptada exitosamente",
            "organization": {
                "name": "Mi Organización",
                "role": "user"
            }
        }
        """
        try:
            invitation = Invitation.objects(code=code).first()
            
            if not invitation:
                return Response(
                    {"error": "La invitación no existe"},
                    status=status.HTTP_404_NOT_FOUND
                )

            if invitation.is_used:
                return Response(
                    {"error": "Esta invitación ya ha sido utilizada"},
                    status=status.HTTP_410_GONE
                )

            if invitation.is_expired():
                return Response(
                    {"error": "Esta invitación ha expirado"},
                    status=status.HTTP_410_GONE
                )

            # Verificar email solo si la invitación especifica uno
            if invitation.email and invitation.email != request.user.email:
                return Response(
                    {"error": "Esta invitación no es para tu email"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Si la invitación no tenía email específico, asignarlo ahora
            if not invitation.email:
                invitation.email = request.user.email
                invitation.save()

            # Verificar si el usuario ya pertenece a otra organización
            if request.user.organization:
                return Response(
                    {"error": "Ya perteneces a una organización"},
                    status=status.HTTP_409_CONFLICT
                )

            # Agregar usuario a la organización
            request.user.organization = invitation.organization
            request.user.role = invitation.role
            request.user.save()

            # Marcar invitación como usada
            invitation.use_invitation()

            return Response(
                {
                    "message": "Invitación aceptada exitosamente",
                    "organization": {
                        "name": invitation.organization.name,
                        "role": invitation.role
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
        """Elimina una invitación pendiente.
        
        Solo admins pueden eliminar invitaciones.
        
        Path Parameters:
            code: Código de la invitación
            
        Returns:
        {
            "message": "Invitación eliminada exitosamente"
        }
        """
        if request.user.role != 'admin':
            return Response(
                {"error": "Solo los administradores pueden eliminar invitaciones"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            invitation = Invitation.objects(
                code=code,
                organization=request.user.organization
            ).first()
            
            if not invitation:
                return Response(
                    {"error": "La invitación no existe"},
                    status=status.HTTP_404_NOT_FOUND
                )

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
