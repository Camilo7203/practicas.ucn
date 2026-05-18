import mongoengine as me
from core.shared.models.elements.element import Element

class Trigger(Element):
    """Modelo para representar un trigger que inicia un loop.

    Tipos de triggers:
    onClick: Se activa al hacer clic en un botón o enlace.
    scheduled: Se activa en un horario programado.
    webhook: Se activa al recibir una solicitud HTTP.
    onArrival: Se activa al llegar al agente con un evento específico.
    idle: Se activa cuando el usuario está inactivo durante un período de tiempo.
    onTag: Se activa al etiquetar un usuario o una entidad.

    """
    meta = {
        'abstract': True,
        'allow_inheritance': True
    }
    type = me.StringField(required=True, choices=["trigger"])
    sub_type = me.StringField(
        required=True,
        choices=["onClick", "scheduled", "webhook", "onArrival", "idle", "onTag"],
    )
    configuration = me.DictField()
