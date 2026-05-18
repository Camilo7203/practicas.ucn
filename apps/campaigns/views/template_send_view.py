"""
Vista para enviar mensajes de plantillas de WhatsApp usando la API de Meta
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from apps.users.permissions.authentication import CustomJWTAuthentication
from core.shared.models.agents.agent import Agent
from core.shared.models.templates.blacklist import BlackList
import requests
import os
from typing import Dict, List, Any


def _resolve_agent_for_request(request, agent_provider_id: str):
    organization = getattr(request.user, "organization", None)
    if organization is None or not agent_provider_id:
        return None

    return Agent.objects(
        organization=organization,
        provider="whatsapp",
        provider_id=agent_provider_id,
    ).first()


def _is_phone_blocked(request, phone: str, agent_provider_id: str) -> bool:
    organization = getattr(request.user, "organization", None)
    if organization is None or not phone:
        return False

    agent = _resolve_agent_for_request(request, agent_provider_id)
    return BlackList.is_number_blocked(
        organization=organization,
        number=phone,
        agent=agent,
        provider="whatsapp",
    )


class TemplateSendAPIView(APIView):
    """
    API View para enviar mensajes usando plantillas de WhatsApp
    
    Formato del body esperado (basado en los ejemplos proporcionados):
    {
        "meta_body": {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": "57XXXXXXXXXX",
            "type": "template",
            "template": {
                "name": "nombre_plantilla",
                "language": {"code": "es_CO"},
                "components": [
                    {
                        "type": "HEADER",
                        "parameters": [...]
                    },
                    {
                        "type": "BODY",
                        "parameters": [...]
                    },
                    {
                        "type": "button",
                        "sub_type": "quick_reply",
                        "index": "0",
                        "parameters": [...]
                    }
                ]
            }
        },
        "agent_provider_id": "839066315952659",
        "phone": "57XXXXXXXXXX",
        "organization_id": "68ce063786003b3788df5a59"
    }
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]
    
    def post(self, request):
        """
        Envía un mensaje usando una plantilla de WhatsApp
        """
        try:
            # Extraer datos del request
            meta_body = request.data.get('meta_body', {})
            agent_provider_id = request.data.get('agent_provider_id')
            phone = request.data.get('phone')
            organization_id = request.data.get('organization_id')
            
            # Validar datos requeridos
            if not meta_body:
                return Response({
                    'success': False,
                    'error': 'El campo meta_body es requerido'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not agent_provider_id:
                return Response({
                    'success': False,
                    'error': 'El campo agent_provider_id es requerido'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not phone:
                return Response({
                    'success': False,
                    'error': 'El campo phone es requerido'
                }, status=status.HTTP_400_BAD_REQUEST)

            if _is_phone_blocked(request, phone, agent_provider_id):
                return Response({
                    'success': True,
                    'skipped': True,
                    'message': 'Número omitido por blacklist',
                    'phone': phone,
                    'organization_id': organization_id
                }, status=status.HTTP_200_OK)
            
            # Obtener token de acceso desde variables de entorno o configuración
            # En producción, esto debería venir de la configuración del agente
            access_token = os.getenv('WHATSAPP_ACCESS_TOKEN')
            
            if not access_token:
                return Response({
                    'success': False,
                    'error': 'Token de acceso no configurado'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Construir URL de la API de Meta
            # La URL usa el Phone Number ID del agente
            api_url = f"https://graph.facebook.com/v21.0/{agent_provider_id}/messages"
            
            # Headers para la petición
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {access_token}'
            }
            
            # Enviar el mensaje a la API de Meta
            response = requests.post(
                api_url,
                json=meta_body,
                headers=headers,
                timeout=30
            )
            
            # Procesar respuesta
            if response.status_code == 200:
                response_data = response.json()
                return Response({
                    'success': True,
                    'data': response_data,
                    'message': 'Mensaje enviado exitosamente',
                    'meta_message_id': response_data.get('messages', [{}])[0].get('id'),
                    'phone': phone,
                    'organization_id': organization_id
                }, status=status.HTTP_200_OK)
            else:
                error_data = response.json()
                return Response({
                    'success': False,
                    'error': error_data.get('error', {}).get('message', 'Error al enviar mensaje'),
                    'error_code': error_data.get('error', {}).get('code'),
                    'meta_response': error_data
                }, status=response.status_code)
                
        except requests.exceptions.Timeout:
            return Response({
                'success': False,
                'error': 'Timeout al conectar con la API de WhatsApp'
            }, status=status.HTTP_504_GATEWAY_TIMEOUT)
        
        except requests.exceptions.RequestException as e:
            return Response({
                'success': False,
                'error': f'Error de conexión: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Error interno: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BulkTemplateSendAPIView(APIView):
    """
    API View para envío masivo de mensajes usando plantillas de WhatsApp
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]
    
    def post(self, request):
        """
        Envía mensajes masivos usando una plantilla
        
        Body esperado:
        {
            "template_name": "cta_usme_t1",
            "language_code": "es_CO",
            "agent_provider_id": "839066315952659",
            "organization_id": "68ce063786003b3788df5a59",
            "recipients": [
                {
                    "phone": "57XXXXXXXXXX",
                    "parameters": {
                        "HEADER": [...],
                        "BODY": [
                            {
                                "type": "text",
                                "parameter_name": "name",
                                "text": "Juan Pérez"
                            }
                        ],
                        "buttons": [...]
                    }
                }
            ]
        }
        """
        try:
            template_name = request.data.get('template_name')
            language_code = request.data.get('language_code')
            agent_provider_id = request.data.get('agent_provider_id')
            organization_id = request.data.get('organization_id')
            recipients = request.data.get('recipients', [])
            
            # Validaciones
            if not all([template_name, language_code, agent_provider_id, recipients]):
                return Response({
                    'success': False,
                    'error': 'Faltan campos requeridos: template_name, language_code, agent_provider_id, recipients'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not isinstance(recipients, list) or len(recipients) == 0:
                return Response({
                    'success': False,
                    'error': 'recipients debe ser una lista con al menos un destinatario'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Obtener token de acceso
            access_token = os.getenv('WHATSAPP_ACCESS_TOKEN')
            if not access_token:
                return Response({
                    'success': False,
                    'error': 'Token de acceso no configurado'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # URL de la API
            api_url = f"https://graph.facebook.com/v21.0/{agent_provider_id}/messages"
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {access_token}'
            }
            
            # Resultados del envío
            results = {
                'success': [],
                'failed': [],
                'skipped': [],
                'total': len(recipients),
                'sent': 0,
                'errors': 0,
                'skipped_count': 0
            }
            
            # Enviar a cada destinatario
            for recipient in recipients:
                phone = recipient.get('phone')
                parameters = recipient.get('parameters', {})
                
                if not phone:
                    results['failed'].append({
                        'error': 'Falta el número de teléfono',
                        'recipient': recipient
                    })
                    results['errors'] += 1
                    continue

                if _is_phone_blocked(request, phone, agent_provider_id):
                    results['skipped'].append({
                        'phone': phone,
                        'reason': 'Número en blacklist'
                    })
                    results['skipped_count'] += 1
                    continue
                
                # Construir el body para Meta
                meta_body = self._build_meta_body(
                    phone=phone,
                    template_name=template_name,
                    language_code=language_code,
                    parameters=parameters
                )
                
                # Enviar mensaje
                try:
                    response = requests.post(
                        api_url,
                        json=meta_body,
                        headers=headers,
                        timeout=30
                    )
                    
                    if response.status_code == 200:
                        response_data = response.json()
                        results['success'].append({
                            'phone': phone,
                            'meta_message_id': response_data.get('messages', [{}])[0].get('id'),
                            'status': 'sent'
                        })
                        results['sent'] += 1
                    else:
                        error_data = response.json()
                        results['failed'].append({
                            'phone': phone,
                            'error': error_data.get('error', {}).get('message', 'Error desconocido'),
                            'error_code': error_data.get('error', {}).get('code')
                        })
                        results['errors'] += 1
                
                except Exception as e:
                    results['failed'].append({
                        'phone': phone,
                        'error': str(e)
                    })
                    results['errors'] += 1
            
            return Response({
                'success': True,
                'results': results,
                'message': f'Envío completado: {results["sent"]} exitosos, {results["errors"]} fallidos, {results["skipped_count"]} omitidos'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Error interno: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _build_meta_body(
        self,
        phone: str,
        template_name: str,
        language_code: str,
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Construye el body en el formato que espera Meta
        """
        # Estructura base
        meta_body = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": language_code},
                "components": []
            }
        }
        
        # Agregar componente header si existe
        if parameters.get("HEADER"):
            meta_body['template']['components'].append({
                "type": "HEADER",
                "parameters": parameters["HEADER"]
            })
        
        # Agregar componente body si existe
        if parameters.get("BODY"):
            meta_body['template']['components'].append({
                "type": "BODY",
                "parameters": parameters["BODY"]
            })
        
        # Agregar botones si existen
        if parameters.get("BUTTONS"):
            for button in parameters["BUTTONS"]:
                meta_body['template']['components'].append(button)
        
        return meta_body


class TemplateMessageBuilderAPIView(APIView):
    """
    API View auxiliar para construir el formato correcto de mensajes de plantilla
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]
    
    def post(self, request):
        """
        Construye el formato correcto para enviar un mensaje de plantilla
        
        Entrada simplificada:
        {
            "template_name": "cta_usme_t1",
            "language_code": "es_CO",
            "phone": "573001234567",
            "agent_provider_id": "839066315952659",
            "organization_id": "68ce063786003b3788df5a59",
            "HEADER": {
                "type": "video|image|document",
                "link": "https://..."
            },
            "body_variables": {
                "name": "Juan Pérez"
            },
            "buttons": [
                {
                    "index": "0",
                    "payload": "¡Confirmo!"
                },
                {
                    "index": "1",
                    "payload": "Esta vez no puedo"
                }
            ]
        }
        
        Salida: Formato completo para usar en TemplateSendAPIView
        """
        try:
            template_name = request.data.get('template_name')
            language_code = request.data.get('language_code')
            phone = request.data.get('phone')
            agent_provider_id = request.data.get('agent_provider_id')
            organization_id = request.data.get('organization_id')
            header = request.data.get("HEADER")
            body_variables = request.data.get('body_variables', {})
            buttons = request.data.get("BUTTONS", [])
            
            # Validar campos requeridos
            if not all([template_name, language_code, phone, agent_provider_id]):
                return Response({
                    'success': False,
                    'error': 'Faltan campos requeridos'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Construir componentes
            components = []
            
            # Header (si existe)
            if header:
                header_component = {
                    "type": "HEADER",
                    "parameters": []
                }
                
                if header.get('type') in ['image', 'video', 'document']:
                    header_component['parameters'].append({
                        "type": header['type'],
                        header['type']: {
                            "link": header.get('link')
                        }
                    })
                
                components.append(header_component)
            
            # Body (si hay variables)
            if body_variables:
                body_component = {
                    "type": "BODY",
                    "parameters": []
                }
                
                for param_name, param_value in body_variables.items():
                    body_component['parameters'].append({
                        "type": "text",
                        "parameter_name": param_name,
                        "text": param_value
                    })
                
                components.append(body_component)
            
            # Buttons (si existen)
            for button in buttons:
                button_component = {
                    "type": "button",
                    "sub_type": "quick_reply",
                    "index": str(button.get('index', '0')),
                    "parameters": [
                        {"type": "payload", "payload": button.get('payload', '')}
                    ]
                }
                components.append(button_component)
            
            # Construir body completo
            result = {
                "meta_body": {
                    "messaging_product": "whatsapp",
                    "recipient_type": "individual",
                    "to": phone,
                    "type": "template",
                    "template": {
                        "name": template_name,
                        "language": {"code": language_code},
                        "components": components
                    }
                },
                "agent_provider_id": agent_provider_id,
                "phone": phone,
                "organization_id": organization_id
            }
            
            return Response({
                'success': True,
                'data': result,
                'message': 'Body construido exitosamente. Usa este objeto para enviar el mensaje.'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Error al construir el mensaje: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
