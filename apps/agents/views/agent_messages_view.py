from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from apps.users.permissions.authentication import CustomJWTAuthentication
from core.shared.models.agents.agent import Agent
from bson import ObjectId
from bson.errors import InvalidId
from pymongo import MongoClient
from mongoengine.errors import DoesNotExist
from django.conf import settings
import json
import os
import logging


logger = logging.getLogger(__name__)

class AgentMessagesAPIView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_mongo_connection(self):
        """Obtener conexión a MongoDB para acceder a message_history"""
        try:
            mongo_user = os.getenv("MONGO_USER", "")
            mongo_password = os.getenv("MONGO_PASSWORD", "")
            mongo_host = os.getenv("MONGO_HOST", "localhost")
            mongo_db = os.getenv("MONGO_DB", "loophack")
            
            mongo_uri = f"mongodb+srv://{mongo_user}:{mongo_password}@{mongo_host}/{mongo_db}"
            client = MongoClient(mongo_uri)
            db = client[mongo_db]
            return db
        except Exception as e:
            logger.exception("Error connecting to MongoDB", extra={"error": str(e)})
            return None

    def get(self, request, agent_id):
        try:
            # Validar ObjectId
            if not ObjectId.is_valid(agent_id):
                return Response(
                    {"error": "ID de agente inválido"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Buscar el agente para verificar permisos
            try:
                agent = Agent.objects(
                    id=ObjectId(agent_id),
                    organization=request.user.organization
                ).first()
                if not agent:
                    return Response(
                        {"error": "Agente no encontrado"}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
            except Exception:
                return Response(
                    {"error": "Agente no encontrado"}, 
                    status=status.HTTP_404_NOT_FOUND
                )

            # Parámetros de consulta
            session_id = request.GET.get('session_id')
            limit = int(request.GET.get('limit', 50))
            offset = int(request.GET.get('offset', 0))

            # Conectar a MongoDB
            db = self.get_mongo_connection()
            if db is None:
                return Response(
                    {"error": "Error de conexión a la base de datos"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Query base
            query = {}
            
            # Si se proporciona session_id específico
            if session_id:
                query['sessionID'] = session_id
            
            # Obtener conversaciones de la colección message_history
            message_history = db.message_history
            
            if session_id:
                # Obtener mensajes de una sesión específica
                messages = list(message_history.find(query).sort('_id', 1))
                formatted_messages = []
                
                for msg in messages:
                    try:
                        # Parse el campo History que está en string
                        history_str = msg.get('History', '{}')
                        if isinstance(history_str, str):
                            history = json.loads(history_str)
                        else:
                            history = history_str
                        
                        formatted_messages.append({
                            'id': str(msg.get('_id')),
                            'sessionID': msg.get('sessionID'),
                            'type': history.get('type', 'Unknown'),
                            'content': history.get('content', ''),
                            'timestamp': msg.get('timestamp', msg.get('_id').generation_time if msg.get('_id') else None)
                        })
                    except json.JSONDecodeError:
                        # Si no se puede parsear el JSON, usar el string directamente
                        formatted_messages.append({
                            'id': str(msg.get('_id')),
                            'sessionID': msg.get('sessionID'),
                            'type': 'Unknown',
                            'content': msg.get('History', ''),
                            'timestamp': msg.get('timestamp', msg.get('_id').generation_time if msg.get('_id') else None)
                        })
                
                return Response({
                    'sessionID': session_id,
                    'messages': formatted_messages,
                    'total': len(formatted_messages)
                })
            else:
                # Obtener lista de sesiones únicas
                sessions = message_history.distinct('sessionID')
                session_list = []
                
                for session in sessions[:limit]:
                    # Obtener el último mensaje de cada sesión para mostrar preview
                    last_message = message_history.find({'sessionID': session}).sort('_id', -1).limit(1)
                    last_msg = list(last_message)
                    
                    if last_msg:
                        try:
                            history_str = last_msg[0].get('History', '{}')
                            if isinstance(history_str, str):
                                history = json.loads(history_str)
                            else:
                                history = history_str
                            
                            last_content = history.get('content', '')[:100] + '...' if len(history.get('content', '')) > 100 else history.get('content', '')
                        except:
                            last_content = "Error parsing message"
                        
                        # Contar mensajes en la sesión
                        message_count = message_history.count_documents({'sessionID': session})
                        
                        session_list.append({
                            'sessionID': session,
                            'lastMessage': last_content,
                            'messageCount': message_count,
                            'lastActivity': last_msg[0].get('timestamp', last_msg[0].get('_id').generation_time if last_msg[0].get('_id') else None)
                        })
                
                # Ordenar por última actividad
                session_list.sort(key=lambda x: x['lastActivity'] if x['lastActivity'] else '', reverse=True)
                
                return Response({
                    'sessions': session_list,
                    'total': len(sessions)
                })

        except Exception as e:
            return Response(
                {"error": f"Error interno del servidor: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )