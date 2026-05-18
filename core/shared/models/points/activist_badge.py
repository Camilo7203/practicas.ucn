import mongoengine as me
from .badge import Badge
from datetime import datetime

class ActivistBadge(me.EmbeddedDocument):
    badge = me.ReferenceField(Badge, required=True)
    is_active = me.BooleanField(default=True)
    updated_at = me.DateTimeField(default=datetime.now)