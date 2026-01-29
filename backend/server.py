from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import uuid
from passlib.context import CryptContext
import jwt
import razorpay
from enum import Enum
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import secrets
import asyncio

# Setup
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Secret
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 30

# Razorpay Client
razorpay_client = None
try:
    key_id = os.environ.get('RAZORPAY_KEY_ID', '')
    key_secret = os.environ.get('RAZORPAY_KEY_SECRET', '')
    if key_id and key_secret:
        razorpay_client = razorpay.Client(auth=(key_id, key_secret))
except Exception as e:
    logging.warning(f"Razorpay client not initialized: {e}")

# Email Configuration
SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', '')
SENDER_PASSWORD = os.environ.get('SENDER_PASSWORD', '')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# --- Enums ---
class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    SCHOOL_ADMIN = "school_admin"
    ADMISSION_OFFICER = "admission_officer"
    TEACHER = "teacher"
    FINANCE_MANAGER = "finance_manager"
    INVENTORY_MANAGER = "inventory_manager"
    PARENT = "parent"
    STUDENT = "student"

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"

class Standard(str, Enum):
    PLAY_GROUP = "play_group"
    PRE_KG = "pre_kg"
    LKG = "lkg"
    UKG = "ukg"

class ApplicationStatus(str, Enum):
    ENQUIRY_NEW = "enquiry_new"
    ENQUIRY_HOT = "enquiry_hot"
    ENQUIRY_WARM = "enquiry_warm"
    ENQUIRY_COLD = "enquiry_cold"
    DOCUMENTS_PENDING = "documents_pending"
    DOCUMENTS_VERIFIED = "documents_verified"
    PAYMENT_PENDING = "payment_pending"
    ADMITTED = "admitted"
    REJECTED = "rejected"
    ON_HOLD = "on_hold"

class Source(str, Enum):
    NEWSPAPERS = "newspapers"
    SIBLING_REFERENCE = "sibling_reference"
    SOCIAL_MEDIA = "social_media"
    SCHOOL_BANNERS = "school_banners"
    FRIENDS_RELATIVES = "friends_relatives"
    OTHERS = "others"

class ParentType(str, Enum):
    FATHER = "father"
    MOTHER = "mother"
    GUARDIAN = "guardian"

class AttendanceStatus(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"
    HALF_DAY = "half_day"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    PARTIALLY_PAID = "partially_paid"
    FAILED = "failed"
    OVERDUE = "overdue"

class PaymentMode(str, Enum):
    CASH = "cash"
    UPI = "upi"
    BANK_TRANSFER = "bank_transfer"
    ONLINE = "online"

# --- Models ---
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    password_hash: str
    role: UserRole
    full_name: str
    mobile: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Application(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    reference_number: str
    branch: str = "Medavakkam, Chennai"
    student_name: str
    gender: Gender
    date_of_birth: str
    applying_for_class: Standard
    source: Source
    parent_type: ParentType
    parent_name: str
    mobile: str
    email: EmailStr
    status: ApplicationStatus = ApplicationStatus.ENQUIRY_NEW
    remarks: Optional[str] = None
    admission_number: Optional[str] = None
    roll_number: Optional[str] = None
    section: Optional[str] = None
    academic_year: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Student(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    admission_number: str
    roll_number: str
    student_name: str
    gender: Gender
    date_of_birth: str
    current_class: Standard
    section: str
    academic_year: str
    parent_id: str
    application_id: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Attendance(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    date: str
    status: AttendanceStatus
    teacher_id: str
    remarks: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DailyActivity(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    teacher_id: str
    date: str
    rhymes: Optional[str] = None
    activities: Optional[str] = None
    food_habits: Optional[str] = None
    nap_status: Optional[str] = None
    behavior_notes: Optional[str] = None
    homework: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FeeStructure(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    standard: Standard
    admission_fee: int
    tuition_fee: int
    books_fee: int = 0
    uniform_fee: int = 0
    transport_fee: int = 0
    academic_year: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FeePayment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    amount: int
    payment_mode: PaymentMode
    payment_status: PaymentStatus
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    receipt_number: Optional[str] = None
    payment_date: Optional[datetime] = None
    remarks: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    message: str
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GalleryImage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    url: str
    alt: Optional[str] = None
    order: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# --- Helper Functions ---
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def generate_tracking_token() -> str:
    """Generate a secure random token for application tracking"""
    return secrets.token_urlsafe(32)

def _send_email_sync(to_email: str, subject: str, html_body: str) -> bool:
    """Synchronous email sending function (runs in thread pool)"""
    if not SENDER_EMAIL or not SENDER_PASSWORD:
        logging.error("Email not configured. SMTP credentials missing. SENDER_EMAIL or SENDER_PASSWORD not set in .env")
        return False
    
    try:
        logging.info(f"Attempting to send email to {to_email} via {SMTP_SERVER}:{SMTP_PORT}")
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"AJ Academy <{SENDER_EMAIL}>"
        msg['To'] = to_email
        
        html_part = MIMEText(html_body, 'html')
        msg.attach(html_part)
        
        logging.info(f"Connecting to SMTP server {SMTP_SERVER}:{SMTP_PORT}")
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            logging.info("Starting TLS...")
            server.starttls()
            logging.info(f"Logging in as {SENDER_EMAIL}")
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            logging.info("Sending email message...")
            server.send_message(msg)
        
        logging.info(f"✅ Email sent successfully to {to_email}")
        return True
    except smtplib.SMTPAuthenticationError as e:
        logging.error(f"❌ SMTP Authentication failed for {SENDER_EMAIL}: {e}")
        logging.error("Please check your email and app password in .env file")
        return False
    except smtplib.SMTPException as e:
        logging.error(f"❌ SMTP error while sending email to {to_email}: {e}")
        return False
    except Exception as e:
        logging.error(f"❌ Failed to send email to {to_email}: {type(e).__name__}: {e}")
        import traceback
        logging.error(traceback.format_exc())
        return False

async def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """Send email using SMTP (non-blocking)"""
    # Run the blocking SMTP operation in a thread pool
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _send_email_sync, to_email, subject, html_body)

def create_jwt_token(user_id: str, email: str, role: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRATION_DAYS)
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> Dict[str, Any]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_jwt_token(token)
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def generate_reference_number(year: int) -> str:
    return f"KSIS-{year}-{str(uuid.uuid4())[:6].upper()}"

def generate_admission_number(year: int) -> str:
    return f"ADM-{year}-{str(uuid.uuid4())[:6].upper()}"

def generate_roll_number(year: int, standard: str, section: str, seq: int) -> str:
    return f"{year}-{standard.upper()}-{section.upper()}-{str(seq).zfill(3)}"

# --- API Routes ---

# Root
@api_router.get("/")
async def root():
    return {"message": "Kid Scholars School Management System API"}

# Health Check
@api_router.get("/health")
async def health_check():
    try:
        # Test database connection
        await db.command("ping")
        return {
            "status": "healthy",
            "database": "connected",
            "database_name": os.environ.get('DB_NAME', 'unknown')
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }

# Auth
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: Optional[UserRole] = None

@api_router.post("/auth/login")
async def login(req: LoginRequest):
    user = await db.users.find_one({"email": req.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account is inactive")
    
    token = create_jwt_token(user["id"], user["email"], user["role"])
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "role": user["role"],
            "full_name": user["full_name"]
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "role": current_user["role"],
        "full_name": current_user["full_name"]
    }

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    # Get counts
    total_applications = await db.applications.count_documents({})
    total_students = await db.students.count_documents({"is_active": True})
    pending_applications = await db.applications.count_documents({
        "status": {"$in": ["enquiry_new", "enquiry_hot", "enquiry_warm", "documents_pending"]}
    })
    
    # Get enquiry breakdown
    hot_enquiries = await db.applications.count_documents({"status": "enquiry_hot"})
    warm_enquiries = await db.applications.count_documents({"status": "enquiry_warm"})
    cold_enquiries = await db.applications.count_documents({"status": "enquiry_cold"})
    
    # Get recent applications
    recent_applications = await db.applications.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "total_applications": total_applications,
        "total_students": total_students,
        "pending_applications": pending_applications,
        "hot_enquiries": hot_enquiries,
        "warm_enquiries": warm_enquiries,
        "cold_enquiries": cold_enquiries,
        "recent_applications": recent_applications
    }

# Public Application APIs
class ApplicationCreateRequest(BaseModel):
    branch: str = "Medavakkam, Chennai"
    student_name: str
    gender: Gender
    date_of_birth: str
    applying_for_class: Standard
    source: Source
    parent_type: ParentType
    parent_name: str
    mobile: str
    email: EmailStr

@api_router.post("/public/application")
async def create_application(req: ApplicationCreateRequest):
        year = datetime.now(timezone.utc).year
        reference_number = generate_reference_number(year)
    
        application_data = req.model_dump()
        application_data["reference_number"] = reference_number
        application_data["status"] = ApplicationStatus.ENQUIRY_NEW.value
        # Always create a tracking token so users can track anytime
        tracking_token = generate_tracking_token()
        application_data["tracking_token"] = tracking_token
        application_data["id"] = str(uuid.uuid4())
        application_data["created_at"] = datetime.now(timezone.utc).isoformat()
        application_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
        await db.applications.insert_one(application_data)

        # Send confirmation email with reference number and tracking instructions
        try:
                tracking_url = f"{FRONTEND_URL}/track/{tracking_token}"
                subject = "AJ Academy - Application Submitted"
                html_body = f"""
                <html>
                    <body style='font-family: Arial, sans-serif; color: #111827;'>
                        <div style='max-width: 620px; margin: 0 auto; padding: 16px;'>
                            <div style='background:#1e3a8a; color:#fff; padding:16px 20px; border-radius:10px 10px 0 0; text-align:center;'>
                                <img src='aj_academy\frontend\public\assets\aj-academy-logo.png' alt='AJ Academy' style='height:50px; margin-bottom:8px;'/>
                                <h2 style='margin:0; font-size:20px;'>AJ Academy</h2>
                                <p style='margin:4px 0 0;'>Application Submitted</p>
                            </div>
                            <div style='border:1px solid #e5e7eb; border-top:none; border-radius:0 0 10px 10px; padding:20px; background:#ffffff;'>
                                <p style='margin-top:0;'>Hi {application_data.get("parent_name", "Parent")},</p>
                                <p>Thank you for submitting an application for <strong>{application_data.get("student_name", "your child")}</strong>.</p>
                                <p style='margin:12px 0; padding:12px; background:#f1f5f9; border-radius:8px; border:1px solid #e2e8f0;'>
                                    <strong>Reference Number:</strong> {reference_number}<br/>
                                    <strong>Track Online:</strong> <a href='{tracking_url}' style='color:#1d4ed8;'>Click here to track your application</a>
                                </p>
                                <p>You can use this reference number on our website to track your application status at any time.</p>
                                <p style='margin:20px 0;'>
                                    <a href='{tracking_url}' style='display:inline-block; padding:12px 18px; background:#f97316; color:#fff; text-decoration:none; border-radius:8px; font-weight:600;'>Track Application</a>
                                </p>
                                <p style='font-size:13px; color:#4b5563;'>If you have any questions, please reply to this email.</p>
                                <p style='margin-bottom:0;'>Warm regards,<br/>AJ Academy Admissions Team</p>
                            </div>
                        </div>
                    </body>
                </html>
                """
                await send_email(req.email, subject, html_body)
        except Exception as e:
                logging.error(f"Failed to send application confirmation email: {e}")
    
        return {
                "success": True,
                "reference_number": reference_number,
                "message": "Application submitted successfully"
        }

class ApplicationStatusRequest(BaseModel):
    reference_number: str
    date_of_birth: str

@api_router.post("/public/application/status")
async def check_application_status(req: ApplicationStatusRequest):
    application = await db.applications.find_one({
        "reference_number": req.reference_number,
        "date_of_birth": req.date_of_birth
    }, {"_id": 0})
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    return {
        "reference_number": application["reference_number"],
        "student_name": application["student_name"],
        "applying_for_class": application["applying_for_class"],
        "status": application["status"],
        "submitted_date": application["created_at"],
        "remarks": application.get("remarks", "We will contact you within 2-3 business days")
    }

@api_router.post("/public/application/resolve-tracking")
async def resolve_tracking_token(req: ApplicationStatusRequest):
    """
    Given reference number + DOB, return a tracking token.
    If the application doesn't yet have a token (older records), create and store one.
    """
    application = await db.applications.find_one({
        "reference_number": req.reference_number,
        "date_of_birth": req.date_of_birth
    }, {"_id": 0})

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    tracking_token = application.get("tracking_token")
    if not tracking_token:
        tracking_token = generate_tracking_token()
        now = datetime.now(timezone.utc).isoformat()
        await db.applications.update_one(
            {"id": application["id"]},
            {"$set": {"tracking_token": tracking_token, "updated_at": now}}
        )

    return {"tracking_token": tracking_token}

@api_router.get("/public/application/track/{tracking_token}")
async def get_application_by_tracking_token(tracking_token: str):
    """Get application details using tracking token (from email link)"""
    application = await db.applications.find_one({
        "tracking_token": tracking_token
    }, {"_id": 0})
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    return {
        "branch": application.get("branch", ""),
        "reference_number": application["reference_number"],
        "student_name": application["student_name"],
        "gender": application.get("gender", ""),
        "source": application.get("source", ""),
        "parent_type": application.get("parent_type", ""),
        "applying_for_class": application["applying_for_class"],
        "status": application["status"],
        "submitted_date": application["created_at"],
        "parent_name": application.get("parent_name", ""),
        "email": application.get("email", ""),
        "mobile": application.get("mobile", ""),
        "remarks": application.get("remarks", "We will contact you within 2-3 business days"),
        "date_of_birth": application.get("date_of_birth", ""),
        "documents_link": application.get("documents_link", ""),
        "documents_submitted_at": application.get("documents_submitted_at", "")
    }

class DocumentLinkSubmitRequest(BaseModel):
    documents_link: str

@api_router.post("/public/application/track/{tracking_token}/submit-documents")
async def submit_documents_by_tracking_token(tracking_token: str, req: DocumentLinkSubmitRequest):
    """Save a Google Drive/Dropbox link for documents using tracking token."""
    documents_link = (req.documents_link or "").strip()
    if not documents_link:
        raise HTTPException(status_code=400, detail="documents_link is required")

    now = datetime.now(timezone.utc).isoformat()
    result = await db.applications.update_one(
        {"tracking_token": tracking_token},
        {"$set": {
            "documents_link": documents_link,
            "documents_submitted_at": now,
            "updated_at": now,
        }}
    )

    if result.modified_count == 0:
        # Either not found, or same link already existed.
        exists = await db.applications.find_one({"tracking_token": tracking_token}, {"_id": 0, "documents_link": 1})
        if not exists:
            raise HTTPException(status_code=404, detail="Application not found")

    return {"success": True, "message": "Documents link saved"}

# Applications (Admission Officer)
@api_router.get("/applications")
async def get_applications(current_user: dict = Depends(get_current_user)):
    applications = await db.applications.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return applications

@api_router.get("/applications/{application_id}")
async def get_application(application_id: str, current_user: dict = Depends(get_current_user)):
    application = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return application

class ApplicationUpdateRequest(BaseModel):
    status: Optional[ApplicationStatus] = None
    remarks: Optional[str] = None
    section: Optional[str] = None

@api_router.patch("/applications/{application_id}")
async def update_application(application_id: str, req: ApplicationUpdateRequest, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    # Get current application to check if status is changing
    application = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    old_status = application.get("status")
    update_data = {k: v for k, v in req.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    email_scheduled = False

    # Validate: on_hold requires a message
    if req.status == ApplicationStatus.ON_HOLD.value:
        hold_message = (req.remarks or "").strip()
        if not hold_message:
            raise HTTPException(status_code=400, detail="remarks is required when status is on_hold")
    
    # If status is changing to documents_pending, generate tracking token and send email
    if req.status == ApplicationStatus.DOCUMENTS_PENDING.value and old_status != ApplicationStatus.DOCUMENTS_PENDING.value:
        # Generate or get tracking token
        tracking_token = application.get("tracking_token")
        if not tracking_token:
            tracking_token = generate_tracking_token()
            update_data["tracking_token"] = tracking_token
        
        # Prepare email content
        student_name = application.get("student_name", "Student")
        parent_name = application.get("parent_name", "Parent")
        reference_number = application.get("reference_number", "")
        date_of_birth = application.get("date_of_birth", "")
        
        # Build tracking URL with token
        tracking_url = f"{FRONTEND_URL}/track/{tracking_token}"
        
        email_subject = f"Documents Required for {student_name}'s Admission Application - {reference_number}"
        email_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #1e3a8a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }}
                .button {{ display: inline-block; background-color: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }}
                .button:hover {{ background-color: #ea580c; }}
                .info-box {{ background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }}
                .ref-box {{ background-color: #e5e7eb; padding: 10px; border-radius: 4px; margin: 10px 0; font-family: monospace; }}
                .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src='{FRONTEND_URL}/assets/aj-academy-logo.png' alt='AJ Academy' style='height:60px; margin-bottom:12px;'/>
                    <h1>AJ Academy</h1>
                    <p style="margin: 0; font-size: 14px;">Medavakkam, Chennai</p>
                </div>
                <div class="content">
                    <h2>Documents Required for Admission</h2>
                    <p>Dear {parent_name},</p>
                    <p>We hope this email finds you well. We are pleased to inform you that your application for <strong>{student_name}</strong> has been reviewed.</p>
                    
                    <div class="info-box">
                        <p style="margin: 0 0 10px 0;"><strong>📄 Action Required:</strong> You are requested to submit the following documents:</p>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>Birth Certificate</li>
                            <li>Previous School Leaving Certificate (if applicable)</li>
                            <li>Health Certificate</li>
                            <li>Passport size photographs (2 copies)</li>
                            <li>Parent/Guardian ID proof</li>
                            <li>Address proof</li>
                        </ul>
                    </div>
                    
                    <p><strong>Your Application Details:</strong></p>
                    <div class="ref-box">
                        <strong>Reference Number:</strong> {reference_number}<br>
                        <strong>Student Name:</strong> {student_name}<br>
                        <strong>Date of Birth:</strong> {date_of_birth}
                    </div>
                    
                    <p>You can track your application status and submit your documents using the link below:</p>
                    
                    <div style="text-align: center;">
                        <a href="{tracking_url}" class="button">Track Application Status</a>
                    </div>
                    
                    <p style="margin-top: 30px; word-break: break-all;"><strong>Or copy and paste this link in your browser:</strong><br>
                    <a href="{tracking_url}" style="color: #1e3a8a;">{tracking_url}</a></p>
                    
                    <p style="margin-top: 30px;"><strong>How to Submit Documents:</strong></p>
                    <ol style="padding-left: 20px;">
                        <li>Click the button above or use the tracking link</li>
                        <li>You will see your application status and details</li>
                        <li>Follow the instructions on the page to submit your documents</li>
                        <li>You can also submit documents by pasting a Google Drive, Dropbox, or any cloud storage link</li>
                    </ol>
                    
                    <p><strong>Important Notes:</strong></p>
                    <ul style="padding-left: 20px;">
                        <li>Please ensure all documents are clear and readable</li>
                        <li>Upload documents to Google Drive, Dropbox, OneDrive, or any cloud storage service</li>
                        <li>Make sure the link is set to "Anyone with the link can view"</li>
                        <li>Submit the link in the document submission field</li>
                    </ul>
                    
                    <p>If you have any questions or need assistance, please feel free to contact us:</p>
                    <p><strong>Phone:</strong> +91 72008 25692<br>
                    <strong>Email:</strong> {SENDER_EMAIL or 'ajacademy2024@gmail.com'}</p>
                    
                    <p>We look forward to welcoming {student_name} to AJ Academy!</p>
                    
                    <p>Best regards,<br>
                    <strong>Admission Office</strong><br>
                    AJ Academy<br>
                    Medavakkam, Chennai</p>
                </div>
                <div class="footer">
                    <p>This is an automated email. Please do not reply to this message.</p>
                    <p>If you have questions, please contact us using the phone or email above.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Email text body (fallback for non-HTML email clients)
        email_text = f"""
AJ Academy - Documents Required

Dear {parent_name},

We hope this email finds you well. We are pleased to inform you that your application for {student_name} has been reviewed.

ACTION REQUIRED: You are requested to submit the following documents:
- Birth Certificate
- Previous School Leaving Certificate (if applicable)
- Health Certificate
- Passport size photographs (2 copies)
- Parent/Guardian ID proof
- Address proof

Your Application Details:
Reference Number: {reference_number}
Student Name: {student_name}
Date of Birth: {date_of_birth}

To check your application status and submit your documents:
1. Click this link: {tracking_url}
2. You will see your application status and details
3. Follow the instructions on the page to submit your documents
4. You can also submit documents by pasting a Google Drive, Dropbox, or any cloud storage link

Important Notes:
- Please ensure all documents are clear and readable
- Upload documents to Google Drive, Dropbox, OneDrive, or any cloud storage service
- Make sure the link is set to "Anyone with the link can view"
- Submit the link in the document submission field

If you have any questions or need assistance, please contact us:
Phone: +91 72008 25692
Email: {SENDER_EMAIL or 'ajacademy2024@gmail.com'}

We look forward to welcoming {student_name} to AJ Academy!

Best regards,
Admission Office
AJ Academy
Medavakkam, Chennai

---
This is an automated email. Please do not reply to this message.
        """
        
        # Send email asynchronously (don't block the response)
        recipient_email = application.get("email")
        if recipient_email:
            # Run email sending in background
            background_tasks.add_task(send_email, recipient_email, email_subject, email_html)
            logging.info(f"Scheduling email to be sent to {recipient_email} for application {reference_number}")
            email_scheduled = True
        else:
            logging.warning(f"No email address found for application {reference_number}, cannot send email")

    # If status is changing to documents_verified, send confirmation email
    if req.status == ApplicationStatus.DOCUMENTS_VERIFIED.value and old_status != ApplicationStatus.DOCUMENTS_VERIFIED.value:
        student_name = application.get("student_name", "Student")
        parent_name = application.get("parent_name", "Parent")
        reference_number = application.get("reference_number", "")
        tracking_token = application.get("tracking_token")
        tracking_url = f"{FRONTEND_URL}/track/{tracking_token}" if tracking_token else FRONTEND_URL

        email_subject = f"Documents Verified ✅ - Admission Application {reference_number}"
        email_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #1e3a8a; color: white; padding: 18px; text-align: center; border-radius: 8px 8px 0 0; }}
            .content {{ background-color: #f9fafb; padding: 26px; border: 1px solid #e5e7eb; }}
            .badge {{ display:inline-block; padding: 6px 10px; border-radius: 999px; background: #dcfce7; color:#166534; font-weight:700; font-size: 12px; }}
            .button {{ display: inline-block; background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; font-weight: bold; }}
            .footer {{ text-align: center; padding: 16px; color: #6b7280; font-size: 12px; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src='{FRONTEND_URL}/assets/aj-academy-logo.png' alt='AJ Academy' style='height:50px; margin-bottom:10px;'/>
              <h2 style="margin:0;">AJ Academy</h2>
              <div style="margin-top:8px;"><span class="badge">DOCUMENTS VERIFIED</span></div>
            </div>
            <div class="content">
              <p>Dear {parent_name},</p>
              <p>We are happy to confirm that the documents submitted for <strong>{student_name}</strong> have been <strong>verified successfully</strong>.</p>
              <p><strong>Reference Number:</strong> {reference_number}</p>
              <p>You can track your application status anytime using the link below:</p>
              <div style="text-align:center;">
                <a class="button" href="{tracking_url}">Track Application Status</a>
              </div>
              <p>If any further steps are required (e.g., fee payment), our team will notify you.</p>
              <p>Best regards,<br><strong>Admission Office</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
        """

        recipient_email = application.get("email")
        if recipient_email:
            background_tasks.add_task(send_email, recipient_email, email_subject, email_html)
            logging.info(f"Scheduling documents_verified email to {recipient_email} for application {reference_number}")
            email_scheduled = True
        else:
            logging.warning(f"No email address found for application {reference_number}, cannot send documents_verified email")

    # If status is changing to on_hold, email the hold reason (remarks)
    if req.status == ApplicationStatus.ON_HOLD.value and old_status != ApplicationStatus.ON_HOLD.value:
        student_name = application.get("student_name", "Student")
        parent_name = application.get("parent_name", "Parent")
        reference_number = application.get("reference_number", "")
        hold_reason = (req.remarks or "").strip()
        tracking_token = application.get("tracking_token")
        tracking_url = f"{FRONTEND_URL}/track/{tracking_token}" if tracking_token else FRONTEND_URL

        email_subject = f"Application On Hold ⏸️ - {reference_number}"
        email_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #1e3a8a; color: white; padding: 18px; text-align: center; border-radius: 8px 8px 0 0; }}
            .content {{ background-color: #f9fafb; padding: 26px; border: 1px solid #e5e7eb; }}
            .box {{ background:#fff7ed; border-left: 4px solid #f97316; padding: 14px; margin: 16px 0; }}
            .button {{ display: inline-block; background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; font-weight: bold; }}
            .footer {{ text-align: center; padding: 16px; color: #6b7280; font-size: 12px; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src='{FRONTEND_URL}/assets/aj-academy-logo.png' alt='AJ Academy' style='height:50px; margin-bottom:10px;'/>
              <h2 style="margin:0;">AJ Academy</h2>
              <p style="margin:6px 0 0 0;">Application On Hold</p>
            </div>
            <div class="content">
              <p>Dear {parent_name},</p>
              <p>Your admission application for <strong>{student_name}</strong> (Reference: <strong>{reference_number}</strong>) is currently placed <strong>on hold</strong>.</p>
              <div class="box">
                <p style="margin:0;"><strong>Reason / Message from Admission Team:</strong></p>
                <p style="margin:8px 0 0 0; white-space: pre-wrap;">{hold_reason}</p>
              </div>
              <p>You can track your application status here:</p>
              <div style="text-align:center;">
                <a class="button" href="{tracking_url}">Track Application Status</a>
              </div>
              <p>Once the required information/documents are provided, we will proceed with the next steps.</p>
              <p>Best regards,<br><strong>Admission Office</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
        """

        recipient_email = application.get("email")
        if recipient_email:
            background_tasks.add_task(send_email, recipient_email, email_subject, email_html)
            logging.info(f"Scheduling on_hold email to {recipient_email} for application {reference_number}")
            email_scheduled = True
        else:
            logging.warning(f"No email address found for application {reference_number}, cannot send on_hold email")

    # If status is changing to rejected, email rejection notice
    if req.status == ApplicationStatus.REJECTED.value and old_status != ApplicationStatus.REJECTED.value:
        student_name = application.get("student_name", "Student")
        parent_name = application.get("parent_name", "Parent")
        reference_number = application.get("reference_number", "")

        email_subject = f"Application Update - {reference_number}"
        email_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #1e3a8a; color: white; padding: 18px; text-align: center; border-radius: 8px 8px 0 0; }}
            .content {{ background-color: #f9fafb; padding: 26px; border: 1px solid #e5e7eb; }}
            .footer {{ text-align: center; padding: 16px; color: #6b7280; font-size: 12px; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src='{FRONTEND_URL}/assets/aj-academy-logo.png' alt='AJ Academy' style='height:50px; margin-bottom:10px;'/>
              <h2 style="margin:0;">AJ Academy</h2>
              <p style="margin:6px 0 0 0;">Application Status: Rejected</p>
            </div>
            <div class="content">
              <p>Dear {parent_name},</p>
              <p>Thank you for your interest in AJ Academy.</p>
              <p>After review, we regret to inform you that the admission application for <strong>{student_name}</strong> (Reference: <strong>{reference_number}</strong>) has been <strong>rejected</strong>.</p>
              <p>If you have any questions, please contact our admission office.</p>
              <p>Best regards,<br><strong>Admission Office</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
        """

        recipient_email = application.get("email")
        if recipient_email:
            background_tasks.add_task(send_email, recipient_email, email_subject, email_html)
            logging.info(f"Scheduling rejected email to {recipient_email} for application {reference_number}")
            email_scheduled = True
        else:
            logging.warning(f"No email address found for application {reference_number}, cannot send rejected email")
    
    result = await db.applications.update_one(
        {"id": application_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    
    return {"success": True, "message": "Application updated", "email_sent": email_scheduled}

class AdmitStudentRequest(BaseModel):
    section: str
    academic_year: str

@api_router.post("/applications/{application_id}/admit")
async def admit_student(application_id: str, req: AdmitStudentRequest, current_user: dict = Depends(get_current_user)):
    # Get application
    application = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Check if already admitted
    if application.get("status") == ApplicationStatus.ADMITTED.value:
        raise HTTPException(status_code=400, detail="Student already admitted")
    
    # Generate admission and roll numbers
    year = datetime.now(timezone.utc).year
    admission_number = generate_admission_number(year)
    
    # Get section sequence number
    existing_students = await db.students.count_documents({
        "current_class": application["applying_for_class"],
        "section": req.section,
        "academic_year": req.academic_year
    })
    roll_number = generate_roll_number(year, application["applying_for_class"], req.section, existing_students + 1)
    
    # Create parent user
    parent_email = application["email"]
    parent_exists = await db.users.find_one({"email": parent_email})
    
    if not parent_exists:
        parent_user_data = {
            "id": str(uuid.uuid4()),
            "email": parent_email,
            "password_hash": hash_password(f"parent{year}"),  # Default password
            "role": UserRole.PARENT.value,
            "full_name": application["parent_name"],
            "mobile": application.get("mobile"),
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(parent_user_data)
        parent_id = parent_user_data["id"]
    else:
        parent_id = parent_exists["id"]
    
    # Create student record
    student_data = {
        "id": str(uuid.uuid4()),
        "admission_number": admission_number,
        "roll_number": roll_number,
        "student_name": application["student_name"],
        "gender": application["gender"],
        "date_of_birth": application["date_of_birth"],
        "current_class": application["applying_for_class"],
        "section": req.section,
        "academic_year": req.academic_year,
        "parent_id": parent_id,
        "application_id": application_id,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.students.insert_one(student_data)
    
    # Update application status
    await db.applications.update_one(
        {"id": application_id},
        {"$set": {
            "status": ApplicationStatus.ADMITTED.value,
            "admission_number": admission_number,
            "roll_number": roll_number,
            "section": req.section,
            "academic_year": req.academic_year,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Create notification for parent
    notification_data = {
        "id": str(uuid.uuid4()),
        "user_id": parent_id,
        "title": "Admission Confirmed!",
        "message": f"Congratulations! {application['student_name']} has been admitted. Roll Number: {roll_number}. Login credentials sent to {parent_email}",
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification_data)
    
    return {
        "success": True,
        "message": "Student admitted successfully",
        "admission_number": admission_number,
        "roll_number": roll_number,
        "parent_email": parent_email,
        "parent_default_password": f"parent{year}"
    }

# Academic Setup
class AcademicYear(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    year: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Section(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    standard: Standard
    section_name: str
    capacity: int = 30
    academic_year: str
    teacher_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Document(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    application_id: str
    document_type: str
    document_name: str
    file_url: str
    status: str = "pending"
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TeacherAssignment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    teacher_id: str
    standard: Standard
    section: str
    academic_year: str
    is_class_teacher: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AcademicYearCreateRequest(BaseModel):
    year: str

@api_router.post("/academic/years")
async def create_academic_year(req: AcademicYearCreateRequest, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["super_admin", "school_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    year_data = req.model_dump()
    year_data["id"] = str(uuid.uuid4())
    year_data["is_active"] = True
    year_data["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.academic_years.insert_one(year_data)
    return {"success": True, "message": "Academic year created"}

@api_router.get("/academic/years")
async def get_academic_years(current_user: dict = Depends(get_current_user)):
    years = await db.academic_years.find({}, {"_id": 0}).to_list(100)
    return years

@api_router.delete("/academic/years/{year_id}")
async def delete_academic_year(year_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["super_admin", "school_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if year is being used in any sections
    year_doc = await db.academic_years.find_one({"id": year_id})
    if not year_doc:
        raise HTTPException(status_code=404, detail="Academic year not found")
    
    sections_using_year = await db.sections.find_one({"academic_year": year_doc["year"]})
    if sections_using_year:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete academic year as it is being used in sections. Please remove sections first."
        )
    
    result = await db.academic_years.delete_one({"id": year_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Academic year not found")
    
    return {"success": True, "message": "Academic year deleted successfully"}

class SectionCreateRequest(BaseModel):
    standard: Standard
    section_name: str
    capacity: int = 30
    academic_year: str
    teacher_id: Optional[str] = None

@api_router.post("/academic/sections")
async def create_section(req: SectionCreateRequest, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["super_admin", "school_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    section_data = req.model_dump()
    section_data["id"] = str(uuid.uuid4())
    section_data["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.sections.insert_one(section_data)
    return {"success": True, "message": "Section created"}

@api_router.get("/academic/sections")
async def get_sections(current_user: dict = Depends(get_current_user)):
    sections = await db.sections.find({}, {"_id": 0}).to_list(100)
    return sections

@api_router.delete("/academic/sections/{section_id}")
async def delete_section(section_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["super_admin", "school_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if section has enrolled students
    students_in_section = await db.students.find_one({"section_id": section_id})
    if students_in_section:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete section as it has enrolled students. Please reassign students first."
        )
    
    result = await db.sections.delete_one({"id": section_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Section not found")
    
    return {"success": True, "message": "Section deleted successfully"}

# Standards Management
class StandardModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    display_name: str
    code: str
    age_range: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StandardCreateRequest(BaseModel):
    name: str
    display_name: str
    code: str
    age_range: Optional[str] = None
    description: Optional[str] = None

class StandardUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    age_range: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

@api_router.post("/academic/standards")
async def create_standard(req: StandardCreateRequest, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["super_admin", "school_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if standard code already exists
    existing = await db.standards.find_one({"code": req.code})
    if existing:
        raise HTTPException(status_code=400, detail="Standard with this code already exists")
    
    standard_data = req.model_dump()
    standard_data["id"] = str(uuid.uuid4())
    standard_data["is_active"] = True
    standard_data["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.standards.insert_one(standard_data)
    return {"success": True, "message": "Standard created successfully", "data": standard_data}

@api_router.get("/academic/standards")
async def get_standards(current_user: dict = Depends(get_current_user)):
    standards = await db.standards.find({}, {"_id": 0}).sort("created_at", 1).to_list(100)
    
    # If no standards exist, return default standards
    if not standards:
        default_standards = [
            {
                "id": str(uuid.uuid4()),
                "name": "play_group",
                "display_name": "Play Group",
                "code": "play_group",
                "age_range": "1.5-2.5 Years",
                "description": "Early learning through play",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "pre_kg",
                "display_name": "Pre KG",
                "code": "pre_kg",
                "age_range": "2.5-3.5 Years",
                "description": "Foundation for kindergarten",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "lkg",
                "display_name": "LKG",
                "code": "lkg",
                "age_range": "3.5-4.5 Years",
                "description": "Lower kindergarten excellence",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "ukg",
                "display_name": "UKG",
                "code": "ukg",
                "age_range": "4.5-5.5 Years",
                "description": "Upper kindergarten mastery",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.standards.insert_many(default_standards)
        standards = default_standards
    
    return standards

@api_router.put("/academic/standards/{standard_id}")
async def update_standard(standard_id: str, req: StandardUpdateRequest, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["super_admin", "school_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in req.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.standards.update_one(
        {"id": standard_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Standard not found")
    
    return {"success": True, "message": "Standard updated successfully"}

@api_router.delete("/academic/standards/{standard_id}")
async def delete_standard(standard_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["super_admin", "school_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if standard is being used in any sections
    sections_using_standard = await db.sections.find_one({"standard": standard_id})
    if sections_using_standard:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete standard as it is being used in sections. Please remove or reassign sections first."
        )
    
    result = await db.standards.delete_one({"id": standard_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Standard not found")
    
    return {"success": True, "message": "Standard deleted successfully"}

# Teacher Assignment
class TeacherAssignmentCreateRequest(BaseModel):
    teacher_id: str
    standard: Standard
    section: str
    academic_year: str
    is_class_teacher: bool = False

@api_router.post("/teachers/assign")
async def assign_teacher(req: TeacherAssignmentCreateRequest, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["super_admin", "school_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    assignment_data = req.model_dump()
    assignment_data["id"] = str(uuid.uuid4())
    assignment_data["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.teacher_assignments.insert_one(assignment_data)
    
    # Update section with teacher
    await db.sections.update_one(
        {"standard": req.standard, "section_name": req.section, "academic_year": req.academic_year},
        {"$set": {"teacher_id": req.teacher_id}}
    )
    
    return {"success": True, "message": "Teacher assigned successfully"}

@api_router.get("/teachers/assignments")
async def get_teacher_assignments(current_user: dict = Depends(get_current_user)):
    assignments = await db.teacher_assignments.find({}, {"_id": 0}).to_list(1000)
    return assignments

@api_router.get("/teachers/{teacher_id}/students")
async def get_teacher_students(teacher_id: str, current_user: dict = Depends(get_current_user)):
    # Get teacher assignments
    assignments = await db.teacher_assignments.find({"teacher_id": teacher_id}, {"_id": 0}).to_list(100)
    
    # Get students for assigned classes
    students = []
    for assignment in assignments:
        class_students = await db.students.find({
            "current_class": assignment["standard"],
            "section": assignment["section"],
            "is_active": True
        }, {"_id": 0}).to_list(1000)
        students.extend(class_students)
    
    return students

# Bulk Attendance
class BulkAttendanceRequest(BaseModel):
    date: str
    standard: Standard
    section: str
    attendance_list: List[Dict[str, Any]]  # [{student_id, status, remarks}]

@api_router.post("/attendance/bulk")
async def mark_bulk_attendance(req: BulkAttendanceRequest, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["teacher", "super_admin", "school_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    attendance_records = []
    for item in req.attendance_list:
        attendance_data = {
            "id": str(uuid.uuid4()),
            "student_id": item["student_id"],
            "date": req.date,
            "status": item["status"],
            "teacher_id": current_user["id"],
            "remarks": item.get("remarks"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        attendance_records.append(attendance_data)
    
    if attendance_records:
        await db.attendance.insert_many(attendance_records)
    
    return {"success": True, "message": f"Attendance marked for {len(attendance_records)} students"}

@api_router.get("/attendance/class/{standard}/{section}/{date}")
async def get_class_attendance(
    standard: str, 
    section: str, 
    date: str, 
    current_user: dict = Depends(get_current_user)
):
    # Get students in class
    students = await db.students.find({
        "current_class": standard,
        "section": section,
        "is_active": True
    }, {"_id": 0}).to_list(1000)
    
    # Get attendance for the date
    attendance_records = await db.attendance.find({
        "date": date
    }, {"_id": 0}).to_list(1000)
    
    # Create attendance map
    attendance_map = {rec["student_id"]: rec for rec in attendance_records}
    
    # Combine student info with attendance
    result = []
    for student in students:
        result.append({
            "student": student,
            "attendance": attendance_map.get(student["id"])
        })
    
    return result

# Document Upload
class DocumentUploadRequest(BaseModel):
    application_id: str
    document_type: str
    document_name: str
    file_url: str

@api_router.post("/documents/upload")
async def upload_document(req: DocumentUploadRequest, current_user: dict = Depends(get_current_user)):
    doc_data = req.model_dump()
    doc_data["id"] = str(uuid.uuid4())
    doc_data["status"] = "pending"
    doc_data["uploaded_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.documents.insert_one(doc_data)
    return {"success": True, "message": "Document uploaded successfully"}

@api_router.get("/documents/{application_id}")
async def get_application_documents(application_id: str, current_user: dict = Depends(get_current_user)):
    documents = await db.documents.find({"application_id": application_id}, {"_id": 0}).to_list(100)
    return documents

@api_router.patch("/documents/{document_id}")
async def update_document_status(document_id: str, status: str, current_user: dict = Depends(get_current_user)):
    result = await db.documents.update_one(
        {"id": document_id},
        {"$set": {"status": status}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"success": True, "message": "Document status updated"}

# Students
@api_router.get("/students")
async def get_students(current_user: dict = Depends(get_current_user)):
    students = await db.students.find({}, {"_id": 0}).to_list(1000)
    return students

@api_router.get("/students/{student_id}")
async def get_student(student_id: str, current_user: dict = Depends(get_current_user)):
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

# Parent APIs
@api_router.get("/parent/children")
async def get_parent_children(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    children = await db.students.find({"parent_id": current_user["id"], "is_active": True}, {"_id": 0}).to_list(100)
    return children

@api_router.get("/parent/child/{student_id}/activities")
async def get_child_activities(student_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Verify parent owns this child
    student = await db.students.find_one({"id": student_id, "parent_id": current_user["id"]}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    activities = await db.daily_activities.find({"student_id": student_id}, {"_id": 0}).sort("date", -1).limit(30).to_list(30)
    return activities

@api_router.get("/parent/child/{student_id}/attendance")
async def get_child_attendance(student_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Verify parent owns this child
    student = await db.students.find_one({"id": student_id, "parent_id": current_user["id"]}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    attendance = await db.attendance.find({"student_id": student_id}, {"_id": 0}).sort("date", -1).limit(60).to_list(60)
    return attendance

@api_router.get("/parent/child/{student_id}/fees")
async def get_child_fees(student_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "parent":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Verify parent owns this child
    student = await db.students.find_one({"id": student_id, "parent_id": current_user["id"]}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    payments = await db.fee_payments.find({"student_id": student_id}, {"_id": 0}).to_list(100)
    return payments

# Attendance
class AttendanceCreateRequest(BaseModel):
    student_id: str
    date: str
    status: AttendanceStatus
    remarks: Optional[str] = None

@api_router.post("/attendance")
async def create_attendance(req: AttendanceCreateRequest, current_user: dict = Depends(get_current_user)):
    attendance_data = req.model_dump()
    attendance_data["id"] = str(uuid.uuid4())
    attendance_data["teacher_id"] = current_user["id"]
    attendance_data["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.attendance.insert_one(attendance_data)
    return {"success": True, "message": "Attendance marked"}

@api_router.get("/attendance/{student_id}")
async def get_student_attendance(student_id: str, current_user: dict = Depends(get_current_user)):
    attendance_records = await db.attendance.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    return attendance_records

# Daily Activities
class DailyActivityCreateRequest(BaseModel):
    student_id: str
    date: str
    rhymes: Optional[str] = None
    activities: Optional[str] = None
    food_habits: Optional[str] = None
    nap_status: Optional[str] = None
    behavior_notes: Optional[str] = None
    homework: Optional[str] = None
    remarks: Optional[str] = None

@api_router.post("/daily-activities")
async def create_daily_activity(req: DailyActivityCreateRequest, current_user: dict = Depends(get_current_user)):
    activity_data = req.model_dump()
    activity_data["id"] = str(uuid.uuid4())
    activity_data["teacher_id"] = current_user["id"]
    activity_data["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.daily_activities.insert_one(activity_data)
    return {"success": True, "message": "Daily activity saved"}

@api_router.get("/daily-activities/{student_id}")
async def get_student_activities(student_id: str, current_user: dict = Depends(get_current_user)):
    activities = await db.daily_activities.find({"student_id": student_id}, {"_id": 0}).sort("date", -1).to_list(1000)
    return activities

# Fee Management
@api_router.get("/fees/structure")
async def get_fee_structures(current_user: dict = Depends(get_current_user)):
    structures = await db.fee_structures.find({}, {"_id": 0}).to_list(100)
    return structures

class FeeStructureCreateRequest(BaseModel):
    standard: Standard
    admission_fee: int
    tuition_fee: int
    books_fee: int = 0
    uniform_fee: int = 0
    transport_fee: int = 0
    academic_year: str

@api_router.post("/fees/structure")
async def create_fee_structure(req: FeeStructureCreateRequest, current_user: dict = Depends(get_current_user)):
    structure_data = req.model_dump()
    structure_data["id"] = str(uuid.uuid4())
    structure_data["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.fee_structures.insert_one(structure_data)
    return {"success": True, "message": "Fee structure created"}

@api_router.get("/fees/payments/{student_id}")
async def get_student_payments(student_id: str, current_user: dict = Depends(get_current_user)):
    payments = await db.fee_payments.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    return payments

@api_router.post("/fee-payments/record")
async def record_payment(data: dict, current_user: dict = Depends(get_current_user)):
    payment_data = {
        "id": str(uuid.uuid4()),
        "student_id": data["student_id"],
        "amount": data["amount"],
        "payment_mode": data["payment_mode"],
        "payment_status": data.get("payment_status", "paid"),
        "receipt_number": f"RCPT-{str(uuid.uuid4())[:8].upper()}",
        "payment_date": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.fee_payments.insert_one(payment_data)
    return {"success": True, "receipt_number": payment_data["receipt_number"]}

# Razorpay Payment
class CreateOrderRequest(BaseModel):
    student_id: str
    amount: int

@api_router.post("/payments/create-order")
async def create_payment_order(req: CreateOrderRequest, current_user: dict = Depends(get_current_user)):
    if not razorpay_client:
        raise HTTPException(status_code=503, detail="Payment service not configured")
    
    try:
        order = razorpay_client.order.create({
            "amount": req.amount * 100,
            "currency": "INR",
            "payment_capture": 1
        })
        
        payment_data = {
            "id": str(uuid.uuid4()),
            "student_id": req.student_id,
            "amount": req.amount,
            "payment_mode": PaymentMode.ONLINE.value,
            "payment_status": PaymentStatus.PENDING.value,
            "razorpay_order_id": order["id"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.fee_payments.insert_one(payment_data)
        
        return {
            "order_id": order["id"],
            "amount": req.amount,
            "currency": "INR",
            "key_id": os.environ.get('RAZORPAY_KEY_ID')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

@api_router.post("/payments/verify")
async def verify_payment(req: VerifyPaymentRequest, current_user: dict = Depends(get_current_user)):
    if not razorpay_client:
        raise HTTPException(status_code=503, detail="Payment service not configured")
    
    try:
        razorpay_client.utility.verify_payment_signature({
            "razorpay_order_id": req.razorpay_order_id,
            "razorpay_payment_id": req.razorpay_payment_id,
            "razorpay_signature": req.razorpay_signature
        })
        
        await db.fee_payments.update_one(
            {"razorpay_order_id": req.razorpay_order_id},
            {"$set": {
                "payment_status": PaymentStatus.PAID.value,
                "razorpay_payment_id": req.razorpay_payment_id,
                "payment_date": datetime.now(timezone.utc).isoformat(),
                "receipt_number": f"RCPT-{str(uuid.uuid4())[:8].upper()}"
            }}
        )
        
        return {"success": True, "message": "Payment verified"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Payment verification failed")

# Notifications
@api_router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find({"user_id": current_user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return notifications

@api_router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user["id"]},
        {"$set": {"is_read": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True}

# Admin User Management
class UserCreateRequest(BaseModel):
    email: EmailStr
    password: str
    role: UserRole
    full_name: str
    mobile: Optional[str] = None

@api_router.post("/admin/users")
async def create_user(req: UserCreateRequest, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["super_admin", "school_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    existing = await db.users.find_one({"email": req.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    user_data = req.model_dump()
    user_data["id"] = str(uuid.uuid4())
    user_data["password_hash"] = hash_password(req.password)
    del user_data["password"]
    user_data["is_active"] = True
    user_data["created_at"] = datetime.now(timezone.utc).isoformat()
    user_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.users.insert_one(user_data)
    return {"success": True, "message": "User created successfully"}

@api_router.get("/admin/users")
async def get_users(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["super_admin", "school_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

class PasswordResetRequest(BaseModel):
    new_password: str

@api_router.patch("/admin/users/{user_id}/password")
async def reset_user_password(user_id: str, req: PasswordResetRequest, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["super_admin", "school_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"password_hash": hash_password(req.new_password)}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"success": True, "message": "Password reset successfully"}

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["super_admin", "school_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"success": True, "message": "User deleted successfully"}

# ==================== GALLERY MANAGEMENT MODULE ====================

@api_router.get("/admin/gallery")
async def get_gallery():
    """Get all gallery images (public endpoint)"""
    images = await db.gallery.find({}).sort("order", 1).to_list(1000)
    # Convert MongoDB _id to id for frontend compatibility
    for img in images:
        if "_id" in img:
            img["_id"] = str(img["_id"])
    return images

@api_router.post("/admin/gallery/upload")
async def upload_gallery_images(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Upload images to gallery"""
    if current_user["role"] not in ["super_admin", "school_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        form_data = await request.form()
        files = form_data.getlist("files")
        
        if not files:
            raise HTTPException(status_code=400, detail="No files provided")
        
        # Get the next order number
        last_image = await db.gallery.find_one({}, sort=[("order", -1)])
        next_order = (last_image["order"] + 1) if last_image else 1
        
        uploaded_images = []
        
        for idx, file in enumerate(files):
            if file.filename:
                # Read file content
                content = await file.read()
                
                # Create a simple storage URL (in production, use S3, GCS, etc.)
                # For now, we'll store the base64 encoded image data
                import base64
                encoded_image = base64.b64encode(content).decode('utf-8')
                
                # Get file extension
                file_ext = file.filename.split('.')[-1].lower()
                mime_type = f"image/{file_ext}" if file_ext in ["jpg", "jpeg", "png", "gif", "webp"] else "image/jpeg"
                
                image_url = f"data:{mime_type};base64,{encoded_image}"
                
                gallery_item = {
                    "url": image_url,
                    "alt": f"Gallery Image {next_order + idx}",
                    "order": next_order + idx,
                    "filename": file.filename,
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                }
                
                result = await db.gallery.insert_one(gallery_item)
                uploaded_images.append(str(result.inserted_id))
        
        return {
            "success": True,
            "message": f"Uploaded {len(uploaded_images)} image(s)",
            "count": len(uploaded_images)
        }
    
    except Exception as e:
        logger.error(f"Gallery upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@api_router.post("/admin/gallery/add-url")
async def add_gallery_image_url(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Add image to gallery from URL"""
    if current_user["role"] not in ["super_admin", "school_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        url = data.get("url")
        alt = data.get("alt", "Gallery Image")
        
        if not url:
            raise HTTPException(status_code=400, detail="URL is required")
        
        # Validate URL
        if not url.startswith(("http://", "https://", "data:")):
            raise HTTPException(status_code=400, detail="Invalid URL format")
        
        # Get the next order number
        last_image = await db.gallery.find_one({}, sort=[("order", -1)])
        next_order = (last_image["order"] + 1) if last_image else 1
        
        gallery_item = {
            "url": url,
            "alt": alt,
            "order": next_order,
            "source": "url",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        result = await db.gallery.insert_one(gallery_item)
        
        return {
            "success": True,
            "message": "Image added successfully",
            "id": str(result.inserted_id)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Gallery URL add error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to add image: {str(e)}")

@api_router.delete("/admin/gallery/{image_id}")
async def delete_gallery_image(
    image_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete an image from gallery"""
    if current_user["role"] not in ["super_admin", "school_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    from bson import ObjectId
    
    try:
        result = await db.gallery.delete_one({"_id": ObjectId(image_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Image not found")
        
        return {"success": True, "message": "Image deleted successfully"}
    
    except Exception as e:
        logger.error(f"Gallery delete error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")

@api_router.patch("/admin/gallery/{image_id}/order")
async def update_gallery_image_order(
    image_id: str,
    order: int,
    current_user: dict = Depends(get_current_user)
):
    """Update image order in gallery"""
    if current_user["role"] not in ["super_admin", "school_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    from bson import ObjectId
    
    try:
        result = await db.gallery.update_one(
            {"_id": ObjectId(image_id)},
            {"$set": {"order": order, "updated_at": datetime.now(timezone.utc)}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Image not found")
        
        return {"success": True, "message": "Image order updated"}
    
    except Exception as e:
        logger.error(f"Gallery order update error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")

# ==================== REPORTS MODULE ====================

@api_router.get("/reports/daily-collection")
async def get_daily_collection_report(
    date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get daily fee collection report"""
    if current_user["role"] not in ["super_admin", "school_admin", "finance_manager"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Default to today if no date provided
    if not date:
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Get all payments for the date
    payments = await db.fee_payments.find({
        "payment_status": "paid"
    }, {"_id": 0}).to_list(10000)
    
    # Filter by date (payment_date starts with the date string)
    daily_payments = [p for p in payments if p.get("payment_date", "").startswith(date)]
    
    # Calculate totals by payment mode
    totals = {"cash": 0, "upi": 0, "bank_transfer": 0, "online": 0}
    for payment in daily_payments:
        mode = payment.get("payment_mode", "cash")
        totals[mode] = totals.get(mode, 0) + payment.get("amount", 0)
    
    # Get student details for each payment
    enriched_payments = []
    for payment in daily_payments:
        student = await db.students.find_one({"id": payment["student_id"]}, {"_id": 0})
        enriched_payments.append({
            **payment,
            "student_name": student.get("student_name", "Unknown") if student else "Unknown",
            "roll_number": student.get("roll_number", "N/A") if student else "N/A",
            "class": student.get("current_class", "N/A") if student else "N/A"
        })
    
    return {
        "date": date,
        "total_collection": sum(totals.values()),
        "by_payment_mode": totals,
        "transaction_count": len(daily_payments),
        "payments": enriched_payments
    }

@api_router.get("/reports/outstanding-dues")
async def get_outstanding_dues_report(current_user: dict = Depends(get_current_user)):
    """Get all students with outstanding dues"""
    if current_user["role"] not in ["super_admin", "school_admin", "finance_manager"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all active students
    students = await db.students.find({"is_active": True}, {"_id": 0}).to_list(10000)
    
    # Get all fee structures
    structures = await db.fee_structures.find({}, {"_id": 0}).to_list(100)
    structure_map = {s["standard"]: s for s in structures}
    
    outstanding_list = []
    total_outstanding = 0
    
    for student in students:
        # Get fee structure for student's class
        structure = structure_map.get(student.get("current_class"))
        if not structure:
            continue
        
        total_fee = (
            structure.get("admission_fee", 0) +
            structure.get("tuition_fee", 0) +
            structure.get("books_fee", 0) +
            structure.get("uniform_fee", 0) +
            structure.get("transport_fee", 0)
        )
        
        # Get paid amount
        payments = await db.fee_payments.find({
            "student_id": student["id"],
            "payment_status": "paid"
        }, {"_id": 0}).to_list(1000)
        
        paid_amount = sum(p.get("amount", 0) for p in payments)
        due_amount = total_fee - paid_amount
        
        if due_amount > 0:
            outstanding_list.append({
                "student_id": student["id"],
                "student_name": student.get("student_name"),
                "roll_number": student.get("roll_number"),
                "class": student.get("current_class"),
                "section": student.get("section"),
                "total_fee": total_fee,
                "paid_amount": paid_amount,
                "due_amount": due_amount,
                "parent_id": student.get("parent_id")
            })
            total_outstanding += due_amount
    
    # Sort by due amount descending
    outstanding_list.sort(key=lambda x: x["due_amount"], reverse=True)
    
    return {
        "total_outstanding": total_outstanding,
        "students_with_dues": len(outstanding_list),
        "students": outstanding_list
    }

@api_router.get("/reports/collection-summary")
async def get_collection_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get collection summary for a date range"""
    if current_user["role"] not in ["super_admin", "school_admin", "finance_manager"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Default to current month
    if not start_date:
        today = datetime.now(timezone.utc)
        start_date = today.replace(day=1).strftime("%Y-%m-%d")
    if not end_date:
        end_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Get all paid payments
    payments = await db.fee_payments.find({
        "payment_status": "paid"
    }, {"_id": 0}).to_list(10000)
    
    # Filter by date range
    filtered_payments = []
    for p in payments:
        payment_date = p.get("payment_date", "")[:10]
        if start_date <= payment_date <= end_date:
            filtered_payments.append(p)
    
    # Group by date
    daily_totals = {}
    for p in filtered_payments:
        date = p.get("payment_date", "")[:10]
        if date not in daily_totals:
            daily_totals[date] = {"total": 0, "count": 0}
        daily_totals[date]["total"] += p.get("amount", 0)
        daily_totals[date]["count"] += 1
    
    # Calculate totals by payment mode
    mode_totals = {"cash": 0, "upi": 0, "bank_transfer": 0, "online": 0}
    for p in filtered_payments:
        mode = p.get("payment_mode", "cash")
        mode_totals[mode] = mode_totals.get(mode, 0) + p.get("amount", 0)
    
    return {
        "start_date": start_date,
        "end_date": end_date,
        "total_collection": sum(p.get("amount", 0) for p in filtered_payments),
        "transaction_count": len(filtered_payments),
        "by_payment_mode": mode_totals,
        "daily_breakdown": [
            {"date": date, **data}
            for date, data in sorted(daily_totals.items())
        ]
    }

# ==================== COMMUNICATION/ANNOUNCEMENTS MODULE ====================

class Announcement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    message: str
    target_roles: List[str] = []  # Empty means all
    target_classes: List[str] = []  # Empty means all
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

class AnnouncementCreateRequest(BaseModel):
    title: str
    message: str
    target_roles: List[str] = []
    target_classes: List[str] = []

@api_router.post("/announcements")
async def create_announcement(req: AnnouncementCreateRequest, current_user: dict = Depends(get_current_user)):
    """Create a new announcement and send notifications"""
    if current_user["role"] not in ["super_admin", "school_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    announcement_data = {
        "id": str(uuid.uuid4()),
        "title": req.title,
        "message": req.message,
        "target_roles": req.target_roles,
        "target_classes": req.target_classes,
        "created_by": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True
    }
    
    await db.announcements.insert_one(announcement_data)
    
    # Find target users and create notifications
    query = {"is_active": True}
    if req.target_roles:
        query["role"] = {"$in": req.target_roles}
    
    users = await db.users.find(query, {"_id": 0}).to_list(10000)
    
    # If targeting specific classes, filter parents
    if req.target_classes:
        # Get students in target classes
        students = await db.students.find({
            "current_class": {"$in": req.target_classes},
            "is_active": True
        }, {"_id": 0}).to_list(10000)
        parent_ids = {s.get("parent_id") for s in students}
        users = [u for u in users if u["role"] != "parent" or u["id"] in parent_ids]
    
    # Create notifications for all target users
    notifications = []
    for user in users:
        notifications.append({
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "title": req.title,
            "message": req.message,
            "announcement_id": announcement_data["id"],
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    if notifications:
        await db.notifications.insert_many(notifications)
    
    return {
        "success": True,
        "announcement_id": announcement_data["id"],
        "notifications_sent": len(notifications)
    }

@api_router.get("/announcements")
async def get_announcements(current_user: dict = Depends(get_current_user)):
    """Get all announcements (admin) or relevant announcements (other roles)"""
    if current_user["role"] in ["super_admin", "school_admin"]:
        announcements = await db.announcements.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    else:
        # Get announcements targeting this user's role or all
        announcements = await db.announcements.find({
            "$or": [
                {"target_roles": {"$size": 0}},
                {"target_roles": current_user["role"]}
            ],
            "is_active": True
        }, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    return announcements

@api_router.delete("/announcements/{announcement_id}")
async def delete_announcement(announcement_id: str, current_user: dict = Depends(get_current_user)):
    """Delete/deactivate an announcement"""
    if current_user["role"] not in ["super_admin", "school_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.announcements.update_one(
        {"id": announcement_id},
        {"$set": {"is_active": False}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    return {"success": True, "message": "Announcement deleted"}

@api_router.get("/notifications/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    """Get count of unread notifications"""
    count = await db.notifications.count_documents({
        "user_id": current_user["id"],
        "is_read": False
    })
    return {"unread_count": count}

@api_router.patch("/notifications/mark-all-read")
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    """Mark all notifications as read"""
    result = await db.notifications.update_many(
        {"user_id": current_user["id"], "is_read": False},
        {"$set": {"is_read": True}}
    )
    return {"success": True, "marked_count": result.modified_count}

# ==================== DOCUMENT UPLOAD MODULE ====================

class DocumentType(str, Enum):
    BIRTH_CERTIFICATE = "birth_certificate"
    AADHAAR_CARD = "aadhaar_card"
    PHOTO = "photo"
    TRANSFER_CERTIFICATE = "transfer_certificate"
    MEDICAL_CERTIFICATE = "medical_certificate"
    ADDRESS_PROOF = "address_proof"
    OTHER = "other"

class DocumentUploadRequest(BaseModel):
    application_id: str
    document_type: DocumentType
    document_name: str
    file_data: str  # Base64 encoded file
    file_type: str  # mime type

@api_router.post("/documents/upload-file")
async def upload_document_file(req: DocumentUploadRequest, current_user: dict = Depends(get_current_user)):
    """Upload a document file (base64 encoded)"""
    import base64
    
    # Validate file size (max 5MB)
    try:
        file_bytes = base64.b64decode(req.file_data)
        if len(file_bytes) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds 5MB limit")
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid file data")
    
    doc_data = {
        "id": str(uuid.uuid4()),
        "application_id": req.application_id,
        "document_type": req.document_type,
        "document_name": req.document_name,
        "file_data": req.file_data,
        "file_type": req.file_type,
        "status": "pending",
        "uploaded_by": current_user["id"],
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "verified_by": None,
        "verified_at": None
    }
    
    await db.documents.insert_one(doc_data)
    
    return {
        "success": True,
        "document_id": doc_data["id"],
        "message": "Document uploaded successfully"
    }

@api_router.get("/documents/application/{application_id}")
async def get_application_documents_v2(application_id: str, current_user: dict = Depends(get_current_user)):
    """Get all documents for an application"""
    documents = await db.documents.find(
        {"application_id": application_id},
        {"_id": 0, "file_data": 0}  # Exclude file_data for listing
    ).to_list(100)
    return documents

@api_router.get("/documents/download/{document_id}")
async def download_document(document_id: str, current_user: dict = Depends(get_current_user)):
    """Get document with file data for download"""
    document = await db.documents.find_one({"id": document_id}, {"_id": 0})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@api_router.patch("/documents/{document_id}/verify")
async def verify_document(document_id: str, status: str, current_user: dict = Depends(get_current_user)):
    """Verify or reject a document"""
    if current_user["role"] not in ["super_admin", "school_admin", "admission_officer"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if status not in ["verified", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.documents.update_one(
        {"id": document_id},
        {"$set": {
            "status": status,
            "verified_by": current_user["id"],
            "verified_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"success": True, "message": f"Document {status}"}

@api_router.delete("/documents/{document_id}")
async def delete_document(document_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a document"""
    result = await db.documents.delete_one({"id": document_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"success": True, "message": "Document deleted"}

# ==================== FEE REMINDERS ====================

@api_router.post("/notifications/fee-reminder")
async def send_fee_reminders(current_user: dict = Depends(get_current_user)):
    """Send fee reminders to parents with outstanding dues"""
    if current_user["role"] not in ["super_admin", "school_admin", "finance_manager"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get outstanding dues report
    students = await db.students.find({"is_active": True}, {"_id": 0}).to_list(10000)
    structures = await db.fee_structures.find({}, {"_id": 0}).to_list(100)
    structure_map = {s["standard"]: s for s in structures}
    
    reminders_sent = 0
    
    for student in students:
        structure = structure_map.get(student.get("current_class"))
        if not structure:
            continue
        
        total_fee = sum([
            structure.get("admission_fee", 0),
            structure.get("tuition_fee", 0),
            structure.get("books_fee", 0),
            structure.get("uniform_fee", 0),
            structure.get("transport_fee", 0)
        ])
        
        payments = await db.fee_payments.find({
            "student_id": student["id"],
            "payment_status": "paid"
        }, {"_id": 0}).to_list(1000)
        
        paid = sum(p.get("amount", 0) for p in payments)
        due = total_fee - paid
        
        if due > 0 and student.get("parent_id"):
            notification = {
                "id": str(uuid.uuid4()),
                "user_id": student["parent_id"],
                "title": "Fee Payment Reminder",
                "message": f"Dear Parent, a fee amount of ₹{due:,} is pending for {student['student_name']}. Please clear the dues at the earliest.",
                "is_read": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.notifications.insert_one(notification)
            reminders_sent += 1
    
    return {"success": True, "reminders_sent": reminders_sent}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    # Create default super admin if not exists
    admin_email = os.environ.get('ADMIN_EMAIL', 'shankarithangaraj01@gmail.com')
    existing_admin = await db.users.find_one({"email": admin_email})
    
    if not existing_admin:
        admin_data = {
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password("admin123"),
            "role": UserRole.SUPER_ADMIN.value,
            "full_name": "Super Admin",
            "mobile": "+91 7200825692",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_data)
        logger.info(f"Default admin created: {admin_email} / admin123")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()