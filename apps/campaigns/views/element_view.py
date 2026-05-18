from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from apps.users.permissions.authentication import CustomJWTAuthentication
from core.shared.models.elements.triggers.onArrival import OnArrival
from core.shared.models.elements.tasks.survey import Survey
from core.shared.models.elements.tasks.info import Info
from core.shared.models.elements.tasks.quiz import Quiz
from core.shared.models.elements.incentives.points_incentive import PointsIncentive
from core.shared.models.points.leagues.league import League
from core.shared.models.users.organization import Organization
from mongoengine.errors import DoesNotExist, ValidationError
import traceback
from bson import ObjectId
import pymongo
import logging


logger = logging.getLogger(__name__)
class ElementListAPIView(APIView):
    permission_classes = [AllowAny]  # Temporal para testing
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request):
        """Lista todos los elementos disponibles para crear loops"""
        try:
            logger.info("Request user: %s", request.user.id)
            logger.info("User organization: %s", request.user.organization.id if request.user.organization else None)
            
            # Verificar que el usuario tenga una organización
            if not request.user.organization:
                return Response({
                    "error": "Usuario no pertenece a ninguna organización",
                    "elements": [],
                    "triggers": [],
                    "tasks": [],
                    "total": 0
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Usar pymongo directamente para mejor control
            from pymongo import MongoClient
            import os
            
            mongo_user = os.getenv("MONGO_USER", "")
            mongo_password = os.getenv("MONGO_PASSWORD", "")
            mongo_host = os.getenv("MONGO_HOST", "localhost")
            mongo_db = os.getenv("MONGO_DB", "loophack")
            
            mongo_uri = f"mongodb+srv://{mongo_user}:{mongo_password}@{mongo_host}/{mongo_db}"
            client = MongoClient(mongo_uri)
            db = client[mongo_db]
            
            # Filtrar elementos por organización del usuario
            organization_id = request.user.organization.id
            elements_cursor = db.elements.find({"organization": ObjectId(organization_id)})
            elements_data = []
            
            for element_doc in elements_cursor:
                try:
                    element_data = {
                        "id": str(element_doc["_id"]),
                        "name": element_doc.get("name", "Unknown Element"),
                        "description": element_doc.get("description", ""),
                        "type": element_doc.get("type", "unknown"),
                        "sub_type": element_doc.get("sub_type", "unknown"),
                        "checkpoint_name": element_doc.get("checkpoint_name", ""),
                        "created_at": element_doc.get("created_at"),
                        "updated_at": element_doc.get("updated_at"),
                        "organization": str(element_doc.get("organization", "")),
                        # Campos específicos por tipo
                        "configuration": element_doc.get("configuration", {}),
                    }
                    
                    # Extraer el default_next_element_id si existe
                    default_next_element = element_doc.get("default_next_element")
                    if default_next_element and isinstance(default_next_element, dict):
                        # Estructura: {"_cls": "OnArrival", "_ref": DBRef("elements", ObjectId("..."))}
                        if "_ref" in default_next_element:
                            ref = default_next_element["_ref"]
                            if hasattr(ref, 'id'):
                                element_data["default_next_element_id"] = str(ref.id)
                            else:
                                element_data["default_next_element_id"] = None
                        else:
                            element_data["default_next_element_id"] = None
                    else:
                        element_data["default_next_element_id"] = None
                    
                    # Agregar campos específicos por tipo y subtipo
                    element_type = element_doc.get("type")
                    sub_type = element_doc.get("sub_type")
                    
                    # Triggers
                    if element_type == "trigger" and sub_type == "onArrival":
                        element_data.update({
                            "command": element_doc.get("command", ""),
                            "command_type": element_doc.get("command_type", "")
                        })
                    
                    # Tasks
                    elif element_type == "task":
                        if sub_type == "survey":
                            element_data.update({
                                "questions": element_doc.get("questions", [])
                            })
                        elif sub_type == "info":
                            element_data.update({
                                "info_text": element_doc.get("info_text", ""),
                                "definition_of_done": element_doc.get("definition_of_done", "")
                            })
                        elif sub_type == "quiz":
                            element_data.update({
                                "questions": element_doc.get("questions", []),
                                "options": element_doc.get("options", {}),
                                "definition_of_done": element_doc.get("definition_of_done", "")
                            })
                    
                    # Incentives
                    elif element_type == "incentive" and sub_type == "points":
                        element_data.update({
                            "points_amount": element_doc.get("points_amount", 0),
                            "league": str(element_doc.get("league").id) if element_doc.get("league") else None
                        })
                    
                    elements_data.append(element_data)
                    
                except Exception as element_error:
                    logger.error(f"Error processing element {element_doc.get('_id', 'Unknown')}: {str(element_error)}")
                    continue
            
            client.close()
            
            # Filtrar por tipo para facilitar uso en frontend
            triggers = [e for e in elements_data if e["type"] == "trigger"]
            tasks = [e for e in elements_data if e["type"] == "task"]
            
            logger.info(f"Total elements processed: {len(elements_data)}")
            
            return Response({
                "elements": elements_data,
                "triggers": triggers,
                "tasks": tasks,
                "total": len(elements_data)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Unexpected error in ElementListAPIView: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": "Internal server error",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ElementCreateAPIView(APIView):
    permission_classes = [AllowAny]  # Temporal para testing
    authentication_classes = [CustomJWTAuthentication]

    def post(self, request):
        """Crea un nuevo elemento"""
        try:
            data = request.data
            element_type = data.get("type")
            sub_type = data.get("sub_type")
            
            if not element_type or not sub_type:
                return Response({
                    "error": "Type and sub_type are required"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Mapear tipo/subtipo a método de creación
            if element_type == "trigger" and sub_type == "onArrival":
                return self._create_on_arrival_trigger(data, request.user)
            elif element_type == "task" and sub_type == "survey":
                return self._create_survey_task(data, request.user)
            elif element_type == "task" and sub_type == "info":
                return self._create_info_task(data, request.user)
            elif element_type == "task" and sub_type == "quiz":
                return self._create_quiz_task(data, request.user)
            elif element_type == "incentive" and sub_type == "points":
                return self._create_points_incentive(data, request.user)
            else:
                return Response({
                    "error": f"Element type {element_type}/{sub_type} not supported. Supported types: trigger/onArrival, task/survey, task/info, task/quiz, incentive/points"
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error in ElementCreateAPIView: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _serialize_questions(self, questions):
        """Convert Question/PossibleAnswer objects to plain dicts for PyMongo."""
        serialized_questions = []
        for question in questions or []:
            if hasattr(question, "to_mongo"):
                question_data = question.to_mongo().to_dict()
            elif isinstance(question, dict):
                question_data = question
            else:
                question_data = {}

            possible_answers = question_data.get("possible_answers")
            if possible_answers is not None:
                normalized_answers = []
                for answer in possible_answers:
                    if hasattr(answer, "to_mongo"):
                        normalized_answers.append(answer.to_mongo().to_dict())
                    elif isinstance(answer, dict):
                        normalized_answers.append(answer)
                    else:
                        normalized_answers.append(answer)
                question_data["possible_answers"] = normalized_answers

            serialized_questions.append(question_data)

        return serialized_questions
    
    def _create_on_arrival_trigger(self, data, user):
        """Crear trigger de tipo onArrival"""
        try:
            # Verificar que el usuario tenga una organización
            if not user.organization:
                return Response({
                    "error": "Usuario no pertenece a ninguna organización"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            organization = user.organization
            
            # Obtener conexión a MongoDB para el workaround
            from pymongo import MongoClient
            import os
            
            mongo_user = os.getenv("MONGO_USER", "")
            mongo_password = os.getenv("MONGO_PASSWORD", "")
            mongo_host = os.getenv("MONGO_HOST", "localhost")
            mongo_db = os.getenv("MONGO_DB", "loophack")
            
            mongo_uri = f"mongodb+srv://{mongo_user}:{mongo_password}@{mongo_host}/{mongo_db}"
            client = MongoClient(mongo_uri)
            db = client[mongo_db]
            
            # Crear el trigger (usaremos un workaround para default_next_element)
            trigger = OnArrival(
                name=data.get("name", "New OnArrival Trigger"),
                description=data.get("description", ""),
                type="trigger",  # Requerido por Element base class
                sub_type="onArrival",  # Ya definido en OnArrival pero asegurémos
                organization=organization,
                checkpoint_name=data.get("checkpoint_name", "default_checkpoint"),
                command=data.get("command", ""),
                command_type=data.get("command_type", "contains"),
                configuration=data.get("configuration", {})
            )
            
            # Workaround: usar MongoDB directamente para salvar con referencia correcta
            trigger_dict = {
                "name": trigger.name,
                "description": trigger.description,
                "type": trigger.type,
                "sub_type": trigger.sub_type,
                "organization": organization.id,
                "checkpoint_name": trigger.checkpoint_name,
                "command": trigger.command,
                "command_type": trigger.command_type,
                "configuration": trigger.configuration,
                "created_at": trigger.created_at,
                "updated_at": trigger.updated_at
            }
            
            # Si se especifica un default_next_element, usarlo; sino, auto-referencia
            next_element_id = data.get("default_next_element_id")
            if next_element_id:
                # Verificar que el elemento exista y pertenezca a la misma organización
                next_element = db.elements.find_one({
                    "_id": ObjectId(next_element_id),
                    "organization": ObjectId(organization.id)
                })
                if next_element:
                    # Determinar la clase basada en el tipo/sub_type
                    cls_map = {
                        ("trigger", "onArrival"): "OnArrival",
                        ("task", "survey"): "Survey",
                        ("task", "info"): "Info"
                    }
                    element_cls = cls_map.get((next_element.get("type"), next_element.get("sub_type")), "Element")
                    
                    # Usar la estructura correcta para MongoDB
                    from bson import DBRef
                    trigger_dict["default_next_element"] = {
                        "_cls": element_cls,
                        "_ref": DBRef("elements", ObjectId(next_element_id))
                    }
                else:
                    return Response({
                        "error": f"Next element with ID {next_element_id} not found or does not belong to your organization"
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Insertar en MongoDB
            result = db.elements.insert_one(trigger_dict)
            trigger_id = result.inserted_id
            
            # Si no se especificó next_element, usar auto-referencia
            if not next_element_id:
                from bson import DBRef
                db.elements.update_one(
                    {"_id": trigger_id},
                    {"$set": {
                        "default_next_element": {
                            "_cls": "OnArrival",
                            "_ref": DBRef("elements", trigger_id)
                        }
                    }}
                )
            
            client.close()
            
            return Response({
                "message": "OnArrival trigger created successfully",
                "element": {
                    "id": str(trigger_id),
                    "name": trigger.name,
                    "description": trigger.description,
                    "type": trigger.type,
                    "sub_type": trigger.sub_type,
                    "command": trigger.command,
                    "command_type": trigger.command_type
                }
            }, status=status.HTTP_201_CREATED)
            
        except DoesNotExist:
            return Response({
                "error": "Organization not found"
            }, status=status.HTTP_404_NOT_FOUND)
    
    def _create_survey_task(self, data, user):
        """Crear task de tipo survey"""
        try:
            # Verificar que el usuario tenga una organización
            if not user.organization:
                return Response({
                    "error": "Usuario no pertenece a ninguna organización"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            organization = user.organization
            
            # Obtener conexión a MongoDB para el workaround
            from pymongo import MongoClient
            import os
            
            mongo_user = os.getenv("MONGO_USER", "")
            mongo_password = os.getenv("MONGO_PASSWORD", "")
            mongo_host = os.getenv("MONGO_HOST", "localhost")
            mongo_db = os.getenv("MONGO_DB", "loophack")
            
            mongo_uri = f"mongodb+srv://{mongo_user}:{mongo_password}@{mongo_host}/{mongo_db}"
            client = MongoClient(mongo_uri)
            db = client[mongo_db]
            
            # Crear el survey
            survey = Survey(
                name=data.get("name", "New Survey"),
                description=data.get("description", ""),
                type="task",  # Requerido por Element base class
                sub_type="survey",  # Ya definido en Survey pero asegurémos
                organization=organization,
                checkpoint_name=data.get("checkpoint_name", "default_checkpoint"),
                questions=data.get("questions", [])
            )

            serialized_questions = self._serialize_questions(survey.questions)
            
            # Workaround: usar MongoDB directamente para salvar con referencia correcta
            survey_dict = {
                "name": survey.name,
                "description": survey.description,
                "type": survey.type,
                "sub_type": survey.sub_type,
                "organization": organization.id,
                "checkpoint_name": survey.checkpoint_name,
                "questions": serialized_questions,
                "created_at": survey.created_at,
                "updated_at": survey.updated_at
            }
            
            # Si se especifica un default_next_element, usarlo; sino, auto-referencia
            next_element_id = data.get("default_next_element_id")
            if next_element_id:
                # Verificar que el elemento exista y pertenezca a la misma organización
                next_element = db.elements.find_one({
                    "_id": ObjectId(next_element_id),
                    "organization": ObjectId(organization.id)
                })
                if next_element:
                    # Determinar la clase basada en el tipo/sub_type
                    cls_map = {
                        ("trigger", "onArrival"): "OnArrival",
                        ("task", "survey"): "Survey",
                        ("task", "info"): "Info"
                    }
                    element_cls = cls_map.get((next_element.get("type"), next_element.get("sub_type")), "Element")
                    
                    # Usar la estructura correcta para MongoDB
                    from bson import DBRef
                    survey_dict["default_next_element"] = {
                        "_cls": element_cls,
                        "_ref": DBRef("elements", ObjectId(next_element_id))
                    }
                else:
                    return Response({
                        "error": f"Next element with ID {next_element_id} not found or does not belong to your organization"
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Insertar en MongoDB
            result = db.elements.insert_one(survey_dict)
            survey_id = result.inserted_id
            
            # Si no se especificó next_element, usar auto-referencia
            if not next_element_id:
                from bson import DBRef
                db.elements.update_one(
                    {"_id": survey_id},
                    {"$set": {
                        "default_next_element": {
                            "_cls": "Survey",
                            "_ref": DBRef("elements", survey_id)
                        }
                    }}
                )
            
            client.close()
            
            return Response({
                "message": "Survey task created successfully",
                "element": {
                    "id": str(survey_id),
                    "name": survey.name,
                    "description": survey.description,
                    "type": survey.type,
                    "sub_type": survey.sub_type,
                    "questions": serialized_questions
                }
            }, status=status.HTTP_201_CREATED)
            
        except DoesNotExist:
            return Response({
                "error": "Organization not found"
            }, status=status.HTTP_404_NOT_FOUND)

    def _create_info_task(self, data, user):
        """Crear task de tipo info"""
        try:
            # Verificar que el usuario tenga una organización
            if not user.organization:
                return Response({
                    "error": "Usuario no pertenece a ninguna organización"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            organization = user.organization
            
            # Obtener conexión a MongoDB
            from pymongo import MongoClient
            import os
            
            mongo_user = os.getenv("MONGO_USER", "")
            mongo_password = os.getenv("MONGO_PASSWORD", "")
            mongo_host = os.getenv("MONGO_HOST", "localhost")
            mongo_db = os.getenv("MONGO_DB", "loophack")
            
            mongo_uri = f"mongodb+srv://{mongo_user}:{mongo_password}@{mongo_host}/{mongo_db}"
            client = MongoClient(mongo_uri)
            db = client[mongo_db]
            
            # Crear el info task
            info = Info(
                name=data.get("name", "New Info"),
                description=data.get("description", ""),
                type="task",
                sub_type="info",
                organization=organization,
                checkpoint_name=data.get("checkpoint_name", "default_checkpoint"),
                info_text=data.get("info_text", ""),
                definition_of_done=data.get("definition_of_done", "")
            )
            
            # Convertir a dict para MongoDB
            info_dict = {
                "name": info.name,
                "description": info.description,
                "type": info.type,
                "sub_type": info.sub_type,
                "organization": organization.id,
                "checkpoint_name": info.checkpoint_name,
                "info_text": info.info_text,
                "definition_of_done": info.definition_of_done,
                "created_at": info.created_at,
                "updated_at": info.updated_at
            }
            
            # Manejar default_next_element
            next_element_id = data.get("default_next_element_id")
            if next_element_id:
                next_element = db.elements.find_one({
                    "_id": ObjectId(next_element_id),
                    "organization": ObjectId(organization.id)
                })
                if next_element:
                    cls_map = {
                        ("trigger", "onArrival"): "OnArrival",
                        ("task", "survey"): "Survey",
                        ("task", "info"): "Info",
                        ("task", "quiz"): "Quiz",
                        ("incentive", "points"): "PointsIncentive"
                    }
                    element_cls = cls_map.get((next_element.get("type"), next_element.get("sub_type")), "Element")
                    
                    from bson import DBRef
                    info_dict["default_next_element"] = {
                        "_cls": element_cls,
                        "_ref": DBRef("elements", ObjectId(next_element_id))
                    }
                else:
                    client.close()
                    return Response({
                        "error": f"Next element with ID {next_element_id} not found or does not belong to your organization"
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Insertar en MongoDB
            result = db.elements.insert_one(info_dict)
            info_id = result.inserted_id
            
            # Si no se especificó next_element, usar auto-referencia
            if not next_element_id:
                from bson import DBRef
                db.elements.update_one(
                    {"_id": info_id},
                    {"$set": {
                        "default_next_element": {
                            "_cls": "Info",
                            "_ref": DBRef("elements", info_id)
                        }
                    }}
                )
            
            client.close()
            
            return Response({
                "message": "Info task created successfully",
                "element": {
                    "id": str(info_id),
                    "name": info.name,
                    "description": info.description,
                    "type": info.type,
                    "sub_type": info.sub_type,
                    "info_text": info.info_text
                }
            }, status=status.HTTP_201_CREATED)
            
        except DoesNotExist:
            return Response({
                "error": "Organization not found"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error creating info task: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _create_quiz_task(self, data, user):
        """Crear task de tipo quiz"""
        try:
            # Verificar que el usuario tenga una organización
            if not user.organization:
                return Response({
                    "error": "Usuario no pertenece a ninguna organización"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            organization = user.organization
            
            # Obtener conexión a MongoDB
            from pymongo import MongoClient
            import os
            
            mongo_user = os.getenv("MONGO_USER", "")
            mongo_password = os.getenv("MONGO_PASSWORD", "")
            mongo_host = os.getenv("MONGO_HOST", "localhost")
            mongo_db = os.getenv("MONGO_DB", "loophack")
            
            mongo_uri = f"mongodb+srv://{mongo_user}:{mongo_password}@{mongo_host}/{mongo_db}"
            client = MongoClient(mongo_uri)
            db = client[mongo_db]
            
            # Crear el quiz task
            quiz = Quiz(
                name=data.get("name", "New Quiz"),
                description=data.get("description", ""),
                type="task",
                sub_type="quiz",
                organization=organization,
                checkpoint_name=data.get("checkpoint_name", "default_checkpoint"),
                questions=data.get("questions", []),
                options=data.get("options", {}),
                definition_of_done=data.get("definition_of_done", "")
            )

            serialized_questions = self._serialize_questions(quiz.questions)
            
            # Convertir a dict para MongoDB
            quiz_dict = {
                "name": quiz.name,
                "description": quiz.description,
                "type": quiz.type,
                "sub_type": quiz.sub_type,
                "organization": organization.id,
                "checkpoint_name": quiz.checkpoint_name,
                "questions": serialized_questions,
                "options": quiz.options,
                "definition_of_done": quiz.definition_of_done,
                "created_at": quiz.created_at,
                "updated_at": quiz.updated_at
            }
            
            # Manejar default_next_element
            next_element_id = data.get("default_next_element_id")
            if next_element_id:
                next_element = db.elements.find_one({
                    "_id": ObjectId(next_element_id),
                    "organization": ObjectId(organization.id)
                })
                if next_element:
                    cls_map = {
                        ("trigger", "onArrival"): "OnArrival",
                        ("task", "survey"): "Survey",
                        ("task", "info"): "Info",
                        ("task", "quiz"): "Quiz",
                        ("incentive", "points"): "PointsIncentive"
                    }
                    element_cls = cls_map.get((next_element.get("type"), next_element.get("sub_type")), "Element")
                    
                    from bson import DBRef
                    quiz_dict["default_next_element"] = {
                        "_cls": element_cls,
                        "_ref": DBRef("elements", ObjectId(next_element_id))
                    }
                else:
                    client.close()
                    return Response({
                        "error": f"Next element with ID {next_element_id} not found or does not belong to your organization"
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Insertar en MongoDB
            result = db.elements.insert_one(quiz_dict)
            quiz_id = result.inserted_id
            
            # Si no se especificó next_element, usar auto-referencia
            if not next_element_id:
                from bson import DBRef
                db.elements.update_one(
                    {"_id": quiz_id},
                    {"$set": {
                        "default_next_element": {
                            "_cls": "Quiz",
                            "_ref": DBRef("elements", quiz_id)
                        }
                    }}
                )
            
            client.close()
            
            return Response({
                "message": "Quiz task created successfully",
                "element": {
                    "id": str(quiz_id),
                    "name": quiz.name,
                    "description": quiz.description,
                    "type": quiz.type,
                    "sub_type": quiz.sub_type,
                    "questions": serialized_questions,
                    "options": quiz.options
                }
            }, status=status.HTTP_201_CREATED)
            
        except DoesNotExist:
            return Response({
                "error": "Organization not found"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error creating quiz task: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _create_points_incentive(self, data, user):
        """Crear incentivo de tipo points"""
        try:
            logger.info("Creating points incentive with data: %s", data)
            # Verificar que el usuario tenga una organización
            if not user.organization:
                return Response({
                    "error": "Usuario no pertenece a ninguna organización"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            organization = user.organization
            
            # Validar que se proporcione la liga
            league_id = data.get("League")
            if not league_id:
                return Response({
                    "error": "League ID is required for points incentive"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Obtener conexión a MongoDB
            from pymongo import MongoClient
            import os
            
            mongo_user = os.getenv("MONGO_USER", "")
            mongo_password = os.getenv("MONGO_PASSWORD", "")
            mongo_host = os.getenv("MONGO_HOST", "localhost")
            mongo_db = os.getenv("MONGO_DB", "loophack")
            
            mongo_uri = f"mongodb+srv://{mongo_user}:{mongo_password}@{mongo_host}/{mongo_db}"
            client = MongoClient(mongo_uri)
            db = client[mongo_db]
            
            # Verificar que la liga exista y pertenezca a la organización
            league_doc = db.leagues.find_one({
                "_id": ObjectId(league_id),
                "organization": ObjectId(organization.id)
            })
            
            if not league_doc:
                client.close()
                return Response({
                    "error": "League not found or does not belong to your organization"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validar points_amount
            points_amount = data.get("points_amount", 0)
            if not isinstance(points_amount, int) or points_amount <= 0:
                client.close()
                return Response({
                    "error": "points_amount must be a positive integer"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Crear el incentivo (para obtener timestamps)
            incentive = PointsIncentive(
                name=data.get("name", "New Points Incentive"),
                description=data.get("description", ""),
                type="incentive",
                sub_type="points",
                organization=organization,
                checkpoint_name=data.get("checkpoint_name", "default_checkpoint"),
                points_amount=points_amount,
                league=League(id=ObjectId(league_id))  # Temporal para obtener estructura
            )
            
            # Convertir a dict para MongoDB
            from bson import DBRef
            incentive_dict = {
                "name": incentive.name,
                "description": incentive.description,
                "type": "incentive",
                "sub_type": "points",
                "organization": organization.id,
                "checkpoint_name": incentive.checkpoint_name,
                "points_amount": points_amount,
                "league": DBRef("leagues", ObjectId(league_id)),
                "created_at": incentive.created_at,
                "updated_at": incentive.updated_at
            }
            
            # Manejar default_next_element
            next_element_id = data.get("default_next_element_id")
            if next_element_id:
                next_element = db.elements.find_one({
                    "_id": ObjectId(next_element_id),
                    "organization": ObjectId(organization.id)
                })
                if next_element:
                    cls_map = {
                        ("trigger", "onArrival"): "OnArrival",
                        ("task", "survey"): "Survey",
                        ("task", "info"): "Info",
                        ("task", "quiz"): "Quiz",
                        ("incentive", "points"): "PointsIncentive"
                    }
                    element_cls = cls_map.get((next_element.get("type"), next_element.get("sub_type")), "Element")
                    
                    incentive_dict["default_next_element"] = {
                        "_cls": element_cls,
                        "_ref": DBRef("elements", ObjectId(next_element_id))
                    }
                else:
                    client.close()
                    return Response({
                        "error": f"Next element with ID {next_element_id} not found or does not belong to your organization"
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Insertar en MongoDB
            result = db.elements.insert_one(incentive_dict)
            incentive_id = result.inserted_id
            
            # Si no se especificó next_element, usar auto-referencia
            if not next_element_id:
                db.elements.update_one(
                    {"_id": incentive_id},
                    {"$set": {
                        "default_next_element": {
                            "_cls": "PointsIncentive",
                            "_ref": DBRef("elements", incentive_id)
                        }
                    }}
                )
            
            client.close()
            
            return Response({
                "message": "Points incentive created successfully",
                "element": {
                    "id": str(incentive_id),
                    "name": incentive.name,
                    "description": incentive.description,
                    "type": "incentive",
                    "sub_type": "points",
                    "points_amount": points_amount,
                    "league": str(league_id)
                }
            }, status=status.HTTP_201_CREATED)
            
        except DoesNotExist:
            return Response({
                "error": "Organization not found"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error creating points incentive: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ElementDetailAPIView(APIView):
    permission_classes = [AllowAny]  # Temporal para testing
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request, element_id):
        """Obtiene un elemento específico por ID"""
        try:
            # Verificar que el usuario tenga una organización
            if not request.user.organization:
                return Response({
                    "error": "Usuario no pertenece a ninguna organización"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            from pymongo import MongoClient
            import os
            
            mongo_user = os.getenv("MONGO_USER", "")
            mongo_password = os.getenv("MONGO_PASSWORD", "")
            mongo_host = os.getenv("MONGO_HOST", "localhost")
            mongo_db = os.getenv("MONGO_DB", "loophack")
            
            mongo_uri = f"mongodb+srv://{mongo_user}:{mongo_password}@{mongo_host}/{mongo_db}"
            client = MongoClient(mongo_uri)
            db = client[mongo_db]
            
            # Buscar elemento por ID y organización
            element_doc = db.elements.find_one({
                "_id": ObjectId(element_id),
                "organization": ObjectId(request.user.organization.id)
            })
            
            if not element_doc:
                return Response({
                    "error": "Element not found or does not belong to your organization"
                }, status=status.HTTP_404_NOT_FOUND)
            
            element_data = {
                "id": str(element_doc["_id"]),
                "name": element_doc.get("name", "Unknown Element"),
                "description": element_doc.get("description", ""),
                "type": element_doc.get("type", "unknown"),
                "sub_type": element_doc.get("sub_type", "unknown"),
                "checkpoint_name": element_doc.get("checkpoint_name", ""),
                "created_at": element_doc.get("created_at"),
                "updated_at": element_doc.get("updated_at"),
                "organization": str(element_doc.get("organization", "")),
                "configuration": element_doc.get("configuration", {}),
            }
            
            # Extraer el default_next_element_id si existe
            default_next_element = element_doc.get("default_next_element")
            if default_next_element and isinstance(default_next_element, dict):
                # Estructura: {"_cls": "OnArrival", "_ref": DBRef("elements", ObjectId("..."))}
                if "_ref" in default_next_element:
                    ref = default_next_element["_ref"]
                    if hasattr(ref, 'id'):
                        element_data["default_next_element_id"] = str(ref.id)
                    else:
                        element_data["default_next_element_id"] = None
                else:
                    element_data["default_next_element_id"] = None
            else:
                element_data["default_next_element_id"] = None
            
            # Campos específicos por tipo y subtipo
            element_type = element_doc.get("type")
            sub_type = element_doc.get("sub_type")
            
            if element_type == "trigger" and sub_type == "onArrival":
                element_data.update({
                    "command": element_doc.get("command", ""),
                    "command_type": element_doc.get("command_type", "")
                })
            elif element_type == "task":
                if sub_type == "survey":
                    element_data.update({
                        "questions": element_doc.get("questions", [])
                    })
                elif sub_type == "info":
                    element_data.update({
                        "info_text": element_doc.get("info_text", ""),
                        "definition_of_done": element_doc.get("definition_of_done", "")
                    })
                elif sub_type == "quiz":
                    element_data.update({
                        "questions": element_doc.get("questions", []),
                        "options": element_doc.get("options", {}),
                        "definition_of_done": element_doc.get("definition_of_done", "")
                    })
            elif element_type == "incentive" and sub_type == "points":
                element_data.update({
                    "points_amount": element_doc.get("points_amount", 0),
                    "league": str(element_doc.get("league").id) if element_doc.get("league") else None
                })
            
            client.close()
            
            return Response({"element": element_data}, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error in ElementDetailAPIView.get: {str(e)}")
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, element_id):
        """Actualiza un elemento existente"""
        try:
            # Verificar que el usuario tenga una organización
            if not request.user.organization:
                return Response({
                    "error": "Usuario no pertenece a ninguna organización"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            from pymongo import MongoClient
            import os
            from datetime import datetime
            
            mongo_user = os.getenv("MONGO_USER", "")
            mongo_password = os.getenv("MONGO_PASSWORD", "")
            mongo_host = os.getenv("MONGO_HOST", "localhost")
            mongo_db = os.getenv("MONGO_DB", "loophack")
            
            mongo_uri = f"mongodb+srv://{mongo_user}:{mongo_password}@{mongo_host}/{mongo_db}"
            client = MongoClient(mongo_uri)
            db = client[mongo_db]
            
            # Verificar que el elemento existe y pertenece a la organización del usuario
            element_doc = db.elements.find_one({
                "_id": ObjectId(element_id),
                "organization": ObjectId(request.user.organization.id)
            })
            if not element_doc:
                client.close()
                return Response({
                    "error": "Element not found or does not belong to your organization"
                }, status=status.HTTP_404_NOT_FOUND)
            
            data = request.data
            element_type = element_doc.get("type")
            sub_type = element_doc.get("sub_type")
            
            # Preparar los datos de actualización
            update_data = {
                "updated_at": datetime.utcnow()
            }
            
            # Campos comunes que se pueden actualizar
            if "name" in data:
                update_data["name"] = data["name"]
            if "description" in data:
                update_data["description"] = data["description"]
            if "checkpoint_name" in data:
                update_data["checkpoint_name"] = data["checkpoint_name"]
            if "configuration" in data:
                update_data["configuration"] = data["configuration"]
            
            # Campos específicos por tipo
            if element_type == "trigger" and sub_type == "onArrival":
                if "command" in data:
                    update_data["command"] = data["command"]
                if "command_type" in data:
                    update_data["command_type"] = data["command_type"]
            elif element_type == "task" and sub_type == "survey":
                if "questions" in data:
                    update_data["questions"] = data["questions"]
            
            # Manejar actualización de default_next_element
            if "default_next_element_id" in data:
                next_element_id = data["default_next_element_id"]
                if next_element_id:
                    # Verificar que el elemento siguiente existe
                    next_element = db.elements.find_one({"_id": ObjectId(next_element_id)})
                    if next_element:
                        # Determinar la clase basada en el tipo/sub_type
                        cls_map = {
                            ("trigger", "onArrival"): "OnArrival",
                            ("task", "survey"): "Survey",
                            ("task", "info"): "Info"
                        }
                        element_cls = cls_map.get((next_element.get("type"), next_element.get("sub_type")), "Element")
                        
                        # Usar la estructura correcta para MongoDB
                        from bson import DBRef
                        update_data["default_next_element"] = {
                            "_cls": element_cls,
                            "_ref": DBRef("elements", ObjectId(next_element_id))
                        }
                    else:
                        client.close()
                        return Response({
                            "error": f"Next element with ID {next_element_id} not found"
                        }, status=status.HTTP_400_BAD_REQUEST)
                else:
                    # Si se envía None o vacío, usar auto-referencia
                    cls_map = {
                        ("trigger", "onArrival"): "OnArrival",
                        ("task", "survey"): "Survey",
                        ("task", "info"): "Info"
                    }
                    element_cls = cls_map.get((element_type, sub_type), "Element")
                    
                    from bson import DBRef
                    update_data["default_next_element"] = {
                        "_cls": element_cls,
                        "_ref": DBRef("elements", ObjectId(element_id))
                    }
            
            # Actualizar el elemento
            result = db.elements.update_one(
                {"_id": ObjectId(element_id)},
                {"$set": update_data}
            )
            
            if result.modified_count == 0:
                client.close()
                return Response({
                    "message": "No changes were made to the element"
                }, status=status.HTTP_200_OK)
            
            # Obtener el elemento actualizado
            updated_element = db.elements.find_one({"_id": ObjectId(element_id)})
            
            # Preparar la respuesta
            element_data = {
                "id": str(updated_element["_id"]),
                "name": updated_element.get("name", "Unknown Element"),
                "description": updated_element.get("description", ""),
                "type": updated_element.get("type", "unknown"),
                "sub_type": updated_element.get("sub_type", "unknown"),
                "checkpoint_name": updated_element.get("checkpoint_name", ""),
                "created_at": updated_element.get("created_at"),
                "updated_at": updated_element.get("updated_at"),
                "organization": str(updated_element.get("organization", "")),
                "configuration": updated_element.get("configuration", {}),
            }
            
            # Campos específicos por tipo
            if element_type == "trigger" and sub_type == "onArrival":
                element_data.update({
                    "command": updated_element.get("command", ""),
                    "command_type": updated_element.get("command_type", "")
                })
            elif element_type == "task" and sub_type == "survey":
                element_data.update({
                    "questions": updated_element.get("questions", [])
                })
            
            client.close()
            
            return Response({
                "message": f"{element_type.title()} {sub_type} updated successfully",
                "element": element_data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error in ElementDetailAPIView.put: {str(e)}")
            traceback.print_exc()
            return Response({
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)