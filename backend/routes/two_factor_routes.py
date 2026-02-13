# Two-Factor Authentication Routes - التحقق بخطوتين
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import secrets
import hashlib
from database import get_db
from auth.dependencies import get_current_user_id

router = APIRouter(prefix="/api/2fa", tags=["Two-Factor Auth"])

class Enable2FARequest(BaseModel):
    method: str = "email"  # email or sms

class Verify2FARequest(BaseModel):
    code: str

class Validate2FARequest(BaseModel):
    user_id: str
    code: str

def generate_2fa_code():
    """توليد رمز 2FA مكون من 6 أرقام"""
    return ''.join([str(secrets.randbelow(10)) for _ in range(6)])

def hash_code(code: str) -> str:
    """تشفير الرمز"""
    return hashlib.sha256(code.encode()).hexdigest()

@router.post('/enable', response_model=dict)
async def enable_2fa(data: Enable2FARequest, user_id: str = Depends(get_current_user_id)):
    """تفعيل التحقق بخطوتين"""
    db = get_db()
    
    user = await db.users.find_one({'$or': [{'id': user_id}, {'user_id': user_id}]})
    if not user:
        raise HTTPException(status_code=404, detail='المستخدم غير موجود')
    
    # Generate verification code
    code = generate_2fa_code()
    code_hash = hash_code(code)
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    # Store pending 2FA setup
    await db.two_factor_pending.update_one(
        {'user_id': user_id},
        {
            '$set': {
                'user_id': user_id,
                'method': data.method,
                'code_hash': code_hash,
                'expires_at': expires_at,
                'created_at': datetime.utcnow()
            }
        },
        upsert=True
    )
    
    # In production, send code via email/SMS
    # For now, return it (in production, remove this)
    return {
        'success': True,
        'message': f'تم إرسال رمز التحقق إلى {data.method}',
        'expires_in': 600,
        # Remove this in production:
        'debug_code': code
    }

@router.post('/verify', response_model=dict)
async def verify_2fa_setup(data: Verify2FARequest, user_id: str = Depends(get_current_user_id)):
    """التحقق من رمز 2FA وتفعيله"""
    db = get_db()
    
    pending = await db.two_factor_pending.find_one({'user_id': user_id})
    
    if not pending:
        raise HTTPException(status_code=400, detail='لم يتم طلب تفعيل 2FA')
    
    if datetime.utcnow() > pending['expires_at']:
        await db.two_factor_pending.delete_one({'user_id': user_id})
        raise HTTPException(status_code=400, detail='انتهت صلاحية الرمز')
    
    if hash_code(data.code) != pending['code_hash']:
        raise HTTPException(status_code=400, detail='رمز التحقق غير صحيح')
    
    # Generate backup codes
    backup_codes = [generate_2fa_code() for _ in range(8)]
    backup_codes_hashed = [hash_code(c) for c in backup_codes]
    
    # Enable 2FA for user
    update_filter = {'user_id': user_id} if await db.users.find_one({'user_id': user_id}) else {'id': user_id}
    await db.users.update_one(
        update_filter,
        {
            '$set': {
                'two_factor_enabled': True,
                'two_factor_method': pending['method'],
                'two_factor_backup_codes': backup_codes_hashed,
                'two_factor_enabled_at': datetime.utcnow()
            }
        }
    )
    
    # Clean up
    await db.two_factor_pending.delete_one({'user_id': user_id})
    
    return {
        'success': True,
        'message': 'تم تفعيل التحقق بخطوتين بنجاح',
        'backup_codes': backup_codes  # Show once only
    }

@router.post('/disable', response_model=dict)
async def disable_2fa(data: Verify2FARequest, user_id: str = Depends(get_current_user_id)):
    """إلغاء تفعيل 2FA"""
    db = get_db()
    
    user = await db.users.find_one({'$or': [{'id': user_id}, {'user_id': user_id}]})
    if not user:
        raise HTTPException(status_code=404, detail='المستخدم غير موجود')
    
    if not user.get('two_factor_enabled'):
        raise HTTPException(status_code=400, detail='التحقق بخطوتين غير مفعل')
    
    # Verify with backup code or current code
    code_hash = hash_code(data.code)
    backup_codes = user.get('two_factor_backup_codes', [])
    
    if code_hash not in backup_codes:
        # Check if it's a current 2FA code
        pending = await db.two_factor_codes.find_one({
            'user_id': user_id,
            'code_hash': code_hash,
            'expires_at': {'$gt': datetime.utcnow()}
        })
        if not pending:
            raise HTTPException(status_code=400, detail='رمز التحقق غير صحيح')
    
    # Disable 2FA
    update_filter = {'user_id': user_id} if user.get('user_id') else {'id': user_id}
    await db.users.update_one(
        update_filter,
        {
            '$unset': {
                'two_factor_enabled': '',
                'two_factor_method': '',
                'two_factor_backup_codes': '',
                'two_factor_enabled_at': ''
            }
        }
    )
    
    return {'success': True, 'message': 'تم إلغاء تفعيل التحقق بخطوتين'}

@router.post('/send-code', response_model=dict)
async def send_2fa_code(user_id: str = Depends(get_current_user_id)):
    """إرسال رمز 2FA للتسجيل الدخول"""
    db = get_db()
    
    user = await db.users.find_one({'$or': [{'id': user_id}, {'user_id': user_id}]})
    if not user or not user.get('two_factor_enabled'):
        raise HTTPException(status_code=400, detail='التحقق بخطوتين غير مفعل')
    
    code = generate_2fa_code()
    code_hash = hash_code(code)
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    await db.two_factor_codes.update_one(
        {'user_id': user_id},
        {
            '$set': {
                'user_id': user_id,
                'code_hash': code_hash,
                'expires_at': expires_at,
                'created_at': datetime.utcnow()
            }
        },
        upsert=True
    )
    
    # In production, send via email/SMS
    return {
        'success': True,
        'message': 'تم إرسال رمز التحقق',
        'expires_in': 300,
        'debug_code': code  # Remove in production
    }

@router.post('/validate', response_model=dict)
async def validate_2fa_code(data: Validate2FARequest):
    """التحقق من رمز 2FA أثناء تسجيل الدخول"""
    db = get_db()
    
    stored = await db.two_factor_codes.find_one({
        'user_id': data.user_id,
        'expires_at': {'$gt': datetime.utcnow()}
    })
    
    if not stored:
        # Check backup codes
        user = await db.users.find_one({'$or': [{'id': data.user_id}, {'user_id': data.user_id}]})
        if user:
            backup_codes = user.get('two_factor_backup_codes', [])
            code_hash = hash_code(data.code)
            if code_hash in backup_codes:
                # Remove used backup code
                backup_codes.remove(code_hash)
                update_filter = {'user_id': data.user_id} if user.get('user_id') else {'id': data.user_id}
                await db.users.update_one(
                    update_filter,
                    {'$set': {'two_factor_backup_codes': backup_codes}}
                )
                return {'success': True, 'valid': True}
        
        raise HTTPException(status_code=400, detail='رمز التحقق غير صحيح أو منتهي الصلاحية')
    
    if hash_code(data.code) != stored['code_hash']:
        raise HTTPException(status_code=400, detail='رمز التحقق غير صحيح')
    
    # Clean up used code
    await db.two_factor_codes.delete_one({'user_id': data.user_id})
    
    return {'success': True, 'valid': True}

@router.get('/status', response_model=dict)
async def get_2fa_status(user_id: str = Depends(get_current_user_id)):
    """حالة التحقق بخطوتين"""
    db = get_db()
    
    user = await db.users.find_one(
        {'$or': [{'id': user_id}, {'user_id': user_id}]},
        {'two_factor_enabled': 1, 'two_factor_method': 1, 'two_factor_enabled_at': 1}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail='المستخدم غير موجود')
    
    return {
        'enabled': user.get('two_factor_enabled', False),
        'method': user.get('two_factor_method'),
        'enabled_at': user.get('two_factor_enabled_at', '').isoformat() if user.get('two_factor_enabled_at') else None
    }
