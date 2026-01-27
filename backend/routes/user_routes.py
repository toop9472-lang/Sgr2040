from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from auth.dependencies import get_current_user_id
from datetime import datetime
import os

router = APIRouter(prefix='/users', tags=['Users'])

def get_db():
    """Get database connection"""
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]

@router.get('/profile', response_model=dict)
async def get_profile(user_id: str = Depends(get_current_user_id)):
    """
    Get user profile with full details
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

@router.put('/profile', response_model=dict)
async def update_profile(
    data: dict,
    user_id: str = Depends(get_current_user_id)
):
    """
    Update user profile
    """
    db = get_db()
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


@router.get('/analytics', response_model=dict)
async def get_user_analytics(user_id: str = Depends(get_current_user_id)):
    """
    Get user analytics for homepage
    """
    db = get_db()
    user = await db.users.find_one({'$or': [{'id': user_id}, {'user_id': user_id}]})
    
    if not user:
        return {
            'today_watches': 0,
            'total_watches': 0,
            'total_points': 0,
            'streak_days': 0
        }
    
    # Count today's watches
    from datetime import timedelta
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    watched_ads = user.get('watched_ads', [])
    
    today_watches = 0
    for wa in watched_ads:
        watched_at = wa.get('watched_at')
        if watched_at and watched_at >= today_start:
            today_watches += 1
    
    return {
        'today_watches': today_watches,
        'total_watches': len(watched_ads),
        'total_points': user.get('total_earned', 0),
        'current_points': user.get('points', 0),
        'streak_days': user.get('streak_days', 0)
    }
