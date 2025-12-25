from typing import List, Optional

from sqlmodel import Session, select

from ..models import Event
from .profiles import list_to_csv


def csv_to_list(text: Optional[str]) -> List[str]:
    if not text:
        return []
    return [i.strip() for i in text.split(",") if i.strip()]


def query_events(
    session: Session,
    *,
    user_id: str,
    project_id: Optional[str] = None,
    topics: Optional[List[str]] = None,
    tags: Optional[List[str]] = None,
    time_from: Optional[int] = None,
    time_to: Optional[int] = None,
    limit: int = 50,
):
    stmt = select(Event)
    if user_id:
        stmt = stmt.where(Event.user_id == user_id)
    if project_id:
        stmt = stmt.where(Event.project_id == project_id)
    if topics:
        for t in topics:
            stmt = stmt.where(Event.profile_delta.contains(t))
    if tags:
        for t in tags:
            stmt = stmt.where(Event.event_tags.contains(t))
    if time_from:
        stmt = stmt.where(Event.timestamp >= time_from)
    if time_to:
        stmt = stmt.where(Event.timestamp <= time_to)
    stmt = stmt.order_by(Event.timestamp.desc()).limit(limit)
    return session.exec(stmt).all()


def create_event(session: Session, payload, now_ms_fn) -> Event:
    event = Event(
        user_id=payload.user_id,
        project_id=payload.project_id,
        event_tip=payload.event_tip,
        event_tags=list_to_csv(payload.event_tags),
        profile_delta=(payload.profile_delta and str(payload.profile_delta)) or None,
        timestamp=payload.timestamp or now_ms_fn(),
    )
    session.add(event)
    session.commit()
    session.refresh(event)
    return event
