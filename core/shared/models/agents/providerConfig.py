import mongoengine as me

class ProviderConfig(me.EmbeddedDocument):
    """Configuración base para proveedores."""

    api_key = me.StringField()
    meta = {
        'allow_inheritance': True,  # Habilita la herencia
    }