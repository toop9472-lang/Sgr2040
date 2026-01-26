"""
Claude Haiku 4.5 AI Routes
Endpoints for Claude AI interactions
"""

from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import Optional
from auth.dependencies import get_current_user_id
import os

router = APIRouter(prefix='/claude-ai', tags=['Claude AI'])


def get_db():
    """Get database connection"""
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]


class TextPrompt(BaseModel):
    """Text prompt for Claude AI"""
    prompt: str
    system_message: Optional[str] = None
    max_tokens: Optional[int] = 1024
    temperature: Optional[float] = 0.7


class SummaryRequest(BaseModel):
    """Request to summarize text"""
    text: str
    language: Optional[str] = 'ar'


class TranslationRequest(BaseModel):
    """Request to translate text"""
    text: str
    target_language: Optional[str] = 'en'


class ContentAnalysisRequest(BaseModel):
    """Request to analyze content"""
    content: str


async def verify_ai_enabled(db) -> bool:
    """Verify Claude AI is enabled"""
    settings = await db.settings.find_one({'type': 'ai_models'}, {'_id': 0})
    if not settings:
        return False
    return settings.get('claude_haiku_enabled', False)


@router.post('/generate-response')
async def generate_ai_response(
    request: TextPrompt,
    user_id: str = Depends(get_current_user_id)
):
    """Generate response using Claude Haiku 4.5"""
    from services.claude_ai_service import get_claude_service
    
    db = get_db()
    
    # Check if AI is enabled
    if not await verify_ai_enabled(db):
        raise HTTPException(
            status_code=403,
            detail='Claude Haiku AI is not enabled'
        )
    
    # Check if user is authorized to use AI
    settings = await db.settings.find_one({'type': 'ai_models'}, {'_id': 0})
    if not settings.get('claude_haiku_enabled_for_all_clients'):
        # Only admins can use if not enabled for all
        admin = await db.admins.find_one({'id': user_id}, {'_id': 0})
        if not admin:
            raise HTTPException(
                status_code=403,
                detail='Access denied: Claude AI is not available for your account'
            )
    
    claude_service = get_claude_service()
    result = await claude_service.generate_response(
        prompt=request.prompt,
        system_message=request.system_message,
        max_tokens=request.max_tokens,
        temperature=request.temperature
    )
    
    return result


@router.post('/summarize')
async def summarize_text(
    request: SummaryRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Summarize text using Claude Haiku 4.5"""
    from services.claude_ai_service import get_claude_service
    
    db = get_db()
    
    # Check if AI is enabled
    if not await verify_ai_enabled(db):
        raise HTTPException(
            status_code=403,
            detail='Claude Haiku AI is not enabled'
        )
    
    claude_service = get_claude_service()
    result = await claude_service.generate_summary(
        text=request.text,
        language=request.language
    )
    
    return result


@router.post('/translate')
async def translate_text(
    request: TranslationRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Translate text using Claude Haiku 4.5"""
    from services.claude_ai_service import get_claude_service
    
    db = get_db()
    
    # Check if AI is enabled
    if not await verify_ai_enabled(db):
        raise HTTPException(
            status_code=403,
            detail='Claude Haiku AI is not enabled'
        )
    
    claude_service = get_claude_service()
    result = await claude_service.translate_text(
        text=request.text,
        target_language=request.target_language
    )
    
    return result


@router.post('/analyze-content')
async def analyze_content(
    request: ContentAnalysisRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Analyze content using Claude Haiku 4.5"""
    from services.claude_ai_service import get_claude_service
    
    db = get_db()
    
    # Check if AI is enabled
    if not await verify_ai_enabled(db):
        raise HTTPException(
            status_code=403,
            detail='Claude Haiku AI is not enabled'
        )
    
    # Only admins can analyze content
    admin = await db.admins.find_one({'id': user_id}, {'_id': 0})
    if not admin:
        raise HTTPException(
            status_code=403,
            detail='Only admins can analyze content'
        )
    
    claude_service = get_claude_service()
    result = await claude_service.analyze_content(content=request.content)
    
    return result


@router.get('/status')
async def get_claude_status(user_id: str = Depends(get_current_user_id)):
    """Get Claude AI status and availability"""
    from services.claude_ai_service import get_claude_service
    
    db = get_db()
    claude_service = get_claude_service()
    
    # Get AI settings
    settings = await db.settings.find_one({'type': 'ai_models'}, {'_id': 0})
    
    if not settings:
        return {
            'enabled': False,
            'enabled_for_all': False,
            'status': 'disabled',
            'message': 'Claude Haiku AI is not configured'
        }
    
    return {
        'enabled': settings.get('claude_haiku_enabled', False),
        'enabled_for_all': settings.get('claude_haiku_enabled_for_all_clients', False),
        'status': 'active' if settings.get('claude_haiku_enabled') else 'disabled',
        'model': settings.get('model_name', 'claude-haiku-4.5'),
        'provider': settings.get('api_provider', 'anthropic'),
        'configured': claude_service.is_configured(),
        'message': 'Claude Haiku 4.5 is active' if claude_service.is_configured() else 'API key is not configured'
    }
