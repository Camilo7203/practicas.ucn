import mongoengine as me
from ..base import BaseModel
from ..users.organization import Organization


class Badge(BaseModel):
    name = me.StringField(required=True, unique=True)
    description = me.StringField()
    is_active = me.BooleanField(default=True)
    organization = me.ReferenceField(Organization, required=True, reverse_delete_rule=me.CASCADE)
    image = me.StringField(required=False)

    meta = {"collection": "badges"}
