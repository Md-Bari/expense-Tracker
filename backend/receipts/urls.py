from django.urls import path
from .views import ReceiptUploadView

urlpatterns = [
    path('scan/', ReceiptUploadView.as_view(), name='receipt-scan'),
]
