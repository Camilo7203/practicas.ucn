import mongoengine as me

class PossibleAnswer(me.EmbeddedDocument):
    """Posible respuesta de una pregunta."""
    type = me.StringField(required=True, choices=[
        "single_choice", "multiple_choice",
        "checkbox", "radiobutton", "chipSelect"
    ])
    isRight = me.BooleanField(required=True, default=False)
    text = me.StringField(required=True)