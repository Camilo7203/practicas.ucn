import mongoengine as me
from ..base import BaseModel
from .campaign import Campaign

class Checkpoint(BaseModel):
    """Representa un punto de control en una campaña."""

    campaign = me.ReferenceField(
        Campaign, required=True, reverse_delete_rule=me.CASCADE
    )
    order = me.IntField(required=True)
    description = me.StringField()

    meta = {"collection": "checkpoints"}
