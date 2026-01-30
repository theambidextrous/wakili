import smtplib
import os
import secrets
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

class EmailService:
    """Service to handle email sending for verification and notifications"""
    
    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.sender_email = os.getenv("SENDER_EMAIL", "")
        self.sender_password = os.getenv("SENDER_PASSWORD", "")
        self.app_url = os.getenv("APP_URL", "https://localhost:8000")
        # Controls: disable TLS for dev (set to "false") or disable auth
        self.smtp_use_tls = os.getenv("SMTP_USE_TLS", "true").lower() in ("1", "true", "yes")
        self.smtp_auth = os.getenv("SMTP_AUTH", "true").lower() in ("1", "true", "yes")
        
        # Check if email service is configured: require sender email; password required only if auth enabled
        self.is_configured = bool(self.sender_email)
    
    @staticmethod
    def generate_verification_code() -> str:
        """Generate a 6-digit verification code"""
        return ''.join(secrets.choice(string.digits) for _ in range(6))
    
    def send_verification_email(self, email: str, username: str, verification_code: str) -> bool:
        """
        Send email verification code to user
        
        Args:
            email: User's email address
            username: User's username
            verification_code: 6-digit verification code
            
        Returns:
            True if email sent successfully, False otherwise
        """
        if not self.is_configured:
            print("Warning: Email service not configured. Skipping email send.")
            return False
        
        try:
            subject = "Verify Your Wakili Account"
            
            # Create email body
            html_body = f"""
            <html>
                <body style="font-family: Arial, sans-serif;">
                    <h2>Welcome to Wakili!</h2>
                    <p>Hi {username},</p>
                    <p>Thank you for registering. Please verify your email address to activate your account.</p>
                    
                    <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <p style="font-size: 18px; font-weight: bold;">Your Verification Code:</p>
                        <p style="font-size: 32px; letter-spacing: 5px; color: #007bff;">{verification_code}</p>
                    </div>
                    
                    <p>This code will expire in 24 hours.</p>
                    <p>If you didn't create this account, please ignore this email.</p>
                    
                    <hr>
                    <p style="font-size: 12px; color: #666;">
                        © 2026 Wakili. All rights reserved.
                    </p>
                </body>
            </html>
            """
            
            text_body = f"""
            Welcome to Wakili!
            
            Hi {username},
            
            Thank you for registering. Please verify your email address to activate your account.
            
            Your Verification Code: {verification_code}
            
            Or visit: {self.app_url}/verify-email?code={verification_code}&email={email}
            
            This code will expire in 24 hours.
            """
            
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.sender_email
            message["To"] = email
            
            # Attach both plain text and HTML versions
            message.attach(MIMEText(text_body, "plain"))
            message.attach(MIMEText(html_body, "html"))
            
            # Send email (handle TLS/auth configurably)
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                try:
                    if self.smtp_use_tls:
                        # only attempt STARTTLS if server supports it
                        if server.has_extn('starttls'):
                            server.starttls()
                        else:
                            print("Info: server does not advertise STARTTLS; continuing without TLS")

                    if self.smtp_auth:
                        if not self.sender_password:
                            print("Error: SMTP_AUTH enabled but SENDER_PASSWORD not set")
                            return False
                        server.login(self.sender_email, self.sender_password)

                    server.send_message(message)
                except Exception:
                    raise
            
            print(f"Verification email sent to {email}")
            return True
            
        except Exception as e:
            print(f"Failed to send email to {email}: {str(e)}")
            return False
    
    def send_welcome_email(self, email: str, username: str) -> bool:
        """
        Send welcome email after account is verified
        """
        if not self.is_configured:
            return False
        
        try:
            subject = "Account Verified - Welcome to Wakili!"
            
            html_body = f"""
            <html>
                <body style="font-family: Arial, sans-serif;">
                    <h2>Account Verified!</h2>
                    <p>Hi {username},</p>
                    <p>Your Wakili account has been successfully verified.</p>
                    
                    <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #c3e6cb;">
                        <p>✓ You now have <strong>1,000 credits</strong> available to use.</p>
                        <p>✓ Each chat response will cost credits based on the response length.</p>
                        <p>✓ Credits are valid for 6 months from today.</p>
                    </div>
                    
                    <p>Get started by logging in and chatting with our legal AI assistant about Kenyan law!</p>
                    
                    <p><a href="{self.app_url}/login" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Login</a></p>
                    
                    <hr>
                    <p style="font-size: 12px; color: #666;">
                        © 2026 Wakili. All rights reserved.
                    </p>
                </body>
            </html>
            """
            
            text_body = f"""
            Account Verified!
            
            Hi {username},
            
            Your Wakili account has been successfully verified.
            
            You now have 1,000 credits available to use.
            Each chat response will cost credits based on the response length.
            Credits are valid for 3 months from today.
            
            Get started by logging in and chatting with our legal AI assistant!
            """
            
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.sender_email
            message["To"] = email
            
            message.attach(MIMEText(text_body, "plain"))
            message.attach(MIMEText(html_body, "html"))
            
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                try:
                    if self.smtp_use_tls:
                        if server.has_extn('starttls'):
                            server.starttls()
                        else:
                            print("Info: server does not advertise STARTTLS; continuing without TLS")

                    if self.smtp_auth:
                        if not self.sender_password:
                            print("Error: SMTP_AUTH enabled but SENDER_PASSWORD not set")
                            return False
                        server.login(self.sender_email, self.sender_password)

                    server.send_message(message)
                except Exception:
                    raise
            
            print(f"Welcome email sent to {email}")
            return True
            
        except Exception as e:
            print(f"Failed to send welcome email to {email}: {str(e)}")
            return False
