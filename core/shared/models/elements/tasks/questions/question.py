import mongoengine as me
from .possible_answer import PossibleAnswer

class Question(me.EmbeddedDocument):
    """Pregunta de tipo question."""
    question = me.StringField(required=True)
    type = me.StringField(required=True, choices=[
        "short_text","long_text",
        "single_choice", "multiple_choice",
        "checkbox","radiobutton","chipSelect",
        "number","boolean","date",
        "time","datetime",
        "email","phone", 
        "url", "image", "audio", "video", "document"])
    required = me.BooleanField(required=True, default=True)
    possible_answers = me.EmbeddedDocumentListField(PossibleAnswer, default=list, required=False)
    related_field = me.StringField(required=False)