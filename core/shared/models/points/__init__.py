from .badge import Badge
from .stores.store import Store
from .leagues.league import League
from .leagues.division import Division
from .activist_badge import ActivistBadge
from .stores.store_item import StoreItem
from .stores.activist_points import ActivistPoints
from .leagues.activist_division import ActivistDivision

# Esto asegura que todas las clases se registren automáticamente
__all__ = [
    'Badge',
    'Store',
    'League',
    'Division',
    'ActivistBadge',
    'StoreItem',
    'ActivistPoints',
    'ActivistDivision'
]