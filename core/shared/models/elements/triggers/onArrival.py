import mongoengine as me
from core.shared.models.elements.triggers.trigger import Trigger

class OnArrival(Trigger):
    """Trigger de tipo onArrival."""

    meta = {
        "collection": "elements"
    }
    sub_type = me.StringField(default="onArrival", choices=["onArrival"])
    command = me.StringField(required=True)
    command_type = me.StringField(required=True, choices=["contains", "equals", "starts_with", "ends_with", "regex"])
    
    