from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Budget
from .serializers import BudgetSerializer


class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        budget = self.get_object()
        budget.status = 'completed'
        budget.save(update_fields=['status'])
        serializer = self.get_serializer(budget)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def reactivate(self, request, pk=None):
        budget = self.get_object()
        budget.status = 'active'
        budget.save(update_fields=['status'])
        serializer = self.get_serializer(budget)
        return Response(serializer.data, status=status.HTTP_200_OK)

