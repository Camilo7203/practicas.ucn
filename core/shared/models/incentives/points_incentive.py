import mongoengine as me
from .incentive import BaseIncentive
from ..points.point import PointsSystem

class PointsIncentive(BaseIncentive):
    """Modelo para representar incentivos de puntos que pueden ser asignados a campañas."""
    points_system = me.ReferenceField(PointsSystem, required=True, reverse_delete_rule=me.CASCADE)
    points_amount = me.IntField(required=True)  # Cantidad de puntos otorgados por el incentivo
    type = me.StringField(
        required=True, choices=["points"], default="points"
    )  # Tipo de incentivo, en este caso siempre será "points"

    meta = {"collection": "points_incentives"}