from django.urls import path
# pyrefly: ignore [missing-import]
from .views import AIChatView

urlpatterns = [
    path('chat/', AIChatView.as_view(), name='ai-chat'),
]
