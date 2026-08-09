from rest_framework import serializers
from django.db.models import Sum
from .models import Budget
from transactions.models import Transaction, Category
from transactions.serializers import CategorySerializer


class BudgetSerializer(serializers.ModelSerializer):
    category_detail = CategorySerializer(source='category', read_only=True)
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        required=False,
        allow_null=True
    )
    spent = serializers.SerializerMethodField()
    remaining = serializers.SerializerMethodField()
    percentage = serializers.SerializerMethodField()
    computed_status = serializers.SerializerMethodField()
    transaction_count = serializers.SerializerMethodField()
    recent_transactions = serializers.SerializerMethodField()

    class Meta:
        model = Budget
        fields = (
            'id', 'category', 'category_detail', 'amount',
            'start_date', 'end_date', 'status', 'computed_status',
            'spent', 'remaining', 'percentage', 'transaction_count',
            'recent_transactions'
        )
        read_only_fields = ('id', 'spent', 'remaining', 'percentage', 'computed_status', 'transaction_count', 'recent_transactions')

    def _get_expense_queryset(self, obj):
        filters = {
            'user': obj.user,
            'type': 'expense',
            'date__gte': obj.start_date,
            'date__lte': obj.end_date,
        }
        if obj.category:
            filters['category'] = obj.category
        return Transaction.objects.filter(**filters)

    def get_spent(self, obj):
        total = self._get_expense_queryset(obj).aggregate(Sum('amount'))['amount__sum']
        return float(total) if total is not None else 0.0

    def get_remaining(self, obj):
        spent = self.get_spent(obj)
        amount = float(obj.amount)
        return max(0.0, round(amount - spent, 2))

    def get_percentage(self, obj):
        spent = self.get_spent(obj)
        amount = float(obj.amount)
        if amount > 0:
            return round((spent / amount) * 100, 2)
        return 0.0

    def get_computed_status(self, obj):
        if obj.status == 'completed':
            return 'completed'
        pct = self.get_percentage(obj)
        if pct >= 100:
            return 'exceeded'
        import datetime
        if obj.end_date < datetime.date.today():
            return 'completed'
        return obj.status or 'active'

    def get_transaction_count(self, obj):
        return self._get_expense_queryset(obj).count()

    def get_recent_transactions(self, obj):
        qs = self._get_expense_queryset(obj).select_related('category')[:10]
        return [
            {
                'id': tx.id,
                'date': tx.date.strftime('%Y-%m-%d'),
                'description': tx.description or (tx.category.name if tx.category else 'Expense'),
                'amount': float(tx.amount),
                'category_name': tx.category.name if tx.category else 'Uncategorized'
            }
            for tx in qs
        ]

    def validate_category(self, value):
        request = self.context.get('request')
        if value and request and request.user:
            if value.owner is not None and value.owner != request.user:
                raise serializers.ValidationError("You do not have access to this category.")
        return value

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user:
            validated_data['user'] = request.user
        return super().create(validated_data)

