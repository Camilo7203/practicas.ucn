import mongoengine as me
from ..base import BaseModel
from .element_tag import ElementTag
from ..users.organization import Organization

class Element(BaseModel):
    """Modelo para representar un elemento de un loop."""

    meta = {
        'abstract': True,
        'allow_inheritance': True
    }

    name = me.StringField(required=True, default="Default Element")
    description = me.StringField(required=False, default="Default Description")
    type = me.StringField(required=True, choices=["task", "incentive", "fixed_message", "function", "trigger", "router", "unsubscriber"])
    sub_type = me.StringField(required=True)
    organization = me.ReferenceField(Organization, required=True, reverse_delete_rule=me.CASCADE)
    checkpoint_name = me.StringField(required=False, default="Default Checkpoint")
    default_next_element = me.GenericReferenceField(required=False)
    tags = me.EmbeddedDocumentListField(ElementTag, default=list)