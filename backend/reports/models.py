from django.db import models
from django.conf import settings


class Report(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reports'
    )
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    file = models.FileField(upload_to='reports/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} Report ({self.start_date} to {self.end_date}) - {self.status}"


import os
from django.db.models.signals import post_delete
from django.dispatch import receiver

@receiver(post_delete, sender=Report)
def auto_delete_file_on_delete(sender, instance, **kwargs):
    """
    Deletes PDF file from filesystem when corresponding Report is deleted.
    """
    if instance.file:
        if os.path.isfile(instance.file.path):
            try:
                os.remove(instance.file.path)
            except Exception:
                pass
