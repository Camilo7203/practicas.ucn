"""DEPRECATED - User Invitation Views
ESTAS VISTAS ESTÁN DEPRECADAS. 
Usar el sistema unificado en organizationInvite_simple.py que requiere solo x-api-key.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


class UserInvitationView(APIView):
    """DEPRECADO: Vista para invitar usuarios a una organización.
    
    MIGRAR A: OrganizationInviteView en organizationInvite_simple.py
    """

    def post(self, request):
        """DEPRECADO: Usar el sistema unificado de invitaciones."""
        return Response(
            {
                "error": "Este endpoint está deprecado",
                "message": "Usar POST /api/users/invite con x-api-key para crear invitaciones",
                "new_endpoint": "/api/users/invite",
                "required_headers": {"X-API-KEY": "tu-api-key"}
            },
            status=status.HTTP_410_GONE
        )


class UserActivationView(APIView):
    """DEPRECADO: Vista para activar cuenta de usuario invitado.
    
    MIGRAR A: AcceptInviteView en organizationInvite_simple.py
    """

    def post(self, request):
        """DEPRECADO: Usar el sistema unificado de invitaciones."""
        return Response(
            {
                "error": "Este endpoint está deprecado",
                "message": "Usar POST /api/users/invite/{code}/accept con x-api-key para aceptar invitaciones",
                "new_endpoint": "/api/users/invite/{code}/accept",
                "required_headers": {"X-API-KEY": "tu-api-key"},
                "required_body": {
                    "name": "Nombre del usuario",
                    "email": "email@ejemplo.com",
                    "password": "password123"
                }
            },
            status=status.HTTP_410_GONE
        )