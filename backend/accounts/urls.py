from django.urls import path, re_path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, UserProfileView
from django.http import JsonResponse

def auth_root(request):
    return JsonResponse({
        "status": "online",
        "message": "Auth API endpoints",
        "endpoints": {
            "register": "/api/auth/register/",
            "login": "/api/auth/login/",
            "refresh": "/api/auth/refresh/",
            "profile": "/api/auth/profile/"
        }
    })

urlpatterns = [
    path('', auth_root),
    re_path(r'^register/?$', RegisterView.as_view(), name='register'),
    re_path(r'^login/?$', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    re_path(r'^refresh/?$', TokenRefreshView.as_view(), name='token_refresh'),
    re_path(r'^profile/?$', UserProfileView.as_view(), name='profile'),
]

