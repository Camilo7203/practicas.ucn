import mongoengine as me
from ..element import Element

class FixedMessage(Element):
    """Modelo para representar un mensaje fijo que puede ser asignado a un loop."""
    meta = {
        'collection': 'elements'
    }
    type = me.StringField(required=True, choices=["fixed_message"])
    sub_type = me.StringField(required=True, choices=["basic_fixed_message"])
    message = me.DictField(required=True)
    context = me.StringField(required=False)