from rest_framework import viewsets, permissions
from .models import Report
from .serializers import ReportSerializer
from .tasks import generate_report_task


class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Report.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        report = serializer.save()
        # Dispatch task to Celery queue
        generate_report_task.delay(report.id)
