import mongoengine as me
from ...base import BaseModel
from .division import Division
from ...users.organization import Organization


class League(BaseModel):
    name = me.StringField(required=True, unique=True)
    description = me.StringField()
    point_name = me.StringField(required=True)
    is_active = me.BooleanField(default=True)
    organization = me.ReferenceField(Organization, required=True, reverse_delete_rule=me.CASCADE)
    divisions = me.ListField(me.ReferenceField(Division, reverse_delete_rule=me.CASCADE), default=list)

    meta = {"collection": "leagues"}
