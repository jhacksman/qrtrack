from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas import UserCreate, UserLogin, UserResponse, Token
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user_id
from app.database import get_db
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=Token)
async def register(user: UserCreate):
    async with get_db() as db:
        cursor = await db.execute("SELECT id FROM users WHERE email = ?", (user.email,))
        existing = await cursor.fetchone()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        password_hash = get_password_hash(user.password)
        cursor = await db.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
            (user.email, password_hash)
        )
        await db.commit()
        user_id = cursor.lastrowid
        
        access_token = create_access_token(data={"sub": str(user_id)})
        return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT id, password_hash FROM users WHERE email = ?",
            (user.email,)
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        if not verify_password(user.password, row["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        access_token = create_access_token(data={"sub": str(row["id"])})
        return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_me(user_id: int = Depends(get_current_user_id)):
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT id, email, subscription_status, created_at FROM users WHERE id = ?",
            (user_id,)
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return UserResponse(
            id=row["id"],
            email=row["email"],
            subscription_status=row["subscription_status"],
            created_at=datetime.fromisoformat(row["created_at"]) if isinstance(row["created_at"], str) else row["created_at"]
        )
