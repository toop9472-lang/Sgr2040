"""
Script to seed initial data into MongoDB
Run this once to populate the database with sample ads
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from models.ad import Ad
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def seed_ads():
    """Seed sample advertisements into database"""
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Check if ads already exist
    existing_ads = await db.ads.count_documents({})
    if existing_ads > 0:
        print(f"✓ Database already has {existing_ads} ads. Skipping seed.")
        return
    
    # Sample ads data
    sample_ads = [
        {
            'title': 'إعلان سامسونج الجديد',
            'description': 'اكتشف هاتف سامسونج الجديد مع تقنية الذكاء الاصطناعي',
            'video_url': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            'thumbnail_url': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
            'advertiser': 'Samsung',
            'duration': 60,
            'points_per_minute': 1
        },
        {
            'title': 'عرض خاص من أمازون',
            'description': 'تخفيضات تصل إلى 50% على جميع المنتجات',
            'video_url': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            'thumbnail_url': 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=400',
            'advertiser': 'Amazon',
            'duration': 60,
            'points_per_minute': 1
        },
        {
            'title': 'مطعم الذواقة',
            'description': 'وجبات شهية وعروض حصرية لفترة محدودة',
            'video_url': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            'thumbnail_url': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
            'advertiser': 'Gourmet Restaurant',
            'duration': 60,
            'points_per_minute': 1
        }
    ]
    
    # Insert ads
    for ad_data in sample_ads:
        ad = Ad(**ad_data)
        await db.ads.insert_one(ad.dict())
        print(f"✓ Added ad: {ad.title}")
    
    print(f"\n✅ Successfully seeded {len(sample_ads)} ads into database!")
    
    client.close()

if __name__ == '__main__':
    asyncio.run(seed_ads())
