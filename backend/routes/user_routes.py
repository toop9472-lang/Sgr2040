from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from auth.dependencies import get_current_user_id
import os

router = APIRouter(prefix='/users', tags=['Users'])

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

@router.get('/profile', response_model=dict)
async def get_profile(user_id: str = Depends(get_current_user_id)):
    """
    Get user profile with full details
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

@router.put('/profile', response_model=dict)
async def update_profile(
    data: dict,
    user_id: str = Depends(get_current_user_id)
):
    """
    Update user profile
    """
    update_data = {}
    
    if 'name' in data:
        update_data['name'] = data['name']
    if 'avatar' in data:
        update_data['avatar'] = data['avatar']
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='No data to update'
        )
    
    update_data['updated_at'] = datetime.utcnow()
    
    await db.users.update_one(
        {'id': user_id},
        {'$set': update_data}
    )
    
    user = await db.users.find_one({'id': user_id})
    
    return {
        'success': True,
        'user': {
            'id': user['id'],
            'email': user['email'],
            'name': user['name'],
            'avatar': user.get('avatar'),
            'points': user['points'],
            'total_earned': user['total_earned']
        }
    }