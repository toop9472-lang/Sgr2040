from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

class Ad(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    video_url: str
    thumbnail_url: str
    advertiser: str
    duration: int  # seconds
    points_per_minute: int = 1
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class AdCreate(BaseModel):
    title: str
    description: str
    video_url: str
    thumbnail_url: str
    advertiser: str
    duration: int
    points_per_minute: int = 1

class AdResponse(BaseModel):
    id: str
    title: str
    description: str
    video_url: str
    thumbnail_url: str
    advertiser: str
    duration: int
    points: int

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }