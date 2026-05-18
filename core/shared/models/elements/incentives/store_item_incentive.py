import mongoengine as me
from .incentive import BaseIncentive
from ...points.stores.store_item import StoreItem

class StoreItemIncentive(BaseIncentive):
    """Modelo para representar incentivos de items de tienda que pueden ser asignados a campañas."""

    sub_type = me.StringField(
        required=True, choices=["store_items"], default="store_items"
    )
    store_item = me.ReferenceField(StoreItem, required=True, reverse_delete_rule=me.CASCADE)

    meta = {"collection": "elements"}