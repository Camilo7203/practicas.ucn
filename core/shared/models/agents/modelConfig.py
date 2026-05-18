import mongoengine as me

class ModelConfig(me.EmbeddedDocument):
    provider = me.StringField(
        required=True,
        choices=["ChatOpenAI", "OpenAI", "Google Gemini", "Anthropic"]
    )
    model = me.StringField(
        required=True,
        choices=["gpt-3.5-turbo", "gpt-4", "claude-2", "gemini-1.5"]
    )
    api_key = me.StringField(required=True)
    temperature = me.FloatField()
    top_p = me.FloatField()