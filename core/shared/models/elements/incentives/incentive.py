import mongoengine as me
from ..element import Element

class BaseIncentive(Element):
    """Modelo para representar incentivos que pueden ser asignados a campañas."""
    meta = {
        'abstract': True,
    }
    type = me.StringField(required=True, choices=["incentive"])
    sub_type = me.StringField(required=True, choices=["points", "coins", "badges", "store_items"])

