import mongoengine as me
from ..element import Element

class Function(Element):
    """Modelo para representar funciones que pueden ser ejecutadas en un loop."""

    meta = {
        'abstract': True,
        'allow_inheritance': True
    }
    code = me.StringField(
        required=True
    )  # Código de la función, puede ser un script o una referencia a un archivo
    provider = me.StringField(
        required=True, choices=["external_api", "internal_api"]
    )  # Lenguaje de programación utilizado
    sub_type = me.StringField(required=True, choices=["external_api", "internal_api", "tagger"])
