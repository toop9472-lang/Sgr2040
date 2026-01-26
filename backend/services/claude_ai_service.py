"""
Claude Haiku 4.5 AI Service
Integration with Anthropic's Claude Haiku model
"""

import os
import json
from typing import Optional, Dict, Any
import litellm
from litellm import completion


class ClaudeHaikuService:
    """Service for Claude Haiku 4.5 AI interactions"""
    
    def __init__(self):
        self.model_name = "claude-haiku-4.5"
        self.api_provider = "anthropic"
        self.api_key = os.environ.get('ANTHROPIC_API_KEY', '')
        self.max_tokens = int(os.environ.get('CLAUDE_MAX_TOKENS', '1024'))
        
        # Configure litellm
        if self.api_key:
            litellm.api_key = self.api_key
    
    def is_configured(self) -> bool:
        """Check if Claude Haiku is properly configured"""
        return bool(self.api_key)
    
    async def generate_response(
        self, 
        prompt: str, 
        system_message: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """
        Generate response using Claude Haiku 4.5
        
        Args:
            prompt: User message/prompt
            system_message: System instructions for the model
            max_tokens: Maximum tokens in response
            temperature: Model temperature (0-1)
        
        Returns:
            Dict with response and metadata
        """
        if not self.is_configured():
            return {
                'success': False,
                'error': 'Claude Haiku API key is not configured'
            }
        
        try:
            messages = []
            if system_message:
                messages.append({
                    "role": "system",
                    "content": system_message
                })
            
            messages.append({
                "role": "user",
                "content": prompt
            })
            
            response = completion(
                model=f"{self.api_provider}/{self.model_name}",
                messages=messages,
                max_tokens=max_tokens or self.max_tokens,
                temperature=temperature,
                api_key=self.api_key
            )
            
            return {
                'success': True,
                'response': response.choices[0].message.content,
                'model': self.model_name,
                'provider': self.api_provider,
                'usage': {
                    'prompt_tokens': response.usage.prompt_tokens if hasattr(response, 'usage') else 0,
                    'completion_tokens': response.usage.completion_tokens if hasattr(response, 'usage') else 0
                }
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': f'Error calling Claude Haiku API: {str(e)}'
            }
    
    async def generate_summary(self, text: str, language: str = 'ar') -> Dict[str, Any]:
        """Generate a summary of the given text"""
        system_msg = f"أنت مساعد ذكي متخصص في تلخيص النصوص. أرجع التلخيص باللغة {language}."
        prompt = f"اختصر النص التالي:\n\n{text}"
        
        return await self.generate_response(
            prompt=prompt,
            system_message=system_msg,
            temperature=0.5
        )
    
    async def translate_text(self, text: str, target_language: str = 'en') -> Dict[str, Any]:
        """Translate text to target language"""
        system_msg = f"أنت مترجم متقن. ترجم النص إلى اللغة {target_language} فقط."
        prompt = f"ترجم النص التالي:\n\n{text}"
        
        return await self.generate_response(
            prompt=prompt,
            system_message=system_msg,
            temperature=0.3
        )
    
    async def analyze_content(self, content: str) -> Dict[str, Any]:
        """Analyze content for relevance and safety"""
        system_msg = "أنت محلل محتوى متخصص. حلل المحتوى وقيم أمانه ورفاهيته."
        prompt = f"""
        حلل المحتوى التالي وقدم التقييم:
        1. درجة الأمان (آمن/غير آمن)
        2. ملاءمة المحتوى
        3. ملاحظات إضافية
        
        المحتوى:
        {content}
        """
        
        return await self.generate_response(
            prompt=prompt,
            system_message=system_msg,
            temperature=0.4
        )


# Singleton instance
_claude_service_instance = None


def get_claude_service() -> ClaudeHaikuService:
    """Get or create Claude Haiku service instance"""
    global _claude_service_instance
    if _claude_service_instance is None:
        _claude_service_instance = ClaudeHaikuService()
    return _claude_service_instance
