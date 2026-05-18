import mongoengine as me
from ..element import Element

class Unsubscriber(Element):
    """Modelo para representar un unsubscriber que puede ser asignado a un loop."""
    meta = {
        'collection': 'elements'
    }
    type = me.StringField(required=True, choices=["unsubscriber"])
    sub_type = me.StringField(required=True, choices=["basic_unsubscriber"])
    message_for_activist = me.StringField(required=True)
    message_for_agent = me.StringField(required=False)
    related_field = me.DictField(required=False)