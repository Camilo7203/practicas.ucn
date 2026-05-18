"""User Invitation Serializer for Django REST Framework
Este módulo define serializers para el sistema de invitaciones de usuarios.
"""

from rest_framework import serializers
from core.shared.models.users.user import User
from core.shared.models.users.organization import Organization


class UserInvitationSerializer(serializers.Serializer):
    """Serializer para invitar usuarios a una organización."""
    
    email = serializers.EmailField(required=True)
    name = serializers.CharField(required=True, max_length=100)
    role = serializers.ChoiceField(
        choices=["admin", "member", "viewer"], 
        default="member"
    )
    organization_id = serializers.CharField(required=True)
    invited_by = serializers.CharField(read_only=True)

    def validate_email(self, value):
        """Valida que el email no esté en uso."""
        if User.objects(email=value).first():
            raise serializers.ValidationError("Ya existe un usuario con este email")
        return value

    def validate_organization_id(self, value):
        """Valida que la organización exista."""
        try:
            organization = Organization.objects.get(id=value)
            if not organization.is_active:
                raise serializers.ValidationError("La organización no está activa")
            return value
        except Organization.DoesNotExist:
            raise serializers.ValidationError("La organización no existe")

    def validate(self, data):
        """Validaciones cruzadas."""
        # Verificar que el usuario que invita sea admin de la organización
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            inviting_user = request.user
            organization = Organization.objects.get(id=data['organization_id'])
            
            if (inviting_user.organization != organization or 
                inviting_user.role != 'admin'):
                raise serializers.ValidationError(
                    "Solo los administradores de la organización pueden invitar usuarios"
                )
            
            data['invited_by'] = str(inviting_user.id)
        
        return data

    def create(self, validated_data):
        """Crea el usuario invitado con contraseña temporal."""
        import uuid
        
        # Generar contraseña temporal
        temp_password = str(uuid.uuid4())[:12]
        
        organization = Organization.objects.get(id=validated_data['organization_id'])
        
        user_data = {
            'userId': str(uuid.uuid4()),
            'name': validated_data['name'],
            'email': validated_data['email'],
            'password': temp_password,
            'role': validated_data['role'],
            'organization': organization,
            'is_active': False
        }
        
        user = User(**user_data)
        user.set_password(temp_password)
        user.save()
        
        return user


class UserActivationSerializer(serializers.Serializer):
    """Serializer para activar cuenta de usuario invitado."""
    
    email = serializers.EmailField(required=True)
    temp_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    confirm_password = serializers.CharField(required=True)

    def validate(self, data):
        """Validaciones cruzadas."""
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("Las contraseñas no coinciden")
        
        try:
            user = User.objects.get(email=data['email'])
            if user.is_active:
                raise serializers.ValidationError("El usuario ya está activado")
            
            if not user.check_password(data['temp_password']):
                raise serializers.ValidationError("Contraseña temporal incorrecta")
                
        except User.DoesNotExist:
            raise serializers.ValidationError("Usuario no encontrado")
        
        return data

    def save(self):
        """Activa el usuario y establece la nueva contraseña."""
        user = User.objects.get(email=self.validated_data['email'])
        user.set_password(self.validated_data['new_password'])
        user.is_active = True
        user.save()
        return user