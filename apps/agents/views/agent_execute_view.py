from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from apps.users.permissions.authentication import CustomJWTAuthentication
from core.shared.models.agents.agent import Agent
from bson import ObjectId
from bson.errors import InvalidId

class AgentExecuteAPIView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, agent_id):
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

            # Verificar que el agente esté activo
            if not agent.is_active:
                return Response(
                    {"error": "El agente debe estar activo para ejecutarse"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Obtener payload de ejecución
            execution_payload = request.data

            # Por ahora simulamos la ejecución
            # En el futuro, aquí se implementaría la lógica real de ejecución
            execution_result = {
                "execution_id": f"exec_{agent_id}_{agent.conversation_sent_counter + 1}",
                "agent_id": str(agent.id),
                "agent_name": agent.name,
                "status": "executed",
                "payload_received": execution_payload,
                "timestamp": agent.updated_at,
                "result": {
                    "message": "Ejecución simulada exitosa",
                    "provider": agent.provider,
                    "model": agent.model
                }
            }

            # Incrementar contador (simulado)
            agent.conversation_sent_counter += 1
            agent.save()

            return Response(execution_result, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": f"Error interno del servidor: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )