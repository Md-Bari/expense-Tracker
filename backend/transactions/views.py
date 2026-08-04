from django.db.models import Q
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
# pyrefly: ignore [missing-import]
from .models import Category, Transaction, ExpenseSheet
# pyrefly: ignore [missing-import]
from .serializers import CategorySerializer, TransactionSerializer, ExpenseSheetSerializer

class TransactionPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Auto-initialize default system categories if none exist
        system_cats = Category.objects.filter(owner__isnull=True)
        if not system_cats.exists():
            default_categories = [
                # Expenses
                {'name': 'Food', 'type': 'expense', 'color': '#f59e0b', 'icon': 'utensils'},
                {'name': 'Shopping', 'type': 'expense', 'color': '#ec4899', 'icon': 'shopping-bag'},
                {'name': 'Transport', 'type': 'expense', 'color': '#06b6d4', 'icon': 'car'},
                {'name': 'Utilities', 'type': 'expense', 'color': '#ef4444', 'icon': 'plug'},
                {'name': 'Entertainment', 'type': 'expense', 'color': '#8b5cf6', 'icon': 'tv'},
                {'name': 'Other', 'type': 'expense', 'color': '#94a3b8', 'icon': 'category'},
                # Income
                {'name': 'Salary', 'type': 'income', 'color': '#10b981', 'icon': 'briefcase'},
                {'name': 'Investment', 'type': 'income', 'color': '#6366f1', 'icon': 'trending-up'},
                {'name': 'Other Income', 'type': 'income', 'color': '#94a3b8', 'icon': 'dollar-sign'},
            ]
            Category.objects.bulk_create([Category(**c) for c in default_categories])
            
        # Return default system categories (owner is null) and user's custom categories
        return Category.objects.filter(
            Q(owner__isnull=True) | Q(owner=self.request.user)
        )

    def filter_queryset(self, queryset):
        # Support simple filtering by category type
        cat_type = self.request.query_params.get('type')
        if cat_type:
            queryset = queryset.filter(type=cat_type)
        return queryset


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = TransactionPagination

    def get_queryset(self):
        # Strict user scoping
        return Transaction.objects.filter(user=self.request.user)

    def filter_queryset(self, queryset):
        # Custom query parameter filtering
        tx_type = self.request.query_params.get('type')
        category_id = self.request.query_params.get('category')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        search_query = self.request.query_params.get('search')

        if tx_type:
            queryset = queryset.filter(type=tx_type)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        if search_query:
            queryset = queryset.filter(
                Q(description__icontains=search_query) |
                Q(category__name__icontains=search_query)
            )

        return queryset


class ExpenseSheetViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSheetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ExpenseSheet.objects.filter(user=self.request.user)

    def get_permissions(self):
        # We need action decorator and response imports
        return super().get_permissions()

    @action(detail=True, methods=['post'])
    def commit_to_transactions(self, request, pk=None):
        from rest_framework.response import Response
        from rest_framework import status
        import decimal
        import datetime

        sheet = self.get_object()
        items = sheet.items or []
        if not items:
            return Response({'error': 'The expense sheet has no items to commit.'}, status=status.HTTP_400_BAD_REQUEST)

        created_count = 0
        for item in items:
            category_name = item.get('category') or 'Other'
            category = Category.objects.filter(
                Q(owner=request.user) | Q(owner__isnull=True),
                name__iexact=category_name,
                type='expense'
            ).first()
            if not category:
                category = Category.objects.filter(owner__isnull=True, name='Other', type='expense').first()

            Transaction.objects.create(
                user=request.user,
                category=category,
                type='expense',
                amount=decimal.Decimal(str(item.get('amount', 0.0))),
                date=item.get('date') or str(datetime.date.today()),
                description=item.get('description') or ''
            )
            created_count += 1

        # Clear items on successful commit
        sheet.items = []
        sheet.save()

        return Response({
            'message': f"Successfully committed {created_count} items from sheet '{sheet.title}' to transactions.",
            'sheet': ExpenseSheetSerializer(sheet).data
        }, status=status.HTTP_200_OK)
