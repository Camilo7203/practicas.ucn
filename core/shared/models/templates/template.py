import mongoengine as me
from ..base import BaseModel
from ..agents.agent import Agent
from ..users.organization import Organization


class Template(BaseModel):
    """Representa un template en el sistema."""

    name = me.StringField(required=True)
    organization = me.ReferenceField(Organization, required=True)
    agent = me.ReferenceField(Agent, required=True)
    active = me.BooleanField(required=True, default=True)
    provider = me.StringField(
        required=True,
        choices=["whatsapp", "telegram", "email", "instagram"]
    )
    provider_id = me.StringField(required=True)
    json_to_send = me.DictField()
    json_to_create = me.DictField()
    variables = me.DictField()

    meta = {"collection": "templates"}

