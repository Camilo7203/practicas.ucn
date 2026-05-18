import mongoengine as me
from core.shared.models.elements.element import Element

class Node(me.EmbeddedDocument):
    """Nodo de un loop."""
    element = me.GenericReferenceField(required=True)
    settings = me.DictField(required=False)