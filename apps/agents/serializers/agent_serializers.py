from rest_framework import serializers
from core.shared.models.agents.agent import Agent
from core.shared.models.agents.modelConfig import ModelConfig
from core.shared.models.agents.agentSettings import AgentSettings
from core.shared.models.agents.providerConfig import ProviderConfig
from core.shared.models.users.organization import Organization
import logging


logger = logging.getLogger(__name__)
# Importar toda s las configuraciones para registrarlas
from core.shared.models.agents.whatsAppConfig import WhatsAppConfig

class AgentSerializer(serializers.Serializer):
    name = serializers.CharField(required=True)
    provider = serializers.CharField(required=True)
    model = serializers.CharField(required=True)
    provider_id = serializers.CharField(required=True)
    description = serializers.CharField(required=False, allow_blank=True)
    is_active = serializers.BooleanField(default=True)
    organization = serializers.CharField(required=False, allow_blank=True)  # Opcional, usar organización del usuario
    outbound_message_limit = serializers.IntegerField(default=100)
    message_window_start = serializers.IntegerField(default=3600)
    conversation_sent_counter = serializers.IntegerField(default=0)
    config = serializers.JSONField(default=dict)
    model_config = serializers.JSONField(required=False, default=dict)
    settings = serializers.JSONField(required=False, default=dict)

    def validate_organization(self, value):
        if not value:
            return None  # Se asignará la organización del usuario
        try:
            org = Organization.objects.get(id=value)
        except Exception:
            raise serializers.ValidationError("Organization does not exist or invalid ID")
        return org

    def create(self, validated_data):
        # Extraer organización o usar la del usuario autenticado
        org = validated_data.pop("organization", None)
        if not org and hasattr(self, 'context') and 'request' in self.context:
            org = getattr(self.context['request'].user, 'organization', None)
        
        if not org:
            raise serializers.ValidationError("No organization provided and user has no organization")

        # Extraer configuraciones
        model_config_data = validated_data.pop("model_config", {})
        settings_data = validated_data.pop("settings", {})
        
        # Crear ModelConfig
        model_config = None
        if model_config_data:
            model_config = ModelConfig(
                provider=model_config_data.get('provider', 'ChatOpenAI'),
                model=model_config_data.get('model', validated_data.get('model', 'gpt-3.5-turbo')),
                api_key=model_config_data.get('api_key', ''),
                temperature=model_config_data.get('temperature', 0.7),
                top_p=model_config_data.get('top_p', 1.0)
            )

        # Crear AgentSettings
        agent_settings = None
        if settings_data:
            agent_settings = AgentSettings(
                agent_name=settings_data.get('agent_name', validated_data.get('name', '')),
                has_emojies=settings_data.get('has_emojies', True),
                gender=settings_data.get('gender', 'Male'),
                language=settings_data.get('language', 'Spanish'),
                energy=settings_data.get('energy', 'Extraverted'),
                mind=settings_data.get('mind', 'Intuitive'),
                nature=settings_data.get('nature', 'Feeling'),
                tactics=settings_data.get('tactics', 'Judging'),
                identity=settings_data.get('identity', 'Assertive')
            )

        # Crear ProviderConfig básico
        provider_config = None
        config_data = validated_data.get('config', {})
        if config_data:
            provider_config = ProviderConfig(
                api_key=config_data.get('api_key', model_config_data.get('api_key', ''))
            )

        # Crear agente
        agent = Agent(
            name=validated_data['name'],
            provider=validated_data['provider'],
            provider_id=validated_data['provider_id'],
            description=validated_data.get('description', ''),
            is_active=validated_data.get('is_active', True),
            organization=org,
            outbound_message_limit=validated_data.get('outbound_message_limit', 100),
            message_window_start=validated_data.get('message_window_start', 3600),
            conversation_sent_counter=validated_data.get('conversation_sent_counter', 0),
            model=model_config,
            settings=agent_settings,
            config=provider_config
        )
        
        agent.save()
        return agent

    def to_representation(self, instance):
        # Serializar model config de forma segura
        model_data = {}
        if instance.model:
            try:
                model_data = {
                    'provider': getattr(instance.model, 'provider', ''),
                    'model': getattr(instance.model, 'model', ''),
                    'temperature': getattr(instance.model, 'temperature', 0.7),
                    'top_p': getattr(instance.model, 'top_p', 1.0),
                }
            except Exception as e:
                logger.error(f"Error serializing model config for agent {instance.id}: {e}")
                model_data = {}

        # Serializar settings de forma segura
        settings_data = {}
        if instance.settings:
            try:
                settings_data = {
                    'agent_name': getattr(instance.settings, 'agent_name', ''),
                    'has_emojies': getattr(instance.settings, 'has_emojies', False),
                    'gender': getattr(instance.settings, 'gender', ''),
                    'language': getattr(instance.settings, 'language', ''),
                    'energy': getattr(instance.settings, 'energy', ''),
                    'mind': getattr(instance.settings, 'mind', ''),
                    'nature': getattr(instance.settings, 'nature', ''),
                    'tactics': getattr(instance.settings, 'tactics', ''),
                    'identity': getattr(instance.settings, 'identity', ''),
                }
            except Exception as e:
                logger.error(f"Error serializing settings for agent {instance.id}: {e}")
                settings_data = {}
        
        # Serializar config de forma segura - skip problematic fields
        config_data = {}
        if instance.config:
            try:
                # Only serialize simple fields, skip complex objects
                config_data = {
                    'api_key': '[HIDDEN]',  # Hide sensitive API keys
                }
            except Exception as e:
                logger.error(f"Error serializing config for agent {instance.id}: {e}")
                config_data = {}

        return {
            'id': str(instance.id),
            '_id': str(instance.id),  # Also provide _id for MongoDB compatibility
            'name': instance.name,
            'provider': instance.provider,
            'model': model_data,
            'settings': settings_data,
            'provider_id': instance.provider_id,
            'description': instance.description,
            'is_active': instance.is_active,
            'organization': str(instance.organization.id) if instance.organization else None,
            'outbound_message_limit': instance.outbound_message_limit,
            'message_window_start': instance.message_window_start,
            'conversation_sent_counter': instance.conversation_sent_counter,
            'config': config_data,
            'created_at': instance.created_at.isoformat() if instance.created_at else None,
            'updated_at': instance.updated_at.isoformat() if instance.updated_at else None
        }
