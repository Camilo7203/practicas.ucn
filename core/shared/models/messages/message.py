import mongoengine as me
from ..base import BaseModel
from datetime import datetime
from ..agents.agent import Agent
from ..users.activist import Activist
from .conversation import Conversation

class MessageRecord(BaseModel):
    """Representacion de un mensaje en una conversacion."""

    conversation = me.ReferenceField(
        Conversation, required=True, reverse_delete_rule=me.CASCADE
    )
    sender_type = me.StringField(required=True, choices=["agent", "activist"])
    # You can use GenericReferenceField to allow either type
    sender = me.GenericReferenceField(required=True)
    text = me.StringField(required=True)
    timestamp = me.DateTimeField(default=datetime.utcnow)
    message = (
        me.DictField()
    )  # TODO: Define the structure of the message, e.g., {'text': 'Hello', 'attachments': []}
    status = me.StringField(
        required=True, choices=["sent", "delivered", "read", "failed"], default="sent"
    )  # Status of the message in the conversation

    meta = {
        "collection": "message_records",
        "indexes": [
            ("conversation", "timestamp"),
            {"fields": ["timestamp"], "expireAfterSeconds": 60 * 60 * 24 * 365},
        ],
    }

    def clean(self):
        # ensure sender matches sender_type
        if self.sender_type == "agent" and not isinstance(self.sender, Agent):
            raise me.ValidationError("sender must be an Agent")
        if self.sender_type == "activist" and not isinstance(self.sender, Activist):
            raise me.ValidationError("sender must be an Activist")
