from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from models.ad import Ad, AdCreate, AdResponse
from models.user import WatchedAd
from auth.dependencies import get_current_user_id
from typing import List
from datetime import datetime
import os

router = APIRouter(prefix='/ads', tags=['Advertisements'])

def get_db():
    """Get database connection"""
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]

@router.get('', response_model=List[AdResponse])
async def get_ads():
    """
    Get all active ads (public - no auth required)
    """
    db = get_db()
    ads = await db.ads.find({'is_active': True}, {'_id': 0}).to_list(100)
    
    return [
        AdResponse(
            id=ad['id'],
            title=ad['title'],
            description=ad['description'],
            video_url=ad['video_url'],
            thumbnail_url=ad['thumbnail_url'],
            advertiser=ad['advertiser'],
            website_url=ad.get('website_url'),
            duration=ad['duration'],
            points=ad['points_per_minute']
        )
        for ad in ads
    ]

@router.get('/{ad_id}', response_model=AdResponse)
async def get_ad(ad_id: str, user_id: str = Depends(get_current_user_id)):
    """
    Get specific ad by ID
    """
    db = get_db()
    ad = await db.ads.find_one({'id': ad_id})
    
    if not ad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Ad not found'
        )
    
    return AdResponse(
        id=ad['id'],
        title=ad['title'],
        description=ad['description'],
        video_url=ad['video_url'],
        thumbnail_url=ad['thumbnail_url'],
        advertiser=ad['advertiser'],
        duration=ad['duration'],
        points=ad['points_per_minute']
    )

@router.post('/watch', response_model=dict)
async def watch_ad(data: dict, user_id: str = Depends(get_current_user_id)):
    """
    Record ad watch and award points
    Anti-cheat: Validates watch time and ensures each ad is watched only once
    """
    db = get_db()
    ad_id = data.get('ad_id')
    watch_time = data.get('watch_time', 0)
    
    if not ad_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='ad_id is required'
        )
    
    # Anti-cheat: Minimum watch time validation (at least 30 seconds)
    MIN_WATCH_TIME = 30
    if watch_time < MIN_WATCH_TIME:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Minimum watch time is {MIN_WATCH_TIME} seconds'
        )
    
    # Get ad
    ad = await db.ads.find_one({'id': ad_id})
    if not ad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Ad not found'
        )
    
    # Get user - handle both 'id' and 'user_id' fields
    user = await db.users.find_one({
        '$or': [
            {'id': user_id},
            {'user_id': user_id}
        ]
    })
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='User not found'
        )
    
    # Get the actual user_id field from the user document
    actual_user_id = user.get('id') or user.get('user_id')
    
    # Anti-cheat: Check if ad was already watched
    watched_ads = user.get('watched_ads', [])
    for watched_ad in watched_ads:
        if watched_ad.get('ad_id') == ad_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='لقد شاهدت هذا الإعلان من قبل. كل إعلان يمكن مشاهدته مرة واحدة فقط.'
            )
    
    # Anti-cheat: Check for rapid watching (max 5 ads per 10 minutes)
    from datetime import timedelta
    ten_minutes_ago = datetime.utcnow() - timedelta(minutes=10)
    recent_watches = [
        w for w in watched_ads 
        if w.get('watched_at') and w['watched_at'] > ten_minutes_ago
    ]
    if len(recent_watches) >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail='أنت تشاهد الإعلانات بسرعة كبيرة. يرجى الانتظار قليلاً.'
        )
    
    # Validate watch time - cannot exceed ad duration
    max_watch_time = ad['duration']
    if watch_time > max_watch_time:
        watch_time = max_watch_time
    
    # Calculate points (1 point per minute)
    points_earned = (watch_time // 60) * ad.get('points_per_minute', 1)
    
    if points_earned <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='وقت المشاهدة قصير جداً لكسب النقاط. شاهد لمدة دقيقة على الأقل.'
        )
    
    # Create watched ad record
    watched_ad_record = {
        'ad_id': ad_id,
        'watched_at': datetime.utcnow(),
        'watch_time': watch_time,
        'points_earned': points_earned
    }
    
    # Update user points and watched ads
    await db.users.update_one(
        {'$or': [{'id': actual_user_id}, {'user_id': actual_user_id}]},
        {
            '$inc': {
                'points': points_earned,
                'total_earned': points_earned
            },
            '$push': {'watched_ads': watched_ad_record},
            '$set': {'updated_at': datetime.utcnow()}
        }
    )
    
    # Get updated user
    updated_user = await db.users.find_one({
        '$or': [{'id': actual_user_id}, {'user_id': actual_user_id}]
    })
    
    return {
        'success': True,
        'points_earned': points_earned,
        'total_points': updated_user.get('points', 0),
        'message': f'حصلت على {points_earned} نقطة!'
    }