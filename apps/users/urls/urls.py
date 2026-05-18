"""URLs de la aplicación de usuarios
Este módulo define las rutas para las vistas de usuarios incluyendo registro, login y perfil.
Sistema de invitaciones unificado que requiere solo x-api-key.
"""

from django.urls import path
from ..views import (
    UserRegisterView,
    UserLoginView,
    UserProfileView,
    OrganizationRegisterView,
)
from ..views.userInvitation_view import UserInvitationView, UserActivationView
from ..views.organization_view import (
    OrganizationDetailView,
    OrganizationListView,
    OrganizationMembersView,
    OrganizationMemberDetailView,
)
from ..views.organizationInvite_simple import (
    OrganizationInviteView, 
    InviteDetailView, 
    AcceptInviteView, 
    DeleteInviteView
)
from ..views.change_password_view import ChangePasswordView

app_name = 'users'

urlpatterns = [
    # API endpoints para usuarios (rutas estandarizadas con trailing slash)
    path('register/', UserRegisterView.as_view(), name='user-register'),
    path('login/', UserLoginView.as_view(), name='user-login'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    
    # API endpoints para organizaciones
    path('organization/register/', OrganizationRegisterView.as_view(), name='organization-register'),
    path('organizations/', OrganizationListView.as_view(), name='organization-list'),
    path('organization/', OrganizationDetailView.as_view(), name='organization-detail'),
    path('organization/users/', OrganizationMembersView.as_view(), name='organization-members'),
    path('organization/users/<str:user_id>/', OrganizationMemberDetailView.as_view(), name='organization-member-detail'),
    path('organization/<str:organization_id>/', OrganizationDetailView.as_view(), name='organization-detail-by-id'),
    
    # API endpoints para sistema de invitaciones 
    path('invite/', OrganizationInviteView.as_view(), name='organization-invite'),
    path('invite/<str:code>/', InviteDetailView.as_view(), name='invite-detail'),
    path('invite/<str:code>/accept/', AcceptInviteView.as_view(), name='invite-accept'),
    path('invite/<str:code>/delete/', DeleteInviteView.as_view(), name='invite-delete'),
    
    path('legacy/invite/', UserInvitationView.as_view(), name='user-invite-legacy'),
    path('legacy/activate/', UserActivationView.as_view(), name='user-activate-legacy'),
]