import mongoengine as me
from ..base import BaseModel
from ..users.activist import Activist

class Tag(BaseModel):
    """Modelo para las etiquetas relaciona activistas con tags."""
    activist = me.ReferenceField(Activist, reverse_delete_rule=me.CASCADE)
    tag = me.StringField(required=True)
    is_active = me.BooleanField(default=True)
