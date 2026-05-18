from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from apps.campaigns.serializers.loop_serializers import LoopSerializer
from apps.users.permissions.authentication import CustomJWTAuthentication
from core.shared.models.campaigns.loop import Loop
from core.shared.models.agents.agent import Agent
from mongoengine.errors import DoesNotExist, ValidationError
from bson import ObjectId
import pymongo
import logging


logger = logging.getLogger(__name__)

class LoopRegisterAPIView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def post(self, request):
        logger.info(
            "Loop register request received",
            extra={
                "user_id": str(getattr(request.user, "id", "")),
                "method": request.method,
                "content_type": request.content_type,
            },
        )
        
        # Verificar que el usuario tenga una organización
        if not request.user.organization:
            return Response({
                "error": "Usuario no pertenece a ninguna organización"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Agregar la organización a los datos del request
        request_data = request.data.copy()
        request_data['organization'] = str(request.user.organization.id)
        
        serializer = LoopSerializer(data=request_data)
        if serializer.is_valid():
            loop = serializer.save()
            logger.info("Loop creado exitosamente", extra={"loop_id": str(loop.id)})
            return Response({"message": "Loop creado con éxito", "data": serializer.to_representation(loop)}, status=status.HTTP_201_CREATED)
        
        logger.warning("Errores de validación en creación de loop", extra={"errors": serializer.errors})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        example = {
            "name": "Nombre del Loop",
            "default_loop": False,
            "agent": "ID del agente",
            "objective": "engagement",
            "trigger": "ID del trigger",
            "tasks": ["ID de  1", "ID de tarea 2"],
            "incentives": ["ID de incentivo 1"],
            "functions": ["ID de función 1"],
            "created_by": "ID del usuario creador"
        }
        return Response(example)


class LoopListAPIView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request):
        """Lista todos los loops del usuario/organización con información de agentes"""
        try:
            logger.info(
                "Loop list request received",
                extra={
                    "user_id": str(getattr(request.user, "id", "")),
                    "organization_id": str(getattr(getattr(request.user, "organization", None), "id", "")) or None,
                },
            )
            
            # Verificar que el usuario tenga una organización
            if not request.user.organization:
                return Response({
                    "error": "Usuario no pertenece a ninguna organización",
                    "loops": [],
                    "total": 0
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Usar pymongo directamente para tener mejor control sobre las consultas
            from pymongo import MongoClient
            import os
            
            mongo_user = os.getenv("MONGO_USER", "")
            mongo_password = os.getenv("MONGO_PASSWORD", "")
            mongo_host = os.getenv("MONGO_HOST", "localhost")
            mongo_db = os.getenv("MONGO_DB", "loophack")
            
            mongo_uri = f"mongodb+srv://{mongo_user}:{mongo_password}@{mongo_host}/{mongo_db}"
            client = MongoClient(mongo_uri)
            db = client[mongo_db]
            
            # Filtrar loops por organización del usuario
            organization_id = request.user.organization.id
            loops_cursor = db.loops.find({"organization": ObjectId(organization_id)})
            loops_data = []
            
            # Obtener todos los agentes de la organización para hacer un lookup rápido
            agents_cursor = db.agents.find({"organization": ObjectId(organization_id)})
            agents_dict = {agent["_id"]: agent for agent in agents_cursor}
            
            # Obtener todos los usuarios para lookup
            users_cursor = db.users.find({})
            users_dict = {user["_id"]: user for user in users_cursor}
            users_dict = {user["_id"]: user for user in users_cursor}
            
            for loop_doc in loops_cursor:
                try:
                    # Obtener información del agente
                    agent_info = {"id": "unknown", "name": "Unknown Agent", "description": "", "provider": "Unknown Provider"}
                    if "agent" in loop_doc and loop_doc["agent"]:
                        agent_id = loop_doc["agent"]
                        if agent_id in agents_dict:
                            agent_data = agents_dict[agent_id]
                            agent_info = {
                                "id": str(agent_data["_id"]),
                                "name": agent_data.get("name", "Unknown Agent"),
                                "description": agent_data.get("description", ""),
                                "provider": agent_data.get("provider", "Unknown Provider")
                            }
                        else:
                            logger.warning(
                                "Agent not found for loop",
                                extra={"loop_name": loop_doc.get("name", "Unknown"), "agent_id": str(agent_id)},
                            )
                    
                    # Obtener información del usuario
                    created_by_info = {"id": "unknown", "name": "Unknown User", "email": ""}
                    if "created_by" in loop_doc and loop_doc["created_by"]:
                        user_id = loop_doc["created_by"]
                        if user_id in users_dict:
                            user_data = users_dict[user_id]
                            created_by_info = {
                                "id": str(user_data["_id"]),
                                "name": user_data.get("name", "Unknown User"),
                                "email": user_data.get("email", "")
                            }
                    
                    # Construir el objeto loop
                    loop_data = {
                        "id": str(loop_doc["_id"]),
                        "name": loop_doc.get("name", "Unknown Loop"),
                        "default_loop": loop_doc.get("default_loop", False),
                        "agent": agent_info,
                        "objective": loop_doc.get("objective", "unknown"),
                        "trigger_type": loop_doc.get("trigger_type", "unknown"),
                        "trigger": {
                            "id": str(loop_doc.get("trigger", {}).get("id", "unknown")) if isinstance(loop_doc.get("trigger"), dict) else "unknown",
                            "type": loop_doc.get("trigger_type", "unknown"),
                            "name": f"{loop_doc.get('trigger_type', 'Unknown')} Trigger"
                        },
                        "created_by": created_by_info,
                        "created_at": loop_doc.get("created_at"),
                        "updated_at": loop_doc.get("updated_at"),
                        "status": "active",
                        "tasks_count": 0,
                        "incentives_count": 0,
                    }
                    
                    loops_data.append(loop_data)
                    
                except Exception as loop_error:
                    logger.exception(
                        "Error processing loop",
                        extra={"loop_id": str(loop_doc.get("_id", "Unknown"))},
                    )
                    continue
            
            client.close()
            
            logger.info("Loop list response ready", extra={"total_loops": len(loops_data)})
            
            return Response({
                "loops": loops_data,
                "total": len(loops_data)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.exception("Unexpected error in LoopListAPIView")
            return Response({
                "error": "Internal server error",
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LoopDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request, loop_id):
        """Obtiene un loop específico por ID"""
        try:
            loop = Loop.objects.get(id=loop_id)
            # 🔧 FIX: Cargar explícitamente todos los elementos referenciados en nodes/edges
            loop.load_elements()
            serializer = LoopSerializer()
            return Response({"loop": serializer.to_representation(loop)}, status=status.HTTP_200_OK)
        except DoesNotExist:
            return Response({"error": "Loop not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.exception("Error in LoopDetailAPIView.get", extra={"loop_id": str(loop_id)})
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, loop_id):
        """Actualiza un loop específico usando el serializer"""
        try:
            logger.info(
                "Loop update request received",
                extra={
                    "loop_id": str(loop_id),
                    "payload_keys": list(request.data.keys()),
                    "nodes_count": len(request.data.get("nodes", [])),
                    "edges_count": len(request.data.get("edges", [])),
                },
            )
            
            loop = Loop.objects.get(id=loop_id)
            
            # Usar el serializer para validar y actualizar
            serializer = LoopSerializer(instance=loop, data=request.data, partial=True)
            
            if serializer.is_valid():
                updated_loop = serializer.save()
                # Cargar explícitamente los elementos después de actualizar
                updated_loop.load_elements()
                logger.info("Loop actualizado exitosamente", extra={"loop_id": str(loop_id)})
                return Response({
                    "message": "Loop actualizado con éxito", 
                    "data": serializer.to_representation(updated_loop)
                }, status=status.HTTP_200_OK)
            else:
                logger.warning(
                    "Errores de validación al actualizar loop",
                    extra={"loop_id": str(loop_id), "errors": serializer.errors},
                )
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except DoesNotExist:
            return Response({"error": "Loop not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.exception("Error in LoopDetailAPIView.put", extra={"loop_id": str(loop_id)})
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, loop_id):
        """Elimina un loop específico"""
        try:
            loop = Loop.objects.get(id=loop_id)
            loop.delete()
            return Response({"message": "Loop eliminado con éxito"}, status=status.HTTP_200_OK)
        except DoesNotExist:
            return Response({"error": "Loop not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.exception("Error in LoopDetailAPIView.delete", extra={"loop_id": str(loop_id)})
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
