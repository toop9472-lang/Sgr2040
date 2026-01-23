from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr
from models.user import User, UserCreate, UserResponse
from auth.jwt_handler import create_access_token
from auth.dependencies import get_current_user_id
from passlib.hash import bcrypt
from datetime import datetime
import os
import uuid

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


@router.post('/signin', response_model=dict)
async def signin(credentials: EmailLogin):
    """
    Unified sign in - checks both admins and users
    If admin credentials, returns admin role for redirect to admin dashboard
    """
    db = get_db()
    
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
            
            # Update last login
            await db.admins.update_one(
                {'email': credentials.email},
                {'$set': {'last_login': datetime.utcnow()}}
            )
            
            # Create token
            token = create_access_token(admin_id)
            
            return {
                'token': token,
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
            # Handle both 'id' and 'user_id' fields for backward compatibility
            user_id = user.get('id') or user.get('user_id')
            token = create_access_token(user_id)
            
            created_at = user.get('created_at')
            if isinstance(created_at, datetime):
                joined_date = created_at.isoformat()
            else:
                joined_date = str(created_at) if created_at else datetime.utcnow().isoformat()
            
            return {
                'token': token,
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
    
    # No user found or wrong password
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail='البريد الإلكتروني أو كلمة المرور غير صحيحة'
    )


@router.post('/register', response_model=dict)
async def register_email(data: EmailRegister):
    """
    Register new user with email/password
    """
    db = get_db()
    
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
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    
    await db.users.insert_one(user_doc)
    
    # Create token
    token = create_access_token(user_id)
    
    return {
        'token': token,
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


@router.post('/logout')
async def logout():
    """
    Logout user (client should clear token)
    """
    return {'message': 'تم تسجيل الخروج بنجاح'}
