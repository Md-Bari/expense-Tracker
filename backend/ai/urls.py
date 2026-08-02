from django.urls import path
# pyrefly: ignore [missing-import]
from .views import AIChatView, AITTSEndpoint

urlpatterns = [
    path('chat/', AIChatView.as_view(), name='ai-chat'),
    path('tts/', AITTSEndpoint.as_view(), name='ai-tts'),
]
