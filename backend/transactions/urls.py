from django.urls import path, include
from rest_framework.routers import DefaultRouter
# pyrefly: ignore [missing-import]
from .views import CategoryViewSet, TransactionViewSet, ExpenseSheetViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'sheets', ExpenseSheetViewSet, basename='expense-sheet')
router.register(r'', TransactionViewSet, basename='transaction')

urlpatterns = [
    path('', include(router.urls)),
]
