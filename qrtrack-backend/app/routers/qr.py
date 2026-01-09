from fastapi import APIRouter, HTTPException, status, Depends, Response
from fastapi.responses import RedirectResponse
from app.schemas import QRCodeCreate, QRCodeResponse, QRCodeDetail, AnalyticsResponse
from app.auth import get_current_user_id
from app.database import get_db
from datetime import datetime, timedelta
import qrcode
import qrcode.image.svg
from io import BytesIO
import secrets
import base64

router = APIRouter(prefix="/qr", tags=["qr"])

FREE_QR_LIMIT = 5

def generate_short_code() -> str:
    return secrets.token_urlsafe(6)

def detect_device_type(user_agent: str) -> str:
    ua_lower = user_agent.lower() if user_agent else ""
    if "mobile" in ua_lower or "android" in ua_lower or "iphone" in ua_lower:
        return "mobile"
    elif "tablet" in ua_lower or "ipad" in ua_lower:
        return "tablet"
    return "desktop"

@router.post("/create", response_model=QRCodeResponse)
async def create_qr(qr_data: QRCodeCreate, user_id: int = Depends(get_current_user_id)):
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT subscription_status FROM users WHERE id = ?",
            (user_id,)
        )
        user = await cursor.fetchone()
        
        if user["subscription_status"] == "free":
            cursor = await db.execute(
                "SELECT COUNT(*) as count FROM qrcodes WHERE user_id = ?",
                (user_id,)
            )
            count_row = await cursor.fetchone()
            if count_row["count"] >= FREE_QR_LIMIT:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Free tier limited to {FREE_QR_LIMIT} QR codes. Upgrade to Pro for unlimited."
                )
        
        short_code = generate_short_code()
        cursor = await db.execute(
            """INSERT INTO qrcodes (user_id, name, target_url, short_code, color, bg_color)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (user_id, qr_data.name, qr_data.target_url, short_code, qr_data.color, qr_data.bg_color)
        )
        await db.commit()
        qr_id = cursor.lastrowid
        
        return QRCodeResponse(
            id=qr_id,
            name=qr_data.name,
            target_url=qr_data.target_url,
            short_code=short_code,
            color=qr_data.color or "#000000",
            bg_color=qr_data.bg_color or "#FFFFFF",
            created_at=datetime.utcnow(),
            scan_count=0
        )

@router.get("/list", response_model=list[QRCodeResponse])
async def list_qrs(user_id: int = Depends(get_current_user_id)):
    async with get_db() as db:
        cursor = await db.execute(
            """SELECT q.*, COUNT(s.id) as scan_count 
               FROM qrcodes q 
               LEFT JOIN scans s ON q.id = s.qr_id 
               WHERE q.user_id = ? 
               GROUP BY q.id
               ORDER BY q.created_at DESC""",
            (user_id,)
        )
        rows = await cursor.fetchall()
        
        return [
            QRCodeResponse(
                id=row["id"],
                name=row["name"],
                target_url=row["target_url"],
                short_code=row["short_code"],
                color=row["color"],
                bg_color=row["bg_color"],
                created_at=datetime.fromisoformat(row["created_at"]) if isinstance(row["created_at"], str) else row["created_at"],
                scan_count=row["scan_count"]
            )
            for row in rows
        ]

@router.get("/{qr_id}", response_model=QRCodeDetail)
async def get_qr(qr_id: int, user_id: int = Depends(get_current_user_id)):
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT * FROM qrcodes WHERE id = ? AND user_id = ?",
            (qr_id, user_id)
        )
        qr = await cursor.fetchone()
        if not qr:
            raise HTTPException(status_code=404, detail="QR code not found")
        
        cursor = await db.execute(
            "SELECT * FROM scans WHERE qr_id = ? ORDER BY scanned_at DESC LIMIT 100",
            (qr_id,)
        )
        scans = await cursor.fetchall()
        
        cursor = await db.execute(
            "SELECT COUNT(*) as count FROM scans WHERE qr_id = ?",
            (qr_id,)
        )
        count_row = await cursor.fetchone()
        
        return QRCodeDetail(
            id=qr["id"],
            name=qr["name"],
            target_url=qr["target_url"],
            short_code=qr["short_code"],
            color=qr["color"],
            bg_color=qr["bg_color"],
            created_at=datetime.fromisoformat(qr["created_at"]) if isinstance(qr["created_at"], str) else qr["created_at"],
            scan_count=count_row["count"],
            scans=[
                {
                    "id": s["id"],
                    "ip_address": s["ip_address"],
                    "country": s["country"],
                    "city": s["city"],
                    "device_type": s["device_type"],
                    "scanned_at": s["scanned_at"]
                }
                for s in scans
            ]
        )

@router.get("/{qr_id}/analytics", response_model=AnalyticsResponse)
async def get_analytics(qr_id: int, user_id: int = Depends(get_current_user_id)):
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT subscription_status FROM users WHERE id = ?",
            (user_id,)
        )
        user = await cursor.fetchone()
        
        cursor = await db.execute(
            "SELECT * FROM qrcodes WHERE id = ? AND user_id = ?",
            (qr_id, user_id)
        )
        qr = await cursor.fetchone()
        if not qr:
            raise HTTPException(status_code=404, detail="QR code not found")
        
        now = datetime.utcnow()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        cursor = await db.execute("SELECT COUNT(*) as count FROM scans WHERE qr_id = ?", (qr_id,))
        total = (await cursor.fetchone())["count"]
        
        cursor = await db.execute(
            "SELECT COUNT(*) as count FROM scans WHERE qr_id = ? AND scanned_at >= ?",
            (qr_id, today.isoformat())
        )
        today_count = (await cursor.fetchone())["count"]
        
        cursor = await db.execute(
            "SELECT COUNT(*) as count FROM scans WHERE qr_id = ? AND scanned_at >= ?",
            (qr_id, week_ago.isoformat())
        )
        week_count = (await cursor.fetchone())["count"]
        
        cursor = await db.execute(
            "SELECT COUNT(*) as count FROM scans WHERE qr_id = ? AND scanned_at >= ?",
            (qr_id, month_ago.isoformat())
        )
        month_count = (await cursor.fetchone())["count"]
        
        if user["subscription_status"] != "pro":
            return AnalyticsResponse(
                total_scans=total,
                scans_today=today_count,
                scans_this_week=week_count,
                scans_this_month=month_count,
                top_countries=[],
                top_devices=[],
                scans_by_day=[]
            )
        
        cursor = await db.execute(
            """SELECT country, COUNT(*) as count FROM scans 
               WHERE qr_id = ? AND country IS NOT NULL 
               GROUP BY country ORDER BY count DESC LIMIT 5""",
            (qr_id,)
        )
        countries = [{"country": r["country"], "count": r["count"]} for r in await cursor.fetchall()]
        
        cursor = await db.execute(
            """SELECT device_type, COUNT(*) as count FROM scans 
               WHERE qr_id = ? AND device_type IS NOT NULL 
               GROUP BY device_type ORDER BY count DESC""",
            (qr_id,)
        )
        devices = [{"device": r["device_type"], "count": r["count"]} for r in await cursor.fetchall()]
        
        cursor = await db.execute(
            """SELECT DATE(scanned_at) as date, COUNT(*) as count FROM scans 
               WHERE qr_id = ? AND scanned_at >= ? 
               GROUP BY DATE(scanned_at) ORDER BY date""",
            (qr_id, month_ago.isoformat())
        )
        by_day = [{"date": r["date"], "count": r["count"]} for r in await cursor.fetchall()]
        
        return AnalyticsResponse(
            total_scans=total,
            scans_today=today_count,
            scans_this_week=week_count,
            scans_this_month=month_count,
            top_countries=countries,
            top_devices=devices,
            scans_by_day=by_day
        )

@router.delete("/{qr_id}")
async def delete_qr(qr_id: int, user_id: int = Depends(get_current_user_id)):
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT id FROM qrcodes WHERE id = ? AND user_id = ?",
            (qr_id, user_id)
        )
        qr = await cursor.fetchone()
        if not qr:
            raise HTTPException(status_code=404, detail="QR code not found")
        
        await db.execute("DELETE FROM scans WHERE qr_id = ?", (qr_id,))
        await db.execute("DELETE FROM qrcodes WHERE id = ?", (qr_id,))
        await db.commit()
        
        return {"message": "QR code deleted"}

@router.get("/{qr_id}/image")
async def get_qr_image(qr_id: int, user_id: int = Depends(get_current_user_id)):
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT q.*, u.subscription_status FROM qrcodes q JOIN users u ON q.user_id = u.id WHERE q.id = ? AND q.user_id = ?",
            (qr_id, user_id)
        )
        qr = await cursor.fetchone()
        if not qr:
            raise HTTPException(status_code=404, detail="QR code not found")
        
        import os
        base_url = os.environ.get("BASE_URL", "http://localhost:8000")
        redirect_url = f"{base_url}/r/{qr['short_code']}"
        
        qr_img = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr_img.add_data(redirect_url)
        qr_img.make(fit=True)
        
        img = qr_img.make_image(fill_color=qr["color"], back_color=qr["bg_color"])
        
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        
        return Response(content=buffer.getvalue(), media_type="image/png")
