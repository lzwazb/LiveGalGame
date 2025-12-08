from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from ..crud import events as event_crud
from ..db import get_session
from ..models import now_ms
from ..schemas import EventCreate, EventRead


router = APIRouter()


@router.get("/events", response_model=List[EventRead])
async def query_events(
    user_id: str = Query(...),
    project_id: Optional[str] = Query(None),
    topic: Optional[List[str]] = Query(None),
    tag: Optional[List[str]] = Query(None),
    time_from: Optional[int] = Query(None),
    time_to: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    session: Session = Depends(get_session),
):
    rows = event_crud.query_events(
        session,
        user_id=user_id,
        project_id=project_id,
        topics=topic,
        tags=tag,
        time_from=time_from,
        time_to=time_to,
        limit=limit,
    )
    return [
        EventRead(
            id=e.id,
            user_id=e.user_id,
            project_id=e.project_id,
            event_tip=e.event_tip,
            event_tags=event_crud.csv_to_list(e.event_tags),
            profile_delta=e.profile_delta,
            timestamp=e.timestamp,
            created_at=e.created_at,
        )
        for e in rows
    ]


@router.post("/events", response_model=EventRead)
async def create_event(payload: EventCreate, session: Session = Depends(get_session)):
    e = event_crud.create_event(session, payload, now_ms_fn=now_ms)
    return EventRead(
        id=e.id,
        user_id=e.user_id,
        project_id=e.project_id,
        event_tip=e.event_tip,
        event_tags=event_crud.csv_to_list(e.event_tags),
        profile_delta=e.profile_delta,
        timestamp=e.timestamp,
        created_at=e.created_at,
    )
