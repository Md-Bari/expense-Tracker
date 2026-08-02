from .models import AuditLog


def log_action(user, action, ip_address=None, details=''):
    """
    Helper function to log user activity.
    """
    try:
        AuditLog.objects.create(
            user=user,
            action=action,
            ip_address=ip_address,
            details=details
        )
    except Exception as e:
        # Prevent logging errors from crashing the main request flow
        pass
