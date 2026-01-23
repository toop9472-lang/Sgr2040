"""
Withdrawal Methods Routes - PayPal, STC Pay, Bank Transfer
"""
from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from auth.dependencies import get_current_user_id
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
import os
import uuid

router = APIRouter(prefix='/withdrawal-methods', tags=['Withdrawal Methods'])


def get_db():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]


class PayPalWithdrawal(BaseModel):
    paypal_email: EmailStr
    amount_usd: float


class STCPayWithdrawal(BaseModel):
    phone_number: str  # Must start with 05
    amount_sar: float


class BankWithdrawal(BaseModel):
    bank_name: str
    account_holder: str
    iban: str
    amount_sar: float


# === Withdrawal Methods ===

@router.post('/paypal/request', response_model=dict)
async def request_paypal_withdrawal(
    data: PayPalWithdrawal,
    user_id: str = Depends(get_current_user_id)
):
    """
    Request PayPal withdrawal
    Rate: 500 points = $1 USD
    """
    db = get_db()
    
    # Get user
    user = await db.users.find_one({
        '$or': [{'id': user_id}, {'user_id': user_id}]
    })
    
    if not user:
        raise HTTPException(status_code=404, detail='المستخدم غير موجود')
    
    # Calculate required points
    points_required = int(data.amount_usd * 500)
    
    if user.get('points', 0) < points_required:
        raise HTTPException(
            status_code=400,
            detail=f'رصيد النقاط غير كافي. تحتاج {points_required} نقطة'
        )
    
    # Minimum withdrawal
    if data.amount_usd < 1:
        raise HTTPException(
            status_code=400,
            detail='الحد الأدنى للسحب هو $1'
        )
    
    # Deduct points
    actual_user_id = user.get('id') or user.get('user_id')
    await db.users.update_one(
        {'$or': [{'id': actual_user_id}, {'user_id': actual_user_id}]},
        {'$inc': {'points': -points_required}}
    )
    
    # Create withdrawal request
    withdrawal = {
        'id': str(uuid.uuid4()),
        'user_id': actual_user_id,
        'method': 'paypal',
        'paypal_email': data.paypal_email,
        'points': points_required,
        'amount': data.amount_usd,
        'currency': 'USD',
        'status': 'pending',
        'created_at': datetime.utcnow()
    }
    
    await db.withdrawals.insert_one(withdrawal)
    
    # Send notification
    try:
        from routes.notification_routes import send_notification_to_user
        await send_notification_to_user(
            db=db,
            user_id=actual_user_id,
            title='📤 تم استلام طلب السحب',
            body=f'طلب سحب ${data.amount_usd} عبر PayPal قيد المراجعة',
            notification_type='withdrawal_pending',
            data={'withdrawal_id': withdrawal['id'], 'method': 'paypal'}
        )
    except Exception as e:
        print(f"Notification error: {e}")
    
    return {
        'success': True,
        'withdrawal_id': withdrawal['id'],
        'message': 'تم إرسال طلب السحب وسيتم مراجعته خلال 24-48 ساعة'
    }


@router.post('/stcpay/request', response_model=dict)
async def request_stcpay_withdrawal(
    data: STCPayWithdrawal,
    user_id: str = Depends(get_current_user_id)
):
    """
    Request STC Pay withdrawal
    Rate: 500 points = 3.75 SAR (≈ $1)
    """
    db = get_db()
    
    # Validate phone number
    if not data.phone_number.startswith('05') or len(data.phone_number) != 10:
        raise HTTPException(
            status_code=400,
            detail='رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام'
        )
    
    # Get user
    user = await db.users.find_one({
        '$or': [{'id': user_id}, {'user_id': user_id}]
    })
    
    if not user:
        raise HTTPException(status_code=404, detail='المستخدم غير موجود')
    
    # Calculate required points (500 points = 3.75 SAR)
    points_required = int(data.amount_sar / 3.75 * 500)
    
    if user.get('points', 0) < points_required:
        raise HTTPException(
            status_code=400,
            detail=f'رصيد النقاط غير كافي. تحتاج {points_required} نقطة'
        )
    
    # Minimum withdrawal
    if data.amount_sar < 3.75:
        raise HTTPException(
            status_code=400,
            detail='الحد الأدنى للسحب هو 3.75 ريال'
        )
    
    # Deduct points
    actual_user_id = user.get('id') or user.get('user_id')
    await db.users.update_one(
        {'$or': [{'id': actual_user_id}, {'user_id': actual_user_id}]},
        {'$inc': {'points': -points_required}}
    )
    
    # Create withdrawal request
    withdrawal = {
        'id': str(uuid.uuid4()),
        'user_id': actual_user_id,
        'method': 'stcpay',
        'phone_number': data.phone_number,
        'points': points_required,
        'amount': data.amount_sar,
        'currency': 'SAR',
        'status': 'pending',
        'created_at': datetime.utcnow()
    }
    
    await db.withdrawals.insert_one(withdrawal)
    
    # Send notification
    try:
        from routes.notification_routes import send_notification_to_user
        await send_notification_to_user(
            db=db,
            user_id=actual_user_id,
            title='📤 تم استلام طلب السحب',
            body=f'طلب سحب {data.amount_sar} ريال عبر STC Pay قيد المراجعة',
            notification_type='withdrawal_pending',
            data={'withdrawal_id': withdrawal['id'], 'method': 'stcpay'}
        )
    except Exception as e:
        print(f"Notification error: {e}")
    
    return {
        'success': True,
        'withdrawal_id': withdrawal['id'],
        'message': 'تم إرسال طلب السحب وسيتم مراجعته خلال 24-48 ساعة'
    }


@router.post('/bank/request', response_model=dict)
async def request_bank_withdrawal(
    data: BankWithdrawal,
    user_id: str = Depends(get_current_user_id)
):
    """
    Request Bank Transfer withdrawal
    Rate: 500 points = 3.75 SAR
    """
    db = get_db()
    
    # Validate IBAN
    if not data.iban.startswith('SA') or len(data.iban) != 24:
        raise HTTPException(
            status_code=400,
            detail='رقم IBAN غير صحيح. يجب أن يبدأ بـ SA ويتكون من 24 حرف'
        )
    
    # Get user
    user = await db.users.find_one({
        '$or': [{'id': user_id}, {'user_id': user_id}]
    })
    
    if not user:
        raise HTTPException(status_code=404, detail='المستخدم غير موجود')
    
    # Calculate required points
    points_required = int(data.amount_sar / 3.75 * 500)
    
    if user.get('points', 0) < points_required:
        raise HTTPException(
            status_code=400,
            detail=f'رصيد النقاط غير كافي. تحتاج {points_required} نقطة'
        )
    
    # Minimum withdrawal (10 SAR for bank transfer)
    if data.amount_sar < 10:
        raise HTTPException(
            status_code=400,
            detail='الحد الأدنى للسحب البنكي هو 10 ريال'
        )
    
    # Deduct points
    actual_user_id = user.get('id') or user.get('user_id')
    await db.users.update_one(
        {'$or': [{'id': actual_user_id}, {'user_id': actual_user_id}]},
        {'$inc': {'points': -points_required}}
    )
    
    # Create withdrawal request
    withdrawal = {
        'id': str(uuid.uuid4()),
        'user_id': actual_user_id,
        'method': 'bank',
        'bank_name': data.bank_name,
        'account_holder': data.account_holder,
        'iban': data.iban,
        'points': points_required,
        'amount': data.amount_sar,
        'currency': 'SAR',
        'status': 'pending',
        'created_at': datetime.utcnow()
    }
    
    await db.withdrawals.insert_one(withdrawal)
    
    # Send notification
    try:
        from routes.notification_routes import send_notification_to_user
        await send_notification_to_user(
            db=db,
            user_id=actual_user_id,
            title='📤 تم استلام طلب السحب',
            body=f'طلب سحب {data.amount_sar} ريال عبر التحويل البنكي قيد المراجعة',
            notification_type='withdrawal_pending',
            data={'withdrawal_id': withdrawal['id'], 'method': 'bank'}
        )
    except Exception as e:
        print(f"Notification error: {e}")
    
    return {
        'success': True,
        'withdrawal_id': withdrawal['id'],
        'message': 'تم إرسال طلب السحب وسيتم مراجعته خلال 2-3 أيام عمل'
    }


@router.get('/rates', response_model=dict)
async def get_withdrawal_rates():
    """
    Get current withdrawal rates and minimums
    """
    return {
        'rates': {
            'points_per_usd': 500,
            'sar_per_500_points': 3.75,
            'usd_per_500_points': 1.0
        },
        'minimums': {
            'paypal': {'amount': 1, 'currency': 'USD', 'points': 500},
            'stcpay': {'amount': 3.75, 'currency': 'SAR', 'points': 500},
            'bank': {'amount': 10, 'currency': 'SAR', 'points': 1333}
        },
        'processing_time': {
            'paypal': '24-48 ساعة',
            'stcpay': '24-48 ساعة',
            'bank': '2-3 أيام عمل'
        },
        'supported_banks': [
            'الراجحي',
            'الأهلي السعودي',
            'البنك السعودي الفرنسي',
            'بنك الرياض',
            'البنك العربي الوطني',
            'بنك البلاد',
            'بنك الجزيرة',
            'بنك الإنماء'
        ]
    }


@router.get('/history', response_model=dict)
async def get_withdrawal_history(
    user_id: str = Depends(get_current_user_id),
    limit: int = 50
):
    """
    Get user's withdrawal history
    """
    db = get_db()
    
    withdrawals = await db.withdrawals.find(
        {'user_id': user_id},
        {'_id': 0}
    ).sort('created_at', -1).limit(limit).to_list(limit)
    
    # Calculate totals
    total_withdrawn = sum(
        w.get('amount', 0) for w in withdrawals 
        if w.get('status') == 'approved'
    )
    
    pending_amount = sum(
        w.get('amount', 0) for w in withdrawals 
        if w.get('status') == 'pending'
    )
    
    return {
        'withdrawals': withdrawals,
        'total_withdrawn': total_withdrawn,
        'pending_amount': pending_amount
    }
