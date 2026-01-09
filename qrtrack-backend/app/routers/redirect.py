from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from app.database import get_db
from datetime import datetime

router = APIRouter(tags=["redirect"])

def detect_device_type(user_agent: str) -> str:
    ua_lower = user_agent.lower() if user_agent else ""
    if "mobile" in ua_lower or "android" in ua_lower or "iphone" in ua_lower:
        return "mobile"
    elif "tablet" in ua_lower or "ipad" in ua_lower:
        return "tablet"
    return "desktop"

@router.get("/r/{short_code}")
async def redirect_qr(short_code: str, request: Request):
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT id, target_url FROM qrcodes WHERE short_code = ?",
            (short_code,)
        )
        qr = await cursor.fetchone()
        
        if not qr:
            return RedirectResponse(url="https://qrtrack.app/not-found", status_code=302)
        
        client_ip = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent", "")
        device_type = detect_device_type(user_agent)
        
        country = None
        city = None
        
        await db.execute(
            """INSERT INTO scans (qr_id, ip_address, user_agent, country, city, device_type)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (qr["id"], client_ip, user_agent, country, city, device_type)
        )
        await db.commit()
        
        return RedirectResponse(url=qr["target_url"], status_code=302)
