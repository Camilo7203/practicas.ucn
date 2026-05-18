from .loop import Loop
from .campaign import Campaign
from .checkpoint import Checkpoint
from .loop_components.node import Node
from .loop_components.edge import Edge
# Esto asegura que todas las clases se registren automáticamente
__all__ = [
    'Campaign',
    'Loop',
    'Checkpoint',
    'Node',
    'Edge'
]