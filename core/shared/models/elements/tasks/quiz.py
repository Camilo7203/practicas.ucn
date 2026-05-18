import mongoengine as me
from .task import BaseTask
from .questions.question import Question

class Quiz(BaseTask):
    """Tarea de tipo cuestionario."""

    meta = {
        "collection": "elements",
        "allow_inheritance": True
    }
    sub_type = me.StringField(default="quiz", choices=["quiz"])
    questions = me.EmbeddedDocumentListField(Question, default=list)
    options = me.DictField(default=dict)
