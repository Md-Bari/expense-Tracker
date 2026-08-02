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
    percentage = serializers.SerializerMethodField()

    class Meta:
        model = Budget
        fields = (
            'id', 'category', 'category_detail', 'amount',
            'start_date', 'end_date', 'spent', 'percentage'
        )
        read_only_fields = ('id', 'spent', 'percentage')

    def get_spent(self, obj):
        # Sum up expenses in this category and time range
        filters = {
            'user': obj.user,
            'type': 'expense',
            'date__gte': obj.start_date,
            'date__lte': obj.end_date,
        }
        if obj.category:
            filters['category'] = obj.category
        
        total = Transaction.objects.filter(**filters).aggregate(Sum('amount'))['amount__sum']
        return float(total) if total is not None else 0.0

    def get_percentage(self, obj):
        spent = self.get_spent(obj)
        amount = float(obj.amount)
        if amount > 0:
            return round((spent / amount) * 100, 2)
        return 0.0

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
