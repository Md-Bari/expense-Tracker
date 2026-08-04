from django.db import models
from django.conf import settings


class Category(models.Model):
    TYPE_CHOICES = (
        ('income', 'Income'),
        ('expense', 'Expense'),
    )

    name = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    icon = models.CharField(max_length=50, default='category')  # Stores Lucide icon name
    color = models.CharField(max_length=7, default='#94a3b8')  # Hex color code
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='categories',
        null=True,
        blank=True
    )  # Null owner means it is a system default category

    class Meta:
        verbose_name_plural = 'categories'
        unique_together = ('name', 'type', 'owner')

    def __str__(self):
        return f"{self.name} ({self.type})"


class Transaction(models.Model):
    TYPE_CHOICES = (
        ('income', 'Income'),
        ('expense', 'Expense'),
    )

    RECURRENCE_CHOICES = (
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name='transactions'
    )
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    description = models.TextField(blank=True, default='')
    receipt_image = models.ImageField(upload_to='receipts/', null=True, blank=True)
    is_recurring = models.BooleanField(default=False)
    recurrence_period = models.CharField(
        max_length=10,
        choices=RECURRENCE_CHOICES,
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.type} - {self.amount} on {self.date}"


class ExpenseSheet(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='expense_sheets'
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    # Store items in a JSONField: [{"id": 1, "description": "xxx", "amount": 100.0, "category": "Food", "date": "2026-08-04"}]
    items = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.user.username} - {self.title}"
