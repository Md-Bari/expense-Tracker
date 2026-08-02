from django.db.models import Sum, Avg, Count
from django.db.models.functions import TruncMonth
from transactions.models import Transaction, Category
from django.db import connection
import datetime


def execute_safe_financial_query(user, params):
    """
    Safely executes database queries based on parameters extracted by the LLM.
    Enforces strict user isolation by querying only transactions owned by the user.
    """
    queryset = Transaction.objects.filter(user=user)

    # 1. Filter by transaction type (income/expense)
    tx_type = params.get('transaction_type')
    if tx_type in ['income', 'expense']:
        queryset = queryset.filter(type=tx_type)

    # 2. Filter by category
    category_name = params.get('category_name')
    if category_name:
        queryset = queryset.filter(category__name__icontains=category_name)

    # 3. Filter by date range
    start_date = params.get('start_date')
    end_date = params.get('end_date')
    if start_date:
        try:
            queryset = queryset.filter(date__gte=start_date)
        except ValueError:
            pass
    if end_date:
        try:
            queryset = queryset.filter(date__lte=end_date)
        except ValueError:
            pass

    # 4. Handle Aggregations & Groupings
    aggregate_func = params.get('aggregate')
    group_by = params.get('group_by')

    if aggregate_func:
        if aggregate_func == 'sum':
            result = queryset.aggregate(value=Sum('amount'))
            return {'total_amount': float(result['value']) if result['value'] is not None else 0.0}
        elif aggregate_func == 'avg':
            result = queryset.aggregate(value=Avg('amount'))
            return {'average_amount': float(result['value']) if result['value'] is not None else 0.0}
        elif aggregate_func == 'count':
            result = queryset.aggregate(value=Count('id'))
            return {'transaction_count': result['value'] or 0}

    if group_by == 'category':
        # Group by category and sum amounts
        grouped = queryset.values('category__name', 'type').annotate(total=Sum('amount')).order_by('-total')
        return [
            {
                'category': item['category__name'] or 'Uncategorized',
                'type': item['type'],
                'total': float(item['total'])
            } for item in grouped
        ]

    elif group_by == 'month':
        # Group by month and sum
        grouped = queryset.annotate(month=TruncMonth('date')).values('month', 'type').annotate(total=Sum('amount')).order_by('month')
        return [
            {
                'month': item['month'].strftime('%Y-%m') if item['month'] else 'Unknown',
                'type': item['type'],
                'total': float(item['total'])
            } for item in grouped
        ]

    # Default: Return transaction list (limit to 20 for brief chat response context)
    transactions_list = queryset[:20]
    return [
        {
            'date': str(tx.date),
            'category': tx.category.name if tx.category else 'Uncategorized',
            'type': tx.type,
            'amount': float(tx.amount),
            'description': tx.description
        } for tx in transactions_list
    ]
