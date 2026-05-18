"""User Serializer for Django REST Framework
Este módulo define un serializador para el modelo de usuario MongoDB.
Utiliza Django REST Framework para manejar la serialización y validación de datos de usuario.
"""

from rest_framework import serializers
from core.shared.models.users.user import User
from core.shared.models.users.organization import Organization
from ..validators.validators import validate_password_strength
import uuid


class UserSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    userId = serializers.CharField(read_only=True)
    name = serializers.CharField(required=True, max_length=100)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password_strength]
    )
    organization_id = serializers.CharField(required=False, allow_null=True)
    role = serializers.ChoiceField(
        choices=["admin", "member", "viewer"], 
        default="member"
    )
    is_active = serializers.BooleanField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def to_representation(self, instance):
        """Convierte la instancia de MongoDB a representación JSON."""
        if instance is None:
            return None
            
        return {
            'id': str(instance.id),  # MongoDB ObjectId
            'userId': instance.userId,  # UUID para JWT
            'name': instance.name,
            'email': instance.email,
            'organization_id': str(instance.organization.id) if instance.organization else None,
            'organization_name': instance.organization.name if instance.organization else None,
            'role': instance.role,
            'is_active': instance.is_active,
            'created_at': instance.created_at,
            'updated_at': instance.updated_at,
        }

    def create(self, validated_data):
        """Crea un nuevo usuario con los datos validados.
        Args:
            validated_data (dict): Los datos validados del usuario.
        Returns:
            User: Una instancia del modelo User creada con los datos validados.
        """
        # Generar userId si no existe
        if 'userId' not in validated_data:
            validated_data['userId'] = str(uuid.uuid4())
        
        # Manejar organización si se proporciona
        organization_id = validated_data.pop('organization_id', None)
        organization = None
        if organization_id:
            try:
                organization = Organization.objects.get(id=organization_id)
            except Organization.DoesNotExist:
                raise serializers.ValidationError("La organización especificada no existe")
        
        # Crear usuario
        user = User(**validated_data)
        if organization:
            user.organization = organization
        user.set_password(validated_data["password"])
        user.save()
        return user

    def validate(self, data):
        """Valida los datos del usuario.
        Args:
            data (dict): Los datos del usuario a validar.
        Returns:
            dict: Los datos validados.
        """
        if "name" not in data or not data["name"]:
            raise serializers.ValidationError("El nombre es obligatorio")

        if "email" not in data or not data["email"]:
            raise serializers.ValidationError("El correo electrónico es obligatorio")

        if "password" not in data or not data["password"]:
            raise serializers.ValidationError("La contraseña es obligatoria")

        return data


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
