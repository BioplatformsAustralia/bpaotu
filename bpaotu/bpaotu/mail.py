import os
import logging

from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger('bpaotu')

def send_email(subject, content, to, from_prefix=None):
    # from_email should be plain email or "Display Name <email@example.com>" format
    # EMAIL_SUBJECT_PREFIX (with brackets) is for the subject line, not the from address
    if from_prefix:
        from_email = "{} <{}>".format(from_prefix, settings.MAIL_FROM)
    else:
        from_email = settings.MAIL_FROM

    logger.debug(f"Sending email with from_email='{from_email}', to='{to}', subject='{subject}'")

    try:
        send_mail(
            subject=subject,
            message=content,
            from_email=from_email,
            recipient_list=[to],
            fail_silently=False,
        )
        logger.debug(f"Mail queued successfully to <{to}>: {subject}")
    except Exception as e:
        logger.error(f"Failed to send mail: {e}", exc_info=True)
