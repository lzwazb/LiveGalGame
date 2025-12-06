from fastapi import FastAPI

from .routes.event_routes import router as event_router
from .routes.profile_routes import router as profile_router
from .routes.health import router as health_router
from .db import init_db


def create_app() -> FastAPI:
    app = FastAPI(title="Structured Memory Service", version="0.1.0")

    # 初始化数据库（建表）
    init_db()

    app.include_router(health_router)
    app.include_router(profile_router, prefix="")
    app.include_router(event_router, prefix="")

    return app


app = create_app()

