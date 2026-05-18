"""URLs de la aplicación de campaigns
Este módulo define las rutas para las vistas de campañas incluyendo encuestas y tareas.
"""
from django.urls import path
from ..views.trigger_view import TriggerRegisterAPIView
from ..views.loop_view import LoopRegisterAPIView, LoopListAPIView, LoopDetailAPIView
from ..views.element_view import ElementListAPIView, ElementCreateAPIView, ElementDetailAPIView
from ..views.template_send_view import (
    TemplateSendAPIView,
    BulkTemplateSendAPIView,
    TemplateMessageBuilderAPIView
)
from ..views.template_create_view import create_whatsapp_template
from ..views.template_list_pymongo_view import (
    TemplateListAPIView,
    TemplateDetailAPIView,
    ApprovedTemplatesAPIView
)
from ..views.blacklist_view import (
    BlackListListCreateAPIView,
    BlackListDetailAPIView,
)

app_name = 'campaigns'

urlpatterns = [
    path('trigger/register', TriggerRegisterAPIView.as_view(), name='trigger-register'),
    path('loop/register', LoopRegisterAPIView.as_view(), name='loop-register'),
    path('loops', LoopListAPIView.as_view(), name='loop-list'),
    path('loop/<str:loop_id>', LoopDetailAPIView.as_view(), name='loop-detail'),
    
    # Element endpoints
    path('elements', ElementListAPIView.as_view(), name='element-list'),
    path('elements/create', ElementCreateAPIView.as_view(), name='element-create'),
    path('elements/<str:element_id>', ElementDetailAPIView.as_view(), name='element-detail'),
    
    # Template sending endpoints
    path('template/send', TemplateSendAPIView.as_view(), name='template-send'),
    path('template/bulk-send', BulkTemplateSendAPIView.as_view(), name='template-bulk-send'),
    path('template/build-message', TemplateMessageBuilderAPIView.as_view(), name='template-build-message'),
    path('template/create', create_whatsapp_template, name='template-create'),
    
    # Template listing endpoints
    path('templates', TemplateListAPIView.as_view(), name='template-list'),
    path('templates/approved', ApprovedTemplatesAPIView.as_view(), name='approved-templates'),
    path('templates/<str:template_id>', TemplateDetailAPIView.as_view(), name='template-detail'),

    # Blacklist endpoints
    path('blacklist', BlackListListCreateAPIView.as_view(), name='blacklist-list-create'),
    path('blacklist/<str:blacklist_id>', BlackListDetailAPIView.as_view(), name='blacklist-detail'),
]