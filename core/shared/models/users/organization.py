"""Organization MongoDB Model
Este módulo define el modelo de organización para MongoDB usando Mongoengine.
"""
import mongoengine as me
from ..base import BaseModel
from datetime import datetime


class Organization(BaseModel):
    """Modelo de organización usando Mongoengine para MongoDB"""
    
    name = me.StringField(required=True, max_length=200)
    alias = me.StringField(required=True, unique=True, max_length=50)
    description = me.StringField(default="")
    logo = me.StringField(default="")
    segments = me.ListField(me.StringField(max_length=100), default=list)
    plan = me.StringField(choices=["free", "basic", "premium"], default="free")
    is_active = me.BooleanField(default=True)

    meta = {
        'collection': 'organizations',
        'indexes': ['alias', 'is_active']
    }

    def __str__(self):
        return f"{self.name} ({self.alias})"
