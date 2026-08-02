from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import SubscriptionPlan

User = get_user_model()

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'price', 'currency', 'duration_months', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']

class AdminUserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_staff', 'is_superuser', 'monthly_budget_limit', 'date_joined', 'currency']

class AdminCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        user.is_staff = True  # Create new admin user
        user.save()
        return user
