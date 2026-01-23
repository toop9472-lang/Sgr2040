from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from models.user import User, UserCreate, UserResponse
from auth.jwt_handler import create_access_token
from auth.dependencies import get_current_user_id
from datetime import datetime
import os

router = APIRouter(prefix='/auth', tags=['Authentication'])

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

@router.post('/login', response_model=dict)
async def login(user_data: UserCreate):
    """
    Login or register user (Google/Apple OAuth)
    """
    try:
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