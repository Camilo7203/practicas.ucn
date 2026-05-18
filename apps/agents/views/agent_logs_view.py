from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from apps.users.permissions.authentication import CustomJWTAuthentication
from core.shared.models.agents.agent import Agent
from bson import ObjectId
from bson.errors import InvalidId

class AgentLogsAPIView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, agent_id):
        try:
            # Validar ObjectId
            if not ObjectId.is_valid(agent_id):
                return Response(
                    {"error": "ID de agente inválido"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Buscar el agente
            try:
                agent = Agent.objects.get(
                    id=ObjectId(agent_id),
                    organization=request.user.organization
                )
            except Agent.DoesNotExist:
                return Response(
                    {"error": "Agente no encontrado"}, 
                    status=status.HTTP_404_NOT_FOUND
                )

            # Obtener parámetro limit
            limit = request.GET.get('limit', 100)
            try:
                limit = int(limit)
                if limit <= 0:
                    limit = 100
            except (ValueError, TypeError):
                limit = 100

            # Por ahora devolvemos logs simulados
            # En el futuro, aquí se conectaría con el sistema real de logs
            logs = [
                {
                    "timestamp": agent.updated_at,
                    "level": "INFO",
                    "message": f"Agente {agent.name} - Estado actual: {'Activo' if agent.is_active else 'Inactivo'}"
                },
                {
                    "timestamp": agent.created_at,
                    "level": "INFO", 
                    "message": f"Agente {agent.name} creado exitosamente"
                }
            ]

            return Response({
                "agent_id": str(agent.id),
                "logs": logs[:limit],
                "total_logs": len(logs)
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": f"Error interno del servidor: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )