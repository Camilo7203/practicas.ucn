import mongoengine as me
from .route import Route
from ..element import Element


class ElementRouter(Element):
    """Base class for all element router types in the gamification system."""
    meta = {"collection": "elements"}
    type = me.StringField(required=True, choices=["router"])
    sub_type = me.StringField(required=True, choices=["basic_router"])
    routes = me.EmbeddedDocumentListField(Route, default=[])