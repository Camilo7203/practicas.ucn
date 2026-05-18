from ..base import BaseModel
import mongoengine as me
from .modelConfig import ModelConfig
from .agentSettings import AgentSettings
from .providerConfig import ProviderConfig
from ..users.organization import Organization

class Agent(BaseModel):
    """Esta clase representa un agente dentro del sistema."""

    provider = me.StringField(
        required=True, choices=["whatsapp", "telegram", "email", "instagram"]
    )
    model = me.EmbeddedDocumentField(ModelConfig, required=True)
    settings = me.EmbeddedDocumentField(
        AgentSettings, required=True
    )
    provider_id = me.StringField(
        required=True
    )  # ID del agente en el proveedor puede ser un correo electrónico, número de teléfono, etc.
    name = me.StringField(required=True)
    description = me.StringField()
    is_active = me.BooleanField(
        default=True
    )  # soft‑delete / disable without dropping data
    organization = me.ReferenceField(
        Organization, required=True, reverse_delete_rule=me.CASCADE
    )
    outbound_message_limit = me.IntField(
        default=100
    )  # Límite de mensajes que el agente puede manejar
    message_window_start = me.IntField(default=3600)  # segundos
    conversation_sent_counter = me.IntField(default=0)
    config = me.EmbeddedDocumentField(ProviderConfig)
    meta = {"collection": "agents"}

