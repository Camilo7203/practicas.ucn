"""URLs principales del proyecto loophack
Incluye las rutas de todas las aplicaciones y configuraciones principales.
"""

from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from core.health import health_check, health_live, health_ready
import json
import logging


logger = logging.getLogger(__name__)

@csrf_exempt
@require_http_methods(["POST"])
def whatsapp_create_template(request):
    """Endpoint para crear templates de WhatsApp"""
    try:
        data = json.loads(request.body)

        logger.info(
            "WhatsApp template creation request received",
            extra={
                "organization_id": data.get("organization_id"),
                "agent_id": data.get("agent_id"),
                "template_name": data.get("template_to_create", {}).get("name"),
            },
        )
        
        # Validar campos requeridos
        required_fields = ['organization_id', 'agent_id', 'template_to_create']
        for field in required_fields:
            if field not in data:
                logger.warning("Missing required field in template request", extra={"missing_field": field})
                return JsonResponse({
                    'success': False,
                    'error': f'El campo {field} es requerido'
                }, status=400)
        
        template_data = data['template_to_create']
        
        # Validar template
        template_required = ['name', 'language', 'category', 'components']
        for field in template_required:
            if field not in template_data:
                logger.warning("Missing required template field", extra={"missing_field": field})
                return JsonResponse({
                    'success': False,
                    'error': f'El campo template_to_create.{field} es requerido'
                }, status=400)
        
        # Simular procesamiento exitoso
        response_data = {
            'success': True,
            'message': 'Template creado exitosamente',
            'template_id': f"template_{data['organization_id']}_{template_data['name']}",
            'status': 'PENDING',
            'data': {
                'organization_id': data['organization_id'],
                'agent_id': data['agent_id'],
                'template_name': template_data['name'],
                'language': template_data['language'],
                'category': template_data['category'],
                'components_count': len(template_data['components'])
            }
        }
        
        logger.info(
            "WhatsApp template created successfully",
            extra={
                "template_id": response_data.get("template_id"),
                "organization_id": data.get("organization_id"),
            },
        )
        
        return JsonResponse(response_data, status=201)
        
    except json.JSONDecodeError:
        logger.warning("Invalid JSON payload for WhatsApp template creation")
        return JsonResponse({
            'success': False,
            'error': 'JSON inválido'
        }, status=400)
    except Exception as e:
        logger.exception("Unhandled error creating WhatsApp template")
        return JsonResponse({
            'success': False,
            'error': 'Error interno del servidor'
        }, status=500)

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # Health check
    path('health/', health_check, name='health-check'),
    path('health/live', health_live, name='health-live'),
    path('health/ready', health_ready, name='health-ready'),
    
    # API base
    path('api/', include([
        # Auth endpoints (canonical prefix)
        path('auth/', include('apps.users.urls')),
        # DEPRECATED: /api/users/ is maintained for backward compatibility
        # Use /api/auth/ instead. This alias will be removed in a future version.
        path('users/', include('apps.users.urls')),
        
        path('campaigns/', include('apps.campaigns.urls')),
        path('agents/', include('apps.agents.urls')),
        path('gamification/', include('apps.gamification.urls')),
        # WhatsApp endpoints inside /api/
        path('whatsapp/create-template', whatsapp_create_template, name='whatsapp-create-template'),
    ])),
]