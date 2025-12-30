import os
import jwt
import secrets
from datetime import datetime, timedelta
from google.oauth2 import id_token
from google.auth.transport import requests
import bcrypt
from tools import get_db_connection

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24 * 7  # 1 week

def verify_google_token(token: str) -> dict:
    """
    Verifies Google OAuth token and returns user info
    """
    try:
        # Verify the token with Google
        idinfo = id_token.verify_oauth2_token(
            token, 
            requests.Request(), 
            os.getenv("GOOGLE_CLIENT_ID")
        )
        
        # Token is valid, return user info
        return {
            "email": idinfo.get("email"),
            "name": idinfo.get("name"),
            "google_id": idinfo.get("sub"),
            "picture": idinfo.get("picture")
        }
    except ValueError as e:
        # Invalid token
        raise Exception(f"Invalid Google token: {str(e)}")

def generate_account_number() -> str:
    """
    Generates a unique 10-digit NUBAN account number
    """
    # Generate random 10-digit number
    account_number = str(secrets.randbelow(10**10)).zfill(10)
    return account_number

def get_or_create_user(google_user_info: dict) -> dict:
    """
    Gets existing user or creates new user from Google sign-in
    Returns user info with user_id
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if user exists by email
    cursor.execute(
        "SELECT user_id, full_name, email, phone_number FROM users WHERE email = %s",
        (google_user_info["email"],)
    )
    user = cursor.fetchone()
    
    if user:
        # User exists
        cursor.close()
        conn.close()
        return {
            "user_id": user[0],
            "full_name": user[1],
            "email": user[2],
            "phone_number": user[3],
            "is_new_user": False
        }
    
    # Create new user
    # Generate a placeholder phone number (user can update later)
    phone_placeholder = f"+234{secrets.randbelow(10**10):010d}"
    
    # Create temporary password hash (not used for Google auth)
    temp_password = bcrypt.hashpw(secrets.token_bytes(32), bcrypt.gensalt())
    
    cursor.execute(
        """
        INSERT INTO users (full_name, email, phone_number, password_hash, is_biometric_enabled)
        VALUES (%s, %s, %s, %s, FALSE)
        """,
        (google_user_info["name"], google_user_info["email"], phone_placeholder, temp_password)
    )
    user_id = cursor.lastrowid
    
    # Create account for new user
    account_number = generate_account_number()
    cursor.execute(
        """
        INSERT INTO accounts (user_id, account_number, balance_kobo)
        VALUES (%s, %s, 0)
        """,
        (user_id, account_number)
    )
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return {
        "user_id": user_id,
        "full_name": google_user_info["name"],
        "email": google_user_info["email"],
        "phone_number": phone_placeholder,
        "account_number": account_number,
        "is_new_user": True
    }

def create_access_token(user_id: int, email: str) -> str:
    """
    Creates JWT access token for authenticated user
    """
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode = {
        "user_id": user_id,
        "email": email,
        "exp": expire
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_access_token(token: str) -> dict:
    """
    Verifies JWT token and returns payload
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception("Token has expired")
    except jwt.InvalidTokenError:
        raise Exception("Invalid token")
