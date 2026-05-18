"""
Tag Service - Lógica de negocio para asignación y gestión de tags
"""
from core.shared.models.tags.tag import Tag
from core.shared.models.users.activist import Activist
from mongoengine.errors import DoesNotExist
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class TagService:
    """Servicio para gestionar tags de activistas"""

    @staticmethod
    def assign_tag_to_activist(activist_id: str, tag_name: str, skip_duplicates: bool = True) -> Dict[str, Any]:
        """
        Asigna un tag a un activista
        
        Args:
            activist_id: ID del activista
            tag_name: Nombre del tag
            skip_duplicates: Si True, no asigna si ya existe. Si False, lanza error
            
        Returns:
            Dict con resultado de la operación
        """
        try:
            activist = Activist.objects.get(id=activist_id)
        except DoesNotExist:
            return {
                'success': False,
                'error': 'Activista no encontrado',
                'tag': None
            }

        # Verificar si el tag ya existe
        existing_tag = Tag.objects(activist=activist, tag=tag_name, is_active=True).first()
        
        if existing_tag:
            if skip_duplicates:
                return {
                    'success': True,
                    'skipped': True,
                    'message': 'Tag ya existe para este activista',
                    'tag': existing_tag
                }
            else:
                return {
                    'success': False,
                    'error': 'Tag ya existe para este activista',
                    'tag': existing_tag
                }

        # Crear nuevo tag
        tag = Tag(activist=activist, tag=tag_name, is_active=True)
        tag.save()

        return {
            'success': True,
            'created': True,
            'message': 'Tag asignado exitosamente',
            'tag': tag
        }

    @staticmethod
    def remove_tag_from_activist(activist_id: str, tag_name: str, hard_delete: bool = False) -> Dict[str, Any]:
        """
        Remueve un tag de un activista
        
        Args:
            activist_id: ID del activista
            tag_name: Nombre del tag
            hard_delete: Si True, elimina completamente. Si False, soft delete
            
        Returns:
            Dict con resultado de la operación
        """
        try:
            activist = Activist.objects.get(id=activist_id)
        except DoesNotExist:
            return {
                'success': False,
                'error': 'Activista no encontrado'
            }

        # Buscar el tag
        tag = Tag.objects(activist=activist, tag=tag_name, is_active=True).first()
        
        if not tag:
            return {
                'success': False,
                'error': 'Tag no encontrado para este activista'
            }

        if hard_delete:
            tag.delete()
        else:
            tag.is_active = False
            tag.save()

        return {
            'success': True,
            'message': 'Tag removido exitosamente'
        }

    @staticmethod
    def bulk_assign_tags(activist_ids: List[str], tag_name: str) -> Dict[str, Any]:
        """
        Asigna un tag a múltiples activistas
        
        Args:
            activist_ids: Lista de IDs de activistas
            tag_name: Nombre del tag a asignar
            
        Returns:
            Dict con resumen de la operación
        """
        results = {
            'total': len(activist_ids),
            'created': 0,
            'skipped': 0,
            'errors': []
        }

        for activist_id in activist_ids:
            result = TagService.assign_tag_to_activist(activist_id, tag_name, skip_duplicates=True)
            
            if result['success']:
                if result.get('created'):
                    results['created'] += 1
                elif result.get('skipped'):
                    results['skipped'] += 1
            else:
                results['errors'].append({
                    'activist_id': activist_id,
                    'error': result.get('error', 'Error desconocido')
                })

        return results

    @staticmethod
    def get_activist_tags(activist_id: str, include_inactive: bool = False) -> List[Tag]:
        """
        Obtiene todos los tags de un activista
        
        Args:
            activist_id: ID del activista
            include_inactive: Si True, incluye tags inactivos
            
        Returns:
            Lista de tags
        """
        try:
            activist = Activist.objects.get(id=activist_id)
        except DoesNotExist:
            return []

        if include_inactive:
            tags = Tag.objects(activist=activist)
        else:
            tags = Tag.objects(activist=activist, is_active=True)

        return list(tags)

    @staticmethod
    def get_activists_by_tag(tag_name: str, organization_id: str) -> List[Activist]:
        """
        Obtiene todos los activistas que tienen un tag específico
        
        Args:
            tag_name: Nombre del tag
            organization_id: ID de la organización
            
        Returns:
            Lista de activistas
        """
        # Buscar todos los tags activos con ese nombre
        tags = Tag.objects(tag=tag_name, is_active=True)
        
        # Filtrar activistas por organización
        activists = []
        for tag in tags:
            if str(tag.activist.organization.id) == str(organization_id):
                activists.append(tag.activist)

        return activists

    @staticmethod
    def process_survey_answers(activist_id: str, answers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Procesa respuestas de survey/quiz y asigna tags automáticamente
        
        Args:
            activist_id: ID del activista
            answers: Lista de respuestas con estructura:
                     [{'question_id': '...', 'answer': '...', 'tag': '...'}, ...]
            
        Returns:
            Dict con resumen de tags asignados
        """
        results = {
            'tags_assigned': [],
            'tags_skipped': [],
            'errors': []
        }

        for answer in answers:
            tag_name = answer.get('tag')
            
            # Solo procesar si la respuesta tiene un tag asociado
            if not tag_name:
                continue

            result = TagService.assign_tag_to_activist(activist_id, tag_name, skip_duplicates=True)
            
            if result['success']:
                if result.get('created'):
                    results['tags_assigned'].append(tag_name)
                elif result.get('skipped'):
                    results['tags_skipped'].append(tag_name)
            else:
                results['errors'].append({
                    'tag': tag_name,
                    'error': result.get('error', 'Error desconocido')
                })

        return results

    @staticmethod
    def get_unique_tags_for_organization(organization_id: str) -> List[str]:
        """
        Obtiene lista única de nombres de tags en una organización
        
        Args:
            organization_id: ID de la organización
            
        Returns:
            Lista de nombres de tags únicos
        """
        # Obtener todos los activistas de la organización
        activists = Activist.objects(organization=organization_id)
        activist_ids = [activist.id for activist in activists]
        
        # Obtener tags únicos
        unique_tags = Tag.objects(activist__in=activist_ids, is_active=True).distinct('tag')
        
        return unique_tags

    @staticmethod
    def filter_activists_by_tags(
        organization_id: str,
        tag_names: List[str],
        match_all: bool = False
    ) -> List[Activist]:
        """
        Filtra activistas por tags
        
        Args:
            organization_id: ID de la organización
            tag_names: Lista de nombres de tags
            match_all: Si True, el activista debe tener TODOS los tags.
                      Si False, debe tener AL MENOS UNO
            
        Returns:
            Lista de activistas que cumplen el criterio
        """
        activists = Activist.objects(organization=organization_id, is_active=True)
        
        if not tag_names:
            return list(activists)

        filtered_activists = []

        for activist in activists:
            # Obtener tags del activista
            activist_tags = Tag.objects(activist=activist, is_active=True).distinct('tag')
            
            if match_all:
                # El activista debe tener TODOS los tags
                if all(tag in activist_tags for tag in tag_names):
                    filtered_activists.append(activist)
            else:
                # El activista debe tener AL MENOS UNO de los tags
                if any(tag in activist_tags for tag in tag_names):
                    filtered_activists.append(activist)

        return filtered_activists

    @staticmethod
    def check_auto_removal_rules(activist_id: str) -> Dict[str, Any]:
        """
        Verifica y aplica reglas de auto-eliminación de tags
        
        Esta función puede ser llamada periódicamente o cuando ocurren eventos específicos
        
        Args:
            activist_id: ID del activista
            
        Returns:
            Dict con resumen de tags removidos
        """
        # Placeholder para implementación futura de reglas de auto-eliminación
        # Aquí se pueden implementar reglas como:
        # - Expiración por fecha
        # - Remoción basada en acciones del activista
        # - Remoción basada en condiciones específicas
        
        results = {
            'tags_removed': [],
            'message': 'Función de auto-eliminación por implementar'
        }
        
        return results
