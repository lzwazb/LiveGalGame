from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from ..crud import profiles as profile_crud
from ..db import get_session
from ..schemas import ProfileRead, ProfileUpsert


router = APIRouter()


@router.get("/profiles", response_model=List[ProfileRead])
async def query_profiles(
    user_id: str = Query(..., description="User ID"),
    project_id: Optional[str] = Query(None),
    topic: Optional[List[str]] = Query(None),
    sub_topic: Optional[List[str]] = Query(None),
    tag: Optional[List[str]] = Query(None),
    time_from: Optional[int] = Query(None),
    time_to: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    session: Session = Depends(get_session),
):
    rows = profile_crud.query_profiles(
        session,
        user_id=user_id,
        project_id=project_id,
        topics=topic,
        sub_topics=sub_topic,
        tags=tag,
        time_from=time_from,
        time_to=time_to,
        limit=limit,
    )
    return [
        ProfileRead(
            id=p.id,
            user_id=p.user_id,
            project_id=p.project_id,
            topic=p.topic,
            sub_topic=p.sub_topic,
            content=p.content,
            tags=profile_crud.csv_to_list(p.tags),
            updated_at=p.updated_at,
            created_at=p.created_at,
        )
        for p in rows
    ]


@router.post("/profiles", response_model=ProfileRead)
async def upsert_profile(payload: ProfileUpsert, session: Session = Depends(get_session)):
    p = profile_crud.upsert_profile(session, payload)
    return ProfileRead(
        id=p.id,
        user_id=p.user_id,
        project_id=p.project_id,
        topic=p.topic,
        sub_topic=p.sub_topic,
        content=p.content,
        tags=profile_crud.csv_to_list(p.tags),
        updated_at=p.updated_at,
        created_at=p.created_at,
    )

