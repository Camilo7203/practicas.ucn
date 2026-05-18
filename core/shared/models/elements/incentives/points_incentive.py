import mongoengine as me
from .incentive import BaseIncentive
from ...points.leagues.league import League

class PointsIncentive(BaseIncentive):
    """Modelo para representar incentivos de puntos que pueden ser asignados a campañas."""

    sub_type = me.StringField(
        required=True, choices=["points"], default="points"
    )
    points_amount = me.IntField(required=True)
    league = me.ReferenceField(League, required=True, reverse_delete_rule=me.CASCADE)

    meta = {"collection": "elements"}
