from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def api_health_check(request):
    return JsonResponse({
        "status": "online",
        "message": "Aura Expense Tracker API is running successfully",
        "endpoints": {
            "auth": "/api/auth/login/",
            "transactions": "/api/transactions/",
            "budgets": "/api/budgets/",
            "savings": "/api/savings/",
            "reports": "/api/reports/",
            "ai": "/api/ai/",
            "admin": "/admin/"
        }
    })

urlpatterns = [
    path('', api_health_check),
    path('api/', api_health_check),
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/transactions/', include('transactions.urls')),
    path('api/budgets/', include('budgets.urls')),
    path('api/savings/', include('savings.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/ai/', include('ai.urls')),
    path('api/receipts/', include('receipts.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/subscriptions/', include('subscriptions.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

