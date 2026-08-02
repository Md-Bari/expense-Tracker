import os
import io
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend for headless environments
import matplotlib.pyplot as plt
from django.conf import settings
from django.core.files.base import ContentFile
from django.db.models import Sum

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from transactions.models import Transaction
from budgets.models import Budget


def create_report_charts(user, start_date, end_date):
    """
    Generates Matplotlib charts for the PDF report.
    Returns bytes of the combined charts image.
    """
    # 1. Gather expenses by category
    expense_data = Transaction.objects.filter(
        user=user,
        type='expense',
        date__range=[start_date, end_date]
    ).values('category__name').annotate(total=Sum('amount'))

    # 2. Gather total income vs expenses
    summary_data = Transaction.objects.filter(
        user=user,
        date__range=[start_date, end_date]
    ).values('type').annotate(total=Sum('amount'))

    total_income = 0
    total_expense = 0
    for item in summary_data:
        if item['type'] == 'income':
            total_income = float(item['total'])
        elif item['type'] == 'expense':
            total_expense = float(item['total'])

    # Create figure with 2 subplots
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4))
    
    # Custom harmonious color palette
    colors_list = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

    # Subplot 1: Expenses by Category
    if expense_data:
        labels = [item['category__name'] or 'Uncategorized' for item in expense_data]
        values = [float(item['total']) for item in expense_data]
        ax1.pie(
            values,
            labels=labels,
            autopct='%1.1f%%',
            startangle=140,
            colors=colors_list[:len(values)],
            textprops={'fontsize': 8}
        )
        ax1.set_title('Expense Allocation', fontsize=10, fontweight='bold', pad=10)
    else:
        ax1.text(0.5, 0.5, 'No Expenses Found', ha='center', va='center')
        ax1.set_title('Expense Allocation', fontsize=10, fontweight='bold')
    
    # Subplot 2: Income vs Expense Comparison
    bars = ax2.bar(['Income', 'Expense'], [total_income, total_expense], color=['#10b981', '#ef4444'], width=0.5)
    ax2.set_title('Income vs Expense', fontsize=10, fontweight='bold', pad=10)
    ax2.set_ylabel('Amount (৳)')
    ax2.grid(axis='y', linestyle='--', alpha=0.5)
    
    # Add values on top of bars
    for bar in bars:
        height = bar.get_height()
        ax2.annotate(
            f'৳{height:,.0f}',
            xy=(bar.get_x() + bar.get_width() / 2, height),
            xytext=(0, 3),  # 3 points vertical offset
            textcoords="offset points",
            ha='center', va='bottom', fontsize=8
        )

    plt.tight_layout()
    
    # Save figure to buffer
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150)
    plt.close(fig)
    buf.seek(0)
    return buf.getvalue()


def generate_pdf_report(report_instance):
    """
    Generates the report PDF using ReportLab and attaches it to the report model instance.
    """
    user = report_instance.user
    start_date = report_instance.start_date
    end_date = report_instance.end_date

    # Build folder if needed
    os.makedirs(os.path.join(settings.MEDIA_ROOT, 'reports'), exist_ok=True)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=15
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#64748b'),
        spaceAfter=25
    )
    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=15,
        spaceAfter=10
    )
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9,
        textColor=colors.HexColor('#334155'),
        leading=14
    )
    metric_label_style = ParagraphStyle(
        'MetricLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=colors.HexColor('#475569')
    )
    metric_value_style = ParagraphStyle(
        'MetricValue',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#0f172a')
    )

    story = []

    # Title & Metadata
    story.append(Paragraph(f"Financial Activity Report", title_style))
    story.append(Paragraph(
        f"Generated for {user.username} | Period: {start_date} to {end_date} | Currency: {user.currency}",
        subtitle_style
    ))
    story.append(Spacer(1, 10))

    # Metrics aggregation
    transactions = Transaction.objects.filter(user=user, date__range=[start_date, end_date])
    total_income = float(transactions.filter(type='income').aggregate(Sum('amount'))['amount__sum'] or 0)
    total_expense = float(transactions.filter(type='expense').aggregate(Sum('amount'))['amount__sum'] or 0)
    net_savings = total_income - total_expense
    savings_rate = (net_savings / total_income * 100) if total_income > 0 else 0.0

    # Summary table
    summary_data = [
        [Paragraph("Total Income", metric_label_style), Paragraph(f"৳{total_income:,.2f}", metric_value_style)],
        [Paragraph("Total Expenses", metric_label_style), Paragraph(f"৳{total_expense:,.2f}", metric_value_style)],
        [Paragraph("Net Savings", metric_label_style), Paragraph(f"৳{net_savings:,.2f}", metric_value_style)],
        [Paragraph("Savings Rate", metric_label_style), Paragraph(f"{savings_rate:.1f}%", metric_value_style)]
    ]
    summary_table = Table(summary_data, colWidths=[200, 200])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 20))

    # Embedded charts
    try:
        chart_bytes = create_report_charts(user, start_date, end_date)
        chart_image = Image(io.BytesIO(chart_bytes), width=500, height=200)
        story.append(chart_image)
        story.append(Spacer(1, 20))
    except Exception as e:
        story.append(Paragraph(f"Chart rendering unavailable: {str(e)}", body_style))
        story.append(Spacer(1, 10))

    # Budgets section
    budgets = Budget.objects.filter(user=user, start_date__lte=end_date, end_date__gte=start_date)
    if budgets.exists():
        story.append(Paragraph("Budget Performance Summary", heading_style))
        budget_headers = [Paragraph("<b>Category</b>", body_style), Paragraph("<b>Limit</b>", body_style), Paragraph("<b>Spent</b>", body_style), Paragraph("<b>Status</b>", body_style)]
        budget_rows = [budget_headers]
        
        for b in budgets:
            # Spent calculation
            filters = {
                'user': user,
                'type': 'expense',
                'date__gte': b.start_date,
                'date__lte': b.end_date,
            }
            if b.category:
                filters['category'] = b.category
            
            spent = float(Transaction.objects.filter(**filters).aggregate(Sum('amount'))['amount__sum'] or 0)
            limit = float(b.amount)
            pct = (spent / limit * 100) if limit > 0 else 0
            
            status_text = f"{pct:.1f}% used"
            if spent > limit:
                status_text += " (Over Limit)"
                
            cat_name = b.category.name if b.category else "All Categories"
            budget_rows.append([
                Paragraph(cat_name, body_style),
                Paragraph(f"৳{limit:,.2f}", body_style),
                Paragraph(f"৳{spent:,.2f}", body_style),
                Paragraph(status_text, body_style)
            ])
            
        budget_table = Table(budget_rows, colWidths=[150, 100, 100, 150])
        budget_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e2e8f0')),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#94a3b8')),
        ]))
        story.append(budget_table)
        story.append(Spacer(1, 20))

    # Recent Transactions table
    story.append(Paragraph("Transaction History Details", heading_style))
    tx_headers = [
        Paragraph("<b>Date</b>", body_style),
        Paragraph("<b>Category</b>", body_style),
        Paragraph("<b>Type</b>", body_style),
        Paragraph("<b>Amount</b>", body_style),
        Paragraph("<b>Description</b>", body_style)
    ]
    tx_rows = [tx_headers]

    for tx in transactions[:30]:  # Limit to top 30 transactions to prevent page overflow
        cat_name = tx.category.name if tx.category else "General"
        tx_rows.append([
            Paragraph(str(tx.date), body_style),
            Paragraph(cat_name, body_style),
            Paragraph(tx.type.capitalize(), body_style),
            Paragraph(f"৳{float(tx.amount):,.2f}", body_style),
            Paragraph(tx.description or '', body_style)
        ])

    tx_table = Table(tx_rows, colWidths=[70, 90, 60, 80, 200])
    tx_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e2e8f0')),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#94a3b8')),
    ]))
    story.append(tx_table)

    # Build document
    doc.build(story)
    
    # Save to FileField
    buffer.seek(0)
    filename = f"report_{user.id}_{start_date}_{end_date}.pdf"
    report_instance.file.save(filename, ContentFile(buffer.getvalue()))
    report_instance.status = 'completed'
    report_instance.save()
