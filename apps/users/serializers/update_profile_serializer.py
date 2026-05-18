"""Update Profile Serializer
Este módulo define el serializador para actualización de perfil de usuario.
Maneja permisos diferenciados: usuario normal edita name/email, admin puede editar role/is_active.
"""

from rest_framework import serializers
from core.shared.models.users.user import User


class UpdateProfileSerializer(serializers.Serializer):
    """Serializer para actualizar el perfil del usuario."""
    
    name = serializers.CharField(
        required=False,
        max_length=100,
        help_text="Nombre completo del usuario"
    )
    
    email = serializers.EmailField(
        required=False,
        help_text="Correo electrónico del usuario"
    )
    
    role = serializers.ChoiceField(
        choices=["admin", "member", "viewer"],
        required=False,
        help_text="Rol del usuario (solo editable por admin)"
    )
    
    is_active = serializers.BooleanField(
        required=False,
        help_text="Estado activo del usuario (solo editable por admin)"
    )

    def validate_email(self, value):
        """Valida que el email no esté en uso por otro usuario.
        
        Args:
            value (str): El email a validar.
            
        Returns:
            str: El email validado.
            
        Raises:
            ValidationError: Si el email ya está en uso por otro usuario.
        """
        user = self.context.get('user')
        if user and User.objects.filter(email=value, id__ne=user.id).first():
            raise serializers.ValidationError("Este correo electrónico ya está en uso.")
        return value

    def validate(self, data):
        """Valida los datos de actualización según el rol del usuario.
        
        Args:
            data (dict): Los datos a validar.
            
        Returns:
            dict: Los datos validados.
            
        Raises:
            ValidationError: Si el usuario intenta editar campos no permitidos.
        """
        request_user = self.context.get('request_user')
        target_user = self.context.get('user')
        
        # Validar que hay al menos un campo para actualizar
        if not data:
            raise serializers.ValidationError("Debe proporcionar al menos un campo para actualizar.")
        
        # Si no es admin, verificar que solo se editen campos permitidos
        if request_user and request_user.role != 'admin':
            # Usuarios normales solo pueden editar su propio perfil
            if target_user and str(target_user.id) != str(request_user.id):
                raise serializers.ValidationError(
                    "No tiene permisos para editar el perfil de otro usuario."
                )
            
            # Usuarios normales no pueden editar role ni is_active
            if 'role' in data:
                raise serializers.ValidationError({
                    "role": "No tiene permisos para modificar el rol."
                })
            if 'is_active' in data:
                raise serializers.ValidationError({
                    "is_active": "No tiene permisos para modificar el estado activo."
                })
        
        return data

    def update(self, instance, validated_data):
        """Actualiza el perfil del usuario con los datos validados.
        
        Args:
            instance (User): La instancia del usuario a actualizar.
            validated_data (dict): Los datos validados.
            
        Returns:
            User: La instancia actualizada del usuario.
        """
        # Actualizar campos permitidos
        if 'name' in validated_data:
            instance.name = validated_data['name']
        if 'email' in validated_data:
            instance.email = validated_data['email']
        if 'role' in validated_data:
            instance.role = validated_data['role']
        if 'is_active' in validated_data:
            instance.is_active = validated_data['is_active']
        
        instance.save()
        return instance

    def to_representation(self, instance):
        """Convierte la instancia actualizada a representación JSON.
        
        Args:
            instance (User): La instancia del usuario.
            
        Returns:
            dict: Representación JSON del usuario.
        """
        return {
            'id': str(instance.id),
            'userId': instance.userId,
            'name': instance.name,
            'email': instance.email,
            'organization_id': str(instance.organization.id) if instance.organization else None,
            'organization_name': instance.organization.name if instance.organization else None,
            'role': instance.role,
            'is_active': instance.is_active,
            'created_at': instance.created_at,
            'updated_at': instance.updated_at,
        }
