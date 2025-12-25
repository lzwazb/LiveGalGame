from fastapi import APIRouter

from ..db import DB_PATH


router = APIRouter()


@router.get("/health")
async def health():
    return {"status": "ok", "db": DB_PATH}

