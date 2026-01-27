from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone

# Import routes
from routes.oauth_routes import router as oauth_router
from routes.auth_routes import router as auth_router
from routes.ad_routes import router as ad_router
from routes.withdrawal_routes import router as withdrawal_router
from routes.user_routes import router as user_router
from routes.advertiser_routes import router as advertiser_router
from routes.admin_auth_routes import router as admin_auth_router
from routes.admin_dashboard_routes import router as admin_dashboard_router
from routes.payment_routes import router as payment_router
from routes.tap_routes import router as tap_router
from routes.tabby_routes import router as tabby_router
from routes.tamara_routes import router as tamara_router
from routes.notification_routes import router as notification_router
from routes.invoice_routes import router as invoice_router
from routes.analytics_routes import router as analytics_router
from routes.withdrawal_methods_routes import router as withdrawal_methods_router
from routes.activity_routes import router as activity_router
from routes.payment_gateways_routes import router as payment_gateways_router
from routes.settings_routes import router as settings_router
from routes.wallet_routes import router as wallet_router
from routes.admin_users_routes import router as admin_users_router
from routes.email_routes import router as email_router
from routes.rewarded_ads_routes import router as rewarded_ads_router
from routes.points_settings_routes import router as points_settings_router
from routes.reports_routes import router as reports_router
from routes.claude_ai_routes import router as claude_ai_router
from routes.dev_requests_routes import router as dev_requests_router
from routes.security_routes import router as security_router
from routes.unity_ads_routes import router as unity_ads_router


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Add CORS middleware FIRST (before routers)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Saqr API - Welcome to the Advertising Platform"}

@api_router.get("/health")
async def health_check():
    """Health check endpoint for deployment verification"""
    try:
        # Test database connection
        await db.command("ping")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "database": db_status,
        "version": "1.0.0",
        "service": "saqr-api"
    }

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Include feature routers
api_router.include_router(oauth_router)
api_router.include_router(auth_router)
api_router.include_router(ad_router)
api_router.include_router(withdrawal_router)
api_router.include_router(user_router)
api_router.include_router(advertiser_router)
api_router.include_router(admin_auth_router)
api_router.include_router(admin_dashboard_router)
api_router.include_router(payment_router)
api_router.include_router(tap_router)
api_router.include_router(tabby_router)
api_router.include_router(tamara_router)
api_router.include_router(notification_router)
api_router.include_router(invoice_router)
api_router.include_router(analytics_router)
api_router.include_router(withdrawal_methods_router)
api_router.include_router(activity_router)
api_router.include_router(payment_gateways_router)
api_router.include_router(settings_router)
api_router.include_router(wallet_router)
api_router.include_router(admin_users_router)
api_router.include_router(email_router)
api_router.include_router(rewarded_ads_router)
api_router.include_router(points_settings_router)
api_router.include_router(reports_router)
api_router.include_router(claude_ai_router)
api_router.include_router(dev_requests_router)
api_router.include_router(security_router)
api_router.include_router(unity_ads_router)

# Include the router in the main app
app.include_router(api_router)

# ROOT LEVEL health check endpoint for Kubernetes liveness/readiness probes
@app.get("/health")
async def root_health_check():
    """Root-level health check endpoint for Kubernetes deployment"""
    try:
        # Test database connection
        await db.command("ping")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "database": db_status,
        "version": "1.0.0",
        "service": "saqr-api"
    }

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()