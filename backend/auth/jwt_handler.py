from datetime import datetime, timedelta
from typing import Optional
import jwt
import os

JWT_SECRET = os.getenv('JWT_SECRET', 'saqr_secret_key_change_in_production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24 * 30  # 30 days

def create_access_token(user_id: str) -> str:
    """
    Create JWT access token for user
    """
    expiration = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        'user_id': user_id,
        'exp': expiration,
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    """
    Decode and verify JWT token
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_user_id_from_token(token: str) -> Optional[str]:
    """
    Extract user_id from token
    """
    payload = decode_access_token(token)
    if payload:
        return payload.get('user_id')
    return None