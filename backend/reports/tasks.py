from celery import shared_task
from .models import Report
from .pdf_generator import generate_pdf_report


@shared_task
def generate_report_task(report_id):
    """
    Celery background task to generate PDF reports asynchronously.
    """
    try:
        report = Report.objects.get(id=report_id)
        generate_pdf_report(report)
    except Exception as e:
        # Fallback in case of generation failure
        try:
            report = Report.objects.get(id=report_id)
            report.status = 'failed'
            report.save()
        except:
            pass
        raise e
