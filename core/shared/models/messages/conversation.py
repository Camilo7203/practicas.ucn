import mongoengine as me
from ..base import BaseModel
from datetime import datetime
from ..agents.agent import Agent
from ..campaigns.loop import Loop
from ..users.activist import Activist
from ..elements.element import Element
from ..campaigns.campaign import Campaign

class Conversation(BaseModel):
    """Representacion del chat entre un activista y un agente."""

    activist = me.ReferenceField(
        Activist, required=True, reverse_delete_rule=me.CASCADE
    )
    agent = me.ReferenceField(Agent, required=True, reverse_delete_rule=me.CASCADE)

    started_at = me.DateTimeField(default=datetime.utcnow)
    ended_at = me.DateTimeField()

    campaign = me.ReferenceField(
        Campaign, required=False, reverse_delete_rule=me.CASCADE
    )  # Optional reference to a campaign
    is_active = me.BooleanField(
        default=True
    )  # Indicates if the conversation is still ongoing
    last_message_at = me.DateTimeField(
        default=datetime.utcnow
    )  # Timestamp of the last message in the conversation

    current_counter = me.IntField(
        default=0
    )  # Counter for the current message in the conversation
    current_loop = me.ReferenceField(Loop, required=False, reverse_delete_rule=me.CASCADE)
    current_element = me.ReferenceField(Element, required=False, reverse_delete_rule=me.CASCADE)

    meta = {"collection": "conversations"}

