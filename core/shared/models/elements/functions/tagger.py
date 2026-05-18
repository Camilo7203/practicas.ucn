import mongoengine as me
from .function import Function
from .tagRules.tagRule import TagRule

class Tagger(Function):
    """Modelo para representar un tagger que etiqueta un activista o una entidad."""
    meta = {
        "collection": "elements"
    }

    sub_type = me.StringField(required=True, choices=["tagger"])
    rules = me.EmbeddedDocumentListField(TagRule, default=list)