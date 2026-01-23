from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from motor.motor_asyncio import AsyncIOMotorClient
from models.advertiser import AdvertiserAd, AdvertiserAdCreate, AdvertiserAdResponse, AdvertiserPayment
from auth.dependencies import get_current_user_id
from typing import List, Optional
from datetime import datetime, timedelta
import os

router = APIRouter(prefix='/advertiser', tags=['Advertiser'])

AD_PRICE_SAR = 500.0  # 500 SAR per month

def get_db():
    """Get database connection"""
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]

@router.post('/ads', response_model=dict)
async def create_advertiser_ad(ad_data: AdvertiserAdCreate):
    """
    Create a new advertiser ad request
    """
    db = get_db()
    
    try:
        # Calculate total price
        total_price = AD_PRICE_SAR * ad_data.duration_months
        
        # Create ad
        ad = AdvertiserAd(
            advertiser_id=f"adv_{datetime.utcnow().timestamp()}",
            advertiser_name=ad_data.advertiser_name,
            advertiser_email=ad_data.advertiser_email,
            advertiser_phone=ad_data.advertiser_phone,
            title=ad_data.title,
            description=ad_data.description,
            video_url=ad_data.video_url,
            thumbnail_url=ad_data.thumbnail_url,
            duration=ad_data.duration,
            price=total_price,
            duration_months=ad_data.duration_months,
            status='pending',
            payment_status='pending'
        )
        
        # Save to database
        ad_dict = ad.dict()
        await db.advertiser_ads.insert_one(ad_dict)
        
        # Create payment record
        payment = AdvertiserPayment(
            advertiser_id=ad.advertiser_id,
            ad_id=ad.id,
            amount=total_price,
            status='pending'
        )
        payment_dict = payment.dict()
        await db.advertiser_payments.insert_one(payment_dict)
        
        # Update ad with payment ID
        await db.advertiser_ads.update_one(
            {'id': ad.id},
            {'$set': {'payment_id': payment.id}}
        )
        
        return {
            'success': True,
            'ad': AdvertiserAdResponse(
                id=ad.id,
                advertiser_name=ad.advertiser_name,
                title=ad.title,
                description=ad.description,
                video_url=ad.video_url,
                thumbnail_url=ad.thumbnail_url,
                duration=ad.duration,
                price=ad.price,
                duration_months=ad.duration_months,
                status=ad.status,
                payment_status=ad.payment_status,
                created_at=ad.created_at,
                expires_at=ad.expires_at
            ),
            'payment': {
                'id': payment.id,
                'amount': payment.amount,
                'currency': payment.currency,
                'status': payment.status
            },
            'message': f'تم إنشاء طلب الإعلان بنجاح! المبلغ المطلوب: {total_price} ريال'
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Failed to create ad: {str(e)}'
        )

@router.get('/ads/{ad_id}', response_model=dict)
async def get_advertiser_ad(ad_id: str):
    """
    Get advertiser ad by ID
    """
    db = get_db()
    ad = await db.advertiser_ads.find_one({'id': ad_id})
    
    if not ad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Ad not found'
        )
    
    # Get payment info
    payment = await db.advertiser_payments.find_one({'ad_id': ad_id})
    
    return {
        'ad': AdvertiserAdResponse(
            id=ad['id'],
            advertiser_name=ad['advertiser_name'],
            title=ad['title'],
            description=ad['description'],
            video_url=ad['video_url'],
            thumbnail_url=ad.get('thumbnail_url'),
            duration=ad['duration'],
            price=ad['price'],
            duration_months=ad['duration_months'],
            status=ad['status'],
            payment_status=ad['payment_status'],
            created_at=ad['created_at'],
            expires_at=ad.get('expires_at')
        ),
        'payment': {
            'id': payment['id'],
            'amount': payment['amount'],
            'currency': payment['currency'],
            'status': payment['status']
        } if payment else None
    }

@router.post('/ads/{ad_id}/payment', response_model=dict)
async def submit_payment_proof(ad_id: str, data: dict):
    """
    Submit payment proof for advertiser ad
    """
    db = get_db()
    
    # Check if ad exists
    ad = await db.advertiser_ads.find_one({'id': ad_id})
    if not ad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Ad not found'
        )
    
    payment_method = data.get('payment_method')
    payment_proof = data.get('payment_proof')  # URL or reference
    
    # Update payment
    await db.advertiser_payments.update_one(
        {'ad_id': ad_id},
        {'$set': {
            'payment_method': payment_method,
            'payment_proof': payment_proof,
            'status': 'pending'
        }}
    )
    
    # Update ad
    await db.advertiser_ads.update_one(
        {'id': ad_id},
        {'$set': {'payment_status': 'pending'}}
    )
    
    return {
        'success': True,
        'message': 'تم إرسال إثبات الدفع بنجاح! سيتم مراجعته من قبل الإدارة'
    }

@router.get('/pricing', response_model=dict)
async def get_pricing():
    """
    Get advertiser pricing information
    """
    return {
        'price_per_month': AD_PRICE_SAR,
        'currency': 'SAR',
        'features': [
            'عرض إعلانك لجميع المستخدمين',
            'إحصائيات مشاهدة مفصلة',
            'مدة شهر كامل',
            'دعم فني كامل'
        ],
        'payment_methods': [
            {'id': 'bank', 'name': 'تحويل بنكي', 'icon': '🏦'},
            {'id': 'stcpay', 'name': 'STC Pay', 'icon': '📱'},
            {'id': 'cash', 'name': 'نقدي', 'icon': '💵'}
        ]
    }