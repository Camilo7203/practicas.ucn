import mongoengine as me
from ..element import Element

class Route(me.EmbeddedDocument):
    condition = me.StringField(required=True)
    element = me.ReferenceField(Element, required=True)