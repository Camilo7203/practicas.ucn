"""Accepted Terms MongoDB Model
Este módulo define el modelo de términos aceptados para MongoDB usando Mongoengine.
"""
import mongoengine as me
from datetime import datetime


class AcceptedTerms(me.EmbeddedDocument):
    """Registro del consentimiento de términos del activista."""

    accepted = me.BooleanField(default=False)
    version = me.StringField(default="1.0")
    date = me.DateTimeField(default=datetime.now)