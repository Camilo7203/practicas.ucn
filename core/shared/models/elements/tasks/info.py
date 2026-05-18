import mongoengine as me
from .task import BaseTask

class Info(BaseTask):
    """Tarea de tipo información."""

    meta = {
        "collection": "elements"
    }
    sub_type = me.StringField(default="info", choices=["info"])
    info_text = me.StringField(required=True)