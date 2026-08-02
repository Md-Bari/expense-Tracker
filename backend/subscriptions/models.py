from django.db import models

class SubscriptionPlan(models.Model):
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='BDT')
    duration_months = models.IntegerField(help_text="Duration in months (e.g. 1, 12)")
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.price} {self.currency} / {self.duration_months} month(s))"
