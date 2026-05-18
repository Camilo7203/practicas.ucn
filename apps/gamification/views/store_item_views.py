from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from apps.users.permissions.authentication import CustomJWTAuthentication
from core.shared.models.points.stores.store_item import StoreItem
from apps.gamification.serializers.store_serializers import StoreItemSerializer
from mongoengine.errors import DoesNotExist, ValidationError
import traceback
import logging


logger = logging.getLogger(__name__)

class StoreItemListAPIView(APIView):
    """List all store items"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request):
        """Get all store items"""
        try:
            items = StoreItem.objects.all()
            
            serializer = StoreItemSerializer(items, many=True)
            items_data = serializer.data

            return Response({
                "items": items_data,
                "total": len(items_data)
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error listing store items: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": "Error al obtener los artículos",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StoreItemCreateAPIView(APIView):
    """Create a new store item"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def post(self, request):
        """Create a new store item"""
        try:
            serializer = StoreItemSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    "error": "Datos inválidos",
                    "details": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

            item = serializer.create(serializer.validated_data)
            
            return Response({
                "message": "Artículo creado exitosamente",
                "item": StoreItemSerializer(item).data
            }, status=status.HTTP_201_CREATED)

        except ValidationError as e:
            return Response({
                "error": "Error de validación",
                "detail": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error creating store item: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": "Error al crear el artículo",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StoreItemDetailAPIView(APIView):
    """Get, update or delete a specific store item"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request, item_id):
        """Get store item details"""
        try:
            item = StoreItem.objects.get(id=item_id)
            
            serializer = StoreItemSerializer(item)
            return Response({
                "item": serializer.data
            }, status=status.HTTP_200_OK)

        except DoesNotExist:
            return Response({
                "error": "Artículo no encontrado"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error getting store item: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": "Error al obtener el artículo",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, item_id):
        """Update store item"""
        try:
            item = StoreItem.objects.get(id=item_id)

            serializer = StoreItemSerializer(item, data=request.data, partial=True)
            if not serializer.is_valid():
                return Response({
                    "error": "Datos inválidos",
                    "details": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

            updated_item = serializer.update(item, serializer.validated_data)
            
            return Response({
                "message": "Artículo actualizado exitosamente",
                "item": StoreItemSerializer(updated_item).data
            }, status=status.HTTP_200_OK)

        except DoesNotExist:
            return Response({
                "error": "Artículo no encontrado"
            }, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as e:
            return Response({
                "error": "Error de validación",
                "detail": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error updating store item: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": "Error al actualizar el artículo",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, item_id):
        """Delete store item"""
        try:
            item = StoreItem.objects.get(id=item_id)
            item.delete()
            
            return Response({
                "message": "Artículo eliminado exitosamente"
            }, status=status.HTTP_200_OK)

        except DoesNotExist:
            return Response({
                "error": "Artículo no encontrado"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error deleting store item: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": "Error al eliminar el artículo",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
