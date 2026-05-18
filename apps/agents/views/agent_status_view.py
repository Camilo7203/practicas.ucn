from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from apps.users.permissions.authentication import CustomJWTAuthentication
from core.shared.models.agents.agent import Agent
from bson import ObjectId
from bson.errors import InvalidId

class AgentStatusAPIView(APIView):
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

            return Response({
                "agent_id": str(agent.id),
                "name": agent.name,
                "status": "active" if agent.is_active else "inactive",
                "provider": agent.provider,
                "model": agent.model,
                "messages_sent": agent.conversation_sent_counter,
                "message_limit": agent.outbound_message_limit,
                "last_updated": agent.updated_at
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": f"Error interno del servidor: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )