from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from apps.users.permissions.authentication import CustomJWTAuthentication
from core.shared.models.points.leagues.league import League
from core.shared.models.users.activist import Activist
from apps.gamification.serializers.league_serializers import LeagueSerializer
from mongoengine.errors import DoesNotExist, ValidationError
import traceback
import logging


logger = logging.getLogger(__name__)

class LeagueListAPIView(APIView):
    """List all leagues for an organization"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request):
        """Get all leagues for the user's organization"""
        try:
            if not request.user.organization:
                return Response({
                    "error": "Usuario no pertenece a ninguna organización",
                    "leagues": []
                }, status=status.HTTP_400_BAD_REQUEST)

            organization_id = request.user.organization.id
            leagues = League.objects(organization=organization_id)
            
            serializer = LeagueSerializer(leagues, many=True)
            leagues_data = serializer.data

            return Response({
                "leagues": leagues_data,
                "total": len(leagues_data)
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error listing leagues: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": "Error al obtener las ligas",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LeagueCreateAPIView(APIView):
    """Create a new league"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def post(self, request):
        """Create a new league"""
        try:
            if not request.user.organization:
                return Response({
                    "error": "Usuario no pertenece a ninguna organización"
                }, status=status.HTTP_400_BAD_REQUEST)

            data = request.data.copy()
            data['organization'] = str(request.user.organization.id)

            serializer = LeagueSerializer(data=data)
            if not serializer.is_valid():
                return Response({
                    "error": "Datos inválidos",
                    "details": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

            league = serializer.create(serializer.validated_data)
            
            return Response({
                "message": "Liga creada exitosamente",
                "league": LeagueSerializer(league).data
            }, status=status.HTTP_201_CREATED)

        except ValidationError as e:
            return Response({
                "error": "Error de validación",
                "detail": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error creating league: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": "Error al crear la liga",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LeagueDetailAPIView(APIView):
    """Get, update or delete a specific league"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request, league_id):
        """Get league details"""
        try:
            league = League.objects.get(id=league_id)
            
            if str(league.organization.id) != str(request.user.organization.id):
                return Response({
                    "error": "No tienes permiso para acceder a esta liga"
                }, status=status.HTTP_403_FORBIDDEN)

            serializer = LeagueSerializer(league)
            return Response({
                "league": serializer.data
            }, status=status.HTTP_200_OK)

        except DoesNotExist:
            return Response({
                "error": "Liga no encontrada"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error getting league: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": "Error al obtener la liga",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, league_id):
        """Update league"""
        try:
            league = League.objects.get(id=league_id)
            
            if str(league.organization.id) != str(request.user.organization.id):
                return Response({
                    "error": "No tienes permiso para modificar esta liga"
                }, status=status.HTTP_403_FORBIDDEN)

            data = request.data.copy()
            if 'organization' not in data:
                data['organization'] = str(request.user.organization.id)

            serializer = LeagueSerializer(league, data=data, partial=True)
            if not serializer.is_valid():
                return Response({
                    "error": "Datos inválidos",
                    "details": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

            updated_league = serializer.update(league, serializer.validated_data)
            
            return Response({
                "message": "Liga actualizada exitosamente",
                "league": LeagueSerializer(updated_league).data
            }, status=status.HTTP_200_OK)

        except DoesNotExist:
            return Response({
                "error": "Liga no encontrada"
            }, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as e:
            return Response({
                "error": "Error de validación",
                "detail": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error updating league: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": "Error al actualizar la liga",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, league_id):
        """Delete league"""
        try:
            league = League.objects.get(id=league_id)
            
            if str(league.organization.id) != str(request.user.organization.id):
                return Response({
                    "error": "No tienes permiso para eliminar esta liga"
                }, status=status.HTTP_403_FORBIDDEN)

            league.delete()
            
            return Response({
                "message": "Liga eliminada exitosamente"
            }, status=status.HTTP_200_OK)

        except DoesNotExist:
            return Response({
                "error": "Liga no encontrada"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error deleting league: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": "Error al eliminar la liga",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LeagueRankingAPIView(APIView):
    """Get ranking of activists in a league"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request, league_id):
        """Get activists ranking for a league"""
        try:
            # Get league
            league = League.objects.get(id=league_id)
            
            if str(league.organization.id) != str(request.user.organization.id):
                return Response({
                    "error": "No tienes permiso para acceder a este ranking"
                }, status=status.HTTP_403_FORBIDDEN)

            # Get all activists in the organization
            activists = Activist.objects(organization=request.user.organization.id)
            
            # Get points for each activist in this league
            ranking_data = []
            
            for activist in activists:
                try:
                    # TODO: Implement actual points calculation
                    # For now, return 0 points as placeholder
                    # Points will be calculated from the actual points system
                    points = 0
                    
                    ranking_data.append({
                        "id": str(activist.id),
                        "first_name": activist.first_name,
                        "last_name": activist.last_name,
                        "phone": activist.phone,
                        "points": points,
                        "division": {
                            "name": getattr(activist, 'division', {}).name if hasattr(getattr(activist, 'division', None), 'name') else None
                        } if hasattr(activist, 'division') else None
                    })
                except Exception as e:
                    logger.error(f"Error processing activist {activist.id}: {str(e)}")
                    # Continue with next activist if there's an error
                    continue
            
            # Sort by points descending
            ranking_data.sort(key=lambda x: x['points'], reverse=True)
            
            return Response({
                "activists": ranking_data,
                "league": LeagueSerializer(league).data
            }, status=status.HTTP_200_OK)

        except DoesNotExist:
            return Response({
                "error": "Liga no encontrada"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error getting ranking: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": "Error al obtener el ranking",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

