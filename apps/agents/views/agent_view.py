from django.http import JsonResponse
from core.shared.models.agents.agent import Agent
from rest_framework.permissions import IsAuthenticated
from apps.users.permissions.authentication import CustomJWTAuthentication
from rest_framework.views import APIView
import logging


logger = logging.getLogger(__name__)
class AgentAPIView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request):
        organization = getattr(request.user, 'organization', None)
        logger.info(f"User {request.user} belongs to organization: {organization}")
        if organization is None:
            logger.error("No organization found for user.")
            return JsonResponse({'error': 'No organization found for user.'}, status=400)
        logger.info(f"Fetching agents for organization: {organization.id}")
        agents = Agent.objects(organization=organization)
        logger.info(f"Found {len(agents)} agents for organization {organization.id}")
        agent_data = []
        for agent in agents:
            # Serialize model properly
            model_data = {}
            if agent.model:
                try:
                    model_data = {
                        'provider': getattr(agent.model, 'provider', ''),
                        'model': getattr(agent.model, 'model', ''),
                        'temperature': getattr(agent.model, 'temperature', 0.7),
                        'top_p': getattr(agent.model, 'top_p', 1.0),
                    }
                except Exception as e:
                    logger.error(f"Error serializing model for agent {agent.id}: {e}")
                    model_data = {}
            
            # Serialize settings properly
            settings_data = {}
            if agent.settings:
                try:
                    settings_data = {
                        'agent_name': getattr(agent.settings, 'agent_name', ''),
                        'has_emojies': getattr(agent.settings, 'has_emojies', False),
                        'gender': getattr(agent.settings, 'gender', ''),
                        'language': getattr(agent.settings, 'language', ''),
                        'energy': getattr(agent.settings, 'energy', ''),
                        'mind': getattr(agent.settings, 'mind', ''),
                        'nature': getattr(agent.settings, 'nature', ''),
                        'tactics': getattr(agent.settings, 'tactics', ''),
                        'identity': getattr(agent.settings, 'identity', ''),
                    }
                except Exception as e:
                    logger.error(f"Error serializing settings for agent {agent.id}: {e}")
                    settings_data = {}
            
            # Serialize config properly - skip problematic fields
            config_data = {}
            if agent.config:
                try:
                    # Only serialize simple fields, skip complex objects
                    config_data = {
                        'api_key': '[HIDDEN]',  # Hide sensitive API keys
                    }
                except Exception as e:
                    logger.error(f"Error serializing config for agent {agent.id}: {e}")
                    config_data = {}
            
            agent_data.append({
                'id': str(agent.id),  # Convert ObjectId to string
                '_id': str(agent.id),  # Also provide _id for MongoDB compatibility
                'name': agent.name,
                'provider': agent.provider,
                'model': model_data,
                'settings': settings_data,
                'provider_id': agent.provider_id,
                'description': agent.description,
                'is_active': agent.is_active,
                'organization': str(agent.organization.id) if agent.organization else None,
                'outbound_message_limit': agent.outbound_message_limit,
                'message_window_start': agent.message_window_start,
                'conversation_sent_counter': agent.conversation_sent_counter,
                'config': config_data,
                'created_at': agent.created_at.isoformat() if agent.created_at else None,
                'updated_at': agent.updated_at.isoformat() if agent.updated_at else None
            })
        return JsonResponse({'agents': agent_data}, status=200)