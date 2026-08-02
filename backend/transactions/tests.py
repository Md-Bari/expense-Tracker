from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from transactions.models import Category, Transaction
from budgets.models import Budget
from notifications.models import Notification

User = get_user_model()


class FinancialSystemTests(APITestCase):
    def setUp(self):
        # Create users
        self.user1 = User.objects.create_user(
            username='johndoe', email='john@example.com', password='password123', currency='BDT'
        )
        self.user2 = User.objects.create_user(
            username='janedoe', email='jane@example.com', password='password123', currency='USD'
        )

        # Create global default category
        self.system_category = Category.objects.create(
            name='Food', type='expense', icon='utensils', color='#f59e0b', owner=None
        )

        # Create user custom category
        self.user1_category = Category.objects.create(
            name='Custom Category', type='expense', icon='category', color='#6366f1', owner=self.user1
        )

        # Obtain token for user1
        url = reverse('token_obtain_pair')
        response = self.client.post(url, {'username': 'johndoe', 'password': 'password123'})
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_tenant_isolation_categories(self):
        """
        Verify that user1 cannot query custom categories owned by user2,
        but can query global categories and their own categories.
        """
        user2_category = Category.objects.create(
            name='Secret Category', type='expense', icon='lock', color='#000000', owner=self.user2
        )

        url = reverse('category-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        category_ids = [cat['id'] for cat in response.data]
        self.assertIn(self.system_category.id, category_ids)
        self.assertIn(self.user1_category.id, category_ids)
        self.assertNotIn(user2_category.id, category_ids)

    def test_create_transaction_budget_alert(self):
        """
        Verify that creating an expense that exceeds 80% of a budget
        automatically triggers an in-app warning notification.
        """
        # Create a budget of ৳1,000 for Food
        budget = Budget.objects.create(
            user=self.user1,
            category=self.system_category,
            amount=1000.00,
            start_date='2026-08-01',
            end_date='2026-08-31'
        )

        # Create transaction representing ৳850 expense (85% consumed)
        url = reverse('transaction-list')
        payload = {
            'category': self.system_category.id,
            'type': 'expense',
            'amount': 850.00,
            'date': '2026-08-02',
            'description': 'Targeted expense check',
            'is_recurring': False
        }
        
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Check notifications count
        notifications = Notification.objects.filter(user=self.user1)
        self.assertEqual(notifications.count(), 1)
        self.assertIn("Budget Warning", notifications.first().title)
        
        # Verify budget was updated to reflect alert state
        budget.refresh_from_db()
        self.assertEqual(budget.notified_percentage, 80)
