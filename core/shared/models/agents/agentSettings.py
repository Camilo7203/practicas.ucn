import mongoengine as me

class AgentSettings(me.EmbeddedDocument):
    agent_name = me.StringField(required=True)
    has_emojies = me.BooleanField(required=True)
    gender = me.StringField(
        required=True,
        choices=["Male", "Female"]
    )
    language = me.StringField(
        required=True
    )
    energy = me.StringField(
        required=True,
        choices=["Introverded", "Extraverted"]
    )
    mind = me.StringField(
        required=True,
        choices=["Observant", "Intuitive"]
    )
    nature = me.StringField(
        required=True,
        choices=["Thinking", "Feeling"]
    )
    tactics = me.StringField(
        required=True,
        choices=["Judging", "Prospecting"]
    )
    identity = me.StringField(
        required=True,
        choices=["Assertive", "Turbulent"]
    )