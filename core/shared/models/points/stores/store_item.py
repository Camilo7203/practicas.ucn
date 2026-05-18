import mongoengine as me
from ...base import BaseModel

class StoreItem(BaseModel):
    name = me.StringField(required=True)
    description = me.StringField()
    is_active = me.BooleanField(default=True)
    price = me.IntField(required=True)
    image = me.StringField(required=False)

    meta = {"collection": "store_items"}