from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from apps.users.permissions.authentication import CustomJWTAuthentication
from core.shared.models.points.leagues.division import Division
from apps.gamification.serializers.league_serializers import DivisionSerializer
from mongoengine.errors import DoesNotExist, ValidationError
import traceback
import logging


logger = logging.getLogger(__name__)

class DivisionListAPIView(APIView):
    """List all divisions"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request):
        """Get all divisions"""
        try:
            divisions = Division.objects.all()
            
            serializer = DivisionSerializer(divisions, many=True)
            divisions_data = serializer.data

            return Response({
                "divisions": divisions_data,
                "total": len(divisions_data)
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error listing divisions: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": "Error al obtener las divisiones",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DivisionCreateAPIView(APIView):
    """Create a new division"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def post(self, request):
        """Create a new division"""
        try:
            serializer = DivisionSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    "error": "Datos inválidos",
                    "details": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

            division = serializer.create(serializer.validated_data)
            
            return Response({
                "message": "División creada exitosamente",
                "division": DivisionSerializer(division).data
            }, status=status.HTTP_201_CREATED)

        except ValidationError as e:
            return Response({
                "error": "Error de validación",
                "detail": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error creating division: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": "Error al crear la división",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DivisionDetailAPIView(APIView):
    """Get, update or delete a specific division"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request, division_id):
        """Get division details"""
        try:
            division = Division.objects.get(id=division_id)
            
            serializer = DivisionSerializer(division)
            return Response({
                "division": serializer.data
            }, status=status.HTTP_200_OK)

        except DoesNotExist:
            return Response({
                "error": "División no encontrada"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error getting division: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": "Error al obtener la división",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, division_id):
        """Update division"""
        try:
            division = Division.objects.get(id=division_id)

            serializer = DivisionSerializer(division, data=request.data, partial=True)
            if not serializer.is_valid():
                return Response({
                    "error": "Datos inválidos",
                    "details": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

            updated_division = serializer.update(division, serializer.validated_data)
            
            return Response({
                "message": "División actualizada exitosamente",
                "division": DivisionSerializer(updated_division).data
            }, status=status.HTTP_200_OK)

        except DoesNotExist:
            return Response({
                "error": "División no encontrada"
            }, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as e:
            return Response({
                "error": "Error de validación",
                "detail": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error updating division: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": "Error al actualizar la división",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, division_id):
        """Delete division"""
        try:
            division = Division.objects.get(id=division_id)
            division.delete()
            
            return Response({
                "message": "División eliminada exitosamente"
            }, status=status.HTTP_200_OK)

        except DoesNotExist:
            return Response({
                "error": "División no encontrada"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error deleting division: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": "Error al eliminar la división",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
