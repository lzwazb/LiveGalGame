import time
import uuid
from typing import Optional

from sqlmodel import Field, SQLModel


def now_ms() -> int:
    return int(time.time() * 1000)


class Profile(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(index=True)
    project_id: Optional[str] = Field(default=None, index=True)
    topic: str = Field(index=True)
    sub_topic: Optional[str] = Field(default=None, index=True)
    content: str
    tags: Optional[str] = Field(default=None, index=True)  # comma-separated
    updated_at: int = Field(default_factory=now_ms, index=True)
    created_at: int = Field(default_factory=now_ms)


class Event(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(index=True)
    project_id: Optional[str] = Field(default=None, index=True)
    event_tip: str
    event_tags: Optional[str] = Field(default=None, index=True)  # comma-separated
    profile_delta: Optional[str] = None  # JSON string
    timestamp: int = Field(default_factory=now_ms, index=True)
    created_at: int = Field(default_factory=now_ms)

