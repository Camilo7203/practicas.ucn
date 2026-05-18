from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from apps.users.permissions.authentication import CustomJWTAuthentication
from core.shared.models.templates.blacklist import BlackList
from apps.campaigns.serializers.blacklist_serializers import BlackListSerializer
from mongoengine.errors import DoesNotExist, ValidationError


class BlackListListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request):
        try:
            organization = getattr(request.user, "organization", None)
            if organization is None:
                return Response({
                    "success": False,
                    "error": "Usuario no pertenece a ninguna organización",
                }, status=status.HTTP_400_BAD_REQUEST)

            agent_id = request.query_params.get("agent_id")
            active_only = request.query_params.get("active_only", "true").lower() == "true"
            provider = request.query_params.get("provider", "whatsapp")

            query = BlackList.objects(
                organization=organization,
                provider=provider,
            )

            if active_only:
                query = query.filter(active=True)

            if agent_id:
                query = query.filter(agent=agent_id)

            blacklists = list(query.order_by("-created_at"))
            serializer = BlackListSerializer(blacklists, many=True)

            return Response({
                "success": True,
                "data": serializer.data,
                "count": len(serializer.data),
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "success": False,
                "error": f"Error al obtener blacklists: {str(e)}",
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        try:
            serializer = BlackListSerializer(data=request.data, context={"request": request})
            if not serializer.is_valid():
                return Response({
                    "success": False,
                    "error": "Datos inválidos",
                    "details": serializer.errors,
                }, status=status.HTTP_400_BAD_REQUEST)

            blacklist = serializer.save()
            return Response({
                "success": True,
                "message": "Blacklist creada exitosamente",
                "data": BlackListSerializer(blacklist).data,
            }, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({
                "success": False,
                "error": str(e),
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                "success": False,
                "error": f"Error al crear blacklist: {str(e)}",
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BlackListDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def _get_blacklist(self, request, blacklist_id):
        organization = getattr(request.user, "organization", None)
        if organization is None:
            return None

        return BlackList.objects(
            id=blacklist_id,
            organization=organization,
        ).first()

    def get(self, request, blacklist_id):
        try:
            blacklist = self._get_blacklist(request, blacklist_id)
            if blacklist is None:
                return Response({
                    "success": False,
                    "error": "Blacklist no encontrada",
                }, status=status.HTTP_404_NOT_FOUND)

            return Response({
                "success": True,
                "data": BlackListSerializer(blacklist).data,
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "success": False,
                "error": f"Error al obtener blacklist: {str(e)}",
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, blacklist_id):
        try:
            blacklist = self._get_blacklist(request, blacklist_id)
            if blacklist is None:
                return Response({
                    "success": False,
                    "error": "Blacklist no encontrada",
                }, status=status.HTTP_404_NOT_FOUND)

            serializer = BlackListSerializer(
                blacklist,
                data=request.data,
                partial=True,
                context={"request": request},
            )

            if not serializer.is_valid():
                return Response({
                    "success": False,
                    "error": "Datos inválidos",
                    "details": serializer.errors,
                }, status=status.HTTP_400_BAD_REQUEST)

            updated_blacklist = serializer.save()
            return Response({
                "success": True,
                "message": "Blacklist actualizada exitosamente",
                "data": BlackListSerializer(updated_blacklist).data,
            }, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response({
                "success": False,
                "error": str(e),
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                "success": False,
                "error": f"Error al actualizar blacklist: {str(e)}",
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, blacklist_id):
        try:
            blacklist = self._get_blacklist(request, blacklist_id)
            if blacklist is None:
                return Response({
                    "success": False,
                    "error": "Blacklist no encontrada",
                }, status=status.HTTP_404_NOT_FOUND)

            blacklist.delete()
            return Response({
                "success": True,
                "message": "Blacklist eliminada exitosamente",
            }, status=status.HTTP_200_OK)
        except DoesNotExist:
            return Response({
                "success": False,
                "error": "Blacklist no encontrada",
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                "success": False,
                "error": f"Error al eliminar blacklist: {str(e)}",
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
