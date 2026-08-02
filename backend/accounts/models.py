from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    # Support multiple currencies (default to BDT as in the project specification)
    currency = models.CharField(max_length=10, default='BDT')
    monthly_budget_limit = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.username
