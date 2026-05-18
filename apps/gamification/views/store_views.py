from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from apps.users.permissions.authentication import CustomJWTAuthentication
from core.shared.models.points.stores.store import Store
from apps.gamification.serializers.store_serializers import StoreSerializer
from mongoengine.errors import DoesNotExist, ValidationError
import traceback
import logging


logger = logging.getLogger(__name__)

class StoreListAPIView(APIView):
    """List all stores for an organization"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request):
        """Get all stores for the user's organization"""
        try:
            if not request.user.organization:
                return Response({
                    "error": "Usuario no pertenece a ninguna organización",
                    "stores": []
                }, status=status.HTTP_400_BAD_REQUEST)

            organization_id = request.user.organization.id
            stores = Store.objects(organization=organization_id)
            
            serializer = StoreSerializer(stores, many=True)
            stores_data = serializer.data

            return Response({
                "stores": stores_data,
                "total": len(stores_data)
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error listing stores: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": "Error al obtener las tiendas",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StoreCreateAPIView(APIView):
    """Create a new store"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def post(self, request):
        """Create a new store"""
        try:
            if not request.user.organization:
                return Response({
                    "error": "Usuario no pertenece a ninguna organización"
                }, status=status.HTTP_400_BAD_REQUEST)

            data = request.data.copy()
            data['organization'] = str(request.user.organization.id)

            serializer = StoreSerializer(data=data)
            if not serializer.is_valid():
                return Response({
                    "error": "Datos inválidos",
                    "details": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

            store = serializer.create(serializer.validated_data)
            
            return Response({
                "message": "Tienda creada exitosamente",
                "store": StoreSerializer(store).data
            }, status=status.HTTP_201_CREATED)

        except ValidationError as e:
            return Response({
                "error": "Error de validación",
                "detail": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error creating store: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": "Error al crear la tienda",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StoreDetailAPIView(APIView):
    """Get, update or delete a specific store"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request, store_id):
        """Get store details"""
        try:
            store = Store.objects.get(id=store_id)
            
            if str(store.organization.id) != str(request.user.organization.id):
                return Response({
                    "error": "No tienes permiso para acceder a esta tienda"
                }, status=status.HTTP_403_FORBIDDEN)

            serializer = StoreSerializer(store)
            return Response({
                "store": serializer.data
            }, status=status.HTTP_200_OK)

        except DoesNotExist:
            return Response({
                "error": "Tienda no encontrada"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error getting store: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": "Error al obtener la tienda",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, store_id):
        """Update store"""
        try:
            store = Store.objects.get(id=store_id)
            
            if str(store.organization.id) != str(request.user.organization.id):
                return Response({
                    "error": "No tienes permiso para modificar esta tienda"
                }, status=status.HTTP_403_FORBIDDEN)

            data = request.data.copy()
            if 'organization' not in data:
                data['organization'] = str(request.user.organization.id)

            serializer = StoreSerializer(store, data=data, partial=True)
            if not serializer.is_valid():
                return Response({
                    "error": "Datos inválidos",
                    "details": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

            updated_store = serializer.update(store, serializer.validated_data)
            
            return Response({
                "message": "Tienda actualizada exitosamente",
                "store": StoreSerializer(updated_store).data
            }, status=status.HTTP_200_OK)

        except DoesNotExist:
            return Response({
                "error": "Tienda no encontrada"
            }, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as e:
            return Response({
                "error": "Error de validación",
                "detail": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error updating store: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": "Error al actualizar la tienda",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, store_id):
        """Delete store"""
        try:
            store = Store.objects.get(id=store_id)
            
            if str(store.organization.id) != str(request.user.organization.id):
                return Response({
                    "error": "No tienes permiso para eliminar esta tienda"
                }, status=status.HTTP_403_FORBIDDEN)

            store.delete()
            
            return Response({
                "message": "Tienda eliminada exitosamente"
            }, status=status.HTTP_200_OK)

        except DoesNotExist:
            return Response({
                "error": "Tienda no encontrada"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error    (f"Error deleting store: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": "Error al eliminar la tienda",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
