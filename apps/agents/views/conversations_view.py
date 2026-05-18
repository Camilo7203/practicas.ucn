from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from apps.users.permissions.authentication import CustomJWTAuthentication
from bson import ObjectId
from bson.errors import InvalidId
from pymongo import MongoClient
from django.conf import settings
import json
import os
from datetime import datetime, timedelta, timezone
import logging


logger = logging.getLogger(__name__)
class ConversationsAPIView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_mongo_connection(self):
        """Obtener conexión a MongoDB"""
        try:
            mongo_user = os.getenv("MONGO_USER", "")
            mongo_password = os.getenv("MONGO_PASSWORD", "")
            mongo_host = os.getenv("MONGO_HOST", "localhost")
            mongo_db = os.getenv("MONGO_DB", "loophack")
            
            mongo_uri = f"mongodb+srv://{mongo_user}:{mongo_password}@{mongo_host}/{mongo_db}"
            client = MongoClient(mongo_uri)
            return client[mongo_db]
        except Exception as e:
            logger.exception("Error connecting to MongoDB", extra={"error": str(e)})
            return None

    def calculate_conversation_status(self, last_message_timestamp):
        """
        Calcular el estado de la conversación basado en el último mensaje
        - activa: < 2 horas
        - inactiva: 2-24 horas  
        - finalizada: > 24 horas
        """
        if not last_message_timestamp:
            return 'finalizada'
        
        now = datetime.now(timezone.utc)
        
        # Si es string, convertir a datetime
        if isinstance(last_message_timestamp, str):
            try:
                last_message_timestamp = datetime.fromisoformat(last_message_timestamp.replace('Z', '+00:00'))
            except:
                return 'finalizada'
        
        # Asegurar que ambos datetimes tengan timezone info
        if last_message_timestamp.tzinfo is None:
            last_message_timestamp = last_message_timestamp.replace(tzinfo=timezone.utc)
        
        # Calcular diferencia de tiempo
        time_diff = now - last_message_timestamp
        hours_diff = time_diff.total_seconds() / 3600
        
        if hours_diff < 2:
            return 'activa'
        elif hours_diff < 24:
            return 'inactiva'
        else:
            return 'finalizada'

    def get_last_message_from_history(self, db, conversation_id):
        """Obtener el último mensaje de message_history para una conversación"""
        try:
            message_history_collection = db.message_history
            last_message = message_history_collection.find_one(
                {'SessionId': str(conversation_id)},
                sort=[('_id', -1)]
            )
            
            if last_message and hasattr(last_message.get('_id'), 'generation_time'):
                return last_message.get('_id').generation_time
            return None
        except Exception as e:
            logger.exception("Error getting last message from history", extra={"error": str(e)})
            return None

    def get(self, request):
        """
        Obtener todas las conversaciones de activistas con bots para la organización del usuario
        Query params:
        - activist_id: filtrar por activista específico
        - agent_id: filtrar por agente específico
        - limit: número de conversaciones a retornar (default: 50)
        - offset: offset para paginación (default: 0)
        - include_messages: incluir mensajes en la respuesta (default: false)
        """
        try:
            organization = getattr(request.user, 'organization', None)
            if organization is None:
                return Response(
                    {'error': 'No organization found for user.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Conectar a MongoDB
            db = self.get_mongo_connection()
            if db is None:
                return Response(
                    {"error": "Error de conexión a la base de datos"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Parámetros de consulta
            activist_id = request.GET.get('activist_id')
            agent_id = request.GET.get('agent_id')
            page = int(request.GET.get('page', 1))
            page_size = int(request.GET.get('page_size', 50))
            include_messages = request.GET.get('include_messages', 'false').lower() == 'true'
            
            # Calcular offset desde página
            offset = (page - 1) * page_size
            limit = page_size

            # Obtener colecciones
            conversations_collection = db.conversations
            message_records_collection = db.message_records
            activists_collection = db.activists
            agents_collection = db.agents

            # Construir pipeline de agregación para obtener conversaciones con datos relacionados
            pipeline = [
                # Match por organización a través de activistas
                {
                    '$lookup': {
                        'from': 'activists',
                        'localField': 'activist',
                        'foreignField': '_id',
                        'as': 'activist_data'
                    }
                },
                {
                    '$unwind': '$activist_data'
                },
                {
                    '$match': {
                        'activist_data.organization': ObjectId(str(organization.id))
                    }
                },
                # Lookup para agente
                {
                    '$lookup': {
                        'from': 'agents',
                        'localField': 'agent',
                        'foreignField': '_id',
                        'as': 'agent_data'
                    }
                },
                {
                    '$unwind': '$agent_data'
                },
                # Lookup para campaña (opcional)
                {
                    '$lookup': {
                        'from': 'campaigns',
                        'localField': 'campaign',
                        'foreignField': '_id',
                        'as': 'campaign_data'
                    }
                },
                # Lookup para loop actual (opcional)
                {
                    '$lookup': {
                        'from': 'loops',
                        'localField': 'current_loop',
                        'foreignField': '_id',
                        'as': 'loop_data'
                    }
                }
            ]

            # Filtros adicionales
            match_filters = {}
            if activist_id and ObjectId.is_valid(activist_id):
                match_filters['activist'] = ObjectId(activist_id)
            if agent_id and ObjectId.is_valid(agent_id):
                match_filters['agent'] = ObjectId(agent_id)

            if match_filters:
                pipeline.insert(-4, {'$match': match_filters})

            # Ordenar por última actividad
            pipeline.append({'$sort': {'last_message_at': -1}})

            # Paginación
            pipeline.extend([
                {'$skip': offset},
                {'$limit': limit}
            ])

            # Ejecutar agregación
            conversations = list(conversations_collection.aggregate(pipeline))

            # Contar total para paginación
            count_pipeline = pipeline[:-2]  # Sin skip y limit
            count_pipeline.append({'$count': 'total'})
            total_result = list(conversations_collection.aggregate(count_pipeline))
            total_conversations = total_result[0]['total'] if total_result else 0

            # Formatear respuesta
            conversations_data = []
            
            for conv in conversations:
                # Obtener el último mensaje de message_history para calcular el estado real
                last_message_timestamp = self.get_last_message_from_history(db, conv['_id'])
                conversation_status = self.calculate_conversation_status(last_message_timestamp)
                
                # Información básica de la conversación
                conversation_data = {
                    'id': str(conv['_id']),
                    'activist': {
                        'id': str(conv['activist_data']['_id']),
                        'first_name': conv['activist_data'].get('first_name', ''),
                        'last_name': conv['activist_data'].get('last_name', ''),
                        'phone': conv['activist_data'].get('phone', ''),
                        'date_joined': conv['activist_data'].get('date_joined', ''),
                        'is_active': conv['activist_data'].get('is_active', True),
                    },
                    'agent': {
                        'id': str(conv['agent_data']['_id']),
                        'name': conv['agent_data'].get('name', ''),
                        'provider': conv['agent_data'].get('provider', ''),
                        'is_active': conv['agent_data'].get('is_active', True),
                    },
                    'started_at': conv.get('started_at'),
                    'ended_at': conv.get('ended_at'),
                    # Usar el timestamp de message_history como referencia real
                    'last_message_at': last_message_timestamp.isoformat() if last_message_timestamp else None,
                    # Calcular is_active basado en el estado real de message_history
                    'is_active': conversation_status == 'activa',
                    'conversation_status': conversation_status,  # Campo adicional para el frontend
                    'current_counter': conv.get('current_counter', 0),
                    'campaign': {
                        'id': str(conv['campaign_data'][0]['_id']),
                        'name': conv['campaign_data'][0].get('name', ''),
                    } if conv.get('campaign_data') else None,
                    'current_loop': {
                        'id': str(conv['loop_data'][0]['_id']),
                        'name': conv['loop_data'][0].get('name', ''),
                    } if conv.get('loop_data') else None,
                }

                # Incluir mensajes si se solicita
                if include_messages:
                    # Buscar mensajes SOLO en message_history usando SessionId
                    message_history_collection = db.message_history
                    session_id = str(conv['_id'])  # Usar el ID de conversación como SessionId
                    history_messages = list(message_history_collection.find(
                        {'SessionId': session_id}
                    ).sort('_id', 1))  # Ordenar por ID para mantener cronología
                    
                    messages_data = []
                    
                    # Procesar SOLO mensajes de messageHistory (eliminar duplicados de message_records)
                    for history_msg in history_messages:
                        try:
                            import json
                            history_data = json.loads(history_msg.get('History', '{}'))
                            msg_type = history_data.get('type', 'unknown')
                            
                            # Extraer timestamp del ObjectId o usar None
                            timestamp = None
                            if hasattr(history_msg.get('_id'), 'generation_time'):
                                timestamp = history_msg.get('_id').generation_time.isoformat()
                            
                            if msg_type == 'system':
                                # Mensaje del sistema (prompt inicial)
                                message_data = {
                                    'id': str(history_msg['_id']),
                                    'sender_type': 'system',
                                    'sender_id': 'system',
                                    'text': history_data.get('data', {}).get('content', ''),
                                    'timestamp': timestamp,
                                    'status': 'sent',
                                    'message': {
                                        'type': msg_type,
                                        'content': history_data.get('data', {}).get('content', '')
                                    },
                                    'source': 'messageHistory'
                                }
                            elif msg_type == 'ai':
                                # Respuesta del bot
                                message_data = {
                                    'id': str(history_msg['_id']),
                                    'sender_type': 'agent',
                                    'sender_id': str(conv['agent']),
                                    'text': history_data.get('data', {}).get('content', ''),
                                    'timestamp': timestamp,
                                    'status': 'sent',
                                    'message': {
                                        'type': msg_type,
                                        'content': history_data.get('data', {}).get('content', '')
                                    },
                                    'source': 'messageHistory'
                                }
                            elif msg_type == 'human':
                                # Mensaje del usuario
                                message_data = {
                                    'id': str(history_msg['_id']),
                                    'sender_type': 'activist',
                                    'sender_id': str(conv['activist']),
                                    'text': history_data.get('data', {}).get('content', ''),
                                    'timestamp': timestamp,
                                    'status': 'sent',
                                    'message': {
                                        'type': msg_type,
                                        'content': history_data.get('data', {}).get('content', '')
                                    },
                                    'source': 'messageHistory'
                                }
                            else:
                                continue  # Saltar mensajes de tipo desconocido
                                
                            messages_data.append(message_data)
                            
                        except (json.JSONDecodeError, KeyError, AttributeError) as e:
                            # Saltar mensajes con formato inválido
                            logger.warning(f"Skipping message with invalid format in history: {str(e)}", extra={"message_id": str(history_msg.get('_id'))})
                            continue
                    
                    # Ordenar todos los mensajes por timestamp (normalizar todos a string para comparación)
                    def normalize_timestamp(msg):
                        timestamp = msg.get('timestamp')
                        if timestamp is None:
                            return '1970-01-01T00:00:00Z'  # Fecha muy antigua como default
                        elif isinstance(timestamp, str):
                            return timestamp
                        elif hasattr(timestamp, 'isoformat'):
                            return timestamp.isoformat()
                        else:
                            return str(timestamp)
                    
                    messages_data.sort(key=normalize_timestamp)
                    
                    conversation_data['messages'] = messages_data
                    conversation_data['message_count'] = len(messages_data)
                else:
                    # Solo contar mensajes de message_history
                    history_count = db.message_history.count_documents(
                        {'SessionId': str(conv['_id'])}
                    )
                    conversation_data['message_count'] = history_count

                conversations_data.append(conversation_data)

            return Response({
                'conversations': conversations_data,
                'total': total_conversations,
                'limit': limit,
                'offset': offset,
                'has_more': total_conversations > (offset + limit)
            })

        except Exception as e:
            return Response(
                {"error": f"Error interno del servidor: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ActivistConversationsAPIView(APIView):
    """Vista específica para obtener todos los activistas que han conversado con bots"""
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_mongo_connection(self):
        """Obtener conexión a MongoDB para acceder a las colecciones"""
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

    def get(self, request):
        """
        Obtener lista de todos los activistas que han tenido conversaciones con bots
        """
        try:
            organization = getattr(request.user, 'organization', None)
            if organization is None:
                return Response(
                    {'error': 'No organization found for user.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Conectar a MongoDB
            db = self.get_mongo_connection()
            if db is None:
                return Response(
                    {"error": "Error de conexión a la base de datos"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Obtener colecciones
            conversations_collection = db.conversations
            message_records_collection = db.message_records
            
            # Pipeline de agregación para obtener activistas con sus conversaciones
            pipeline = [
                # Match por organización a través de activistas
                {
                    '$lookup': {
                        'from': 'activists',
                        'localField': 'activist',
                        'foreignField': '_id',
                        'as': 'activist_data'
                    }
                },
                {
                    '$unwind': '$activist_data'
                },
                {
                    '$match': {
                        'activist_data.organization': ObjectId(str(organization.id))
                    }
                },
                # Lookup para agente
                {
                    '$lookup': {
                        'from': 'agents',
                        'localField': 'agent',
                        'foreignField': '_id',
                        'as': 'agent_data'
                    }
                },
                {
                    '$unwind': '$agent_data'
                },
                # Agrupar por activista
                {
                    '$group': {
                        '_id': '$activist',
                        'activist_info': {'$first': '$activist_data'},
                        'conversations': {
                            '$push': {
                                'id': '$_id',
                                'agent_name': '$agent_data.name',
                                'agent_provider': '$agent_data.provider',
                                'started_at': '$started_at',
                                'last_message_at': '$last_message_at',
                                'is_active': '$is_active'
                            }
                        },
                        'total_conversations': {'$sum': 1},
                        'active_conversations': {
                            '$sum': {'$cond': [{'$eq': ['$is_active', True]}, 1, 0]}
                        },
                        'last_conversation_at': {'$max': '$last_message_at'},
                        'agents_talked_to': {'$addToSet': '$agent_data.name'}
                    }
                },
                # Ordenar por última conversación
                {
                    '$sort': {'last_conversation_at': -1}
                }
            ]

            # Ejecutar agregación
            activists_data = list(conversations_collection.aggregate(pipeline))

            # Formatear respuesta y agregar conteo de mensajes
            activists_list = []
            for activist_data in activists_data:
                # Contar mensajes para cada conversación
                conversations_with_count = []
                for conv in activist_data['conversations']:
                    message_count = message_records_collection.count_documents(
                        {'conversation': conv['id']}
                    )
                    conv['message_count'] = message_count
                    conversations_with_count.append(conv)

                activist_info = {
                    'activist': {
                        'id': str(activist_data['_id']),
                        'first_name': activist_data['activist_info'].get('first_name', ''),
                        'last_name': activist_data['activist_info'].get('last_name', ''),
                        'phone': activist_data['activist_info'].get('phone', ''),
                        'date_joined': activist_data['activist_info'].get('date_joined'),
                        'is_active': activist_data['activist_info'].get('is_active', True),
                    },
                    'conversations': conversations_with_count,
                    'total_conversations': activist_data['total_conversations'],
                    'active_conversations': activist_data['active_conversations'],
                    'last_conversation_at': activist_data['last_conversation_at'],
                    'agents_talked_to': activist_data['agents_talked_to'],
                    'unique_agents_count': len(activist_data['agents_talked_to']),
                }
                activists_list.append(activist_info)

            return Response({
                'activists': activists_list,
                'total_activists': len(activists_list),
                'summary': {
                    'total_activists_with_conversations': len(activists_list),
                    'total_conversations': sum(a['total_conversations'] for a in activists_list),
                    'active_conversations': sum(a['active_conversations'] for a in activists_list),
                }
            })

        except Exception as e:
            return Response(
                {"error": f"Error interno del servidor: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ConversationDetailAPIView(APIView):
    """Vista para obtener el detalle completo de una conversación específica"""
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_mongo_connection(self):
        """Obtener conexión a MongoDB para acceder a las colecciones"""
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

    def calculate_conversation_status(self, last_message_timestamp):
        """
        Calcular el estado de la conversación basado en el último mensaje
        - activa: < 2 horas
        - inactiva: 2-24 horas  
        - finalizada: > 24 horas
        """
        if not last_message_timestamp:
            return 'finalizada'
        
        now = datetime.now(timezone.utc)
        
        # Si es string, convertir a datetime
        if isinstance(last_message_timestamp, str):
            try:
                last_message_timestamp = datetime.fromisoformat(last_message_timestamp.replace('Z', '+00:00'))
            except:
                return 'finalizada'
        
        # Asegurar que ambos datetimes tengan timezone info
        if last_message_timestamp.tzinfo is None:
            last_message_timestamp = last_message_timestamp.replace(tzinfo=timezone.utc)
        
        # Calcular diferencia de tiempo
        time_diff = now - last_message_timestamp
        hours_diff = time_diff.total_seconds() / 3600
        
        if hours_diff < 2:
            return 'activa'
        elif hours_diff < 24:
            return 'inactiva'
        else:
            return 'finalizada'

    def get_last_message_from_history(self, db, conversation_id):
        """Obtener el último mensaje de message_history para una conversación"""
        try:
            message_history_collection = db.message_history
            last_message = message_history_collection.find_one(
                {'SessionId': str(conversation_id)},
                sort=[('_id', -1)]
            )
            
            if last_message and hasattr(last_message.get('_id'), 'generation_time'):
                return last_message.get('_id').generation_time
            return None
        except Exception as e:
            logger.exception("Error getting last message from history", extra={"error": str(e)})
            return None

    def get(self, request, conversation_id):
        """
        Obtener el detalle completo de una conversación específica con todos sus mensajes
        """
        try:
            organization = getattr(request.user, 'organization', None)
            if organization is None:
                return Response(
                    {'error': 'No organization found for user.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validar ObjectId
            if not ObjectId.is_valid(conversation_id):
                return Response(
                    {"error": "ID de conversación inválido"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Conectar a MongoDB
            db = self.get_mongo_connection()
            if db is None:
                return Response(
                    {"error": "Error de conexión a la base de datos"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Obtener colecciones
            conversations_collection = db.conversations
            message_records_collection = db.message_records

            # Pipeline para obtener conversación con datos relacionados
            pipeline = [
                {
                    '$match': {'_id': ObjectId(conversation_id)}
                },
                # Lookup para activista
                {
                    '$lookup': {
                        'from': 'activists',
                        'localField': 'activist',
                        'foreignField': '_id',
                        'as': 'activist_data'
                    }
                },
                {
                    '$unwind': '$activist_data'
                },
                # Verificar que el activista pertenezca a la organización
                {
                    '$match': {
                        'activist_data.organization': ObjectId(str(organization.id))
                    }
                },
                # Lookup para agente
                {
                    '$lookup': {
                        'from': 'agents',
                        'localField': 'agent',
                        'foreignField': '_id',
                        'as': 'agent_data'
                    }
                },
                {
                    '$unwind': '$agent_data'
                },
                # Lookup para campaña (opcional)
                {
                    '$lookup': {
                        'from': 'campaigns',
                        'localField': 'campaign',
                        'foreignField': '_id',
                        'as': 'campaign_data'
                    }
                },
                # Lookup para loop actual (opcional)
                {
                    '$lookup': {
                        'from': 'loops',
                        'localField': 'current_loop',
                        'foreignField': '_id',
                        'as': 'loop_data'
                    }
                }
            ]

            # Ejecutar agregación
            conversation_result = list(conversations_collection.aggregate(pipeline))
            
            if not conversation_result:
                return Response(
                    {"error": "Conversación no encontrada"}, 
                    status=status.HTTP_404_NOT_FOUND
                )

            conversation = conversation_result[0]

            # Obtener todos los mensajes de la conversación
            # Buscar mensajes SOLO en message_history usando SessionId (eliminar duplicados)
            message_history_collection = db.message_history
            session_id = conversation_id  # Usar el ID de conversación como SessionId
            history_messages = list(message_history_collection.find(
                {'SessionId': session_id}
            ).sort('_id', 1))  # Ordenar por ID para mantener cronología
            
            messages_data = []
            
            # Procesar SOLO mensajes de messageHistory (historial completo de la conversación)
            for history_msg in history_messages:
                try:
                    history_data = json.loads(history_msg.get('History', '{}'))
                    msg_type = history_data.get('type', 'unknown')
                    
                    # Determinar el nombre del remitente según el tipo
                    sender_name = ""
                    if msg_type == 'system':
                        sender_name = "Sistema"
                        sender_type = 'system'
                        sender_id = 'system'
                        text_content = history_data.get('data', {}).get('content', '')
                    elif msg_type == 'ai':
                        sender_name = conversation['agent_data'].get('name', 'Bot')
                        sender_type = 'agent'
                        sender_id = str(conversation['agent'])
                        text_content = history_data.get('data', {}).get('content', '')
                    elif msg_type == 'human':
                        sender_name = f"{conversation['activist_data'].get('first_name', '')} {conversation['activist_data'].get('last_name', '')}".strip()
                        sender_type = 'activist'
                        sender_id = str(conversation['activist'])
                        text_content = history_data.get('data', {}).get('content', '')
                    else:
                        continue  # Saltar mensajes de tipo desconocido
                    
                    message_data = {
                        'id': str(history_msg['_id']),
                        'sender_type': sender_type,
                        'sender_id': sender_id,
                        'sender_name': sender_name,
                        'text': text_content,
                        'timestamp': history_msg.get('_id').generation_time if hasattr(history_msg.get('_id'), 'generation_time') else None,
                        'status': 'sent',
                        'message': history_data,
                        'source': 'messageHistory'
                    }
                    messages_data.append(message_data)
                    
                except (json.JSONDecodeError, KeyError) as e:
                    # Saltar mensajes con formato inválido
                    logger.warning(f"Skipping message with invalid format in history: {str(e)}", extra={"message_id": str(history_msg.get('_id'))})
                    continue
            
            # Ordenar todos los mensajes por timestamp (convertir a string para comparación)
            def sort_key(msg):
                timestamp = msg.get('timestamp')
                if timestamp is None:
                    return '1970-01-01T00:00:00Z'  # Fecha muy antigua como default
                elif isinstance(timestamp, str):
                    return timestamp
                elif hasattr(timestamp, 'isoformat'):
                    return timestamp.isoformat()
                else:
                    return str(timestamp)

            messages_data.sort(key=sort_key)

            # Calcular el estado real basado en message_history
            last_message_timestamp = self.get_last_message_from_history(db, ObjectId(conversation_id))
            conversation_status = self.calculate_conversation_status(last_message_timestamp)

            # Información completa de la conversación
            conversation_data = {
                'id': str(conversation['_id']),
                'activist': {
                    'id': str(conversation['activist_data']['_id']),
                    'first_name': conversation['activist_data'].get('first_name', ''),
                    'last_name': conversation['activist_data'].get('last_name', ''),
                    'phone': conversation['activist_data'].get('phone', ''),
                    'date_joined': conversation['activist_data'].get('date_joined'),
                    'is_active': conversation['activist_data'].get('is_active', True),
                },
                'agent': {
                    'id': str(conversation['agent_data']['_id']),
                    'name': conversation['agent_data'].get('name', ''),
                    'provider': conversation['agent_data'].get('provider', ''),
                    'is_active': conversation['agent_data'].get('is_active', True),
                },
                'started_at': conversation.get('started_at'),
                'ended_at': conversation.get('ended_at'),
                # Usar el timestamp real de message_history
                'last_message_at': last_message_timestamp.isoformat() if last_message_timestamp else None,
                # Calcular is_active basado en el estado real
                'is_active': conversation_status == 'activa',
                'conversation_status': conversation_status,  # Campo adicional para el frontend
                'current_counter': conversation.get('current_counter', 0),
                'campaign': {
                    'id': str(conversation['campaign_data'][0]['_id']),
                    'name': conversation['campaign_data'][0].get('name', ''),
                } if conversation.get('campaign_data') else None,
                'current_loop': {
                    'id': str(conversation['loop_data'][0]['_id']),
                    'name': conversation['loop_data'][0].get('name', ''),
                } if conversation.get('loop_data') else None,
                'messages': messages_data,
                'message_count': len(messages_data),
                'message_summary': {
                    'total_messages': len(messages_data),
                    'activist_messages': len([m for m in messages_data if m['sender_type'] == 'activist']),
                    'agent_messages': len([m for m in messages_data if m['sender_type'] == 'agent']),
                }
            }

            return Response(conversation_data)

        except Exception as e:
            return Response(
                {"error": f"Error interno del servidor: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )