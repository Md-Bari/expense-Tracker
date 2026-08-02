from django.db.models import Sum
from .models import Budget
from transactions.models import Transaction
from notifications.models import Notification


def check_budget_alerts(user, category, transaction_date):
    """
    Checks active budgets for a user that match a category (or general budgets)
    on a given transaction date. Generates notifications if thresholds (80%, 100%)
    are crossed.
    """
    # Find budgets active on this date (either matching category or total budget category=None)
    active_budgets = Budget.objects.filter(
        user=user,
        start_date__lte=transaction_date,
        end_date__gte=transaction_date
    )

    for budget in active_budgets:
        # If budget is category-specific, check if the transaction is for that category
        if budget.category and budget.category != category:
            continue

        # Calculate total expenses for this budget's range
        filters = {
            'user': user,
            'type': 'expense',
            'date__gte': budget.start_date,
            'date__lte': budget.end_date,
        }
        if budget.category:
            filters['category'] = budget.category

        total_spent = Transaction.objects.filter(**filters).aggregate(Sum('amount'))['amount__sum'] or 0
        total_spent = float(total_spent)
        budget_amount = float(budget.amount)

        if budget_amount <= 0:
            continue

        percentage = (total_spent / budget_amount) * 100
        cat_name = budget.category.name if budget.category else "All Categories"

        # Check 100% limit
        if percentage >= 100 and budget.notified_percentage < 100:
            Notification.objects.create(
                user=user,
                title=f"⚠️ Budget Exceeded: {cat_name}",
                message=f"You have spent ৳{total_spent:,.2f} of your ৳{budget_amount:,.2f} budget for {cat_name} ({percentage:.1f}% used)."
            )
            budget.notified_percentage = 100
            budget.save(update_fields=['notified_percentage'])

        # Check 80% limit
        elif percentage >= 80 and budget.notified_percentage < 80:
            Notification.objects.create(
                user=user,
                title=f"⚠️ Budget Warning: {cat_name}",
                message=f"You have spent ৳{total_spent:,.2f} of your ৳{budget_amount:,.2f} budget for {cat_name} ({percentage:.1f}% used)."
            )
            budget.notified_percentage = 80
            budget.save(update_fields=['notified_percentage'])
