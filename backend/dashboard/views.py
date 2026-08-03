import datetime
from django.db.models import Sum
from django.db.models.functions import TruncMonth
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from transactions.models import Transaction, Category
from budgets.models import Budget
from savings.models import SavingsGoal


class DashboardSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        today = datetime.date.today()
        this_month_start = today.replace(day=1)

        # 1. Summary Metrics (All-Time Totals)
        all_tx = Transaction.objects.filter(user=user)
        total_income = float(all_tx.filter(type='income').aggregate(Sum('amount'))['amount__sum'] or 0.0)
        total_expense = float(all_tx.filter(type='expense').aggregate(Sum('amount'))['amount__sum'] or 0.0)
        net_balance = total_income - total_expense
        savings_rate = (net_balance / total_income * 100) if total_income > 0 else 0.0

        # 2. Category breakdown (This Month)
        tx_this_month = Transaction.objects.filter(user=user, date__gte=this_month_start, date__lte=today)
        category_breakdown = tx_this_month.filter(type='expense').values(
            'category__name', 'category__color', 'category__icon'
        ).annotate(value=Sum('amount')).order_by('-value')

        categories_data = [
            {
                'name': item['category__name'] or 'Uncategorized',
                'value': float(item['value']),
                'color': item['category__color'] or '#94a3b8',
                'icon': item['category__icon'] or 'category'
            } for item in category_breakdown
        ]

        # 3. Cash Flow Trajectory (Past 6 Months)
        six_months_ago = this_month_start - datetime.timedelta(days=180)
        historical_tx = Transaction.objects.filter(
            user=user, date__range=[six_months_ago, today]
        ).annotate(month=TruncMonth('date')).values('month', 'type').annotate(total=Sum('amount')).order_by('month')

        # Format historical data for Recharts area charts
        cash_flow_dict = {}
        for item in historical_tx:
            m_str = item['month'].strftime('%b %Y') if item['month'] else 'Unknown'
            if m_str not in cash_flow_dict:
                cash_flow_dict[m_str] = {'name': m_str, 'income': 0.0, 'expense': 0.0}
            
            if item['type'] == 'income':
                cash_flow_dict[m_str]['income'] = float(item['total'])
            elif item['type'] == 'expense':
                cash_flow_dict[m_str]['expense'] = float(item['total'])

        cash_flow_data = list(cash_flow_dict.values())

        # 4. Budget limits vs current spending status
        active_budgets = Budget.objects.filter(user=user, start_date__lte=today, end_date__gte=today)
        budgets_data = []
        for b in active_budgets:
            # Spent logic
            filters = {'user': user, 'type': 'expense', 'date__range': [b.start_date, b.end_date]}
            if b.category:
                filters['category'] = b.category
            
            spent = float(Transaction.objects.filter(**filters).aggregate(Sum('amount'))['amount__sum'] or 0.0)
            limit = float(b.amount)
            pct = (spent / limit * 100) if limit > 0 else 0
            
            budgets_data.append({
                'id': b.id,
                'category': b.category.name if b.category else 'Total Budget',
                'limit': limit,
                'spent': spent,
                'percentage': round(pct, 2)
            })

        # 5. Active Savings Goals
        active_goals = SavingsGoal.objects.filter(user=user, status='active')
        goals_data = [
            {
                'id': g.id,
                'name': g.name,
                'target': float(g.target_amount),
                'current': float(g.current_amount),
                'percentage': round((float(g.current_amount) / float(g.target_amount) * 100) if g.target_amount > 0 else 0, 2),
                'target_date': str(g.target_date)
            } for g in active_goals
        ]

        return Response({
            'summary': {
                'income': total_income,
                'expense': total_expense,
                'balance': net_balance,
                'savings_rate': round(savings_rate, 2),
                'currency': user.currency
            },
            'categories': categories_data,
            'cash_flow': cash_flow_data,
            'budgets': budgets_data,
            'goals': goals_data
        }, status=status.HTTP_200_OK)
