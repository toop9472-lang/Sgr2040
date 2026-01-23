from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from models.ad import Ad, AdCreate, AdResponse
from models.user import WatchedAd
from auth.dependencies import get_current_user_id
from typing import List
from datetime import datetime
import os

router = APIRouter(prefix='/ads', tags=['Advertisements'])

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

@router.get('', response_model=List[AdResponse])
async def get_ads(user_id: str = Depends(get_current_user_id)):
    """
    Get all active ads
    """
    ads = await db.ads.find({'is_active': True}).to_list(100)
    
    return [
        AdResponse(
            id=ad['id'],
            title=ad['title'],
            description=ad['description'],
            video_url=ad['video_url'],
            thumbnail_url=ad['thumbnail_url'],
            advertiser=ad['advertiser'],
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
    ad_id = data.get('ad_id')
    watch_time = data.get('watch_time', 0)
    
    if not ad_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='ad_id is required'
        )
    
    # Get ad
    ad = await db.ads.find_one({'id': ad_id})
    if not ad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Ad not found'
        )
    
    # Get user
    user = await db.users.find_one({'id': user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='User not found'
        )
    
    # Anti-cheat: Check if ad was already watched
    watched_ads = user.get('watched_ads', [])
    for watched_ad in watched_ads:
        if watched_ad.get('ad_id') == ad_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='This ad has already been watched. Each ad can only be watched once.'
            )
    
    # Validate watch time
    max_watch_time = ad['duration']
    if watch_time > max_watch_time:
        watch_time = max_watch_time
    
    # Calculate points (1 point per minute)
    points_earned = (watch_time // 60) * ad['points_per_minute']
    
    if points_earned <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Watch time too short to earn points'
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
        {'id': user_id},
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
    updated_user = await db.users.find_one({'id': user_id})
    
    return {
        'success': True,
        'points_earned': points_earned,
        'total_points': updated_user['points'],
        'message': f'Earned {points_earned} points!'
    }