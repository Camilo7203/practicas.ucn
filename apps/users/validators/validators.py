"""Validadores personalizados para la aplicación de usuarios.
"""

import re
from rest_framework import serializers


def validate_password_strength(value):
    """Valida que la contraseña cumpla con los requisitos de seguridad.

    Requisitos:
    - Al menos 8 caracteres
    - Al menos una letra minúscula
    - Al menos una letra mayúscula
    - Al menos un carácter especial de: - * ? ! @ # $ / () {} = . , ; :

    Args:
        value (str): La contraseña a validar

    Returns:
        str: La contraseña validada

    Raises:
        ValidationError: Si la contraseña no cumple con los requisitos
    """
    # Validar longitud mínima
    if len(value) < 8:
        raise serializers.ValidationError(
            "La contraseña debe tener al menos 8 caracteres."
        )

    # Validar al menos una letra minúscula
    if not re.search(r"[a-z]", value):
        raise serializers.ValidationError(
            "La contraseña debe contener al menos una letra minúscula."
        )

    # Validar al menos una letra mayúscula
    if not re.search(r"[A-Z]", value):
        raise serializers.ValidationError(
            "La contraseña debe contener al menos una letra mayúscula."
        )

    # Validar al menos un carácter especial
    special_chars = r"[-*?!@#$/(){}\=.,;:]"
    if not re.search(special_chars, value):
        raise serializers.ValidationError(
            "La contraseña debe contener al menos uno de estos caracteres especiales: - * ? ! @ # $ / () {} = . , ; :"
        )

    return value
