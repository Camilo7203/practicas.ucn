from rest_framework import serializers
from core.shared.models.users.user import User
from core.shared.models.users.organization import Organization


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