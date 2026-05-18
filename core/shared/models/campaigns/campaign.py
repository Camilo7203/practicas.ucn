from .loop import Loop
import mongoengine as me
from ..base import BaseModel


class Campaign(BaseModel):
    """Representa una campaña en el sistema."""

    name = me.StringField(required=True)
    loop = me.ReferenceField(Loop, required=True, reverse_delete_rule=me.CASCADE)
    start_date = me.DateTimeField(required=True)
    end_date = me.DateTimeField(required=True)
    active = me.BooleanField(
        default=True
    )  # Indicates if the campaign is currently active

    meta = {"collection": "campaigns"}