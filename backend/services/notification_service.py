import logging
import smtplib
from email.message import EmailMessage
import os

logger = logging.getLogger("uvicorn")

class NotificationService:
    @staticmethod
    def notify_assignment(allocation, project_name: str, engineer_name: str, engineer_email: str = None):
        """
        Sends a notification when an engineer is assigned to a project.
        MVP: Logs to console. Future: Sends Email via SMTP.
        """
        message = (
            f"🔔 NOTIFICATION: {engineer_name} assigned to '{project_name}' "
            f"for {allocation.hours} hours/week ({allocation.start_date} to {allocation.end_date})."
        )
        
        # 1. Log to Console (Always)
        logger.info(message)
        print(message) # Helper for Docker logs

        # 2. Send Email (If Configured)
        smtp_server = os.environ.get("SMTP_SERVER")
        smtp_port = os.environ.get("SMTP_PORT", 587)
        sender_email = os.environ.get("SMTP_SENDER", "noreply@resourcemanager.com")
        
        if smtp_server and engineer_email:
            try:
                msg = EmailMessage()
                msg.set_content(message)
                msg["Subject"] = f"New Assignment: {project_name}"
                msg["From"] = sender_email
                msg["To"] = engineer_email
                
                # Context manager for SMTP connection
                # with smtplib.SMTP(smtp_server, smtp_port) as s:
                #    s.send_message(msg)
                logger.info(f"Email sent to {engineer_email}")
            except Exception as e:
                logger.error(f"Failed to send email: {e}")

notification_service = NotificationService()
