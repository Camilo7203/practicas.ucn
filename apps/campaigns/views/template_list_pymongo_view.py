"""
Vista para listar y consultar templates de WhatsApp desde MongoDB usando PyMongo
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny  # Cambiando temporalmente para testing
from pymongo import MongoClient
from bson import ObjectId
from typing import Dict, List, Any
import os
import logging
from datetime import datetime
from core.shared.models.agents.agent import Agent

logger = logging.getLogger(__name__)


class TemplateListAPIView(APIView):
    """
    API View para listar plantillas de WhatsApp
    """
    permission_classes = [AllowAny]  # Temporal para testing
    
    def __init__(self):
        super().__init__()
        self.db = self._get_mongo_connection()
    
    def _get_mongo_connection(self):
        """Obtener conexión a MongoDB"""
        try:
            mongo_user = os.getenv("MONGO_USER", "")
            mongo_password = os.getenv("MONGO_PASSWORD", "")
            mongo_host = os.getenv("MONGO_HOST", "localhost")
            mongo_db = os.getenv("MONGO_DB", "loophack")
            
            if mongo_user and mongo_password:
                mongo_uri = f"mongodb+srv://{mongo_user}:{mongo_password}@{mongo_host}/{mongo_db}"
            else:
                mongo_uri = f"mongodb://{mongo_host}:27017/{mongo_db}"
            
            client = MongoClient(mongo_uri)
            return client[mongo_db]
        except Exception as e:
            logger.error(f"Error conectando a MongoDB: {str(e)}")
            return None
    
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
            if not self.db:
                return Response({
                    'success': False,
                    'error': 'No se pudo conectar a la base de datos'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
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
            
            # Ejecutar consulta
            templates_collection = self.db.templates
            templates_cursor = templates_collection.find(query_filters).sort("created_at", -1)
            
            # Convertir a lista y formato del frontend
            templates_data = []
            for template in templates_cursor:
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
    
    def _template_to_frontend_format(self, template: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convertir plantilla de MongoDB al formato esperado por el frontend
        """
        components = []
        
        # Convertir componentes de json_to_create al formato del frontend
        json_to_create = template.get('json_to_create', {})
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
        json_to_send = template.get('json_to_send', {})
        
        if 'language' in json_to_create:
            language = json_to_create['language']
        elif 'language' in json_to_send:
            language_obj = json_to_send['language']
            if isinstance(language_obj, dict) and 'code' in language_obj:
                language = language_obj['code']
        
        # Obtener categoría
        category = json_to_create.get('category', 'MARKETING')
        
        # Obtener variables
        variables_list = []
        variable_count = 0
        template_variables = template.get('variables', {})
        
        for component_name, component_vars in template_variables.items():
            if isinstance(component_vars, dict):
                if 'variables' in component_vars:
                    for var in component_vars['variables']:
                        variables_list.append(var)
                if 'count' in component_vars:
                    variable_count += component_vars['count']
        
        # Formatear fechas
        created_at = template.get('created_at')
        updated_at = template.get('updated_at')
        
        if isinstance(created_at, datetime):
            created_at = created_at.isoformat()
        elif created_at and hasattr(created_at, '$date'):
            created_at = created_at['$date']
        
        if isinstance(updated_at, datetime):
            updated_at = updated_at.isoformat()
        elif updated_at and hasattr(updated_at, '$date'):
            updated_at = updated_at['$date']
        
        return {
            'id': str(template['_id']),
            'name': template.get('name', ''),
            'category': category,
            'language': language,
            'status': 'APPROVED' if template.get('active', False) else 'PENDING',
            'components': components,
            'createdAt': created_at,
            'updatedAt': updated_at,
            'provider_id': template.get('provider_id', ''),
            'variables': variables_list,
            'variable_count': variable_count,
            'organization': str(template.get('organization', '')),
            'agent': str(template.get('agent', '')),
            'json_to_send': json_to_send,
            'json_to_create': json_to_create,
        }


class TemplateDetailAPIView(APIView):
    """
    API View para obtener detalles de una plantilla específica
    """
    permission_classes = [AllowAny]  # Temporal para testing
    
    def __init__(self):
        super().__init__()
        self.db = self._get_mongo_connection()
    
    def _get_mongo_connection(self):
        """Obtener conexión a MongoDB"""
        try:
            mongo_user = os.getenv("MONGO_USER", "")
            mongo_password = os.getenv("MONGO_PASSWORD", "")
            mongo_host = os.getenv("MONGO_HOST", "localhost")
            mongo_db = os.getenv("MONGO_DB", "loophack")
            
            if mongo_user and mongo_password:
                mongo_uri = f"mongodb+srv://{mongo_user}:{mongo_password}@{mongo_host}/{mongo_db}"
            else:
                mongo_uri = f"mongodb://{mongo_host}:27017/{mongo_db}"
            
            client = MongoClient(mongo_uri)
            return client[mongo_db]
        except Exception as e:
            logger.error(f"Error conectando a MongoDB: {str(e)}")
            return None
    
    def get(self, request, template_id):
        """
        Obtiene los detalles de una plantilla específica
        """
        try:
            if not self.db:
                return Response({
                    'success': False,
                    'error': 'No se pudo conectar a la base de datos'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            try:
                template_obj_id = ObjectId(template_id)
            except:
                return Response({
                    'success': False,
                    'error': 'ID de plantilla inválido'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            templates_collection = self.db.templates
            template = templates_collection.find_one({'_id': template_obj_id})
            
            if not template:
                return Response({
                    'success': False,
                    'error': 'Plantilla no encontrada'
                }, status=status.HTTP_404_NOT_FOUND)
            
            template_data = self._template_to_frontend_format(template)
            
            return Response({
                'success': True,
                'data': template_data,
                'message': 'Plantilla encontrada'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error al obtener plantilla {template_id}: {str(e)}")
            return Response({
                'success': False,
                'error': f'Error al obtener plantilla: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _template_to_frontend_format(self, template: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convertir plantilla de MongoDB al formato esperado por el frontend
        """
        components = []
        
        # Convertir componentes de json_to_create al formato del frontend
        json_to_create = template.get('json_to_create', {})
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
        json_to_send = template.get('json_to_send', {})
        
        if 'language' in json_to_create:
            language = json_to_create['language']
        elif 'language' in json_to_send:
            language_obj = json_to_send['language']
            if isinstance(language_obj, dict) and 'code' in language_obj:
                language = language_obj['code']
        
        # Obtener categoría
        category = json_to_create.get('category', 'MARKETING')
        
        # Obtener variables
        variables_list = []
        variable_count = 0
        template_variables = template.get('variables', {})
        
        for component_name, component_vars in template_variables.items():
            if isinstance(component_vars, dict):
                if 'variables' in component_vars:
                    for var in component_vars['variables']:
                        variables_list.append(var)
                if 'count' in component_vars:
                    variable_count += component_vars['count']
        
        # Formatear fechas
        created_at = template.get('created_at')
        updated_at = template.get('updated_at')
        
        if isinstance(created_at, datetime):
            created_at = created_at.isoformat()
        elif created_at and hasattr(created_at, '$date'):
            created_at = created_at['$date']
        
        if isinstance(updated_at, datetime):
            updated_at = updated_at.isoformat()
        elif updated_at and hasattr(updated_at, '$date'):
            updated_at = updated_at['$date']
        
        return {
            'id': str(template['_id']),
            'name': template.get('name', ''),
            'category': category,
            'language': language,
            'status': 'APPROVED' if template.get('active', False) else 'PENDING',
            'components': components,
            'createdAt': created_at,
            'updatedAt': updated_at,
            'provider_id': template.get('provider_id', ''),
            'variables': variables_list,
            'variable_count': variable_count,
            'organization': str(template.get('organization', '')),
            'agent': str(template.get('agent', '')),
            'json_to_send': json_to_send,
            'json_to_create': json_to_create,
            'variables_detail': template_variables,
        }


class ApprovedTemplatesAPIView(APIView):
    """
    API View para obtener solo plantillas aprobadas (para envío de campañas)
    """
    permission_classes = [AllowAny]  # Temporal para testing
    
    def __init__(self):
        super().__init__()
        self.db = self._get_mongo_connection()
    
    def _get_mongo_connection(self):
        """Obtener conexión a MongoDB"""
        try:
            mongo_user = os.getenv("MONGO_USER", "")
            mongo_password = os.getenv("MONGO_PASSWORD", "")
            mongo_host = os.getenv("MONGO_HOST", "localhost")
            mongo_db = os.getenv("MONGO_DB", "loophack")
            
            if mongo_user and mongo_password:
                mongo_uri = f"mongodb+srv://{mongo_user}:{mongo_password}@{mongo_host}/{mongo_db}"
            else:
                mongo_uri = f"mongodb://{mongo_host}:27017/{mongo_db}"
            
            client = MongoClient(mongo_uri)
            return client[mongo_db]
        except Exception as e:
            logger.error(f"Error conectando a MongoDB: {str(e)}")
            return None
    
    def get(self, request):
        """
        Obtiene solo las plantillas aprobadas y activas para usar en campañas
        """
        try:
            if not self.db:
                return Response({
                    'success': False,
                    'error': 'No se pudo conectar a la base de datos'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
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
            
            templates_collection = self.db.templates
            templates_cursor = templates_collection.find(query_filters).sort("name", 1)
            
            # Formato simplificado para selección en campañas
            templates_data = []
            for template in templates_cursor:
                json_to_create = template.get('json_to_create', {})
                json_to_send = template.get('json_to_send', {})
                
                # Obtener idioma
                language = 'es'
                if 'language' in json_to_create:
                    language = json_to_create['language']
                elif 'language' in json_to_send:
                    language_obj = json_to_send['language']
                    if isinstance(language_obj, dict) and 'code' in language_obj:
                        language = language_obj['code']
                
                # Obtener variables
                variables_list = []
                variable_count = 0
                template_variables = template.get('variables', {})
                
                for component_vars in template_variables.values():
                    if isinstance(component_vars, dict):
                        if 'variables' in component_vars:
                            variables_list.extend(component_vars['variables'])
                        if 'count' in component_vars:
                            variable_count += component_vars['count']
                
                # Componentes simplificados
                components = []
                if 'components' in json_to_create:
                    for comp in json_to_create['components']:
                        components.append({
                            'type': comp.get('type', '').upper(),
                            'text': comp.get('text', ''),
                        })
                
                template_dict = {
                    'id': str(template['_id']),
                    'name': template.get('name', ''),
                    'category': json_to_create.get('category', 'MARKETING'),
                    'language': language,
                    'status': 'APPROVED',
                    'agent': str(template.get('agent')) if template.get('agent') else None,
                    'agent_id': str(template.get('agent')) if template.get('agent') else None,
                    'agent_name': None,
                    'provider_id': template.get('provider_id', ''),
                    'variables': variables_list,
                    'variable_count': variable_count,
                    'json_to_send': json_to_send,
                    'components': components,
                }

                agent_value = template.get('agent')
                if agent_value:
                    try:
                        agent_id_str = str(agent_value)
                        agent_obj = Agent.objects.get(id=agent_id_str)
                        template_dict['agent_name'] = getattr(agent_obj, 'name', None)
                    except Exception:
                        template_dict['agent_name'] = None

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