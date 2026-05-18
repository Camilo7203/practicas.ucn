"""Organization Registration View
Esta vista maneja el registro de nuevas organizaciones SOLO por API.
Requiere autenticación con API Key y crea automáticamente un usuario admin.
"""

import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from mongoengine.errors import DoesNotExist, ValidationError as MongoValidationError
from core.shared.models.users.organization import Organization
from ..serializers.organization_serializers import OrganizationSerializer
from ..permissions.permissions import HasAPIKey


logger = logging.getLogger(__name__)


class OrganizationRegisterView(APIView):
    """
    Vista para registro de organizaciones.
    Solo accesible por API con API Key válida.
    Crea organización + usuario admin automáticamente.
    """
    permission_classes = [HasAPIKey]

    def post(self, request):
        """Registra una nueva organización con su usuario admin.
        
        Body esperado:
        {
            "name": "Nombre de la Organización",
            "alias": "alias_unico",
            "description": "Descripción opcional",
            "segments": ["segmento1", "segmento2"],
            "admin_name": "Nombre del Admin",
            "admin_email": "admin@email.com",
            "admin_password": "password123"
        }
        """
        serializer = OrganizationSerializer(data=request.data)

        if serializer.is_valid():
            try:
                # El serializer maneja la creación de organización + admin
                organization = serializer.save()

                logger.info(
                    "Organización registrada exitosamente",
                    extra={"organization_id": str(organization.id), "alias": organization.alias},
                )
                
                # Respuesta con datos de la organización creada
                response_serializer = OrganizationSerializer(organization)
                return Response(
                    {
                        "message": "Organización y usuario admin creados exitosamente",
                        "organization": response_serializer.data
                    }, 
                    status=status.HTTP_201_CREATED
                )

            except MongoValidationError as e:
                logger.warning("Error de validación de MongoDB en organización", extra={"error": str(e)})
                return Response(
                    {"error": f"Error de validación: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            except Exception:
                logger.exception("Error en registro de organización")
                return Response(
                    {"error": "Error al registrar organización"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        logger.warning("Errores de validación en registro de organización", extra={"errors": serializer.errors})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        """Retorna el schema esperado para el registro."""
        return Response({
            "message": "Endpoint para registro de organizaciones",
            "method": "POST",
            "required_fields": {
                "name": "string (max 200 chars)",
                "alias": "string (unique, max 50 chars, alphanumeric + _ -)",
                "admin_name": "string (max 100 chars)",
                "admin_email": "email (unique)",
                "admin_password": "string (min 8 chars)"
            },
            "optional_fields": {
                "description": "string",
                "logo": "string (URL)",
                "segments": "array of strings",
                "plan": "free|basic|premium (default: free)"
            }
        })