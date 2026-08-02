import datetime
from reports.models import Report
from reports.tasks import generate_report_task


def trigger_report_generation(user, start_date_str, end_date_str):
    """
    Creates a report request and schedules it for background processing.
    """
    try:
        start_date = datetime.datetime.strptime(start_date_str, "%Y-%m-%d").date()
        end_date = datetime.datetime.strptime(end_date_str, "%Y-%m-%d").date()
    except ValueError:
        # Fallback to current month boundaries
        today = datetime.date.today()
        start_date = today.replace(day=1)
        end_date = today

    # Create Report instance
    report = Report.objects.create(
        user=user,
        start_date=start_date,
        end_date=end_date,
        status='pending'
    )

    # Schedule background generation task
    generate_report_task.delay(report.id)

    return {
        'report_id': report.id,
        'status': 'pending',
        'message': f"PDF Report for period {start_date} to {end_date} is being generated in the background. You can download it shortly from the Reports section."
    }
