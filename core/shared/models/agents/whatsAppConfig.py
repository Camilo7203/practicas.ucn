import mongoengine as me
from .providerConfig import ProviderConfig

class WhatsAppConfig(ProviderConfig):
    """Configuración específica para WhatsApp."""

    phone_number = me.StringField(
        required=True
    )  # WhatsApp phone number in E.164 format
    business_name = me.StringField(
        required=True
    )  # Business name for WhatsApp Business API
    whatsapp_business_account_id = me.StringField(
        required=True
    )  # WhatsApp ID for the business
    number_id = me.StringField(required=True)  # WhatsApp number ID for the business
    version = me.StringField(required=True)