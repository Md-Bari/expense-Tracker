from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SubscriptionPlanViewSet,
    AdminUserListView,
    AdminCreateAdminView
)

router = DefaultRouter()
router.register('plans', SubscriptionPlanViewSet, basename='plan')

urlpatterns = [
    # Router endpoints (e.g. /api/subscriptions/plans/)
    path('', include(router.urls)),
    
    # Admin specific views (e.g. /api/subscriptions/admin/users/)
    path('admin/users/', AdminUserListView.as_view(), name='admin-user-list'),
    path('admin/create-admin/', AdminCreateAdminView.as_view(), name='admin-create-admin'),
]
