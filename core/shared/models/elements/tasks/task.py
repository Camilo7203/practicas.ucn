import mongoengine as me
from ..element import Element

class BaseTask(Element):
    """Base class for all task types in the gamification system."""
    meta = {
        'abstract': True,
        'allow_inheritance': True
    }
    type = me.StringField(required=True, choices=["task"])
    sub_type = me.StringField(required=True, choices=["survey", "quiz", "challenge", "info"])
    definition_of_done = me.StringField(required=False)