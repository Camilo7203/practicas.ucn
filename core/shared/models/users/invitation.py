"""Invitation MongoDB Model
Este módulo define el modelo de invitación para MongoDB usando Mongoengine.
"""

from mongoengine import Document, StringField, EmailField, BooleanField, DateTimeField, ReferenceField
from datetime import datetime, timedelta
import uuid
from .user import User
from .organization import Organization


class Invitation(Document):
    """Modelo de invitación usando Mongoengine para MongoDB"""
    
    code = StringField(required=True, unique=True, max_length=100)
    email = EmailField(required=False)  # Email opcional - se puede asignar después
    role = StringField(choices=["admin", "member", "viewer"], default="member")
    organization = ReferenceField('Organization', required=True)
    invited_by = ReferenceField('User', required=True)
    is_used = BooleanField(default=False)
    expires_at = DateTimeField(required=True)
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'invitations',
        'indexes': ['code', 'email', 'organization', 'expires_at', 'is_used']
    }

    def save(self, *args, **kwargs):
        """Override save para actualizar updated_at"""
        self.updated_at = datetime.utcnow()
        return super().save(*args, **kwargs)

    @classmethod
    def generate_invitation_code(cls):
        """Genera un código único de invitación"""
        timestamp = int(datetime.now().timestamp())
        random_str = str(uuid.uuid4()).replace('-', '')[:12]
        return f"{timestamp}-{random_str}"

    @classmethod
    def create_invitation(cls, role, organization, invited_by, email=None, expires_in_days=7):
        """Crea una nueva invitación
        
        Args:
            role (str): Rol del usuario (admin/member/viewer)
            organization (Organization): Organización a la que se invita
            invited_by (User): Usuario que envía la invitación
            email (str, optional): Email del usuario a invitar
            expires_in_days (int): Días hasta que expire la invitación (default: 7)
            
        Returns:
            Invitation: La invitación creada
        """
        code = cls.generate_invitation_code()
        expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
        
        invitation = cls(
            code=code,
            email=email,  # Puede ser None
            role=role,
            organization=organization,
            invited_by=invited_by,
            expires_at=expires_at
        )
        invitation.save()
        return invitation

    def is_expired(self):
        """Verifica si la invitación ha expirado"""
        return datetime.utcnow() > self.expires_at

    def is_valid(self):
        """Verifica si la invitación es válida (no usada y no expirada)"""
        return not self.is_used and not self.is_expired()

    def use_invitation(self):
        """Marca la invitación como usada"""
        self.is_used = True
        self.save()

    def get_invite_link(self, base_url="http://localhost:3000"):
        """Genera el link de invitación"""
        return f"{base_url}/invite/{self.code}"

    def __str__(self):
        return f"Invitación para {self.email or 'usuario anónimo'} a {self.organization.name}"

    def to_dict(self):
        """Convierte la invitación a diccionario para serialización"""
        return {
            'id': str(self.pk),
            'code': self.code,
            'email': self.email,  # Puede ser None
            'role': self.role,
            'organization': {
                'id': str(self.organization.pk),
                'name': self.organization.name,
                'logo': getattr(self.organization, 'logo', None)
            },
            'invited_by': {
                'id': str(self.invited_by.pk),
                'name': self.invited_by.name,
                'email': self.invited_by.email
            },
            'is_used': self.is_used,
            'is_expired': self.is_expired(),
            'is_valid': self.is_valid(),
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
