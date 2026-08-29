import datetime
from django.core.management.base import BaseCommand
from accounts.models import User
from transactions.models import Transaction, Category


class Command(BaseCommand):
    help = 'Seeds realistic 6-month historical demo transactions with dynamic curves for dashboard trajectory charts'

    def handle(self, *args, **options):
        # 1. Ensure Standard Categories Exist
        category_specs = [
            ('Salary', 'income', 'briefcase', '#10b981'),
            ('Freelance / Bonus', 'income', 'trending-up', '#06b6d4'),
            ('Investments', 'income', 'pie-chart', '#8b5cf6'),
            ('Housing & Rent', 'expense', 'home', '#ef4444'),
            ('Food & Groceries', 'expense', 'shopping-cart', '#f59e0b'),
            ('Utilities & Bills', 'expense', 'zap', '#3b82f6'),
            ('Dining & Cafes', 'expense', 'coffee', '#ec4899'),
            ('Transportation', 'expense', 'car', '#6366f1'),
            ('Entertainment & Leisure', 'expense', 'tv', '#a855f7'),
            ('Shopping & Tech', 'expense', 'shopping-bag', '#14b8a6'),
            ('Health & Wellness', 'expense', 'heart', '#10b981'),
        ]

        categories_map = {}
        for name, c_type, icon, color in category_specs:
            cat, _ = Category.objects.get_or_create(
                name=name,
                type=c_type,
                defaults={'icon': icon, 'color': color, 'owner': None}
            )
            categories_map[name] = cat

        # 2. Six Month Template (Dynamic Curves with undulating peaks & troughs)
        today = datetime.date.today()
        # Monthly profiles with natural fluctuations
        monthly_profiles = [
            # 5 months ago (e.g. March 2026)
            {
                'month_offset': 5,
                'incomes': [
                    ('Monthly Salary Deposit', 'Salary', 58000, 1),
                    ('Client Freelance Milestone', 'Freelance / Bonus', 14000, 15),
                ],
                'expenses': [
                    ('Apartment Rent', 'Housing & Rent', 18000, 2),
                    ('Supermarket Groceries', 'Food & Groceries', 8500, 6),
                    ('Electricity & High-speed Wifi', 'Utilities & Bills', 4200, 10),
                    ('Weekend Dining with Friends', 'Dining & Cafes', 3800, 14),
                    ('Fuel & City Transport Pass', 'Transportation', 3200, 18),
                    ('Streaming Services & Games', 'Entertainment & Leisure', 2400, 22),
                    ('Organic Market Weekly Run', 'Food & Groceries', 3100, 26),
                ]
            },
            # 4 months ago (e.g. April 2026 - Higher income bonus, Spring shopping)
            {
                'month_offset': 4,
                'incomes': [
                    ('Monthly Salary Deposit', 'Salary', 58000, 1),
                    ('Quarterly Performance Bonus', 'Freelance / Bonus', 22000, 12),
                    ('Stock Market Dividend', 'Investments', 5500, 20),
                ],
                'expenses': [
                    ('Apartment Rent', 'Housing & Rent', 18000, 2),
                    ('Wholesale Grocery Restock', 'Food & Groceries', 11400, 5),
                    ('Electricity, Water & Gas', 'Utilities & Bills', 4800, 9),
                    ('New Ergonomic Workstation Monitor', 'Shopping & Tech', 13500, 14),
                    ('Fine Dining & Social Events', 'Dining & Cafes', 5200, 18),
                    ('Car Maintenance & Fuel', 'Transportation', 4600, 21),
                    ('Fitness Club Quarterly Membership', 'Health & Wellness', 4500, 25),
                ]
            },
            # 3 months ago (e.g. May 2026 - Disciplined savings dip in spending)
            {
                'month_offset': 3,
                'incomes': [
                    ('Monthly Salary Deposit', 'Salary', 58000, 1),
                    ('Side Consulting Review', 'Freelance / Bonus', 9500, 18),
                ],
                'expenses': [
                    ('Apartment Rent', 'Housing & Rent', 18000, 2),
                    ('Fresh Market & Dairy Essentials', 'Food & Groceries', 8200, 7),
                    ('Utility Bills & Internet', 'Utilities & Bills', 3900, 11),
                    ('Coffee & Light Lunch Outings', 'Dining & Cafes', 2900, 16),
                    ('Ride Share & Commute', 'Transportation', 2800, 20),
                    ('Pharmacy & Health Vitamins', 'Health & Wellness', 2200, 24),
                    ('Bookstore & Skill Courses', 'Shopping & Tech', 2500, 27),
                ]
            },
            # 2 months ago (e.g. June 2026 - Summer peak vacation & high consulting)
            {
                'month_offset': 2,
                'incomes': [
                    ('Monthly Salary Deposit', 'Salary', 58000, 1),
                    ('Major Client App Delivery', 'Freelance / Bonus', 28000, 10),
                    ('Mutual Fund Yield', 'Investments', 7200, 22),
                ],
                'expenses': [
                    ('Apartment Rent', 'Housing & Rent', 18000, 2),
                    ('Summer Holiday Getaway & Resort', 'Entertainment & Leisure', 18500, 8),
                    ('Gourmet Dining & Beach Dinners', 'Dining & Cafes', 6800, 12),
                    ('Family Supermarket Shopping', 'Food & Groceries', 10500, 16),
                    ('Air Conditioning High Power Bill', 'Utilities & Bills', 5900, 19),
                    ('Travel Fuel & Tolls', 'Transportation', 4200, 23),
                    ('Summer Wardrobe & Essentials', 'Shopping & Tech', 6400, 27),
                ]
            },
            # 1 month ago (e.g. July 2026 - Recovery & steady trajectory)
            {
                'month_offset': 1,
                'incomes': [
                    ('Monthly Salary Deposit', 'Salary', 58000, 1),
                    ('Freelance Code Review Project', 'Freelance / Bonus', 12500, 16),
                ],
                'expenses': [
                    ('Apartment Rent', 'Housing & Rent', 18000, 2),
                    ('Organic Groceries & Pantry Refill', 'Food & Groceries', 9200, 6),
                    ('Electricity & Broadband Connection', 'Utilities & Bills', 4400, 10),
                    ('Cozy Weekend Cafe Dinners', 'Dining & Cafes', 3600, 15),
                    ('Weekly Fuel & Metrorail Card', 'Transportation', 3100, 20),
                    ('Cinema & Entertainment Night', 'Entertainment & Leisure', 2800, 24),
                    ('Tech Accessories & Gadgets', 'Shopping & Tech', 4100, 28),
                ]
            },
            # Current month (e.g. August 2026)
            {
                'month_offset': 0,
                'incomes': [
                    ('Monthly Salary Deposit', 'Salary', 58000, 1),
                    ('AI Assistant Consulting Retainer', 'Freelance / Bonus', 16000, 15),
                ],
                'expenses': [
                    ('Apartment Rent', 'Housing & Rent', 18000, 2),
                    ('Weekly Grocery Essentials & Fresh Meat', 'Food & Groceries', 9600, 6),
                    ('Electricity & High-speed Fiber Internet', 'Utilities & Bills', 4500, 10),
                    ('Family Restaurant Dinner', 'Dining & Cafes', 4200, 14),
                    ('Vehicle Refuel & Commuter Pass', 'Transportation', 3400, 18),
                    ('Online Pro Cloud Subscriptions', 'Shopping & Tech', 3500, 22),
                    ('Dental & Wellness Checkup', 'Health & Wellness', 3000, 26),
                ]
            }
        ]

        # Target all active users
        users = User.objects.all()
        self.stdout.write(f"Processing {users.count()} users for historical curve transactions...")

        created_total = 0
        for user in users:
            for prof in monthly_profiles:
                # Calculate year and month for this offset
                m = today.month - prof['month_offset']
                y = today.year
                while m <= 0:
                    m += 12
                    y -= 1
                
                # Insert / ensure incomes for this month
                for desc, cat_name, amt, day in prof['incomes']:
                    tx_date = datetime.date(y, m, min(day, 28))
                    cat = categories_map.get(cat_name)
                    # Check if already exists to prevent duplicate blowup
                    exists = Transaction.objects.filter(
                        user=user,
                        type='income',
                        date=tx_date,
                        description=desc
                    ).exists()
                    if not exists:
                        Transaction.objects.create(
                            user=user,
                            category=cat,
                            type='income',
                            amount=amt,
                            date=tx_date,
                            description=desc,
                            is_recurring=True if 'Salary' in desc else False
                        )
                        created_total += 1

                # Insert / ensure expenses for this month
                for desc, cat_name, amt, day in prof['expenses']:
                    tx_date = datetime.date(y, m, min(day, 28))
                    cat = categories_map.get(cat_name)
                    exists = Transaction.objects.filter(
                        user=user,
                        type='expense',
                        date=tx_date,
                        description=desc
                    ).exists()
                    if not exists:
                        Transaction.objects.create(
                            user=user,
                            category=cat,
                            type='expense',
                            amount=amt,
                            date=tx_date,
                            description=desc,
                            is_recurring=True if 'Rent' in desc else False
                        )
                        created_total += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {created_total} multi-month curve transactions across {users.count()} users!"))
