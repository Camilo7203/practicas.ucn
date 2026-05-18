"""
Vista para crear templates de WhatsApp Business
"""
import requests
import os
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import logging


logger = logging.getLogger(__name__)

@api_view(['POST'])
def create_whatsapp_template(request):
    """
    Endpoint para crear templates de WhatsApp en Meta API
    """
    try:
        # Extraer datos del request
        template_data = request.data
        
        # Validar que existan los campos requeridos en el request
        required_fields = ['organization_id', 'agent_id', 'template_to_create']
        for field in required_fields:
            if field not in template_data:
                return Response({
                    'success': False,
                    'error': f'El campo {field} es requerido'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # URL del webhook proporcionada en el request
        webhook_url = "https://e99e2d3a9e87.ngrok-free.app/api/whatsapp/create-template"
        
        # Headers para el request
        headers = {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
        }
        
        # Hacer el POST al webhook
        logger.info("Enviando template a webhook: %s", webhook_url)
        logger.info("Payload: %s", template_data)
        
        response = requests.post(
            webhook_url,
            json=template_data,
            headers=headers,
            timeout=30
        )
        
        logger.info("Respuesta del webhook: %s", response.status_code)
        logger.info("Contenido: %s", response.text)
        
        if response.status_code in [200, 201]:
            return Response({
                'success': True,
                'data': response.json() if response.content else {},
                'message': 'Template enviado al webhook exitosamente'
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'success': False,
                'error': f'Error del webhook: {response.text}',
                'status_code': response.status_code
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except requests.exceptions.Timeout:
        return Response({
            'success': False,
            'error': 'Timeout al conectar con el webhook'
        }, status=status.HTTP_408_REQUEST_TIMEOUT)
    except requests.exceptions.RequestException as e:
        return Response({
            'success': False,
            'error': f'Error de conexión con el webhook: {str(e)}'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error interno del servidor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)