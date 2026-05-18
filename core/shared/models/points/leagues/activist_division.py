import mongoengine as me
from .division import Division
from datetime import datetime

class ActivistDivision(me.EmbeddedDocument):
    current_division = me.ReferenceField(Division, required=True)
    total_points = me.IntField(required=True)
    is_active = me.BooleanField(default=True)
    updated_at = me.DateTimeField(default=datetime.now)