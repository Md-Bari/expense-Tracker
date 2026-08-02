from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import SubscriptionPlan
from .serializers import (
    SubscriptionPlanSerializer,
    AdminUserListSerializer,
    AdminCreateSerializer
)

User = get_user_model()

class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    """
    CRUD Viewset for SubscriptionPlan.
    - Public: list, retrieve (read-only for landing page).
    - Admin-only: create, update, partial_update, destroy.
    """
    queryset = SubscriptionPlan.objects.all().order_by('price')
    serializer_class = SubscriptionPlanSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            # Allow public viewing on landing page
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class AdminUserListView(generics.ListAPIView):
    """
    Super Admin view to list all users. Restricted to staff/superuser.
    """
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdminUserListSerializer

    def get_queryset(self):
        queryset = User.objects.all().order_by('-date_joined')
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                username__icontains=search
            ) | queryset.filter(
                email__icontains=search
            )
        return queryset


class AdminCreateAdminView(generics.CreateAPIView):
    """
    Super Admin view to register a new admin user (staff). Restricted to staff/superuser.
    """
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdminCreateSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "New admin account created successfully."},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
