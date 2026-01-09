from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    subscription_status: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class QRCodeCreate(BaseModel):
    name: str
    target_url: str
    color: Optional[str] = "#000000"
    bg_color: Optional[str] = "#FFFFFF"

class QRCodeResponse(BaseModel):
    id: int
    name: str
    target_url: str
    short_code: str
    color: str
    bg_color: str
    created_at: datetime
    scan_count: int = 0

class QRCodeDetail(QRCodeResponse):
    scans: list = []

class ScanData(BaseModel):
    id: int
    ip_address: Optional[str]
    country: Optional[str]
    city: Optional[str]
    device_type: Optional[str]
    scanned_at: datetime

class AnalyticsResponse(BaseModel):
    total_scans: int
    scans_today: int
    scans_this_week: int
    scans_this_month: int
    top_countries: list
    top_devices: list
    scans_by_day: list

class CheckoutResponse(BaseModel):
    checkout_url: str

class PortalResponse(BaseModel):
    portal_url: str
