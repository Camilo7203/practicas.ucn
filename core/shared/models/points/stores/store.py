import mongoengine as me
from ...base import BaseModel
from .store_item import StoreItem
from ...users.organization import Organization


class Store(BaseModel):
    name = me.StringField(required=True, unique=True)
    description = me.StringField()
    currency = me.StringField(required=True)
    is_active = me.BooleanField(default=True)
    organization = me.ReferenceField(Organization, required=True, reverse_delete_rule=me.CASCADE)
    store_items = me.ListField(me.ReferenceField(StoreItem, reverse_delete_rule=me.CASCADE), default=list)

    meta = {"collection": "stores"}
