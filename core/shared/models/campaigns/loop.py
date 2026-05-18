import mongoengine as me
from ..base import BaseModel
from ..users.user import User
from ..users.organization import Organization
from ..agents.agent import Agent
from .loop_components.edge import Edge
from .loop_components.node import Node
from ..users.organization import Organization
from ..elements.element_tag import ElementTag

from ..elements.tasks.info import Info
from ..elements.tasks.survey import Survey
from ..elements.triggers.onArrival import OnArrival

class Loop(BaseModel):
    """Modelo para representar un loop en el sistema de gamificación."""

    name = me.StringField(required=True, unique=True)
    default_loop = me.BooleanField(
        default=False
    ) 
    agent = me.ReferenceField(Agent, required=True, reverse_delete_rule=me.CASCADE)
    organization = me.ReferenceField(Organization, required=True, reverse_delete_rule=me.CASCADE)
    is_active = me.BooleanField(
        default=True
    )
    objective = me.StringField(
        options=["engagement", "retention", "conversion", "education", "feedback"],
        required=True,
    )
    trigger_type = me.StringField(
        required=True,
        choices=["onClick", "scheduled", "webhook", "onArrival", "idle", "onTag"],
    )
    trigger = me.GenericReferenceField(required=True)
    created_by = me.ReferenceField(User, required=True, reverse_delete_rule=me.CASCADE)
    organization = me.ReferenceField(Organization, required=True, reverse_delete_rule=me.CASCADE)

    edges = me.EmbeddedDocumentListField(Edge, default=list)
    nodes = me.EmbeddedDocumentListField(Node, default=list)
    tags = me.EmbeddedDocumentListField(ElementTag, default=list)

    meta = {"collection": "loops"}
    
    def load_elements(self):
        """
        Desreferencia explícitamente todos los GenericReferenceField en nodes y edges.
        MongoEngine no carga automáticamente referencias dentro de EmbeddedDocuments,
        así que este método asegura que node.element, edge.from_element y edge.to_element
        estén completamente resueltos en memoria.
        """
        try:
            # Cargar elementos en nodes
            for node in self.nodes:
                if node.element:
                    # Acceder al campo fuerza su dereferencia si es un DBRef
                    _ = node.element.id
        except Exception as e:
            print(f"Warning: Error loading node elements in loop {self.id}: {e}")
        
        try:
            # Cargar elementos en edges
            for edge in self.edges:
                if edge.from_element:
                    _ = edge.from_element.id
                if edge.to_element:
                    _ = edge.to_element.id
        except Exception as e:
            print(f"Warning: Error loading edge elements in loop {self.id}: {e}")
