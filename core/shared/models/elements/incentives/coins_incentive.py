import mongoengine as me
from .incentive import BaseIncentive
from ...points.stores.store import Store

class CoinsIncentive(BaseIncentive):
    """Modelo para representar incentivos de puntos que pueden ser asignados a campañas."""

    sub_type = me.StringField(
        required=True, choices=["coins"], default="coins"
    )
    coins_amount = me.IntField(required=True)
    store = me.ReferenceField(Store, required=True, reverse_delete_rule=me.CASCADE)

    meta = {"collection": "elements"}