"""Change Password Serializer
Este módulo define el serializador para el cambio de contraseña con validaciones de seguridad.
"""

from rest_framework import serializers
from ..validators.validators import validate_password_strength


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer para cambiar la contraseña del usuario."""
    
    current_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        help_text="Contraseña actual del usuario"
    )
    
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password_strength],
        style={'input_type': 'password'},
        help_text="Nueva contraseña que debe cumplir con los requisitos de seguridad"
    )
    
    confirm_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        help_text="Confirmación de la nueva contraseña"
    )

    def validate_current_password(self, value):
        """Valida que la contraseña actual no esté vacía.
        
        Args:
            value (str): La contraseña actual proporcionada.
            
        Returns:
            str: La contraseña validada.
            
        Raises:
            ValidationError: Si la contraseña está vacía.
        """
        if not value:
            raise serializers.ValidationError("La contraseña actual es obligatoria.")
        return value

    def validate(self, data):
        """Valida que las contraseñas nuevas coincidan y sean diferentes de la actual.
        
        Args:
            data (dict): Los datos del formulario de cambio de contraseña.
            
        Returns:
            dict: Los datos validados.
            
        Raises:
            ValidationError: Si las validaciones fallan.
        """
        # Validar que las contraseñas nuevas coincidan
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Las contraseñas nuevas no coinciden.'
            })
        
        # Validar que la contraseña nueva sea diferente de la actual
        if data['current_password'] == data['new_password']:
            raise serializers.ValidationError({
                'new_password': 'La nueva contraseña debe ser diferente de la actual.'
            })
        
        return data

    def validate_user_current_password(self, user, current_password):
        """Valida que la contraseña actual del usuario sea correcta.
        
        Args:
            user (User): El usuario que quiere cambiar su contraseña.
            current_password (str): La contraseña actual proporcionada.
            
        Returns:
            bool: True si la contraseña es correcta.
            
        Raises:
            ValidationError: Si la contraseña actual es incorrecta.
        """
        if not user.check_password(current_password):
            raise serializers.ValidationError({
                'current_password': 'La contraseña actual es incorrecta.'
            })
        return True
