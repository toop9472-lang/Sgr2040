"""
Unity Ads Integration
For server-side ad validation and analytics
"""
from fastapi import APIRouter, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Optional
import os
import uuid
import hmac
import hashlib
import httpx

router = APIRouter(prefix='/unity-ads', tags=['Unity Ads'])

# Unity Ads Configuration
UNITY_GAME_ID = os.environ.get('UNITY_GAME_ID', '')
UNITY_API_KEY = os.environ.get('UNITY_API_KEY', '')


def get_db():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]


class UnityAdCompletionRequest(BaseModel):
    """Request when user completes a Unity ad"""
    placement_id: str
    user_id: str
    session_id: Optional[str] = None
    ad_type: str = "rewarded_video"


class UnityAdResponse(BaseModel):
    """Response after ad completion verification"""
    success: bool
    points_earned: int
    message: str


@router.get('/status')
async def get_unity_ads_status():
    """Check Unity Ads configuration status"""
    return {
        "configured": bool(UNITY_GAME_ID and UNITY_API_KEY),
        "game_id": UNITY_GAME_ID[:4] + "****" if UNITY_GAME_ID else None,
        "message": "Unity Ads جاهز للاستخدام" if UNITY_GAME_ID else "يرجى إضافة UNITY_GAME_ID و UNITY_API_KEY"
    }


@router.get('/placements')
async def get_available_placements():
    """Get available ad placements"""
    return {
        "placements": [
            {
                "id": "rewardedVideo",
                "name": "إعلان مكافأة",
                "type": "rewarded",
                "points": 5
            },
            {
                "id": "interstitial",
                "name": "إعلان بيني",
                "type": "interstitial",
                "points": 2
            }
        ]
    }


def verify_unity_callback(query_params: dict, secret_key: str) -> bool:
    """
    Verify Unity Ads Server-to-Server callback signature
    """
    received_signature = query_params.get('sig', '')
    
    # Build the signature string (excluding 'sig' parameter)
    signature_params = {k: v for k, v in sorted(query_params.items()) if k != 'sig'}
    signature_string = '&'.join(f"{k}={v}" for k, v in signature_params.items())
    
    # Calculate expected signature
    expected_signature = hmac.new(
        secret_key.encode(),
        signature_string.encode(),
        hashlib.md5
    ).hexdigest()
    
    return hmac.compare_digest(received_signature, expected_signature)


@router.post('/complete', response_model=UnityAdResponse)
async def complete_unity_ad(data: UnityAdCompletionRequest):
    """
    Record ad completion and award points
    Called from the mobile app after ad finishes
    """
    db = get_db()
    
    # Get user
    user = await db.users.find_one(
        {'$or': [{'id': data.user_id}, {'user_id': data.user_id}]},
        {'_id': 0}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    
    # Get points settings
    settings = await db.settings.find_one({'type': 'rewards'}, {'_id': 0})
    points_per_ad = settings.get('points_per_ad', 5) if settings else 5
    
    actual_user_id = user.get('id') or user.get('user_id')
    
    # Record the ad view
    ad_view_record = {
        'id': f"unity_{uuid.uuid4().hex[:12]}",
        'user_id': actual_user_id,
        'ad_network': 'unity',
        'placement_id': data.placement_id,
        'ad_type': data.ad_type,
        'session_id': data.session_id,
        'points_earned': points_per_ad,
        'completed_at': datetime.now(timezone.utc)
    }
    
    await db.ad_views.insert_one(ad_view_record)
    
    # Update user points
    current_points = user.get('points', 0)
    new_points = current_points + points_per_ad
    
    await db.users.update_one(
        {'$or': [{'id': actual_user_id}, {'user_id': actual_user_id}]},
        {
            '$set': {
                'points': new_points,
                'updated_at': datetime.now(timezone.utc)
            },
            '$inc': {'total_ads_watched': 1}
        }
    )
    
    return UnityAdResponse(
        success=True,
        points_earned=points_per_ad,
        message=f"تم إضافة {points_per_ad} نقاط! الإجمالي: {new_points}"
    )


@router.get('/callback')
async def unity_s2s_callback(request: Request):
    """
    Unity Ads Server-to-Server (S2S) callback
    Called by Unity's servers when ad completes
    """
    db = get_db()
    query_params = dict(request.query_params)
    
    # Log callback for debugging
    callback_log = {
        'id': f"callback_{uuid.uuid4().hex[:12]}",
        'params': query_params,
        'received_at': datetime.now(timezone.utc)
    }
    await db.unity_callbacks.insert_one(callback_log)
    
    # Verify signature if secret key is configured
    secret_key = os.environ.get('UNITY_S2S_SECRET', '')
    if secret_key:
        if not verify_unity_callback(query_params, secret_key):
            return {"status": "error", "message": "Invalid signature"}
    
    # Extract data from callback
    user_id = query_params.get('userId') or query_params.get('user_id')
    placement = query_params.get('placementId') or query_params.get('placement')
    currency = query_params.get('currency', 'points')
    amount = int(query_params.get('amount', 5))
    
    if not user_id:
        return {"status": "error", "message": "Missing user_id"}
    
    # Find user
    user = await db.users.find_one(
        {'$or': [{'id': user_id}, {'user_id': user_id}]},
        {'_id': 0}
    )
    
    if not user:
        return {"status": "error", "message": "User not found"}
    
    actual_user_id = user.get('id') or user.get('user_id')
    
    # Award points
    current_points = user.get('points', 0)
    new_points = current_points + amount
    
    await db.users.update_one(
        {'$or': [{'id': actual_user_id}, {'user_id': actual_user_id}]},
        {
            '$set': {
                'points': new_points,
                'updated_at': datetime.now(timezone.utc)
            },
            '$inc': {'total_ads_watched': 1}
        }
    )
    
    # Record the reward
    reward_record = {
        'id': f"s2s_{uuid.uuid4().hex[:12]}",
        'user_id': actual_user_id,
        'ad_network': 'unity',
        'callback_type': 's2s',
        'placement': placement,
        'amount': amount,
        'currency': currency,
        'raw_params': query_params,
        'rewarded_at': datetime.now(timezone.utc)
    }
    await db.ad_rewards.insert_one(reward_record)
    
    # Return success (Unity expects '1' for success)
    return {"status": "ok", "points_awarded": amount}


@router.get('/stats')
async def get_unity_ads_stats():
    """Get Unity Ads statistics"""
    db = get_db()
    
    # Count total Unity ad views
    total_views = await db.ad_views.count_documents({'ad_network': 'unity'})
    
    # Count today's views
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_views = await db.ad_views.count_documents({
        'ad_network': 'unity',
        'completed_at': {'$gte': today_start}
    })
    
    # Total points from Unity ads
    points_pipeline = [
        {'$match': {'ad_network': 'unity'}},
        {'$group': {'_id': None, 'total': {'$sum': '$points_earned'}}}
    ]
    points_result = await db.ad_views.aggregate(points_pipeline).to_list(1)
    total_points = points_result[0]['total'] if points_result else 0
    
    return {
        "total_views": total_views,
        "today_views": today_views,
        "total_points_awarded": total_points,
        "average_daily_views": total_views // 30 if total_views > 0 else 0
    }
