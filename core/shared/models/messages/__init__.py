from .message import MessageRecord
from .conversation import Conversation
from .message_history import MessageHistory

# Esto asegura que todas las clases se registren automáticamente
__all__ = [
    'Conversation',
    'MessageRecord',
    'MessageHistory'
]