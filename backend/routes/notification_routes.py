"""
Push Notifications Routes
Handles device registration and notification management
"""
from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from models.notification import DeviceToken, Notification, DeviceTokenCreate, NotificationCreate
from auth.dependencies import get_current_user_id
from datetime import datetime
from typing import List
import os
import httpx

router = APIRouter(prefix='/notifications', tags=['Notifications'])


def get_db():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]


# Expo Push Notification Service
EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


async def send_expo_push(tokens: List[str], title: str, body: str, data: dict = None):
    """Send push notification via Expo Push Service"""
    messages = []
    for token in tokens:
        message = {
            "to": token,
            "sound": "default",
            "title": title,
            "body": body,
        }
        if data:
            message["data"] = data
        messages.append(message)
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                EXPO_PUSH_URL,
                json=messages,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                }
            )
            return response.json()
    except Exception as e:
        print(f"Push notification error: {e}")
        return None


@router.post('/register-device', response_model=dict)
async def register_device(
    data: DeviceTokenCreate,
    user_id: str = Depends(get_current_user_id)
):
    """
    Register device for push notifications
    """
    db = get_db()
    
    # Check if token already exists for this user
    existing = await db.device_tokens.find_one({
        'user_id': user_id,
        'token': data.token
    })
    
    if existing:
        # Update existing token
        await db.device_tokens.update_one(
            {'_id': existing['_id']},
            {'$set': {
                'updated_at': datetime.utcnow(),
                'is_active': True
            }}
        )
        return {'success': True, 'message': 'تم تحديث الجهاز'}
    
    # Create new device token
    device_token = DeviceToken(
        user_id=user_id,
        token=data.token,
        platform=data.platform
    )
    
    await db.device_tokens.insert_one(device_token.dict())
    
    return {'success': True, 'message': 'تم تسجيل الجهاز للإشعارات'}


@router.delete('/unregister-device', response_model=dict)
async def unregister_device(
    token: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Unregister device from push notifications
    """
    db = get_db()
    
    await db.device_tokens.update_one(
        {'user_id': user_id, 'token': token},
        {'$set': {'is_active': False}}
    )
    
    return {'success': True, 'message': 'تم إلغاء تسجيل الجهاز'}


@router.get('/my-notifications', response_model=dict)
async def get_my_notifications(
    user_id: str = Depends(get_current_user_id),
    limit: int = 50
):
    """
    Get user's notifications
    """
    db = get_db()
    
    notifications = await db.notifications.find(
        {'user_id': user_id},
        {'_id': 0}
    ).sort('created_at', -1).limit(limit).to_list(limit)
    
    # Count unread
    unread_count = await db.notifications.count_documents({
        'user_id': user_id,
        'is_read': False
    })
    
    return {
        'notifications': notifications,
        'unread_count': unread_count
    }


@router.put('/mark-read/{notification_id}', response_model=dict)
async def mark_notification_read(
    notification_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Mark notification as read
    """
    db = get_db()
    
    await db.notifications.update_one(
        {'id': notification_id, 'user_id': user_id},
        {'$set': {'is_read': True}}
    )
    
    return {'success': True}


@router.put('/mark-all-read', response_model=dict)
async def mark_all_read(user_id: str = Depends(get_current_user_id)):
    """
    Mark all notifications as read
    """
    db = get_db()
    
    await db.notifications.update_many(
        {'user_id': user_id, 'is_read': False},
        {'$set': {'is_read': True}}
    )
    
    return {'success': True}


# === Utility Functions for Sending Notifications ===

async def send_notification_to_user(
    db,
    user_id: str,
    title: str,
    body: str,
    notification_type: str,
    data: dict = None
):
    """
    Send notification to a specific user
    """
    # Save to database
    notification = Notification(
        user_id=user_id,
        title=title,
        body=body,
        notification_type=notification_type,
        data=data
    )
    await db.notifications.insert_one(notification.dict())
    
    # Get user's device tokens
    device_tokens = await db.device_tokens.find({
        'user_id': user_id,
        'is_active': True
    }).to_list(10)
    
    if device_tokens:
        tokens = [dt['token'] for dt in device_tokens]
        await send_expo_push(tokens, title, body, data)
    
    return notification


async def send_notification_to_all_users(
    db,
    title: str,
    body: str,
    notification_type: str,
    data: dict = None
):
    """
    Send notification to all users (for new ads, etc.)
    """
    # Get all users
    users = await db.users.find({}, {'id': 1, 'user_id': 1}).to_list(10000)
    
    notifications = []
    all_tokens = []
    
    for user in users:
        user_id = user.get('id') or user.get('user_id')
        
        # Save notification to database
        notification = Notification(
            user_id=user_id,
            title=title,
            body=body,
            notification_type=notification_type,
            data=data
        )
        notifications.append(notification.dict())
        
        # Get device tokens
        device_tokens = await db.device_tokens.find({
            'user_id': user_id,
            'is_active': True
        }).to_list(10)
        
        all_tokens.extend([dt['token'] for dt in device_tokens])
    
    # Bulk insert notifications
    if notifications:
        await db.notifications.insert_many(notifications)
    
    # Send push notifications in batches of 100
    for i in range(0, len(all_tokens), 100):
        batch = all_tokens[i:i+100]
        await send_expo_push(batch, title, body, data)
    
    return len(notifications)
