import mongoengine as me

class MessageHistory(me.Document):
    """Representacion de un historial de mensajes en una conversacion."""

    SessionId = me.StringField(required=True)
    History = me.StringField(required=True)

    meta = {
        "collection": "message_histories"
    }