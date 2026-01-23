"""
Admin Settings Routes
Manage API keys and OAuth settings
"""
from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import Optional, Dict
from auth.dependencies import get_current_user_id
from datetime import datetime
import os

router = APIRouter(prefix='/settings', tags=['Admin Settings'])

def get_db():
    """Get database connection"""
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]


class PaymentGatewaySettings(BaseModel):
    stripe_enabled: bool = True
    stripe_api_key: Optional[str] = None
    tap_enabled: bool = False
    tap_api_key: Optional[str] = None
    tabby_enabled: bool = False
    tabby_api_key: Optional[str] = None
    tamara_enabled: bool = False
    tamara_api_key: Optional[str] = None
    stcpay_enabled: bool = False
    stcpay_api_key: Optional[str] = None
    paypal_enabled: bool = False
    paypal_client_id: Optional[str] = None
    paypal_secret: Optional[str] = None


class OAuthSettings(BaseModel):
    google_enabled: bool = True
    apple_enabled: bool = False


class AllSettings(BaseModel):
    payment_gateways: PaymentGatewaySettings
    oauth: OAuthSettings


async def verify_admin(user_id: str, db):
    """Verify user is admin"""
    admin = await db.admins.find_one({'id': user_id}, {'_id': 0})
    if not admin:
        admin = await db.admins.find_one({'email': user_id}, {'_id': 0})
    if not admin:
        raise HTTPException(status_code=403, detail='غير مصرح - يجب أن تكون مدير')
    return admin


@router.get('/payment-gateways')
async def get_payment_gateway_settings(user_id: str = Depends(get_current_user_id)):
    """Get payment gateway settings (admin only)"""
    db = get_db()
    await verify_admin(user_id, db)
    
    settings = await db.settings.find_one({'type': 'payment_gateways'}, {'_id': 0})
    
    if not settings:
        # Return defaults
        return {
            'stripe_enabled': True,
            'stripe_api_key': mask_key(os.environ.get('STRIPE_API_KEY', '')),
            'tap_enabled': bool(os.environ.get('TAP_API_KEY')),
            'tap_api_key': mask_key(os.environ.get('TAP_API_KEY', '')),
            'tabby_enabled': bool(os.environ.get('TABBY_API_KEY')),
            'tabby_api_key': mask_key(os.environ.get('TABBY_API_KEY', '')),
            'tamara_enabled': bool(os.environ.get('TAMARA_API_KEY')),
            'tamara_api_key': mask_key(os.environ.get('TAMARA_API_KEY', '')),
            'stcpay_enabled': bool(os.environ.get('STCPAY_API_KEY')),
            'stcpay_api_key': mask_key(os.environ.get('STCPAY_API_KEY', '')),
            'paypal_enabled': bool(os.environ.get('PAYPAL_CLIENT_ID')),
            'paypal_client_id': mask_key(os.environ.get('PAYPAL_CLIENT_ID', '')),
            'paypal_secret': mask_key(os.environ.get('PAYPAL_SECRET', ''))
        }
    
    # Mask keys before returning
    return {
        'stripe_enabled': settings.get('stripe_enabled', True),
        'stripe_api_key': mask_key(settings.get('stripe_api_key', '')),
        'tap_enabled': settings.get('tap_enabled', False),
        'tap_api_key': mask_key(settings.get('tap_api_key', '')),
        'tabby_enabled': settings.get('tabby_enabled', False),
        'tabby_api_key': mask_key(settings.get('tabby_api_key', '')),
        'tamara_enabled': settings.get('tamara_enabled', False),
        'tamara_api_key': mask_key(settings.get('tamara_api_key', '')),
        'stcpay_enabled': settings.get('stcpay_enabled', False),
        'stcpay_api_key': mask_key(settings.get('stcpay_api_key', '')),
        'paypal_enabled': settings.get('paypal_enabled', False),
        'paypal_client_id': mask_key(settings.get('paypal_client_id', '')),
        'paypal_secret': mask_key(settings.get('paypal_secret', ''))
    }


@router.put('/payment-gateways')
async def update_payment_gateway_settings(
    settings: PaymentGatewaySettings,
    user_id: str = Depends(get_current_user_id)
):
    """Update payment gateway settings (admin only)"""
    db = get_db()
    await verify_admin(user_id, db)
    
    # Get current settings to preserve unchanged keys
    current = await db.settings.find_one({'type': 'payment_gateways'}, {'_id': 0})
    
    update_data = {
        'type': 'payment_gateways',
        'updated_at': datetime.utcnow()
    }
    
    # Handle each gateway - only update key if it's not masked
    # Stripe
    update_data['stripe_enabled'] = settings.stripe_enabled
    if settings.stripe_api_key and not settings.stripe_api_key.startswith('****'):
        update_data['stripe_api_key'] = settings.stripe_api_key
    elif current:
        update_data['stripe_api_key'] = current.get('stripe_api_key', '')
    
    # Tap
    update_data['tap_enabled'] = settings.tap_enabled
    if settings.tap_api_key and not settings.tap_api_key.startswith('****'):
        update_data['tap_api_key'] = settings.tap_api_key
    elif current:
        update_data['tap_api_key'] = current.get('tap_api_key', '')
    
    # Tabby
    update_data['tabby_enabled'] = settings.tabby_enabled
    if settings.tabby_api_key and not settings.tabby_api_key.startswith('****'):
        update_data['tabby_api_key'] = settings.tabby_api_key
    elif current:
        update_data['tabby_api_key'] = current.get('tabby_api_key', '')
    
    # Tamara
    update_data['tamara_enabled'] = settings.tamara_enabled
    if settings.tamara_api_key and not settings.tamara_api_key.startswith('****'):
        update_data['tamara_api_key'] = settings.tamara_api_key
    elif current:
        update_data['tamara_api_key'] = current.get('tamara_api_key', '')
    
    # STC Pay
    update_data['stcpay_enabled'] = settings.stcpay_enabled
    if settings.stcpay_api_key and not settings.stcpay_api_key.startswith('****'):
        update_data['stcpay_api_key'] = settings.stcpay_api_key
    elif current:
        update_data['stcpay_api_key'] = current.get('stcpay_api_key', '')
    
    # PayPal
    update_data['paypal_enabled'] = settings.paypal_enabled
    if settings.paypal_client_id and not settings.paypal_client_id.startswith('****'):
        update_data['paypal_client_id'] = settings.paypal_client_id
    elif current:
        update_data['paypal_client_id'] = current.get('paypal_client_id', '')
    
    if settings.paypal_secret and not settings.paypal_secret.startswith('****'):
        update_data['paypal_secret'] = settings.paypal_secret
    elif current:
        update_data['paypal_secret'] = current.get('paypal_secret', '')
    
    await db.settings.update_one(
        {'type': 'payment_gateways'},
        {'$set': update_data},
        upsert=True
    )
    
    return {'message': 'تم حفظ إعدادات بوابات الدفع بنجاح'}


@router.get('/oauth')
async def get_oauth_settings(user_id: str = Depends(get_current_user_id)):
    """Get OAuth settings (admin only)"""
    db = get_db()
    await verify_admin(user_id, db)
    
    settings = await db.settings.find_one({'type': 'oauth'}, {'_id': 0})
    
    if not settings:
        return {
            'google_enabled': True,
            'apple_enabled': False
        }
    
    return {
        'google_enabled': settings.get('google_enabled', True),
        'apple_enabled': settings.get('apple_enabled', False)
    }


@router.put('/oauth')
async def update_oauth_settings(
    settings: OAuthSettings,
    user_id: str = Depends(get_current_user_id)
):
    """Update OAuth settings (admin only)"""
    db = get_db()
    await verify_admin(user_id, db)
    
    update_data = {
        'type': 'oauth',
        'google_enabled': settings.google_enabled,
        'apple_enabled': settings.apple_enabled,
        'updated_at': datetime.utcnow()
    }
    
    await db.settings.update_one(
        {'type': 'oauth'},
        {'$set': update_data},
        upsert=True
    )
    
    return {'message': 'تم حفظ إعدادات تسجيل الدخول بنجاح'}


@router.get('/public/oauth')
async def get_public_oauth_settings():
    """Get OAuth settings for public use (no auth required)"""
    db = get_db()
    
    settings = await db.settings.find_one({'type': 'oauth'}, {'_id': 0})
    
    if not settings:
        return {
            'google_enabled': True,
            'apple_enabled': False
        }
    
    return {
        'google_enabled': settings.get('google_enabled', True),
        'apple_enabled': settings.get('apple_enabled', False)
    }


@router.get('/public/payment-gateways')
async def get_public_payment_settings():
    """Get enabled payment gateways for public use (no auth required)"""
    db = get_db()
    
    settings = await db.settings.find_one({'type': 'payment_gateways'}, {'_id': 0})
    
    if not settings:
        # Return defaults based on env vars
        return {
            'stripe': True,
            'tap': bool(os.environ.get('TAP_API_KEY')),
            'tabby': bool(os.environ.get('TABBY_API_KEY')),
            'tamara': bool(os.environ.get('TAMARA_API_KEY')),
            'stcpay': bool(os.environ.get('STCPAY_API_KEY')),
            'paypal': bool(os.environ.get('PAYPAL_CLIENT_ID'))
        }
    
    return {
        'stripe': settings.get('stripe_enabled', True),
        'tap': settings.get('tap_enabled', False),
        'tabby': settings.get('tabby_enabled', False),
        'tamara': settings.get('tamara_enabled', False),
        'stcpay': settings.get('stcpay_enabled', False),
        'paypal': settings.get('paypal_enabled', False)
    }


def mask_key(key: str) -> str:
    """Mask API key for display"""
    if not key:
        return ''
    if len(key) <= 8:
        return '****' + key[-2:] if len(key) > 2 else '****'
    return '****' + key[-4:]
