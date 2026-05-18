from django.urls import path
from apps.gamification.views.league_views import (
    LeagueListAPIView,
    LeagueCreateAPIView,
    LeagueDetailAPIView,
    LeagueRankingAPIView
)
from apps.gamification.views.division_views import (
    DivisionListAPIView,
    DivisionCreateAPIView,
    DivisionDetailAPIView
)
from apps.gamification.views.store_views import (
    StoreListAPIView,
    StoreCreateAPIView,
    StoreDetailAPIView
)
from apps.gamification.views.store_item_views import (
    StoreItemListAPIView,
    StoreItemCreateAPIView,
    StoreItemDetailAPIView
)
from apps.gamification.views.tag_views import (
    TagListAPIView,
    TagCreateAPIView,
    TagDetailAPIView,
    ActivistTagsAPIView,
    BulkTagAssignAPIView,
    UniqueTagsAPIView,
    SearchActivistAPIView
)

app_name = 'gamification'

urlpatterns = [
    # League endpoints
    path('leagues', LeagueListAPIView.as_view(), name='league-list'),
    path('leagues/create', LeagueCreateAPIView.as_view(), name='league-create'),
    path('leagues/<str:league_id>/ranking', LeagueRankingAPIView.as_view(), name='league-ranking'),
    path('leagues/<str:league_id>', LeagueDetailAPIView.as_view(), name='league-detail'),
    
    # Division endpoints
    path('divisions', DivisionListAPIView.as_view(), name='division-list'),
    path('divisions/create', DivisionCreateAPIView.as_view(), name='division-create'),
    path('divisions/<str:division_id>', DivisionDetailAPIView.as_view(), name='division-detail'),
    
    # Store endpoints
    path('stores', StoreListAPIView.as_view(), name='store-list'),
    path('stores/create', StoreCreateAPIView.as_view(), name='store-create'),
    path('stores/<str:store_id>', StoreDetailAPIView.as_view(), name='store-detail'),
    
    # Store Item endpoints
    path('store-items', StoreItemListAPIView.as_view(), name='store-item-list'),
    path('store-items/create', StoreItemCreateAPIView.as_view(), name='store-item-create'),
    path('store-items/<str:item_id>', StoreItemDetailAPIView.as_view(), name='store-item-detail'),
    
    # Tag endpoints
    path('tags', TagListAPIView.as_view(), name='tag-list'),
    path('tags/create', TagCreateAPIView.as_view(), name='tag-create'),
    path('tags/unique', UniqueTagsAPIView.as_view(), name='tag-unique'),
    path('tags/bulk-assign', BulkTagAssignAPIView.as_view(), name='tag-bulk-assign'),
    path('tags/<str:tag_id>', TagDetailAPIView.as_view(), name='tag-detail'),
    path('activists/<str:activist_id>/tags', ActivistTagsAPIView.as_view(), name='activist-tags'),
    path('activists/search', SearchActivistAPIView.as_view(), name='activist-search'),
]
