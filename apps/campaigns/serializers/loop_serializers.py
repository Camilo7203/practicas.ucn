from rest_framework import serializers
from core.shared.models.campaigns.loop import Loop
from core.shared.models.elements.triggers.trigger import Trigger
# Import other concrete task models as needed
from core.shared.models.agents.agent import Agent
from core.shared.models.users.user import User
from core.shared.models.users.organization import Organization
from core.shared.models.elements.element import Element
from core.shared.models.elements.tasks.task import BaseTask
from core.shared.models.elements.incentives.incentive import BaseIncentive
from core.shared.models.elements.functions.function import Function
import mongoengine as me
import logging


logger = logging.getLogger(__name__)
def get_instance_by_id(id, models):
    """Try to get an instance by id from a list of models (MongoEngine)."""
    for model in models:
        try:
            return model.objects.get(id=id)
        except:
            continue
    return None


def get_loop_elements(loop_instance):
    """Get all elements in a loop following the chain from trigger."""
    elements = []
    current_element = loop_instance.trigger
    visited_ids = set()  # To prevent infinite loops
    
    while current_element and str(current_element.id) not in visited_ids:
        visited_ids.add(str(current_element.id))
        
        # Get element info
        element_info = {
            "id": str(current_element.id),
            "name": getattr(current_element, "name", "Unknown Element"),
            "description": getattr(current_element, "description", ""),
            "type": getattr(current_element, "type", "unknown"),
            "sub_type": getattr(current_element, "sub_type", "unknown"),
            "checkpoint_name": getattr(current_element, "checkpoint_name", ""),
        }
        
        # Add type-specific information
        if element_info["type"] == "trigger":
            element_info["trigger_type"] = getattr(loop_instance, "trigger_type", "unknown")
        
        elements.append(element_info)
        
        # Move to next element
        try:
            next_element = getattr(current_element, "default_next_element", None)
            if next_element:
                current_element = next_element
            else:
                break
        except Exception as e:
            logger.exception("Error getting next element", extra={"error": str(e)})
            break
    
    return elements



class LoopSerializer(serializers.Serializer):
    name = serializers.CharField()
    default_loop = serializers.BooleanField(required=False, default=False)
    agent = serializers.CharField(required=True)
    organization = serializers.CharField(required=True)
    objective = serializers.CharField()
    trigger = serializers.CharField(required=True)
    created_by = serializers.CharField(required=True)
    nodes = serializers.ListField(required=False, default=list)
    edges = serializers.ListField(required=False, default=list)
 

    def validate_agent(self, value):
        try:
            agent = Agent.objects.get(id=value)
            return agent
        except Exception as e:
            logger.exception("Agent validation failed", extra={"error": str(e)})
            raise serializers.ValidationError(f"Agent does not exist or invalid ID: {value} - Error: {str(e)}")

    def validate_trigger(self, value):
        try:
            # Usar pymongo directamente para buscar en la colección elements
            from pymongo import MongoClient
            from bson import ObjectId
            import os
            
            mongo_user = os.getenv("MONGO_USER", "")
            mongo_password = os.getenv("MONGO_PASSWORD", "")
            mongo_host = os.getenv("MONGO_HOST", "localhost")
            mongo_db = os.getenv("MONGO_DB", "loophack")
            
            mongo_uri = f"mongodb+srv://{mongo_user}:{mongo_password}@{mongo_host}/{mongo_db}"
            client = MongoClient(mongo_uri)
            db = client[mongo_db]
            
            # Buscar el trigger en la colección elements
            trigger_doc = db.elements.find_one({
                "_id": ObjectId(value),
                "type": "trigger"
            })
            
            client.close()
            
            if trigger_doc:
                # Retornar el ObjectId para uso posterior
                return ObjectId(value)
            else:
                logger.error(f"Trigger not found with ID: {value}")
                raise serializers.ValidationError(f"Trigger not found with ID: {value}")
                
        except Exception as e:
            logger.exception("Trigger validation failed", extra={"error": str(e)})
            raise serializers.ValidationError(f"Trigger does not exist or invalid ID: {value} - Error: {str(e)}")

    def validate_created_by(self, value):
        try:
            user = User.objects.get(id=value)
            return user
        except Exception as e:
            logger.exception("User validation failed", extra={"error": str(e)})
            raise serializers.ValidationError(f"User does not exist or invalid ID: {value} - Error: {str(e)}")

    def validate_organization(self, value):
        try:
            organization = Organization.objects.get(id=value)
            return organization
        except Exception as e:
            logger.exception("Organization validation failed", extra={"error": str(e)})
            raise serializers.ValidationError(f"Organization does not exist or invalid ID: {value} - Error: {str(e)}")

    def create(self, validated_data):
        agent_id = validated_data.pop("agent")  # Ya validado como ObjectId
        trigger_id = validated_data.pop("trigger")  # Ya validado como ObjectId
        created_by_id = validated_data.pop("created_by")  # Ya validado como ObjectId
        organization_id = validated_data.pop("organization")  # Ya validado como ObjectId
        nodes_data = validated_data.pop("nodes", [])  # Nodes del grafo
        edges_data = validated_data.pop("edges", [])  # Edges del grafo 
        # Obtener el documento del trigger para determinar el tipo y crear la referencia
        from pymongo import MongoClient
        from bson import ObjectId
        import os
        
        # Configurar conexión a MongoDB
        mongo_user = os.getenv("MONGO_USER", "")
        mongo_password = os.getenv("MONGO_PASSWORD", "")
        mongo_host = os.getenv("MONGO_HOST", "localhost")
        mongo_db = os.getenv("MONGO_DB", "loophack")
        
        mongo_uri = f"mongodb+srv://{mongo_user}:{mongo_password}@{mongo_host}/{mongo_db}"
        client = MongoClient(mongo_uri)
        db = client[mongo_db]
        
        try:
            # Obtener el documento del trigger para conocer su tipo
            trigger_doc = db.elements.find_one({"_id": ObjectId(trigger_id)})
            if not trigger_doc:
                raise serializers.ValidationError(f"Trigger not found with ID: {trigger_id}")
            
            # Determinar el tipo de trigger
            trigger_type = trigger_doc.get("sub_type", "onArrival")
            
            # Crear objeto trigger usando el modelo correcto
            from core.shared.models.elements.triggers.onArrival import OnArrival
            
            # Filtrar solo los campos válidos para el modelo OnArrival
            # Campos de BaseModel: created_at, updated_at
            # Campos de Element: name, description, type, sub_type, organization, checkpoint_name, default_next_element
            # Campos de Trigger: type, sub_type, configuration
            # Campos de OnArrival: sub_type, command, command_type
            
            valid_fields = {}
            
            # Campos básicos siempre presentes
            if 'name' in trigger_doc:
                valid_fields['name'] = trigger_doc['name']
            if 'description' in trigger_doc:
                valid_fields['description'] = trigger_doc['description']
            if 'type' in trigger_doc:
                valid_fields['type'] = trigger_doc['type']
            if 'sub_type' in trigger_doc:
                valid_fields['sub_type'] = trigger_doc['sub_type']
            if 'checkpoint_name' in trigger_doc:
                valid_fields['checkpoint_name'] = trigger_doc['checkpoint_name']
            if 'configuration' in trigger_doc:
                valid_fields['configuration'] = trigger_doc['configuration']
            if 'command' in trigger_doc:
                valid_fields['command'] = trigger_doc['command']
            if 'command_type' in trigger_doc:
                valid_fields['command_type'] = trigger_doc['command_type']
            if 'created_at' in trigger_doc:
                valid_fields['created_at'] = trigger_doc['created_at']
            if 'updated_at' in trigger_doc:
                valid_fields['updated_at'] = trigger_doc['updated_at']
                
            # Para las referencias, necesito manejarlas especialmente
            if 'organization' in trigger_doc:
                valid_fields['organization'] = trigger_doc['organization']
            if 'default_next_element' in trigger_doc:
                valid_fields['default_next_element'] = trigger_doc['default_next_element']
            
            
            # Recrear el trigger como documento MongoEngine
            trigger_obj = OnArrival(**valid_fields)
            trigger_obj.id = trigger_doc['_id']
            
            # Procesar nodes y edges para crear EmbeddedDocuments
            from core.shared.models.campaigns.loop_components.node import Node
            from core.shared.models.campaigns.loop_components.edge import Edge
            
            processed_nodes = []
            processed_edges = []
            
            # Procesar nodes
            for node_data in nodes_data:
                try:
                    # Nueva estructura: { elementId: string, settings: object }
                    element_id = node_data.get('elementId')
                    settings = node_data.get('settings', {})
                    
                    if element_id:
                        # Buscar el elemento en la base de datos
                        element_doc = db.elements.find_one({"_id": ObjectId(element_id)})
                        if element_doc:
                            element_obj = self._create_element_from_doc(element_doc)
                            if element_obj:
                                # Los settings ya vienen del frontend con toda la info de ReactFlow
                                node = Node(element=element_obj, settings=settings)
                                processed_nodes.append(node)
                except Exception as node_error:
                    logger.exception("Error processing node", extra={"error": str(node_error)})
                    continue
            
            # Procesar edges
            for edge_data in edges_data:
                try:
                    # Nueva estructura: { source_element_id: string, target_element_id: string, settings: object }
                    source_element_id = edge_data.get('source_element_id')
                    target_element_id = edge_data.get('target_element_id')
                    settings = edge_data.get('settings', {})
                    
                    if source_element_id and target_element_id:
                        # Buscar source element
                        source_doc = db.elements.find_one({"_id": ObjectId(source_element_id)})
                        source_element = self._create_element_from_doc(source_doc) if source_doc else None
                        
                        # Buscar target element
                        target_doc = db.elements.find_one({"_id": ObjectId(target_element_id)})
                        target_element = self._create_element_from_doc(target_doc) if target_doc else None
                        
                        if source_element and target_element:
                            # Los settings ya vienen del frontend con toda la info de ReactFlow
                            # Crear el Edge
                            edge = Edge(
                                from_element=source_element,
                                to_element=target_element,
                                settings=settings
                            )
                            processed_edges.append(edge)
                except Exception as edge_error:
                    logger.exception("Error processing edge", extra={"error": str(edge_error)})
                    continue
            
            # Cerrar conexión MongoDB antes de crear el loop
            client.close()
            
            # Crear el loop con la referencia completa del documento y los nodes/edges procesados
            loop = Loop(
                agent=agent_id,  # ReferenceField acepta ObjectId
                organization=organization_id,  # ReferenceField acepta ObjectId
                trigger=trigger_obj,  # GenericReferenceField necesita documento completo
                trigger_type=trigger_type,  # Campo requerido
                created_by=created_by_id,  # ReferenceField acepta ObjectId
                nodes=processed_nodes,  # Lista de Nodes
                edges=processed_edges,  # Lista de Edges
                **validated_data
            )
            loop.save()
            return loop
            
        except Exception as e:
            try:
                client.close()
            except:
                pass
            logger.exception("Error creating loop", extra={"error": str(e)})
            import traceback
            traceback.print_exc()
            raise serializers.ValidationError(f"Error creating loop: {str(e)}")

    def update(self, instance, validated_data):
        """
        Actualiza un loop existente, sobrescribiendo completamente los nodes y edges 
        con los datos del canvas.
        """
        from pymongo import MongoClient
        from bson import ObjectId
        import os
        
        
        # Actualizar campos básicos
        if 'name' in validated_data:
            instance.name = validated_data['name']
        if 'objective' in validated_data:
            instance.objective = validated_data['objective']
        if 'default_loop' in validated_data:
            instance.default_loop = validated_data['default_loop']
        
        # Si vienen nodes o edges, procesarlos y sobrescribir completamente
        nodes_data = validated_data.get('nodes', [])
        edges_data = validated_data.get('edges', [])
        
        if nodes_data or edges_data:
            
            # Configurar conexión a MongoDB
            mongo_user = os.getenv("MONGO_USER", "")
            mongo_password = os.getenv("MONGO_PASSWORD", "")
            mongo_host = os.getenv("MONGO_HOST", "localhost")
            mongo_db = os.getenv("MONGO_DB", "loophack")
            
            mongo_uri = f"mongodb+srv://{mongo_user}:{mongo_password}@{mongo_host}/{mongo_db}"
            client = MongoClient(mongo_uri)
            db = client[mongo_db]
            
            try:
                from core.shared.models.campaigns.loop_components.node import Node
                from core.shared.models.campaigns.loop_components.edge import Edge
                
                # Procesar nodes
                processed_nodes = []
                for node_data in nodes_data:
                    try:
                        element_id = node_data.get('elementId')
                        settings = node_data.get('settings', {})
                        
                        if element_id:
                            element_doc = db.elements.find_one({"_id": ObjectId(element_id)})
                            if element_doc:
                                element_obj = self._create_element_from_doc(element_doc)
                                if element_obj:
                                    node = Node(element=element_obj, settings=settings)
                                    processed_nodes.append(node)
                    except Exception as node_error:
                        logger.exception("Error processing node", extra={"error": str(node_error)})
                        continue
                
                # Sobrescribir completamente los nodes
                instance.nodes = processed_nodes
                
                # Procesar edges
                processed_edges = []
                for edge_data in edges_data:
                    try:
                        source_element_id = edge_data.get('source_element_id')
                        target_element_id = edge_data.get('target_element_id')
                        settings = edge_data.get('settings', {})
                        
                        if source_element_id and target_element_id:
                            source_doc = db.elements.find_one({"_id": ObjectId(source_element_id)})
                            target_doc = db.elements.find_one({"_id": ObjectId(target_element_id)})
                            
                            if source_doc and target_doc:
                                source_element = self._create_element_from_doc(source_doc)
                                target_element = self._create_element_from_doc(target_doc)
                                
                                if source_element and target_element:
                                    edge = Edge(
                                        from_element=source_element,
                                        to_element=target_element,
                                        settings=settings
                                    )
                                    processed_edges.append(edge)
                    except Exception as edge_error:
                        logger.exception("Error processing edge", extra={"error": str(edge_error)})
                        continue
                
                # Sobrescribir completamente los edges
                instance.edges = processed_edges
                
            finally:
                client.close()
        
        # Guardar el loop actualizado
        instance.save()
        return instance
    
    def _create_element_from_doc(self, element_doc):
        """
        Helper method para crear un objeto Element desde un documento de MongoDB.
        Maneja todos los tipos de elementos soportados.
        """
        from core.shared.models.elements.triggers.onArrival import OnArrival
        from core.shared.models.elements.tasks.survey import Survey
        from core.shared.models.elements.tasks.info import Info
        from core.shared.models.elements.incentives.points_incentive import PointsIncentive
        
        # Mapear tipos de elementos a sus clases
        element_classes = {
            'onArrival': OnArrival,
            'survey': Survey,
            'info': Info,
            'points': PointsIncentive,
        }
        
        sub_type = element_doc.get('sub_type')
        element_class = element_classes.get(sub_type)
        
        if not element_class:
            logger.warning(f"Unknown element sub_type: {sub_type}")
            return None
        
        # Recolectar campos válidos del documento
        element_fields = {}
        for field in ['name', 'description', 'type', 'sub_type', 'checkpoint_name', 
                      'configuration', 'command', 'command_type', 'questions', 
                      'info_text', 'points_amount', 'league']:
            if field in element_doc:
                element_fields[field] = element_doc[field]
        
        # Manejar referencias
        if 'organization' in element_doc:
            element_fields['organization'] = element_doc['organization']
        if 'default_next_element' in element_doc:
            element_fields['default_next_element'] = element_doc['default_next_element']
        if 'created_at' in element_doc:
            element_fields['created_at'] = element_doc['created_at']
        if 'updated_at' in element_doc:
            element_fields['updated_at'] = element_doc['updated_at']
        
        # Crear el objeto elemento
        element_obj = element_class(**element_fields)
        element_obj.id = element_doc['_id']
        
        return element_obj

    def to_representation(self, instance):
        try:
            # Get agent information - Resolve the reference properly
            agent_info = None
            if getattr(instance, "agent", None):
                try:
                    # If agent is a reference, we need to fetch it
                    if hasattr(instance.agent, 'id'):
                        # Agent is already loaded
                        agent = instance.agent
                    else:
                        # Agent is just an ObjectId reference, need to fetch it
                        from core.shared.models.agents.agent import Agent
                        agent = Agent.objects.get(id=instance.agent)
                    
                    agent_info = {
                        "id": str(agent.id),
                        "name": getattr(agent, "name", "Unknown Agent"),
                        "description": getattr(agent, "description", ""),
                        "provider": getattr(agent, "provider", "Unknown Provider")
                    }
                except Exception as e:
                    logger.exception("Error getting agent info", extra={"error": str(e)})
                    # Try to get basic info from the reference
                    try:
                        from core.shared.models.agents.agent import Agent
                        agent_id = instance.agent if isinstance(instance.agent, str) else str(instance.agent.id)
                        agent = Agent.objects.get(id=agent_id)
                        agent_info = {
                            "id": str(agent.id),
                            "name": getattr(agent, "name", "Unknown Agent"),
                            "description": getattr(agent, "description", ""),
                            "provider": getattr(agent, "provider", "Unknown Provider")
                        }
                    except Exception as fallback_error:
                        logger.exception("Fallback agent lookup failed", extra={"error": str(fallback_error)})
                        agent_info = {
                            "id": str(instance.agent) if instance.agent else "unknown",
                            "name": "Unknown Agent",
                            "description": "",
                            "provider": "Unknown Provider"
                        }

            # Get trigger information
            trigger_info = None
            if getattr(instance, "trigger", None):
                try:
                    trigger = instance.trigger
                    trigger_info = {
                        "id": str(trigger.id) if hasattr(trigger, 'id') else str(trigger._ref.id),
                        "type": getattr(instance, "trigger_type", "unknown"),
                        "name": getattr(trigger, "name", f"{instance.trigger_type} Trigger")
                    }
                except Exception as e:
                    logger.error(f"Error getting trigger info: {e}")
                    trigger_info = {
                        "id": str(instance.trigger._ref.id) if hasattr(instance.trigger, '_ref') else "unknown",
                        "type": getattr(instance, "trigger_type", "unknown"),
                        "name": f"{getattr(instance, 'trigger_type', 'Unknown')} Trigger"
                    }

            # Get created_by information
            created_by_info = None
            if getattr(instance, "created_by", None):
                try:
                    # Similar approach for user reference
                    if hasattr(instance.created_by, 'id'):
                        user = instance.created_by
                    else:
                        from core.shared.models.users.user import User
                        user = User.objects.get(id=instance.created_by)
                    
                    created_by_info = {
                        "id": str(user.id),
                        "name": getattr(user, "name", "Unknown User"),
                        "email": getattr(user, "email", "")
                    }
                except Exception as e:
                    logger.exception("Error getting created_by info", extra={"error": str(e)})
                    created_by_info = {
                        "id": str(instance.created_by) if instance.created_by else "unknown",
                        "name": "Unknown User", 
                        "email": ""
                    }

            # Get loop elements (mantener retrocompatibilidad)
            elements = []
            try:
                elements = get_loop_elements(instance)
            except Exception as e:
                logger.exception("Error getting loop elements", extra={"error": str(e)})

            # Serializar nodes
            nodes_data = []
            try:
                for node in getattr(instance, 'nodes', []):
                    element = node.element
                    # Usar nodeId original del frontend si existe, sino generar basado en element.id
                    node_id = node.settings.get('nodeId') if node.settings else None
                    if not node_id:
                        node_id = f"element-{str(element.id)}"
                    
                    node_dict = {
                        'id': node_id,
                        'type': node.settings.get('type', 'default') if node.settings else 'default',
                        'position': node.settings.get('position', {'x': 0, 'y': 0}) if node.settings else {'x': 0, 'y': 0},
                        'data': {
                            'element': {
                                'id': str(element.id),
                                'name': getattr(element, 'name', 'Unknown'),
                                'description': getattr(element, 'description', ''),
                                'type': getattr(element, 'type', 'unknown'),
                                'sub_type': getattr(element, 'sub_type', 'unknown'),
                                'checkpoint_name': getattr(element, 'checkpoint_name', ''),
                            },
                            'elementId': str(element.id),
                            # ✅ AGREGAR CAMPOS CRÍTICOS DE SETTINGS
                            'category': node.settings.get('category') if node.settings else None,
                            'title': node.settings.get('title') if node.settings else None,
                            'description': node.settings.get('description') if node.settings else None,
                            # dataType es el sub-tipo específico, con fallback a element.sub_type
                            'type': (node.settings.get('dataType') or node.settings.get('type') or getattr(element, 'sub_type', None)) if node.settings else getattr(element, 'sub_type', None),
                            'configData': node.settings.get('configData') if node.settings else None,
                        }
                    }
                    # Agregar settings adicionales de ReactFlow
                    if node.settings:
                        if 'style' in node.settings:
                            node_dict['style'] = node.settings['style']
                        if 'selected' in node.settings:
                            node_dict['selected'] = node.settings['selected']
                    
                    nodes_data.append(node_dict)
            except Exception as e:
                import traceback
                logger.error(f"Error serializing nodes in loop {getattr(instance, 'id', 'unknown')}: {str(e)}")
                logger.error(f"Traceback: {traceback.format_exc()}")
                logger.error(f"Error serializing nodes: {e}")
                traceback.print_exc()
            
            # Serializar edges
            edges_data = []
            try:
                for edge in getattr(instance, 'edges', []):
                    from_element = edge.from_element
                    to_element = edge.to_element
                    
                    # Usar IDs originales del frontend si existen
                    edge_id = edge.settings.get('edgeId') if edge.settings else None
                    if not edge_id:
                        edge_id = f"edge-{str(from_element.id)}-{str(to_element.id)}"
                    
                    source_node_id = edge.settings.get('sourceNodeId') if edge.settings else None
                    if not source_node_id:
                        source_node_id = f"element-{str(from_element.id)}"
                    
                    target_node_id = edge.settings.get('targetNodeId') if edge.settings else None
                    if not target_node_id:
                        target_node_id = f"element-{str(to_element.id)}"
                    
                    edge_dict = {
                        'id': edge_id,
                        'source': source_node_id,
                        'target': target_node_id,
                    }
                    # Agregar settings de ReactFlow
                    if edge.settings:
                        for key in ['animated', 'type', 'style', 'label', 'labelStyle', 'markerEnd', 'markerStart']:
                            if key in edge.settings:
                                edge_dict[key] = edge.settings[key]
                    
                    edges_data.append(edge_dict)
            except Exception as e:
                import traceback
                logger.error(f"Error serializing edges in loop {getattr(instance, 'id', 'unknown')}: {str(e)}")
                logger.error(f"Traceback: {traceback.format_exc()}")
                logger.error(f"Error serializing edges: {e}")
                traceback.print_exc()

            return {
                "id": str(instance.id),
                "name": instance.name,
                "default_loop": getattr(instance, "default_loop", False),
                "agent": agent_info,
                "objective": instance.objective,
                "trigger_type": getattr(instance, "trigger_type", "unknown"),
                "trigger": trigger_info,
                "created_by": created_by_info,
                "elements": elements,  # Mantener para retrocompatibilidad
                "nodes": nodes_data,  # Nuevos nodes del grafo
                "edges": edges_data,  # Nuevos edges del grafo
                "created_at": getattr(instance, "created_at", None),
                "updated_at": getattr(instance, "updated_at", None),
                # Additional fields for frontend
                "status": "active",  # Default status
                "tasks_count": len([e for e in elements if e.get("type") == "task"]),
                "incentives_count": len([e for e in elements if e.get("type") == "incentive"]),
            }
        except Exception as e:
            import traceback
            logger.critical(f"CRITICAL ERROR in LoopSerializer.to_representation() for loop {getattr(instance, 'id', 'unknown')}: {str(e)}")
            logger.critical(f"Traceback: {traceback.format_exc()}")
            logger.critical(f"CRITICAL ERROR in to_representation: {e}")
            traceback.print_exc()
            # Fallback basic representation
            return {
                "id": str(instance.id),
                "name": getattr(instance, "name", "Unknown Loop"),
                "default_loop": getattr(instance, "default_loop", False),
                "agent": {"id": str(instance.agent) if getattr(instance, "agent", None) else "unknown", "name": "Unknown Agent", "description": "", "provider": "Unknown Provider"},
                "objective": getattr(instance, "objective", "unknown"),
                "trigger_type": getattr(instance, "trigger_type", "unknown"),
                "trigger": {"id": "unknown", "type": "unknown", "name": "Unknown Trigger"},
                "created_by": {"id": str(instance.created_by) if getattr(instance, "created_by", None) else "unknown", "name": "Unknown User", "email": ""},
                "elements": [],  # Empty elements for fallback
                "nodes": [],  # Empty nodes for fallback
                "edges": [],  # Empty edges for fallback
                "created_at": getattr(instance, "created_at", None),
                "updated_at": getattr(instance, "updated_at", None),
                "status": "active",
                "tasks_count": 0,
                "incentives_count": 0,
            }
