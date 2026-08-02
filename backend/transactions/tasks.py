import datetime
from celery import shared_task
from django.db import transaction
from .models import Transaction


@shared_task
def process_recurring_transactions():
    """
    Periodic background job to evaluate and process recurring transactions.
    """
    today = datetime.date.today()
    recurring_txs = Transaction.objects.filter(is_recurring=True)
    
    with transaction.atomic():
        for tx in recurring_txs:
            if tx.recurrence_period == 'daily':
                delta = datetime.timedelta(days=1)
            elif tx.recurrence_period == 'weekly':
                delta = datetime.timedelta(days=7)
            elif tx.recurrence_period == 'monthly':
                delta = datetime.timedelta(days=30)
            elif tx.recurrence_period == 'yearly':
                delta = datetime.timedelta(days=365)
            else:
                continue

            next_date = tx.date
            created_instances = []
            
            # Spawn instances for all intervals between last transaction date and today
            while next_date + delta <= today:
                next_date = next_date + delta
                created_instances.append(
                    Transaction(
                        user=tx.user,
                        category=tx.category,
                        type=tx.type,
                        amount=tx.amount,
                        date=next_date,
                        description=f"[Recurring] {tx.description}".strip(),
                        is_recurring=False
                    )
                )

            if created_instances:
                Transaction.objects.bulk_create(created_instances)
                tx.date = next_date
                tx.save(update_fields=['date'])
