"""
Utilidades para construir mensajes de plantilla de WhatsApp
"""
from typing import Dict, List, Any, Optional
import logging


logger = logging.getLogger(__name__)

class WhatsAppTemplateBuilder:
    """
    Constructor de mensajes de plantilla de WhatsApp en el formato de Meta API
    """
    
    def __init__(
        self,
        template_name: str,
        language_code: str,
        phone: str,
        agent_provider_id: str,
        organization_id: str
    ):
        """
        Inicializa el constructor de plantillas
        
        Args:
            template_name: Nombre de la plantilla aprobada en Meta
            language_code: Código de idioma (ej: es_CO, en_US, es, en)
            phone: Número de teléfono del destinatario
            agent_provider_id: Phone Number ID del agente WhatsApp Business
            organization_id: ID de la organización
        """
        self.template_name = template_name
        self.language_code = language_code
        self.phone = phone
        self.agent_provider_id = agent_provider_id
        self.organization_id = organization_id
        self.components = []
    
    def add_video_header(self, video_link: str) -> 'WhatsAppTemplateBuilder':
        """
        Agrega un header con video
        
        Args:
            video_link: URL del video (debe ser accesible públicamente)
        
        Returns:
            self para encadenamiento de métodos
        """
        header = {
            "type": "HEADER",
            "parameters": [
                {
                    "type": "video",
                    "video": {
                        "link": video_link
                    }
                }
            ]
        }
        self.components.append(header)
        return self
    
    def add_image_header(self, image_link: str) -> 'WhatsAppTemplateBuilder':
        """
        Agrega un header con imagen
        
        Args:
            image_link: URL de la imagen (debe ser accesible públicamente)
        
        Returns:
            self para encadenamiento de métodos
        """
        header = {
            "type": "HEADER",
            "parameters": [
                {
                    "type": "image",
                    "image": {
                        "link": image_link
                    }
                }
            ]
        }
        self.components.append(header)
        return self
    
    def add_document_header(
        self,
        document_link: str,
        filename: Optional[str] = None
    ) -> 'WhatsAppTemplateBuilder':
        """
        Agrega un header con documento
        
        Args:
            document_link: URL del documento (debe ser accesible públicamente)
            filename: Nombre del archivo (opcional)
        
        Returns:
            self para encadenamiento de métodos
        """
        document = {
            "link": document_link
        }
        if filename:
            document["filename"] = filename
        
        header = {
            "type": "HEADER",
            "parameters": [
                {
                    "type": "document",
                    "document": document
                }
            ]
        }
        self.components.append(header)
        return self
    
    def add_body_parameters(self, **variables) -> 'WhatsAppTemplateBuilder':
        """
        Agrega parámetros del cuerpo del mensaje
        
        Args:
            **variables: Variables del cuerpo como key=value
                        Ej: name="Juan", date="15 de octubre"
        
        Returns:
            self para encadenamiento de métodos
        """
        body = {
            "type": "BODY",
            "parameters": []
        }
        
        for param_name, param_value in variables.items():
            body["parameters"].append({
                "type": "text",
                "parameter_name": param_name,
                "text": str(param_value)
            })
        
        self.components.append(body)
        return self
    
    def add_quick_reply_button(
        self,
        index: int,
        payload: str
    ) -> 'WhatsAppTemplateBuilder':
        """
        Agrega un botón de respuesta rápida
        
        Args:
            index: Índice del botón (0, 1, 2, ...)
            payload: Payload que se enviará cuando se presione el botón
        
        Returns:
            self para encadenamiento de métodos
        """
        button = {
            "type": "button",
            "sub_type": "quick_reply",
            "index": str(index),
            "parameters": [
                {
                    "type": "payload",
                    "payload": payload
                }
            ]
        }
        self.components.append(button)
        return self
    
    def add_url_button(
        self,
        index: int,
        url_suffix: str
    ) -> 'WhatsAppTemplateBuilder':
        """
        Agrega un botón de URL dinámica
        
        Args:
            index: Índice del botón (0, 1, 2, ...)
            url_suffix: Sufijo dinámico para la URL
        
        Returns:
            self para encadenamiento de métodos
        """
        button = {
            "type": "button",
            "sub_type": "url",
            "index": str(index),
            "parameters": [
                {
                    "type": "text",
                    "text": url_suffix
                }
            ]
        }
        self.components.append(button)
        return self
    
    def build(self) -> Dict[str, Any]:
        """
        Construye el mensaje completo en el formato de Meta API
        
        Returns:
            Diccionario con el formato completo listo para enviar
        """
        return {
            "meta_body": {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": self.phone,
                "type": "template",
                "template": {
                    "name": self.template_name,
                    "language": {"code": self.language_code},
                    "components": self.components
                }
            },
            "agent_provider_id": self.agent_provider_id,
            "phone": self.phone,
            "organization_id": self.organization_id
        }


def build_template_message_from_dict(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Construye un mensaje de plantilla desde un diccionario de configuración
    
    Args:
        data: Diccionario con la configuración del mensaje
              {
                  "template_name": str,
                  "language_code": str,
                  "phone": str,
                  "agent_provider_id": str,
                  "organization_id": str,
                  "HEADER": {
                      "type": "video|image|document",
                      "link": str,
                      "filename": str (opcional, solo para documentos)
                  },
                  "body_variables": dict,
                  "buttons": [
                      {"index": int, "type": "quick_reply|url", "value": str}
                  ]
              }
    
    Returns:
        Diccionario con el formato completo listo para enviar
    """
    builder = WhatsAppTemplateBuilder(
        template_name=data["template_name"],
        language_code=data["language_code"],
        phone=data["phone"],
        agent_provider_id=data["agent_provider_id"],
        organization_id=data["organization_id"]
    )
    
    # Agregar header si existe
    if "HEADER" in data:
        header = data["HEADER"]
        header_type = header.get("type")
        link = header.get("link")
        
        if header_type == "video":
            builder.add_video_header(link)
        elif header_type == "image":
            builder.add_image_header(link)
        elif header_type == "document":
            builder.add_document_header(link, header.get("filename"))
    
    # Agregar parámetros del body si existen
    if "body_variables" in data:
        builder.add_body_parameters(**data["body_variables"])
    
    # Agregar botones si existen
    if "buttons" in data:
        for button in data["buttons"]:
            button_type = button.get("type", "quick_reply")
            index = button.get("index", 0)
            value = button.get("value", "")
            
            if button_type == "quick_reply":
                builder.add_quick_reply_button(index, value)
            elif button_type == "url":
                builder.add_url_button(index, value)
    
    return builder.build()


def validate_phone_number(phone: str) -> bool:
    """
    Valida que el número de teléfono esté en formato E.164
    
    Args:
        phone: Número de teléfono
    
    Returns:
        True si el formato es válido, False en caso contrario
    """
    import re
    # Formato E.164: + seguido de 1-15 dígitos
    pattern = r'^\+?[1-9]\d{1,14}$'
    return bool(re.match(pattern, phone.strip()))


def format_phone_number(phone: str, country_code: str = "57") -> str:
    """
    Formatea un número de teléfono al formato E.164
    
    Args:
        phone: Número de teléfono
        country_code: Código de país (por defecto Colombia: 57)
    
    Returns:
        Número formateado en E.164
    """
    # Remover espacios y caracteres no numéricos
    cleaned = ''.join(filter(str.isdigit, phone))
    
    # Si empieza con 0, quitarlo (común en Colombia)
    if cleaned.startswith('0'):
        cleaned = cleaned[1:]
    
    # Si no tiene código de país, agregarlo
    if not cleaned.startswith(country_code):
        cleaned = country_code + cleaned
    
    return cleaned


# Ejemplo de uso:
if __name__ == "__main__":
    # Ejemplo 1: Usando el builder
    message1 = (
        WhatsAppTemplateBuilder(
            template_name="cta_usme_t1",
            language_code="es_CO",
            phone="573001234567",
            agent_provider_id="839066315952659",
            organization_id="68ce063786003b3788df5a59"
        )
        .add_video_header("https://youtube.com/shorts/uQGi-ONM2uQ?feature=share")
        .add_body_parameters(name="Juan Pérez")
        .add_quick_reply_button(0, "¡Confirmo!")
        .add_quick_reply_button(1, "Esta vez no puedo")
        .build()
    )
    
    logger.info("Ejemplo 1 (Builder):")
    import json
    logger.info(json.dumps(message1, indent=2))
    
    # Ejemplo 2: Usando el constructor desde diccionario
    config = {
        "template_name": "cta_usme_t2",
        "language_code": "en",
        "phone": "573001234567",
        "agent_provider_id": "839066315952659",
        "organization_id": "68ce063786003b3788df5a59",
        "HEADER": {
            "type": "image",
            "link": "https://example.com/image.jpg"
        },
        "body_variables": {
            "name": "María García"
        },
        "buttons": [
            {"index": 0, "type": "quick_reply", "value": "¡Confirmo!"},
            {"index": 1, "type": "quick_reply", "value": "Esta vez no puedo"}
        ]
    }
    
    message2 = build_template_message_from_dict(config)
    
    logger.info("\n\nEjemplo 2 (Desde diccionario):")
    logger.info(json.dumps(message2, indent=2))
