from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from apps.users.permissions.authentication import CustomJWTAuthentication
from core.shared.models.tags.tag import Tag
from core.shared.models.users.activist import Activist
from apps.gamification.serializers.tag_serializers import (
    TagSerializer, 
    TagCreateSerializer, 
    BulkTagAssignSerializer,
    ActivistTagsSerializer
)
from mongoengine.errors import DoesNotExist, ValidationError
from bson import ObjectId
import traceback
import logging


logger = logging.getLogger(__name__)

class TagListAPIView(APIView):
    """List all tags for an organization"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request):
        """Get all tags for the user's organization"""
        try:
            if not request.user.organization:
                return Response({
                    "error": "Usuario no pertenece a ninguna organización",
                    "tags": []
                }, status=status.HTTP_400_BAD_REQUEST)

            organization_id = request.user.organization.id
            
            # Get all activists from the organization
            activists = Activist.objects(organization=organization_id)
            activist_ids = [activist.id for activist in activists]
            
            # Get all tags for these activists
            tags = Tag.objects(activist__in=activist_ids, is_active=True)
            
            serializer = TagSerializer(tags, many=True)
            tags_data = serializer.data

            return Response({
                "tags": tags_data,
                "total": len(tags_data)
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error listing tags: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": "Error al obtener los tags",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TagCreateAPIView(APIView):
    """Create/assign a tag to an activist"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def post(self, request):
        """Assign a tag to an activist"""
        try:
            if not request.user.organization:
                return Response({
                    "error": "Usuario no pertenece a ninguna organización"
                }, status=status.HTTP_400_BAD_REQUEST)

            serializer = TagCreateSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    "error": "Datos inválidos",
                    "details": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

            activist = serializer.validated_data['activist_id']
            tag_name = serializer.validated_data['tag']
            
            # Verify activist belongs to user's organization
            if str(activist.organization.id) != str(request.user.organization.id):
                return Response({
                    "error": "No tienes permiso para asignar tags a este activista"
                }, status=status.HTTP_403_FORBIDDEN)

            # Create the tag
            tag = Tag(activist=activist, tag=tag_name, is_active=True)
            tag.save()
            
            return Response({
                "message": "Tag asignado exitosamente",
                "tag": TagSerializer(tag).data
            }, status=status.HTTP_201_CREATED)

        except ValidationError as e:
            return Response({
                "error": "Error de validación",
                "detail": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error creating tag: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": "Error al asignar el tag",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TagDetailAPIView(APIView):
    """Get, update or delete a specific tag"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request, tag_id):
        """Get tag details"""
        try:
            tag = Tag.objects.get(id=tag_id)
            
            # Verify tag belongs to user's organization
            if str(tag.activist.organization.id) != str(request.user.organization.id):
                return Response({
                    "error": "No tienes permiso para ver este tag"
                }, status=status.HTTP_403_FORBIDDEN)

            serializer = TagSerializer(tag)
            return Response({
                "tag": serializer.data
            }, status=status.HTTP_200_OK)

        except DoesNotExist:
            return Response({
                "error": "Tag no encontrado"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error getting tag: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": "Error al obtener el tag",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, tag_id):
        """Delete (soft delete) a tag"""
        try:
            tag = Tag.objects.get(id=tag_id)
            
            # Verify tag belongs to user's organization
            if str(tag.activist.organization.id) != str(request.user.organization.id):
                return Response({
                    "error": "No tienes permiso para eliminar este tag"
                }, status=status.HTTP_403_FORBIDDEN)

            # Soft delete
            tag.is_active = False
            tag.save()

            return Response({
                "message": "Tag eliminado exitosamente"
            }, status=status.HTTP_200_OK)

        except DoesNotExist:
            return Response({
                "error": "Tag no encontrado"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error deleting tag: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": "Error al eliminar el tag",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ActivistTagsAPIView(APIView):
    """Get all tags for a specific activist"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request, activist_id):
        """Get all tags for an activist"""
        try:
            if not request.user.organization:
                return Response({
                    "error": "Usuario no pertenece a ninguna organización"
                }, status=status.HTTP_400_BAD_REQUEST)

            activist = Activist.objects.get(id=activist_id)
            
            # Verify activist belongs to user's organization
            if str(activist.organization.id) != str(request.user.organization.id):
                return Response({
                    "error": "No tienes permiso para ver este activista"
                }, status=status.HTTP_403_FORBIDDEN)

            # Get query parameter for including inactive tags
            include_inactive = request.query_params.get('include_inactive', 'false').lower() == 'true'
            
            # Get tags
            if include_inactive:
                tags = Tag.objects(activist=activist)
            else:
                tags = Tag.objects(activist=activist, is_active=True)

            serializer = TagSerializer(tags, many=True)
            
            return Response({
                "tags": serializer.data,
                "total": len(serializer.data)
            }, status=status.HTTP_200_OK)

        except DoesNotExist:
            return Response({
                "error": "Activista no encontrado"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error getting activist tags: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": "Error al obtener los tags del activista",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BulkTagAssignAPIView(APIView):
    """Assign a tag to multiple activists at once"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def post(self, request):
        """Bulk assign tag to activists"""
        try:
            if not request.user.organization:
                return Response({
                    "error": "Usuario no pertenece a ninguna organización"
                }, status=status.HTTP_400_BAD_REQUEST)

            serializer = BulkTagAssignSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    "error": "Datos inválidos",
                    "details": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

            activists = serializer.validated_data['activist_ids']
            tag_name = serializer.validated_data['tag']
            
            # Verify all activists belong to user's organization
            for activist in activists:
                if str(activist.organization.id) != str(request.user.organization.id):
                    return Response({
                        "error": f"No tienes permiso para asignar tags al activista {activist.id}"
                    }, status=status.HTTP_403_FORBIDDEN)

            # Assign tags
            created_count = 0
            skipped_count = 0
            errors = []

            for activist in activists:
                # Check if tag already exists
                existing_tag = Tag.objects(activist=activist, tag=tag_name, is_active=True).first()
                if existing_tag:
                    skipped_count += 1
                    continue

                try:
                    tag = Tag(activist=activist, tag=tag_name, is_active=True)
                    tag.save()
                    created_count += 1
                except Exception as e:
                    errors.append(f"Error asignando tag a {activist.id}: {str(e)}")

            return Response({
                "message": "Asignación masiva de tags completada",
                "created": created_count,
                "skipped": skipped_count,
                "errors": errors
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error bulk assigning tags: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": "Error en la asignación masiva de tags",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UniqueTagsAPIView(APIView):
    """Get list of unique tag names in the organization"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request):
        """Get unique tag names"""
        try:
            if not request.user.organization:
                return Response({
                    "error": "Usuario no pertenece a ninguna organización"
                }, status=status.HTTP_400_BAD_REQUEST)

            organization_id = request.user.organization.id
            
            # Get all activists from the organization
            activists = Activist.objects(organization=organization_id)
            activist_ids = [activist.id for activist in activists]
            
            # Get all unique tag names
            tags = Tag.objects(activist__in=activist_ids, is_active=True).distinct('tag')
            
            return Response({
                "tags": tags,
                "total": len(tags)
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error getting unique tags: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": "Error al obtener los tags únicos",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SearchActivistAPIView(APIView):
    """Search activist by ID or phone number"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request):
        """Search activist"""
        try:
            if not request.user.organization:
                return Response({
                    "error": "Usuario no pertenece a ninguna organización"
                }, status=status.HTTP_400_BAD_REQUEST)

            query = request.query_params.get('q', '').strip()
            
            if not query:
                return Response({
                    "error": "Debes proporcionar un ID o teléfono para buscar"
                }, status=status.HTTP_400_BAD_REQUEST)

            organization_id = request.user.organization.id

            # Try to find by ID first (validate if it's a valid ObjectId)
            try:
                # Check if query is a valid ObjectId
                if ObjectId.is_valid(query):
                    activist = Activist.objects.get(id=query, organization=organization_id)
                    return Response({
                        "activist": {
                            "id": str(activist.id),
                            "first_name": activist.first_name,
                            "last_name": activist.last_name,
                            "phone": activist.phone or "",
                        }
                    }, status=status.HTTP_200_OK)
            except (DoesNotExist, ValidationError):
                pass

            # Try to find by phone (if it looks like a phone number)
            if query.isdigit() or '+' in query or '-' in query or ' ' in query:
                try:
                    activist = Activist.objects.get(phone=query, organization=organization_id)
                    return Response({
                        "activist": {
                            "id": str(activist.id),
                            "first_name": activist.first_name,
                            "last_name": activist.last_name,
                            "phone": activist.phone or "",
                        }
                    }, status=status.HTTP_200_OK)
                except DoesNotExist:
                    pass

            return Response({
                "error": "Activista no encontrado"
            }, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            logger.error(f"Error searching activist: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": "Error al buscar el activista",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
