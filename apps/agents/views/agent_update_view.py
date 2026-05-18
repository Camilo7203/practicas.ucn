from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from apps.users.permissions.authentication import CustomJWTAuthentication
from apps.agents.serializers.agent_serializers import AgentSerializer
from core.shared.models.agents.agent import Agent
from bson import ObjectId
from bson.errors import InvalidId

class AgentUpdateAPIView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def put(self, request, agent_id):
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

            # Actualizar los campos permitidos
            allowed_fields = [
                'name', 'description', 'is_active', 'model',
                'outbound_message_limit', 'message_window_start', 'provider_id'
            ]
            
            for field in allowed_fields:
                if field in request.data:
                    setattr(agent, field, request.data[field])

            agent.save()
            
            serializer = AgentSerializer(agent)
            return Response({
                "message": "Agente actualizado exitosamente",
                "agent": serializer.data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": f"Error interno del servidor: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def patch(self, request, agent_id):
        return self.put(request, agent_id)