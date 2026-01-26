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
    Approve withdrawal request (without processing payout)
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


@router.put('/withdrawals/{withdrawal_id}/process-payout')
async def process_withdrawal_payout(
    withdrawal_id: str,
    admin = Depends(verify_admin)
):
    """
    Process actual payout for approved withdrawal
    Sends money via PayPal, STC Pay, or generates bank transfer instructions
    """
    from services.payout_service import process_withdrawal_payout
    
    db = get_db()
    
    # Get withdrawal
    withdrawal = await db.withdrawals.find_one({'id': withdrawal_id})
    if not withdrawal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Withdrawal not found'
        )
    
    if withdrawal.get('status') != 'approved':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='يجب الموافقة على طلب السحب أولاً قبل معالجة الدفع'
        )
    
    if withdrawal.get('payout_status') == 'completed':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='تم معالجة هذا السحب مسبقاً'
        )
    
    # Get payment gateway settings
    settings = await db.settings.find_one({'type': 'payment_gateways'}, {'_id': 0})
    
    # Process payout
    result = await process_withdrawal_payout(withdrawal, settings)
    
    if result.get('success'):
        # Update withdrawal with payout info
        await db.withdrawals.update_one(
            {'id': withdrawal_id},
            {'$set': {
                'payout_status': 'completed',
                'payout_batch_id': result.get('payout_batch_id'),
                'payout_processed_at': datetime.utcnow(),
                'payout_details': result
            }}
        )
        
        # Send notification to user
        from routes.notification_routes import send_notification_to_user
        await send_notification_to_user(
            db=db,
            user_id=withdrawal['user_id'],
            title='💰 تم إرسال أموالك!',
            body=f'تم تحويل {withdrawal.get("amount", 0):.2f} {withdrawal.get("currency", "USD")} إلى حسابك',
            notification_type='payout_sent',
            data={'withdrawal_id': withdrawal_id, 'amount': withdrawal.get('amount', 0)}
        )
        
        return {
            'success': True,
            'message': 'تم إرسال الأموال بنجاح',
            'payout_batch_id': result.get('payout_batch_id'),
            'details': result
        }
    
    elif result.get('requires_manual'):
        # Mark as requiring manual processing
        await db.withdrawals.update_one(
            {'id': withdrawal_id},
            {'$set': {
                'payout_status': 'manual_required',
                'payout_instructions': result.get('instructions') or result.get('details'),
                'payout_message': result.get('message')
            }}
        )
        
        return {
            'success': False,
            'requires_manual': True,
            'message': result.get('message', 'يتطلب معالجة يدوية'),
            'instructions': result.get('instructions') or result.get('details')
        }
    
    else:
        # Payout failed
        await db.withdrawals.update_one(
            {'id': withdrawal_id},
            {'$set': {
                'payout_status': 'failed',
                'payout_error': result.get('error')
            }}
        )
        
        return {
            'success': False,
            'message': 'فشل في إرسال الدفع',
            'error': result.get('error')
        }


@router.put('/withdrawals/{withdrawal_id}/mark-paid')
async def mark_withdrawal_paid(
    withdrawal_id: str,
    data: dict,
    admin = Depends(verify_admin)
):
    """
    Manually mark withdrawal as paid (for manual bank transfers, etc.)
    """
    db = get_db()
    
    withdrawal = await db.withdrawals.find_one({'id': withdrawal_id})
    if not withdrawal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Withdrawal not found'
        )
    
    # Update withdrawal
    await db.withdrawals.update_one(
        {'id': withdrawal_id},
        {'$set': {
            'payout_status': 'completed',
            'payout_processed_at': datetime.utcnow(),
            'payout_reference': data.get('reference', ''),
            'payout_note': data.get('note', ''),
            'manually_marked_by': admin['email']
        }}
    )
    
    # Send notification to user
    from routes.notification_routes import send_notification_to_user
    await send_notification_to_user(
        db=db,
        user_id=withdrawal['user_id'],
        title='💰 تم إرسال أموالك!',
        body=f'تم تحويل {withdrawal.get("amount", 0):.2f} {withdrawal.get("currency", "USD")} إلى حسابك',
        notification_type='payout_sent',
        data={'withdrawal_id': withdrawal_id}
    )
    
    return {'success': True, 'message': 'تم تحديث حالة السحب كمدفوع'}

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
    
    # Send email notification
    import asyncio
    async def send_rejection_email():
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
                        'rejected',
                        reason,
                        'ar'
                    )
        except Exception as e:
            print(f"Failed to send rejection email: {e}")
    
    asyncio.create_task(send_rejection_email())
    
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
    
    # Send email to advertiser
    import asyncio
    async def send_ad_approval_email():
        try:
            from services.email_service import send_ad_notification, get_email_settings
            settings = await get_email_settings()
            if settings and settings.get('email_enabled') and settings.get('send_ad_notifications'):
                await send_ad_notification(
                    ad.get('advertiser_email', ''),
                    ad.get('advertiser_name', 'معلن'),
                    ad.get('title', ''),
                    'approved',
                    '',
                    'ar'
                )
        except Exception as e:
            print(f"Failed to send ad approval email: {e}")
    
    if ad.get('advertiser_email'):
        asyncio.create_task(send_ad_approval_email())
    
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
    
    # Send email to advertiser
    ad = await db.advertiser_ads.find_one({'id': ad_id}, {'_id': 0})
    if ad and ad.get('advertiser_email'):
        import asyncio
        async def send_ad_rejection_email():
            try:
                from services.email_service import send_ad_notification, get_email_settings
                settings = await get_email_settings()
                if settings and settings.get('email_enabled') and settings.get('send_ad_notifications'):
                    await send_ad_notification(
                        ad.get('advertiser_email', ''),
                        ad.get('advertiser_name', 'معلن'),
                        ad.get('title', ''),
                        'rejected',
                        data.get('reason', ''),
                        'ar'
                    )
            except Exception as e:
                print(f"Failed to send ad rejection email: {e}")
        
        asyncio.create_task(send_ad_rejection_email())
    
    return {'success': True, 'message': 'تم رفض الإعلان'}


@router.delete('/ads/{ad_id}')
async def delete_ad(
    ad_id: str,
    admin = Depends(verify_admin)
):
    """
    Delete an ad completely (from both collections)
    """
    db = get_db()
    
    # Delete from advertiser_ads
    result1 = await db.advertiser_ads.delete_one({'id': ad_id})
    
    # Delete from main ads collection
    result2 = await db.ads.delete_one({'id': ad_id})
    
    if result1.deleted_count == 0 and result2.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='الإعلان غير موجود'
        )
    
    return {'success': True, 'message': 'تم حذف الإعلان نهائياً'}


@router.get('/ads/all')
async def get_all_ads(admin = Depends(verify_admin)):
    """
    Get all ads (active, pending, rejected)
    """
    db = get_db()
    
    # Get from main ads collection
    main_ads = await db.ads.find({}, {'_id': 0}).sort('created_at', -1).to_list(500)
    
    # Get from advertiser_ads
    advertiser_ads = await db.advertiser_ads.find({}, {'_id': 0}).sort('created_at', -1).to_list(500)
    
    return {
        'main_ads': main_ads,
        'advertiser_ads': advertiser_ads,
        'total_main': len(main_ads),
        'total_advertiser': len(advertiser_ads)
    }


@router.put('/ads/{ad_id}/deactivate')
async def deactivate_ad(
    ad_id: str,
    admin = Depends(verify_admin)
):
    """
    Deactivate an ad without deleting it
    """
    db = get_db()
    
    # Update in both collections
    await db.ads.update_one({'id': ad_id}, {'$set': {'is_active': False}})
    await db.advertiser_ads.update_one({'id': ad_id}, {'$set': {'status': 'inactive', 'is_active': False}})
    
    return {'success': True, 'message': 'تم إيقاف الإعلان'}


@router.put('/ads/{ad_id}/activate')
async def activate_ad(
    ad_id: str,
    admin = Depends(verify_admin)
):
    """
    Activate a deactivated ad
    """
    db = get_db()
    
    # Update in both collections
    await db.ads.update_one({'id': ad_id}, {'$set': {'is_active': True}})
    await db.advertiser_ads.update_one({'id': ad_id}, {'$set': {'status': 'active', 'is_active': True}})
    
    return {'success': True, 'message': 'تم تفعيل الإعلان'}


# AI Auto-Approval Settings
@router.get('/ai-approval/settings')
async def get_ai_approval_settings(admin = Depends(verify_admin)):
    """
    Get AI auto-approval settings
    """
    db = get_db()
    settings = await db.settings.find_one({'type': 'ai_approval'}, {'_id': 0})
    
    if not settings:
        return {
            'enabled': False,
            'auto_approve_paid': True,
            'content_check': True,
            'require_video': True,
            'min_duration': 15,
            'max_duration': 300
        }
    
    return settings


@router.put('/ai-approval/settings')
async def update_ai_approval_settings(
    data: dict,
    admin = Depends(verify_admin)
):
    """
    Update AI auto-approval settings
    """
    db = get_db()
    
    update_data = {
        'type': 'ai_approval',
        'enabled': data.get('enabled', False),
        'auto_approve_paid': data.get('auto_approve_paid', True),
        'content_check': data.get('content_check', True),
        'require_video': data.get('require_video', True),
        'min_duration': data.get('min_duration', 15),
        'max_duration': data.get('max_duration', 300),
        'updated_at': datetime.utcnow()
    }
    
    await db.settings.update_one(
        {'type': 'ai_approval'},
        {'$set': update_data},
        upsert=True
    )
    
    return {'success': True, 'message': 'تم تحديث إعدادات الموافقة التلقائية'}


@router.post('/ai-approval/process/{ad_id}')
async def ai_process_ad(
    ad_id: str,
    admin = Depends(verify_admin)
):
    """
    Process ad with AI for auto-approval
    """
    db = get_db()
    
    # Get AI settings
    settings = await db.settings.find_one({'type': 'ai_approval'}, {'_id': 0})
    if not settings or not settings.get('enabled'):
        return {'success': False, 'message': 'الموافقة التلقائية معطلة'}
    
    # Get ad
    ad = await db.advertiser_ads.find_one({'id': ad_id}, {'_id': 0})
    if not ad:
        raise HTTPException(status_code=404, detail='الإعلان غير موجود')
    
    # Validate ad
    issues = []
    
    # Check video URL
    if settings.get('require_video') and not ad.get('video_url'):
        issues.append('الإعلان لا يحتوي على فيديو')
    
    # Check duration
    duration = ad.get('duration', 0)
    if duration < settings.get('min_duration', 15):
        issues.append(f'مدة الإعلان قصيرة جداً (الحد الأدنى: {settings.get("min_duration")} ثانية)')
    if duration > settings.get('max_duration', 300):
        issues.append(f'مدة الإعلان طويلة جداً (الحد الأقصى: {settings.get("max_duration")} ثانية)')
    
    # Check payment if required
    if settings.get('auto_approve_paid') and ad.get('payment_status') != 'paid':
        issues.append('لم يتم دفع رسوم الإعلان بعد')
    
    # Check basic content
    if not ad.get('title') or len(ad.get('title', '')) < 3:
        issues.append('عنوان الإعلان قصير جداً')
    if not ad.get('description') or len(ad.get('description', '')) < 10:
        issues.append('وصف الإعلان قصير جداً')
    
    # If no issues, auto-approve
    if not issues:
        # Calculate expiry date
        expires_at = datetime.utcnow() + timedelta(days=30 * ad.get('duration_months', 1))
        
        # Update ad
        await db.advertiser_ads.update_one(
            {'id': ad_id},
            {'$set': {
                'status': 'active',
                'is_active': True,
                'approved_at': datetime.utcnow(),
                'expires_at': expires_at,
                'payment_status': 'paid',
                'auto_approved': True,
                'approved_by': 'AI'
            }}
        )
        
        # Add to main ads collection
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
            'auto_approved': True,
            'created_at': datetime.utcnow()
        }
        
        await db.ads.insert_one(main_ad)
        
        return {
            'success': True,
            'approved': True,
            'message': 'تمت الموافقة على الإعلان تلقائياً بواسطة الذكاء الاصطناعي'
        }
    else:
        return {
            'success': True,
            'approved': False,
            'issues': issues,
            'message': 'لم يتم الموافقة على الإعلان للأسباب التالية'
        }