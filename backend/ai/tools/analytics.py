import datetime
from django.db.models import Sum
from transactions.models import Transaction


def compare_month_over_month(user):
    """
    Compares total expense this month against last month and calculates the deviation.
    """
    today = datetime.date.today()
    this_month_start = today.replace(day=1)
    
    # Calculate last month date boundaries
    last_month_end = this_month_start - datetime.timedelta(days=1)
    last_month_start = last_month_end.replace(day=1)

    # Spending this month
    this_month_spent = Transaction.objects.filter(
        user=user,
        type='expense',
        date__range=[this_month_start, today]
    ).aggregate(total=Sum('amount'))['total'] or 0

    # Spending last month
    last_month_spent = Transaction.objects.filter(
        user=user,
        type='expense',
        date__range=[last_month_start, last_month_end]
    ).aggregate(total=Sum('amount'))['total'] or 0

    this_month_spent = float(this_month_spent)
    last_month_spent = float(last_month_spent)

    difference = this_month_spent - last_month_spent
    percentage_change = 0.0
    if last_month_spent > 0:
        percentage_change = (difference / last_month_spent) * 100

    return {
        'this_month_spent': this_month_spent,
        'last_month_spent': last_month_spent,
        'difference': difference,
        'percentage_change': round(percentage_change, 2)
    }


def get_top_spending_categories(user, limit=3):
    """
    Returns the top N categories where the user spends the most this month.
    """
    today = datetime.date.today()
    this_month_start = today.replace(day=1)

    grouped = Transaction.objects.filter(
        user=user,
        type='expense',
        date__range=[this_month_start, today]
    ).values('category__name').annotate(total=Sum('amount')).order_by('-total')[:limit]

    return [
        {
            'category': item['category__name'] or 'Uncategorized',
            'amount': float(item['total'])
        } for item in grouped
    ]
