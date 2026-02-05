"""Authentication service for user registration, login, and JWT management"""

import bcrypt
import jwt
import os
import requests
import secrets
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("ACCESS_TOKEN_EXPIRE_HOURS", "24"))
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")


class AuthService:
    """Service to handle authentication, user management, and JWT tokens"""

    def __init__(self, db):
        """Initialize with database client"""
        self.db = db
        self.secret_key = SECRET_KEY
        self.algorithm = ALGORITHM
        self.access_token_expire_hours = ACCESS_TOKEN_EXPIRE_HOURS

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using bcrypt"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify password against bcrypt hash"""
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )

    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT access token"""
        to_encode = data.copy()

        if expires_delta:
            expire = datetime.now() + expires_delta
        else:
            expire = datetime.now() + timedelta(hours=self.access_token_expire_hours)

        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=401,
                detail="Token has expired"
            )
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

    def register_user(self, username: str, email: str, password: str, name: Optional[str] = None) -> Dict[str, Any]:
        """Register a new user"""
        try:
            # Check if user already exists
            check_query = """
                SELECT * FROM users 
                WHERE username = %s OR email = %s
            """
            existing = self.db.execute_query(check_query, (username, email))

            if existing:
                raise HTTPException(
                    status_code=400,
                    detail="Username or email already exists"
                )

            # Hash password
            password_hash = self.hash_password(password)

            # Insert new user (store optional name)
            insert_query = """
                INSERT INTO users (username, name, email, password_hash)
                VALUES (%s, %s, %s, %s)
            """
            self.db.execute_query(
                insert_query,
                (username, name, email, password_hash)
            )

            result = self.db.execute_query(check_query, (username, email))
            if not result:
                raise HTTPException(status_code=500, detail="Failed to create user")

            return dict(result[0])
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def login_user(self, username: str, password: str) -> Dict[str, Any]:
        """Authenticate user and return JWT token"""
        try:
            # Get user from database
            query = """
                SELECT id, username, name, email, password_hash, is_active, email_verified
                FROM users 
                WHERE username = %s
            """
            result = self.db.execute_query(query, (username,))

            if not result:
                raise HTTPException(status_code=401, detail="Invalid credentials")

            db_user = result[0]

            # Verify password
            if not self.verify_password(password, db_user["password_hash"]):
                raise HTTPException(status_code=401, detail="Invalid credentials")

            # Check if user's email is verified and account is active
            if not db_user["is_active"]:
                if not db_user["email_verified"]:
                    raise HTTPException(
                        status_code=403,
                        detail="Please verify your email before logging in. Check your inbox for the verification code."
                    )
                else:
                    raise HTTPException(
                        status_code=403,
                        detail="Your account has been deactivated. Please contact support."
                    )

            # Create JWT token (include name if present)
            access_token_expires = timedelta(hours=self.access_token_expire_hours)
            token_data = {
                "sub": str(db_user["id"]),
                "username": db_user["username"],
                "name": db_user.get("name"),
                "email": db_user["email"]
            }
            access_token = self.create_access_token(data=token_data, expires_delta=access_token_expires)

            return {
                "access_token": access_token,
                "token_type": "bearer",
                "expires_in": self.access_token_expire_hours * 3600  # Convert hours to seconds
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def get_current_user(self, token: str) -> Dict[str, Any]:
        """Get current user from JWT token"""
        # Verify JWT token
        payload = self.verify_token(token)
        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid token claims",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Fetch user from database
        query = """
            SELECT id, username, name, email, email_verified, created_at
            FROM users 
            WHERE id = %s AND is_active = TRUE
        """
        result = self.db.execute_query(query, (int(user_id),))

        if not result:
            raise HTTPException(
                status_code=401,
                detail="User not found or inactive",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return dict(result[0])

    def verify_email(self, email: str, code: str) -> Dict[str, Any]:
        """Verify user email with verification code"""
        try:
            # Get user by email
            query = """
                SELECT id, username, email, email_verification_code, email_verification_expires_at
                FROM users
                WHERE email = %s
            """
            result = self.db.execute_query(query, (email,))

            if not result:
                raise HTTPException(
                    status_code=404,
                    detail="User with this email not found"
                )

            user = result[0]

            # Check if already verified
            if user["email_verification_code"] is None:
                raise HTTPException(
                    status_code=400,
                    detail="This account has already been verified"
                )

            # Check if verification code matches
            if user["email_verification_code"] != code:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid verification code"
                )

            # Check if code has expired
            if user["email_verification_expires_at"] and datetime.utcnow() > user["email_verification_expires_at"]:
                raise HTTPException(
                    status_code=400,
                    detail="Verification code has expired. Please register again."
                )

            # Verify email and activate account
            update_query = """
                UPDATE users
                SET email_verified = TRUE,
                    is_active = TRUE,
                    email_verification_code = NULL,
                    email_verification_expires_at = NULL,
                    updated_at = NOW()
                WHERE id = %s
            """
            self.db.execute_query(update_query, (user["id"],))

            return {
                "message": "Email verified successfully!",
                "email": user["email"],
                "account_status": "active"
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def resend_verification_code(self, email: str) -> Dict[str, Any]:
        """Resend verification code to user email"""
        try:
            # Get user by email
            query = """
                SELECT id, username, email, email_verified
                FROM users
                WHERE email = %s
            """
            result = self.db.execute_query(query, (email,))

            if not result:
                raise HTTPException(
                    status_code=404,
                    detail="User with this email not found"
                )

            user = result[0]

            # Check if already verified
            if user["email_verified"]:
                raise HTTPException(
                    status_code=400,
                    detail="This email has already been verified"
                )

            return {
                "user": dict(user),
                "action": "resend_verification"
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def update_verification_code(self, user_id: int, verification_code: str) -> bool:
        """Store new verification code in database"""
        try:
            update_code_query = """
                UPDATE users 
                SET email_verification_code = %s, 
                    email_verification_expires_at = NOW() + INTERVAL '24 hours',
                    updated_at = NOW()
                WHERE id = %s
            """
            self.db.execute_query(update_code_query, (verification_code, user_id))
            return True
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def verify_google_id_token(self, id_token: str) -> Dict[str, Any]:
        """Verify Google ID token using Google's tokeninfo endpoint."""
        try:
            resp = requests.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": id_token},
                timeout=5
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid Google ID token")

            payload = resp.json()

            # Optional aud check against configured client id
            google_client_id = GOOGLE_CLIENT_ID
            if google_client_id and payload.get("aud") != google_client_id:
                raise HTTPException(status_code=401, detail="Invalid Google client ID")

            if "email" not in payload:
                raise HTTPException(status_code=401, detail="Google token missing email")

            return payload
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def social_login_google(self, id_token: str) -> Dict[str, Any]:
        """Login or register a user using a Google ID token and return JWT + user info.

        Returns dict with access token data and user info and a 'created' boolean flag.
        """
        try:
            payload = self.verify_google_id_token(id_token)
            email = payload.get("email")
            name = payload.get("name") or email.split("@")[0]

            # Check if a user with this email already exists
            query = "SELECT id, username, name, email,email_verified, is_active FROM users WHERE email = %s"
            result = self.db.execute_query(query, (email,))
            created = False

            if result:
                user = result[0]
                if not user.get("is_active"):
                    raise HTTPException(status_code=403, detail="User account is deactivated")
                user_id = user["id"]
                username = user["username"]
            else:
                # Create a unique username
                base_username = name.lower().replace(" ", "_")
                username = base_username
                count = 0
                check_query = "SELECT id FROM users WHERE username = %s"
                while self.db.execute_query(check_query, (username,)):
                    count += 1
                    username = f"{base_username}{count}"

                # Generate a secure random password hash (user won't use it for social auth)
                random_password = secrets.token_urlsafe(32)
                password_hash = self.hash_password(random_password)

                insert_query = """
                    INSERT INTO users (username, name, email, password_hash, email_verified, is_active, created_at)
                    VALUES (%s, %s, %s, %s, TRUE, TRUE, NOW())
                """
                self.db.execute_query(insert_query, (username, name, email, password_hash))

                user_row = self.db.execute_query("SELECT id, username, email, name FROM users WHERE email = %s", (email,))
                if not user_row:
                    raise HTTPException(status_code=500, detail="Failed to create user from Google login")

                user = user_row[0]
                user_id = user["id"]
                created = True

            # Generate access token
            access_token_expires = timedelta(hours=self.access_token_expire_hours)
            token_data = {
                "sub": str(user_id),
                "username": username,
                "name": user.get("name") if isinstance(user, dict) else name,
                "email": email
            }
            access_token = self.create_access_token(data=token_data, expires_delta=access_token_expires)

            return {
                "access_token": access_token,
                "token_type": "bearer",
                "expires_in": self.access_token_expire_hours * 3600,
                "user": dict(user),
                "created": created
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
