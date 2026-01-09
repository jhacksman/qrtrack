import aiosqlite
import os
from contextlib import asynccontextmanager

DATABASE_PATH = os.environ.get("DATABASE_PATH", "/data/app.db")

if not os.path.exists(os.path.dirname(DATABASE_PATH)) and DATABASE_PATH.startswith("/data"):
    DATABASE_PATH = "./app.db"

async def init_db():
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                stripe_customer_id TEXT,
                subscription_status TEXT DEFAULT 'free',
                subscription_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS qrcodes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                target_url TEXT NOT NULL,
                short_code TEXT UNIQUE NOT NULL,
                color TEXT DEFAULT '#000000',
                bg_color TEXT DEFAULT '#FFFFFF',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS scans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                qr_id INTEGER NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                country TEXT,
                city TEXT,
                device_type TEXT,
                scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (qr_id) REFERENCES qrcodes (id)
            )
        """)
        await db.execute("CREATE INDEX IF NOT EXISTS idx_qrcodes_user_id ON qrcodes(user_id)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_qrcodes_short_code ON qrcodes(short_code)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_scans_qr_id ON scans(qr_id)")
        await db.commit()

@asynccontextmanager
async def get_db():
    db = await aiosqlite.connect(DATABASE_PATH)
    db.row_factory = aiosqlite.Row
    try:
        yield db
    finally:
        await db.close()
