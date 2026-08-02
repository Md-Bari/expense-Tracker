from rest_framework import serializers
# pyrefly: ignore [missing-import]
from .models import Category, Transaction


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'type', 'icon', 'color', 'owner')
        read_only_fields = ('id', 'owner')

    def create(self, validated_data):
        # Associate category with current user
        request = self.context.get('request')
        if request and request.user:
            validated_data['owner'] = request.user
        return super().create(validated_data)


class TransactionSerializer(serializers.ModelSerializer):
    category_detail = CategorySerializer(source='category', read_only=True)
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Transaction
        fields = (
            'id', 'category', 'category_detail', 'type',
            'amount', 'date', 'description', 'receipt_image',
            'is_recurring', 'recurrence_period', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate_category(self, value):
        request = self.context.get('request')
        if value and request and request.user:
            # Enforce category tenant isolation (must be system-wide or owned by user)
            if value.owner is not None and value.owner != request.user:
                raise serializers.ValidationError("You do not have access to this category.")
        return value

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user:
            validated_data['user'] = request.user
        instance = super().create(validated_data)
        
        # Check budget status for expenses
        if instance.type == 'expense':
            from budgets.utils import check_budget_alerts
            check_budget_alerts(instance.user, instance.category, instance.date)
            
        return instance

    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)
        if instance.type == 'expense':
            from budgets.utils import check_budget_alerts
            check_budget_alerts(instance.user, instance.category, instance.date)
        return instance
