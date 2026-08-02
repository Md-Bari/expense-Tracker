import datetime
from django.db.models import Q
from transactions.models import Category, Transaction
from savings.models import SavingsGoal
from budgets.models import Budget

def create_transaction_tool(user, params):
    """
    Creates a new transaction for the user.
    """
    amount = params.get('amount')
    tx_type = params.get('type') or 'expense'
    category_name = params.get('category_name') or 'Other'
    description = params.get('description') or ''
    date_str = params.get('date') or str(datetime.date.today())

    if not amount:
        return "Transaction could not be created because the amount was not specified."

    try:
        amount_val = float(amount)
    except ValueError:
        return f"Invalid amount format: {amount}."

    try:
        date_val = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        date_val = datetime.date.today()

    # Normalize category type
    tx_type = tx_type.lower()
    if tx_type not in ['income', 'expense']:
        tx_type = 'expense'

    # Find or auto-create category for user
    category = Category.objects.filter(
        Q(owner=user) | Q(owner=None),
        name__iexact=category_name,
        type=tx_type
    ).first()

    if not category:
        category = Category.objects.create(
            name=category_name.capitalize(),
            type=tx_type,
            owner=user,
            icon='category',
            color='#6366f1'
        )

    # Create transaction
    transaction = Transaction.objects.create(
        user=user,
        category=category,
        type=tx_type,
        amount=amount_val,
        date=date_val,
        description=description
    )

    currency = user.currency or 'USD'
    return f"Successfully created a new {tx_type} transaction:\n" \
           f"- Amount: {currency} {amount_val:,.2f}\n" \
           f"- Category: {category.name}\n" \
           f"- Description: {description or 'None'}\n" \
           f"- Date: {date_val.strftime('%Y-%m-%d')}"


def create_savings_goal_tool(user, params):
    """
    Creates a new savings goal for the user.
    """
    name = params.get('name')
    target_amount = params.get('target_amount')
    target_date_str = params.get('target_date')

    if not name:
        return "Savings goal could not be created because the name was not specified."
    
    if not target_amount:
        return "Savings goal could not be created because the target amount was not specified."

    try:
        target_amount_val = float(target_amount)
    except ValueError:
        return f"Invalid target amount format: {target_amount}."

    if not target_date_str:
        # Default to 6 months from now
        target_date_val = datetime.date.today() + datetime.timedelta(days=180)
    else:
        try:
            target_date_val = datetime.datetime.strptime(target_date_str, "%Y-%m-%d").date()
        except ValueError:
            target_date_val = datetime.date.today() + datetime.timedelta(days=180)

    goal = SavingsGoal.objects.create(
        user=user,
        name=name,
        target_amount=target_amount_val,
        target_date=target_date_val,
        current_amount=0.0,
        status='active'
    )

    currency = user.currency or 'USD'
    return f"Successfully created a new savings goal:\n" \
           f"- Goal Name: {goal.name}\n" \
           f"- Target Amount: {currency} {target_amount_val:,.2f}\n" \
           f"- Target Date: {target_date_val.strftime('%Y-%m-%d')}"


def create_budget_tool(user, params):
    """
    Creates a new budget for the user.
    """
    amount = params.get('amount')
    category_name = params.get('category_name')
    start_date_str = params.get('start_date')
    end_date_str = params.get('end_date')

    if not amount:
        return "Budget could not be created because the amount was not specified."

    try:
        amount_val = float(amount)
    except ValueError:
        return f"Invalid amount format: {amount}."

    # Parse dates or default to current month bounds
    today = datetime.date.today()
    
    if start_date_str:
        try:
            start_date_val = datetime.datetime.strptime(start_date_str, "%Y-%m-%d").date()
        except ValueError:
            start_date_val = today.replace(day=1)
    else:
        start_date_val = today.replace(day=1)

    if end_date_str:
        try:
            end_date_val = datetime.datetime.strptime(end_date_str, "%Y-%m-%d").date()
        except ValueError:
            next_month = today.replace(day=28) + datetime.timedelta(days=4)
            end_date_val = next_month - datetime.timedelta(days=next_month.day)
    else:
        next_month = today.replace(day=28) + datetime.timedelta(days=4)
        end_date_val = next_month - datetime.timedelta(days=next_month.day)

    # Find category if specified
    category = None
    if category_name and category_name.lower() not in ['total', 'all', 'none', 'null']:
        category = Category.objects.filter(
            Q(owner=user) | Q(owner=None),
            name__iexact=category_name,
            type='expense'
        ).first()

        if not category:
            # Auto-create expense category
            category = Category.objects.create(
                name=category_name.capitalize(),
                type='expense',
                owner=user,
                icon='category',
                color='#6366f1'
            )

    budget = Budget.objects.create(
        user=user,
        category=category,
        amount=amount_val,
        start_date=start_date_val,
        end_date=end_date_val
    )

    currency = user.currency or 'USD'
    cat_lbl = category.name if category else "Total (All Categories)"
    return f"Successfully created a new budget:\n" \
           f"- Target Amount: {currency} {amount_val:,.2f}\n" \
           f"- Scope: {cat_lbl}\n" \
           f"- Period: {start_date_val.strftime('%Y-%m-%d')} to {end_date_val.strftime('%Y-%m-%d')}"
