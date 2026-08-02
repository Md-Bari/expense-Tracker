from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'currency', 'monthly_budget_limit')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            currency=validated_data.get('currency', 'BDT'),
            monthly_budget_limit=validated_data.get('monthly_budget_limit', None)
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'currency', 'monthly_budget_limit', 'created_at')
        read_only_fields = ('id', 'username', 'created_at')
