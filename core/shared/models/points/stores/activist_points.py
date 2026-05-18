import mongoengine as me
from .store import Store
from datetime import datetime

class ActivistPoints(me.EmbeddedDocument):
    coins = me.IntField(required=True)
    store = me.ReferenceField(Store, required=True)
    is_active = me.BooleanField(default=True)
    updated_at = me.DateTimeField(default=datetime.now)