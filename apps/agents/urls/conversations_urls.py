from django.urls import path
from ..views.conversations_view import ConversationsAPIView, ActivistConversationsAPIView, ConversationDetailAPIView

urlpatterns = [
    # Lista de conversaciones con filtros
    path('conversations/', ConversationsAPIView.as_view(), name='conversations-list'),
    
    # Lista de activistas con sus conversaciones
    path('activists-conversations/', ActivistConversationsAPIView.as_view(), name='activists-conversations'),
    
    # Detalle de una conversación específica
    path('conversations/<str:conversation_id>/', ConversationDetailAPIView.as_view(), name='conversation-detail'),
]