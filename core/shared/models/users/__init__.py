from .user import User
from .activist import Activist
from .organization import Organization
from .accepted_terms import AcceptedTerms

# Esto asegura que todas las clases se registren automáticamente
__all__ = [
    'User',
    'Organization',
    'Activist',
    'AcceptedTerms'
]