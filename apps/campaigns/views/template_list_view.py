"""
Vista para listar y consultar templates de WhatsApp desde MongoDB
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from core.shared.models.templates.template import Template
from bson import ObjectId
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)


class TemplateListAPIView(APIView):
    """
    API View para listar plantillas de WhatsApp
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Lista todas las plantillas disponibles
        
        Query params:
        - organization_id: ID de la organización (opcional)
        - agent_id: ID del agente (opcional)
        - active_only: Solo plantillas activas (default: true)
        - provider: Proveedor (default: whatsapp)
        """
        try:
            # Obtener parámetros de consulta
            organization_id = request.query_params.get('organization_id')
            agent_id = request.query_params.get('agent_id')
            active_only = request.query_params.get('active_only', 'true').lower() == 'true'
            provider = request.query_params.get('provider', 'whatsapp')
            
            # Construir query
            query_filters = {'provider': provider}
            
            if organization_id:
                try:
                    query_filters['organization'] = ObjectId(organization_id)
                except:
                    return Response({
                        'success': False,
                        'error': 'ID de organización inválido'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            if agent_id:
                try:
                    query_filters['agent'] = ObjectId(agent_id)
                except:
                    return Response({
                        'success': False,
                        'error': 'ID de agente inválido'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            if active_only:
                query_filters['active'] = True
            
            # Ejecutar consulta usando MongoEngine
            templates = Template.objects.filter(**query_filters).order_by('-created_at')
            
            # Convertir a formato del frontend
            templates_data = []
            for template in templates:
                template_dict = self._template_to_frontend_format(template)
                templates_data.append(template_dict)
            
            return Response({
                'success': True,
                'data': templates_data,
                'count': len(templates_data),
                'message': f'Se encontraron {len(templates_data)} plantillas'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error al consultar plantillas: {str(e)}")
            return Response({
                'success': False,
                'error': f'Error al consultar plantillas: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _template_to_frontend_format(self, template: Template) -> Dict[str, Any]:
        """
        Convertir plantilla de MongoDB al formato esperado por el frontend
        """
        components = []
        
        # Convertir componentes de json_to_create al formato del frontend
        json_to_create = template.json_to_create or {}
        if 'components' in json_to_create:
            for comp in json_to_create['components']:
                component = {
                    'type': comp.get('type', '').upper(),
                }
                
                if comp.get('text'):
                    component['text'] = comp['text']
                
                if comp.get('format'):
                    component['format'] = comp['format']
                
                if comp.get('example'):
                    component['example'] = comp['example']
                
                components.append(component)
        
        # Obtener idioma
        language = 'es'
        json_to_send = template.json_to_send or {}
        
        if 'language' in json_to_create:
            language = json_to_create['language']
        elif 'language' in json_to_send:
            language_obj = json_to_send['language']
            if isinstance(language_obj, dict) and 'code' in language_obj:
                language = language_obj['code']
        
        # Obtener categoría
        category = 'MARKETING'
        if 'category' in json_to_create:
            category = json_to_create['category']
        
        # Obtener variables
        variables_list = []
        variable_count = 0
        template_variables = template.variables or {}
        
        for component_name, component_vars in template_variables.items():
            if isinstance(component_vars, dict):
                if 'variables' in component_vars:
                    for var in component_vars['variables']:
                        variables_list.append(var)
                if 'count' in component_vars:
                    variable_count += component_vars['count']
        
        return {
            'id': str(template.id),
            'name': template.name,
            'category': category,
            'language': language,
            'status': 'APPROVED' if template.active else 'PENDING',
            'components': components,
            'createdAt': template.created_at.isoformat() if template.created_at else None,
            'updatedAt': template.updated_at.isoformat() if template.updated_at else None,
            'provider_id': template.provider_id,
            'variables': variables_list,
            'variable_count': variable_count,
            'organization': str(template.organization.id) if template.organization else None,
            'agent': str(template.agent.id) if template.agent else None,
            'json_to_send': json_to_send,
            'json_to_create': json_to_create,
        }


class TemplateDetailAPIView(APIView):
    """
    API View para obtener detalles de una plantilla específica
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, template_id):
        """
        Obtiene los detalles de una plantilla específica
        """
        try:
            template = Template.objects.get(id=template_id)
            
            template_data = self._template_to_frontend_format(template)
            
            return Response({
                'success': True,
                'data': template_data,
                'message': 'Plantilla encontrada'
            }, status=status.HTTP_200_OK)
            
        except Template.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Plantilla no encontrada'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error al obtener plantilla {template_id}: {str(e)}")
            return Response({
                'success': False,
                'error': f'Error al obtener plantilla: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _template_to_frontend_format(self, template: Template) -> Dict[str, Any]:
        """
        Convertir plantilla de MongoDB al formato esperado por el frontend
        """
        components = []
        
        # Convertir componentes de json_to_create al formato del frontend
        json_to_create = template.json_to_create or {}
        if 'components' in json_to_create:
            for comp in json_to_create['components']:
                component = {
                    'type': comp.get('type', '').upper(),
                }
                
                if comp.get('text'):
                    component['text'] = comp['text']
                
                if comp.get('format'):
                    component['format'] = comp['format']
                
                if comp.get('example'):
                    component['example'] = comp['example']
                
                components.append(component)
        
        # Obtener idioma
        language = 'es'
        json_to_send = template.json_to_send or {}
        
        if 'language' in json_to_create:
            language = json_to_create['language']
        elif 'language' in json_to_send:
            language_obj = json_to_send['language']
            if isinstance(language_obj, dict) and 'code' in language_obj:
                language = language_obj['code']
        
        # Obtener categoría
        category = 'MARKETING'
        if 'category' in json_to_create:
            category = json_to_create['category']
        
        # Obtener variables
        variables_list = []
        variable_count = 0
        template_variables = template.variables or {}
        
        for component_name, component_vars in template_variables.items():
            if isinstance(component_vars, dict):
                if 'variables' in component_vars:
                    for var in component_vars['variables']:
                        variables_list.append(var)
                if 'count' in component_vars:
                    variable_count += component_vars['count']
        
        return {
            'id': str(template.id),
            'name': template.name,
            'category': category,
            'language': language,
            'status': 'APPROVED' if template.active else 'PENDING',
            'components': components,
            'createdAt': template.created_at.isoformat() if template.created_at else None,
            'updatedAt': template.updated_at.isoformat() if template.updated_at else None,
            'provider_id': template.provider_id,
            'variables': variables_list,
            'variable_count': variable_count,
            'organization': str(template.organization.id) if template.organization else None,
            'agent': str(template.agent.id) if template.agent else None,
            'json_to_send': json_to_send,
            'json_to_create': json_to_create,
            'variables_detail': template_variables,
        }


class ApprovedTemplatesAPIView(APIView):
    """
    API View para obtener solo plantillas aprobadas (para envío de campañas)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Obtiene solo las plantillas aprobadas y activas para usar en campañas
        """
        try:
            # Obtener parámetros
            organization_id = request.query_params.get('organization_id')
            agent_id = request.query_params.get('agent_id')
            
            # Query para plantillas activas
            query_filters = {
                'active': True,
                'provider': 'whatsapp'
            }
            
            if organization_id:
                try:
                    query_filters['organization'] = ObjectId(organization_id)
                except:
                    return Response({
                        'success': False,
                        'error': 'ID de organización inválido'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            if agent_id:
                try:
                    query_filters['agent'] = ObjectId(agent_id)
                except:
                    return Response({
                        'success': False,
                        'error': 'ID de agente inválido'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            templates = Template.objects.filter(**query_filters).order_by('name')
            
            # Formato simplificado para selección en campañas
            templates_data = []
            for template in templates:
                template_dict = {
                    'id': str(template.id),
                    'name': template.name,
                    'category': self._get_template_category(template),
                    'language': self._get_template_language(template),
                    'status': 'APPROVED',
                    'agent': str(template.agent.id) if template.agent else None,
                    'agent_id': str(template.agent.id) if template.agent else None,
                    'agent_name': getattr(template.agent, 'name', None) if template.agent else None,
                    'provider_id': template.provider_id,
                    'variables': self._get_template_variables(template),
                    'variable_count': self._get_variable_count(template),
                    'json_to_send': template.json_to_send or {},
                    'components': self._get_simplified_components(template),
                }
                templates_data.append(template_dict)
            
            return Response({
                'success': True,
                'data': templates_data,
                'count': len(templates_data),
                'message': f'Se encontraron {len(templates_data)} plantillas aprobadas'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error al consultar plantillas aprobadas: {str(e)}")
            return Response({
                'success': False,
                'error': f'Error al consultar plantillas aprobadas: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _get_template_category(self, template: Template) -> str:
        """Obtener categoría de la plantilla"""
        json_to_create = template.json_to_create or {}
        return json_to_create.get('category', 'MARKETING')
    
    def _get_template_language(self, template: Template) -> str:
        """Obtener idioma de la plantilla"""
        json_to_create = template.json_to_create or {}
        json_to_send = template.json_to_send or {}
        
        if 'language' in json_to_create:
            return json_to_create['language']
        elif 'language' in json_to_send:
            language_obj = json_to_send['language']
            if isinstance(language_obj, dict) and 'code' in language_obj:
                return language_obj['code']
        return 'es'
    
    def _get_template_variables(self, template: Template) -> List[str]:
        """Obtener lista de variables de la plantilla"""
        variables_list = []
        template_variables = template.variables or {}
        
        for component_name, component_vars in template_variables.items():
            if isinstance(component_vars, dict) and 'variables' in component_vars:
                for var in component_vars['variables']:
                    variables_list.append(var)
        return variables_list
    
    def _get_variable_count(self, template: Template) -> int:
        """Obtener número total de variables"""
        count = 0
        template_variables = template.variables or {}
        
        for component_vars in template_variables.values():
            if isinstance(component_vars, dict) and 'count' in component_vars:
                count += component_vars['count']
        return count
    
    def _get_simplified_components(self, template: Template) -> List[Dict[str, Any]]:
        """Obtener componentes en formato simplificado"""
        components = []
        json_to_create = template.json_to_create or {}
        
        if 'components' in json_to_create:
            for comp in json_to_create['components']:
                component = {
                    'type': comp.get('type', '').upper(),
                    'text': comp.get('text', ''),
                }
                components.append(component)
        return components