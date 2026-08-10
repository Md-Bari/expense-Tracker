from django.db.models import Sum, Avg, Count, Q
from django.db.models.functions import TruncMonth
from transactions.models import Transaction, Category
import datetime


def execute_safe_financial_query(user, params):
    """
    Safely executes database queries based on parameters extracted by the LLM.
    Enforces strict user isolation by querying only transactions owned by the user.
    """
    all_user_txs = Transaction.objects.filter(user=user)
    queryset = all_user_txs
    has_specific_filter = False

    # 1. Filter by transaction type (income/expense)
    tx_type = params.get('transaction_type') or params.get('type')
    if tx_type in ['income', 'expense']:
        queryset = queryset.filter(type=tx_type)
        has_specific_filter = True

    # 2. Filter by category or description matching category_name
    category_name = params.get('category_name')
    if category_name:
        queryset = queryset.filter(
            Q(category__name__icontains=category_name) | Q(description__icontains=category_name)
        )
        has_specific_filter = True

    # 3. Filter by single exact date or date range
    exact_date = params.get('date')
    if exact_date:
        try:
            queryset = queryset.filter(date=exact_date)
            has_specific_filter = True
        except (ValueError, TypeError):
            pass

    start_date = params.get('start_date')
    end_date = params.get('end_date')
    if start_date:
        try:
            queryset = queryset.filter(date__gte=start_date)
            has_specific_filter = True
        except (ValueError, TypeError):
            pass
    if end_date:
        try:
            queryset = queryset.filter(date__lte=end_date)
            has_specific_filter = True
        except (ValueError, TypeError):
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
        grouped = queryset.values('category__name', 'type').annotate(total=Sum('amount')).order_by('-total')
        return [
            {
                'category': item['category__name'] or 'Uncategorized',
                'type': item['type'],
                'total': float(item['total'])
            } for item in grouped
        ]

    elif group_by == 'month':
        grouped = queryset.annotate(month=TruncMonth('date')).values('month', 'type').annotate(total=Sum('amount')).order_by('month')
        return [
            {
                'month': item['month'].strftime('%Y-%m') if item['month'] else 'Unknown',
                'type': item['type'],
                'total': float(item['total'])
            } for item in grouped
        ]

    # Return matching transactions list (increase limit to 50 so older items aren't truncated)
    transactions_list = queryset.order_by('-date', '-id')[:50]
    return [
        {
            'date': str(tx.date),
            'category': tx.category.name if tx.category else 'Uncategorized',
            'type': tx.type,
            'amount': float(tx.amount),
            'description': tx.description
        } for tx in transactions_list
    ]
