"""
AI-Powered Anti-Fraud System for Saqr App
Detects suspicious activities and prevents cheating
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from auth.dependencies import get_current_user_id
import os
import uuid
import hashlib
import statistics

router = APIRouter(prefix='/security', tags=['Security & Anti-Fraud'])

def get_db():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]


# ============ MODELS ============

class FraudReport(BaseModel):
    user_id: str
    risk_score: float
    flags: List[str]
    action_taken: str
    details: dict


class UserActivity(BaseModel):
    user_id: str
    action: str
    timestamp: datetime
    ip_address: Optional[str] = None
    device_fingerprint: Optional[str] = None
    metadata: Optional[dict] = None


class SecuritySettings(BaseModel):
    # Rate limiting
    max_ads_per_minute: int = 3
    max_ads_per_hour: int = 30
    max_ads_per_day: int = 50
    
    # Timing validation
    min_watch_duration: int = 25  # seconds
    max_watch_duration: int = 120  # seconds
    
    # Device limits
    max_devices_per_account: int = 3
    
    # IP limits
    max_accounts_per_ip: int = 5
    
    # Suspicious behavior thresholds
    rapid_click_threshold: int = 10  # clicks per second
    perfect_timing_threshold: float = 0.95  # ratio
    
    # Auto-ban settings
    auto_ban_enabled: bool = True
    warning_threshold: int = 3
    ban_threshold: int = 5
    
    # Risk score thresholds
    low_risk: float = 0.3
    medium_risk: float = 0.6
    high_risk: float = 0.85


# ============ FRAUD DETECTION ENGINE ============

class FraudDetectionEngine:
    """AI-powered fraud detection system"""
    
    def __init__(self, db):
        self.db = db
        self.settings = SecuritySettings()
    
    async def analyze_user(self, user_id: str) -> FraudReport:
        """Comprehensive fraud analysis for a user"""
        flags = []
        risk_factors = []
        
        # Get user data
        user = await self.db.users.find_one({'$or': [{'id': user_id}, {'user_id': user_id}]})
        if not user:
            return FraudReport(
                user_id=user_id,
                risk_score=0,
                flags=['user_not_found'],
                action_taken='none',
                details={}
            )
        
        # 1. Check ad viewing patterns
        pattern_score, pattern_flags = await self._check_viewing_patterns(user_id)
        flags.extend(pattern_flags)
        risk_factors.append(pattern_score)
        
        # 2. Check timing anomalies
        timing_score, timing_flags = await self._check_timing_anomalies(user_id)
        flags.extend(timing_flags)
        risk_factors.append(timing_score)
        
        # 3. Check device fingerprints
        device_score, device_flags = await self._check_device_patterns(user_id)
        flags.extend(device_flags)
        risk_factors.append(device_score)
        
        # 4. Check IP patterns
        ip_score, ip_flags = await self._check_ip_patterns(user_id)
        flags.extend(ip_flags)
        risk_factors.append(ip_score)
        
        # 5. Check earning velocity
        velocity_score, velocity_flags = await self._check_earning_velocity(user_id)
        flags.extend(velocity_flags)
        risk_factors.append(velocity_score)
        
        # 6. Check session patterns
        session_score, session_flags = await self._check_session_patterns(user_id)
        flags.extend(session_flags)
        risk_factors.append(session_score)
        
        # Calculate overall risk score (weighted average)
        weights = [0.25, 0.20, 0.15, 0.15, 0.15, 0.10]
        risk_score = sum(s * w for s, w in zip(risk_factors, weights))
        
        # Determine action
        action = await self._determine_action(user_id, risk_score, flags)
        
        # Log the analysis
        await self._log_analysis(user_id, risk_score, flags, action)
        
        return FraudReport(
            user_id=user_id,
            risk_score=risk_score,
            flags=flags,
            action_taken=action,
            details={
                'pattern_score': pattern_score,
                'timing_score': timing_score,
                'device_score': device_score,
                'ip_score': ip_score,
                'velocity_score': velocity_score,
                'session_score': session_score
            }
        )
    
    async def _check_viewing_patterns(self, user_id: str) -> tuple:
        """Check for suspicious ad viewing patterns"""
        flags = []
        score = 0.0
        
        now = datetime.now(timezone.utc)
        hour_ago = now - timedelta(hours=1)
        day_ago = now - timedelta(days=1)
        
        # Count views in different time periods
        views_last_hour = await self.db.rewarded_ad_views.count_documents({
            'user_id': user_id,
            'timestamp': {'$gte': hour_ago}
        })
        
        views_last_day = await self.db.rewarded_ad_views.count_documents({
            'user_id': user_id,
            'timestamp': {'$gte': day_ago}
        })
        
        # Check rate limits
        if views_last_hour > self.settings.max_ads_per_hour:
            flags.append('excessive_hourly_views')
            score += 0.4
        
        if views_last_day > self.settings.max_ads_per_day * 1.5:
            flags.append('excessive_daily_views')
            score += 0.5
        
        # Check for suspicious timing patterns (perfect 30-second intervals)
        views = await self.db.rewarded_ad_views.find({
            'user_id': user_id,
            'timestamp': {'$gte': hour_ago}
        }).sort('timestamp', 1).to_list(100)
        
        if len(views) >= 3:
            intervals = []
            for i in range(1, len(views)):
                t1 = views[i-1].get('timestamp')
                t2 = views[i].get('timestamp')
                if t1 and t2:
                    interval = (t2 - t1).total_seconds()
                    intervals.append(interval)
            
            if intervals:
                # Check for suspiciously consistent intervals (bot behavior)
                if len(intervals) >= 3:
                    std_dev = statistics.stdev(intervals) if len(intervals) > 1 else 0
                    if std_dev < 2:  # Less than 2 seconds deviation
                        flags.append('bot_like_timing')
                        score += 0.6
        
        return min(score, 1.0), flags
    
    async def _check_timing_anomalies(self, user_id: str) -> tuple:
        """Check for timing manipulation"""
        flags = []
        score = 0.0
        
        # Get recent ad views with watch duration
        views = await self.db.rewarded_ad_views.find({
            'user_id': user_id,
            'watch_duration': {'$exists': True}
        }).sort('timestamp', -1).limit(50).to_list(50)
        
        if not views:
            return 0.0, []
        
        durations = [v.get('watch_duration', 30) for v in views]
        
        # Check for impossible durations
        invalid_durations = [d for d in durations if d < self.settings.min_watch_duration or d > self.settings.max_watch_duration]
        if invalid_durations:
            flags.append('invalid_watch_duration')
            score += 0.3 * (len(invalid_durations) / len(durations))
        
        # Check for suspiciously perfect durations (exactly 30 seconds every time)
        perfect_durations = [d for d in durations if d == 30]
        if len(perfect_durations) / len(durations) > self.settings.perfect_timing_threshold:
            flags.append('suspiciously_perfect_timing')
            score += 0.4
        
        # Check for rapid completion (faster than video length)
        fast_completions = [d for d in durations if d < 28]
        if len(fast_completions) > len(durations) * 0.3:
            flags.append('rapid_completion_pattern')
            score += 0.5
        
        return min(score, 1.0), flags
    
    async def _check_device_patterns(self, user_id: str) -> tuple:
        """Check for multiple devices or device spoofing"""
        flags = []
        score = 0.0
        
        # Get unique device fingerprints
        activities = await self.db.user_activities.find({
            'user_id': user_id,
            'device_fingerprint': {'$exists': True, '$ne': None}
        }).to_list(100)
        
        unique_devices = set(a.get('device_fingerprint') for a in activities if a.get('device_fingerprint'))
        
        if len(unique_devices) > self.settings.max_devices_per_account:
            flags.append('too_many_devices')
            score += 0.3 * (len(unique_devices) / self.settings.max_devices_per_account)
        
        # Check for device fingerprint changes within short time
        now = datetime.now(timezone.utc)
        hour_ago = now - timedelta(hours=1)
        
        recent_activities = [a for a in activities if a.get('timestamp') and a['timestamp'] > hour_ago]
        recent_devices = set(a.get('device_fingerprint') for a in recent_activities if a.get('device_fingerprint'))
        
        if len(recent_devices) > 2:
            flags.append('device_switching')
            score += 0.5
        
        return min(score, 1.0), flags
    
    async def _check_ip_patterns(self, user_id: str) -> tuple:
        """Check for IP-based fraud indicators"""
        flags = []
        score = 0.0
        
        # Get user's IP addresses
        activities = await self.db.user_activities.find({
            'user_id': user_id,
            'ip_address': {'$exists': True, '$ne': None}
        }).to_list(100)
        
        unique_ips = set(a.get('ip_address') for a in activities if a.get('ip_address'))
        
        # Check for VPN/proxy patterns (many different IPs)
        if len(unique_ips) > 10:
            flags.append('potential_vpn_usage')
            score += 0.2
        
        # Check for multiple accounts from same IP
        for ip in list(unique_ips)[:5]:
            accounts_from_ip = await self.db.user_activities.distinct('user_id', {'ip_address': ip})
            if len(accounts_from_ip) > self.settings.max_accounts_per_ip:
                flags.append('multi_account_ip')
                score += 0.4
                break
        
        return min(score, 1.0), flags
    
    async def _check_earning_velocity(self, user_id: str) -> tuple:
        """Check for abnormal earning rates"""
        flags = []
        score = 0.0
        
        user = await self.db.users.find_one({'$or': [{'id': user_id}, {'user_id': user_id}]})
        if not user:
            return 0.0, []
        
        created_at = user.get('created_at')
        if not created_at:
            return 0.0, []
        
        # Calculate account age in days
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        
        account_age_days = (datetime.now(timezone.utc) - created_at).days or 1
        
        points = user.get('points', 0)
        daily_average = points / account_age_days
        
        # Max possible per day is 250 points (50 ads * 5 points)
        if daily_average > 200:
            flags.append('abnormal_earning_rate')
            score += 0.5
        
        if daily_average > 250:
            flags.append('impossible_earning_rate')
            score += 0.8
        
        return min(score, 1.0), flags
    
    async def _check_session_patterns(self, user_id: str) -> tuple:
        """Check for suspicious session patterns"""
        flags = []
        score = 0.0
        
        # Get sessions from last 7 days
        week_ago = datetime.now(timezone.utc) - timedelta(days=7)
        
        sessions = await self.db.user_sessions.find({
            'user_id': user_id,
            'created_at': {'$gte': week_ago}
        }).to_list(100)
        
        if not sessions:
            return 0.0, []
        
        # Check for 24/7 activity (no normal sleep pattern)
        hours_active = set()
        for session in sessions:
            if session.get('created_at'):
                hours_active.add(session['created_at'].hour)
        
        if len(hours_active) == 24:
            flags.append('no_sleep_pattern')
            score += 0.3
        
        # Check for identical session lengths
        session_lengths = [s.get('duration', 0) for s in sessions if s.get('duration')]
        if session_lengths and len(set(session_lengths)) == 1:
            flags.append('identical_session_lengths')
            score += 0.4
        
        return min(score, 1.0), flags
    
    async def _determine_action(self, user_id: str, risk_score: float, flags: List[str]) -> str:
        """Determine what action to take based on risk analysis"""
        
        # Get existing warnings
        warnings = await self.db.user_warnings.count_documents({
            'user_id': user_id,
            'acknowledged': False
        })
        
        if risk_score >= self.settings.high_risk or warnings >= self.settings.ban_threshold:
            # Ban the account
            if self.settings.auto_ban_enabled:
                await self.db.users.update_one(
                    {'$or': [{'id': user_id}, {'user_id': user_id}]},
                    {'$set': {
                        'status': 'banned',
                        'ban_reason': 'Automated fraud detection',
                        'ban_date': datetime.now(timezone.utc),
                        'risk_flags': flags
                    }}
                )
                return 'account_banned'
            return 'ban_recommended'
        
        elif risk_score >= self.settings.medium_risk or warnings >= self.settings.warning_threshold:
            # Suspend temporarily
            await self.db.users.update_one(
                {'$or': [{'id': user_id}, {'user_id': user_id}]},
                {'$set': {
                    'status': 'suspended',
                    'suspension_until': datetime.now(timezone.utc) + timedelta(hours=24),
                    'risk_flags': flags
                }}
            )
            return 'account_suspended'
        
        elif risk_score >= self.settings.low_risk:
            # Issue warning
            await self.db.user_warnings.insert_one({
                'id': str(uuid.uuid4()),
                'user_id': user_id,
                'reason': 'Suspicious activity detected',
                'flags': flags,
                'risk_score': risk_score,
                'created_at': datetime.now(timezone.utc),
                'acknowledged': False
            })
            return 'warning_issued'
        
        return 'none'
    
    async def _log_analysis(self, user_id: str, risk_score: float, flags: List[str], action: str):
        """Log fraud analysis for audit purposes"""
        await self.db.fraud_logs.insert_one({
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'risk_score': risk_score,
            'flags': flags,
            'action': action,
            'timestamp': datetime.now(timezone.utc)
        })


# ============ ROUTES ============

@router.post('/validate-ad-view')
async def validate_ad_view(
    request: Request,
    user_id: str = Depends(get_current_user_id)
):
    """Validate ad view request before granting reward"""
    db = get_db()
    engine = FraudDetectionEngine(db)
    
    # Get request metadata
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get('user-agent', '')
    
    # Generate device fingerprint
    device_fingerprint = hashlib.md5(f"{client_ip}{user_agent}".encode()).hexdigest()
    
    # Log activity
    await db.user_activities.insert_one({
        'id': str(uuid.uuid4()),
        'user_id': user_id,
        'action': 'ad_view_request',
        'ip_address': client_ip,
        'device_fingerprint': device_fingerprint,
        'user_agent': user_agent,
        'timestamp': datetime.now(timezone.utc)
    })
    
    # Check if user is banned or suspended
    user = await db.users.find_one({'$or': [{'id': user_id}, {'user_id': user_id}]})
    if not user:
        raise HTTPException(status_code=404, detail='المستخدم غير موجود')
    
    status = user.get('status', 'active')
    if status == 'banned':
        raise HTTPException(status_code=403, detail='تم إيقاف حسابك بسبب نشاط مشبوه')
    
    if status == 'suspended':
        suspension_until = user.get('suspension_until')
        if suspension_until and suspension_until > datetime.now(timezone.utc):
            raise HTTPException(status_code=403, detail='حسابك موقوف مؤقتاً')
        else:
            # Lift suspension
            await db.users.update_one(
                {'$or': [{'id': user_id}, {'user_id': user_id}]},
                {'$set': {'status': 'active'}}
            )
    
    # Quick fraud checks
    settings = SecuritySettings()
    now = datetime.now(timezone.utc)
    minute_ago = now - timedelta(minutes=1)
    
    # Rate limit check
    recent_views = await db.rewarded_ad_views.count_documents({
        'user_id': user_id,
        'timestamp': {'$gte': minute_ago}
    })
    
    if recent_views >= settings.max_ads_per_minute:
        return {
            'allowed': False,
            'reason': 'rate_limited',
            'message': 'انتظر قليلاً قبل مشاهدة إعلان آخر',
            'wait_seconds': 30
        }
    
    # Generate secure token for this view
    view_token = hashlib.sha256(
        f"{user_id}{datetime.now(timezone.utc).timestamp()}{os.urandom(16).hex()}".encode()
    ).hexdigest()
    
    # Store pending view
    await db.pending_views.insert_one({
        'token': view_token,
        'user_id': user_id,
        'created_at': datetime.now(timezone.utc),
        'expires_at': datetime.now(timezone.utc) + timedelta(minutes=5),
        'ip_address': client_ip,
        'device_fingerprint': device_fingerprint,
        'validated': False
    })
    
    return {
        'allowed': True,
        'view_token': view_token,
        'expires_in': 300  # 5 minutes
    }


@router.post('/complete-ad-view')
async def complete_ad_view(
    view_token: str,
    watch_duration: int,
    request: Request,
    user_id: str = Depends(get_current_user_id)
):
    """Complete and validate ad view"""
    db = get_db()
    settings = SecuritySettings()
    
    # Get request metadata
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get('user-agent', '')
    device_fingerprint = hashlib.md5(f"{client_ip}{user_agent}".encode()).hexdigest()
    
    # Validate pending view
    pending = await db.pending_views.find_one({
        'token': view_token,
        'user_id': user_id,
        'validated': False
    })
    
    if not pending:
        return {'success': False, 'reason': 'invalid_token', 'message': 'رمز غير صالح'}
    
    if pending.get('expires_at') and pending['expires_at'] < datetime.now(timezone.utc):
        return {'success': False, 'reason': 'token_expired', 'message': 'انتهت صلاحية الرمز'}
    
    # Validate watch duration
    if watch_duration < settings.min_watch_duration:
        return {'success': False, 'reason': 'insufficient_duration', 'message': 'لم تكتمل المشاهدة'}
    
    if watch_duration > settings.max_watch_duration:
        return {'success': False, 'reason': 'invalid_duration', 'message': 'مدة غير صالحة'}
    
    # Validate device consistency
    if pending.get('device_fingerprint') != device_fingerprint:
        # Log suspicious activity
        await db.fraud_logs.insert_one({
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'type': 'device_mismatch',
            'original_device': pending.get('device_fingerprint'),
            'current_device': device_fingerprint,
            'timestamp': datetime.now(timezone.utc)
        })
        return {'success': False, 'reason': 'device_mismatch', 'message': 'خطأ في التحقق'}
    
    # Mark token as used
    await db.pending_views.update_one(
        {'token': view_token},
        {'$set': {'validated': True, 'completed_at': datetime.now(timezone.utc)}}
    )
    
    # Record the view
    view_id = str(uuid.uuid4())
    await db.rewarded_ad_views.insert_one({
        'id': view_id,
        'user_id': user_id,
        'ad_type': 'rewarded',
        'completed': True,
        'watch_duration': watch_duration,
        'points_earned': 5,
        'view_token': view_token,
        'ip_address': client_ip,
        'device_fingerprint': device_fingerprint,
        'timestamp': datetime.now(timezone.utc)
    })
    
    # Update user points
    result = await db.users.find_one_and_update(
        {'$or': [{'id': user_id}, {'user_id': user_id}]},
        {'$inc': {'points': 5, 'total_earned': 5}},
        return_document=True
    )
    
    return {
        'success': True,
        'points_earned': 5,
        'total_points': result.get('points', 0) if result else 0,
        'message': '🎉 مبروك! حصلت على 5 نقاط'
    }


@router.get('/analyze/{target_user_id}')
async def analyze_user_fraud(
    target_user_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Analyze user for fraud (admin only)"""
    db = get_db()
    
    # Verify admin
    admin = await db.admins.find_one({'$or': [{'id': user_id}, {'email': user_id}]})
    if not admin:
        raise HTTPException(status_code=403, detail='غير مصرح')
    
    engine = FraudDetectionEngine(db)
    report = await engine.analyze_user(target_user_id)
    
    return report


@router.get('/suspicious-users')
async def get_suspicious_users(
    limit: int = 50,
    user_id: str = Depends(get_current_user_id)
):
    """Get list of suspicious users (admin only)"""
    db = get_db()
    
    # Verify admin
    admin = await db.admins.find_one({'$or': [{'id': user_id}, {'email': user_id}]})
    if not admin:
        raise HTTPException(status_code=403, detail='غير مصرح')
    
    # Get users with warnings or suspicious flags
    suspicious = await db.users.find({
        '$or': [
            {'status': {'$in': ['suspended', 'banned']}},
            {'risk_flags': {'$exists': True, '$ne': []}}
        ]
    }, {'_id': 0}).limit(limit).to_list(limit)
    
    # Get warning counts
    for user in suspicious:
        user_id_field = user.get('id') or user.get('user_id')
        warnings = await db.user_warnings.count_documents({'user_id': user_id_field})
        user['warning_count'] = warnings
    
    return {'users': suspicious, 'total': len(suspicious)}


@router.post('/batch-analyze')
async def batch_analyze_users(
    user_id: str = Depends(get_current_user_id)
):
    """Analyze all users for fraud (admin only, background task)"""
    db = get_db()
    
    # Verify admin
    admin = await db.admins.find_one({'$or': [{'id': user_id}, {'email': user_id}]})
    if not admin:
        raise HTTPException(status_code=403, detail='غير مصرح')
    
    engine = FraudDetectionEngine(db)
    
    # Get all active users
    users = await db.users.find({'status': {'$ne': 'banned'}}, {'id': 1, 'user_id': 1}).to_list(1000)
    
    results = {
        'analyzed': 0,
        'warnings_issued': 0,
        'suspended': 0,
        'banned': 0
    }
    
    for user in users:
        user_id_field = user.get('id') or user.get('user_id')
        if user_id_field:
            report = await engine.analyze_user(user_id_field)
            results['analyzed'] += 1
            
            if report.action_taken == 'warning_issued':
                results['warnings_issued'] += 1
            elif report.action_taken == 'account_suspended':
                results['suspended'] += 1
            elif report.action_taken == 'account_banned':
                results['banned'] += 1
    
    return results


@router.get('/settings')
async def get_security_settings(user_id: str = Depends(get_current_user_id)):
    """Get security settings (admin only)"""
    db = get_db()
    
    # Verify admin
    admin = await db.admins.find_one({'$or': [{'id': user_id}, {'email': user_id}]})
    if not admin:
        raise HTTPException(status_code=403, detail='غير مصرح')
    
    settings = await db.settings.find_one({'type': 'security'}, {'_id': 0})
    if not settings:
        return SecuritySettings().model_dump()
    return settings


@router.put('/settings')
async def update_security_settings(
    settings: SecuritySettings,
    user_id: str = Depends(get_current_user_id)
):
    """Update security settings (admin only)"""
    db = get_db()
    
    # Verify admin
    admin = await db.admins.find_one({'$or': [{'id': user_id}, {'email': user_id}]})
    if not admin:
        raise HTTPException(status_code=403, detail='غير مصرح')
    
    update_data = settings.model_dump()
    update_data['type'] = 'security'
    update_data['updated_at'] = datetime.now(timezone.utc)
    
    await db.settings.update_one(
        {'type': 'security'},
        {'$set': update_data},
        upsert=True
    )
    
    return {'message': 'تم تحديث إعدادات الأمان'}


@router.post('/unban/{target_user_id}')
async def unban_user(
    target_user_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Unban a user (admin only)"""
    db = get_db()
    
    # Verify admin
    admin = await db.admins.find_one({'$or': [{'id': user_id}, {'email': user_id}]})
    if not admin:
        raise HTTPException(status_code=403, detail='غير مصرح')
    
    await db.users.update_one(
        {'$or': [{'id': target_user_id}, {'user_id': target_user_id}]},
        {
            '$set': {'status': 'active'},
            '$unset': {'ban_reason': '', 'ban_date': '', 'risk_flags': ''}
        }
    )
    
    # Clear warnings
    await db.user_warnings.delete_many({'user_id': target_user_id})
    
    return {'message': 'تم إلغاء الحظر'}
