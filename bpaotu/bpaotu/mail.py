import os
import logging
import smtplib

from email.message import EmailMessage
from django.conf import settings

logger = logging.getLogger('bpaotu')

def send_email(subject, content, to, from_prefix=None):
    if from_prefix:
        from_email = "{} <{}>".format(from_prefix, settings.MAIL_FROM)
    else:
        if settings.EMAIL_SUBJECT_PREFIX:
            from_email = "{} <{}>".format(settings.EMAIL_SUBJECT_PREFIX, settings.MAIL_FROM)
        else:
            from_email = settings.MAIL_FROM

    msg = EmailMessage()
    msg.set_content(content)
    msg['Subject'] = subject
    msg['From'] = from_email
    msg['To'] = to

    try:
        with smtplib.SMTP(settings.MAIL_SERVER_HOST, settings.MAIL_SERVER_PORT) as server:
            server.send_message(msg)

        logger.info(f"Mail queued successfully: {subject}")
    except Exception as e:
        logger.error(f"Failed to send mail: {e}")
