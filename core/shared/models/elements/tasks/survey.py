import mongoengine as me
from .task import BaseTask
from .questions.question import Question

class Survey(BaseTask):
    """Tarea de tipo encuesta."""

    meta = {
        "collection": "elements"
    }
    sub_type = me.StringField(default="survey", choices=["survey"])
    questions = me.EmbeddedDocumentListField(Question, default=list)
