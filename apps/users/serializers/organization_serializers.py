"""Organization Serializer for Django REST Framework
Este módulo define un serializador para el modelo de organización MongoDB.
"""

import re
from rest_framework import serializers
from core.shared.models.users.organization import Organization
from core.shared.models.users.user import User


class OrganizationSerializer(serializers.Serializer):
    """Serializer para el modelo Organization usando Mongoengine"""
    
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(required=True, max_length=200)
    alias = serializers.CharField(required=True, max_length=50)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    logo = serializers.CharField(required=False, allow_blank=True, default="")
    segments = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        default=list
    )
    plan = serializers.ChoiceField(
        choices=["free", "basic", "premium"],
        default="free"
    )
    is_active = serializers.BooleanField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    
    # Campos para invitación de usuario admin
    admin_name = serializers.CharField(required=True, max_length=100, write_only=True)
    admin_email = serializers.EmailField(required=True, write_only=True)
    admin_password = serializers.CharField(required=True, min_length=8, write_only=True)

    def to_representation(self, instance):
        """Convierte la instancia de MongoDB a representación JSON."""
        if instance is None:
            return None
            
        return {
            'id': str(instance.id),
            'name': instance.name,
            'alias': instance.alias,
            'description': getattr(instance, 'description', ''),
            'logo': getattr(instance, 'logo', ''),
            'segments': getattr(instance, 'segments', []),
            'plan': getattr(instance, 'plan', 'free'),
            'is_active': getattr(instance, 'is_active', True),
            'created_at': getattr(instance, 'created_at', None),
            'updated_at': getattr(instance, 'updated_at', None),
        }

    def create(self, validated_data):
        """Crea una nueva organización con los datos validados y su admin."""
        try:
            # Extraer datos del admin
            admin_data = {
                'name': validated_data.pop('admin_name'),
                'email': validated_data.pop('admin_email'),
                'password': validated_data.pop('admin_password')
            }
            
            # Crear la organización primero
            validated_data['is_active'] = True
            organization = Organization(**validated_data)
            organization.save()
            
            # Crear el usuario admin
            from ..serializers.user import UserSerializer
            admin_serializer = UserSerializer(data={
                **admin_data,
                'role': 'admin',
                'organization': str(organization.id)
            })
            
            if admin_serializer.is_valid(raise_exception=True):
                admin_user = admin_serializer.save()
                admin_user.organization = organization
                admin_user.save()
            
            return organization
            
        except Exception as e:
            # Si algo falla, eliminar la organización si fue creada
            if 'organization' in locals():
                organization.delete()
            raise serializers.ValidationError(f"Error al crear organización: {str(e)}")

    def update(self, instance, validated_data):
        """Actualiza una organización existente."""
        # Remover campos de admin si están presentes en update
        validated_data.pop('admin_name', None)
        validated_data.pop('admin_email', None)
        validated_data.pop('admin_password', None)
        
        try:
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            return instance
        except Exception as e:
            raise serializers.ValidationError(f"Error al actualizar la organización: {str(e)}")

    def validate_admin_email(self, value):
        """Valida que el email del admin no esté en uso."""
        if User.objects(email=value).first():
            raise serializers.ValidationError("Ya existe un usuario con este email")
        return value

    def validate_name(self, value):
        """Valida que el nombre no esté vacío y tenga un formato válido."""
        if not value or not value.strip():
            raise serializers.ValidationError("El nombre de la organización es obligatorio")
        
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError("El nombre debe tener al menos 2 caracteres")
        
        return value

    def validate_alias(self, value):
        """Valida que el alias tenga formato correcto y sea único."""
        if not value or not value.strip():
            raise serializers.ValidationError("El alias es obligatorio")
        
        value = value.strip().lower()
        
        # Validar formato
        if not re.match(r'^[a-zA-Z0-9_-]+$', value):
            raise serializers.ValidationError(
                "El alias solo puede contener letras, números, guiones y guiones bajos"
            )
        
        # Validar longitud mínima
        if len(value) < 3:
            raise serializers.ValidationError("El alias debe tener al menos 3 caracteres")
        
        # Validar unicidad
        existing_org = Organization.objects(alias=value).first()
        if existing_org and (not self.instance or existing_org.id != self.instance.id):
            raise serializers.ValidationError("Ya existe una organización con este alias")
        
        return value

    def validate_segments(self, value):
        """Valida la lista de segmentos."""
        if value:
            cleaned_segments = list(set([segment.strip() for segment in value if segment.strip()]))
            return cleaned_segments
        return []

    def validate(self, data):
        """Validación global de los datos."""
        # Solo validar admin en creación, no en actualización
        if not self.instance:  # Creación
            required_admin_fields = ['admin_name', 'admin_email', 'admin_password']
            for field in required_admin_fields:
                if not data.get(field):
                    raise serializers.ValidationError(f"El campo {field} es obligatorio para crear una organización")
        
        return data