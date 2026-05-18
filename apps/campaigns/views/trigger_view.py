from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from apps.campaigns.serializers.trigger_serializers import TriggerSerializer
from apps.users.permissions.authentication import CustomJWTAuthentication

class TriggerRegisterAPIView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def post(self, request):
        serializer = TriggerSerializer(data=request.data)
        if serializer.is_valid():
            trigger = serializer.save()
            return Response({"message": "Trigger creado con éxito", "data": serializer.data}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        example = {
            "name": "Nombre del Trigger",
            "type": "onClick|scheduled|webhook|onArrival|idle|onTag",
            "configuration": {},
            "organization": "ID de la Organización"
        }
        return Response(example)
