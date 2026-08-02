import datetime
from django.db.models import Sum
from transactions.models import Transaction


def forecast_next_month_expenses(user):
    """
    Predicts next month's expenses based on the average of the last 3 months.
    """
    today = datetime.date.today()
    
    # Calculate intervals for the past 3 months
    months_data = []
    for i in range(1, 4):
        # Boundaries for month -i
        first_day_of_this_month = today.replace(day=1)
        end_date = first_day_of_this_month - datetime.timedelta(days=1)
        for _ in range(i - 1):
            end_date = end_date.replace(day=1) - datetime.timedelta(days=1)
        start_date = end_date.replace(day=1)
        
        spent = Transaction.objects.filter(
            user=user,
            type='expense',
            date__range=[start_date, end_date]
        ).aggregate(total=Sum('amount'))['total'] or 0.0
        
        months_data.append(float(spent))
    
    # Calculate average
    active_months = [m for m in months_data if m > 0]
    if not active_months:
        # Fall back to current month spending so far
        this_month_start = today.replace(day=1)
        current_spent = Transaction.objects.filter(
            user=user,
            type='expense',
            date__range=[this_month_start, today]
        ).aggregate(total=Sum('amount'))['total'] or 0.0
        prediction = float(current_spent)
        data_confidence = "low (insufficient historical data)"
    else:
        prediction = sum(active_months) / len(active_months)
        data_confidence = "medium"

    return {
        'forecasted_expense': round(prediction, 2),
        'historical_averages': months_data,
        'confidence': data_confidence
    }
