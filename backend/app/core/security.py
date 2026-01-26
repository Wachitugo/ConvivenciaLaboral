
import hmac
import hashlib
import json
import base64
import time
from typing import Optional, Dict
from app.core.config import get_settings

settings = get_settings()

# Fallback secret key usually from env, for now derived from project ID or hardcoded
SECRET_KEY = settings.PROJECT_ID if settings.PROJECT_ID else "DEFAULT_INSECURE_SECRET_KEY_DEV"

def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

def _base64url_decode(data: str) -> bytes:
    padding = '=' * (4 - len(data) % 4)
    if len(data) % 4 == 0:
        padding = ''
    return base64.urlsafe_b64decode(data + padding)

def create_access_token(data: dict, expires_in: int = 3600 * 24) -> str:
    """
    Creates a simple signed token using HMAC-SHA256 (JWT-like).
    """
    header = {"alg": "HS256", "typ": "JWT"}
    
    payload = data.copy()
    payload["exp"] = int(time.time()) + expires_in
    
    header_b64 = _base64url_encode(json.dumps(header).encode('utf-8'))
    payload_b64 = _base64url_encode(json.dumps(payload).encode('utf-8'))
    
    signature = hmac.new(
        SECRET_KEY.encode('utf-8'),
        f"{header_b64}.{payload_b64}".encode('utf-8'),
        hashlib.sha256
    ).digest()
    
    signature_b64 = _base64url_encode(signature)
    
    return f"{header_b64}.{payload_b64}.{signature_b64}"

def verify_access_token(token: str) -> Optional[Dict]:
    """
    Verifies the token signature and expiration.
    Returns the payload if valid, None otherwise.
    """
    try:
        if not token or token.count('.') != 2:
            return None
            
        header_b64, payload_b64, signature_b64 = token.split('.')
        
        # Verify signature
        expected_signature = hmac.new(
            SECRET_KEY.encode('utf-8'),
            f"{header_b64}.{payload_b64}".encode('utf-8'),
            hashlib.sha256
        ).digest()
        
        expected_signature_b64 = _base64url_encode(expected_signature)
        
        if not hmac.compare_digest(signature_b64, expected_signature_b64):
            return None
            
        # Decode payload
        payload_json = _base64url_decode(payload_b64).decode('utf-8')
        payload = json.loads(payload_json)
        
        # Check expiration
        if "exp" in payload and payload["exp"] < time.time():
            return None
            
        return payload
        
    except Exception as e:
        return None
