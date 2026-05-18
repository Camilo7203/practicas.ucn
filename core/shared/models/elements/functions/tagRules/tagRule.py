import mongoengine as me

class TagRule(me.EmbeddedDocument):
    """Regla de etiqueta para un tagger."""
    tag = me.StringField(required=True)
    rule = me.StringField(required=True)