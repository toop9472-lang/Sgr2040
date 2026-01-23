from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from models.dashboard import DashboardStats
from auth.dependencies import get_current_user_id
from datetime import datetime, timedelta
import os

router = APIRouter(prefix='/admin/dashboard', tags=['Admin Dashboard'])

def get_db():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]

# Simple admin check (in production, create proper admin middleware)
async def verify_admin(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    # Check by both id and email since admin_id is sometimes the email
    admin = await db.admins.find_one({
        '$or': [
            {'id': user_id},
            {'email': user_id}
        ]
    })
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Admin access required'
        )
    return admin

@router.get('/stats', response_model=DashboardStats)
async def get_dashboard_stats(admin = Depends(verify_admin)):
    """
    Get dashboard statistics
    """
    db = get_db()
    
    # Count users
    total_users = await db.users.count_documents({})
    
    # Count ads
    total_ads = await db.advertiser_ads.count_documents({})
    active_ads = await db.advertiser_ads.count_documents({'status': 'active'})
    pending_ads = await db.advertiser_ads.count_documents({'status': 'pending'})
    
    # Count withdrawals
    total_withdrawals = await db.withdrawals.count_documents({})
    pending_withdrawals = await db.withdrawals.count_documents({'status': 'pending'})
    approved_withdrawals = await db.withdrawals.count_documents({'status': 'approved'})
    
    # Calculate revenue
    pipeline = [
        {'$match': {'status': {'$in': ['approved', 'active']}}},
        {'$group': {'_id': None, 'total': {'$sum': '$price'}}}
    ]
    revenue_result = await db.advertiser_ads.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]['total'] if revenue_result else 0.0
    
    # Calculate payouts
    payout_pipeline = [
        {'$match': {'status': 'approved'}},
        {'$group': {'_id': None, 'total': {'$sum': '$amount'}}}
    ]
    payout_result = await db.withdrawals.aggregate(payout_pipeline).to_list(1)
    total_payouts = payout_result[0]['total'] if payout_result else 0.0
    
    # Net profit
    net_profit = total_revenue - total_payouts
    
    return DashboardStats(
        total_users=total_users,
        total_ads=total_ads,
        active_ads=active_ads,
        pending_ads=pending_ads,
        total_withdrawals=total_withdrawals,
        pending_withdrawals=pending_withdrawals,
        approved_withdrawals=approved_withdrawals,
        total_revenue=total_revenue,
        total_payouts=total_payouts,
        net_profit=net_profit
    )

@router.get('/withdrawals/pending')
async def get_pending_withdrawals(admin = Depends(verify_admin)):
    """
    Get all pending withdrawal requests
    """
    db = get_db()
    
    withdrawals = await db.withdrawals.find(
        {'status': 'pending'},
        {'_id': 0}  # Exclude MongoDB _id
    ).sort('created_at', -1).to_list(100)
    
    # Get user info for each withdrawal
    for withdrawal in withdrawals:
        user = await db.users.find_one({'id': withdrawal['user_id']}, {'_id': 0})
        if user:
            withdrawal['user_name'] = user['name']
            withdrawal['user_email'] = user['email']
    
    return {'withdrawals': withdrawals}

@router.put('/withdrawals/{withdrawal_id}/approve')
async def approve_withdrawal(
    withdrawal_id: str,
    admin = Depends(verify_admin)
):
    """
    Approve withdrawal request
    """
    db = get_db()
    
    # Get withdrawal first
    withdrawal = await db.withdrawals.find_one({'id': withdrawal_id})
    if not withdrawal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Withdrawal not found'
        )
    
    result = await db.withdrawals.update_one(
        {'id': withdrawal_id},
        {'$set': {
            'status': 'approved',
            'processed_at': datetime.utcnow(),
            'processed_by': admin['email']
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Withdrawal not found'
        )
    
    # Send notification to user
    from routes.notification_routes import send_notification_to_user
    await send_notification_to_user(
        db=db,
        user_id=withdrawal['user_id'],
        title='✅ تمت الموافقة على طلب السحب',
        body=f'تمت الموافقة على طلب السحب الخاص بك بقيمة ${withdrawal.get("amount", 0):.2f}',
        notification_type='withdrawal_approved',
        data={'withdrawal_id': withdrawal_id, 'amount': withdrawal.get('amount', 0)}
    )
    
    # Send email notification
    import asyncio
    async def send_withdrawal_email():
        try:
            from services.email_service import send_withdrawal_notification, get_email_settings
            settings = await get_email_settings()
            if settings and settings.get('email_enabled') and settings.get('send_withdrawal_notifications'):
                user = await db.users.find_one({'$or': [{'id': withdrawal['user_id']}, {'user_id': withdrawal['user_id']}]}, {'_id': 0})
                if user:
                    await send_withdrawal_notification(
                        user['email'],
                        user.get('name', 'مستخدم'),
                        withdrawal.get('amount', 0),
                        withdrawal.get('method', 'PayPal'),
                        'approved',
                        '',
                        'ar'
                    )
        except Exception as e:
            print(f"Failed to send withdrawal email: {e}")
    
    asyncio.create_task(send_withdrawal_email())
    
    return {'success': True, 'message': 'تمت الموافقة على طلب السحب'}

@router.put('/withdrawals/{withdrawal_id}/reject')
async def reject_withdrawal(
    withdrawal_id: str,
    data: dict,
    admin = Depends(verify_admin)
):
    """
    Reject withdrawal request
    """
    db = get_db()
    
    # Get withdrawal
    withdrawal = await db.withdrawals.find_one({'id': withdrawal_id})
    if not withdrawal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Withdrawal not found'
        )
    
    # Return points to user
    await db.users.update_one(
        {'id': withdrawal['user_id']},
        {'$inc': {'points': withdrawal['points']}}
    )
    
    # Update withdrawal
    await db.withdrawals.update_one(
        {'id': withdrawal_id},
        {'$set': {
            'status': 'rejected',
            'processed_at': datetime.utcnow(),
            'processed_by': admin['email'],
            'admin_note': data.get('reason', '')
        }}
    )
    
    # Send notification to user
    from routes.notification_routes import send_notification_to_user
    reason = data.get('reason', 'لم يتم تحديد سبب')
    await send_notification_to_user(
        db=db,
        user_id=withdrawal['user_id'],
        title='❌ تم رفض طلب السحب',
        body=f'تم رفض طلب السحب الخاص بك. السبب: {reason}. تم إرجاع النقاط لحسابك.',
        notification_type='withdrawal_rejected',
        data={'withdrawal_id': withdrawal_id, 'reason': reason}
    )
    
    return {'success': True, 'message': 'تم رفض طلب السحب وإرجاع النقاط'}

@router.get('/ads/pending')
async def get_pending_ads(admin = Depends(verify_admin)):
    """
    Get all pending advertiser ads
    """
    db = get_db()
    
    ads = await db.advertiser_ads.find(
        {'status': 'pending'},
        {'_id': 0}  # Exclude MongoDB _id
    ).sort('created_at', -1).to_list(100)
    
    return {'ads': ads}

@router.put('/ads/{ad_id}/approve')
async def approve_ad(
    ad_id: str,
    admin = Depends(verify_admin)
):
    """
    Approve advertiser ad and make it active
    """
    db = get_db()
    
    ad = await db.advertiser_ads.find_one({'id': ad_id})
    if not ad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Ad not found'
        )
    
    # Calculate expiry date
    expires_at = datetime.utcnow() + timedelta(days=30 * ad['duration_months'])
    
    # Update ad
    await db.advertiser_ads.update_one(
        {'id': ad_id},
        {'$set': {
            'status': 'active',
            'is_active': True,
            'approved_at': datetime.utcnow(),
            'expires_at': expires_at,
            'payment_status': 'paid'
        }}
    )
    
    # Add to main ads collection with website_url
    main_ad = {
        'id': ad_id,
        'title': ad['title'],
        'description': ad['description'],
        'video_url': ad['video_url'],
        'thumbnail_url': ad.get('thumbnail_url', ''),
        'website_url': ad.get('website_url', ''),
        'advertiser': ad['advertiser_name'],
        'duration': ad['duration'],
        'points_per_minute': 1,
        'is_active': True,
        'created_at': datetime.utcnow()
    }
    
    await db.ads.insert_one(main_ad)
    
    # Send notification to all users about new ad
    from routes.notification_routes import send_notification_to_all_users
    await send_notification_to_all_users(
        db=db,
        title='🎬 إعلان جديد متاح!',
        body=f'شاهد "{ad["title"]}" الآن واكسب النقاط!',
        notification_type='new_ad',
        data={'ad_id': ad_id, 'title': ad['title']}
    )
    
    return {'success': True, 'message': 'تمت الموافقة على الإعلان وتفعيله'}

@router.put('/ads/{ad_id}/reject')
async def reject_ad(
    ad_id: str,
    data: dict,
    admin = Depends(verify_admin)
):
    """
    Reject advertiser ad
    """
    db = get_db()
    
    await db.advertiser_ads.update_one(
        {'id': ad_id},
        {'$set': {
            'status': 'rejected',
            'admin_note': data.get('reason', ''),
            'payment_status': 'refund_pending'
        }}
    )
    
    return {'success': True, 'message': 'تم رفض الإعلان'}