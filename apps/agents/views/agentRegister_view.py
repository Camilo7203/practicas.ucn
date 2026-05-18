from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from apps.users.permissions.authentication import CustomJWTAuthentication
from apps.agents.serializers.agent_serializers import AgentSerializer

# Importar configuraciones para registrarlas
from core.shared.models.agents.whatsAppConfig import WhatsAppConfig
class AgentRegisterAPIView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def post(self, request):
        # Pasar el contexto con el request para que el serializer pueda acceder al usuario
        serializer = AgentSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            agent = serializer.save()
            return Response({
                "message": "Agent created successfully", 
                "data": serializer.to_representation(agent)
            }, status=status.HTTP_201_CREATED)
        return Response({
            "message": "Validation failed",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        example = {
            "name": "Nombre del Agente",
            "provider": "whatsapp|telegram|email|instagram",
            "model": "gpt-3.5-turbo|gpt-4|claude-2|gemini-1.5",
            "provider_id": "ID del agente en el proveedor",
            "description": "Descripción opcional",
            "organization": "ID de la Organización",
            "is_active": True,
            "outbound_message_limit": 100,
            "message_window_start": 3600,
            "conversation_sent_counter": 0,
            "config": {
                "webhook_url": "https://example.com/webhook",
                "additional_settings": {}
            }
        }
        return Response(example)
