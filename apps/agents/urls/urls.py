from django.urls import path, include
from ..views.agentRegister_view import AgentRegisterAPIView
from ..views.agent_view import AgentAPIView
from ..views.agent_detail_view import AgentDetailAPIView
from ..views.agent_update_view import AgentUpdateAPIView
from ..views.agent_delete_view import AgentDeleteAPIView
from ..views.agent_start_view import AgentStartAPIView
from ..views.agent_stop_view import AgentStopAPIView
from ..views.agent_status_view import AgentStatusAPIView
from ..views.agent_logs_view import AgentLogsAPIView
from ..views.agent_execute_view import AgentExecuteAPIView
from ..views.agent_messages_view import AgentMessagesAPIView

app_name = 'agents'

urlpatterns = [
    path('register', AgentRegisterAPIView.as_view(), name='agent-register'),
    path('list', AgentAPIView.as_view(), name='agent-list'),
    path('<str:agent_id>', AgentDetailAPIView.as_view(), name='agent-detail'),
    path('<str:agent_id>/update', AgentUpdateAPIView.as_view(), name='agent-update'),
    path('<str:agent_id>/delete', AgentDeleteAPIView.as_view(), name='agent-delete'),
    path('<str:agent_id>/start', AgentStartAPIView.as_view(), name='agent-start'),
    path('<str:agent_id>/stop', AgentStopAPIView.as_view(), name='agent-stop'),
    path('<str:agent_id>/status', AgentStatusAPIView.as_view(), name='agent-status'),
    path('<str:agent_id>/logs', AgentLogsAPIView.as_view(), name='agent-logs'),
    path('<str:agent_id>/execute', AgentExecuteAPIView.as_view(), name='agent-execute'),
    path('<str:agent_id>/messages', AgentMessagesAPIView.as_view(), name='agent-messages'),
    
    # URLs de conversaciones
    path('', include('apps.agents.urls.conversations_urls')),
]
