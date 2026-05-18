import mongoengine as me
from .incentive import BaseIncentive
from ...points.badge import Badge

class BadgeIncentive(BaseIncentive):
    """Modelo para representar incentivos de badges que pueden ser asignados a campañas."""

    sub_type = me.StringField(
        required=True, choices=["badges"], default="badges"
    )
    badge = me.ReferenceField(Badge, required=True, reverse_delete_rule=me.CASCADE)

    meta = {"collection": "elements"}