from typing import List, Optional

from sqlmodel import Session, select

from ..models import Profile, now_ms


def list_to_csv(items: Optional[List[str]]) -> Optional[str]:
    if not items:
        return None
    return ",".join([i.strip() for i in items if i and i.strip()]) or None


def csv_to_list(text: Optional[str]) -> List[str]:
    if not text:
        return []
    return [i.strip() for i in text.split(",") if i.strip()]


def query_profiles(
    session: Session,
    *,
    user_id: str,
    project_id: Optional[str] = None,
    topics: Optional[List[str]] = None,
    sub_topics: Optional[List[str]] = None,
    tags: Optional[List[str]] = None,
    time_from: Optional[int] = None,
    time_to: Optional[int] = None,
    limit: int = 50,
):
    stmt = select(Profile)
    if user_id:
        stmt = stmt.where(Profile.user_id == user_id)
    if project_id:
        stmt = stmt.where(Profile.project_id == project_id)
    if topics:
        stmt = stmt.where(Profile.topic.in_(topics))
    if sub_topics:
        stmt = stmt.where(Profile.sub_topic.in_(sub_topics))
    if tags:
        for t in tags:
            stmt = stmt.where(Profile.tags.contains(t))
    if time_from:
        stmt = stmt.where(Profile.updated_at >= time_from)
    if time_to:
        stmt = stmt.where(Profile.updated_at <= time_to)
    stmt = stmt.order_by(Profile.updated_at.desc()).limit(limit)
    return session.exec(stmt).all()


def upsert_profile(session: Session, payload) -> Profile:
    stmt = (
        select(Profile)
        .where(Profile.user_id == payload.user_id)
        .where(Profile.topic == payload.topic)
        .where(Profile.sub_topic == payload.sub_topic)
    )
    if payload.project_id:
        stmt = stmt.where(Profile.project_id == payload.project_id)

    existing = session.exec(stmt).first()
    tags_csv = list_to_csv(payload.tags)

    if existing:
        if payload.mode == "add":
            new_profile = Profile(
                user_id=payload.user_id,
                project_id=payload.project_id,
                topic=payload.topic,
                sub_topic=payload.sub_topic,
                content=payload.content,
                tags=tags_csv,
            )
            session.add(new_profile)
            session.commit()
            session.refresh(new_profile)
            return new_profile

        if payload.mode in {"update", "replace"}:
            existing.content = payload.content
        elif payload.mode == "append":
            sep = "; " if existing.content else ""
            existing.content = f"{existing.content}{sep}{payload.content}" if existing.content else payload.content

        if tags_csv:
            existing.tags = tags_csv
        existing.updated_at = now_ms()
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing

    new_profile = Profile(
        user_id=payload.user_id,
        project_id=payload.project_id,
        topic=payload.topic,
        sub_topic=payload.sub_topic,
        content=payload.content,
        tags=tags_csv,
    )
    session.add(new_profile)
    session.commit()
    session.refresh(new_profile)
    return new_profile
