from django.db import models
from django.conf import settings
from transactions.models import Category


class Budget(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('exceeded', 'Exceeded'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='budgets'
    )
    # Category is optional; a null category represents a "Total Budget"
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='budgets'
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='active')
    
    # Used to track if the user has already been alerted about this budget (e.g. 80%, 100%)
    notified_percentage = models.IntegerField(default=0)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        cat_name = self.category.name if self.category else "All Categories"
        return f"{self.user.username} Budget for {cat_name}: {self.amount} ({self.start_date} to {self.end_date})"
