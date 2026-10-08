import logging
import smtplib

from email.message import EmailMessage
from email.utils import parseaddr
from django.conf import settings

logger = logging.getLogger("bpaotu")


def send_email(subject, content, to, from_prefix=None):
    # Apply subject prefix
    if settings.EMAIL_SUBJECT_PREFIX:
        subject = f"{settings.EMAIL_SUBJECT_PREFIX} {subject}"

    # MAIL_FROM may already contain a display name, e.g.
    # "eDNA Explorer <edna-explorer@noreply.csiro.au>"
    from_header = settings.MAIL_FROM

    # Optionally override/add a display name
    if from_prefix:
        _, email_addr = parseaddr(settings.MAIL_FROM)
        from_header = f"{from_prefix} <{email_addr}>"
        envelope_from = email_addr
    else:
        _, envelope_from = parseaddr(settings.MAIL_FROM)

    msg = EmailMessage()
    msg.set_content(content)
    msg["Subject"] = subject
    msg["From"] = from_header
    msg["To"] = to

    try:
        with smtplib.SMTP(
            settings.MAIL_SERVER_HOST,
            settings.MAIL_SERVER_PORT,
        ) as server:
            server.send_message(
                msg,
                from_addr=envelope_from,
                to_addrs=[to],
            )

        logger.debug(
            f"Mail queued successfully to <{to}>: {subject}"
        )

    except Exception as e:
        logger.exception(
            f"Failed to send mail to <{to}>: {e}"
        )
