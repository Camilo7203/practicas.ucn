import mongoengine as me

class ElementTag(me.EmbeddedDocument):
    """Modelo para representar la relación entre un elemento y una etiqueta."""
    tag = me.StringField(required=True)
    rule = me.StringField(required=True)