import mongoengine as me

class Edge(me.EmbeddedDocument):
    """Arista de un loop."""
    from_element = me.GenericReferenceField(required=True)
    to_element = me.GenericReferenceField(required=True)
    settings = me.DictField(required=False, default={})