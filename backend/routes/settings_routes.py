"""
Admin Settings Routes
Manage API keys, OAuth settings, and app configuration
"""
from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import Optional, Dict, List
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
    applepay_enabled: bool = False
    applepay_merchant_id: Optional[str] = None


class OAuthSettings(BaseModel):
    google_enabled: bool = True
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    apple_enabled: bool = False
    apple_client_id: Optional[str] = None
    apple_team_id: Optional[str] = None
    apple_key_id: Optional[str] = None
    apple_private_key: Optional[str] = None


class AppSettings(BaseModel):
    maintenance_mode: bool = False
    maintenance_message: str = "التطبيق تحت الصيانة، سنعود قريباً"
    maintenance_message_en: str = "App is under maintenance, we'll be back soon"
    allow_new_registrations: bool = True
    allow_withdrawals: bool = True
    allow_ad_submissions: bool = True
    min_withdrawal_points: int = 500
    points_per_minute: int = 1
    ad_price_per_month: int = 500
    max_ads_per_10min: int = 5
    min_watch_seconds: int = 30
    contact_email: str = ""
    contact_phone: str = ""
    support_whatsapp: str = ""
    terms_url: str = ""
    privacy_url: str = ""


class EmergencyActions(BaseModel):
    pause_all_payments: bool = False
    pause_all_withdrawals: bool = False
    block_all_logins: bool = False
    emergency_message: str = ""
    show_emergency_banner: bool = False


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
    
    current = await db.settings.find_one({'type': 'payment_gateways'}, {'_id': 0})
    
    update_data = {
        'type': 'payment_gateways',
        'updated_at': datetime.utcnow()
    }
    
    # Handle each gateway
    for field in ['stripe', 'tap', 'tabby', 'tamara', 'stcpay']:
        update_data[f'{field}_enabled'] = getattr(settings, f'{field}_enabled')
        key_field = f'{field}_api_key'
        key_value = getattr(settings, key_field)
        if key_value and not key_value.startswith('****'):
            update_data[key_field] = key_value
        elif current:
            update_data[key_field] = current.get(key_field, '')
    
    # PayPal special handling
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
            'google_client_id': mask_key(os.environ.get('GOOGLE_CLIENT_ID', '')),
            'google_client_secret': mask_key(os.environ.get('GOOGLE_CLIENT_SECRET', '')),
            'apple_enabled': False,
            'apple_client_id': '',
            'apple_team_id': '',
            'apple_key_id': '',
            'apple_private_key': ''
        }
    
    return {
        'google_enabled': settings.get('google_enabled', True),
        'google_client_id': mask_key(settings.get('google_client_id', '')),
        'google_client_secret': mask_key(settings.get('google_client_secret', '')),
        'apple_enabled': settings.get('apple_enabled', False),
        'apple_client_id': mask_key(settings.get('apple_client_id', '')),
        'apple_team_id': mask_key(settings.get('apple_team_id', '')),
        'apple_key_id': mask_key(settings.get('apple_key_id', '')),
        'apple_private_key': '****' if settings.get('apple_private_key') else ''
    }


@router.put('/oauth')
async def update_oauth_settings(
    settings: OAuthSettings,
    user_id: str = Depends(get_current_user_id)
):
    """Update OAuth settings (admin only)"""
    db = get_db()
    await verify_admin(user_id, db)
    
    current = await db.settings.find_one({'type': 'oauth'}, {'_id': 0})
    
    update_data = {
        'type': 'oauth',
        'google_enabled': settings.google_enabled,
        'apple_enabled': settings.apple_enabled,
        'updated_at': datetime.utcnow()
    }
    
    # Google credentials
    if settings.google_client_id and not settings.google_client_id.startswith('****'):
        update_data['google_client_id'] = settings.google_client_id
    elif current:
        update_data['google_client_id'] = current.get('google_client_id', '')
    
    if settings.google_client_secret and not settings.google_client_secret.startswith('****'):
        update_data['google_client_secret'] = settings.google_client_secret
    elif current:
        update_data['google_client_secret'] = current.get('google_client_secret', '')
    
    # Apple credentials
    if settings.apple_client_id and not settings.apple_client_id.startswith('****'):
        update_data['apple_client_id'] = settings.apple_client_id
    elif current:
        update_data['apple_client_id'] = current.get('apple_client_id', '')
    
    if settings.apple_team_id and not settings.apple_team_id.startswith('****'):
        update_data['apple_team_id'] = settings.apple_team_id
    elif current:
        update_data['apple_team_id'] = current.get('apple_team_id', '')
    
    if settings.apple_key_id and not settings.apple_key_id.startswith('****'):
        update_data['apple_key_id'] = settings.apple_key_id
    elif current:
        update_data['apple_key_id'] = current.get('apple_key_id', '')
    
    if settings.apple_private_key and not settings.apple_private_key.startswith('****'):
        update_data['apple_private_key'] = settings.apple_private_key
    elif current:
        update_data['apple_private_key'] = current.get('apple_private_key', '')
    
    await db.settings.update_one(
        {'type': 'oauth'},
        {'$set': update_data},
        upsert=True
    )
    
    return {'message': 'تم حفظ إعدادات تسجيل الدخول بنجاح'}


@router.get('/app')
async def get_app_settings(user_id: str = Depends(get_current_user_id)):
    """Get app settings (admin only)"""
    db = get_db()
    await verify_admin(user_id, db)
    
    settings = await db.settings.find_one({'type': 'app'}, {'_id': 0})
    
    if not settings:
        return AppSettings().dict()
    
    return {k: v for k, v in settings.items() if k != 'type'}


@router.put('/app')
async def update_app_settings(
    settings: AppSettings,
    user_id: str = Depends(get_current_user_id)
):
    """Update app settings (admin only)"""
    db = get_db()
    await verify_admin(user_id, db)
    
    update_data = settings.dict()
    update_data['type'] = 'app'
    update_data['updated_at'] = datetime.utcnow()
    
    await db.settings.update_one(
        {'type': 'app'},
        {'$set': update_data},
        upsert=True
    )
    
    return {'message': 'تم حفظ إعدادات التطبيق بنجاح'}


@router.get('/emergency')
async def get_emergency_settings(user_id: str = Depends(get_current_user_id)):
    """Get emergency settings (admin only)"""
    db = get_db()
    await verify_admin(user_id, db)
    
    settings = await db.settings.find_one({'type': 'emergency'}, {'_id': 0})
    
    if not settings:
        return EmergencyActions().dict()
    
    return {k: v for k, v in settings.items() if k != 'type'}


@router.put('/emergency')
async def update_emergency_settings(
    settings: EmergencyActions,
    user_id: str = Depends(get_current_user_id)
):
    """Update emergency settings (admin only)"""
    db = get_db()
    await verify_admin(user_id, db)
    
    update_data = settings.dict()
    update_data['type'] = 'emergency'
    update_data['updated_at'] = datetime.utcnow()
    
    await db.settings.update_one(
        {'type': 'emergency'},
        {'$set': update_data},
        upsert=True
    )
    
    return {'message': 'تم حفظ إعدادات الطوارئ بنجاح'}


@router.post('/maintenance/toggle')
async def toggle_maintenance(user_id: str = Depends(get_current_user_id)):
    """Toggle maintenance mode"""
    db = get_db()
    await verify_admin(user_id, db)
    
    settings = await db.settings.find_one({'type': 'app'}, {'_id': 0})
    current_mode = settings.get('maintenance_mode', False) if settings else False
    
    await db.settings.update_one(
        {'type': 'app'},
        {'$set': {
            'type': 'app',
            'maintenance_mode': not current_mode,
            'updated_at': datetime.utcnow()
        }},
        upsert=True
    )
    
    return {
        'maintenance_mode': not current_mode,
        'message': 'تم تفعيل وضع الصيانة' if not current_mode else 'تم إلغاء وضع الصيانة'
    }


@router.get('/public/oauth')
async def get_public_oauth_settings():
    """Get OAuth settings for public use (no auth required)"""
    db = get_db()
    settings = await db.settings.find_one({'type': 'oauth'}, {'_id': 0})
    
    if not settings:
        return {'google_enabled': True, 'apple_enabled': False}
    
    return {
        'google_enabled': settings.get('google_enabled', True),
        'apple_enabled': settings.get('apple_enabled', False)
    }


@router.get('/public/payment-gateways')
async def get_public_payment_settings():
    """Get enabled payment gateways for public use"""
    db = get_db()
    settings = await db.settings.find_one({'type': 'payment_gateways'}, {'_id': 0})
    
    if not settings:
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


@router.get('/public/app')
async def get_public_app_settings():
    """Get public app settings (maintenance mode, etc.)"""
    db = get_db()
    
    app_settings = await db.settings.find_one({'type': 'app'}, {'_id': 0})
    emergency_settings = await db.settings.find_one({'type': 'emergency'}, {'_id': 0})
    
    return {
        'maintenance_mode': app_settings.get('maintenance_mode', False) if app_settings else False,
        'maintenance_message': app_settings.get('maintenance_message', 'التطبيق تحت الصيانة') if app_settings else 'التطبيق تحت الصيانة',
        'maintenance_message_en': app_settings.get('maintenance_message_en', 'App is under maintenance') if app_settings else 'App is under maintenance',
        'allow_new_registrations': app_settings.get('allow_new_registrations', True) if app_settings else True,
        'show_emergency_banner': emergency_settings.get('show_emergency_banner', False) if emergency_settings else False,
        'emergency_message': emergency_settings.get('emergency_message', '') if emergency_settings else ''
    }


@router.get('/dashboard/stats')
async def get_dashboard_stats(user_id: str = Depends(get_current_user_id)):
    """Get comprehensive dashboard statistics"""
    db = get_db()
    await verify_admin(user_id, db)
    
    # Users stats
    total_users = await db.users.count_documents({})
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    new_users_today = await db.users.count_documents({'created_at': {'$gte': today}})
    
    # Ads stats
    total_ads = await db.ads.count_documents({})
    active_ads = await db.ads.count_documents({'status': 'active'})
    pending_ads = await db.ads.count_documents({'status': 'pending'})
    
    # Withdrawals stats
    total_withdrawals = await db.withdrawals.count_documents({})
    pending_withdrawals = await db.withdrawals.count_documents({'status': 'pending'})
    approved_withdrawals = await db.withdrawals.count_documents({'status': 'approved'})
    
    # Revenue
    revenue_pipeline = [
        {'$match': {'payment_status': 'paid'}},
        {'$group': {'_id': None, 'total': {'$sum': '$price'}}}
    ]
    revenue_result = await db.ads.aggregate(revenue_pipeline).to_list(1)
    total_revenue = revenue_result[0]['total'] if revenue_result else 0
    
    # Payouts
    payouts_pipeline = [
        {'$match': {'status': 'approved'}},
        {'$group': {'_id': None, 'total': {'$sum': '$amount'}}}
    ]
    payouts_result = await db.withdrawals.aggregate(payouts_pipeline).to_list(1)
    total_payouts = payouts_result[0]['total'] if payouts_result else 0
    
    # Points distributed
    points_pipeline = [
        {'$group': {'_id': None, 'total': {'$sum': '$total_earned'}}}
    ]
    points_result = await db.users.aggregate(points_pipeline).to_list(1)
    total_points = points_result[0]['total'] if points_result else 0
    
    return {
        'users': {
            'total': total_users,
            'new_today': new_users_today
        },
        'ads': {
            'total': total_ads,
            'active': active_ads,
            'pending': pending_ads
        },
        'withdrawals': {
            'total': total_withdrawals,
            'pending': pending_withdrawals,
            'approved': approved_withdrawals
        },
        'financials': {
            'total_revenue': total_revenue,
            'total_payouts': total_payouts,
            'net_profit': total_revenue - total_payouts,
            'total_points_distributed': total_points
        }
    }


def mask_key(key: str) -> str:
    """Mask API key for display"""
    if not key:
        return ''
    if len(key) <= 8:
        return '****' + key[-2:] if len(key) > 2 else '****'
    return '****' + key[-4:]
