from rest_framework import serializers
from .models import SavingsGoal


class SavingsGoalSerializer(serializers.ModelSerializer):
    percentage = serializers.SerializerMethodField()

    class Meta:
        model = SavingsGoal
        fields = (
            'id', 'name', 'target_amount', 'current_amount',
            'target_date', 'status', 'percentage', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'percentage', 'created_at', 'updated_at')

    def get_percentage(self, obj):
        target = float(obj.target_amount)
        current = float(obj.current_amount)
        if target > 0:
            return round((current / target) * 100, 2)
        return 0.0

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user:
            validated_data['user'] = request.user
        return super().create(validated_data)
