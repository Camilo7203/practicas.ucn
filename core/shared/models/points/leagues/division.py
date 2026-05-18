import mongoengine as me
from ...base import BaseModel

class Division(BaseModel):
    name = me.StringField(required=True)
    description = me.StringField()
    max_points = me.IntField(required=True)
    is_active = me.BooleanField(default=True)
    order = me.IntField(required=True)
    icon = me.StringField(required=False)

    meta = {"collection": "divisions"}