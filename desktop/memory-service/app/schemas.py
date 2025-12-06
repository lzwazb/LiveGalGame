from typing import List, Optional

from pydantic import BaseModel, field_validator


class ProfileUpsert(BaseModel):
    user_id: str
    project_id: Optional[str] = None
    topic: str
    sub_topic: Optional[str] = None
    content: str
    tags: Optional[List[str]] = None
    mode: str = "append"  # add|update|append|replace

    @field_validator("mode")
    @classmethod
    def validate_mode(cls, v):
        allowed = {"add", "update", "append", "replace"}
        if v not in allowed:
            raise ValueError(f"mode must be one of {allowed}")
        return v


class EventCreate(BaseModel):
    user_id: str
    project_id: Optional[str] = None
    event_tip: str
    event_tags: Optional[List[str]] = None
    profile_delta: Optional[dict] = None
    timestamp: Optional[int] = None


class ProfileRead(BaseModel):
    id: str
    user_id: str
    project_id: Optional[str]
    topic: str
    sub_topic: Optional[str]
    content: str
    tags: Optional[List[str]]
    updated_at: int
    created_at: int


class EventRead(BaseModel):
    id: str
    user_id: str
    project_id: Optional[str]
    event_tip: str
    event_tags: Optional[List[str]]
    profile_delta: Optional[str]
    timestamp: int
    created_at: int

