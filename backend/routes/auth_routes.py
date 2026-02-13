from fastapi import APIRouter, HTTPException, status, Depends, Request
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, field_validator
from models.user import User, UserCreate, UserResponse
from auth.jwt_handler import create_access_token, create_token_pair, refresh_access_token
from auth.dependencies import get_current_user_id
from auth.password_utils import validate_password_strength, get_password_strength_score
from auth.rate_limiter import check_login_allowed, record_login_attempt
from passlib.hash import bcrypt
from datetime import datetime
import os
import uuid
import asyncio

router = APIRouter(prefix='/auth', tags=['Authentication'])

def get_db():
    """Get database connection"""
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]

class EmailLogin(BaseModel):
    email: EmailStr
    password: str

class EmailRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        is_valid, errors = validate_password_strength(v)
        if not is_valid:
            raise ValueError(errors[0])
        return v
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('الاسم يجب أن يكون حرفين على الأقل')
        if len(v) > 50:
            raise ValueError('الاسم طويل جداً')
        return v.strip()

class RefreshTokenRequest(BaseModel):
    refresh_token: str


@router.post('/signin', response_model=dict)
async def signin(credentials: EmailLogin, request: Request):
    """
    Unified sign in - checks both admins and users
    مع حماية من هجمات Brute Force
    """
    db = get_db()
    
    # الحصول على معلومات الطلب
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get('user-agent', '')
    
    # التحقق من حد المحاولات
    allowed, error_msg, remaining = await check_login_allowed(credentials.email, client_ip)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=error_msg
        )
    
    # First, check if this is an admin
    admin = await db.admins.find_one({'email': credentials.email}, {'_id': 0})
    
    if admin:
        # Verify admin password
        try:
            password_valid = bcrypt.verify(credentials.password, admin['password_hash'])
        except Exception:
            password_valid = False
        
        if password_valid:
            admin_id = admin.get('id', admin['email'])
            
            # تسجيل محاولة ناجحة
            await record_login_attempt(credentials.email, True, client_ip, user_agent)
            
            # Update last login
            await db.admins.update_one(
                {'email': credentials.email},
                {'$set': {'last_login': datetime.utcnow()}}
            )
            
            # Create tokens
            access_token, refresh_token = create_token_pair(admin_id, is_admin=True)
            
            return {
                'token': access_token,
                'refresh_token': refresh_token,
                'role': 'admin',
                'user': {
                    'id': admin_id,
                    'email': admin['email'],
                    'name': admin.get('name', 'Admin'),
                    'role': admin.get('role', 'admin')
                }
            }
    
    # Not admin, check regular users
    user = await db.users.find_one({'email': credentials.email}, {'_id': 0})
    
    if user:
        # Check password
        try:
            password_valid = user.get('password_hash') and bcrypt.verify(credentials.password, user['password_hash'])
        except Exception:
            password_valid = False
        
        if password_valid:
            # التحقق من حالة الحساب
            user_status = user.get('status', 'active')
            if user_status == 'banned':
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail='تم إيقاف حسابك. تواصل مع الدعم الفني'
                )
            
            # تسجيل محاولة ناجحة
            await record_login_attempt(credentials.email, True, client_ip, user_agent)
            
            # Handle both 'id' and 'user_id' fields for backward compatibility
            user_id = user.get('id') or user.get('user_id')
            access_token, refresh_token = create_token_pair(user_id)
            
            created_at = user.get('created_at')
            if isinstance(created_at, datetime):
                joined_date = created_at.isoformat()
            else:
                joined_date = str(created_at) if created_at else datetime.utcnow().isoformat()
            
            return {
                'token': access_token,
                'refresh_token': refresh_token,
                'role': 'user',
                'user': {
                    'id': user_id,
                    'email': user['email'],
                    'name': user['name'],
                    'avatar': user.get('avatar'),
                    'points': user.get('points', 0),
                    'total_earned': user.get('total_earned', 0),
                    'joined_date': joined_date
                }
            }
    
    # تسجيل محاولة فاشلة
    await record_login_attempt(credentials.email, False, client_ip, user_agent)
    
    # No user found or wrong password
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail='البريد الإلكتروني أو كلمة المرور غير صحيحة'
    )


@router.post('/register', response_model=dict)
async def register_email(data: EmailRegister, request: Request):
    """
    Register new user with email/password
    مع التحقق من قوة كلمة المرور
    """
    db = get_db()
    
    # التحقق من قوة كلمة المرور
    is_valid, errors = validate_password_strength(data.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=errors[0]
        )
    
    # Check if email already exists
    existing = await db.users.find_one({'email': data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='البريد الإلكتروني مسجل بالفعل'
        )
    
    # Check if admin with this email exists
    admin_exists = await db.admins.find_one({'email': data.email})
    if admin_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='البريد الإلكتروني مسجل بالفعل'
        )
    
    # Hash password
    password_hash = bcrypt.hash(data.password)
    
    # Create user
    user_id = str(uuid.uuid4())
    
    # الحصول على معلومات الطلب
    client_ip = request.client.host if request.client else None
    
    user_doc = {
        'id': user_id,
        'email': data.email,
        'name': data.name,
        'password_hash': password_hash,
        'provider': 'email',
        'provider_id': data.email,
        'avatar': f"https://ui-avatars.com/api/?name={data.name}&background=6366f1&color=fff",
        'points': 0,
        'total_earned': 0,
        'watched_ads': [],
        'status': 'active',
        'registration_ip': client_ip,
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    
    await db.users.insert_one(user_doc)
    
    # Send welcome email (fire and forget - don't block registration)
    async def send_welcome():
        try:
            from services.email_service import send_welcome_email, get_email_settings
            settings = await get_email_settings()
            if settings and settings.get('email_enabled') and settings.get('send_welcome_email'):
                await send_welcome_email(data.email, data.name, 'ar')
        except Exception as e:
            print(f"Failed to send welcome email: {e}")
    
    asyncio.create_task(send_welcome())
    
    # Create tokens
    access_token, refresh_token = create_token_pair(user_id)
    
    return {
        'token': access_token,
        'refresh_token': refresh_token,
        'role': 'user',
        'user': {
            'id': user_id,
            'email': data.email,
            'name': data.name,
            'avatar': user_doc['avatar'],
            'points': 0,
            'total_earned': 0,
            'joined_date': user_doc['created_at'].isoformat()
        }
    }


@router.post('/refresh-token', response_model=dict)
async def refresh_token_endpoint(data: RefreshTokenRequest):
    """
    تجديد Access Token باستخدام Refresh Token
    """
    new_access_token = refresh_access_token(data.refresh_token)
    
    if not new_access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Refresh token غير صالح أو منتهي الصلاحية'
        )
    
    return {
        'token': new_access_token,
        'message': 'تم تجديد التوكن بنجاح'
    }


@router.post('/check-password-strength', response_model=dict)
async def check_password_strength(password: str):
    """
    التحقق من قوة كلمة المرور
    """
    is_valid, errors = validate_password_strength(password)
    score = get_password_strength_score(password)
    
    strength = 'ضعيفة'
    if score >= 80:
        strength = 'قوية جداً'
    elif score >= 60:
        strength = 'قوية'
    elif score >= 40:
        strength = 'متوسطة'
    
    return {
        'valid': is_valid,
        'score': score,
        'strength': strength,
        'errors': errors
    }


@router.post('/login', response_model=dict)
async def login(user_data: UserCreate):
    """
    Login or register user (Google/Apple OAuth)
    """
    try:
        db = get_db()
        
        # Check if user exists
        existing_user = await db.users.find_one({
            'provider': user_data.provider,
            'provider_id': user_data.provider_id
        })
        
        if existing_user:
            # Update user data
            await db.users.update_one(
                {'_id': existing_user['_id']},
                {'$set': {
                    'name': user_data.name,
                    'avatar': user_data.avatar,
                    'updated_at': datetime.utcnow()
                }}
            )
            user_id = existing_user['id']
        else:
            # Create new user
            new_user = User(**user_data.dict())
            user_dict = new_user.dict()
            await db.users.insert_one(user_dict)
            user_id = new_user.id
        
        # Create JWT token
        token = create_access_token(user_id)
        
        # Get user data
        user = await db.users.find_one({'id': user_id})
        
        return {
            'token': token,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'name': user['name'],
                'avatar': user.get('avatar'),
                'points': user['points'],
                'total_earned': user['total_earned'],
                'joined_date': user['created_at'].isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Login failed: {str(e)}'
        )


@router.get('/me', response_model=dict)
async def get_current_user(user_id: str = Depends(get_current_user_id)):
    """
    Get current user profile
    """
    db = get_db()
    user = await db.users.find_one({'id': user_id})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='User not found'
        )
    
    return {
        'user': {
            'id': user['id'],
            'email': user['email'],
            'name': user['name'],
            'avatar': user.get('avatar'),
            'points': user['points'],
            'total_earned': user['total_earned'],
            'watched_ads': user.get('watched_ads', []),
            'joined_date': user['created_at'].isoformat()
        }
    }


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post('/change-password', response_model=dict)
async def change_password(data: ChangePasswordRequest, user_id: str = Depends(get_current_user_id)):
    """
    تغيير كلمة المرور للمستخدم المسجل
    """
    db = get_db()
    
    # البحث عن المستخدم - دعم كلا الحقلين id و user_id
    user = await db.users.find_one({
        '$or': [
            {'id': user_id},
            {'user_id': user_id}
        ]
    })
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='المستخدم غير موجود'
        )
    
    # التحقق من كلمة المرور الحالية
    if not user.get('password_hash'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='لا يمكن تغيير كلمة المرور لهذا الحساب'
        )
    
    try:
        password_valid = bcrypt.verify(data.current_password, user['password_hash'])
    except Exception:
        password_valid = False
    
    if not password_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='كلمة المرور الحالية غير صحيحة'
        )
    
    # التحقق من قوة كلمة المرور الجديدة
    is_valid, errors = validate_password_strength(data.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=errors[0]
        )
    
    # التأكد من أن كلمة المرور الجديدة مختلفة عن الحالية
    try:
        same_password = bcrypt.verify(data.new_password, user['password_hash'])
        if same_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية'
            )
    except Exception:
        pass
    
    # تحديث كلمة المرور
    new_password_hash = bcrypt.hash(data.new_password)
    await db.users.update_one(
        {'id': user_id},
        {
            '$set': {
                'password_hash': new_password_hash,
                'updated_at': datetime.utcnow()
            }
        }
    )
    
    return {'message': 'تم تغيير كلمة المرور بنجاح'}


@router.post('/logout')
async def logout():
    """
    Logout user (client should clear token)
    """
    return {'message': 'تم تسجيل الخروج بنجاح'}
