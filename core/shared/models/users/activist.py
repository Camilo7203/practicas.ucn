"""Activist MongoDB Model
Este módulo define el modelo de activista para MongoDB usando Mongoengine.
"""
import mongoengine as me
from datetime import datetime
from ..base import BaseModel
from .organization import Organization
from .accepted_terms import AcceptedTerms
from ..points.activist_badge import ActivistBadge
from ..points.stores.activist_points import ActivistPoints
from ..points.leagues.activist_division import ActivistDivision

class Activist(BaseModel):
    """Activista que participa en campañas."""

    organization = me.ReferenceField(
        Organization, required=True, reverse_delete_rule=me.CASCADE
    )

    phone = me.StringField()
    related_fields = me.DictField()  # Campos adicionales sin esquema fijo

    first_name = me.StringField(required=True)
    last_name = me.StringField(required=True)
    date_joined = me.DateTimeField(default=datetime.now)
    last_message = me.DateTimeField()

    is_active = me.BooleanField(default=True)
    accepted_terms = me.EmbeddedDocumentField(AcceptedTerms)

    system_points = me.ListField(default=list)

    divisions = me.EmbeddedDocumentListField(ActivistDivision, default=list)
    badges = me.EmbeddedDocumentListField(ActivistBadge, default=list)
    points = me.EmbeddedDocumentListField(ActivistPoints, default=list)

    meta = {"collection": "activists"}
