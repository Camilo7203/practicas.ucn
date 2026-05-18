"""User MongoDB Model
Este módulo define el modelo de usuario para MongoDB usando Mongoengine.
"""

from datetime import datetime
from django.contrib.auth.hashers import make_password, check_password
from mongoengine import Document, StringField, EmailField, BooleanField, DateTimeField, ReferenceField


class User(Document):
    """Modelo de usuario usando Mongoengine para MongoDB"""
    
    userId = StringField(required=True, unique=True, max_length=50)
    name = StringField(required=True, max_length=100)
    email = EmailField(required=True, unique=True)
    password = StringField(required=True)
    # Usar lazy reference para evitar importación circular
    organization = ReferenceField('Organization', default=None)
    role = StringField(choices=["admin", "member", "viewer"], default="member")
    is_active = BooleanField(default=True)
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'users',
        'indexes': ['userId', 'email', 'is_active']
    }

    def save(self, *args, **kwargs):
        """Override save para actualizar updated_at"""
        self.updated_at = datetime.utcnow()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.email})"

    @property
    def is_authenticated(self):
        """
        Requerido por DRF IsAuthenticated - Todos los objetos User se consideran autenticados
        """
        return True

    @property
    def isAnonymous(self):
        """
        Requerido para compatibilidad con Django
        """
        return False

    @property
    def isActive(self):
        """
        Requerido por DRF IsAuthenticated - Verifica si el usuario está activo
        """
        return self.isActive

    def set_status(self, is_active, target=None):
        """Establece el estado del usuario.
        Args:
            is_active (bool): Indica si el usuario está activo o no.
            target (str, optional): El objetivo del cambio de estado, si es necesario.
        Returns:
            None: No retorna ningún valor.
        """
        self.is_active = is_active
        self.save()
        if target:
            self.is_active = target
            self.save()

    def set_password(self, raw_password):
        """Establece la contraseña del usuario de forma segura.
        Args:
            raw_password (str): La contraseña en texto plano.
        returns:
            None: No retorna ningún valor.
        """
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        """Verifica si la contraseña proporcionada coincide con la almacenada.
        Args:
            raw_password (str): La contraseña en texto plano a verificar.
        Returns:
            bool: True si la contraseña coincide, False en caso contrario.
        """
        return check_password(raw_password, str(self.password))
