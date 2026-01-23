from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from models.withdrawal import Withdrawal, WithdrawalCreate, WithdrawalResponse
from auth.dependencies import get_current_user_id
from typing import List
from datetime import datetime
import os

router = APIRouter(prefix='/withdrawals', tags=['Withdrawals'])

def get_db():
    """Get database connection"""
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]

@router.get('', response_model=List[WithdrawalResponse])
async def get_user_withdrawals(user_id: str = Depends(get_current_user_id)):
    """
    Get all withdrawal requests for current user
    """
    db = get_db()
    withdrawals = await db.withdrawals.find({'user_id': user_id}).sort('created_at', -1).to_list(100)
    
    return [
        WithdrawalResponse(
            id=w['id'],
            user_id=w['user_id'],
            amount=w['amount'],
            points=w['points'],
            method=w['method'],
            method_name=w['method_name'],
            details=w['details'],
            status=w['status'],
            created_at=w['created_at']
        )
        for w in withdrawals
    ]

@router.post('', response_model=dict)
async def create_withdrawal(
    withdrawal_data: WithdrawalCreate,
    user_id: str = Depends(get_current_user_id)
):
    """
    Create withdrawal request
    """
    db = get_db()
    
    # Get user
    user = await db.users.find_one({'id': user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='User not found'
        )
    
    # Calculate points needed (500 points = $1)
    points_needed = int(withdrawal_data.amount * 500)
    
    # Check if user has enough points
    if user['points'] < points_needed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Insufficient points. You need {points_needed} points but only have {user["points"]}'
        )
    
    # Check minimum amount
    if withdrawal_data.amount < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Minimum withdrawal amount is $1 (500 points)'
        )
    
    # Create withdrawal
    withdrawal = Withdrawal(
        user_id=user_id,
        amount=withdrawal_data.amount,
        points=points_needed,
        method=withdrawal_data.method,
        method_name=withdrawal_data.method_name,
        details=withdrawal_data.details,
        status='pending'
    )
    
    # Save to database
    withdrawal_dict = withdrawal.dict()
    await db.withdrawals.insert_one(withdrawal_dict)
    
    # Deduct points from user (reserved for withdrawal)
    await db.users.update_one(
        {'id': user_id},
        {
            '$inc': {'points': -points_needed},
            '$set': {'updated_at': datetime.utcnow()}
        }
    )
    
    return {
        'success': True,
        'withdrawal': WithdrawalResponse(
            id=withdrawal.id,
            user_id=withdrawal.user_id,
            amount=withdrawal.amount,
            points=withdrawal.points,
            method=withdrawal.method,
            method_name=withdrawal.method_name,
            details=withdrawal.details,
            status=withdrawal.status,
            created_at=withdrawal.created_at
        ),
        'message': 'Withdrawal request submitted successfully. Awaiting admin approval.'
    }

@router.get('/{withdrawal_id}', response_model=WithdrawalResponse)
async def get_withdrawal(
    withdrawal_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get specific withdrawal by ID
    """
    db = get_db()
    withdrawal = await db.withdrawals.find_one({
        'id': withdrawal_id,
        'user_id': user_id
    })
    
    if not withdrawal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Withdrawal not found'
        )
    
    return WithdrawalResponse(
        id=withdrawal['id'],
        user_id=withdrawal['user_id'],
        amount=withdrawal['amount'],
        points=withdrawal['points'],
        method=withdrawal['method'],
        method_name=withdrawal['method_name'],
        details=withdrawal['details'],
        status=withdrawal['status'],
        created_at=withdrawal['created_at']
    )